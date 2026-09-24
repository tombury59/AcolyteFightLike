import { DEFAULT_SPELL_BINDINGS, type SpellBindings } from '../input/keybindings';

const KEYS = {
  spellBindings: 'afl.spellBindings',
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
  getSpellBindings(): SpellBindings {
    // Fusionne avec les valeurs par défaut pour tolérer des versions partielles.
    return {
      ...DEFAULT_SPELL_BINDINGS,
      ...read<Partial<SpellBindings>>(KEYS.spellBindings, {}),
    } as SpellBindings;
  },
  setSpellBindings(b: SpellBindings): void {
    write(KEYS.spellBindings, b);
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
