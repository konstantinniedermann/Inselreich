import { describe, expect, it } from 'vitest';
import { pickOpener, shouldCloseOnClick } from '../../src/ui/settingsPanel';

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
  it('schliesst nur bei Druck und Loslassen auf dem Hintergrund', () => {
    expect(shouldCloseOnClick(true, true)).toBe(true);
    expect(shouldCloseOnClick(false, true)).toBe(false); // im Dialog gedrückt, draussen losgelassen
    expect(shouldCloseOnClick(true, false)).toBe(false);
    expect(shouldCloseOnClick(false, false)).toBe(false);
  });
});
