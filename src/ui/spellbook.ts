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
 * Grimoire : livre ouvert à deux pages avec effet de tourne-page.
 * - Double-page 0 : gauche = principe de sélection, droite = choix des sorts.
 * - Double-page k : sort k — gauche = description, droite = illustration + Équiper.
 * Un marque-page ramène directement à la sélection.
 */
export class Spellbook {
  private overlay: HTMLDivElement;
  private spreadEl!: HTMLDivElement;
  private leftPage!: HTMLDivElement;
  private rightPage!: HTMLDivElement;
  private navPrev!: HTMLButtonElement;
  private navNext!: HTMLButtonElement;

  private spells: Spell[] = Object.values(SPELLS);
  private current = 0;
  private loadout: (string | null)[] = [];
  private equipSlots?: HTMLElement;
  private equipPalette?: HTMLElement;
  /** Sort à mettre en avant sur la page de sélection (surbrillance temporaire). */
  private highlightSpell: string | null = null;
  private raf = 0;

  /** `onChange` est appelé après chaque modification du loadout (rafraîchit l'accueil). */
  constructor(private onChange?: () => void) {
    this.overlay = this.build();
    document.body.appendChild(this.overlay);
  }

  private get spreadCount(): number {
    return 1 + this.spells.length;
  }

  open(): void {
    this.loadout = store.getLoadout();
    this.current = 0;
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

    const book = document.createElement('div');
    book.className = 'book';

    // Marque-page (retour à la sélection).
    const ribbon = document.createElement('button');
    ribbon.className = 'book-ribbon';
    ribbon.title = 'Revenir à la sélection';
    ribbon.textContent = 'Sorts';
    ribbon.addEventListener('click', () => this.go(0));

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
    this.navPrev.textContent = '‹ Page précédente';
    this.navPrev.addEventListener('click', () => this.go(this.current - 1));
    this.navNext = document.createElement('button');
    this.navNext.textContent = 'Page suivante ›';
    this.navNext.addEventListener('click', () => this.go(this.current + 1));
    const close = document.createElement('button');
    close.className = 'book-close';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => this.close());
    nav.append(this.navPrev, this.navNext, close);

