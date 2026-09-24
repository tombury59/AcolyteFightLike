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
  /** Nom affiché (pseudo du joueur ou nom de bot). */
  name: string;
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
  /** Temps de bouclier restant en secondes (bloque les dégâts si > 0). */
  shieldTime: number;
  /** Grappin actif : cible liée, temps restant, longueur de laisse et force d'éjection. */
  grapple: { targetId: string; time: number; tether: number; launch: number } | null;
  color: string;
  isBot: boolean;
  /** Emplacements de sorts (longueur fixe, `null` = vide). L'index = la touche. */
  spellSlots: (string | null)[];
  /** Temps de recharge restant par sort (id -> secondes). */
  cooldowns: Record<string, number>;
}

export interface Projectile {
  id: number;
  ownerId: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  color: string;
  /** Durée de vie restante en secondes (gérée par le comportement). */
  life: number;
  /** Marqué true par son comportement quand il doit être retiré. */
  dead: boolean;
  /** Clé du comportement dans le registre des sorts (le moteur l'appelle sans le connaître). */
  behavior: string;
  /** Forme de rendu : 'circle' (défaut), 'beam', 'arc'. */
  renderKind: string;
  /** Paramètres propres au sort, lus UNIQUEMENT par son comportement / le rendu. */
  params: Record<string, number>;
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
  /** Rayon courant de l'arène, décroît avec le temps si `arenaShrinks`. */
  arenaRadius: number;
  /** Si vrai, l'arène rétrécit au fil du temps (désactivé en mode démo). */
  arenaShrinks: boolean;
}
