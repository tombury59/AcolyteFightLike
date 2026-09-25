import type { Spell, ProjectileBehavior } from './spell';
import type { Projectile, WorldState } from '../types';
import { dist } from '../vec';
import { icons } from './icons';

// Inspiré de « Mines » d'Acolyte Fight : dépose un éventail de mines qui se posent
// devant toi et explosent quand un ennemi s'approche (dégâts + poussée de zone).
const COUNT = 5;
const SPREAD = 0.9; // éventail de dépôt (~52°)
const THROW_SPEED = 520; // vitesse de lancer avant de se poser
const DRAG = 6; // décélération : les mines s'immobilisent vite
const RADIUS = 8;
const ARM = 0.35; // délai d'amorçage (ne saute pas sur le lanceur au dépôt)
const TRIGGER = 40; // distance de déclenchement autour de la mine
const BLAST_RADIUS = 62;
const BLAST_DAMAGE = 18;
const BLAST_IMPULSE = 360;
const BLAST_FUSE = 0.05;
const LIFETIME = 8; // durée avant de se dissiper
const COOLDOWN = 9;
const COLOR = '#a0f000';

/** Sort : sème un éventail de mines de proximité devant toi. */
export const mines: Spell = {
  id: 'mines',
  name: 'Mines',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Sème un éventail de mines qui se posent devant toi et explosent dès qu’un ' +
    'ennemi s’en approche : dégâts et poussée. Idéal pour couper une trajectoire.',
  preview: 'mines',
  icon: icons.mines,
  cast(world, caster) {
    const base = Math.atan2(caster.facing.y, caster.facing.x);
    for (let i = 0; i < COUNT; i++) {
      const t = COUNT > 1 ? i / (COUNT - 1) : 0.5;
      const angle = base - SPREAD / 2 + t * SPREAD;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: {
          x: caster.pos.x + dx * (caster.radius + RADIUS + 2),
          y: caster.pos.y + dy * (caster.radius + RADIUS + 2),
        },
        vel: { x: dx * THROW_SPEED, y: dy * THROW_SPEED },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'mine',
        renderKind: 'well',
        params: { arm: ARM, trigger: TRIGGER },
      });
    }
  },
};

/** Fait détoner une explosion `nova` à la position d'une mine. */
function detonate(world: WorldState, proj: Projectile): void {
  world.projectiles.push({
    id: world.nextProjectileId++,
    ownerId: proj.ownerId,
    pos: { x: proj.pos.x, y: proj.pos.y },
    vel: { x: 0, y: 0 },
    radius: BLAST_RADIUS,
    color: proj.color,
    life: BLAST_FUSE,
    dead: false,
    behavior: 'nova',
    renderKind: 'nova',
    params: { radius: BLAST_RADIUS, dmg: BLAST_DAMAGE, impulse: BLAST_IMPULSE, fuse0: BLAST_FUSE },
  });
}

/** Mine : glisse puis se pose, s'amorce, et explose à l'approche d'un ennemi. */
export const mineBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    // Décélération jusqu'à l'arrêt (la mine se pose).
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.vel.x -= proj.vel.x * DRAG * dt;
    proj.vel.y -= proj.vel.y * DRAG * dt;

    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true; // se dissipe sans exploser après sa durée de vie
      return;
    }
    if (proj.params.arm > 0) {
      proj.params.arm -= dt;
      return; // pas encore armée
    }
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.pos, p.pos) <= proj.params.trigger + p.radius) {
        detonate(world, proj);
        proj.dead = true;
        return;
      }
    }
  },
};
