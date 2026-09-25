// Arbre de talents : décrit les DÉPENDANCES entre sorts (prérequis parent -> enfant),
// leur palier (tier), leur branche thématique, leur coût en points, et leur position
// dans la grille de rendu SVG (col = palier, row = ligne de branche).
//
// Ce fichier ne connaît que des `id` de sorts : le moteur reste agnostique. L'ordre du
// tableau `SPELL_TREE` = ordre du plus simple au plus complexe/fort.

export interface TreeNode {
  id: string;
  /** Palier de puissance/complexité (1 = racine gratuite ... 5 = ultime). */
  tier: number;
  /** Branche thématique (pour la couleur/le regroupement visuel). */
  branch: 'fire' | 'hunt' | 'move' | 'shock' | 'melee';
  /** Colonne dans la grille SVG (0 = racines à gauche). */
  col: number;
  /** Ligne dans la grille SVG. */
  row: number;
  /** Coût en points de sort (0 pour les racines). */
  cost: number;
  /** Sorts prérequis : tous doivent être débloqués pour débloquer celui-ci. */
  requires: string[];
}

/** Sorts débloqués gratuitement dès le niveau 1 (racines de l'arbre). */
export const ROOT_SPELLS = ['fireball', 'dash'] as const;

/**
 * Définition de l'arbre. `col` = palier (tier - 1), `row` = ligne de branche.
 * Lignes : 0/1 = feu (deux sous-branches), 2/3 = traque, 4 = mobilité,
 * 5 = mêlée, 6 = choc/contrôle. Racines (fireball/dash) au bord gauche.
 * Coûts par palier : col1 = 1, col2 = 1, col3 = 2, col4 = 3.
 */
export const SPELL_TREE: TreeNode[] = [
  // --- Racines (col 0) ---
  { id: 'fireball', tier: 1, branch: 'fire', col: 0, row: 1, cost: 0, requires: [] },
  { id: 'dash', tier: 1, branch: 'move', col: 0, row: 5, cost: 0, requires: [] },

  // --- Feu, sous-branche A (offense directe) ---
  { id: 'arc', tier: 2, branch: 'fire', col: 1, row: 0, cost: 1, requires: ['fireball'] },
  { id: 'bouncer', tier: 3, branch: 'fire', col: 2, row: 0, cost: 1, requires: ['arc'] },
  { id: 'meteor', tier: 4, branch: 'fire', col: 3, row: 0, cost: 2, requires: ['bouncer'] },
  { id: 'supernova', tier: 5, branch: 'fire', col: 4, row: 0, cost: 3, requires: ['meteor'] },

  // --- Feu, sous-branche B (explosions de zone) ---
  { id: 'triplet', tier: 2, branch: 'fire', col: 1, row: 1, cost: 1, requires: ['fireball'] },
  { id: 'flamestrike', tier: 3, branch: 'fire', col: 2, row: 1, cost: 1, requires: ['triplet'] },
  { id: 'meteorite', tier: 4, branch: 'fire', col: 3, row: 1, cost: 2, requires: ['flamestrike'] },

  // --- Branche Traque (projectiles guidés) ---
  { id: 'homing', tier: 2, branch: 'hunt', col: 1, row: 2, cost: 1, requires: ['fireball'] },
  { id: 'drain', tier: 3, branch: 'hunt', col: 2, row: 2, cost: 1, requires: ['homing'] },
  { id: 'link', tier: 4, branch: 'hunt', col: 3, row: 2, cost: 2, requires: ['drain'] },
  { id: 'grapple', tier: 5, branch: 'hunt', col: 4, row: 2, cost: 3, requires: ['link'] },
  { id: 'boomerang', tier: 3, branch: 'hunt', col: 2, row: 3, cost: 1, requires: ['homing'] },
  { id: 'halo', tier: 4, branch: 'hunt', col: 3, row: 3, cost: 2, requires: ['boomerang'] },

  // --- Branche Mobilité / défense ---
  { id: 'teleport', tier: 2, branch: 'move', col: 1, row: 4, cost: 1, requires: ['dash'] },
  { id: 'shield', tier: 3, branch: 'move', col: 2, row: 4, cost: 1, requires: ['teleport'] },
  { id: 'whirlwind', tier: 4, branch: 'move', col: 3, row: 4, cost: 2, requires: ['shield'] },

  // --- Branche Mêlée ---
  { id: 'thrust', tier: 2, branch: 'melee', col: 1, row: 5, cost: 1, requires: ['dash'] },
  { id: 'whip', tier: 3, branch: 'melee', col: 2, row: 5, cost: 1, requires: ['thrust'] },

  // --- Branche Choc / contrôle ---
  { id: 'bolt', tier: 2, branch: 'shock', col: 1, row: 6, cost: 1, requires: ['dash'] },
  { id: 'gravity', tier: 3, branch: 'shock', col: 2, row: 6, cost: 1, requires: ['bolt'] },
  { id: 'scourge', tier: 4, branch: 'shock', col: 3, row: 6, cost: 2, requires: ['gravity'] },
  { id: 'laser', tier: 5, branch: 'shock', col: 4, row: 6, cost: 3, requires: ['scourge'] },
  { id: 'mines', tier: 4, branch: 'shock', col: 3, row: 5, cost: 2, requires: ['gravity'] },
];

const BY_ID = new Map<string, TreeNode>(SPELL_TREE.map((n) => [n.id, n]));

/** Nœud d'arbre d'un sort (ou `undefined` s'il n'est pas dans l'arbre). */
export function nodeOf(id: string): TreeNode | undefined {
  return BY_ID.get(id);
}

/** Coût en points d'un sort (0 s'il est inconnu ou racine). */
export function costOf(id: string): number {
  return BY_ID.get(id)?.cost ?? 0;
}

/** Sorts prérequis d'un sort donné. */
export function prereqsOf(id: string): string[] {
  return BY_ID.get(id)?.requires ?? [];
}

/** Une racine est-elle ce sort ? */
export function isRoot(id: string): boolean {
  return (ROOT_SPELLS as readonly string[]).includes(id);
}

/**
 * Le sort est-il déblocable MAINTENANT ? (pas encore débloqué, connu de l'arbre,
 * et tous ses prérequis déjà débloqués). Ne teste PAS les points disponibles.
 */
export function isUnlockable(id: string, unlocked: Set<string>): boolean {
  const node = BY_ID.get(id);
  if (!node || unlocked.has(id)) return false;
  return node.requires.every((r) => unlocked.has(r));
}

/** Liste des sorts du plus simple au plus complexe (ordre du tableau). */
export function spellOrder(): string[] {
  return SPELL_TREE.map((n) => n.id);
}
