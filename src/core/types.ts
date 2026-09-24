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
}

export interface WorldState {
  tick: number;
  /** Temps de jeu écoulé en secondes. */
  time: number;
  players: Player[];
  /** Centre de l'arène (monde). */
  arenaCenter: Vec2;
  /** Rayon courant de l'arène, décroît avec le temps. */
  arenaRadius: number;
}
