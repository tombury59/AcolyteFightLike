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
  /** Temps d'immobilisation restant (ex. pendant le laser) : le joueur ne se déplace pas. */
  frozenTime: number;
  /** Fenêtre de charge (ex. dash) durant laquelle il bouscule fort les ennemis heurtés. */
  chargeTime: number;
  /** Dégâts infligés aux ennemis traversés pendant la charge (0 = charge sans dégât). */
  chargeDamage: number;
  /** Ids déjà touchés par la charge en cours (évite de blesser plusieurs fois). */
  chargeHits: string[];
  /**
   * Grappin actif (sort maintenu). `flying` = le crochet vole vers sa cible ;
   * `linked` = un ennemi est accroché et balancé tant que le bouton est tenu.
   * `hookPos` sert au rendu du câble pendant le vol du crochet.
   */
  grapple:
    | { phase: 'flying' | 'linked'; targetId: string | null; time: number; hookPos: Vec2 }
    | null;
  /** Point visé (monde) cette frame : sert à faire tournoyer la cible du grappin. */
  aimPoint: Vec2;
  /** Fenêtre pendant laquelle le recul s'amortit doucement (glissade / lancer de grappin). */
  slideTime: number;
  /** Vrai si la touche du grappin est maintenue cette frame (sinon le lien se coupe). */
  grappleHeld: boolean;
  /** Temps de ralentissement restant (ex. tourbillon) : vitesse réduite tant que > 0. */
  slowTime: number;
  /** Temps d'immobilisation par le Piège (marqueur visuel « stun », effet vert). */
  rootTime: number;
  /** Invulnérabilité restante (phaseOut) : ne subit aucun dégât tant que > 0. */
  invulnTime: number;
  /** Invisibilité restante (vanish) : non ciblable + bonus de vitesse tant que > 0. */
  vanishTime: number;
  /** Brûlure restante (difire...) : subit `burnDps` dégâts/seconde tant que > 0. */
  burnTime: number;
  /** Dégâts par seconde de la brûlure en cours (cumulables). */
  burnDps: number;
  /** Lien d'attraction actif (sort Lien) : attire une cible vers soi pendant un temps. */
  pull: { targetId: string; time: number } | null;
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
