import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { activeIsland, islandRects, type IslandRect } from '../../src/ui/activeIsland';

describe('M12 E2 UI Inseln: aktive Insel (AK-E2-10)', () => {
  const rects: IslandRect[] = [
    { x0: 0, y0: 0, x1: 10, y1: 10 },
    { x0: 30, y0: 0, x1: 40, y1: 10 },
    { x0: 0, y0: 40, x1: 10, y1: 50 },
  ];
  it('Mitte im Rechteck → diese Insel', () => {
    expect(activeIsland(rects, { x: 5, y: 45 }, true)).toBe(2);
    expect(activeIsland(rects, { x: 35, y: 5 }, true)).toBe(1);
  });
  it('x1/y1 sind exklusiv', () => {
    expect(activeIsland(rects, { x: 10, y: 5 }, true)).toBe(0); // Meer, 0 ist am nächsten (Mitte 5/5)
    expect(activeIsland(rects, { x: 30, y: 5 }, true)).toBe(1);
  });
  it('auf dem Meer die Insel mit der nächsten Mitte', () => {
    expect(activeIsland(rects, { x: 22, y: 5 }, true)).toBe(1);
    expect(activeIsland(rects, { x: 5, y: 30 }, true)).toBe(2);
  });
  it('gleich weit von 0 und 1 → 0 (kleinerer Index)', () => {
    expect(activeIsland(rects, { x: 20, y: 5 }, true)).toBe(0);
  });
  it('D-143: vor seafaring immer die Heimat, in jedem Fall', () => {
    for (const c of [
      { x: 5, y: 45 },
      { x: 35, y: 5 },
      { x: 22, y: 5 },
      { x: 20, y: 5 },
    ])
      expect(activeIsland(rects, c, false)).toBe(0);
  });
  it('ohne Rechtecke 0', () => {
    expect(activeIsland([], { x: 1, y: 1 }, true)).toBe(0);
  });
  it('islandRects(createWorld(3)): Heimat bei 0/0, Rechteck je Insel, Mitte der Insel 2 → 2', () => {
    const w = createWorld(3);
    const r = islandRects(w);
    expect(r).toHaveLength(w.islands.length);
    expect(r[0]).toEqual({ x0: 0, y0: 0, x1: w.islands[0]!.width, y1: w.islands[0]!.height });
    const i2 = w.islands[2]!;
    expect(r[2]).toEqual({ x0: i2.ox, y0: i2.oy, x1: i2.ox + i2.width, y1: i2.oy + i2.height });
    const mid = { x: i2.ox + i2.width / 2, y: i2.oy + i2.height / 2 };
    expect(activeIsland(r, mid, true)).toBe(2);
    expect(activeIsland(r, mid, false)).toBe(0);
  });
});
