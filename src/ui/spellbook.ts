import { store } from '../storage/localStore';
import { SPELLS } from '../core/spells/definitions';
import { SLOT_COUNT } from '../input/keybindings';
import type { Spell } from '../core/spells/spell';
import { drawSpellPreview } from './spellPreview';
import {
  SPELL_TREE,
  costOf,
  isUnlockable,
  nodeOf,
  prereqsOf,
} from '../core/spells/tree';
import { xpIntoLevel, xpToNextLevel } from '../core/progression';

const DND_MIME = 'application/x-afl-spell';
const SVGNS = 'http://www.w3.org/2000/svg';

// Grille de rendu de l'arbre (positions en unités du viewBox).
const VIEW_W = 560;
const VIEW_H = 380;
const NODE_R = 26;
const colX = (col: number) => 60 + col * 110;
const rowY = (row: number) => 45 + row * 72;

/** Emblème SVG d'un sort à partir de son icône dédiée. */
function spellIconSvg(icon: string): string {
  return `<svg viewBox="0 0 24 24">${icon}</svg>`;
}

/**
 * Grimoire : barre d'emplacements (loadout) + arbre de talents en SVG. L'en-tête
 * affiche le niveau/les points ; l'arbre (page gauche) permet de débloquer les
 * sorts avec des points, et la fiche (page droite) de les équiper.
 */
export class Spellbook {
  private overlay: HTMLDivElement;
  private leftPage!: HTMLDivElement;
  private rightPage!: HTMLDivElement;
  private equipSlots!: HTMLElement;
  private progressEl!: HTMLDivElement;

  private current = 'fireball';
  private loadout: (string | null)[] = [];
  /** Emplacement à faire clignoter brièvement après un équipement. */
  private flashSlot: number | null = null;
  private raf = 0;

  /** `onChange` est appelé après chaque modification (rafraîchit l'accueil). */
  constructor(private onChange?: () => void) {
    this.overlay = this.build();
    document.body.appendChild(this.overlay);
  }

  open(): void {
    this.loadout = store.getLoadout();
    this.renderAll();
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

    const stack = document.createElement('div');
    stack.className = 'book-stack';

    // En-tête de progression (niveau + XP + points).
    this.progressEl = document.createElement('div');
    this.progressEl.className = 'book-progress';

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

    const spread = document.createElement('div');
    spread.className = 'book-spread';

    const leftLeaf = document.createElement('div');
    leftLeaf.className = 'book-leaf book-leaf--left';
    this.leftPage = document.createElement('div');
    this.leftPage.className = 'book-page book-tree-page';
    leftLeaf.appendChild(this.leftPage);

    const spine = document.createElement('div');
    spine.className = 'book-spine';

    const rightLeaf = document.createElement('div');
    rightLeaf.className = 'book-leaf book-leaf--right';
    this.rightPage = document.createElement('div');
    this.rightPage.className = 'book-page';
    rightLeaf.appendChild(this.rightPage);

    spread.append(leftLeaf, spine, rightLeaf);

    const nav = document.createElement('div');
    nav.className = 'book-nav';
    const hint = document.createElement('span');
    hint.className = 'book-tree-hint';
    hint.textContent = 'Clique un sort pour le débloquer ou l’équiper.';
    const close = document.createElement('button');
    close.className = 'book-close';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => this.close());
    nav.append(hint, close);

