export type MatchResult = 'win' | 'lose';

/**
 * Gère les éléments DOM superposés au canvas :
 * - un bandeau haut avec le temps restant et le nombre de survivants ;
 * - un écran de fin (Victoire / Défaite) avec un bouton Rejouer.
 */
export class Overlay {
  private timerEl: HTMLDivElement;
  private gameOverEl: HTMLDivElement;
  private titleEl: HTMLDivElement;

  constructor(
    private onReplay: () => void,
    private onMenu: () => void,
  ) {
    this.timerEl = document.createElement('div');
    this.timerEl.className = 'timer';
    document.body.appendChild(this.timerEl);

    this.gameOverEl = document.createElement('div');
    this.gameOverEl.className = 'gameover hidden';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'gameover-title';

    const buttons = document.createElement('div');
    buttons.className = 'gameover-buttons';

    const replay = document.createElement('button');
    replay.textContent = 'Rejouer';
    replay.addEventListener('click', () => this.onReplay());

    const menu = document.createElement('button');
    menu.className = 'secondary';
    menu.textContent = 'Menu';
    menu.addEventListener('click', () => this.onMenu());

    buttons.appendChild(replay);
    buttons.appendChild(menu);

    this.gameOverEl.appendChild(this.titleEl);
    this.gameOverEl.appendChild(buttons);
    document.body.appendChild(this.gameOverEl);
  }

  setStatus(timeLeft: number, aliveCount: number): void {
    const s = Math.max(0, Math.ceil(timeLeft));
    this.timerEl.textContent = `${s}s · ${aliveCount} en vie`;
  }

  clearStatus(): void {
    this.timerEl.textContent = '';
  }

  showGameOver(result: MatchResult): void {
    this.titleEl.textContent = result === 'win' ? 'Victoire !' : 'Défaite';
    this.titleEl.classList.toggle('win', result === 'win');
    this.titleEl.classList.toggle('lose', result === 'lose');
    this.gameOverEl.classList.remove('hidden');
  }

  hideGameOver(): void {
    this.gameOverEl.classList.add('hidden');
  }
}
