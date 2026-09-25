import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Phase Shift » (phaseOut) d'Acolyte Fight : tu te déphases brièvement.
// Pendant ce temps tu es invulnérable et tout recul est annulé — mais tu ne peux
// ni bouger ni lancer de sort.
const DURATION = 0.8;
const COOLDOWN = 7;
const COLOR = '#c4b5fd';

/** Sort : bref déphasage invulnérable qui annule aussi le recul en cours. */
export const phaseOut: Spell = {
  id: 'phaseOut',
  name: 'Déphasage',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Déphase-toi hors du monde un court instant : invulnérable et débarrassé de ' +
    'tout recul. En contrepartie, tu ne peux ni te déplacer ni lancer de sort.',
  preview: 'phase',
  icon: icons.phaseOut,
  cast(_world, caster) {
    caster.invulnTime = DURATION;
    caster.frozenTime = DURATION; // figé : ni déplacement ni sort
    caster.knockback.x = 0; // annule le recul en cours
    caster.knockback.y = 0;
  },
};
