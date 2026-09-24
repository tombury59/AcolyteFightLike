import type { Spell } from './spell';

export const SPELLS: Record<string, Spell> = {
  fireball: {
    id: 'fireball',
    name: 'Boule de feu',
    type: 'projectile',
    cooldown: 1.5,
    color: '#f97316',
    speed: 540,
    damage: 22,
    radius: 24,
    lifetime: 1.2,
    knockback: 900,
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    type: 'dash',
    cooldown: 2,
    color: '#38bdf8',
    distance: 190,
  },
};

/** Sorts équipés par défaut, dans l'ordre des emplacements. */
export const DEFAULT_SPELL_SET = ['fireball', 'dash'];
