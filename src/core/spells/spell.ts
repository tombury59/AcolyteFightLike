/** Définition data-driven d'un sort. Ajouter un sort = ajouter une entrée ici. */
export type SpellType = 'projectile' | 'dash';

interface BaseSpell {
  id: string;
  name: string;
  type: SpellType;
  /** Temps de recharge en secondes. */
  cooldown: number;
  /** Couleur d'affichage (HUD + projectile). */
  color: string;
}

export interface ProjectileSpell extends BaseSpell {
  type: 'projectile';
  speed: number;
  /** Dégâts PAR SECONDE tant que la cible reste dans le projectile. */
  damage: number;
  radius: number;
  /** Durée de vie du projectile (s) -> détermine la portée. */
  lifetime: number;
  /**
   * Vitesse à laquelle la cible est poussée (portée) dans la direction du tir.
   * Proche de `speed` -> la cible est emportée sur toute la trajectoire.
   */
  knockback: number;
  /** Si vrai, le projectile traverse les cibles au lieu de disparaître à l'impact. */
  pierce: boolean;
}

export interface DashSpell extends BaseSpell {
  type: 'dash';
  /** Distance de téléportation dans la direction de visée. */
  distance: number;
}

export type Spell = ProjectileSpell | DashSpell;
