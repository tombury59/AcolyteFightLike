import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Firesplatter » (firespray) d'Acolyte Fight : une gerbe de petits
// projectiles rapides tirés dans un large arc devant soi. Colle l'ennemi pour
// concentrer tous les projectiles sur lui.
const COUNT = 10; // nombre de projectiles dans la gerbe
const SPREAD = Math.PI / 3; // largeur de l'arc (~60°)
const SPEED = 640; // rapide
const SPEED_JITTER = 0.25; // variation de vitesse -> étalement (le « balayage »)
const RADIUS = 4;
const DAMAGE = 5; // faible par projectile, fort si tout touche
const LIFETIME = 0.32; // courte portée
const COOLDOWN = 5;
const COLOR = '#ff0044';

/** Sort : projette une gerbe de feu en arc large devant l'utilisateur. */
export const arc: Spell = {
  id: 'arc',
  name: 'Gerbe de feu',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Crache un flot de feu dans un large arc devant toi. Rapproche-toi pour ' +
    'concentrer tous les projectiles sur une seule cible et maximiser les dégâts.',
  preview: 'spray',
  icon: icons.arc,
  cast(world, caster) {
    const base = Math.atan2(caster.facing.y, caster.facing.x);
    for (let i = 0; i < COUNT; i++) {
      // Angle réparti sur l'arc, du bord gauche au bord droit, avec un peu d'aléa.
      const t = COUNT > 1 ? i / (COUNT - 1) : 0.5;
      const angle = base - SPREAD / 2 + t * SPREAD + (Math.random() - 0.5) * (SPREAD / COUNT);
      const speed = SPEED * (1 + (Math.random() - 0.5) * 2 * SPEED_JITTER);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      world.projectiles.push({
        id: world.nextProjectileId++,
        ownerId: caster.id,
        pos: {
          x: caster.pos.x + dx * (caster.radius + RADIUS + 2),
          y: caster.pos.y + dy * (caster.radius + RADIUS + 2),
        },
        vel: { x: dx * speed, y: dy * speed },
        radius: RADIUS,
        color: COLOR,
        life: LIFETIME,
        dead: false,
        behavior: 'projectileHit',
        renderKind: 'bolt',
        params: { dmg: DAMAGE, reflectable: 1 },
      });
    }
  },
};
