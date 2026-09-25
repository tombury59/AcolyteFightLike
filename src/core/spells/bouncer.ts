import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';
import { applyDamage } from '../combat';
import { icons } from './icons';

// Fidèle à « Bouncer » : file vite, rebondit sur les bords de l'arène et frappe
// plus fort à chaque rebond. Reste au corps à corps pour l'entretenir.
const SPEED = 900;
const RADIUS = 6;
const DAMAGE = 10; // dégâts de base, +BONUS par rebond
const BONUS = 4;
const LIFETIME = 3;
const HIT_CD = 0.25;
const COOLDOWN = 7.5;
const COLOR = '#88ee22';

/** Sort : un projectile qui rebondit sur l'arène, gagnant en puissance. */
export const bouncer: Spell = {
  id: 'bouncer',
  name: 'Rebondisseur',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Plus il rebondit, plus il fait mal. Reste au contact et entretiens les ' +
    'rebonds sur les bords de l’arène pour des dégâts croissants.',
  preview: 'blink',
  icon: icons.bouncer,
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
      behavior: 'bouncer',
      renderKind: 'bolt',
      params: { dmg: DAMAGE, hitCd: 0, reflectable: 1 },
    });
  },
};

/** Rebondisseur : rebondit sur le bord circulaire de l'arène, +dégâts par rebond. */
export const bouncerBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    // Rebond sur le bord circulaire de l'arène.
    const cx = world.arenaCenter.x;
    const cy = world.arenaCenter.y;
    const rx = proj.pos.x - cx;
    const ry = proj.pos.y - cy;
    const r = Math.hypot(rx, ry);
    if (r + proj.radius > world.arenaRadius && r > 1e-3) {
      const nx = rx / r;
      const ny = ry / r;
      const dot = proj.vel.x * nx + proj.vel.y * ny;
      if (dot > 0) {
        // Réflexion v' = v - 2(v·n)n
        proj.vel.x -= 2 * dot * nx;
        proj.vel.y -= 2 * dot * ny;
        // Replace juste à l'intérieur du bord.
        const inside = world.arenaRadius - proj.radius - 1;
        proj.pos.x = cx + nx * inside;
        proj.pos.y = cy + ny * inside;
        proj.params.dmg += BONUS; // frappe plus fort après chaque rebond
      }
    }
    if (proj.params.hitCd > 0) proj.params.hitCd -= dt;
    if (proj.params.hitCd <= 0) {
      for (const p of world.players) {
        if (!p.alive || p.id === proj.ownerId) continue;
        if (dist(proj.pos, p.pos) <= proj.radius + p.radius) {
          applyDamage(p, proj.params.dmg);
          proj.params.hitCd = HIT_CD;
          break;
        }
      }
    }
  },
};
