import type { Spell } from './spell';
import type { Player, WorldState } from '../types';
import { dist } from '../vec';

const RANGE = 300; // portée d'accroche
const DURATION = 2.5; // durée du lien (s)
const TETHER = 150; // longueur de laisse
const LAUNCH = 900; // force d'éjection à la fin
const COOLDOWN = 4; // moyen
const COLOR = '#f472b6';

/** Cible d'accroche : l'ennemi vivant le plus proche à portée, de préférence devant. */
function acquireTarget(world: WorldState, caster: Player): Player | null {
  let best: Player | null = null;
  let bestScore = Infinity;
  for (const p of world.players) {
    if (!p.alive || p.id === caster.id) continue;
    const d = dist(p.pos, caster.pos);
    if (d > RANGE) continue;
    // Bonus si la cible est devant (dans la direction visée).
    const nx = (p.pos.x - caster.pos.x) / (d || 1);
    const ny = (p.pos.y - caster.pos.y) / (d || 1);
    const facingDot = nx * caster.facing.x + ny * caster.facing.y;
    const score = d - facingDot * 120; // privilégie les cibles devant
    if (score < bestScore) {
      bestScore = score;
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