    book.append(ribbon, this.spreadEl, nav);
    overlay.append(scrim, book);
    return overlay;
  }

  /** Change de double-page. */
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

    if (index === 0) {
      this.renderIntro(this.leftPage);
      this.renderSelection(this.rightPage);
    } else {
      const spell = this.spells[index - 1];
      this.renderDescription(this.leftPage, spell);
      this.renderIllustration(this.rightPage, spell);
    }

    this.navPrev.disabled = index === 0;
    this.navNext.disabled = index === this.spreadCount - 1;
  }

  // --- Double-page 0 : sélection ---

  private renderIntro(el: HTMLElement): void {
    const h = document.createElement('h2');
    h.className = 'book-title';
    h.textContent = 'Choisir ses sorts';

    const p1 = document.createElement('p');
    p1.className = 'book-desc';
    p1.textContent =
      `Avant la bataille, équipe jusqu'à ${SLOT_COUNT} sorts. Chaque emplacement ` +
      `correspond à une touche (1 à ${SLOT_COUNT}).`;

    const p2 = document.createElement('p');
    p2.className = 'book-desc';
    p2.textContent =
      'Glisse un sort dans un emplacement, ou clique dessus. Un même sort ne peut ' +
      'être équipé qu’une seule fois.';

    const p3 = document.createElement('p');
    p3.className = 'book-desc';
    p3.textContent =
      'Tourne les pages pour découvrir chaque sort en détail. Le marque-page te ' +
      'ramène ici à tout moment.';

    el.append(h, p1, p2, p3);
  }

  private renderSelection(el: HTMLElement): void {
    const h = document.createElement('h2');
    h.className = 'book-title';
    h.textContent = 'Tes sorts';

    this.equipSlots = document.createElement('div');
    this.equipSlots.className = 'loadout-slots';

    const palLabel = document.createElement('div');
    palLabel.className = 'book-subtitle';
    palLabel.textContent = 'Sorts disponibles';
    this.equipPalette = document.createElement('div');
    this.equipPalette.className = 'spell-cards';

    el.append(h, this.equipSlots, palLabel, this.equipPalette);
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
        const chip = this.makeChip(spellId, false, i);
        if (spellId === this.highlightSpell) chip.classList.add('chip-highlight');
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

  /** Cartes des sorts disponibles : nom + début de description + boutons + / 📖. */
  private renderPalette(): void {
    const container = this.equipPalette;
    if (!container) return;
    container.innerHTML = '';

    this.spells.forEach((spell, idx) => {
      const equipped = this.loadout.includes(spell.id);
      const full = this.loadout.indexOf(null) < 0;

      const card = document.createElement('div');
      card.className = 'spell-card' + (equipped ? ' equipped' : '');
      card.style.setProperty('--c', spell.color);
      card.draggable = !equipped;
      if (spell.id === this.highlightSpell) card.classList.add('chip-highlight');

      if (!equipped) {
        card.addEventListener('dragstart', (e) => {
          card.classList.add('dragging');
          const payload = JSON.stringify({ spellId: spell.id, fromSlot: null });
          e.dataTransfer?.setData(DND_MIME, payload);
          e.dataTransfer?.setData('text/plain', payload);
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
      }

      // Haut : emblème coloré (glyphe) + nom + badge de recharge.
      const top = document.createElement('div');
      top.className = 'spell-card-top';
      const emblem = document.createElement('span');
      emblem.className = 'spell-emblem';
      emblem.innerHTML = spellIconSvg(spell.icon);
      const titles = document.createElement('div');
      titles.className = 'spell-card-titles';
      const name = document.createElement('div');
      name.className = 'spell-card-name';
      name.textContent = spell.name;
      const cd = document.createElement('div');
      cd.className = 'spell-card-cd';
      cd.textContent = `⟳ ${spell.cooldown}s`;
      titles.append(name, cd);
      top.append(emblem, titles);

      // Début de la description (source unique, tronquée par CSS).
      const desc = document.createElement('p');
      desc.className = 'spell-card-desc';
      desc.textContent = spell.description;

      const actions = document.createElement('div');
      actions.className = 'spell-card-actions';
      const equip = document.createElement('button');
      equip.className = 'spell-equip';
      equip.textContent = equipped ? '✓ Équipé' : full ? 'Complet' : 'Équiper';
      equip.disabled = equipped || full;
      equip.addEventListener('click', () => this.addToFirstEmpty(spell.id));
      const link = document.createElement('button');
      link.className = 'spell-card-link';
      link.textContent = 'Voir la fiche';
      link.addEventListener('click', () => this.go(idx + 1));
      actions.append(equip, link);

      card.append(top, desc, actions);
      container.appendChild(card);
    });
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
    this.persistSelection();
  }

  private setSlot(i: number, spellId: string | null): void {
    this.loadout[i] = spellId;
    this.persistSelection();
  }

  private addToFirstEmpty(spellId: string): void {
    if (this.loadout.includes(spellId)) return;
    const i = this.loadout.indexOf(null);
    if (i >= 0) this.setSlot(i, spellId);
  }

  /** Sauvegarde + rafraîchit uniquement la sélection (sans recréer la double-page). */
  private persistSelection(): void {
    store.setLoadout(this.loadout);
    this.renderSlots();
    this.renderPalette();
    this.onChange?.();
  }

  // --- Double-page d'un sort ---

  private renderDescription(el: HTMLElement, spell: Spell): void {
    const title = document.createElement('h2');
    title.className = 'book-title';
    title.style.color = spell.color;
    title.textContent = spell.name;

    const desc = document.createElement('p');
    desc.className = 'book-desc';
    desc.textContent = spell.description;

    const slot = this.loadout.indexOf(spell.id);
    const status = document.createElement('p');
    status.className = 'book-desc';
    status.textContent =
      slot >= 0 ? `Équipé sur la touche ${slot + 1}.` : 'Non équipé.';

    el.append(title, desc, status);
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
    btn.textContent = 'Équiper';
    btn.addEventListener('click', () => this.goToSelection(spell.id));

    el.append(canvas, stats, btn);
    this.startAnim(canvas, spell);
  }

  /** Ramène à la page de sélection et met en avant le sort cliqué. */
  private goToSelection(spellId: string): void {
    this.highlightSpell = spellId;
    this.go(0);
    window.setTimeout(() => {
      if (this.highlightSpell === spellId) {
        this.highlightSpell = null;
        this.renderSlots();
        this.renderPalette();
      }
    }, 1700);
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
