import type { Spell } from './spell';

// Fidèle à « Drain » : un projectile chercheur qui blesse ET rend au lanceur la
// vie volée (vol de vie total). Réutilise le comportement `seeker` (voir homing).
const SPEED = 260;
const TURN = 3.6;
const DAMAGE = 15;
const LIFETIME = 2;
const RADIUS = 6;
const COOLDOWN = 5;
const COLOR = '#22ee88';

/** Sort : vole de la vie à l'ennemi touché et te soigne d'autant. */
export const drain: Spell = {
  id: 'drain',
  name: 'Drain',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Vole un peu de vie à ton ennemi — il n’en avait sûrement pas besoin. Le ' +
    'projectile te poursuit ta cible et te rend les dégâts infligés.',
  preview: 'orb',
  icon: '<path d="M12 3s6 6 6 10a6 6 0 11-12 0c0-4 6-10 6-10z"/>',
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: {
        x: caster.pos.x + dir.x * (caster.radius + RADIUS + 2),
        y: caster.pos.y + dir.y * (caster.radius + RADIUS + 2),
      },
      vel: { x: dir.x * SPEED, y: dir.y * SPEED },
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'seeker',
      renderKind: 'circle',
      params: { dmg: DAMAGE, turn: TURN, heal: DAMAGE, reflectable: 1 },
    });
  },
};
