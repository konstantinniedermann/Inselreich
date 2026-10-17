// trialCard.ts — DOM: Auflagen-Karte der Meisterprüfung (I-132). Kein Modal, keine Pause (Muster: councilCard.ts).
// Inhalt aus `trialCardView` (DOM-frei); die Vorschau wird gedrosselt neu berechnet (P-5).
import type { World } from '../sim/types';
import { GOODS_BALANCE_TICKS } from './time';
import { selfSupplyPreview, trialCardView, type DeficitLine, type TrialCardView } from './trial';

export interface TrialCardHandle {
  readonly isOpen: boolean;
  /** Öffnet/schliesst; `want` erzwingt den Zustand. */
  setOpen(want: boolean): void;
  /** Zeichnet neu, nur wenn sich der Inhalt änderte; die Vorschau höchstens alle `GOODS_BALANCE_TICKS`. */
  update(world: World): void;
  /** Schliesst die Karte und entfernt sie aus dem Seitenaufbau; danach wirkungslos. */
  dispose(): void;
}

const ARM_TEXT = 'Wirklich abbrechen?';

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

export function createTrialCard(
  host: HTMLElement,
  onStart: () => void,
  onAbort: () => void,
  onClose: () => void,
  preview: (w: World) => DeficitLine[] = selfSupplyPreview,
): TrialCardHandle {
  const root = el('section', 'card trial-card');
  root.hidden = true;
  root.setAttribute('aria-label', 'Meisterprüfung');
  host.append(root);
  let open = false;
  let disposed = false;
  let armed = false;
  let signature = '';
  let viewJson = '';
  let lastWorld: World | null = null;
  let lastLines: DeficitLine[] = [];
  let previewTick: number | null = null;
  let lastKind: TrialCardView['action']['kind'] | null = null;

  const build = (view: TrialCardView): void => {
    root.replaceChildren();
    const head = el('div', 'trial-head');
    const close = el('button', 'btn trial-close', 'Schliessen');
    close.type = 'button';
    close.addEventListener('click', () => {
      if (disposed) return;
      close.blur();
      onClose();
    });
    head.append(el('h2', '', 'Meisterprüfung'), close);
    root.append(
      head,
      el('h3', '', view.name),
      el('p', 'trial-rule', view.rule),
      el('p', 'trial-condition', view.condition),
      el('p', 'trial-preview', `Ohne Zukauf fehlen: ${view.preview}`),
      el('p', 'trial-fire', view.fireHint),
    );
    if (view.status !== null) root.append(el('p', 'trial-status', view.status));
    const a = view.action;
    if (a.kind === 'none') return;
    const btn = el('button', 'btn trial-action');
    btn.type = 'button';
    if (a.kind === 'start') {
      btn.textContent = 'Auflage beginnen';
      btn.classList.toggle('unaffordable', a.reason !== null);
      if (a.reason !== null) btn.title = a.reason;
      btn.addEventListener('click', () => {
        if (disposed) return;
        btn.blur();
        onStart(); // bei gesperrtem Start zeigt der Handler den Grund
      });
    } else {
      btn.textContent = armed ? ARM_TEXT : 'Abbrechen';
      btn.addEventListener('click', () => {
        if (disposed) return;
        if (!armed) {
          armed = true;
          btn.textContent = ARM_TEXT;
          signature = `${viewJson}|armed`;
          return;
        }
        armed = false;
        btn.blur();
        onAbort();
      });
    }
    root.append(btn);
  };

  const render = (world: World): void => {
    if (previewTick === null || world.tick - previewTick >= GOODS_BALANCE_TICKS) {
      lastLines = preview(world);
      previewTick = world.tick;
    }
    const view = trialCardView(world, lastLines);
    if (lastKind !== view.action.kind) armed = false; // Review Focus 4
    lastKind = view.action.kind;
    viewJson = JSON.stringify(view);
    const sig = armed ? `${viewJson}|armed` : viewJson;
    if (sig === signature) return;
    signature = sig;
    build(view);
  };

  return {
    get isOpen() {
      return open;
    },
    setOpen(want) {
      if (disposed) return;
      if (!want) armed = false;
      open = want;
      root.hidden = !want;
      if (want) {
        signature = '';
        previewTick = null;
        if (lastWorld) render(lastWorld);
      }
    },
    update(world) {
      if (disposed) return;
      lastWorld = world;
      if (open) render(world);
    },
    dispose() {
      disposed = true;
      open = false;
      armed = false;
      lastWorld = null;
      root.remove();
    },
  };
}