    book.append(spread, nav);
    stack.append(this.progressEl, loadoutBar, book);
    overlay.append(scrim, stack);
    return overlay;
  }

  /** Rafraîchit tout (en-tête, emplacements, arbre, fiche courante). */
  private renderAll(): void {
    this.renderProgress();
    this.renderSlots();
    this.renderTree();
    this.renderDetail(this.current);
  }

  // --- En-tête de progression ---

  private renderProgress(): void {
    const level = store.getLevel();
    const points = store.availablePoints();
    const { xp } = store.getProgress();
    const into = xpIntoLevel(xp);
    const need = xpToNextLevel(xp);
    const pct = need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 100;

    this.progressEl.innerHTML = '';
    const top = document.createElement('div');
    top.className = 'book-progress-top';
    const lvl = document.createElement('span');
    lvl.className = 'book-progress-level';
    lvl.textContent = `Niveau ${level}`;
    const pts = document.createElement('span');
    pts.className = 'book-progress-points' + (points > 0 ? ' has-points' : '');
    pts.textContent = points > 0 ? `${points} point${points > 1 ? 's' : ''} à dépenser` : 'Aucun point';
    const xpTxt = document.createElement('span');
    xpTxt.className = 'book-progress-xp';
    xpTxt.textContent = `${into} / ${need} XP`;
    top.append(lvl, pts, xpTxt);

    const bar = document.createElement('div');
    bar.className = 'book-progress-bar';
    const fill = document.createElement('div');
    fill.className = 'book-progress-fill';
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    this.progressEl.append(top, bar);
  }

  // --- Arbre de talents (SVG) ---

  private renderTree(): void {
    const unlocked = new Set(store.getProgress().unlocked);
    const points = store.availablePoints();

    this.leftPage.innerHTML = '';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'spell-tree');
    svg.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);

    // 1) Liens (prérequis parent -> enfant), dessinés en premier (sous les nœuds).
    for (const n of SPELL_TREE) {
      for (const req of n.requires) {
        const p = nodeOf(req);
        if (!p) continue;
        const line = document.createElementNS(SVGNS, 'line');
        line.setAttribute('x1', String(colX(p.col)));
        line.setAttribute('y1', String(rowY(p.row)));
        line.setAttribute('x2', String(colX(n.col)));
        line.setAttribute('y2', String(rowY(n.row)));
        const on = unlocked.has(n.id) || (unlocked.has(req) && isUnlockable(n.id, unlocked));
        line.setAttribute('class', 'tree-link' + (on ? ' active' : ''));
        svg.appendChild(line);
      }
    }

    // 2) Nœuds.
    for (const n of SPELL_TREE) {
      const spell = SPELLS[n.id];
      if (!spell) continue;
      const x = colX(n.col);
      const y = rowY(n.row);
      const isUn = unlocked.has(n.id);
      const canUn = !isUn && isUnlockable(n.id, unlocked);
      const affordable = canUn && costOf(n.id) <= points;

      const g = document.createElementNS(SVGNS, 'g');
      let cls = 'tree-node';
      if (isUn) cls += ' unlocked';
      else if (affordable) cls += ' unlockable';
      else cls += ' locked';
      if (this.loadout.includes(n.id)) cls += ' equipped';
      if (n.id === this.current) cls += ' selected';
      g.setAttribute('class', cls);
      g.setAttribute('transform', `translate(${x} ${y})`);
      g.style.setProperty('--c', spell.color);
      g.style.cursor = 'pointer';

      const circle = document.createElementNS(SVGNS, 'circle');
      circle.setAttribute('r', String(NODE_R));
      circle.setAttribute('class', 'tree-node-bg');
      g.appendChild(circle);

      // Icône (SVG imbriqué 24x24 centré).
      const icon = document.createElementNS(SVGNS, 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('x', String(-14));
      icon.setAttribute('y', String(-14));
      icon.setAttribute('width', '28');
      icon.setAttribute('height', '28');
      icon.setAttribute('class', 'tree-node-icon');
      icon.innerHTML = spell.icon;
      g.appendChild(icon);

      // Coût / cadenas en pastille.
      if (!isUn) {
        const badge = document.createElementNS(SVGNS, 'text');
        badge.setAttribute('class', 'tree-node-badge');
        badge.setAttribute('x', '0');
        badge.setAttribute('y', String(NODE_R + 14));
        badge.setAttribute('text-anchor', 'middle');
        badge.textContent = canUn ? `${costOf(n.id)} pt` : '🔒';
        g.appendChild(badge);
      }

      // Nom sous le nœud.
      const name = document.createElementNS(SVGNS, 'text');
      name.setAttribute('class', 'tree-node-name');
      name.setAttribute('x', '0');
      name.setAttribute('y', String(-NODE_R - 8));
      name.setAttribute('text-anchor', 'middle');
      name.textContent = spell.name;
      g.appendChild(name);

      g.addEventListener('click', () => {
        this.current = n.id;
        this.renderTree();
        this.renderDetail(n.id);
      });

      svg.appendChild(g);
    }

    this.leftPage.appendChild(svg);
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

  /** Sauvegarde + rafraîchit emplacements, arbre et fiche. */
  private persist(): void {
    store.setLoadout(this.loadout);
    this.renderSlots();
    this.renderTree();
    this.renderDetail(this.current);
    this.onChange?.();
  }

  // --- Fiche d'un sort (page droite) ---

  private renderDetail(spellId: string): void {
    this.stopAnim();
    this.rightPage.innerHTML = '';
    const spell = SPELLS[spellId];
    if (!spell) return;

    const title = document.createElement('h2');
    title.className = 'book-title';
    title.style.color = spell.color;
    title.textContent = spell.name;

    const emblem = document.createElement('span');
    emblem.className = 'spell-emblem book-emblem';
    emblem.style.setProperty('--c', spell.color);
    emblem.innerHTML = spellIconSvg(spell.icon);

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

    const btn = document.createElement('button');
    btn.className = 'book-equip';
    const info = this.actionInfo(spell);
    btn.textContent = info.text;
    btn.disabled = !!info.disabled;
    if (info.equipped) btn.classList.add('equipped');
    if (info.action) btn.addEventListener('click', info.action);

    this.rightPage.append(title, emblem, canvas, desc, stats, btn);
    this.startAnim(canvas, spell);
  }

  /** État du bouton d'action : débloquer (verrouillé) ou équiper/retirer (débloqué). */
  private actionInfo(spell: Spell): {
    text: string;
    disabled?: boolean;
    equipped?: boolean;
    action?: () => void;
  } {
    const unlocked = new Set(store.getProgress().unlocked);
    if (!unlocked.has(spell.id)) {
      const cost = costOf(spell.id);
      if (!isUnlockable(spell.id, unlocked)) {
        const names = prereqsOf(spell.id)
          .filter((r) => !unlocked.has(r))
          .map((r) => SPELLS[r]?.name ?? r)
          .join(', ');
        return { text: `🔒 Requiert : ${names}`, disabled: true };
      }
      if (cost > store.availablePoints()) {
        return { text: `Débloquer (${cost} pt) — points insuffisants`, disabled: true };
      }
      return {
        text: `Débloquer (${cost} pt)`,
        action: () => {
          if (store.unlockSpell(spell.id)) {
            this.renderProgress();
            this.renderTree();
            this.renderDetail(spell.id);
            this.onChange?.();
          }
        },
      };
    }

    // Débloqué : équiper / retirer.
    const slot = this.loadout.indexOf(spell.id);
    if (slot >= 0) {
      return {
        text: `✓ Équipé (touche ${slot + 1}) — retirer`,
        equipped: true,
        action: () => this.setSlot(slot, null),
      };
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
      drawSpellPreview(ctx, canvas, spell.preview, spell.color, t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stopAnim(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
