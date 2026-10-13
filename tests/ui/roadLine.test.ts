import { describe, expect, it } from 'vitest';
import { buildLine, linePath, linePlan, lineHintText } from '../../src/ui/roadLine';
import { ROAD_COST } from '../../src/sim/defs/buildings';
import { placeRoad } from '../../src/sim/build';
import { canPlaceRoad } from '../../src/sim/placement';
import { HOME, tileAt } from '../../src/sim/world';
import { uxWorld } from './worlds';
import type { World } from '../../src/sim/types';

/** Erster Block aus Kacheln, auf denen ein Weg baubar ist: `n` + 1 breit, 3 hoch. */
function freeRun(w: World, n: number): { x: number; y: number } {
  const isl = w.islands[HOME]!;
  for (let y = 0; y + 2 < isl.height; y++)
    for (let x = 0; x + n < isl.width; x++) {
      let okRun = true;
      for (let dy = 0; dy < 3 && okRun; dy++)
        for (let dx = 0; dx <= n && okRun; dx++)
          if (!canPlaceRoad(w, x + dx, y + dy, HOME).ok) okRun = false;
      if (okRun) return { x, y };
    }
  throw new Error('kein freier Block');
}

describe('linePath (AK-10)', () => {
  it('gleiche Kachel: genau eine', () => {
    expect(linePath({ x: 3, y: 4 }, { x: 3, y: 4 })).toEqual([{ x: 3, y: 4 }]);
  });
  it('gleiche Achse: gerade, beide Enden, auch rückwärts', () => {
    expect(linePath({ x: 1, y: 2 }, { x: 4, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
    expect(linePath({ x: 2, y: 5 }, { x: 2, y: 3 })).toEqual([
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
    ]);
  });
  it('L: längerer Schenkel zuerst', () => {
    expect(linePath({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
    ]);
    expect(linePath({ x: 0, y: 0 }, { x: 1, y: 3 })).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
    ]);
  });
  it('L bei Gleichstand: x zuerst, Knick-Kachel nicht doppelt', () => {
    const p = linePath({ x: 5, y: 5 }, { x: 3, y: 3 });
    expect(p).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 3, y: 3 },
    ]);
  });
});

describe('linePlan (AK-11)', () => {
  it('zählt neue Kacheln und Kosten, vorhandene Wege kosten nichts', () => {
    const { w } = uxWorld();
    w.money = 10_000;
    const s = freeRun(w, 4);
    placeRoad(w, s.x + 1, s.y, HOME);
    const path = linePath(s, { x: s.x + 3, y: s.y });
    const plan = linePlan(w, HOME, path);
    expect(plan.tiles.map((t) => t.state)).toEqual(['new', 'exists', 'new', 'new']);
    expect(plan.newCount).toBe(3);
    expect(plan.cost).toBe(3 * ROAD_COST);
    expect(plan.affordable).toBe(true);
    expect(plan.stopReason).toBeNull();
  });
  it('Wasser und Ausserhalb sind blockiert, Grund der Sim, nicht gezählt', () => {
    const { w } = uxWorld();
    w.money = 10_000;
    const isl = w.islands[HOME]!;
    const plan = linePlan(w, HOME, [
      { x: -1, y: 0 },
      { x: isl.width, y: 0 },
    ]);
    expect(plan.tiles.map((t) => t.state)).toEqual(['blocked', 'blocked']);
    expect(plan.newCount).toBe(0);
    expect(plan.cost).toBe(0);
    expect(plan.stopReason).toBe('Ausserhalb der Karte');
    let water: { x: number; y: number } | null = null;
    for (let y = 0; y < isl.height && !water; y++)
      for (let x = 0; x < isl.width; x++)
        if (tileAt(isl, x, y)!.terrain === 'water') {
          water = { x, y };
          break;
        }
    const p2 = linePlan(w, HOME, [water!]);
    expect(p2.tiles[0]!.state).toBe('blocked');
    expect(p2.stopReason).toBe('Kein Bauland');
  });
  it('Start = Ende: eine Kachel', () => {
    const { w } = uxWorld();
    w.money = 100;
    const s = freeRun(w, 1);
    const plan = linePlan(w, HOME, linePath(s, s));
    expect(plan.tiles).toHaveLength(1);
    expect(plan.newCount).toBe(1);
  });
  it('AK-13 zu wenig Geld: affordable false, Grund aus der Sim', () => {
    const { w } = uxWorld();
    w.money = 2 * ROAD_COST;
    const s = freeRun(w, 4);
    const plan = linePlan(w, HOME, linePath(s, { x: s.x + 3, y: s.y }));
    expect(plan.affordable).toBe(false);
    expect(plan.stopReason).not.toBeNull();
  });
});

describe('buildLine (AK-13, AK-19)', () => {
  it('AK-19 Linienbau = gleiche Einzelaufrufe von placeRoad (Welten identisch)', () => {
    const a = uxWorld().w;
    const b = uxWorld().w;
    a.money = b.money = 10_000;
    const s = freeRun(a, 4);
    const path = linePath(s, { x: s.x + 3, y: s.y + 2 });
    for (const t of path) placeRoad(a, t.x, t.y, HOME);
    const r = buildLine(b, HOME, path);
    expect(r.built).toBe(path.length);
    expect(r.stopReason).toBeNull();
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
  it('vorhandene Wege und blockierte Kacheln werden übersprungen, Rest gebaut', () => {
    const w = uxWorld().w;
    w.money = 10_000;
    const s = freeRun(w, 4);
    placeRoad(w, s.x + 1, s.y, HOME);
    const m = w.money;
    const r = buildLine(w, HOME, [{ x: -1, y: 0 }, ...linePath(s, { x: s.x + 2, y: s.y })]);
    expect(r.built).toBe(2);
    expect(w.money).toBe(m - 2 * ROAD_COST);
  });
  it('AK-13 zu wenig Geld: baut bis zur letzten bezahlbaren Kachel, nennt den Grund', () => {
    const w = uxWorld().w;
    const s = freeRun(w, 5);
    w.money = 2 * ROAD_COST;
    const path = linePath(s, { x: s.x + 4, y: s.y });
    const r = buildLine(w, HOME, path);
    expect(r.built).toBe(2);
    expect(r.stopReason).not.toBeNull();
    expect(tileAt(w.islands[HOME]!, s.x + 1, s.y)!.road).toBe(true);
    expect(tileAt(w.islands[HOME]!, s.x + 2, s.y)!.road).toBe(false);
  });
});

describe('lineHintText', () => {
  it('nennt Anzahl, Kosten und ersten Grund', () => {
    const w = uxWorld().w;
    w.money = 10_000;
    const s = freeRun(w, 3);
    const ok = linePlan(w, HOME, linePath(s, { x: s.x + 2, y: s.y }));
    expect(lineHintText(ok)).toEqual({
      tone: 'ok',
      text: `Weg-Linie · 3 neue Wege · ${3 * ROAD_COST} Geld`,
    });
    const bad = linePlan(w, HOME, [{ x: -1, y: 0 }, s]);
    const h = lineHintText(bad, (r) => `[${r}]`);
    expect(h.tone).toBe('bad');
    expect(h.text).toContain('1 blockiert');
    expect(h.text).toContain('[Ausserhalb der Karte]');
  });
});
