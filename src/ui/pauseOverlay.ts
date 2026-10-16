// Pause-Anzeige (I-097): reine Sichtbarkeitsregel plus Schreiben auf das übergebene Element, kein document, kein eigener Pause-Merker.

import { setField } from './dom';

export const PAUSE_LABEL = 'Pause';
export const PAUSE_HINT = 'P oder 1× setzt fort';

/** Sichtbar nur bei Tempo 0 und ohne offenes Modal. */
export function pauseOverlayView(speed: 0 | 1 | 2 | 4, modalOpen: boolean): { visible: boolean } {
  return { visible: speed === 0 && !modalOpen };
}

/** Schreibt Sichtbarkeit und Text nur bei Änderung; `modalOpen` kommt vom Aufrufer. */
export function applyPauseOverlay(el: HTMLElement, speed: 0 | 1 | 2 | 4, modalOpen: boolean): void {
  const { visible } = pauseOverlayView(speed, modalOpen);
  if (el.hidden !== !visible) el.hidden = !visible;
  setField(el, 'pause-label', PAUSE_LABEL);
  setField(el, 'pause-hint', PAUSE_HINT);
}
