import { GOODS } from '../sim/defs/goods';
import type { Cost } from '../sim/types';

/** Setzt den Text eines `data-field`-Elements, nur wenn er sich geändert hat. */
export function setField(root: HTMLElement, field: string, text: string): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (el && el.textContent !== text) el.textContent = text;
  return el;
}

/** Kosten als Text, z. B. „50 Geld · 3 Holz"; Nullwerte ausser Geld entfallen (Spec L2, R122 Punkt 3). */
export function costLine(c: Cost): string {
  const parts = [`${c.money} Geld`];
  for (const g of ['wood', 'tools', 'stone'] as const)
    if (c[g]) parts.push(`${c[g]} ${GOODS[g].name}`);
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
