import type { Player, Projectile, WorldState } from '../types';

/**
 * Un sort : ses métadonnées (pour le HUD/menu) + son effet.
 * Le moteur invoque `cast` sans jamais connaître ce que fait le sort.
 */
export interface Spell {
  id: string;
  name: string;
  /** Temps de recharge en secondes. */
  cooldown: number;
  /** Couleur d'affichage (HUD). */
  color: string;
  /** Applique l'effet du sort (spawn de projectile, dash, etc.). */
  cast(world: WorldState, caster: Player): void;
}

/**
 * Comportement par frame d'un projectile, propre au sort qui l'a créé.
 * Le moteur l'appelle via le registre, sans connaître son contenu.
 */
export interface ProjectileBehavior {
  update(world: WorldState, projectile: Projectile, dt: number): void;
}
