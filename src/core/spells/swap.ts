import type { Spell, ProjectileBehavior } from './spell';
import { scale, dist } from '../vec';
import { icons } from './icons';

// Fidèle à « Swap » d'Acolyte Fight : lance un trait qui échange ta position avec
// le premier ennemi touché. S'il n'atteint personne, tu te téléportes à l'endroit
// où il s'éteint (téléportation « ratée »).
const SPEED = 950; // très rapide
const RADIUS = 8;
const LIFETIME = 0.5; // portée
const COOLDOWN = 10;
const COLOR = '#22d3ee';

/** Sort : échange ta position avec la cible touchée (ou téléporte si tu rates). */
export const swap: Spell = {
  id: 'swap',
  name: 'Permutation',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Projette un trait qui échange ta position avec le premier ennemi touché. ' +
    'Si tu ne touches personne, tu te téléportes là où le trait s’éteint.',
  preview: 'swap',
  icon: icons.swap,
  cast(world, caster) {
    const dir = caster.facing;
    // Purge : rompt un grappin qui te tient (repositionnement franc).
    for (const o of world.players) {
      if (o.grapple && o.grapple.targetId === caster.id) o.grapple = null;
    }
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
      behavior: 'swapBolt',
      renderKind: 'bolt',
      params: {},
    });
  },
};

/** Trait de permutation : échange les positions au contact, sinon téléporte à la fin. */
export const swapBolt: ProjectileBehavior = {
  update(world, proj, dt) {
    const owner = world.players.find((o) => o.id === proj.ownerId);
    if (!owner || !owner.alive) {
      proj.dead = true;
      return;
    }
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;

    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.radius + p.radius) {
        // Échange des positions.
        const ox = owner.pos.x;
        const oy = owner.pos.y;
        owner.pos.x = p.pos.x;
        owner.pos.y = p.pos.y;
        p.pos.x = ox;
        p.pos.y = oy;
        proj.dead = true;
        return;
      }
    }

    if (proj.life <= 0) {
      // Rate : le lanceur se téléporte à la position finale du trait.
      owner.pos.x = proj.pos.x;
      owner.pos.y = proj.pos.y;
      proj.dead = true;
    }
  },
};
