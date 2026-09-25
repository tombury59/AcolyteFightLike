import type { Player, PlayerInput, Projectile, WorldState } from './types';
import { normalize, sub, len, dist } from './vec';
import { resolvePlayerCollisions } from './physics';
import { applyDamage } from './combat';
import { CONFIG } from './config';
import { SPELLS, PROJECTILE_BEHAVIORS } from './spells/definitions';

/**
 * Fait avancer le monde d'un pas de temps fixe `dt`.
 *
 * Le moteur ne connaît AUCUN sort : il gère la physique générique (déplacement,
 * collisions, recul, arène) et délègue les effets au registre des sorts.
 */
export function step(world: WorldState, inputs: Map<string, PlayerInput>, dt: number): void {
  world.tick++;
  world.time += dt;

  // Joueurs actuellement accrochés par un grappin : ils sont traînés (pas de
  // déplacement propre), c'est le lien qui les balance.
  const grabbed = new Set<string>();
  for (const p of world.players) {
    if (p.grapple && p.grapple.phase === 'linked' && p.grapple.targetId) {
      grabbed.add(p.grapple.targetId);
    }
  }

  // 1. Déplacement + visée + sorts pour chaque joueur.
  for (const p of world.players) {
    if (!p.alive) continue;
    tickCooldowns(p, dt);
    if (p.shieldTime > 0) p.shieldTime = Math.max(0, p.shieldTime - dt);
    if (p.frozenTime > 0) p.frozenTime = Math.max(0, p.frozenTime - dt);
    if (p.slowTime > 0) p.slowTime = Math.max(0, p.slowTime - dt);
    if (p.rootTime > 0) p.rootTime = Math.max(0, p.rootTime - dt);

    const input = inputs.get(p.id);
    if (input) {
      p.aimPoint = input.aim;
      p.grappleHeld = input.castSpells.includes('grapple');
      const toAim = sub(input.aim, p.pos);
      const d = len(toAim);
      const dir = normalize(toAim);

      // Éjecté (fort recul) : l'élan l'emporte, il ne contrôle plus son déplacement.
      const flung = Math.hypot(p.knockback.x, p.knockback.y) > CONFIG.player.ejectControlLoss;
      // Le personnage se dirige vers le curseur, avec une zone morte anti-jitter.
      // Immobilisé (laser), accroché par un grappin, ou éjecté : pas de déplacement propre.
      if (p.frozenTime <= 0 && !grabbed.has(p.id) && !flung && input.follow && d > CONFIG.player.followStopDist) {
        const spd = p.slowTime > 0 ? p.speed * 0.5 : p.speed; // ralentissement (tourbillon)
        p.vel.x = dir.x * spd;
        p.vel.y = dir.y * spd;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }

      if (dir.x !== 0 || dir.y !== 0) p.facing = dir;

      // Éjecté : emporté par l'élan, il ne peut pas non plus se rattraper au sort
      // (sinon un bot dasherait vers le centre pour annuler son éjection).
      if (!flung) {
        for (const spellId of input.castSpells) tryCast(world, p, spellId);
      }
    } else {
      p.grappleHeld = false;
      p.vel.x = 0;
      p.vel.y = 0;
    }

    // Déplacement = contrôle du joueur + recul en cours (qui s'amortit).
    p.pos.x += (p.vel.x + p.knockback.x) * dt;
    p.pos.y += (p.vel.y + p.knockback.y) * dt;
    // Amortissement doux tant que le joueur glisse (grappin/lancer), sinon normal.
    const decay = p.slideTime > 0 ? CONFIG.player.slideDecay : CONFIG.player.knockbackDecay;
    p.knockback.x *= decay;
    p.knockback.y *= decay;
    if (p.slideTime > 0) p.slideTime = Math.max(0, p.slideTime - dt);
  }

  // 2. Grappins actifs : laisse la cible attachée puis l'éjecte à la fin.
  updateGrapples(world, dt);
  updatePulls(world, dt);

  // 3. Collisions entre joueurs, puis poussée des charges (dash).
  resolvePlayerCollisions(world.players);
  updateDashCharges(world, dt);

  // 4. Boucliers : renvoient les projectiles ennemis arrivant de face.
  updateShields(world);

  // 5. Projectiles : chaque projectile est mis à jour par SON comportement.
  updateProjectiles(world, dt);

  // 6. Rétrécissement de l'arène (sauf en mode démo).
  if (world.arenaShrinks && world.time > CONFIG.arena.shrinkDelay) {
    world.arenaRadius = Math.max(
      CONFIG.arena.minRadius,
      world.arenaRadius - CONFIG.arena.shrinkRate * dt,
    );
  }

  // 7. Dégâts hors de l'arène + mort.
  for (const p of world.players) {
    if (!p.alive) continue;
    const outside = dist(p.pos, world.arenaCenter) + p.radius > world.arenaRadius;
    if (outside) applyDamage(p, CONFIG.player.outOfBoundsDps * dt);
  }
}

