import type { Spell, ProjectileBehavior } from './spell';
import type { Projectile, WorldState } from '../types';
import { scale, dist } from '../vec';
import { icons } from './icons';

// Fidèle à « Flamestrike » (fireboom) d'Acolyte Fight : un projectile qui explose
// en une gerbe de feu à l'impact (ou en fin de course), infligeant des dégâts de
// zone et une légère poussée. Réutilise l'explosion `nova`.
const SPEED = 480; // plus lent qu'une boule de feu (on télégraphie l'explosion)
const RADIUS = 11;
const HIT_DAMAGE = 8; // dégât direct à l'impact
const BLAST_RADIUS = 78;
const BLAST_DAMAGE = 22; // gros dégât de zone
const BLAST_IMPULSE = 320; // repousse modérément
const BLAST_FUSE = 0.05; // brève amorce avant la déflagration
const LIFETIME = 1.1;
const COOLDOWN = 6;
const COLOR = '#ff5a1f';

/** Sort : projectile de feu qui détone en explosion de zone à l'impact. */
export const flamestrike: Spell = {
  id: 'flamestrike',
  name: 'Flammèche',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Lance une flamme qui explose au contact (ou en fin de course) : dégâts de ' +
    'zone et poussée. Idéale pour toucher plusieurs ennemis ou punir une esquive.',
  preview: 'flamestrike',
  icon: icons.flamestrike,
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: {
        x: caster.pos.x + dir.x * (caster.radius + RADIUS + 2),
        y: caster.pos.y + dir.y * (caster.radius + RADIUS + 2),
      },
      vel: scale(dir, SPEED),
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'flamestrike',
      renderKind: 'circle',
      params: { dmg: HIT_DAMAGE, reflectable: 1 },
    });
  },
};

/** Fait détoner une explosion `nova` à la position d'un projectile. */
function detonate(world: WorldState, proj: Projectile): void {
  world.projectiles.push({
    id: world.nextProjectileId++,
    ownerId: proj.ownerId,
    pos: { x: proj.pos.x, y: proj.pos.y },
    vel: { x: 0, y: 0 },
    radius: BLAST_RADIUS,
    color: proj.color,
    life: BLAST_FUSE,
    dead: false,
    behavior: 'nova',
    renderKind: 'nova',
    params: { radius: BLAST_RADIUS, dmg: BLAST_DAMAGE, impulse: BLAST_IMPULSE, fuse0: BLAST_FUSE },
  });
}

/** Flammèche : file droit, inflige un petit dégât direct puis explose en zone. */
export const flamestrikeBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      detonate(world, proj);
      proj.dead = true;
      return;
    }
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.radius + p.radius) {
        detonate(world, proj);
        proj.dead = true;
        return;
      }
    }
  },
};
