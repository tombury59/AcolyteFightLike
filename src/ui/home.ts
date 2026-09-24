import { store } from '../storage/localStore';
import { Spellbook } from './spellbook';

/**
 * Page d'accueil : titre, pseudo, CTA « Jouer », stats, et un bouton « Grimoire »
 * qui ouvre le livre de sorts. Le fond (canvas) affiche une démo de bots.
 */
export class Home {
  private root: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private book = new Spellbook();

  constructor(private onPlay: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'home hidden';
    this.root.appendChild(this.buildLanding());
    document.body.appendChild(this.root);
  }

  show(): void {
    this.refreshStats();
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.book.close();
    this.root.classList.add('hidden');
  }

  private buildLanding(): HTMLElement {
    const landing = document.createElement('div');
    landing.className = 'home-landing';

    const title = document.createElement('h1');
    title.className = 'home-title';
    title.textContent = 'Acolyte Fight Like';

    const tagline = document.createElement('p');
    tagline.className = 'home-tagline';
    tagline.textContent = 'Arène de sorts — poussez vos rivaux hors du cercle et survivez.';

    const nameRow = document.createElement('label');
    nameRow.className = 'home-name';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = 'Pseudo';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 16;
    nameInput.value = store.getPlayerName();
    nameInput.addEventListener('input', () => {
      store.setPlayerName(nameInput.value.trim() || 'Acolyte');
    });
    nameRow.append(nameLabel, nameInput);

    const actions = document.createElement('div');
    actions.className = 'home-actions';

    const play = document.createElement('button');
    play.className = 'home-cta';
    play.textContent = 'Jouer';
    play.addEventListener('click', () => this.onPlay());

    const book = document.createElement('button');
    book.className = 'home-secondary';
    book.textContent = '📖 Grimoire';
    book.addEventListener('click', () => this.book.open());

    actions.append(play, book);

    this.statsEl = document.createElement('div');
    this.statsEl.className = 'home-stats';

    landing.append(title, tagline, nameRow, actions, this.statsEl);
    return landing;
  }

  private refreshStats(): void {
    const s = store.getStats();
    this.statsEl.textContent =
      `Parties ${s.played} · Victoires ${s.won} · Record ${Math.floor(s.bestTime)}s`;
  }
}
