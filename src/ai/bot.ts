import type { Player, PlayerInput, WorldState } from '../core/types';
import { sub, len, dist } from '../core/vec';

/** Portée en deçà de laquelle le bot lance des boules de feu. */
const FIREBALL_RANGE = 460;
/** Distance à laquelle le bot cesse d'avancer pour tenir sa cible à distance. */
const PREFERRED_DIST = 210;
/** Au-delà de cette distance, le bot dash pour combler l'écart. */
const DASH_MIN_DIST = 320;

/**
 * Produit le PlayerInput d'un bot pour cette frame.
 * Même interface que le joueur humain -> interchangeable côté simulation.
 */
export function computeBotInput(world: WorldState, bot: Player): PlayerInput {
  const target = nearestEnemy(world, bot);
  if (!target) return { aim: { ...bot.pos }, follow: false, castSpells: [] };

  const d = len(sub(target.pos, bot.pos));
  const distFromCenter = dist(bot.pos, world.arenaCenter);
  const safeEdge = world.arenaRadius - bot.radius - 24;

  // Priorité absolue : ne pas sortir de l'arène (dégâts de zone).
  if (distFromCenter > safeEdge) {
    return { aim: { ...world.arenaCenter }, follow: true, castSpells: [] };
  }

  // Sinon : engager la cible.
  const castSpells: string[] = [];
  if (d < FIREBALL_RANGE) castSpells.push('fireball');
  if (d > DASH_MIN_DIST) castSpells.push('dash');

  return {
    aim: { ...target.pos },
    // Avance tant qu'on n'est pas à distance de combat, puis tient la position.
    follow: d > PREFERRED_DIST,
    castSpells,
  };
}

function nearestEnemy(world: WorldState, bot: Player): Player | null {
  let best: Player | null = null;
  let bestDist = Infinity;
  for (const p of world.players) {
    if (!p.alive || p.id === bot.id) continue;
    const dd = dist(p.pos, bot.pos);
    if (dd < bestDist) {
      bestDist = dd;
      best = p;
    }
  }
  return best;
}
