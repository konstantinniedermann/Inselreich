import { describe, expect, it } from 'vitest';
import { startMonumentStage } from '../../src/sim/monument';
import type { World } from '../../src/sim/types';
import {
  CONFIRM_TEXT,
  MAP_SKIP_TEXT,
  confirmStep,
  mapDemolishAllowed,
  strokeTargets,
  type ConfirmInput,
  type ConfirmState,
} from '../../src/ui/demolishConfirm';
import { monumentWorld, placeMonument } from '../sim/monumentHelpers';
import { placeTownhall, village } from '../sim/helpers';

const IDLE: ConfirmState = { armedId: null };
const PRESS = (id: number): ConfirmInput => ({ kind: 'press', id });

function runningMonument(): { w: World; id: number } {
  const w = monumentWorld();
  const id = placeMonument(w);
  expect(startMonumentStage(w).ok).toBe(true);
  return { w, id };
}

/** Spielt Eingaben nacheinander ab; liefert je Schritt Abriss und Knopftext. */
function play(w: World, inputs: ConfirmInput[]): { demolish: boolean; text: string | null }[] {
  let s = IDLE;
  return inputs.map((i) => {
    const r = confirmStep(w, s, i);
    s = r.state;
    return { demolish: r.demolish, text: r.buttonText };
  });
}

const FIRST = { demolish: false, text: CONFIRM_TEXT };
const SECOND = { demolish: true, text: null };

describe('AK-M13E2-34 Abriss-Bestätigung (Anhang 08 C)', () => {
  it('C1 Denkmal laufend: erster Klick Text ohne Abriss, zweiter Abriss', () => {
    const { w, id } = runningMonument();
    expect(play(w, [PRESS(id), PRESS(id)])).toEqual([FIRST, SECOND]);
  });

  it('C2 Entf/Entf, Backspace/Backspace und Klick/Entf wirken wie C1', () => {
    const { w, id } = runningMonument();
    // Knopf und Taste sind derselbe Eingang `press`; drei Folgen je einzeln
    for (let i = 0; i < 3; i++) expect(play(w, [PRESS(id), PRESS(id)])).toEqual([FIRST, SECOND]);
  });

  it('C3 Auswahlwechsel, Esc oder Panel schliessen setzt zurück; Folgeklick macht nur scharf', () => {
    const { w, id } = runningMonument();
    const armed = confirmStep(w, IDLE, PRESS(id)).state;
    expect(armed.armedId).toBe(id);
    const reset = confirmStep(w, armed, { kind: 'reset' });
    expect(reset).toEqual({ state: IDLE, demolish: false, buttonText: null });
    expect(confirmStep(w, reset.state, PRESS(id))).toEqual({
      state: { armedId: id },
      demolish: false,
      buttonText: CONFIRM_TEXT,
    });
    // Druck auf eine andere Id setzt zurück und behandelt die neue Id neu
    const other = confirmStep(w, armed, PRESS(id + 1));
    expect(other.demolish).toBe(true);
    expect(other.state).toEqual(IDLE);
  });

  it('C4 Denkmal Stufe 1 oder 2, nicht laufend: Klick, Klick wie C1', () => {
    for (const stage of [1, 2]) {
      const w = monumentWorld();
      const id = placeMonument(w);
      w.monument!.stage = stage;
      w.monument!.running = false;
      expect(play(w, [PRESS(id), PRESS(id)])).toEqual([FIRST, SECOND]);
    }
  });

  it('C5 Denkmal Stufe 0 nicht laufend: sofort Abriss ohne Text', () => {
    const w = monumentWorld();
    const id = placeMonument(w);
    expect(play(w, [PRESS(id)])).toEqual([SECOND]);
  });

  it('C6 Haus und Amtsstube: Entf, Backspace, Klick sofort Abriss', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const hall = placeTownhall(w);
    for (const id of [houses[0]!.id, hall.id])
      expect(play(w, [PRESS(id), PRESS(id), PRESS(id)])).toEqual([SECOND, SECOND, SECOND]);
  });

  it('C7 Karten-Abriss überspringt Denkmal mit Fortschritt, Haus wird abgerissen', () => {
    const { w, id } = runningMonument();
    const house = id + 1; // jedes andere Gebäude: nur die Id zählt
    expect(mapDemolishAllowed(w, id)).toBe(false);
    expect(mapDemolishAllowed(w, house)).toBe(true);
    expect(MAP_SKIP_TEXT).toBe('Denkmal nur im Panel abreissen');
    expect(strokeTargets(w, [id, house, id])).toEqual({ demolish: [house], skipped: true });
    expect(strokeTargets(w, [house])).toEqual({ demolish: [house], skipped: false });
  });
});
