import type { Spell, ProjectileBehavior } from './spell';
import { normalize, sub, len, scale } from '../vec';

// Fidèle à « Meteor » : un bloc énorme, lent et lourd qui laboure tout sur son
// passage. Aucun dégât, mais une éjection massive, et rien ne l'arrête (il ignore
// même les boucliers -> pas de `reflectable`).
const SPEED = 260;
const DECAY = 0.4; // ralentit fortement (comme speedDecayPerTick)
const RADIUS = 58;
const KNOCKBACK = 1000;
const LIFETIME = 2;
const PUSH_STIFFNESS = 0.3;
const COOLDOWN = 9;
const COLOR = '#ff2200';

/** Sort : projette un météore géant qui pousse violemment tout ce qu'il touche. */
export const meteor: Spell = {
  id: 'meteor',
  name: 'Météore',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Envoie un météore géant vers tes ennemis ! Rien n’arrête un météore : il ' +
    'traverse tout et éjecte violemment quiconque se trouve sur sa route.',
  preview: 'orb',
  icon: '<path d="M14 3l3 3-2 2 3 3-4 1-1 4-3-3-2 2-3-3 8-8zM6 15l3 3-5 2z"/>',
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
      behavior: 'meteor',
      renderKind: 'circle',
      params: { knockback: KNOCKBACK },
    });
  },
};

/** Météore : avance en décélérant, transperce et pousse les joueurs heurtés. */
export const meteorBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.vel.x -= proj.vel.x * DECAY * dt;
    proj.vel.y -= proj.vel.y * DECAY * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    const dir = normalize(proj.vel);
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const surface = proj.radius + p.radius;
      const toP = sub(p.pos, proj.pos);
      const d = len(toP);
      if (d >= surface) continue;
      const n = d > 1e-3 ? { x: toP.x / d, y: toP.y / d } : dir;
      const penetration = surface - d;
      p.pos.x += n.x * penetration * PUSH_STIFFNESS;
      p.pos.y += n.y * penetration * PUSH_STIFFNESS;
      p.knockback.x = dir.x * proj.params.knockback;
      p.knockback.y = dir.y * proj.params.knockback;
    }
  },
};
