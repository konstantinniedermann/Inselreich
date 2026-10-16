import { describe, expect, it } from 'vitest';
import {
  RISE_MS,
  advanceRiseClock,
  detectRises,
  pickRises,
  type Rise,
} from '../../src/render/aufstieg';
import { cap } from '../../src/render/limits';
import type { Building, Tier } from '../../src/sim/types';

const house = (id: number, tier: Tier): Building =>
  ({
    id,
    defId: 'house',
    x: id,
    y: 0,
    island: 0,
    house: { tier, inhabitants: 1 },
  }) as unknown as Building;

describe('aufstieg', () => {
  it('B1 Aufstieg 1 -> 2 liefert genau einen Eintrag', () => {
    const r = detectRises(new Map([[1, 1]]), [house(1, 2)], 100);
    expect(r.started).toEqual([{ id: 1, startMs: 100, tier: 2 }]);
    expect(r.next.get(1)).toBe(2);
  });

  it('B1 gleiche Stufe, Abstieg und neue Id liefern nichts; Abgerissene fehlen in next', () => {
    const prev = new Map([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
    const r = detectRises(prev, [house(1, 2), house(2, 2), house(9, 4)], 0);
    expect(r.started).toEqual([]);
    expect([...r.next.keys()].sort()).toEqual([1, 2, 9]);
  });

  it('B1 leere Map liefert nichts', () => {
    const r = detectRises(new Map(), [house(1, 1), house(2, 3)], 0);
    expect(r.started).toEqual([]);
    expect(r.next.size).toBe(2);
  });

  it('B7 leere Map mit Welt höherer Stufen: keine Effekte', () => {
    const hs = [2, 3, 4].map((t, i) => house(i + 1, t as Tier));
    expect(detectRises(new Map(), hs, 5).started).toHaveLength(0);
  });

  it('B8 tief eingefrorene Gebäudeliste wirft nicht', () => {
    const hs = [house(1, 2)];
    for (const b of hs) {
      Object.freeze(b.house);
      Object.freeze(b);
    }
    Object.freeze(hs);
    expect(() => detectRises(new Map([[1, 1]]), hs, 0)).not.toThrow();
  });

  it('B4 neun gleichzeitige: die sechs jüngsten bleiben, die drei ältesten fehlen', () => {
    const act: Rise[] = Array.from({ length: 9 }, (_, i) => ({ id: i, startMs: 100 + i, tier: 2 }));
    const out = pickRises(act, 200, cap('riseGlow'));
    expect(out.map((r) => r.id).sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('B4 Abgelaufene rücken nicht nach, Verworfene kehren nicht zurück', () => {
    const act: Rise[] = Array.from({ length: 9 }, (_, i) => ({ id: i, startMs: 100 + i, tier: 2 }));
    const first = pickRises(act, 200, 6);
    // Eintrag 8 läuft ab: die Menge schrumpft, die verworfenen 0..2 kommen nicht zurück
    const later = pickRises(first, 100 + 8 + RISE_MS, 6);
    expect(later.map((r) => r.id)).not.toContain(8);
    expect(later.some((r) => r.id < 3)).toBe(false);
    expect(pickRises(first, 100 + 3 + RISE_MS - 1, 6).length).toBeGreaterThan(0);
    expect(pickRises(first, 1e9, 6)).toEqual([]);
    expect(pickRises([{ id: 1, startMs: 50, tier: 2 }], 10, 6)).toEqual([]);
  });

  it('B6 Uhr: speed 0 ändert nichts, dt wird geklemmt', () => {
    expect(advanceRiseClock(1000, 16, 0)).toBe(1000);
    expect(advanceRiseClock(1000, 16, 1)).toBe(1016);
    expect(advanceRiseClock(1000, 5000, 2)).toBe(1100);
    expect(advanceRiseClock(1000, -5, 1)).toBe(1000);
  });
});
