import type { Spell, ProjectileBehavior } from './spell';
import { scale, dist } from '../vec';
import { applyDamage } from '../combat';

// Fidèle à Acolyte Fight : recharge courte, bons dégâts, disparaît au contact.
const SPEED = 720; // rapide
const RADIUS = 9; // petite
const DAMAGE = 16; // « packs a punch »
const LIFETIME = 1.3; // portée
const COOLDOWN = 1.5;
const COLOR = '#ff8800';

/** Sort : la bonne vieille boule de feu — rapide, frappe fort, meurt à l'impact. */
export const fireball: Spell = {
  id: 'fireball',
  name: 'Boule de feu',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Recharge rapide et bien puncheuse. La bonne vieille boule de feu fiable : ' +
    'file droit, inflige de solides dégâts et disparaît au premier contact.',
  preview: 'orb',
  icon: '<path d="M12 2c1.2 3.6 4.8 4.8 4.8 8.6a4.8 4.8 0 1 1-9.6 0c0-1.7.9-2.9 1.9-3.9.1 1.8 1 2.8 2 2.8.2-2.8-.9-4-1.1-7.5z"/>',
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
      behavior: 'projectileHit',
      renderKind: 'circle',
      params: { dmg: DAMAGE, reflectable: 1 },
    });
  },
};

/**
 * Comportement générique « projectile à impact » : file tout droit, inflige
 * `params.dmg` à la première cible touchée puis disparaît. Réutilisé par tous
 * les sorts à projectile simple (boule de feu, gerbe de feu...).
 */
export const projectileHit: ProjectileBehavior = {
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
        applyDamage(p, proj.params.dmg);
        proj.dead = true;
        break;
      }
    }
  },
};
