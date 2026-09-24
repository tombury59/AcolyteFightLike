import type { Player } from './types';

/**
 * Primitive de dégâts fournie par le moteur. Les sorts la composent ;
 * le moteur, lui, n'a aucune connaissance des sorts.
 */
export function applyDamage(target: Player, amount: number): void {
  target.health -= amount;
  if (target.health <= 0) {
    target.health = 0;
    target.alive = false;
  }
}
