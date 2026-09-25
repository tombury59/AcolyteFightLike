import { store } from '../storage/localStore';
import { SPELLS } from '../core/spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';
import type { Spell } from '../core/spells/spell';

const DND_MIME = 'application/x-afl-spell';

/** Emblème SVG d'un sort à partir de son icône dédiée. */
function spellIconSvg(icon: string): string {
  return `<svg viewBox="0 0 24 24">${icon}</svg>`;
}

/**
 * Grimoire : une barre d'emplacements (loadout) fixe AU-DESSUS du livre, visible
 * sur toutes les pages, et un livre-catalogue dont chaque double-page présente un
 * sort (description à gauche, illustration + bouton Équiper à droite).
 */
export class Spellbook {
  private overlay: HTMLDivElement;
  private spreadEl!: HTMLDivElement;
  private leftPage!: HTMLDivElement;
  private rightPage!: HTMLDivElement;
  private navPrev!: HTMLButtonElement;
  private navNext!: HTMLButtonElement;
  private equipSlots!: HTMLElement;

  private spells: Spell[] = Object.values(SPELLS);
  private current = 0;
  private loadout: (string | null)[] = [];
  /** Emplacement à faire clignoter brièvement après un équipement. */
  private flashSlot: number | null = null;
  private raf = 0;

  /** `onChange` est appelé après chaque modification du loadout (rafraîchit l'accueil). */
  constructor(private onChange?: () => void) {
    this.overlay = this.build();
    document.body.appendChild(this.overlay);
  }

  private get spreadCount(): number {
    return this.spells.length;
  }

  open(): void {
    this.loadout = store.getLoadout();
    this.current = 0;
    this.renderSlots();
    this.renderSpread(0);
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

    // Colonne : barre d'emplacements + livre.
    const stack = document.createElement('div');
    stack.className = 'book-stack';

    // Barre d'emplacements persistante (au-dessus du livre).
    const loadoutBar = document.createElement('div');
    loadoutBar.className = 'book-loadout';
    const label = document.createElement('div');
    label.className = 'book-loadout-label';
    label.textContent = `Tes sorts — ${SLOT_COUNT} emplacements (touches 1 à ${SLOT_COUNT})`;
    this.equipSlots = document.createElement('div');
    this.equipSlots.className = 'loadout-slots';
    loadoutBar.append(label, this.equipSlots);

    const book = document.createElement('div');
    book.className = 'book';

    this.spreadEl = document.createElement('div');
    this.spreadEl.className = 'book-spread';

    const leftLeaf = document.createElement('div');
    leftLeaf.className = 'book-leaf book-leaf--left';
    this.leftPage = document.createElement('div');
    this.leftPage.className = 'book-page';
    leftLeaf.appendChild(this.leftPage);

    const spine = document.createElement('div');
    spine.className = 'book-spine';

    const rightLeaf = document.createElement('div');
    rightLeaf.className = 'book-leaf book-leaf--right';
    this.rightPage = document.createElement('div');
    this.rightPage.className = 'book-page';
    rightLeaf.appendChild(this.rightPage);

    this.spreadEl.append(leftLeaf, spine, rightLeaf);

    // Navigation (sur le bois, sous les pages).
    const nav = document.createElement('div');
    nav.className = 'book-nav';
    this.navPrev = document.createElement('button');
    this.navPrev.textContent = '‹ Sort précédent';
    this.navPrev.addEventListener('click', () => this.go(this.current - 1));
    this.navNext = document.createElement('button');
    this.navNext.textContent = 'Sort suivant ›';
    this.navNext.addEventListener('click', () => this.go(this.current + 1));
    const close = document.createElement('button');
    close.className = 'book-close';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => this.close());
    nav.append(this.navPrev, this.navNext, close);

