import { describe, expect, it } from 'vitest';
import {
  closeAllModals,
  isModalOpen,
  modalStackAfterEscape,
  nextFocusIndex,
  pickOpener,
  shouldCloseOnClick,
} from '../../src/ui/modal';

describe('pickOpener (QA-U1: Fokus zurück zum Einstellungen-Knopf)', () => {
  it('bevorzugt den ausdrücklich übergebenen Knopf, auch wenn der body aktiv ist', () => {
    expect(pickOpener('knopf', 'body')).toBe('knopf');
  });
  it('fällt ohne Knopf auf das aktive Element zurück', () => {
    expect(pickOpener(undefined, 'aktiv')).toBe('aktiv');
    expect(pickOpener(null, 'aktiv')).toBe('aktiv');
  });
  it('liefert null, wenn beides fehlt', () => {
    expect(pickOpener(undefined, null)).toBeNull();
  });
});

describe('shouldCloseOnClick', () => {
  it('schliesst nur bei Druck, Loslassen und Klick auf dem Hintergrund', () => {
    expect(shouldCloseOnClick(true, true, true)).toBe(true);
    expect(shouldCloseOnClick(false, true, true)).toBe(false); // im Dialog gedrückt, draussen losgelassen
    expect(shouldCloseOnClick(true, true, false)).toBe(false);
    expect(shouldCloseOnClick(false, false, false)).toBe(false);
  });
  it('QA-UI-2: Druck auf dem Hintergrund, Loslassen im Dialog schliesst nicht', () => {
    // click geht dann an den gemeinsamen Vorfahren (den Hintergrund)
    expect(shouldCloseOnClick(true, false, true)).toBe(false);
  });
});

describe('Modal-Stapel (Spec L2)', () => {
  it('Fokusfalle: Tab und Shift+Tab laufen zyklisch (Spec L2)', () => {
    expect(nextFocusIndex(3, 2, false)).toBe(0);
    expect(nextFocusIndex(3, 0, true)).toBe(2);
    expect(nextFocusIndex(3, -1, false)).toBe(0);
    expect(nextFocusIndex(3, -1, true)).toBe(2);
    expect(nextFocusIndex(0, -1, false)).toBe(-1);
  });
  it('RF-1 Esc schliesst nur die oberste Karte', () => {
    expect(modalStackAfterEscape(['menu', 'help'])).toEqual(['menu']);
    expect(modalStackAfterEscape([])).toEqual([]);
  });
  it('RF-2 closeAllModals ohne offene Karte ist folgenlos, danach ist keine Karte offen', () => {
    closeAllModals();
    expect(isModalOpen()).toBe(false);
  });
});
