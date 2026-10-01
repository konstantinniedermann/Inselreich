import { describe, expect, it } from 'vitest';
import { refundText, restView } from '../../src/ui/inspect';
import { SCENARIOS } from '../sim/scenarios';

describe('refundText (AK-U1b-02)', () => {
  it('nennt den tatsächlichen Betrag und den Verfall bei vollem Lager', () => {
    const text = refundText(
      { money: 10, wood: 5, tools: 0, stone: 0 },
      { money: 10, wood: 1, tools: 0, stone: 0 },
    );
    expect(text).toContain('Holz 1');
    expect(text).toContain('4 verfallen – Lager voll');
  });

  it('zeigt ohne Verfall nur die Beträge', () => {
    const c = { money: 10, wood: 5, tools: 0, stone: 0 };
    const text = refundText(c, c);
    expect(text).toBe('Geld 10 · Holz 5');
    expect(text).not.toContain('verfallen');
  });

  it('benennt mehrere Güter mit Verfall einzeln', () => {
    const text = refundText(
      { money: 5, wood: 4, tools: 2, stone: 0 },
      { money: 5, wood: 0, tools: 1, stone: 0 },
    );
    expect(text).toBe(
      'Geld 5 · Holz 0 (4 verfallen – Lager voll) · Werkzeug 1 (1 verfallen – Lager voll)',
    );
  });
});

describe('restView (AK-U2-03)', () => {
  it('Tagesphase und Einwohnerzahl', () => {
    const w = SCENARIOS.galerie!();
    w.tick = 3000;
    const sum = Object.values(w.buildings).reduce((n, b) => n + (b.house?.inhabitants ?? 0), 0);
    expect(restView(w)).toEqual({ phase: 'night', label: 'Nacht', symbol: '☾', inhabitants: sum });
  });
  it('alle vier Phasen', () => {
    const w = SCENARIOS.galerie!();
    const at = (t: number) => {
      w.tick = t;
      return restView(w).label;
    };
    expect([at(0), at(2400), at(3000), at(4700)]).toEqual(['Tag', 'Abend', 'Nacht', 'Morgen']);
  });
});
