/** Nombre d'emplacements de sorts. */
export const SLOT_COUNT = 4;

/**
 * Déclencheurs par EMPLACEMENT (index 0..3). Le sort équipé dans un emplacement
 * est lancé par ces touches. Boutons souris encodés `Mouse0`/`Mouse2`.
 * Digit1..4 = touches `&`, `é`, `"`, `'` sur AZERTY (le code ignore la disposition).
 */
export const SLOT_TRIGGERS: string[][] = [
  ['Mouse0', 'Space', 'Digit1', 'Numpad1'],
  ['Mouse2', 'ShiftLeft', 'Digit2', 'Numpad2'],
  ['Digit3', 'Numpad3', 'KeyE'],
  ['Digit4', 'Numpad4', 'KeyR'],
];
