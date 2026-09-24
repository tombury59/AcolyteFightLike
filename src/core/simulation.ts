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

  // 1. Déplacement + visée + sorts pour chaque joueur.
  for (const p of world.players) {
    if (!p.alive) continue;
    tickCooldowns(p, dt);
    if (p.shieldTime > 0) p.shieldTime = Math.max(0, p.shieldTime - dt);
    if (p.frozenTime > 0) p.frozenTime = Math.max(0, p.frozenTime - dt);

    const input = inputs.get(p.id);
    if (input) {
      const toAim = sub(input.aim, p.pos);
      const d = len(toAim);
      const dir = normalize(toAim);

      // Le personnage se dirige vers le curseur, avec une zone morte anti-jitter.
      // Immobilisé (ex. pendant le laser) : pas de déplacement, mais la visée reste libre.
      if (p.frozenTime <= 0 && input.follow && d > CONFIG.player.followStopDist) {
        p.vel.x = dir.x * p.speed;
        p.vel.y = dir.y * p.speed;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }

      if (dir.x !== 0 || dir.y !== 0) p.facing = dir;

      for (const spellId of input.castSpells) tryCast(world, p, spellId);
    } else {
      p.vel.x = 0;
      p.vel.y = 0;
    }

    // Déplacement = contrôle du joueur + recul en cours (qui s'amortit).
    p.pos.x += (p.vel.x + p.knockback.x) * dt;
    p.pos.y += (p.vel.y + p.knockback.y) * dt;
    p.knockback.x *= CONFIG.player.knockbackDecay;
    p.knockback.y *= CONFIG.player.knockbackDecay;
  }

  // 2. Grappins actifs : laisse la cible attachée puis l'éjecte à la fin.
  updateGrapples(world, dt);

  // 3. Collisions entre joueurs, puis poussée des charges (dash).
  resolvePlayerCollisions(world.players);
  updateDashCharges(world, dt);

  // 4. Projectiles : chaque projectile est mis à jour par SON comportement.
  updateProjectiles(world, dt);

  // 5. Rétrécissement de l'arène (sauf en mode démo).
  if (world.arenaShrinks && world.time > CONFIG.arena.shrinkDelay) {
    world.arenaRadius = Math.max(
      CONFIG.arena.minRadius,
      world.arenaRadius - CONFIG.arena.shrinkRate * dt,
    );
  }

  // 6. Dégâts hors de l'arène + mort.
  for (const p of world.players) {
    if (!p.alive) continue;
    const outside = dist(p.pos, world.arenaCenter) + p.radius > world.arenaRadius;
    if (outside) applyDamage(p, CONFIG.player.outOfBoundsDps * dt);
  }
}

/**
 * Grappin : tant qu'il est actif, la cible reste à portée de laisse (traînée avec
 * le grappleur). À la fin, la cible est éjectée dans la direction visée du grappleur.
 */
function updateGrapples(world: WorldState, dt: number): void {
  for (const p of world.players) {
    const g = p.grapple;
    if (!g) continue;
    const target = world.players.find((x) => x.id === g.targetId);
    if (!p.alive || !target || !target.alive) {
      p.grapple = null;
      continue;
    }

    g.time -= dt;

    // Laisse : si la cible dépasse la longueur, on la ramène à portée.
    const dx = target.pos.x - p.pos.x;
    const dy = target.pos.y - p.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > g.tether) {
      target.pos.x = p.pos.x + (dx / d) * g.tether;
      target.pos.y = p.pos.y + (dy / d) * g.tether;
    }

    // Fin du grappin : on projette la cible dans la direction visée du grappleur.
    if (g.time <= 0) {
      target.knockback.x += p.facing.x * g.launch;
      target.knockback.y += p.facing.y * g.launch;
      p.grapple = null;
    }
  }
}

/** Charge (dash) : un joueur en pleine ruée projette violemment les ennemis heurtés. */
const CHARGE_PUSH = 1400;
function updateDashCharges(world: WorldState, dt: number): void {
  for (const p of world.players) {
    if (p.chargeTime <= 0) continue;
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
      }
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
