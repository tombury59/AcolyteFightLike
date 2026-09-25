import type { PlayerInput, WorldState } from './core/types';
import { createWorld, createDemoWorld } from './core/world';
import { step } from './core/simulation';
import { CONFIG } from './core/config';
import { Renderer } from './render/renderer';
import { InputManager } from './input/inputManager';
import { computeBotInput } from './ai/bot';
import { Overlay, type MatchResult } from './ui/overlay';
import { Home } from './ui/home';
import { store } from './storage/localStore';
import { ParticleSystem } from './render/effects';
import { sfx } from './audio/sfx';

const LOCAL_PLAYER_ID = 'you';

type MatchStatus = 'menu' | 'playing' | 'over';

/**
 * Orchestre la boucle de jeu : entrées -> simulation (pas fixe) -> rendu,
 * et gère le déroulé d'une manche (menu, fin de partie, rejouer).
 */
export class Game {
  private world: WorldState;
  private renderer: Renderer;
  private input: InputManager;
  private overlay: Overlay;
  private home: Home;
  private effects = new ParticleSystem();
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private status: MatchStatus = 'menu';
  /** Suivi d'état pour détecter morts et apparitions de projectiles (effets). */
  private prevAlive = new Set<string>();
  private knownProjectiles = new Set<number>();
  /** Monde de démo animé en fond de menu + son propre accumulateur. */
  private demoWorld: WorldState;
  private demoAccumulator = 0;
  /** Décalage parallax normalisé (-1..1) piloté par la souris.  */
  private parallax = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.world = createWorld(store.getPlayerName(), store.getLoadout());
    this.demoWorld = createDemoWorld();
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.overlay = new Overlay(
      () => this.startMatch(),
      () => this.openHome(),
    );
    this.home = new Home(() => this.startMatch());

    window.addEventListener('mousemove', (e) => {
      this.parallax = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    });

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.openHome();
    requestAnimationFrame(this.frame);
  }

  private openHome(): void {
    this.status = 'menu';
    this.overlay.hideGameOver();
    this.overlay.clearStatus();
    this.home.show();
  }

  /** Démarre (ou relance) une manche avec les paramètres courants. */
  private startMatch(): void {
    sfx.resume(); // geste utilisateur -> autorise l'audio
    this.input.reloadLoadout();
    this.world = createWorld(store.getPlayerName(), store.getLoadout());
    this.status = 'playing';
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.effects.particles = [];
    this.prevAlive = new Set(this.world.players.filter((p) => p.alive).map((p) => p.id));
    this.knownProjectiles.clear();
    this.home.hide();
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

    if (this.status === 'menu') {
      // Fond de menu : démo de bots + parallax, sans HUD/barres de vie.
      this.stepDemo(elapsed);
      this.renderer.render(this.demoWorld, [], { minimal: true, parallax: this.parallax });
      requestAnimationFrame(this.frame);
      return;
    }

    // La simulation ne tourne que pendant la manche (l'écran de fin la fige).
    if (this.status === 'playing') {
      this.accumulator += elapsed;
      while (this.accumulator >= CONFIG.fixedDt) {
        this.simulateStep();
        this.accumulator -= CONFIG.fixedDt;
        if (this.checkMatchEnd()) break;
      }
      this.detectEvents();
      this.updateStatusUi();
    }

    // Les particules continuent d'animer même sur l'écran de fin.
    this.effects.update(elapsed);
    this.renderer.render(this.world, this.effects.particles);
    requestAnimationFrame(this.frame);
  };

  /** Fait tourner la démo de fond (bots seuls), réinitialisée quand il n'en reste qu'un. */
  private stepDemo(elapsed: number): void {
    this.demoAccumulator += elapsed;
    while (this.demoAccumulator >= CONFIG.fixedDt) {
      const inputs = new Map<string, PlayerInput>();
      for (const p of this.demoWorld.players) {
        if (p.alive) inputs.set(p.id, computeBotInput(this.demoWorld, p));
      }
      step(this.demoWorld, inputs, CONFIG.fixedDt);
      this.demoAccumulator -= CONFIG.fixedDt;
      if (this.demoWorld.players.filter((p) => p.alive).length <= 1) {
        this.demoWorld = createDemoWorld();
      }
    }
  }

  /** Détecte morts et nouveaux projectiles pour déclencher effets et sons. */
  private detectEvents(): void {
    // Morts -> gerbe de particules + son.
    const aliveNow = new Set<string>();
    for (const p of this.world.players) {
      if (p.alive) {
        aliveNow.add(p.id);
      } else if (this.prevAlive.has(p.id)) {
        this.effects.burst(p.pos, p.color);
        sfx.play('death');
      }
    }
    this.prevAlive = aliveNow;

    // Nouveaux projectiles -> bouffée (+ son pour ceux du joueur local).
    const ids = new Set<number>();
    for (const proj of this.world.projectiles) {
      ids.add(proj.id);
      if (!this.knownProjectiles.has(proj.id)) {
        this.effects.puff(proj.pos, proj.color);
        if (proj.ownerId === LOCAL_PLAYER_ID) sfx.play('cast');
      }
    }
    this.knownProjectiles = ids;
  }

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
      const survived = Math.floor(this.world.time);
      // Éliminations approximées : adversaires morts à la fin de la manche.
      const kills = this.world.players.filter((p) => p.id !== LOCAL_PLAYER_ID && !p.alive).length;
      const outcome = store.recordMatch(result === 'win', this.world.time, kills);
      const levelUp = outcome.leveledTo ? ` · Niveau ${outcome.leveledTo} !` : '';
      const detail =
        result === 'win'
          ? `Survécu ${survived}s · +${outcome.xpGained} XP${levelUp} · Victoires ${outcome.stats.won}/${outcome.stats.played}`
          : `Survécu ${survived}s · +${outcome.xpGained} XP${levelUp}`;
      this.overlay.showGameOver(result, detail);
      sfx.play(result === 'win' ? 'win' : 'lose');
      return true;
    }
    return false;
  }

  private updateStatusUi(): void {
    const aliveCount = this.world.players.filter((p) => p.alive).length;
    this.overlay.setStatus(CONFIG.matchDuration - this.world.time, aliveCount);
  }
}
