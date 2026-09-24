import type { PlayerInput, Vec2 } from '../core/types';
import type { Camera } from '../render/camera';

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
 * Écoute la souris et produit un PlayerInput par frame.
 * Contrôle « le personnage suit la souris » : pas de touches de déplacement.
 */
export class InputManager {
  private pressed = new Set<string>();
  private mouseScreen: Vec2 = { x: 0, y: 0 };
  /** Tant que la souris n'a pas bougé, on ne fait pas foncer le perso au coin. */
  private hasMouseMoved = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.hasMouseMoved = true;
    });
    canvas.addEventListener('mousedown', (e) => this.pressed.add(`Mouse${e.button}`));
    window.addEventListener('mouseup', (e) => this.pressed.delete(`Mouse${e.button}`));
    // Empêche le menu contextuel sur clic droit (utilisé pour le dash).
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.preventDefault();
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.pressed.delete(e.code));

    // Si on perd le focus, on relâche tout pour éviter les touches « collées ».
    window.addEventListener('blur', () => this.pressed.clear());
  }

  private isDown(codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  /** Construit l'entrée de la frame. `camera` situe la souris dans le monde. */
  getInput(camera: Camera): PlayerInput {
    const castSpells: string[] = [];
    for (const spellId in SPELL_TRIGGERS) {
      if (this.isDown(SPELL_TRIGGERS[spellId])) castSpells.push(spellId);
    }

    return {
      aim: camera.screenToWorld(this.mouseScreen),
      follow: this.hasMouseMoved,
      castSpells,
    };
  }
}
