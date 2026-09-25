import type { Spell } from './spell';

// Fidèle à « Supernova » : file jusqu'au point visé puis explose en différé,
// repoussant les ennemis (éjection plus forte au centre). Réutilise `nova`.
const RANGE = 300; // point d'explosion devant le lanceur
const FUSE = 0.65; // délai avant l'explosion
const RADIUS = 95;
const IMPULSE = 1150;
const COOLDOWN = 7.5;
const COLOR = '#ff9a00';

/** Sort : explosion différée à distance qui repousse les ennemis alentour. */
export const supernova: Spell = {
  id: 'supernova',
  name: 'Supernova',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Une explosion différée qui repousse tes ennemis. L’éjection est d’autant ' +
    'plus forte qu’ils sont proches du centre du souffle.',
  preview: 'orb',
  icon: '<path d="M12 1l2.5 6.5L21 5l-3.5 6.5L23 14l-7 .5L14 22l-2-6-4 5 1-6-6 1 5-4-6-2 6.5-2L9 3l3 4z"/>',
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x + dir.x * RANGE, y: caster.pos.y + dir.y * RANGE },
      vel: { x: 0, y: 0 },
      radius: RADIUS,
      color: COLOR,
      life: FUSE,
      dead: false,
      behavior: 'nova',
      renderKind: 'nova',
      params: { radius: RADIUS, dmg: 0, impulse: IMPULSE, follow: 0, fuse0: FUSE },
    });
  },
};
