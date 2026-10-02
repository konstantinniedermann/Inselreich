import { describe, expect, it } from 'vitest';
import { newIslandPrompt, slotLabel } from '../../src/ui/menu';
import { TICK_MS } from '../../src/sim/defs/timing';

describe('Menü-Texte (Spec L2, P-3)', () => {
  it('slotLabel: Spielzeit als Uhr', () => {
    expect(slotLabel({ slot: 'auto', tick: (300 * 1000) / TICK_MS })).toBe(
      'Autosave — Spielzeit 5:00',
    );
    expect(slotLabel({ slot: 'manual', tick: (30 * 1000) / TICK_MS })).toBe(
      'Gespeichert — Spielzeit 0:30',
    );
  });
  it('newIslandPrompt: mit Autosave der L1-Text, ohne Autosave der Hinweis auf die laufende Insel', () => {
    expect(newIslandPrompt(true)).toBe(
      'Neue Insel beginnen? Der bisherige Autosave wird beim nächsten Speichern ersetzt.',
    );
    expect(newIslandPrompt(false)).toBe(
      'Neue Insel beginnen? Die laufende Insel ist nicht gespeichert und geht verloren.',
    );
  });
});
