import type { Spell } from './spell';
import { icons } from './icons';

// Inspiré de « Halo » d'Acolyte Fight : invoque plusieurs orbes qui tournent
// autour de toi et fauchent les ennemis au contact. Réutilise le comportement
// `orbiter` (maintien sur l'orbite + dégâts espacés), instancié en anneau.
const COUNT = 3;
const ORBIT = 130; // doit correspondre au rayon d'orbite de `orbiter`
const SPEED = 620;
const DAMAGE = 9;
const RADIUS = 7;
const LIFETIME = 5;
const COOLDOWN = 11;
const COLOR = '#ffd24a';

/** Sort : un halo de trois orbes tournant autour de toi, offensif et défensif. */
export const halo: Spell = {
  id: 'halo',
  name: 'Halo',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Fait tourner trois orbes autour de toi. Elles fauchent les ennemis au contact ' +
    'et te protègent en te tournant autour : reste mobile pour couvrir plus large.',
  preview: 'halo',
  icon: icons.halo,
  cast(world, caster) {
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        // Réparties en anneau ; vitesse tangentielle pour amorcer l'orbite.
        pos: { x: caster.pos.x + nx * ORBIT, y: caster.pos.y + ny * ORBIT },
        vel: { x: -ny * SPEED, y: nx * SPEED },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'orbiter',
        renderKind: 'circle',
        params: { dmg: DAMAGE, hitCd: 0, reflectable: 1 },
      });
    }
  },
};
