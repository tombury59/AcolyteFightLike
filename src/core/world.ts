import type { Player, WorldState } from './types';
import { vec } from './vec';
import { CONFIG } from './config';
import { DEFAULT_SPELL_SET } from './spells/definitions';

export function createPlayer(
  id: string,
  name: string,
  x: number,
  y: number,
  color: string,
  isBot = false,
): Player {
  return {
    id,
    name,
    pos: vec(x, y),
    vel: vec(0, 0),
    radius: CONFIG.player.radius,
    speed: CONFIG.player.speed,
    health: CONFIG.player.maxHealth,
    alive: true,
    facing: vec(1, 0),
    knockback: vec(0, 0),
    color,
    isBot,
    spellSet: [...DEFAULT_SPELL_SET],
    cooldowns: {},
  };
}

const BOT_COLORS = ['#f87171', '#c084fc', '#fbbf24'];

/** Crée un monde neuf : le joueur au centre + des bots répartis en cercle. */
export function createWorld(playerName = 'Acolyte'): WorldState {
  const center = vec(0, 0);
  const players = [createPlayer('you', playerName, center.x, center.y, '#4ade80', false)];

  const spawnRadius = 320;
  BOT_COLORS.forEach((color, i) => {
    const angle = (i / BOT_COLORS.length) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * spawnRadius;
    const y = center.y + Math.sin(angle) * spawnRadius;
    players.push(createPlayer(`bot${i}`, `Bot ${i + 1}`, x, y, color, true));
  });

  return {
    tick: 0,
    time: 0,
    players,
    projectiles: [],
    nextProjectileId: 1,
    arenaCenter: center,
    arenaRadius: CONFIG.arena.startRadius,
  };
}
