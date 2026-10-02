import { describe, expect, it } from 'vitest';
import { TICK_MS } from '../../src/sim/defs/timing';
import {
  STORAGE_NOTES,
  startChoices,
  startDismissAction,
  startGoal,
  startSteps,
} from '../../src/ui/startCard';

const t = (s: number): number => (s * 1000) / TICK_MS;

describe('Startkarte (AK-UX-01)', () => {
  it('AK-UX-01 ohne Spielstand nur „Los geht\'s"', () => {
    expect(startChoices([], 'none')).toEqual({
      choices: [{ kind: 'new', label: "Los geht's", primary: true }],
      note: null,
    });
  });
  it('AK-UX-01 Reihenfolge auto, manual, neu; Autosave ist primär', () => {
    const r = startChoices(
      [
        { slot: 'manual', tick: t(270) },
        { slot: 'auto', tick: t(300) },
      ],
      'none',
    );
    expect(r.choices.map((c) => c.label)).toEqual([
      'Fortsetzen — Autosave (Spielzeit 5:00)',
      'Gespeichertes Spiel laden (Spielzeit 4:30)',
      'Neue Insel',
    ]);
    expect(r.choices.map((c) => c.primary)).toEqual([true, false, false]);
  });
  it('AK-UX-01 nur manual → manual primär', () => {
    const r = startChoices([{ slot: 'manual', tick: t(10) }], 'none');
    expect(r.choices[0]).toMatchObject({ kind: 'load', slot: 'manual', primary: true });
  });
  it('AK-UX-01 Hinweise „beschädigt" und „nicht verfügbar" sind verschieden', () => {
    expect(startChoices([], 'damaged').note).toBe(STORAGE_NOTES.damaged);
    expect(startChoices([], 'unavailable').note).toBe(STORAGE_NOTES.unavailable);
    expect(STORAGE_NOTES.damaged).not.toBe(STORAGE_NOTES.unavailable);
  });
  it('Ziel und drei Schritte aus defs und Hotkeys (Spec L1)', () => {
    expect(startGoal()).toBe('Ziel: 50 Bürger auf deiner Insel');
    expect(startSteps()).toEqual([
      '1 Wohnhaus (H) nahe dem Kontor bauen — dort ziehen Pioniere ein',
      '2 Fischerhütte (F) am Wasser und Holzfäller (L) am Wald bauen',
      '3 Betriebe mit einem Weg (R) zum Kontor verbinden — Wohnhäuser brauchen keinen Weg',
    ]);
  });
});

describe('Startkarte Esc (Spec L1)', () => {
  it('L1 Esc bei offener Bestätigung bricht ab, sonst primärer Knopf', () => {
    expect(startDismissAction(true)).toBe('cancel');
    expect(startDismissAction(false)).toBe('primary');
  });
});
