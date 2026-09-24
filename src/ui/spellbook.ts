import { store } from '../storage/localStore';
import { SPELLS } from '../core/spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';
import type { Spell } from '../core/spells/spell';

const DND_MIME = 'application/x-afl-spell';

type Page = { kind: 'equip' } | { kind: 'spell'; spell: Spell };

/**
 * Grimoire : livre de sorts en overlay.
 * - Page 1 : équipement (4 emplacements + palette, glisser-déposer).
 * - Pages suivantes : une fiche par sort (résumé + visuel animé de l'effet).
 */
export class Spellbook {
  private overlay: HTMLDivElement;
  private tabsEl!: HTMLDivElement;
  private pageEl!: HTMLDivElement;
  private pages: Page[];
  private current = 0;
  private loadout: (string | null)[] = [];
  private equipSlots?: HTMLElement;
  private equipPalette?: HTMLElement;
  private raf = 0;

  /** `onChange` est appelé après chaque modification du loadout (pour rafraîchir l'accueil). */
  constructor(private onChange?: () => void) {
    this.pages = [
      { kind: 'equip' },
      ...Object.values(SPELLS).map((spell) => ({ kind: 'spell' as const, spell })),
    ];
    this.overlay = this.build();
    document.body.appendChild(this.overlay);
  }

  open(): void {
    this.loadout = store.getLoadout();
    this.current = 0;
    this.renderTabs();
    this.renderPage();
    this.overlay.classList.add('open');
  }

  close(): void {
    this.stopAnim();
    this.overlay.classList.remove('open');
  }

  private build(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'book-overlay';

    const scrim = document.createElement('div');
    scrim.className = 'book-scrim';
    scrim.addEventListener('click', () => this.close());

    const book = document.createElement('div');
    book.className = 'book';

    const spread = document.createElement('div');
    spread.className = 'book-spread';

    // Page gauche = sommaire (onglets).
    const leftLeaf = document.createElement('div');
    leftLeaf.className = 'book-leaf book-leaf--left';
    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'book-tabs';
    leftLeaf.appendChild(this.tabsEl);

    // Reliure centrale (tissu rouge).
    const spine = document.createElement('div');
    spine.className = 'book-spine';

    // Page droite = contenu + navigation.
    const rightLeaf = document.createElement('div');
    rightLeaf.className = 'book-leaf book-leaf--right';
    this.pageEl = document.createElement('div');
    this.pageEl.className = 'book-page';

    const nav = document.createElement('div');
    nav.className = 'book-nav';
    const prev = document.createElement('button');
    prev.textContent = '‹ Précédent';
    prev.addEventListener('click', () => this.go(this.current - 1));
    const next = document.createElement('button');
    next.textContent = 'Suivant ›';
    next.addEventListener('click', () => this.go(this.current + 1));
    const close = document.createElement('button');
    close.className = 'book-close';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => this.close());
    nav.append(prev, next, close);
    rightLeaf.append(this.pageEl, nav);

