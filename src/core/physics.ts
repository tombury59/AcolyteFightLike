import type { Player } from './types';
import { dist } from './vec';

/**
 * Résout les collisions cercle/cercle entre joueurs en les repoussant
 * pour qu'ils ne se chevauchent plus (séparation positionnelle simple).
 */
export function resolvePlayerCollisions(players: Player[]): void {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (!a.alive || !b.alive) continue;

      const minDist = a.radius + b.radius;
      const d = dist(a.pos, b.pos);
      if (d > 0 && d < minDist) {
        const overlap = (minDist - d) / 2;
        const nx = (b.pos.x - a.pos.x) / d;
        const ny = (b.pos.y - a.pos.y) / d;
        a.pos.x -= nx * overlap;
        a.pos.y -= ny * overlap;
        b.pos.x += nx * overlap;
        b.pos.y += ny * overlap;
      }
    }
  }
}
