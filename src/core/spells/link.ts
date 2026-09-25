import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';

// Fidèle à « Link » : tire un projectile ; à l'impact, il lie l'ennemi et
// l'attire vers toi pendant un court instant (traction pure, pas de balancement).
const HOOK_SPEED = 900;
const HOOK_RANGE = 420;
const HOOK_RADIUS = 7;
const LINK_TIME = 1.75; // durée d'attraction
const COOLDOWN = 7.5;
const COLOR = '#6600ff';

/** Sort : accroche un ennemi et l'attire fermement vers toi. */
export const link: Spell = {
  id: 'link',
  name: 'Lien',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Attire ton ennemi vers toi. Le trait l’accroche à l’impact puis le tire ' +
    'irrésistiblement dans ta direction pendant un court instant.',
  preview: 'orb',
  icon: '<path d="M9 7a5 5 0 015 5v0a5 5 0 01-5 5M15 17a5 5 0 01-5-5v0a5 5 0 015-5"/>',
  cast(world, caster) {
    if (caster.pull) return; // un seul lien à la fois
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: {
        x: caster.pos.x + dir.x * (caster.radius + HOOK_RADIUS + 2),
        y: caster.pos.y + dir.y * (caster.radius + HOOK_RADIUS + 2),
      },
      vel: { x: dir.x * HOOK_SPEED, y: dir.y * HOOK_SPEED },
      radius: HOOK_RADIUS,
      color: COLOR,
      life: HOOK_RANGE / HOOK_SPEED,
      dead: false,
      behavior: 'linkHook',
      renderKind: 'bolt',
      params: { linkTime: LINK_TIME },
    });
  },
};

/** Crochet du Lien : à l'impact, attache l'ennemi au lanceur (attraction vers soi). */
export const linkHook: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    const owner = world.players.find((p) => p.id === proj.ownerId);
    if (!owner || !owner.alive) {
      proj.dead = true;
      return;
    }
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.radius + p.radius) {
        owner.pull = { targetId: p.id, time: proj.params.linkTime };
        proj.dead = true;
        return;
      }
    }
    if (proj.life <= 0) proj.dead = true;
  },
};
