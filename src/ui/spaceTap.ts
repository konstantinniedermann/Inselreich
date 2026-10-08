// Leertaste antippen = Pause (Spec TASTEN-KOMFORT 4.2): reiner Automat, Zeitstempel als Parameter, keine Uhr, kein DOM.

/** Längste Tipp-Dauer in ms; ab hier zählt die Leertaste als gehalten. Bedien-Konstante, kein Spielwert. */
export const SPACE_TAP_MAX_MS = 300;

export type SpaceTapResult = 'toggle' | 'none';

export interface SpaceTap {
  keyDown(t: number, repeat: boolean): void;
  pointerDown(): void;
  keyUp(t: number): SpaceTapResult;
  blur(): void;
}

type State = { kind: 'idle' } | { kind: 'armed'; t0: number } | { kind: 'spoiled' };

export function createSpaceTap(): SpaceTap {
  let s: State = { kind: 'idle' };
  return {
    keyDown(t, repeat) {
      if (!repeat) s = { kind: 'armed', t0: t };
    },
    pointerDown() {
      if (s.kind === 'armed') s = { kind: 'spoiled' };
    },
    keyUp(t) {
      const prev = s;
      s = { kind: 'idle' };
      if (prev.kind !== 'armed') return 'none';
      const dt = t - prev.t0;
      return dt >= 0 && dt < SPACE_TAP_MAX_MS ? 'toggle' : 'none';
    },
    blur() {
      s = { kind: 'idle' };
    },
  };
}
