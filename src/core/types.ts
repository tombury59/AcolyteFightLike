export interface Vec2 {
  x: number;
  y: number;
}

/** Ce que produit la couche d'entrée (clavier + souris) à chaque frame. */
export interface PlayerInput {
  /** Direction de déplacement souhaitée, normalisée (0,0 si immobile). */
  move: Vec2;
  /** Position visée dans le repère MONDE (curseur souris). */
  aim: Vec2;
  /**
   * Si vrai, la visée suit la direction de déplacement (souris inactive) :
   * mode « pad friendly ». La simulation ignore alors `aim`.
   */
  aimFromMove: boolean;
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
