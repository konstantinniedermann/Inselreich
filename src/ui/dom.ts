import type { Cost } from '../sim/types';

/** Setzt den Text eines `data-field`-Elements, nur wenn er sich geändert hat. */
export function setField(root: HTMLElement, field: string, text: string): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (el && el.textContent !== text) el.textContent = text;
  return el;
}

/** Kosten als Kurztext, z. B. „G 50 · H 3"; Nullwerte ausser Geld entfallen. */
export function costLine(c: Cost): string {
  const parts = [`G ${c.money}`];
  if (c.wood) parts.push(`H ${c.wood}`);
  if (c.tools) parts.push(`W ${c.tools}`);
  if (c.stone) parts.push(`S ${c.stone}`);
  return parts.join(' · ');
}

/**
 * Soll ein Knopf nach dem Klick den Fokus abgeben? Nur nach Mausklick (`detail` ≥ 1), damit kein Fokusring
 * zurückbleibt. Eine Tastenbestätigung (Enter, Leertaste; `detail` 0) behält den Fokus, damit ein
 * Zwei-Klick-Knopf („Wirklich laden?") per Tastatur bestätigt werden kann.
 */
export function blurAfterClick(detail: number): boolean {
  return detail > 0;
}
