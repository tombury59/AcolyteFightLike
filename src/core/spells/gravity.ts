import type { Spell, ProjectileBehavior } from './spell';

// Fidèle à « Ensnare » (gravity) : crée un puits qui retient l'ennemi sur place
// (et l'empêche de lancer des sorts) pendant que tu le canardes.
const RANGE = 260; // distance de dépôt du puits
const DURATION = 2; // durée du piège
const RADIUS = 70; // rayon d'emprise
const PULL = 900; // force de rappel vers le centre
const COOLDOWN = 7.5;
const COLOR = '#0ace00';

/** Sort : dépose un puits gravitationnel qui immobilise les ennemis proches. */
export const gravity: Spell = {
  id: 'gravity',
  name: 'Piège',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Retiens un ennemi sur place pendant que tu déverses tes salves sur lui. ' +
    'Pris dans le puits, il ne peut plus ni bouger ni lancer de sorts.',
  preview: 'orb',
  icon: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 110 10 5 5 0 010-10zm0 3a2 2 0 100 4 2 2 0 000-4z"/>',
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x + dir.x * RANGE, y: caster.pos.y + dir.y * RANGE },
      vel: { x: 0, y: 0 },
      radius: RADIUS,
      color: COLOR,
      life: DURATION,
      dead: false,
      behavior: 'gravity',
      renderKind: 'well',
      params: {},
    });
  },
};

/** Puits : attire les ennemis proches vers le centre et les fige (immobilise + silence). */
export const gravityBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const dx = proj.pos.x - p.pos.x;
      const dy = proj.pos.y - p.pos.y;
      const d = Math.hypot(dx, dy);
      if (d > proj.radius + p.radius) continue;
      // Rappel vers le centre + immobilisation/silence (frozenTime rafraîchi).
      p.pos.x += (dx / (d || 1)) * PULL * dt;
      p.pos.y += (dy / (d || 1)) * PULL * dt;
      p.frozenTime = Math.max(p.frozenTime, 0.15);
    }
  },
};
