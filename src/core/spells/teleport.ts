import type { Spell } from './spell';

const DISTANCE = 320; // portée plus longue que le dash
const COOLDOWN = 3;
const COLOR = '#a78bfa';

/** Sort : téléportation instantanée dans la direction visée (ne bouscule personne). */
export const teleport: Spell = {
  id: 'teleport',
  name: 'Téléportation',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Disparaît et réapparaît plus loin dans la direction visée. Contrairement au ' +
    'dash, ne traverse ni ne bouscule les ennemis : pur repositionnement.',
  preview: 'blink',
  icon: '<path fill-rule="evenodd" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.2a4.8 4.8 0 110 9.6 4.8 4.8 0 010-9.6z"/>',
  cast(_world, caster) {
    caster.pos.x += caster.facing.x * DISTANCE;
    caster.pos.y += caster.facing.y * DISTANCE;
  },
};
