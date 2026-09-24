import { SLOT_COUNT } from '../input/keybindings';
import { DEFAULT_SPELL_SET } from '../core/spells/definitions';

const KEYS = {
  loadout: 'afl.loadout',
  playerName: 'afl.playerName',
  stats: 'afl.stats',
} as const;

export interface Stats {
  played: number;
  won: number;
  /** Meilleur temps de survie en secondes. */
  bestTime: number;
}

const DEFAULT_STATS: Stats = { played: 0, won: 0, bestTime: 0 };

export type Loadout = (string | null)[];

/** Loadout par défaut : sorts par défaut placés dans les premiers emplacements. */
function defaultLoadout(): Loadout {
  const slots: Loadout = Array(SLOT_COUNT).fill(null);
  DEFAULT_SPELL_SET.forEach((id, i) => {
    if (i < SLOT_COUNT) slots[i] = id;
  });
  return slots;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage indisponible (mode privé, quota) : on ignore. */
  }
}

export const store = {
  getLoadout(): Loadout {
    const raw = read<Loadout | null>(KEYS.loadout, null);
    if (!Array.isArray(raw)) return defaultLoadout();
    // Normalise à SLOT_COUNT emplacements.
    const slots: Loadout = Array(SLOT_COUNT).fill(null);
    for (let i = 0; i < SLOT_COUNT; i++) slots[i] = raw[i] ?? null;
    return slots;
  },
  setLoadout(loadout: Loadout): void {
    write(KEYS.loadout, loadout);
  },
  getPlayerName(): string {
    return read<string>(KEYS.playerName, 'Acolyte');
  },
  setPlayerName(name: string): void {
    write(KEYS.playerName, name);
  },
  getStats(): Stats {
    return { ...DEFAULT_STATS, ...read<Partial<Stats>>(KEYS.stats, {}) };
  },
  /** Enregistre le résultat d'une manche et renvoie les stats mises à jour. */
  recordMatch(won: boolean, survivedTime: number): Stats {
    const s = this.getStats();
    const next: Stats = {
      played: s.played + 1,
      won: s.won + (won ? 1 : 0),
      bestTime: Math.max(s.bestTime, survivedTime),
    };
    write(KEYS.stats, next);
    return next;
  },
};
