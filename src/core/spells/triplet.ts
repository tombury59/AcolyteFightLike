import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Triplet » d'Acolyte Fight : tire trois boules de feu en éventail
// serré. À bout portant, les trois touchent ; de loin, elles couvrent l'esquive.
const COUNT = 3;
const SPREAD = 0.32; // écart angulaire total (~18°)
const SPEED = 700;
const RADIUS = 8;
const DAMAGE = 11; // un peu moins qu'une boule de feu, mais x3
const LIFETIME = 1.2;
const COOLDOWN = 3;
const COLOR = '#ff6a00';

/** Sort : trois boules de feu tirées en éventail serré. */
export const triplet: Spell = {
  id: 'triplet',
  name: 'Triplet',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Tire trois boules de feu en éventail serré. Colle ta cible pour tout ' +
    'concentrer, ou tire de loin pour couper les angles d’esquive.',
  preview: 'triplet',
  icon: icons.triplet,
  cast(world, caster) {
    const base = Math.atan2(caster.facing.y, caster.facing.x);
    for (let i = 0; i < COUNT; i++) {
      const t = COUNT > 1 ? i / (COUNT - 1) : 0.5;
      const angle = base - SPREAD / 2 + t * SPREAD;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: {
          x: caster.pos.x + dx * (caster.radius + RADIUS + 2),
          y: caster.pos.y + dy * (caster.radius + RADIUS + 2),
        },
        vel: { x: dx * SPEED, y: dy * SPEED },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'projectileHit',
        renderKind: 'circle',
        params: { dmg: DAMAGE, reflectable: 1 },
      });
    }
  },
};
