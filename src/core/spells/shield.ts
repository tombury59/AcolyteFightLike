import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Reflect » d'Acolyte Fight : un bouclier frontal qui renvoie les
// projectiles (ils deviennent tiens) — inefficace contre les AoE. Ce n'est PAS
// une invulnérabilité. Le renvoi est appliqué par `updateShields` (simulation).
const DURATION = 2; // secondes
const COOLDOWN = 10; // long
const COLOR = '#3366ff';

/** Sort : érige un bouclier frontal qui réfléchit les projectiles ennemis. */
export const shield: Spell = {
  id: 'shield',
  name: 'Reflet',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Renvoie les attaques à projectile qui te frappent de face (elles repartent ' +
    'contre l’ennemi). Sans effet contre les attaques de zone : ne t’y fie pas.',
  preview: 'orb',
  icon: icons.shield,
  cast(_world, caster) {
    caster.shieldTime = DURATION;
  },
};
