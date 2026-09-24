export interface Vec2 {
  x: number;
  y: number;
}

/** Ce que produit la couche d'entrée à chaque frame. */
export interface PlayerInput {
  /** Point cible dans le repère MONDE : le personnage s'y dirige et vise vers lui. */
  aim: Vec2;
  /** Si vrai, le personnage se déplace vers `aim` (sinon il reste immobile). */
  follow: boolean;
  /** Ids des sorts dont la touche/bouton est enfoncé cette frame. */
  castSpells: string[];
}

export interface Player {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  /** Vitesse de déplacement max en unités monde/seconde. */
  speed: number;
  health: number;
  alive: boolean;
  /** Direction de visée normalisée (pour dessiner l'orientation). */
  facing: Vec2;
  /** Vitesse de recul en cours (s'ajoute au déplacement, s'amortit avec le temps). */
  knockback: Vec2;
  color: string;
  isBot: boolean;
  /** Sorts équipés (ids), affichés dans le HUD. */
  spellSet: string[];
  /** Temps de recharge restant par sort (id -> secondes). */
  cooldowns: Record<string, number>;
}

export interface Projectile {
  id: number;
  ownerId: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  damage: number;
  /** Force de recul transmise à la cible touchée. */
  knockback: number;
  /** Durée de vie restante en secondes. */
  life: number;
  color: string;
}

export interface WorldState {
  tick: number;
  /** Temps de jeu écoulé en secondes. */
  time: number;
  players: Player[];
  projectiles: Projectile[];
  /** Compteur pour attribuer des ids uniques aux projectiles. */
  nextProjectileId: number;
  /** Centre de l'arène (monde). */
  arenaCenter: Vec2;
  /** Rayon courant de l'arène, décroît avec le temps. */
  arenaRadius: number;
}
