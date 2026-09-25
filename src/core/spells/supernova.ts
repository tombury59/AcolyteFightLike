import type { Spell } from './spell';
import { icons } from './icons';

// Supernova revisitée : une longue incantation, puis un gros faisceau dévastateur.
// Le lanceur reste immobile pendant toute la charge et le tir (comme le faisceau).
const CHARGE = 1.3; // longue charge (télégraphe)
const DURATION = 0.7; // durée du gros faisceau
const DPS = 150; // très gros dégâts
const WIDTH = 15; // faisceau large
const LENGTH = 4000; // portée « illimitée »
const COOLDOWN = 10;
const COLOR = '#ff9a00';

/** Sort : longue charge puis un large faisceau qui inflige d'énormes dégâts. */
export const supernova: Spell = {
  id: 'supernova',
  name: 'Supernova',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Une longue incantation… puis un immense faisceau dévastateur. Reste ' +
    'immobile le temps de la charge : la récompense en dégâts est colossale.',
  preview: 'beam',
  icon: icons.supernova,
  cast(world, caster) {
    // Immobilisé pendant la charge ET l'émission du faisceau.
    caster.frozenTime = CHARGE + DURATION;
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
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
