// councilCard.ts — DOM: Rats-Karte (I-112). Kein Modal, keine Pause: schwebt am Rand der Spielfläche.
// Inhalt aus `councilCards` (DOM-frei); Entscheiden erst über «Beschluss fassen», Wahl nur markiert.
import type { CouncilSide, CouncilTier, World } from '../sim/types';
import { councilCards, type CouncilView } from './council';

export interface CouncilCardHandle {
  readonly isOpen: boolean;
  /** Öffnet/schliesst; `want` erzwingt den Zustand. */
  setOpen(want: boolean): void;
  /** Zeichnet neu, nur wenn sich der Inhalt änderte (Fokus und Markierung bleiben). */
  update(world: World): void;
  /** Schliesst die Karte und entfernt sie aus dem Seitenaufbau; danach wirkungslos. */
  dispose(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function createCouncilCard(
  host: HTMLElement,
  onDecree: (tier: CouncilTier, side: CouncilSide) => void,
  onClose: () => void,
): CouncilCardHandle {
  const root = el('section', 'card council-card');
  root.hidden = true;
  root.setAttribute('aria-label', 'Rat');
  host.append(root);
  let open = false;
  let disposed = false;
  let signature = '';
  let lastView: CouncilView | null = null;
  const picked = new Map<CouncilTier, CouncilSide>();

  const build = (view: CouncilView): void => {
    root.replaceChildren();
    const head = el('div', 'council-head');
    const close = el('button', 'btn council-close', 'Schliessen');
    close.type = 'button';
    close.addEventListener('click', () => {
      if (disposed) return;
      close.blur();
      onClose();
    });
    head.append(el('h2', '', 'Der Rat'), close);
    root.append(head, el('p', 'council-note', view.note));
    if (view.open.length === 0) root.append(el('p', 'council-empty', 'Kein Beschluss offen.'));
    for (const { tier, cards } of view.open) {
      const row = el('div', 'council-tier');
      row.append(el('h3', '', `Stufe ${tier}`));
      const grid = el('div', 'council-grid');
      const buttons: HTMLButtonElement[] = [];
      const go = el('button', 'btn council-go', 'Beschluss fassen');
      go.type = 'button';
      const sync = (): void => {
        const sel = picked.get(tier);
        for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.side === sel));
        go.disabled = sel === undefined;
      };
      for (const c of cards) {
        const b = el('button', 'council-option');
        b.type = 'button';
        b.dataset.side = c.side;
        b.append(el('strong', 'council-name', c.name), el('span', 'council-text', c.text));
        b.addEventListener('click', () => {
          picked.set(tier, c.side);
          sync();
        });
        buttons.push(b);
        grid.append(b);
      }
      go.addEventListener('click', () => {
        const sel = picked.get(tier);
        if (disposed || sel === undefined) return;
        picked.delete(tier);
        go.blur();
        onDecree(tier, sel);
      });
      sync();
      row.append(grid, go);
      root.append(row);
    }
    if (view.decided.length > 0) {
      const list = el('ul', 'council-decided');
      for (const line of view.decided) list.append(el('li', '', line));
      root.append(el('h3', '', 'Gefasst'), list);
    }
  };

  return {
    get isOpen() {
      return open;
    },
    setOpen(want) {
      if (disposed) return;
      open = want;
      root.hidden = !want;
      if (want && lastView) {
        signature = '';
        build(lastView);
        signature = JSON.stringify(lastView);
      }
    },
    update(world) {
      if (disposed) return;
      lastView = councilCards(world);
      if (!open) return;
      const sig = JSON.stringify(lastView);
      if (sig === signature) return;
      signature = sig;
      build(lastView);
    },
    dispose() {
      disposed = true;
      open = false;
      lastView = null;
      picked.clear();
      root.remove();
    },
  };
}
