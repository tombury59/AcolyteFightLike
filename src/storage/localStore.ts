import { DEFAULT_SPELL_BINDINGS, type SpellBindings } from '../input/keybindings';

const KEYS = {
  spellBindings: 'afl.spellBindings',
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
};
