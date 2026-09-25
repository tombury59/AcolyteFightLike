// Progression du joueur : XP, niveaux, points de sort. Fonctions PURES (aucune
// dépendance au moteur ni au stockage) -> faciles à tester et à réutiliser.

/** XP cumulée nécessaire pour ATTEINDRE le niveau `l` (l >= 1). Niveau 1 = 0 XP. */
export function cumXpForLevel(l: number): number {
  const n = Math.max(1, Math.floor(l)) - 1;
  return 50 * n * (n + 1); // 0, 100, 300, 600, 1000, 1500, ...
}

/** Niveau (>= 1) correspondant à une quantité d'XP cumulée. */
export function levelFromXp(xp: number): number {
  let l = 1;
  while (cumXpForLevel(l + 1) <= xp) l++;
  return l;
}

/** XP acquise DANS le niveau courant (depuis le seuil de ce niveau). */
export function xpIntoLevel(xp: number): number {
  return xp - cumXpForLevel(levelFromXp(xp));
}

/** XP totale requise pour passer du niveau courant au suivant. */
export function xpToNextLevel(xp: number): number {
  const l = levelFromXp(xp);
  return cumXpForLevel(l + 1) - cumXpForLevel(l);
}

/** Total de points de sort accordés à un niveau donné (1 point par niveau après le 1er). */
export function totalPointsForLevel(level: number): number {
  return Math.max(0, Math.floor(level) - 1);
}

/** XP gagnée pour une manche : survie + éliminations + bonus de victoire. */
export function xpForMatch(won: boolean, survivedSec: number, kills: number): number {
  return Math.round(Math.max(0, survivedSec) + kills * 10 + (won ? 50 : 0));
}