    spread.append(leftLeaf, spine, rightLeaf);
    book.appendChild(spread);
    overlay.append(scrim, book);
    return overlay;
  }

  private go(index: number): void {
    const n = this.pages.length;
    this.current = ((index % n) + n) % n;
    this.renderTabs();
    this.renderPage();
  }

  private renderTabs(): void {
    this.tabsEl.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'book-brand';
    title.textContent = 'Grimoire';
    this.tabsEl.appendChild(title);

    this.pages.forEach((page, i) => {
      const tab = document.createElement('button');
      tab.className = 'book-tab' + (i === this.current ? ' active' : '');
      if (page.kind === 'equip') {
        tab.textContent = 'Équipement';
      } else {
        const dot = document.createElement('span');
        dot.className = 'tab-dot';
        dot.style.background = page.spell.color;
        const label = document.createElement('span');
        label.textContent = page.spell.name;
        tab.append(dot, label);
      }
      tab.addEventListener('click', () => this.go(i));
      this.tabsEl.appendChild(tab);
    });
  }

  private renderPage(): void {
    this.stopAnim();
    this.pageEl.innerHTML = '';
    const page = this.pages[this.current];
    if (page.kind === 'equip') this.renderEquip();
    else this.renderSpell(page.spell);
  }

  // --- Page équipement (loadout) ---

  private renderEquip(): void {
    const h = document.createElement('h2');
    h.className = 'book-title';
    h.textContent = 'Équipement';
    const hint = document.createElement('p');
    hint.className = 'book-hint';
    hint.textContent =
      'Glissez un sort dans un emplacement (ou cliquez). Cliquez un emplacement pour le vider.';

    this.equipSlots = document.createElement('div');
    this.equipSlots.className = 'loadout-slots';
    this.pageEl.append(h, hint, this.equipSlots);

    const palLabel = document.createElement('div');
    palLabel.className = 'book-subtitle';
    palLabel.textContent = 'Sorts disponibles';
    this.equipPalette = document.createElement('div');
    this.equipPalette.className = 'palette';
    this.pageEl.append(palLabel, this.equipPalette);

    this.renderSlots();
    this.renderPalette();
  }

  private renderSlots(): void {
    const container = this.equipSlots;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const key = document.createElement('span');
      key.className = 'slot-key';
      key.textContent = String(i + 1);
      slot.appendChild(key);

      const spellId = this.loadout[i];
      if (spellId && SPELLS[spellId]) {
        slot.appendChild(this.makeChip(spellId, false, i));
        slot.title = 'Cliquer pour vider';
        slot.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          if (t === slot || t.classList.contains('slot-key')) this.setSlot(i, null);
        });
      } else {
        const empty = document.createElement('span');
        empty.className = 'slot-empty';
        empty.textContent = 'vide';
        slot.appendChild(empty);
      }

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
      container.appendChild(slot);
    }
  }

  /** Palette : un sort déjà équipé est grisé et non déplaçable (pas de doublon). */
  private renderPalette(): void {
    const container = this.equipPalette;
    if (!container) return;
    container.innerHTML = '';
    for (const spell of Object.values(SPELLS)) {
      const equipped = this.loadout.includes(spell.id);
      const chip = this.makeChip(spell.id, true);
      if (equipped) {
        chip.classList.add('chip-disabled');
        chip.draggable = false;
        chip.title = 'Déjà équipé';
      } else {
        chip.addEventListener('click', () => this.addToFirstEmpty(spell.id));
      }
      container.appendChild(chip);
    }
  }

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

  private handleDrop(e: DragEvent, target: number): void {
    const raw = e.dataTransfer?.getData(DND_MIME) || e.dataTransfer?.getData('text/plain');
    if (!raw) return;
    let data: { spellId: string; fromSlot: number | null };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data.fromSlot !== null && data.fromSlot !== undefined) {
      // Déplacement entre emplacements : simple échange (jamais de doublon).
      const tmp = this.loadout[target];
      this.loadout[target] = this.loadout[data.fromSlot];
      this.loadout[data.fromSlot] = tmp;
    } else {
      // Depuis la palette : le sort est UNIQUE. S'il est déjà ailleurs, on
      // l'y retire (échange avec le contenu actuel de la case cible).
      const existing = this.loadout.indexOf(data.spellId);
      if (existing >= 0 && existing !== target) {
        this.loadout[existing] = this.loadout[target];
      }
      this.loadout[target] = data.spellId;
    }
    this.persist();
  }

  private setSlot(i: number, spellId: string | null): void {
    this.loadout[i] = spellId;
    this.persist();
  }

  private addToFirstEmpty(spellId: string): void {
    if (this.loadout.includes(spellId)) return; // déjà équipé -> pas de doublon
    const i = this.loadout.indexOf(null);
    if (i >= 0) this.setSlot(i, spellId);
  }

  private persist(): void {
    store.setLoadout(this.loadout);
    this.renderSlots();
    this.renderPalette();
    this.onChange?.();
  }

  // --- Page fiche de sort ---

  private renderSpell(spell: Spell): void {
    const title = document.createElement('h2');
    title.className = 'book-title';
    title.style.color = spell.color;
    title.textContent = spell.name;

    const canvas = document.createElement('canvas');
    canvas.className = 'book-visual';
    canvas.width = 520;
    canvas.height = 240;

    const desc = document.createElement('p');
    desc.className = 'book-desc';
    desc.textContent = spell.description;

    const stats = document.createElement('div');
    stats.className = 'book-stats';
    stats.innerHTML = `<span>Recharge&nbsp;: <b>${spell.cooldown}s</b></span>`;

    this.pageEl.append(title, canvas, desc, stats);
    this.startAnim(canvas, spell);
  }

  // --- Visuels animés ---

  private startAnim(canvas: HTMLCanvasElement, spell: Spell): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      if (spell.preview === 'blink') this.drawBlink(ctx, canvas, spell.color, t);
      else this.drawOrb(ctx, canvas, spell.color, t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stopAnim(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private clear(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement): void {
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, c.width, c.height);
  }

  /** Boule de feu : gros orbe lent qui traverse en poussant un ennemi devant. */
  private drawOrb(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, color: string, t: number): void {
    this.clear(ctx, c);
    const cy = c.height / 2;
    const period = 3.2;
    const p = (t % period) / period;
    const orbR = 46;
    const x = -orbR + p * (c.width + orbR * 2);

    // Cible poussée, collée à l'avant de l'orbe.
    const targetR = 12;
    const tx = x + orbR + targetR;
    ctx.beginPath();
    ctx.arc(tx, cy, targetR, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();

    // Orbe translucide + contour.
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, cy, orbR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, cy, orbR, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  /** Dash : le personnage se téléporte en avant par bonds. */
  private drawBlink(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, color: string, t: number): void {
    this.clear(ctx, c);
    const cy = c.height / 2;
    const period = 1.6;
    const p = (t % period) / period;
    const startX = 90;
    const jump = 170;
    const r = 16;

    // Position : saute à mi-cycle.
    const x = p < 0.5 ? startX : startX + jump;

    // Traînée du saut (juste après la téléportation).
    if (p >= 0.5 && p < 0.72) {
      const fade = 1 - (p - 0.5) / 0.22;
      ctx.globalAlpha = 0.5 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.lineTo(startX + jump, cy);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Halo au moment du dash.
    if (p >= 0.48 && p < 0.6) {
      ctx.beginPath();
      ctx.arc(x, cy, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    // Direction de visée.
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + r * 1.8, cy);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
