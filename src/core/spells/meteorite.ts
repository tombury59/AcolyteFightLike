import type { Spell } from './spell';
import { icons } from './icons';

// Inspiré de « Meteorite » (pluie de météores) d'Acolyte Fight : projette une
// volée de météores plus petits en éventail. Réutilise le comportement `meteor`
// (traverse et pousse, aucun dégât, ignore les boucliers).
const COUNT = 4;
const SPREAD = 0.5; // éventail (~29°)
const SPEED = 300;
const SPEED_JITTER = 0.2;
const RADIUS = 30; // plus petits qu'un météore unique
const KNOCKBACK = 340;
const LIFETIME = 3.2;
const COOLDOWN = 11;
const COLOR = '#ff3a12';

/** Sort : une volée de météores qui laboure une large zone devant toi. */
export const meteorite: Spell = {
  id: 'meteorite',
  name: 'Météorite',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Déchaîne une pluie de météores en éventail. Chacun traverse tout et pousse ' +
    'ce qu’il heurte : parfait pour verrouiller une zone et bousculer un groupe.',
  preview: 'shower',
  icon: icons.meteorite,
  cast(world, caster) {
    const base = Math.atan2(caster.facing.y, caster.facing.x);
    for (let i = 0; i < COUNT; i++) {
      const t = COUNT > 1 ? i / (COUNT - 1) : 0.5;
      const angle = base - SPREAD / 2 + t * SPREAD;
      const speed = SPEED * (1 + (Math.random() - 0.5) * 2 * SPEED_JITTER);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: {
          x: caster.pos.x + dx * (caster.radius + RADIUS + 2),
          y: caster.pos.y + dy * (caster.radius + RADIUS + 2),
        },
        vel: { x: dx * speed, y: dy * speed },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'meteor',
        renderKind: 'circle',
        params: { knockback: KNOCKBACK },
      });
    }
  },
};
