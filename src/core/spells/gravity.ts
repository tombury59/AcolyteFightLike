import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';
import { icons } from './icons';

// Piège revisité : un faisceau moyennement rapide ; quand il touche un ennemi,
// il le bloque sur place (immobilisation + silence) pendant quelques secondes.
const SPEED = 520; // moyennement rapide
const RADIUS = 8;
const RANGE = 900; // portée avant de s'éteindre
const ROOT_TIME = 2; // durée d'immobilisation à l'impact
const COOLDOWN = 7.5;
const COLOR = '#0ace00';

/** Sort : tire un trait qui immobilise l'ennemi touché sur place. */
export const gravity: Spell = {
  id: 'gravity',
  name: 'Piège',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Tire un faisceau qui, au contact, cloue l’ennemi sur place : il ne peut plus ' +
    'ni bouger ni lancer de sorts pendant que tu le canardes.',
  preview: 'ensnare',
  icon: icons.gravity,
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
      life: RANGE / SPEED,
      dead: false,
      behavior: 'gravity',
      renderKind: 'bolt',
      params: { root: ROOT_TIME },
    });
  },
};

/** Piège : file tout droit, immobilise (fige) la première cible touchée. */
export const gravityBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
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
        p.frozenTime = Math.max(p.frozenTime, proj.params.root); // immobilise + réduit au silence
        p.rootTime = Math.max(p.rootTime, proj.params.root); // marqueur visuel (effet vert)
        p.knockback.x = 0;
        p.knockback.y = 0;
        proj.dead = true;
        break;
      }
    }
  },
};
