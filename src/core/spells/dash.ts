import type { Spell } from './spell';

const DISTANCE = 190;
const COOLDOWN = 2;
const COLOR = '#38bdf8';

/** Sort : téléportation courte dans la direction de visée. */
export const dash: Spell = {
  id: 'dash',
  name: 'Dash',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Une téléportation courte et instantanée dans la direction visée. ' +
    'Parfait pour esquiver un orbe ou se repositionner rapidement.',
  preview: 'blink',
  cast(_world, caster) {
    caster.pos.x += caster.facing.x * DISTANCE;
    caster.pos.y += caster.facing.y * DISTANCE;
  },
};
