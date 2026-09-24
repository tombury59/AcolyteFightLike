import { store } from '../storage/localStore';
import { Spellbook } from './spellbook';
import { SPELLS } from '../core/spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';

/**
 * Page d'accueil : titre, pseudo, CTA « Jouer », rangée des sorts équipés
 * (cliquable -> ouvre le grimoire), stats. Le fond (canvas) affiche une démo.
 */
export class Home {
  private root: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private loadoutEl!: HTMLDivElement;
  private book = new Spellbook(() => this.renderLoadout());

  constructor(private onPlay: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'home hidden';
    this.root.appendChild(this.buildLanding());
    document.body.appendChild(this.root);
  }

  show(): void {
    this.refreshStats();
    this.renderLoadout();
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

    const play = document.createElement('button');
    play.className = 'home-cta';
    play.textContent = 'Jouer';
    play.addEventListener('click', () => this.onPlay());

    // Rangée des sorts équipés (l'accroche vers le grimoire).
    const loadoutWrap = document.createElement('div');
    loadoutWrap.className = 'home-loadout-wrap';
    this.loadoutEl = document.createElement('div');
    this.loadoutEl.className = 'home-loadout';
    const caption = document.createElement('div');
    caption.className = 'home-loadout-caption';
    caption.textContent = 'Tes sorts — clique pour les équiper';
    loadoutWrap.append(this.loadoutEl, caption);

    this.statsEl = document.createElement('div');
    this.statsEl.className = 'home-stats';

    landing.append(title, tagline, nameRow, play, loadoutWrap, this.statsEl);
    return landing;
  }

  /** Rangée des 4 emplacements : sort équipé (couleur) ou case vide « + ». */
  private renderLoadout(): void {
    const loadout = store.getLoadout();
    this.loadoutEl.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const spellId = loadout[i];
      const spell = spellId ? SPELLS[spellId] : undefined;

      const tile = document.createElement('button');
      tile.className = 'home-slot' + (spell ? '' : ' empty');
      tile.addEventListener('click', () => this.book.open());

      const key = document.createElement('span');
      key.className = 'home-slot-key';
      key.textContent = String(i + 1);
      tile.appendChild(key);

      if (spell) {
        tile.style.setProperty('--slot-color', spell.color);
        const dot = document.createElement('span');
        dot.className = 'home-slot-dot';
        const name = document.createElement('span');
        name.className = 'home-slot-name';
        name.textContent = spell.name;
        tile.append(dot, name);
      } else {
        const plus = document.createElement('span');
        plus.className = 'home-slot-plus';
        plus.textContent = '+';
        tile.appendChild(plus);
      }

      this.loadoutEl.appendChild(tile);
    }
  }

  private refreshStats(): void {
    const s = store.getStats();
    this.statsEl.textContent =
      `Parties ${s.played} · Victoires ${s.won} · Record ${Math.floor(s.bestTime)}s`;
  }
}
