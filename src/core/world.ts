import type { Player, WorldState } from './types';
import { vec } from './vec';
import { CONFIG } from './config';
import { DEFAULT_SPELL_SET, SPELLS } from './spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';

/** Tire un loadout aléatoire de `n` sorts distincts parmi tous les sorts existants. */
function randomLoadout(n: number): (string | null)[] {
  const ids = Object.keys(SPELLS).sort(() => Math.random() - 0.5);
  const slots: (string | null)[] = Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < Math.min(n, SLOT_COUNT); i++) slots[i] = ids[i] ?? null;
  return slots;
}

export function createPlayer(
  id: string,
  name: string,
  x: number,
  y: number,
  color: string,
  spellSlots: (string | null)[],
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
    shieldTime: 0,
    frozenTime: 0,
    chargeTime: 0,
    grapple: null,
    aimPoint: vec(x + 1, y),
    slideTime: 0,
    grappleHeld: false,
    slowTime: 0,
    rootTime: 0,
    pull: null,
    color,
    isBot,
    spellSlots: [...spellSlots],
    cooldowns: {},
  };
}

const BOT_COLORS = ['#f87171', '#c084fc', '#fbbf24'];

/**
 * Crée un monde neuf : le joueur au centre (avec son loadout) + des bots.
 * `loadout` : sorts équipés par emplacement pour le joueur local.
 */
export function createWorld(
  playerName = 'Acolyte',
  loadout: (string | null)[] = DEFAULT_SPELL_SET,
): WorldState {
  const center = vec(0, 0);
  const players = [createPlayer('you', playerName, center.x, center.y, '#4ade80', loadout, false)];

  const botSlots = [...DEFAULT_SPELL_SET];
  const spawnRadius = 320;
  BOT_COLORS.forEach((color, i) => {
    const angle = (i / BOT_COLORS.length) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * spawnRadius;
    const y = center.y + Math.sin(angle) * spawnRadius;
    players.push(createPlayer(`bot${i}`, `Bot ${i + 1}`, x, y, color, botSlots, true));
  });

  return {
    tick: 0,
    time: 0,
    players,
    projectiles: [],
    nextProjectileId: 1,
    arenaCenter: center,
    arenaRadius: CONFIG.arena.startRadius,
    arenaShrinks: true,
  };
}

const DEMO_COLORS = ['#f87171', '#c084fc', '#fbbf24', '#4ade80', '#38bdf8'];

/**
 * Monde de démonstration pour le fond du menu : uniquement des bots qui
 * s'affrontent, arène fixe (ne rétrécit pas). Sert de décor animé.
 * Les bots apparaissent à des positions ALÉATOIRES dans l'arène.
 */
export function createDemoWorld(): WorldState {
  const center = vec(0, 0);

  // Nombre et couleurs aléatoires (4 ou 5 bots parmi la palette mélangée).
  const colors = [...DEMO_COLORS].sort(() => Math.random() - 0.5);
  const count = 4 + Math.floor(Math.random() * 2);
  const maxR = CONFIG.arena.startRadius * 0.72;

  const players = colors.slice(0, count).map((color, i) => {
    // Distribution uniforme dans le disque (sqrt sur le rayon).
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * maxR;
    const x = center.x + Math.cos(angle) * r;
    const y = center.y + Math.sin(angle) * r;
    // Chaque bot de démo a un loadout ALÉATOIRE (3 ou 4 sorts) pour un décor varié.
    const botSlots = randomLoadout(3 + Math.floor(Math.random() * 2));
    return createPlayer(`demo${i}`, `Bot ${i + 1}`, x, y, color, botSlots, true);
  });

  return {
    tick: 0,
    time: 0,
    players,
    projectiles: [],
    nextProjectileId: 1,
    arenaCenter: center,
    arenaRadius: CONFIG.arena.startRadius,
    arenaShrinks: false,
  };
}
