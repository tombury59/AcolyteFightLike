import type { PlayerInput, Vec2 } from '../core/types';
import type { Bindings } from './keybindings';
import type { Camera } from '../render/camera';
import { store } from '../storage/localStore';

/**
 * Déclencheurs de sorts : id de sort -> codes qui l'activent.
 * Les boutons souris sont encodés `Mouse0` (gauche) / `Mouse2` (droit).
 * Configurable via un écran Paramètres en phase 6.
 */
const SPELL_TRIGGERS: Record<string, string[]> = {
  // Digit1/Digit2 = touches `&` et `é` sur AZERTY (le code ignore la disposition).
  fireball: ['Mouse0', 'Space', 'Digit1', 'Numpad1'],
  dash: ['Mouse2', 'ShiftLeft', 'Digit2', 'Numpad2'],
};

/**
 * Écoute clavier + souris et produit un PlayerInput par frame.
 * Les touches de déplacement sont configurables (chargées depuis localStorage).
 */
export class InputManager {
  private pressed = new Set<string>();
  private mouseScreen: Vec2 = { x: 0, y: 0 };
  private bindings: Bindings;
  /** Horodatage du dernier mouvement souris (perf.now). -Infinity = jamais bougée. */
  private lastMouseMove = -Infinity;
  /** Délai d'inactivité souris au-delà duquel on vise via le déplacement (ms). */
  private static readonly MOUSE_IDLE_MS = 500;

  constructor(canvas: HTMLCanvasElement) {
    this.bindings = store.getBindings();

    window.addEventListener('keydown', (e) => {
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.pressed.delete(e.code));

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.lastMouseMove = performance.now();
    });
    canvas.addEventListener('mousedown', (e) => {
      this.pressed.add(`Mouse${e.button}`);
    });
    window.addEventListener('mouseup', (e) => this.pressed.delete(`Mouse${e.button}`));
    // Empêche le menu contextuel sur clic droit (utilisé pour le dash).
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Si on perd le focus, on relâche tout pour éviter les touches « collées ».
    window.addEventListener('blur', () => this.pressed.clear());
  }

  /** Recharge les touches (à appeler après un changement dans les paramètres). */
  reloadBindings(): void {
    this.bindings = store.getBindings();
  }

  private isDown(codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  /** Construit l'entrée de la frame. `camera` sert à situer la souris dans le monde. */
  getInput(camera: Camera): PlayerInput {
    let mx = 0;
    let my = 0;
    if (this.isDown(this.bindings.left)) mx -= 1;
    if (this.isDown(this.bindings.right)) mx += 1;
    if (this.isDown(this.bindings.up)) my -= 1;
    if (this.isDown(this.bindings.down)) my += 1;

    const castSpells: string[] = [];
    for (const spellId in SPELL_TRIGGERS) {
      if (this.isDown(SPELL_TRIGGERS[spellId])) castSpells.push(spellId);
    }

    // Souris inactive depuis un moment -> on vise dans la direction du déplacement.
    const mouseIdle = performance.now() - this.lastMouseMove > InputManager.MOUSE_IDLE_MS;

    return {
      move: { x: mx, y: my },
      aim: camera.screenToWorld(this.mouseScreen),
      aimFromMove: mouseIdle,
      castSpells,
    };
  }
}
