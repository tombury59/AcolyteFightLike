import type { Player } from './types';
import { CONFIG } from './config';

/**
 * Primitive de dégâts fournie par le moteur. Les sorts la composent ;
 * le moteur, lui, n'a aucune connaissance des sorts.
 *
 * Note : le bouclier (Reflect) ne bloque PLUS les dégâts ici — il renvoie les
 * projectiles en amont (voir `updateShields` dans simulation.ts), fidèle au jeu
 * de base où le bouclier est inefficace contre les AoE.
 */
export function applyDamage(target: Player, amount: number): void {
  if (amount <= 0) return;
  target.health -= amount;
  if (target.health <= 0) {
    target.health = 0;
    target.alive = false;
  }
}

/** Soigne une cible sans dépasser sa vie maximale (utilisé par le vol de vie). */
export function heal(target: Player, amount: number): void {
  if (amount <= 0 || !target.alive) return;
  target.health = Math.min(CONFIG.player.maxHealth, target.health + amount);
}
