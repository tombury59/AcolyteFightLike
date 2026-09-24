import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';

const DURATION = 1; // durée du faisceau (s)
const DPS = 45; // dégâts par seconde de contact
const WIDTH = 5; // demi-largeur du rayon
const LENGTH = 4000; // portée « illimitée »
const COOLDOWN = 5; // long
const COLOR = '#ef4444';

/** Sort : projette un rayon fin de portée illimitée qui blesse tant qu'il touche. */
export const laser: Spell = {
  id: 'laser',
  name: 'Laser',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Projette un rayon fin de portée illimitée. Inflige des dégâts en continu ' +
    'à tout ennemi qu’il traverse, d’autant plus qu’il reste dans le faisceau.',
  preview: 'orb',
  icon: '<path d="M2 11h14l-3-3h3l5 4-5 4h-3l3-3H2z"/>',
  cast(world, caster) {
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: 0, y: 0 },
      radius: WIDTH,
      color: COLOR,
      life: DURATION,
      dead: false,
      behavior: 'beam',
      renderKind: 'beam',
      params: { dps: DPS, width: WIDTH, length: LENGTH, dx: caster.facing.x, dy: caster.facing.y },
    });
  },
};

/** Faisceau canalisé : suit le lanceur (origine + direction) et blesse le long de la ligne. */
export const beamBehavior: ProjectileBehavior = {
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
    const halfW = proj.params.width;

    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const rx = p.pos.x - proj.pos.x;
      const ry = p.pos.y - proj.pos.y;
      const along = rx * dx + ry * dy; // projection le long du rayon
      if (along < 0 || along > proj.params.length) continue; // derrière ou trop loin
      const perp = Math.abs(rx * -dy + ry * dx); // distance perpendiculaire à la ligne
      if (perp <= halfW + p.radius) {
        applyDamage(p, proj.params.dps * dt);
      }
    }
  },
};
