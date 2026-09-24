import { store } from '../storage/localStore';
import { SPELLS } from '../core/spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';

const DND_MIME = 'application/x-afl-spell';

/**
 * Page d'accueil : titre, pseudo, CTA « Jouer », stats, et un tiroir latéral
 * (glissant depuis la droite) pour gérer le loadout : 4 emplacements + palette
 * des sorts disponibles, en glisser-déposer (clic aussi supporté).
 */
export class Home {
  private root: HTMLDivElement;
  private drawer!: HTMLDivElement;
  private scrim!: HTMLDivElement;
  private slotsEl!: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private loadout: (string | null)[];

  constructor(private onPlay: () => void) {
    this.loadout = store.getLoadout();
    this.root = document.createElement('div');
    this.root.className = 'home hidden';
    this.root.appendChild(this.buildLanding());
    this.root.appendChild(this.buildDrawer());
    document.body.appendChild(this.root);
    this.renderSlots();
    this.renderPalette();
  }

  show(): void {
    this.loadout = store.getLoadout();
    this.renderSlots();
    this.refreshStats();
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.closeDrawer();
    this.root.classList.add('hidden');
  }

  // --- Landing ---

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

    const spells = document.createElement('button');
    spells.className = 'home-secondary';
    spells.textContent = 'Gérer les sorts';
    spells.addEventListener('click', () => this.openDrawer());

    actions.append(play, spells);

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

  // --- Tiroir de gestion des sorts ---

  private buildDrawer(): HTMLElement {
    const wrap = document.createElement('div');

    this.scrim = document.createElement('div');
    this.scrim.className = 'drawer-scrim';
    this.scrim.addEventListener('click', () => this.closeDrawer());

    this.drawer = document.createElement('div');
    this.drawer.className = 'drawer';

    const header = document.createElement('div');
    header.className = 'drawer-header';
    const h = document.createElement('h2');
    h.textContent = 'Sorts équipés';
    const close = document.createElement('button');
    close.className = 'drawer-close';
    close.textContent = '✕';
    close.addEventListener('click', () => this.closeDrawer());
    header.append(h, close);

    const slotsLabel = document.createElement('div');
    slotsLabel.className = 'drawer-label';
    slotsLabel.textContent = `${SLOT_COUNT} emplacements`;

    this.slotsEl = document.createElement('div');
    this.slotsEl.className = 'loadout-slots';

    const hint = document.createElement('p');
    hint.className = 'drawer-hint';
    hint.textContent = 'Glissez un sort dans un emplacement (ou cliquez). Cliquez un emplacement pour le vider.';

    const paletteLabel = document.createElement('div');
    paletteLabel.className = 'drawer-label';
    paletteLabel.textContent = 'Sorts disponibles';

    const palette = document.createElement('div');
    palette.className = 'palette';
    this.paletteEl = palette;

    this.drawer.append(header, slotsLabel, this.slotsEl, hint, paletteLabel, palette);
    wrap.append(this.scrim, this.drawer);
    return wrap;
  }

  private paletteEl!: HTMLDivElement;

  private openDrawer(): void {
    this.root.classList.add('drawer-open');
  }

  private closeDrawer(): void {
    this.root.classList.remove('drawer-open');
  }

  private persist(): void {
    store.setLoadout(this.loadout);
  }

  // --- Rendu des emplacements et de la palette ---

  private renderSlots(): void {
    if (!this.slotsEl) return;
    this.slotsEl.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';

      const key = document.createElement('span');
      key.className = 'slot-key';
      key.textContent = String(i + 1);
      slot.appendChild(key);

      const spellId = this.loadout[i];
      if (spellId && SPELLS[spellId]) {
        slot.appendChild(this.makeChip(spellId, true, i));
        slot.title = 'Cliquer pour vider';
        slot.addEventListener('click', (e) => {
          if (e.target === slot || (e.target as HTMLElement).classList.contains('slot-key')) {
            this.setSlot(i, null);
          }
        });
      } else {
        const empty = document.createElement('span');
        empty.className = 'slot-empty';
        empty.textContent = 'vide';
        slot.appendChild(empty);
      }

      // Cible de dépôt.
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        this.handleDrop(e, i);
      });

      this.slotsEl.appendChild(slot);
    }
  }

  private renderPalette(): void {
    this.paletteEl.innerHTML = '';
    for (const spell of Object.values(SPELLS)) {
      const chip = this.makeChip(spell.id, false);
      chip.title = 'Glisser vers un emplacement (ou cliquer)';
      chip.addEventListener('click', () => this.addToFirstEmpty(spell.id));
      this.paletteEl.appendChild(chip);
    }
  }

  /** Crée une pastille de sort (draggable). `small` = version palette. */
  private makeChip(spellId: string, small: boolean, fromSlot?: number): HTMLElement {
    const spell = SPELLS[spellId];
    const chip = document.createElement('div');
    chip.className = small ? 'chip chip-small' : 'chip';
    chip.style.setProperty('--chip-color', spell.color);
    chip.draggable = true;

    const dot = document.createElement('span');
    dot.className = 'chip-dot';
    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = spell.name;
    chip.append(dot, name);

    chip.addEventListener('dragstart', (e) => {
      chip.classList.add('dragging');
      const payload = JSON.stringify({ spellId, fromSlot: fromSlot ?? null });
      e.dataTransfer?.setData(DND_MIME, payload);
      e.dataTransfer?.setData('text/plain', payload);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    return chip;
  }

  private handleDrop(e: DragEvent, targetSlot: number): void {
    const raw = e.dataTransfer?.getData(DND_MIME) || e.dataTransfer?.getData('text/plain');
    if (!raw) return;
    let data: { spellId: string; fromSlot: number | null };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (data.fromSlot !== null && data.fromSlot !== undefined) {
      // Déplacement d'un emplacement à l'autre : échange.
      const tmp = this.loadout[targetSlot];
      this.loadout[targetSlot] = this.loadout[data.fromSlot];
      this.loadout[data.fromSlot] = tmp;
    } else {
      this.loadout[targetSlot] = data.spellId;
    }
    this.persist();
    this.renderSlots();
  }

  private setSlot(i: number, spellId: string | null): void {
    this.loadout[i] = spellId;
    this.persist();
    this.renderSlots();
  }

  private addToFirstEmpty(spellId: string): void {
    const i = this.loadout.indexOf(null);
    if (i >= 0) this.setSlot(i, spellId);
  }
}
