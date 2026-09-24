import type { PlayerInput, WorldState } from './types';
import { normalize, sub, dist } from './vec';
import { resolvePlayerCollisions } from './physics';
import { CONFIG } from './config';

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

  // 1. Déplacement des joueurs selon leur entrée.
  for (const p of world.players) {
    if (!p.alive) continue;
    const input = inputs.get(p.id);
    if (input) {
      const dir = normalize(input.move);
      p.vel.x = dir.x * p.speed;
      p.vel.y = dir.y * p.speed;

      const aimDir = normalize(sub(input.aim, p.pos));
      if (aimDir.x !== 0 || aimDir.y !== 0) p.facing = aimDir;
    } else {
      p.vel.x = 0;
      p.vel.y = 0;
    }
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
  }

  // 2. Collisions entre joueurs.
  resolvePlayerCollisions(world.players);

  // 3. Rétrécissement de l'arène.
  if (world.time > CONFIG.arena.shrinkDelay) {
    world.arenaRadius = Math.max(
      CONFIG.arena.minRadius,
      world.arenaRadius - CONFIG.arena.shrinkRate * dt,
    );
  }

  // 4. Dégâts hors de l'arène + mort.
  for (const p of world.players) {
    if (!p.alive) continue;
    const outside = dist(p.pos, world.arenaCenter) + p.radius > world.arenaRadius;
    if (outside) {
      p.health -= CONFIG.player.outOfBoundsDps * dt;
      if (p.health <= 0) {
        p.health = 0;
        p.alive = false;
      }
    }
  }
}
