import type { Spell, ProjectileBehavior } from './spell';
import { scale, dist } from '../vec';
import { icons } from './icons';

// Fidèle à « Repulsor » (lightning) d'Acolyte Fight : gros knockback, 0 dégât,
// et le tir te repousse toi aussi (recoil).
const SPEED = 1500; // ultra-rapide
const RADIUS = 5;
const LIFETIME = 0.5; // longue portée
const KNOCKBACK = 2200; // énorme poussée sur la cible
const RECOIL = 700; // recul sur le lanceur
const COOLDOWN = 8; // long
const COLOR = '#00ddff';

/** Sort : trait fulgurant qui projette violemment la cible — et te repousse aussi. */
export const bolt: Spell = {
  id: 'bolt',
  name: 'Répulseur',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Énorme recul, si ta visée est assez bonne. Ne fait aucun dégât mais éjecte ' +
    'violemment la cible… et attention, le recul te repousse toi aussi.',
  preview: 'bolt',
  icon: icons.bolt,
  cast(world, caster) {
    const dir = caster.facing;
    // Recul sur soi (comme le vrai Repulsor).
    caster.knockback.x -= dir.x * RECOIL;
    caster.knockback.y -= dir.y * RECOIL;
    caster.slideTime = 0.5;
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
      behavior: 'repulsor',
      renderKind: 'bolt',
      params: { knockback: KNOCKBACK, reflectable: 1 },
    });
  },
};

/** Trait : file tout droit, éjecte violemment la première cible puis disparaît. */
export const repulsor: ProjectileBehavior = {
  update(world, proj, dt) {
    const dir = Math.hypot(proj.vel.x, proj.vel.y) || 1;
    const nx = proj.vel.x / dir;
    const ny = proj.vel.y / dir;
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.radius + p.radius) {
        p.knockback.x = nx * proj.params.knockback;
        p.knockback.y = ny * proj.params.knockback;
        p.slideTime = 0.6; // la cible conserve son élan (part loin)
        proj.dead = true;
        break;
      }
    }
  },
};
