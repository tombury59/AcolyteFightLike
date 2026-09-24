import type { Player, WorldState } from './types';
import { vec } from './vec';
import { CONFIG } from './config';

export function createPlayer(id: string, x: number, y: number, color: string, isBot = false): Player {
  return {
    id,
    pos: vec(x, y),
    vel: vec(0, 0),
    radius: CONFIG.player.radius,
    speed: CONFIG.player.speed,
    health: CONFIG.player.maxHealth,
    alive: true,
    facing: vec(1, 0),
    color,
    isBot,
  };
}

/** Crée un monde neuf. En phase 1-2 : un seul joueur au centre. */
export function createWorld(): WorldState {
  const center = vec(0, 0);
  return {
    tick: 0,
    time: 0,
    players: [createPlayer('you', center.x, center.y, '#4ade80', false)],
    arenaCenter: center,
    arenaRadius: CONFIG.arena.startRadius,
  };
}
