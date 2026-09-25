import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';
import { applyDamage, heal } from '../combat';

// Fidèle à « Homing » : un projectile lent qui vire vers l'ennemi le plus proche.
const SPEED = 300;
const TURN = 3.2; // vitesse de virage (rad/s)
const DAMAGE = 16;
const LIFETIME = 3.5;
const RADIUS = 7;
const COOLDOWN = 9;
const COLOR = '#44ffcc';

/** Sort : projectile autoguidé qui poursuit l'ennemi le plus proche. */
export const homing: Spell = {
  id: 'homing',
  name: 'Autoguidé',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Poursuit l’ennemi. Gros dégâts… à condition qu’il ne sache pas esquiver. ' +
    'Le projectile vire tout seul vers la cible la plus proche.',
  preview: 'orb',
  icon: '<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/>',
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
      params: { dmg: DAMAGE, turn: TURN, heal: 0, reflectable: 1 },
    });
  },
};

/**
 * Comportement « chercheur » : vire vers l'ennemi le plus proche, blesse la
 * première cible touchée et (option) soigne le lanceur. Réutilisé par Autoguidé
 * et Drain.
 */
export const seeker: ProjectileBehavior = {
  update(world, proj, dt) {
    // Cible = ennemi vivant le plus proche.
    let target = null;
    let bd = Infinity;
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const d = dist(p.pos, proj.pos);
      if (d < bd) {
        bd = d;
        target = p;
      }
    }
    const speed = Math.hypot(proj.vel.x, proj.vel.y) || 1;
    if (target) {
      const desired = Math.atan2(target.pos.y - proj.pos.y, target.pos.x - proj.pos.x);
      let cur = Math.atan2(proj.vel.y, proj.vel.x);
      let diff = desired - cur;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const step = Math.max(-proj.params.turn * dt, Math.min(proj.params.turn * dt, diff));
      cur += step;
      proj.vel.x = Math.cos(cur) * speed;
      proj.vel.y = Math.sin(cur) * speed;
    }
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
        if (proj.params.heal > 0) {
          const owner = world.players.find((o) => o.id === proj.ownerId);
          if (owner) heal(owner, proj.params.heal);
        }
        proj.dead = true;
        break;
      }
    }
  },
};
