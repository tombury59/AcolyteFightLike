import type { PlayerInput, WorldState } from './core/types';
import { createWorld } from './core/world';
import { step } from './core/simulation';
import { CONFIG } from './core/config';
import { Renderer } from './render/renderer';
import { InputManager } from './input/inputManager';
import { computeBotInput } from './ai/bot';
import { Overlay, type MatchResult } from './ui/overlay';

const LOCAL_PLAYER_ID = 'you';

type MatchStatus = 'playing' | 'over';

/**
 * Orchestre la boucle de jeu : entrées -> simulation (pas fixe) -> rendu,
 * et gère le déroulé d'une manche (fin de partie, rejouer).
 */
export class Game {
  private world: WorldState;
  private renderer: Renderer;
  private input: InputManager;
  private overlay: Overlay;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private status: MatchStatus = 'playing';

  constructor(canvas: HTMLCanvasElement) {
    this.world = createWorld();
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.overlay = new Overlay(() => this.restart());

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private restart(): void {
    this.world = createWorld();
    this.status = 'playing';
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.overlay.hideGameOver();
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

    // La simulation ne tourne que pendant la manche (l'écran de fin la fige).
    if (this.status === 'playing') {
      this.accumulator += elapsed;
      while (this.accumulator >= CONFIG.fixedDt) {
        this.simulateStep();
        this.accumulator -= CONFIG.fixedDt;
        if (this.checkMatchEnd()) break;
      }
    }

    this.updateStatusUi();
    this.renderer.render(this.world);
    requestAnimationFrame(this.frame);
  };

  private simulateStep(): void {
    const inputs = new Map<string, PlayerInput>();
    inputs.set(LOCAL_PLAYER_ID, this.input.getInput(this.renderer.camera));
    for (const p of this.world.players) {
      if (p.isBot && p.alive) inputs.set(p.id, computeBotInput(this.world, p));
    }
    step(this.world, inputs, CONFIG.fixedDt);
  }

  /** Renvoie true et bascule en fin de partie si une condition d'arrêt est remplie. */
  private checkMatchEnd(): boolean {
    const me = this.world.players.find((p) => p.id === LOCAL_PLAYER_ID);
    const aliveCount = this.world.players.filter((p) => p.alive).length;
    const timeUp = this.world.time >= CONFIG.matchDuration;

    let result: MatchResult | null = null;
    if (me && !me.alive) result = 'lose';
    else if (aliveCount <= 1) result = 'win'; // dernier survivant
    else if (timeUp) result = 'win'; // a survécu à la manche

    if (result) {
      this.status = 'over';
      this.overlay.showGameOver(result);
      return true;
    }
    return false;
  }

  private updateStatusUi(): void {
    const aliveCount = this.world.players.filter((p) => p.alive).length;
    this.overlay.setStatus(CONFIG.matchDuration - this.world.time, aliveCount);
  }
}