    book.append(this.spreadEl, nav);
    stack.append(loadoutBar, book);
    overlay.append(scrim, stack);
    return overlay;
  }

  /** Change de double-page (un sort par double-page). */
  private go(target: number): void {
    const clamped = Math.max(0, Math.min(this.spreadCount - 1, target));
    if (clamped === this.current) return;
    this.current = clamped;
    this.renderSpread(clamped);
  }

  private renderSpread(index: number): void {
    this.stopAnim();
    this.leftPage.innerHTML = '';
    this.rightPage.innerHTML = '';

    const spell = this.spells[index];
    this.renderDescription(this.leftPage, spell);
    this.renderIllustration(this.rightPage, spell);

    this.navPrev.disabled = index === 0;
    this.navNext.disabled = index === this.spreadCount - 1;
  }

  // --- Barre d'emplacements persistante ---

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
        const chip = this.makeChip(spellId, true, i);
        if (i === this.flashSlot) chip.classList.add('chip-highlight');
        slot.appendChild(chip);
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
      const tmp = this.loadout[target];
      this.loadout[target] = this.loadout[data.fromSlot];
      this.loadout[data.fromSlot] = tmp;
    } else {
      const existing = this.loadout.indexOf(data.spellId);
      if (existing >= 0 && existing !== target) this.loadout[existing] = this.loadout[target];
      this.loadout[target] = data.spellId;
    }
    this.persist();
  }

  private setSlot(i: number, spellId: string | null): void {
    this.loadout[i] = spellId;
    this.persist();
  }

  private addToFirstEmpty(spellId: string): void {
    if (this.loadout.includes(spellId)) return;
    const i = this.loadout.indexOf(null);
    if (i < 0) return;
    this.loadout[i] = spellId;
    this.flashSlot = i;
    this.persist();
    window.setTimeout(() => {
      if (this.flashSlot === i) {
        this.flashSlot = null;
        this.renderSlots();
      }
    }, 1200);
  }

  /** Sauvegarde + rafraîchit la barre d'emplacements et la page courante. */
  private persist(): void {
    store.setLoadout(this.loadout);
    this.renderSlots();
    this.renderSpread(this.current);
    this.onChange?.();
  }

  // --- Double-page d'un sort ---

  private renderDescription(el: HTMLElement, spell: Spell): void {
    const title = document.createElement('h2');
    title.className = 'book-title';
    title.style.color = spell.color;
    title.textContent = spell.name;

    const emblem = document.createElement('span');
    emblem.className = 'spell-emblem book-emblem';
    emblem.style.setProperty('--c', spell.color);
    emblem.innerHTML = spellIconSvg(spell.icon);

    const desc = document.createElement('p');
    desc.className = 'book-desc';
    desc.textContent = spell.description;

    const slot = this.loadout.indexOf(spell.id);
    const status = document.createElement('p');
    status.className = 'book-desc book-status';
    status.textContent = slot >= 0 ? `Équipé sur la touche ${slot + 1}.` : 'Non équipé.';

    el.append(title, emblem, desc, status);
  }

  private renderIllustration(el: HTMLElement, spell: Spell): void {
    const canvas = document.createElement('canvas');
    canvas.className = 'book-visual';
    canvas.width = 520;
    canvas.height = 240;

    const stats = document.createElement('div');
    stats.className = 'book-stats';
    stats.innerHTML = `<span>Recharge&nbsp;: <b>${spell.cooldown}s</b></span>`;

    const btn = document.createElement('button');
    btn.className = 'book-equip';
    const info = this.equipInfo(spell);
    btn.textContent = info.text;
    btn.disabled = !!info.disabled;
    if (info.action) btn.addEventListener('click', info.action);

    el.append(canvas, stats, btn);
    this.startAnim(canvas, spell);
  }

  /** État du bouton Équiper selon que le sort est équipé, ou que le loadout est plein. */
  private equipInfo(spell: Spell): { text: string; disabled?: boolean; action?: () => void } {
    const slot = this.loadout.indexOf(spell.id);
    if (slot >= 0) {
      return { text: `✓ Équipé (touche ${slot + 1}) — retirer`, action: () => this.setSlot(slot, null) };
    }
    if (this.loadout.indexOf(null) < 0) {
      return { text: 'Emplacements pleins', disabled: true };
    }
    return { text: 'Équiper', action: () => this.addToFirstEmpty(spell.id) };
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

  private drawOrb(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, color: string, t: number): void {
    this.clear(ctx, c);
    const cy = c.height / 2;
    const period = 3.2;
    const p = (t % period) / period;
    const orbR = 46;
    const x = -orbR + p * (c.width + orbR * 2);

    const targetR = 12;
    const tx = x + orbR + targetR;
    ctx.beginPath();
    ctx.arc(tx, cy, targetR, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();

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

  private drawBlink(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, color: string, t: number): void {
    this.clear(ctx, c);
    const cy = c.height / 2;
    const period = 1.6;
    const p = (t % period) / period;
    const startX = 90;
    const jump = 170;
    const r = 16;
    const x = p < 0.5 ? startX : startX + jump;

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
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + r * 1.8, cy);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
