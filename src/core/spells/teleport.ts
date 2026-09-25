import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Teleport » d'Acolyte Fight : saut vers un point proche dans la
// direction visée (portée plafonnée), et purge les effets sur soi (cleanse).
const RANGE = 340; // portée max du saut
const COOLDOWN = 8;
const COLOR = '#6666ff';

/** Sort : téléportation dans la direction visée ; libère de toute prise. */
export const teleport: Spell = {
  id: 'teleport',
  name: 'Téléportation',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Se téléporte vers un point proche dans la direction visée : pour foncer au ' +
    'contact ou décrocher. Te libère aussi de toute prise (grappin) en cours.',
  preview: 'blink',
  icon: icons.teleport,
  cast(world, caster) {
    // Cleanse : rompt un grappin qui te tient, et lève une éventuelle immobilisation.
    for (const o of world.players) {
      if (o.grapple && o.grapple.targetId === caster.id) o.grapple = null;
    }
    caster.frozenTime = 0;
    caster.pos.x += caster.facing.x * RANGE;
    caster.pos.y += caster.facing.y * RANGE;
  },
};
