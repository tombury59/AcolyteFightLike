import type { Spell, ProjectileBehavior } from './spell';
import { dist } from '../vec';
import { applyDamage } from '../combat';

// Fidèle à « Orbiter » (boomerang) : le projectile tourne autour de toi à distance
// orbitale et blesse les ennemis qu'il croise, jusqu'à expiration.
const SPEED = 620;
const ORBIT = 130; // rayon d'orbite autour du lanceur
const DAMAGE = 12;
const LIFETIME = 4;
const RADIUS = 7;
const HIT_CD = 0.25; // délai anti-multi-contact sur une même cible
const COOLDOWN = 9;
const COLOR = '#ff00ff';

/** Sort : un projectile qui orbite autour de toi et fauche les ennemis proches. */
export const boomerang: Spell = {
  id: 'boomerang',
  name: 'Orbiteur',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Tourne, encore et encore, autour de toi. Suit tes ennemis à distance ' +
    'orbitale jusqu’à les toucher : reste mobile pour balayer large.',
  preview: 'orb',
  icon: '<path d="M12 3a9 9 0 106.5 15.3l-2.2-2A6 6 0 1112 6z"/>',
  cast(world, caster) {
    const dir = caster.facing;
    // Départ tangent : perpendiculaire à la visée pour amorcer l'orbite.
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x + dir.x * ORBIT, y: caster.pos.y + dir.y * ORBIT },
      vel: { x: -dir.y * SPEED, y: dir.x * SPEED },
      radius: RADIUS,
      color: COLOR,
      life: LIFETIME,
      dead: false,
      behavior: 'orbiter',
      renderKind: 'circle',
      params: { dmg: DAMAGE, hitCd: 0, reflectable: 1 },
    });
  },
};

/** Orbiteur : maintenu sur une orbite autour du lanceur, blesse ce qu'il touche. */
export const orbiter: ProjectileBehavior = {
  update(world, proj, dt) {
    const owner = world.players.find((o) => o.id === proj.ownerId);
    if (!owner || !owner.alive) {
      proj.dead = true;
      return;
    }
    // Correction : garde le projectile à distance ORBIT, vitesse tangentielle.
    const rx = proj.pos.x - owner.pos.x;
    const ry = proj.pos.y - owner.pos.y;
    const r = Math.hypot(rx, ry) || 1;
    const nx = rx / r;
    const ny = ry / r;
    const tx = -ny; // tangente
    const ty = nx;
    const speed = Math.hypot(proj.vel.x, proj.vel.y) || SPEED;
    // Vitesse = composante tangentielle + rappel radial vers l'orbite.
    const radialPull = (ORBIT - r) * 6;
    proj.vel.x = tx * speed + nx * radialPull;
    proj.vel.y = ty * speed + ny * radialPull;
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.dead = true;
      return;
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
