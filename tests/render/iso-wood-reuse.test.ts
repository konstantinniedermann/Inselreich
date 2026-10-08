import { describe, expect, it } from 'vitest';
import { sortedObjects, woodPending, type SortedItem } from '../../src/render/iso';
import { placeBuilding } from '../../src/sim/build';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';

// iso-wood-reuse.test.ts — PERF-L57 W4: unveränderte Wald-Zellen behalten ihr Objekt beim Neuaufbau.

const trees = (l: readonly SortedItem[]) => l.filter((i) => i.kind === 'tree');

/** Haus auf eine freie Wiesenkachel am Waldrand setzen; null, wenn keine gefunden. */
function buildNearForest(w: World): boolean {
  const isl = home(w);
  const forests = new Set(
    trees(sortedObjects(w))
      .filter((t) => !t.own)
      .map((t) => t.fp.y * isl.width + t.fp.x),
  );
  w.money = 100000;
  for (const k of forests) {
    const x = (k % isl.width) + 2,
      y = Math.floor(k / isl.width);
    if (placeBuilding(w, 'house', x, y).ok) return true;
  }
  return false;
}

describe('PERF-L57 W4 Wald-Objekte wiederverwenden', () => {
  it('RF-PERF-W4-1 nach einem Bau: Ergebnis gleich Vollaufbau, ≥ 90 % der Baum-Items identisch', () => {
    const a = createWorld(7, { unlockAll: true });
    const before = trees(sortedObjects(a));
    expect(before.length).toBeGreaterThan(100);
    expect(buildNearForest(a)).toBe(true);
    sortedObjects(a, [], 2);
    let guard = 0;
    while (woodPending(a) && guard++ < 100000) sortedObjects(a, [], 2);
    expect(woodPending(a)).toBe(false);
    const list = sortedObjects(a);
    // Vollaufbau derselben Welt, ohne Vorgänger
    const b = createWorld(7, { unlockAll: true });
    buildNearForest(b);
    const full = sortedObjects(b);
    expect(list).toEqual(full);
    const after = trees(list);
    const was = new Set<SortedItem>(before);
    const same = after.filter((t) => was.has(t)).length;
    expect(same / after.length).toBeGreaterThanOrEqual(0.9);
  }, 60000);

  it('RF-PERF-W4-2 geänderte Zelle bekommt ein neues Objekt', () => {
    const a = createWorld(7, { unlockAll: true });
    const before = trees(sortedObjects(a));
    expect(buildNearForest(a)).toBe(true);
    const after = trees(sortedObjects(a));
    const was = new Set<SortedItem>(before);
    expect(after.some((t) => !was.has(t))).toBe(true);
  }, 60000);
});
