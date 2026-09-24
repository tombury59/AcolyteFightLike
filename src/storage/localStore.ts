import { DEFAULT_BINDINGS, type Bindings } from '../input/keybindings';

const KEYS = {
  bindings: 'afl.bindings',
  playerName: 'afl.playerName',
} as const;

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
  getBindings(): Bindings {
    // Fusionne avec les valeurs par défaut pour tolérer des versions partielles.
    return { ...DEFAULT_BINDINGS, ...read<Partial<Bindings>>(KEYS.bindings, {}) } as Bindings;
  },
  setBindings(b: Bindings): void {
    write(KEYS.bindings, b);
  },
  getPlayerName(): string {
    return read<string>(KEYS.playerName, 'Acolyte');
  },
  setPlayerName(name: string): void {
    write(KEYS.playerName, name);
  },
};
