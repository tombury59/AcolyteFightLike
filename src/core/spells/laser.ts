import type { Spell, ProjectileBehavior } from './spell';
import { applyDamage } from '../combat';
import { icons } from './icons';

// Fidèle à « Acolyte Beam » (kamehameha) : courte charge, puis un faisceau
// continu très puissant. Le lanceur reste immobile pendant toute la durée
// (dans le jeu de base, bouger annule le faisceau).
const CHARGE = 0.3; // charge avant émission (s)
const DURATION = 1.6; // durée du faisceau (s)
const DPS = 60; // dégâts par seconde de contact (peut nettoyer une barre entière)
const WIDTH = 5; // demi-largeur du rayon
const LENGTH = 4000; // portée « illimitée »
const COOLDOWN = 6;
const COLOR = '#44ddff';

/** Sort : déchaîne un faisceau continu dévastateur ; immobilise le lanceur. */
export const laser: Spell = {
  id: 'laser',
  name: 'Faisceau',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Déchaîne un faisceau si puissant qu’il peut anéantir un ennemi à pleine vie ' +
    'en quelques secondes. Tu restes immobile le temps de le canaliser.',
  preview: 'beam',
  icon: icons.laser,
  cast(world, caster) {
    // Le lanceur est ancré pendant la charge ET l'émission.
    caster.frozenTime = CHARGE + DURATION;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      // Origine ET direction figées à l'instant du lancement.
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: 0, y: 0 },
      radius: WIDTH,
      color: COLOR,
      life: CHARGE + DURATION,
      dead: false,
      behavior: 'beam',
      renderKind: 'beam',
      params: {
        dps: DPS,
        width: WIDTH,
        length: LENGTH,
        dx: caster.facing.x,
        dy: caster.facing.y,
        dur: DURATION,
      },
    });
  },
};

/**
 * Faisceau : pendant la charge (première `params.charge` seconde) il ne fait rien,
 * puis il blesse en continu tout ennemi le long de la ligne. Origine et direction
 * restent figées au lancement.
 */
export const beamBehavior: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }
    const owner = world.players.find((p) => p.id === proj.ownerId);
    if (!owner || !owner.alive) {
      proj.dead = true; // s'arrête si le lanceur meurt
      return;
    }
    // Phase de charge : tant que la vie restante dépasse la durée d'émission,
    // le faisceau se charge encore et n'inflige pas de dégâts.
    if (proj.life > proj.params.dur) return;

    const dx = proj.params.dx;
    const dy = proj.params.dy;
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
