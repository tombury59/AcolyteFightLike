/** Déclencheurs de sorts : id de sort -> codes qui l'activent. */
export type SpellBindings = Record<string, string[]>;

/**
 * Boutons souris encodés `Mouse0` (gauche) / `Mouse2` (droit).
 * Digit1/Digit2 = touches `&` et `é` sur AZERTY (le code ignore la disposition).
 */
export const DEFAULT_SPELL_BINDINGS: SpellBindings = {
  fireball: ['Mouse0', 'Space', 'Digit1', 'Numpad1'],
  dash: ['Mouse2', 'ShiftLeft', 'Digit2', 'Numpad2'],
};

/** Libellé lisible pour un code touche/souris. */
export function formatCode(code: string): string {
  const map: Record<string, string> = {
    Mouse0: 'Clic gauche',
    Mouse1: 'Clic milieu',
    Mouse2: 'Clic droit',
    Space: 'Espace',
    ShiftLeft: 'Maj G',
    ShiftRight: 'Maj D',
    ControlLeft: 'Ctrl G',
    ControlRight: 'Ctrl D',
    AltLeft: 'Alt',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Pavé ${code.slice(6)}`;
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}
