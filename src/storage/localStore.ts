import { SLOT_COUNT } from '../input/keybindings';
import { DEFAULT_SPELL_SET } from '../core/spells/definitions';
import { ROOT_SPELLS, costOf, isUnlockable } from '../core/spells/tree';
import {
  levelFromXp,
  totalPointsForLevel,
  xpForMatch,
} from '../core/progression';

const KEYS = {
  loadout: 'afl.loadout',
  playerName: 'afl.playerName',
  stats: 'afl.stats',
  progress: 'afl.progress',
} as const;

export interface Stats {
  played: number;
  won: number;
  /** Meilleur temps de survie en secondes. */
  bestTime: number;
}

/** Progression persistante : XP totale + sorts débloqués. */
export interface Progress {
  xp: number;
  unlocked: string[];
}

/** Bilan d'une manche renvoyé à l'UI (stats + gains d'XP/niveau). */
export interface MatchOutcome {
  stats: Stats;
  xpGained: number;
  level: number;
  /** Niveau atteint SI la manche a fait monter d'un cran, sinon `null`. */
  leveledTo: number | null;
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
    const unlocked = new Set(this.getProgress().unlocked);
    const base = Array.isArray(raw) ? raw : defaultLoadout();
    // Normalise à SLOT_COUNT emplacements et vide les sorts NON débloqués.
    const slots: Loadout = Array(SLOT_COUNT).fill(null);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const id = base[i] ?? null;
      slots[i] = id && unlocked.has(id) ? id : null;
    }
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

  // --- Progression (XP / niveaux / déblocages) ---

  getProgress(): Progress {
    const raw = read<Partial<Progress>>(KEYS.progress, {});
    const xp = typeof raw.xp === 'number' && raw.xp >= 0 ? raw.xp : 0;
    const set = new Set<string>(Array.isArray(raw.unlocked) ? raw.unlocked : []);
    for (const id of ROOT_SPELLS) set.add(id); // les racines sont toujours acquises
    return { xp, unlocked: [...set] };
  },
  /** Niveau courant, dérivé de l'XP. */
  getLevel(): number {
    return levelFromXp(this.getProgress().xp);
  },
  /** Points déjà dépensés (somme des coûts des sorts débloqués). */
  spentPoints(): number {
    return this.getProgress().unlocked.reduce((sum, id) => sum + costOf(id), 0);
  },
  /** Points encore disponibles à dépenser. */
  availablePoints(): number {
    return totalPointsForLevel(this.getLevel()) - this.spentPoints();
  },
  /**
   * Tente de débloquer un sort : vérifie prérequis + points disponibles.
   * Renvoie `true` si le déblocage a eu lieu.
   */
  unlockSpell(id: string): boolean {
    const progress = this.getProgress();
    const unlocked = new Set(progress.unlocked);
    if (!isUnlockable(id, unlocked)) return false;
    if (costOf(id) > this.availablePoints()) return false;
    unlocked.add(id);
    write(KEYS.progress, { xp: progress.xp, unlocked: [...unlocked] });
    return true;
  },

  /** Enregistre le résultat d'une manche : maj stats + gain d'XP, renvoie le bilan. */
  recordMatch(won: boolean, survivedTime: number, kills: number): MatchOutcome {
    const s = this.getStats();
    const nextStats: Stats = {
      played: s.played + 1,
      won: s.won + (won ? 1 : 0),
      bestTime: Math.max(s.bestTime, survivedTime),
    };
    write(KEYS.stats, nextStats);

    const progress = this.getProgress();
    const levelBefore = levelFromXp(progress.xp);
    const xpGained = xpForMatch(won, survivedTime, kills);
    const nextXp = progress.xp + xpGained;
    write(KEYS.progress, { xp: nextXp, unlocked: progress.unlocked });
    const levelAfter = levelFromXp(nextXp);

    return {
      stats: nextStats,
      xpGained,
      level: levelAfter,
      leveledTo: levelAfter > levelBefore ? levelAfter : null,
    };
  },
};