// --- Physique du lien de grappin (portée de linkForce d'Acolyte Fight) ---
const GRAPPLE_MIN_DIST = 45; // en deçà : plus de traction (comme minDistance)
const GRAPPLE_MAX_DIST = 150; // bande de laisse ; au-delà, traction pleine
const GRAPPLE_RADIAL_RATE = 2200; // force radiale (ressort) à pleine extension
const GRAPPLE_SELF_FACTOR = 0.2; // le lanceur est peu tiré (il reste ancré)
const GRAPPLE_TARGET_FACTOR = 1.0; // la cible est tirée à fond
const GRAPPLE_SIDEWAYS_RATE = 2800; // poussée latérale (le balancement au curseur)

/**
 * Lien de grappin actif (phase `linked`). Reproduit `linkForce` d'Acolyte Fight :
 *  - un ressort radial rapproche mutuellement lanceur et cible (nul sous MIN) ;
 *  - une poussée latérale, dirigée par le curseur du lanceur, fait tournoyer la
 *    cible autour de lui (pendule).
 * Aucune éjection scriptée : quand le bouton est relâché (ou au bout du temps),
 * le lien se coupe et l'élan tangentiel accumulé projette la cible.
 * (La phase `flying` du crochet est gérée par le comportement `grappleHook`.)
 */
function updateGrapples(world: WorldState, dt: number): void {
  for (const p of world.players) {
    const g = p.grapple;
    if (!g || g.phase !== 'linked') continue;

    // Bouton relâché ou lanceur mort -> on coupe : l'élan projette la cible.
    if (!p.alive || !p.grappleHeld) {
      p.grapple = null;
      continue;
    }
    const target = world.players.find((x) => x.id === g.targetId);
    if (!target || !target.alive) {
      p.grapple = null;
      continue;
    }
    g.time -= dt;
    if (g.time <= 0) {
      p.grapple = null;
      continue;
    }

    // La victime glisse : elle conserve son élan (amortissement doux).
    target.slideTime = 0.6;

    const ox = target.pos.x - p.pos.x;
    const oy = target.pos.y - p.pos.y;
    const d = Math.hypot(ox, oy) || 1;
    const nx = ox / d;
    const ny = oy / d;

    // Ressort radial : nul sous MIN, croît linéairement au-delà.
    const f =
      (GRAPPLE_RADIAL_RATE * Math.max(0, d - GRAPPLE_MIN_DIST)) /
      (GRAPPLE_MAX_DIST - GRAPPLE_MIN_DIST) *
      dt;
    if (f > 0) {
      p.knockback.x += nx * GRAPPLE_SELF_FACTOR * f;
      p.knockback.y += ny * GRAPPLE_SELF_FACTOR * f;
      target.knockback.x -= nx * GRAPPLE_TARGET_FACTOR * f;
      target.knockback.y -= ny * GRAPPLE_TARGET_FACTOR * f;
    }

    // Poussée latérale vers le curseur -> le balancement.
    const rx = ny;
    const ry = -nx; // perpendiculaire au lien
    const cx = p.aimPoint.x - target.pos.x;
    const cy = p.aimPoint.y - target.pos.y;
    const cl = Math.hypot(cx, cy);
    if (cl > 1) {
      const mag = (rx * cx + ry * cy) / cl; // cos de l'angle, dans [-1, 1]
      const s = GRAPPLE_SIDEWAYS_RATE * mag * dt;
      target.knockback.x += rx * s;
      target.knockback.y += ry * s;
    }
  }
}

/** Charge (dash) : un joueur en pleine ruée projette violemment les ennemis heurtés. */
const CHARGE_PUSH = 220;
function updateDashCharges(world: WorldState, dt: number): void {
  for (const p of world.players) {
    if (p.chargeTime <= 0) {
      // Fin de charge : on remet à zéro les dégâts et la liste des cibles touchées.
      if (p.chargeDamage !== 0) p.chargeDamage = 0;
      if (p.chargeHits.length) p.chargeHits.length = 0;
      continue;
    }
    p.chargeTime = Math.max(0, p.chargeTime - dt);
    // Direction de la ruée = sens du recul en cours, sinon la visée.
    let dx = p.knockback.x;
    let dy = p.knockback.y;
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    } else {
      dx = p.facing.x;
      dy = p.facing.y;
    }
    for (const e of world.players) {
      if (!e.alive || e.id === p.id) continue;
      if (dist(p.pos, e.pos) <= p.radius + e.radius + 4) {
        e.knockback.x = dx * CHARGE_PUSH;
        e.knockback.y = dy * CHARGE_PUSH;
        e.slideTime = 0.5; // l'élan porte la cible (elle ne marche pas contre)
        // Ruée offensive : blesse chaque ennemi traversé une seule fois.
        if (p.chargeDamage > 0 && !p.chargeHits.includes(e.id)) {
          applyDamage(e, p.chargeDamage);
          p.chargeHits.push(e.id);
        }
      }
    }
  }
}

