import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';
import { icons } from './icons';

// Fidèle à « Overload » (scourge) : après une brève charge, une explosion de
// contact qui envoie valser les ennemis — mais qui te coûte aussi de la vie.
const CHARGE = 0.5; // délai avant explosion (télégraphe)
const RADIUS = 80; // portée mêlée
const DAMAGE = 30;
const IMPULSE = 1400; // éjection (plus forte au centre)
const SELF_DAMAGE = 10;
const COOLDOWN = 5;
const COLOR = '#ffcc00';

/** Sort : explosion de mêlée dévastatrice, au prix d'une partie de ta vie. */
export const scourge: Spell = {
  id: 'scourge',
  name: 'Surcharge',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Libère une explosion de mêlée qui envoie tes ennemis valser. Prudence : ce ' +
    'sort est si puissant qu’il te coûte aussi un peu de vie.',
  preview: 'orb',
  icon: icons.scourge,
  cast(world, caster) {
    // Coût en vie (ne peut pas te tuer) + libère les prises sur toi.
    caster.health = Math.max(1, caster.health - SELF_DAMAGE);
    for (const o of world.players) {
      if (o.grapple && o.grapple.targetId === caster.id) o.grapple = null;
      if (o.pull && o.pull.targetId === caster.id) o.pull = null;
    }
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: 0, y: 0 },
      radius: RADIUS,
      color: COLOR,
      life: CHARGE,
      dead: false,
      behavior: 'nova',
      renderKind: 'nova',
      params: { radius: RADIUS, dmg: DAMAGE, impulse: IMPULSE, follow: 1, fuse0: CHARGE },
    });
  },
};

/**
 * Explosion différée générique : suit éventuellement son lanceur pendant la charge
 * (`follow`), puis détone une fois — dégâts + éjection radiale plus forte au centre.
 * Réutilisée par Surcharge et Supernova.
 */
export const nova: ProjectileBehavior = {
  update(world, proj, dt) {
    if (proj.params.follow) {
      const owner = world.players.find((o) => o.id === proj.ownerId);
      if (owner) {
        proj.pos.x = owner.pos.x;
        proj.pos.y = owner.pos.y;
      }
    }
    proj.life -= dt;
    if (proj.life > 0) return; // encore en charge

    // Détonation (une seule fois) : éjecte et blesse dans le rayon.
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const dx = p.pos.x - proj.pos.x;
      const dy = p.pos.y - proj.pos.y;
      const d = Math.hypot(dx, dy);
      if (d > proj.params.radius + p.radius) continue;
      if (proj.params.dmg > 0) applyDamage(p, proj.params.dmg);
      const nx = d > 1e-3 ? dx / d : 1;
      const ny = d > 1e-3 ? dy / d : 0;
      // Plus fort au centre : de 100% (centre) à ~40% (bord).
      const falloff = 1 - 0.6 * Math.min(1, d / proj.params.radius);
      p.knockback.x = nx * proj.params.impulse * falloff;
      p.knockback.y = ny * proj.params.impulse * falloff;
      p.slideTime = 0.4;
    }
    proj.dead = true;
  },
};
