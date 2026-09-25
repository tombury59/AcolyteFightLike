import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';
import { icons } from './icons';

// Fidèle à « Freezing Breath » (whirlwind) : un tourbillon lent qui ralentit les
// ennemis pris dedans (50% / 2s) et gobe les projectiles ennemis qui s'en approchent.
const SPEED = 170;
const RADIUS = 52;
const EAT_RADIUS = 70; // portée d'aspiration des projectiles ennemis
const SLOW_TIME = 2; // durée du ralentissement infligé
const LIFETIME = 2;
const COOLDOWN = 7.5;
const COLOR = '#44ffff';

/** Sort : souffle un tourbillon glaçant qui ralentit et neutralise les projectiles. */
export const whirlwind: Spell = {
  id: 'whirlwind',
  name: 'Tourbillon',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Un tourbillon glaçant pour ralentir tes ennemis (−50% pendant 2 s). Il ' +
    'aspire aussi et détruit les projectiles ennemis qui s’en approchent.',
  preview: 'swirl',
  icon: icons.whirlwind,
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: {
        x: caster.pos.x + dir.x * (caster.radius + RADIUS),
        y: caster.pos.y + dir.y * (caster.radius + RADIUS),
      },
      vel: { x: dir.x * SPEED, y: dir.y * SPEED },
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'whirlwind',
      renderKind: 'cloud',
      params: {},
    });
  },
};

/** Tourbillon : ralentit les ennemis dedans, aspire les projectiles ennemis. */
export const whirlwindBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    // Ralentit les ennemis pris dans le tourbillon.
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.radius + p.radius) p.slowTime = SLOW_TIME;
    }
    // Gobe les petits projectiles ennemis (marqués `reflectable`).
    for (const other of world.projectiles) {
      if (other.dead || other.id === proj.id) continue;
      if (other.ownerId === proj.ownerId || !other.params.reflectable) continue;
      if (dist(proj.pos, other.pos) <= EAT_RADIUS + other.radius) other.dead = true;
    }
  },
};
