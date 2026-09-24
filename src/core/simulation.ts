import type { Player, PlayerInput, Projectile, WorldState } from './types';
import { normalize, sub, dist, scale, len } from './vec';
import { resolvePlayerCollisions } from './physics';
import { CONFIG } from './config';
import { SPELLS } from './spells/definitions';

/**
 * Fait avancer le monde d'un pas de temps fixe `dt`.
 * `inputs` associe l'id d'un joueur à son entrée pour cette frame.
 *
 * Fonction PURE vis-à-vis du DOM : aucune dépendance canvas/fenêtre ici.
 * C'est ce qui permettra d'ajouter bots puis réseau plus tard.
 */
export function step(world: WorldState, inputs: Map<string, PlayerInput>, dt: number): void {
  world.tick++;
  world.time += dt;

  // 1. Déplacement + visée + sorts pour chaque joueur.
  for (const p of world.players) {
    if (!p.alive) continue;
    tickCooldowns(p, dt);

    const input = inputs.get(p.id);
    if (input) {
      const toAim = sub(input.aim, p.pos);
      const d = len(toAim);
      const dir = normalize(toAim);

      // Le personnage se dirige vers le curseur, sauf s'il l'a quasiment atteint
      // (zone morte pour éviter les micro-oscillations autour de la cible).
      if (input.follow && d > CONFIG.player.followStopDist) {
        p.vel.x = dir.x * p.speed;
        p.vel.y = dir.y * p.speed;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }

      // La visée suit toujours le curseur (même à l'arrêt).
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

  // 2. Collisions entre joueurs.
  resolvePlayerCollisions(world.players);

  // 3. Projectiles : déplacement, durée de vie, impacts.
  updateProjectiles(world, dt);

  // 4. Rétrécissement de l'arène.
  if (world.time > CONFIG.arena.shrinkDelay) {
    world.arenaRadius = Math.max(
      CONFIG.arena.minRadius,
      world.arenaRadius - CONFIG.arena.shrinkRate * dt,
    );
  }

  // 5. Dégâts hors de l'arène + mort.
  for (const p of world.players) {
    if (!p.alive) continue;
    const outside = dist(p.pos, world.arenaCenter) + p.radius > world.arenaRadius;
    if (outside) applyDamage(p, CONFIG.player.outOfBoundsDps * dt);
  }
}

function tickCooldowns(p: Player, dt: number): void {
  for (const id in p.cooldowns) {
    if (p.cooldowns[id] > 0) p.cooldowns[id] = Math.max(0, p.cooldowns[id] - dt);
  }
}

function tryCast(world: WorldState, caster: Player, spellId: string): void {
  const spell = SPELLS[spellId];
  if (!spell) return;
  if ((caster.cooldowns[spellId] ?? 0) > 0) return;

  switch (spell.type) {
    case 'projectile': {
      const spawn = {
        x: caster.pos.x + caster.facing.x * (caster.radius + spell.radius + 2),
        y: caster.pos.y + caster.facing.y * (caster.radius + spell.radius + 2),
      };
      const proj: Projectile = {
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: spawn,
        vel: scale(caster.facing, spell.speed),
        radius: spell.radius,
        damage: spell.damage,
        knockback: spell.knockback,
        pierce: spell.pierce,
        life: spell.lifetime,
        color: spell.color,
      };
      world.projectiles.push(proj);
      break;
    }
    case 'dash': {
      caster.pos.x += caster.facing.x * spell.distance;
      caster.pos.y += caster.facing.y * spell.distance;
      break;
    }
  }

  caster.cooldowns[spellId] = spell.cooldown;
}

function updateProjectiles(world: WorldState, dt: number): void {
  const survivors: Projectile[] = [];
  for (const proj of world.projectiles) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) continue;

    const dir = normalize(proj.vel);
    let consumed = false;
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const surface = proj.radius + p.radius;
      if (dist(proj.pos, p.pos) <= surface) {
        // Dégâts par seconde tant que la cible reste au contact.
        applyDamage(p, proj.damage * dt);

        // Le joueur est REPOUSSÉ hors de l'orbe (jamais traversé) : on le
        // replace sur la surface, du côté où il se trouve. Face à l'orbe,
        // ce côté est l'avant -> il est poussé devant, comme un chasse-neige.
        const toP = sub(p.pos, proj.pos);
        const d = len(toP);
        const n = d > 1e-3 ? { x: toP.x / d, y: toP.y / d } : dir;
        p.pos.x = proj.pos.x + n.x * surface;
        p.pos.y = proj.pos.y + n.y * surface;

        // Élan résiduel dans le sens du tir (glisse encore un peu après le passage).
        p.knockback.x = dir.x * proj.knockback;
        p.knockback.y = dir.y * proj.knockback;

        if (!proj.pierce) {
          consumed = true;
          break;
        }
      }
    }
    if (!consumed) survivors.push(proj);
  }
  world.projectiles = survivors;
}

function applyDamage(p: Player, amount: number): void {
  p.health -= amount;
  if (p.health <= 0) {
    p.health = 0;
    p.alive = false;
  }
}
