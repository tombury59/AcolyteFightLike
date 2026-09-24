import type { Spell } from './spell';
import type { Player, WorldState } from '../types';

const RANGE = 360; // portée d'accroche
const DURATION = 2.5; // durée du lien (s)
const TETHER = 150; // longueur de laisse
const LAUNCH = 3000; // force d'éjection à la fin (très forte)
const AIM_TOLERANCE = 42; // il faut viser la cible (distance au rayon)
const COOLDOWN = 4; // moyen
const COLOR = '#f472b6';

/**
 * Cible d'accroche : la PREMIÈRE cible sur le rayon de visée (hitscan).
 * Le grappin ne cible pas tout seul : il faut pointer l'ennemi.
 */
function acquireTarget(world: WorldState, caster: Player): Player | null {
  const dx = caster.facing.x;
  const dy = caster.facing.y;
  let best: Player | null = null;
  let bestAlong = Infinity;
  for (const p of world.players) {
    if (!p.alive || p.id === caster.id) continue;
    const rx = p.pos.x - caster.pos.x;
    const ry = p.pos.y - caster.pos.y;
    const along = rx * dx + ry * dy; // avancée le long de la visée
    if (along <= 0 || along > RANGE) continue; // derrière ou hors de portée
    const perp = Math.abs(rx * -dy + ry * dx); // écart au rayon
    if (perp > p.radius + AIM_TOLERANCE) continue; // pas assez bien visé
    if (along < bestAlong) {
      bestAlong = along;
      best = p;
    }
  }
  return best;
}

/** Sort : accroche un ennemi, le garde en laisse, puis l'éjecte à la fin. */
export const grapple: Spell = {
  id: 'grapple',
  name: 'Grappin',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Accroche l’ennemi le plus proche devant toi et le lie pendant quelques ' +
    'secondes. À la fin, il est projeté dans la direction que tu vises.',
  preview: 'orb',
  icon: '<path d="M11 2h2v6h2a3 3 0 013 3v5a3 3 0 11-2 0v-5a1 1 0 00-1-1h-2v3h-2V2z"/>',
  cast(world, caster) {
    const target = acquireTarget(world, caster);
    if (target) {
      caster.grapple = { targetId: target.id, time: DURATION, tether: TETHER, launch: LAUNCH };
    }
  },
};
