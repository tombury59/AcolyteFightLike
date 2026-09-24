import type { Spell, ProjectileBehavior } from './spell';
import { fireball, fireballOrb } from './fireball';
import { dash } from './dash';

/**
 * Registre des sorts. Ajouter un sort = créer son fichier puis l'enregistrer ICI.
 * Le moteur (simulation) lit ce registre sans connaître aucun sort en particulier.
 */
export const SPELLS: Record<string, Spell> = {
  [fireball.id]: fireball,
  [dash.id]: dash,
};

/** Registre des comportements de projectiles, indexés par leur clé `behavior`. */
export const PROJECTILE_BEHAVIORS: Record<string, ProjectileBehavior> = {
  fireballOrb,
};

/** Sorts équipés par défaut, dans l'ordre des emplacements. */
export const DEFAULT_SPELL_SET = [fireball.id, dash.id];
