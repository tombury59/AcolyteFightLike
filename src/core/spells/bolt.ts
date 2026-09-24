import type { Spell, ProjectileBehavior } from './spell';
import { scale, dist } from '../vec';
import { applyDamage } from '../combat';

const SPEED = 900; // rapide
const DAMAGE = 6; // faible
const RADIUS = 5; // fin
const LIFETIME = 1.2;
const COOLDOWN = 0.4; // rapide
const COLOR = '#67e8f9';

/** Sort : petit trait laser rapide qui inflige de faibles dégâts. */
export const bolt: Spell = {
  id: 'bolt',
  name: 'Trait laser',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Envoie un fin trait laser très rapide qui inflige de faibles dégâts. ' +
    'Recharge éclair : à marteler pour harceler l’ennemi à distance.',
  preview: 'blink',
  icon: '<path d="M3 11h13l-4-4h3l6 5-6 5h-3l4-4H3z"/>',
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
      behavior: 'bolt',
      renderKind: 'bolt',
      params: { dmg: DAMAGE },
    });
  },
};

/** Trait : file tout droit, blesse une cible et disparaît à l'impact. */
export const boltBehavior: ProjectileBehavior = {
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
