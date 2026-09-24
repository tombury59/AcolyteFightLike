import type { PlayerInput, Vec2 } from '../core/types';
import type { Bindings } from './keybindings';
import type { Camera } from '../render/camera';
import { store } from '../storage/localStore';

/**
 * Écoute clavier + souris et produit un PlayerInput par frame.
 * Les touches sont configurables (chargées depuis localStorage).
 */
export class InputManager {
  private pressed = new Set<string>();
  private mouseScreen: Vec2 = { x: 0, y: 0 };
  private bindings: Bindings;

  constructor(canvas: HTMLCanvasElement) {
    this.bindings = store.getBindings();

    window.addEventListener('keydown', (e) => {
      // Évite le défilement de la page avec les flèches / espace.
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.pressed.delete(e.code));

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });

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

    return {
      move: { x: mx, y: my },
      aim: camera.screenToWorld(this.mouseScreen),
    };
  }
}
