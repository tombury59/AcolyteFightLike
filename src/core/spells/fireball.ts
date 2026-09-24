import type { Spell, ProjectileBehavior } from './spell';
import { normalize, sub, len, scale } from '../vec';
import { applyDamage } from '../combat';

const SPEED = 160; // lent
const RADIUS = 72; // énorme
const DPS = 10; // très peu (par seconde de contact)
const LIFETIME = 4; // traverse presque toute l'arène
const KNOCKBACK = 160; // = vitesse -> la cible poussée reste devant l'orbe
const COOLDOWN = 1.5;
const COLOR = '#f97316';

/**
 * Raideur de la correction de pénétration (0..1). On ne replace PAS la cible
 * d'un coup sur la surface (effet de téléportation) : on résorbe une fraction
 * de la pénétration par frame -> poussée fluide, comme un ressort.
 */
const PUSH_STIFFNESS = 0.3;

/** Sort : lance un orbe géant qui pousse la cible devant lui. */
export const fireball: Spell = {
  id: 'fireball',
  name: 'Boule de feu',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Un orbe géant et lent qui traverse tout et pousse les ennemis devant lui. ' +
    'Peu de dégâts, mais idéal pour éjecter un rival hors de l’arène.',
  preview: 'orb',
  cast(world, caster) {
    const dir = caster.facing;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: {
        x: caster.pos.x + dir.x * (caster.radius + RADIUS + 2),
        y: caster.pos.y + dir.y * (caster.radius + RADIUS + 2),
      },
      vel: scale(dir, SPEED),
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'fireballOrb',
      params: { dps: DPS, knockback: KNOCKBACK },
    });
  },
};

/** Comportement de l'orbe : avance, transperce, pousse la cible en douceur. */
export const fireballOrb: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
    }

    const dir = normalize(proj.vel);
    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;

      const surface = proj.radius + p.radius;
      const toP = sub(p.pos, proj.pos);
      const d = len(toP);
      if (d >= surface) continue;

      // Dégâts par seconde tant que la cible reste au contact.
      applyDamage(p, proj.params.dps * dt);

      // Poussée fluide : correction progressive de la pénétration (pas de snap).
      const n = d > 1e-3 ? { x: toP.x / d, y: toP.y / d } : dir;
      const penetration = surface - d;
      const step = penetration * PUSH_STIFFNESS;
      p.pos.x += n.x * step;
      p.pos.y += n.y * step;

      // Élan de portage dans le sens du tir (la cible est emportée devant l'orbe).
      p.knockback.x = dir.x * proj.params.knockback;
      p.knockback.y = dir.y * proj.params.knockback;
    }
  },
};
