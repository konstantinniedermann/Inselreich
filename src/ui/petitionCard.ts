// petitionCard.ts — DOM: Karte der Bittschrift (I-210). Kein Modal, keine Pause (Muster: councilCard.ts).
// Inhalt aus `petitionCardModel` (DOM-frei); Rahmen, zwei Spalten und Knöpfe bleiben für andere Bitten nutzbar.
import type { World } from '../sim/types';
import { petitionCardModel, type PetitionCardModel } from './petition';

export interface PetitionCardHandle {
  readonly isOpen: boolean;
  /** Drawn-At der gezeigten Marke, sonst null. */
  readonly shown: number | null;
  /** Öffnet die Karte für die Marke `drawnAt` bzw. schliesst sie (`null`). */
  show(drawnAt: number | null): void;
  /** Zeichnet neu, nur wenn sich der Inhalt änderte (Fokus bleibt); schliesst, wenn die Marke weg ist. */
  update(world: World): void;
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

function column(title: string, rows: { cls: string; text: string }[]): HTMLElement {
  const col = el('div', 'petition-col');
  col.append(el('h3', '', title));
  for (const r of rows) if (r.text !== '') col.append(el('p', r.cls, r.text));
  return col;
}

export function createPetitionCard(
  host: HTMLElement,
  onAnswer: (drawnAt: number, answer: 'yes' | 'no') => void,
  onClose: () => void,
): PetitionCardHandle {
  const root = el('section', 'card petition-card');
  root.hidden = true;
  root.setAttribute('aria-label', 'Bittschrift');
  host.append(root);
  let shown: number | null = null;
  let disposed = false;
  let signature = '';

  const build = (m: PetitionCardModel, drawnAt: number): void => {
    root.replaceChildren();
    const head = el('div', 'petition-head');
    const close = el('button', 'btn petition-close', 'Schliessen');
    close.type = 'button';
    close.addEventListener('click', () => {
      if (disposed) return;
      close.blur();
      onClose();
    });
    head.append(el('h2', '', m.title), close);
    const body = el('div', 'petition-body');
    body.append(el('p', 'petition-text', m.text), el('p', 'petition-deadline', m.deadline));
    const grid = el('div', 'petition-grid');
    let yesAction: HTMLElement;
    if (m.yes.blocked === null) {
      const yes = el('button', 'btn petition-yes', 'Ja');
      yes.type = 'button';
      yes.dataset.testid = 'petition-yes';
      yes.addEventListener('click', () => {
        if (disposed) return;
        yes.blur();
        onAnswer(drawnAt, 'yes');
      });
      yesAction = yes;
    } else {
      const block = el('p', 'petition-block', m.yes.blocked);
      block.dataset.testid = 'petition-block';
      yesAction = block;
    }
    const no = el('button', 'btn petition-no', 'Nein');
    no.type = 'button';
    no.dataset.testid = 'petition-no';
    no.addEventListener('click', () => {
      if (disposed) return;
      no.blur();
      onAnswer(drawnAt, 'no');
    });
    grid.append(
      column('Ja', [
        { cls: 'petition-cost', text: `Kosten: ${m.yes.cost}` },
        { cls: 'petition-reward', text: `Lohn: ${m.yes.reward}` },
        ...m.yes.lines.map((text) => ({ cls: 'petition-line', text })),
      ]),
      column('Nein', [
        { cls: 'petition-effect', text: `Folge: ${m.no.effect}` },
        { cls: 'petition-near', text: m.no.nearFull ?? '' },
        { cls: 'petition-line', text: m.no.why },
        { cls: 'petition-tail', text: m.no.tail },
      ]),
    );
    // Knopfleiste ausserhalb des scrollenden Inhalts: «Ja» und «Nein» bleiben ohne Scrollen sichtbar.
    const actions = el('div', 'petition-actions');
    actions.append(yesAction, no);
    body.append(grid);
    root.append(head, body, actions);
  };

  const close = (): void => {
    shown = null;
    signature = '';
    root.hidden = true;
    root.replaceChildren();
  };

  return {
    get isOpen() {
      return shown !== null;
    },
    get shown() {
      return shown;
    },
    show(drawnAt) {
      if (disposed) return;
      if (drawnAt === null) {
        close();
        return;
      }
      shown = drawnAt;
      signature = '';
      root.hidden = false;
    },
    update(world) {
      if (disposed || shown === null) return;
      const m = petitionCardModel(world, shown);
      if (m === null) {
        close();
        return;
      }
      const sig = JSON.stringify(m);
      if (sig === signature) return;
      signature = sig;
      build(m, shown);
    },
    dispose() {
      disposed = true;
      shown = null;
      root.remove();
    },
  };
}
