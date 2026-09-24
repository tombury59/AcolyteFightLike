import { store } from '../storage/localStore';
import { DEFAULT_SPELL_BINDINGS, formatCode } from '../input/keybindings';
import { SPELLS } from '../core/spells/definitions';

/**
 * Écran menu / paramètres (DOM) affiché avant une manche.
 * Pseudo et déclencheurs de sorts sont persistés dans localStorage.
 */
export class Menu {
  private root: HTMLDivElement;
  private bindingLabels = new Map<string, HTMLSpanElement>();
  /** Nettoyage d'une capture de touche en cours (rebind). */
  private cancelCapture: (() => void) | null = null;

  constructor(private onPlay: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'menu hidden';

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = 'Acolyte Fight Like';
    panel.appendChild(title);

    panel.appendChild(this.buildNameField());
    panel.appendChild(this.buildBindings());

    const play = document.createElement('button');
    play.className = 'menu-play';
    play.textContent = 'Jouer';
    play.addEventListener('click', () => this.onPlay());
    panel.appendChild(play);

    this.root.appendChild(panel);
    document.body.appendChild(this.root);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.cancelCapture?.();
    this.root.classList.add('hidden');
  }

  private buildNameField(): HTMLElement {
    const row = document.createElement('label');
    row.className = 'menu-row';

    const label = document.createElement('span');
    label.textContent = 'Pseudo';
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 16;
    input.value = store.getPlayerName();
    input.addEventListener('input', () => {
      const name = input.value.trim() || 'Acolyte';
      store.setPlayerName(name);
    });
    row.appendChild(input);
    return row;
  }

  private buildBindings(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'menu-section';

    const heading = document.createElement('div');
    heading.className = 'menu-heading';
    heading.textContent = 'Touches des sorts';
    section.appendChild(heading);

    const bindings = store.getSpellBindings();
    for (const spellId of Object.keys(DEFAULT_SPELL_BINDINGS)) {
      const spell = SPELLS[spellId];
      const row = document.createElement('div');
      row.className = 'menu-row';

      const name = document.createElement('span');
      name.textContent = spell ? spell.name : spellId;
      row.appendChild(name);

      const btn = document.createElement('button');
      btn.className = 'menu-bind';
      const codeLabel = document.createElement('span');
      codeLabel.textContent = this.formatBinding(bindings[spellId]);
      this.bindingLabels.set(spellId, codeLabel);
      btn.appendChild(codeLabel);
      btn.addEventListener('click', () => this.startRebind(spellId, codeLabel));
      row.appendChild(btn);

      section.appendChild(row);
    }
    return section;
  }

  private formatBinding(codes: string[] | undefined): string {
    if (!codes || codes.length === 0) return '—';
    return codes.map(formatCode).join(' / ');
  }

  /** Capture la prochaine touche/bouton et l'assigne au sort. */
  private startRebind(spellId: string, label: HTMLSpanElement): void {
    this.cancelCapture?.();
    label.textContent = 'Appuyez sur une touche…';

    const finish = (code: string) => {
      const bindings = store.getSpellBindings();
      bindings[spellId] = [code];
      store.setSpellBindings(bindings);
      this.cancelCapture?.();
      label.textContent = this.formatBinding(bindings[spellId]);
    };

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Certains claviers/événements synthétiques n'ont pas de `code` : on ignore.
      if (!e.code) return;
      if (e.code === 'Escape') {
        this.cancelCapture?.();
        label.textContent = this.formatBinding(store.getSpellBindings()[spellId]);
        return;
      }
      finish(e.code);
    };
    const onMouse = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      finish(`Mouse${e.button}`);
    };

    this.cancelCapture = () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onMouse, true);
      this.cancelCapture = null;
    };

    // Décalé d'un tick pour ne pas capter le clic qui a lancé le rebind.
    setTimeout(() => {
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('mousedown', onMouse, true);
    }, 0);
  }
}
