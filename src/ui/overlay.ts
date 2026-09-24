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

  constructor(private onReplay: () => void) {
    this.timerEl = document.createElement('div');
    this.timerEl.className = 'timer';
    document.body.appendChild(this.timerEl);

    this.gameOverEl = document.createElement('div');
    this.gameOverEl.className = 'gameover hidden';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'gameover-title';

    const button = document.createElement('button');
    button.textContent = 'Rejouer';
    button.addEventListener('click', () => this.onReplay());

    this.gameOverEl.appendChild(this.titleEl);
    this.gameOverEl.appendChild(button);
    document.body.appendChild(this.gameOverEl);
  }

  setStatus(timeLeft: number, aliveCount: number): void {
    const s = Math.max(0, Math.ceil(timeLeft));
    this.timerEl.textContent = `${s}s · ${aliveCount} en vie`;
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
