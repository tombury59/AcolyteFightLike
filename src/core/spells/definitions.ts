import type { Spell } from './spell';

export const SPELLS: Record<string, Spell> = {
  fireball: {
    id: 'fireball',
    name: 'Boule de feu',
    type: 'projectile',
    cooldown: 1.5,
    color: '#f97316',
    speed: 160, // lente
    damage: 10, // très peu (par seconde de contact)
    radius: 72, // énorme
    lifetime: 4, // traverse presque toute l'arène
    knockback: 180, // ~= vitesse -> emporte la cible sur toute la trajectoire
    pierce: true, // ne disparaît pas à l'impact
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
