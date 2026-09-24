import type { Spell, ProjectileBehavior } from './spell';
import { fireball, projectileHit } from './fireball';
import { dash } from './dash';
import { teleport } from './teleport';
import { shield } from './shield';
import { grapple, grappleHook } from './grapple';
import { laser, beamBehavior } from './laser';
import { arc } from './arc';
import { bolt, repulsor } from './bolt';

/**
 * Registre des sorts. Ajouter un sort = créer son fichier puis l'enregistrer ICI.
 * Le moteur (simulation) lit ce registre sans connaître aucun sort en particulier.
 */
export const SPELLS: Record<string, Spell> = {
  [fireball.id]: fireball,
  [bolt.id]: bolt,
  [laser.id]: laser,
  [arc.id]: arc,
  [grapple.id]: grapple,
  [dash.id]: dash,
  [teleport.id]: teleport,
  [shield.id]: shield,
};

/** Registre des comportements de projectiles, indexés par leur clé `behavior`. */
export const PROJECTILE_BEHAVIORS: Record<string, ProjectileBehavior> = {
  projectileHit,
  repulsor,
  beam: beamBehavior,
  grappleHook,
};

/** Sorts équipés par défaut, dans l'ordre des emplacements. */
export const DEFAULT_SPELL_SET = [fireball.id, dash.id];
