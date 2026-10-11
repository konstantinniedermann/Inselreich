import type { World } from '../sim/types';
import { monumentNeedsConfirm } from './monumentView';

/** Knopftext nach dem ersten Klick bzw. Tastendruck auf das Denkmal mit Fortschritt (U-14). */
export const CONFIRM_TEXT = 'Wirklich abreissen? Fortschritt geht verloren';
/** Meldung, wenn Abriss-Werkzeug oder -Zug ein solches Denkmal überspringt (U-15). */
export const MAP_SKIP_TEXT = 'Denkmal nur im Panel abreissen';

export interface ConfirmState {
  armedId: number | null;
}

export type ConfirmInput =
  | { kind: 'press'; id: number } // Klick «Abreissen», Entf oder Backspace — gleich behandelt
  | { kind: 'reset' }; // Auswahlwechsel, Esc, Panel schliessen

/** Zwei-Klick-Zustand des Abrisses: nur das Denkmal mit Fortschritt verlangt den zweiten Druck. */
export function confirmStep(
  w: World,
  s: ConfirmState,
  input: ConfirmInput,
): { state: ConfirmState; demolish: boolean; buttonText: string | null } {
  const idle: ConfirmState = { armedId: null };
  if (input.kind === 'reset') return { state: idle, demolish: false, buttonText: null };
  if (!monumentNeedsConfirm(w, input.id)) return { state: idle, demolish: true, buttonText: null };
  if (s.armedId === input.id) return { state: idle, demolish: true, buttonText: null };
  return { state: { armedId: input.id }, demolish: false, buttonText: CONFIRM_TEXT };
}

/** Abriss-Werkzeug/-Zug: false für ein Denkmal mit Fortschritt (Meldung MAP_SKIP_TEXT), sonst true. */
export function mapDemolishAllowed(w: World, id: number): boolean {
  return !monumentNeedsConfirm(w, id);
}

/** Gebäude eines Zugs: abzureissende Ids (ohne Wiederholung) und ob ein Denkmal übersprungen wurde. */
export function strokeTargets(
  w: World,
  ids: readonly number[],
): { demolish: number[]; skipped: boolean } {
  const demolish: number[] = [];
  let skipped = false;
  for (const id of ids) {
    if (!mapDemolishAllowed(w, id)) skipped = true;
    else if (!demolish.includes(id)) demolish.push(id);
  }
  return { demolish, skipped };
}
