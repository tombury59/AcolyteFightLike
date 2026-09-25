import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';
import { icons } from './icons';

// Inspiré de « Whip » d'Acolyte Fight : un coup de fouet de MÊLÉE instantané dans
// un arc devant toi — dégâts + forte poussée sur tout ce qui est à portée. Pas de
// projectile qui voyage : l'effet est immédiat, seul un arc visuel est affiché.
const RANGE = 155; // portée du coup
const HALF_ARC = Math.PI / 4; // demi-angle (±45° devant la visée)
const DAMAGE = 20;
const KNOCKBACK = 520;
const VISUAL_LIFE = 0.18; // durée de l'arc affiché
const COOLDOWN = 5;
const COLOR = '#e0e7ff';

/** Sort : coup de fouet de mêlée en arc, dégâts et poussée immédiats. */
export const whip: Spell = {
  id: 'whip',
  name: 'Fouet',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Cingle d’un coup de fouet en arc devant toi : dégâts et forte poussée, ' +
    'instantanés. Redoutable au corps à corps pour repousser qui te colle.',
  preview: 'whip',
  icon: icons.whip,
  cast(world, caster) {
    const fx = caster.facing.x;
    const fy = caster.facing.y;
    for (const p of world.players) {
      if (!p.alive || p.id === caster.id) continue;
      const dx = p.pos.x - caster.pos.x;
      const dy = p.pos.y - caster.pos.y;
      const d = Math.hypot(dx, dy);
      if (d > RANGE + p.radius) continue;
      const nx = d > 1e-3 ? dx / d : fx;
      const ny = d > 1e-3 ? dy / d : fy;
      // Dans l'arc frontal ? (produit scalaire visée · direction cible)
      if (nx * fx + ny * fy < Math.cos(HALF_ARC)) continue;
      applyDamage(p, DAMAGE);
      p.knockback.x = nx * KNOCKBACK;
      p.knockback.y = ny * KNOCKBACK;
      p.slideTime = 0.5;
    }
    // Arc visuel (ne fait rien d'autre que s'estomper).
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: 0, y: 0 },
      radius: RANGE,
      color: COLOR,
      life: VISUAL_LIFE,
      dead: false,
      behavior: 'whip',
      renderKind: 'whip',
      params: { dx: fx, dy: fy, half: HALF_ARC, life0: VISUAL_LIFE },
    });
  },
};

/** Fouet : l'arc visuel se contente de s'estomper puis disparaît. */
export const whipBehavior: ProjectileBehavior = {
  update(_world, proj, dt) {
    // Reste ancré sur le lanceur pendant sa brève durée.
    const owner = _world.players.find((o) => o.id === proj.ownerId);
    if (owner) {
      proj.pos.x = owner.pos.x;
      proj.pos.y = owner.pos.y;
    }
    proj.life -= dt;
    if (proj.life <= 0) proj.dead = true;
  },
};
