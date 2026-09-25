import type { Spell } from './spell';
import { scale } from '../vec';
import { icons } from './icons';

// Fidèle à « Blast » d'Acolyte Fight : un gros projectile lent qui détone en une
// vaste explosion (dégâts + forte poussée). Réutilise le comportement `flamestrike`
// (explosion pilotée par paramètres).
const SPEED = 340; // lent (on le voit venir)
const RADIUS = 15;
const HIT_DAMAGE = 6; // dégât direct à l'impact
const BLAST_RADIUS = 120; // vaste explosion
const BLAST_DAMAGE = 40; // gros dégât de zone
const BLAST_IMPULSE = 520; // forte poussée
const LIFETIME = 1.7;
const COOLDOWN = 7;
const COLOR = '#ff9500';

/** Sort : gros projectile lent qui explose en une large déflagration. */
export const blast: Spell = {
  id: 'blast',
  name: 'Déflagration',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Lance une lourde charge qui détone en une vaste explosion : gros dégâts de ' +
    'zone et forte poussée. Lente à voyager, dévastatrice à l’impact.',
  preview: 'flamestrike',
  icon: icons.blast,
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
      behavior: 'flamestrike', // même comportement, explosion plus grosse (params)
      renderKind: 'circle',
      params: { dmg: HIT_DAMAGE, reflectable: 1, blastR: BLAST_RADIUS, blastDmg: BLAST_DAMAGE, blastImp: BLAST_IMPULSE },
    });
  },
};
