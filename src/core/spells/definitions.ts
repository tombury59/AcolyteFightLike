import type { Spell } from './spell';

export const SPELLS: Record<string, Spell> = {
  fireball: {
    id: 'fireball',
    name: 'Boule de feu',
    type: 'projectile',
    cooldown: 0.45,
    color: '#f97316',
    speed: 620,
    damage: 12,
    radius: 8,
    lifetime: 1.1,
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