// --- Lien (attire la cible vers le lanceur) ---
const PULL_RATE = 1000; // force d'attraction vers le lanceur (amène au contact sans surtir)

/**
 * Lien actif : attire la cible vers le lanceur tant que le lien dure. Fidèle à
 * « Link » d'Acolyte Fight (traction pure vers soi, contrairement au grappin qui
 * fait tournoyer). La cible est traînée : son déplacement propre est neutralisé
 * ailleurs (via `pull` -> voir la boucle de déplacement).
 */
function updatePulls(world: WorldState, dt: number): void {
  for (const p of world.players) {
    const link = p.pull;
    if (!link) continue;
    if (!p.alive) {
      p.pull = null;
      continue;
    }
    const target = world.players.find((x) => x.id === link.targetId);
    if (!target || !target.alive) {
      p.pull = null;
      continue;
    }
    link.time -= dt;
    if (link.time <= 0) {
      p.pull = null;
      continue;
    }
    const dx = p.pos.x - target.pos.x;
    const dy = p.pos.y - target.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > p.radius + target.radius + 6) {
      target.knockback.x += (dx / d) * PULL_RATE * dt;
      target.knockback.y += (dy / d) * PULL_RATE * dt;
      target.slideTime = 0.2; // conserve l'élan de traction
    }
  }
}

// --- Bouclier « Reflect » (renvoi frontal des projectiles) ---
const REFLECT_MARGIN = 22; // épaisseur de la bande d'accroche du bouclier
const REFLECT_COS_HALF = 0.15; // arc frontal ~162° (cos 81°)

/**
 * Bouclier fidèle à Acolyte Fight : renvoie les projectiles ennemis « réfléchissables »
 * qui arrivent DE FACE. Le projectile repart en sens inverse et change de camp
 * (il appartient désormais au porteur du bouclier). Sans effet sur les faisceaux
 * (AoE) et les projectiles non marqués `reflectable`.
 */
function updateShields(world: WorldState): void {
  for (const s of world.players) {
    if (!s.alive || s.shieldTime <= 0) continue;
    for (const proj of world.projectiles) {
      if (proj.dead || proj.ownerId === s.id || !proj.params.reflectable) continue;
      const dx = proj.pos.x - s.pos.x;
      const dy = proj.pos.y - s.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > s.radius + proj.radius + REFLECT_MARGIN) continue;
      const nx = dx / d;
      const ny = dy / d;
      // Doit venir de face (dans l'arc frontal orienté vers la visée).
      if (nx * s.facing.x + ny * s.facing.y < REFLECT_COS_HALF) continue;
      // Renvoi : inverse la vitesse, réattribue le projectile au porteur.
      proj.vel.x = -proj.vel.x;
      proj.vel.y = -proj.vel.y;
      proj.ownerId = s.id;
      // Le pousse juste devant le bouclier pour éviter un re-contact immédiat.
      proj.pos.x = s.pos.x + nx * (s.radius + proj.radius + 2);
      proj.pos.y = s.pos.y + ny * (s.radius + proj.radius + 2);
    }
  }
}

function tickCooldowns(p: Player, dt: number): void {
  for (const id in p.cooldowns) {
    if (p.cooldowns[id] > 0) p.cooldowns[id] = Math.max(0, p.cooldowns[id] - dt);
  }
}

/** Lance un sort par son id : gestion générique du cooldown, effet délégué au sort. */
function tryCast(world: WorldState, caster: Player, spellId: string): void {
  const spell = SPELLS[spellId];
  if (!spell) return;
  if (caster.frozenTime > 0) return; // immobilisé / réduit au silence (Ensnare, faisceau)
  if ((caster.cooldowns[spellId] ?? 0) > 0) return;

  spell.cast(world, caster);
  caster.cooldowns[spellId] = spell.cooldown;
}

/** Met à jour chaque projectile via son comportement, puis retire les morts. */
function updateProjectiles(world: WorldState, dt: number): void {
  const survivors: Projectile[] = [];
  for (const proj of world.projectiles) {
    const behavior = PROJECTILE_BEHAVIORS[proj.behavior];
    if (behavior) behavior.update(world, proj, dt);
    else proj.dead = true; // comportement inconnu -> on le retire
    if (!proj.dead && proj.life > 0) survivors.push(proj);
  }
  world.projectiles = survivors;
}
