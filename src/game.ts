import type { PlayerInput, WorldState } from './core/types';
import { createWorld } from './core/world';
import { step } from './core/simulation';
import { CONFIG } from './core/config';
import { Renderer } from './render/renderer';
import { InputManager } from './input/inputManager';

const LOCAL_PLAYER_ID = 'you';

/**
 * Orchestre la boucle de jeu : entrées -> simulation (pas fixe) -> rendu.
 * Utilise un accumulateur pour une simulation stable indépendante du framerate.
 */
export class Game {
  private world: WorldState;
  private renderer: Renderer;
  private input: InputManager;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.world = createWorld();
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private handleResize(): void {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  }

  private frame = (now: number): void => {
    if (!this.running) return;

    let elapsed = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Garde-fou : évite un rattrapage géant après un onglet en arrière-plan.
    if (elapsed > 0.25) elapsed = 0.25;
    this.accumulator += elapsed;

    // La caméra suit le joueur local (nécessaire avant de lire la souris).
    const me = this.world.players.find((p) => p.id === LOCAL_PLAYER_ID);
    if (me) this.renderer.camera.target = me.pos;

    // Pas de simulation fixes.
    while (this.accumulator >= CONFIG.fixedDt) {
      const inputs = new Map<string, PlayerInput>();
      inputs.set(LOCAL_PLAYER_ID, this.input.getInput(this.renderer.camera));
      step(this.world, inputs, CONFIG.fixedDt);
      this.accumulator -= CONFIG.fixedDt;
    }

    this.renderer.render(this.world);
    requestAnimationFrame(this.frame);
  };
}
