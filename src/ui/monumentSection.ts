// monumentSection.ts — DOM: Abschnitt «Bau» im Denkmal-Panel (M13-E2, Spec 7.1 U-1 bis U-5).
// Knoten werden einmal je Auswahl gebaut; update schreibt nur Werte aus `monumentSectionModel` (Fokus bleibt).
import { MONUMENT_GOODS } from '../sim/defs/monument';
import type { MonumentGood, World } from '../sim/types';
import { monumentSectionModel } from './monumentView';

export interface MonumentSectionActions {
  start(): void;
  setPaused(paused: boolean): void;
  setBuy(good: MonumentGood, on: boolean): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  field?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (field) e.dataset.field = field;
  return e;
}

function setText(e: HTMLElement, text: string): void {
  if (e.textContent !== text) e.textContent = text;
}

function setHidden(e: HTMLElement, hidden: boolean): void {
  if (e.hidden !== hidden) e.hidden = hidden;
}

/** Baut den Abschnitt; der erste `update`-Aufruf füllt die Werte. */
export function buildMonumentSection(actions: MonumentSectionActions): HTMLElement {
  const root = el('div', 'monument-section', 'monument');
  const h = el('h3', '');
  h.textContent = 'Bau';
  root.append(h);
  root.append(
    el('p', 'panel-line monument-stage', 'monument-stage'),
    el('p', 'panel-line monument-reason negative', 'monument-reason'),
    el('p', 'panel-line monument-eta', 'monument-eta'),
  );
  const rows = el('div', 'monument-rows');
  for (const good of MONUMENT_GOODS) {
    const row = el('div', 'monument-row');
    row.dataset.monumentRow = good;
    const label = el('span', 'monument-label', 'monument-label');
    const bar = el('div', 'monument-bar');
    bar.append(el('div', 'monument-fill', 'monument-fill'));
    const reserve = el('small', 'monument-reserve', 'monument-reserve');
    const buyLabel = el('label', 'monument-buy');
    const box = el('input', '', 'monument-buy-box');
    box.type = 'checkbox';
    box.addEventListener('change', () => actions.setBuy(good, box.checked));
    buyLabel.append(box, el('span', '', 'monument-buy-text'));
    row.append(label, bar, reserve, buyLabel);
    rows.append(row);
  }
  root.append(rows);
  const pause = el('button', 'btn monument-pause', 'monument-pause');
  pause.type = 'button';
  pause.addEventListener('click', () => {
    pause.blur();
    actions.setPaused(pause.dataset.paused !== 'true');
  });
  const start = el('button', 'btn monument-start', 'monument-start');
  start.type = 'button';
  start.addEventListener('click', () => {
    start.blur();
    actions.start();
  });
  const buttons = el('div', 'monument-buttons');
  buttons.append(pause, start);
  root.append(buttons);
  return root;
}

function field<T extends HTMLElement>(root: HTMLElement, name: string, scope?: HTMLElement): T {
  return (scope ?? root).querySelector<T>(`[data-field="${name}"]`)!;
}

/** Schreibt nur Werte (Text, `hidden`, `disabled`, `checked`, `title`, Klassen); ändert nie die Knotenmenge. */
export function updateMonumentSection(root: HTMLElement, w: World): void {
  for (const e of monumentSectionModel(w).entries) {
    if (e.kind === 'line') {
      const n = field(root, `monument-${e.key}`);
      setText(n, e.text);
      setHidden(n, e.hidden);
    } else if (e.kind === 'row') {
      const row = root.querySelector<HTMLElement>(`[data-monument-row="${e.good}"]`)!;
      setHidden(row, e.hidden);
      setText(field(root, 'monument-label', row), e.label);
      const fill = field(root, 'monument-fill', row);
      const width = `${e.pct}%`;
      if (fill.style.width !== width) fill.style.width = width;
      setText(field(root, 'monument-reserve', row), e.reserveText);
      setText(field(root, 'monument-buy-text', row), e.buyText);
      const box = field<HTMLInputElement>(root, 'monument-buy-box', row);
      if (box.checked !== e.buyOn) box.checked = e.buyOn;
    } else if (e.kind === 'pause') {
      const btn = field<HTMLButtonElement>(root, 'monument-pause');
      setText(btn, e.text);
      setHidden(btn, e.hidden);
      btn.dataset.paused = String(e.text === 'Bau fortsetzen');
    } else {
      const btn = field<HTMLButtonElement>(root, 'monument-start');
      setText(btn, e.text);
      setHidden(btn, e.hidden);
      if (btn.disabled !== e.disabled) btn.disabled = e.disabled;
      btn.classList.toggle('unaffordable', e.unaffordable);
      if (btn.title !== e.title) btn.title = e.title;
    }
  }
}
