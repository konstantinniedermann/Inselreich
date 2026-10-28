import { describe, expect, it } from 'vitest';
import { laneTicks, seaLanes, type Lane } from '../../src/sim/islands';
import { createWorld } from '../../src/sim/world';
import { createLaneCache, homeTravelTicks } from '../../src/ui/homeTravel';

describe('I-136 homeTravelTicks (AK-F1)', () => {
  it('entspricht laneTicks Heimat-Insel für jede Fremdinsel', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(w.islands.length).toBeGreaterThan(2);
    for (let i = 1; i < w.islands.length; i++) {
      const t = homeTravelTicks(w, i);
      expect(t).toBe(laneTicks(w.islands, 0, i));
      expect(t).toBeGreaterThan(0);
    }
  });

  it('Golden: Lane mit d = 25 ergibt 250 Ticks', () => {
    const w = createWorld(3);
    const lanes = (): Lane[] => [{ a: 0, b: 1, points: [], d: 25 }];
    expect(homeTravelTicks(w, 1, lanes)).toBe(250);
  });

  it('null für Heimat, fehlende Insel und fehlende Lane', () => {
    const w = createWorld(3);
    expect(homeTravelTicks(w, 0)).toBeNull();
    expect(homeTravelTicks(w, 99)).toBeNull();
    expect(homeTravelTicks(w, 1, () => [])).toBeNull();
  });
});

describe('I-136 Lane-Cache (AK-F2)', () => {
  it('rechnet seaLanes je Welt genau einmal', () => {
    let n = 0;
    const lanes = createLaneCache((w) => {
      n++;
      return seaLanes(w.islands);
    });
    const w = createWorld(3);
    homeTravelTicks(w, 1, lanes);
    homeTravelTicks(w, 1, lanes);
    expect(n).toBe(1);
    homeTravelTicks(createWorld(4), 1, lanes);
    expect(n).toBe(2);
  });
  it('rechnet neu, sobald die Welt eine neue Inselliste bekommt (Kontor II verschiebt den Anker)', () => {
    let n = 0;
    const lanes = createLaneCache((w) => {
      n++;
      return seaLanes(w.islands);
    });
    const w = createWorld(3);
    homeTravelTicks(w, 1, lanes);
    w.islands = w.islands.slice();
    homeTravelTicks(w, 1, lanes);
    homeTravelTicks(w, 1, lanes);
    expect(n).toBe(2);
  });
});

describe('AK-SR-17 Heimfahrt mit Seerecht', () => {
  it('d 30: 300 Ticks, mit Seerecht 240', () => {
    const w = createWorld(3);
    const lanes = (): Lane[] => [{ a: 0, b: 1, d: 30, points: [] }];
    expect(homeTravelTicks(w, 1, lanes)).toBe(300);
    w.council[4] = 'C';
    expect(homeTravelTicks(w, 1, lanes)).toBe(240);
  });
});
