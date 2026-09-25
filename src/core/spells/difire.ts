import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';
import { icons } from './icons';

// Fidèle à « Difire » d'Acolyte Fight : deux traits de feu qui divergent. Chaque
// coup pose une pile de brûlure (dégâts sur la durée) ; les piles s'accumulent tant
// que tu rallumes le feu à temps.
const ANGLE = 0.22; // demi-écart des deux traits (~13°)
const SPEED = 760;
const RADIUS = 6;
const HIT_DAMAGE = 3; // petit dégât direct
const BURN_DPS = 4; // dégâts/seconde ajoutés par coup (cumulables)
const BURN_TIME = 3; // durée de la brûlure rafraîchie à chaque coup
const LIFETIME = 1.1;
const COOLDOWN = 2;
const COLOR = '#ff7b00';

/** Sort : deux traits de feu divergents qui embrasent la cible (brûlure cumulable). */
export const difire: Spell = {
  id: 'difire',
  name: 'Difeu',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Tire deux traits de feu divergents. Chaque coup empile une brûlure qui ronge ' +
    'la cible dans la durée : maintiens la pression pour que le feu grandisse.',
  preview: 'difire',
  icon: icons.difire,
  cast(world, caster) {
    const base = Math.atan2(caster.facing.y, caster.facing.x);
    for (const s of [-1, 1]) {
      const angle = base + s * ANGLE;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: {
          x: caster.pos.x + dx * (caster.radius + RADIUS + 2),
          y: caster.pos.y + dy * (caster.radius + RADIUS + 2),
        },
        vel: { x: dx * SPEED, y: dy * SPEED },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'difire',
        renderKind: 'bolt',
        params: { dmg: HIT_DAMAGE, burnDps: BURN_DPS, burnTime: BURN_TIME, reflectable: 1 },
      });
    }
  },
};

/** Trait de Difeu : file droit, inflige un petit dégât et empile une brûlure. */
export const difireBolt: ProjectileBehavior = {
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
      const dx = p.pos.x - proj.pos.x;
      const dy = p.pos.y - proj.pos.y;
      if (dx * dx + dy * dy <= (proj.radius + p.radius) ** 2) {
        applyDamage(p, proj.params.dmg);
        // Empile la brûlure et rafraîchit sa durée.
        p.burnDps += proj.params.burnDps;
        p.burnTime = Math.max(p.burnTime, proj.params.burnTime);
        proj.dead = true;
        break;
      }
    }
  },
};
