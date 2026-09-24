import type { Spell } from './spell';

const DURATION = 3; // secondes d'invulnérabilité
const COOLDOWN = 8; // moyen-long
const COLOR = '#22d3ee';

/** Sort : bouclier qui bloque tous les dégâts pendant quelques secondes. */
export const shield: Spell = {
  id: 'shield',
  name: 'Bouclier',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Érige un bouclier qui bloque tous les dégâts pendant quelques secondes. ' +
    'Parfait pour encaisser un laser ou survivre au rétrécissement.',
  preview: 'orb',
  icon: '<path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5z"/>',
  cast(_world, caster) {
    caster.shieldTime = DURATION;
  },
};
