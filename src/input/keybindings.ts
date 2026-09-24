/** Actions abstraites du jeu, découplées des touches physiques. */
export type Action = 'up' | 'down' | 'left' | 'right';

/** Une action peut être déclenchée par plusieurs codes touche (KeyboardEvent.code). */
export type Bindings = Record<Action, string[]>;

/** Flèches directionnelles + ZQSD + WASD par défaut. */
export const DEFAULT_BINDINGS: Bindings = {
  up: ['ArrowUp', 'KeyW', 'KeyZ'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA', 'KeyQ'],
  right: ['ArrowRight', 'KeyD'],
};
