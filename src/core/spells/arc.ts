import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';

const RADIUS = 95; // courte portée
const DPS = 130; // sur une durée courte -> dégâts francs
const LIFETIME = 0.25; // le balayage est bref
const COOLDOWN = 2.5; // moyen
const COLOR = '#facc15';

/** Sort : balayage en demi-cercle devant l'utilisateur, courte portée. */
export const arc: Spell = {
  id: 'arc',
  name: 'Balayage',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Frappe en demi-cercle devant toi à courte portée, infligeant de bons dégâts ' +
    'à tous les ennemis proches. Idéal quand un rival te colle.',
  preview: 'orb',
  icon: '<path d="M4 13a8 8 0 0116 0h-3a5 5 0 00-10 0z"/>',
  cast(world, caster) {
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
      params: { dps: DPS, radius: RADIUS, dx: caster.facing.x, dy: caster.facing.y },
    });
  },
};

/** Balayage : suit le lanceur, blesse les ennemis dans le demi-cercle avant. */
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

    proj.pos.x = owner.pos.x;
    proj.pos.y = owner.pos.y;
    const dx = owner.facing.x;
    const dy = owner.facing.y;
    proj.params.dx = dx;
    proj.params.dy = dy;

    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const rx = p.pos.x - proj.pos.x;
      const ry = p.pos.y - proj.pos.y;
      const d = Math.hypot(rx, ry);
      if (d > proj.params.radius + p.radius) continue;
      // Demi-cercle avant : produit scalaire >= 0 avec la direction visée.
      if (d > 0 && (rx * dx + ry * dy) / d < 0) continue;
      applyDamage(p, proj.params.dps * dt);
    }
  },
};
