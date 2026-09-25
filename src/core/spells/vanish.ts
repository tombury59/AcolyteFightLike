import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Vanish » d'Acolyte Fight : tu disparais de la vue pendant 3 secondes
// et gagnes un gros bonus de vitesse. Les ennemis (IA) ne peuvent plus te cibler.
const DURATION = 3;
const COOLDOWN = 12;
const COLOR = '#94a3b8';

/** Sort : invisibilité + vitesse pour se repositionner ou fuir. */
export const vanish: Spell = {
  id: 'vanish',
  name: 'Évanescence',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Disparais de la vue pendant 3 secondes avec un fort bonus de vitesse. ' +
    'Tes ennemis ne peuvent plus te viser : idéal pour fuir ou surprendre.',
  preview: 'vanish',
  icon: icons.vanish,
  cast(_world, caster) {
    caster.vanishTime = DURATION;
    caster.frozenTime = 0; // s'assure qu'on peut bouger tout de suite
  },
};
