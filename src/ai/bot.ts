import type { Player, PlayerInput, WorldState } from '../core/types';
import { sub, len, dist } from '../core/vec';

/** Portée en deçà de laquelle le bot engage (lance un sort offensif). */
const ENGAGE_RANGE = 460;
/** Distance à laquelle le bot cesse d'avancer pour tenir sa cible à distance. */
const PREFERRED_DIST = 210;
/** Au-delà de cette distance, le bot utilise un sort de mobilité pour se rapprocher. */
const DASH_MIN_DIST = 320;
/** Sorts de mobilité : utilisés pour combler la distance plutôt que pour attaquer. */
const MOBILITY_SPELLS = new Set(['dash', 'teleport']);

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

  // Sinon : engager la cible avec ses PROPRES sorts équipés (au hasard).
  const equipped = bot.spellSlots.filter((s): s is string => !!s);
  const ready = equipped.filter((id) => (bot.cooldowns[id] ?? 0) <= 0);
  const castSpells: string[] = [];

  if (d > DASH_MIN_DIST) {
    // Trop loin : se rapprocher avec un sort de mobilité s'il en a un de prêt.
    const mobility = ready.find((id) => MOBILITY_SPELLS.has(id));
    if (mobility) castSpells.push(mobility);
  }
  if (castSpells.length === 0 && d < ENGAGE_RANGE) {
    // À portée : lancer un sort offensif au hasard parmi ceux prêts.
    const offensive = ready.filter((id) => !MOBILITY_SPELLS.has(id));
    if (offensive.length > 0) {
      castSpells.push(offensive[Math.floor(Math.random() * offensive.length)]);
    }
  }

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
