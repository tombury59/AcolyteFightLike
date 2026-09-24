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

    const input = inputs.get(p.id);
    if (input) {
      const toAim = sub(input.aim, p.pos);
      const d = len(toAim);
      const dir = normalize(toAim);

      // Le personnage se dirige vers le curseur, avec une zone morte anti-jitter.
      if (input.follow && d > CONFIG.player.followStopDist) {
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

  // 2. Collisions entre joueurs.
  resolvePlayerCollisions(world.players);

  // 3. Projectiles : chaque projectile est mis à jour par SON comportement.
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
