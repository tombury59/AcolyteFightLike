import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';

const RADIUS = 100; // rayon du balayage (courte portée)
const HIT = 34; // rayon de la zone de frappe qui balaie
const DPS = 220; // dégâts pendant le passage du point
const LIFETIME = 0.4; // durée du balayage
const COOLDOWN = 2.5; // moyen
const COLOR = '#facc15';

/** Sort : balaie une zone en demi-cercle de gauche à droite devant l'utilisateur. */
export const arc: Spell = {
  id: 'arc',
  name: 'Balayage',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Balaie l’espace devant toi de gauche à droite en demi-cercle, infligeant ' +
    'des dégâts aux ennemis sur le passage. Idéal quand un rival te colle.',
  preview: 'orb',
  icon: '<path d="M4 13a8 8 0 0116 0h-3a5 5 0 00-10 0z"/>',
  cast(world, caster) {
    const fa = Math.atan2(caster.facing.y, caster.facing.x);
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: 0, y: 0 },
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'arc',
      renderKind: 'arc',
      params: { dps: DPS, radius: RADIUS, hit: HIT, dur: LIFETIME, fa, cx: 0, cy: 0, a0: 0, a1: 0 },
    });
  },
};

/** Balayage : un point de frappe glisse le long de l'arc, du côté gauche vers la droite. */
export const arcBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    const owner = world.players.find((p) => p.id === proj.ownerId);
    if (!owner || !owner.alive) {
      proj.dead = true;
      return;
    }

    const cx = owner.pos.x;
    const cy = owner.pos.y;
    const progress = Math.min(1, Math.max(0, 1 - proj.life / proj.params.dur));
    const a0 = proj.params.fa - Math.PI / 2;
    const a1 = a0 + progress * Math.PI;
    proj.params.cx = cx;
    proj.params.cy = cy;
    proj.params.a0 = a0;
    proj.params.a1 = a1;

    // Point de frappe courant qui balaie l'arc.
    const px = cx + Math.cos(a1) * proj.params.radius;
    const py = cy + Math.sin(a1) * proj.params.radius;
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const dx = p.pos.x - px;
      const dy = p.pos.y - py;
      if (Math.hypot(dx, dy) <= proj.params.hit + p.radius) {
        applyDamage(p, proj.params.dps * dt);
      }
    }
  },
};
