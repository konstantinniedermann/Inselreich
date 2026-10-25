// Ehrenbuch-Karte (I-186, Spec §4): Liste der Meisterstücke. Nur textContent, nie innerHTML (N8).
import { openModal } from './modal';
import type { HonorCount, HonorRow } from './honorView';

export interface HonorCardOptions {
  rows: HonorRow[];
  count: HonorCount;
  hints: string[];
  opener?: HTMLElement | null;
}

function el(tag: string, text?: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

export function openHonorCard(host: HTMLElement, o: HonorCardOptions): () => void {
  const m = openModal({ host, className: 'card--honors', label: 'Ehrenbuch', opener: o.opener });
  const head = el('p', `${o.count.have} von ${o.count.total}`, 'honor-count');
  const hints = o.hints.map((h) => el('p', h, 'note'));
  const list = el('ul', undefined, 'honor-list');
  for (const r of o.rows) {
    const li = el('li', undefined, r.done ? 'honor-row' : 'honor-row honor-row--open');
    li.append(el('strong', r.name, 'honor-name'));
    if (r.done) {
      const d = r.done;
      li.append(el('span', [d.date, d.map, d.crisis, d.time].join(' · '), 'honor-meta'));
      if (r.sessionOnly) li.append(el('span', 'in dieser Sitzung', 'honor-meta'));
    } else {
      li.append(el('span', r.condition, 'honor-meta'));
    }
    list.append(li);
  }
  const close = el('button', 'Schliessen', 'btn') as HTMLButtonElement;
  close.type = 'button';
  close.addEventListener('click', () => m.close());
  m.card.append(el('h2', 'Ehrenbuch'), head, ...hints, list, close);
  close.focus({ preventScroll: true });
  return m.close;
}
