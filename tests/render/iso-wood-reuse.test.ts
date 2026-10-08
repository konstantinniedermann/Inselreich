import { describe, expect, it } from 'vitest';
import { sortedObjects, woodPending, type SortedItem } from '../../src/render/iso';
import { placeBuilding } from '../../src/sim/build';
import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';

// iso-wood-reuse.test.ts — PERF-L57 W4: unveränderte Wald-Zellen behalten ihr Objekt beim Neuaufbau.

const trees = (l: readonly SortedItem[]) => l.filter((i) => i.kind === 'tree');

/** Freie Wiesenkachel am Waldrand für ein Haus (aus dem bereits gebauten Wald von `w`); null, wenn keine passt. */
function buildNearForest(w: World): { x: number; y: number } | null {
  w.money = 100000;
  for (const t of trees(sortedObjects(w))) {
    if (t.own) continue;
    const x = t.fp.x + 2,
      y = t.fp.y;
    if (placeBuilding(w, 'house', x, y).ok) return { x, y };
  }
  return null;
}

describe('PERF-L57 W4 Wald-Objekte wiederverwenden', () => {
  it('RF-PERF-W4-1 nach einem Bau: Ergebnis gleich Vollaufbau, ≥ 90 % der Baum-Items identisch, geänderte Zellen neu', () => {
    const a = createWorld(7, { unlockAll: true });
    const before = trees(sortedObjects(a));
    expect(before.length).toBeGreaterThan(100);
    const at = buildNearForest(a);
    expect(at).not.toBeNull();
    // ein Scheibenaufruf mit Budget (Auftrag läuft), dann fertig
    sortedObjects(a, [], 1);
    const list = sortedObjects(a);
    expect(woodPending(a)).toBe(false);
    // Vollaufbau derselben Welt ohne Vorgänger (ein einziger Aufbau, Haus am selben Ort)
    const b = createWorld(7, { unlockAll: true });
    b.money = 100000;
    expect(placeBuilding(b, 'house', at!.x, at!.y).ok).toBe(true);
    // toEqual über ~100k Objekte braucht 13 s; die Serialisierung vergleicht dasselbe (nur Zahlen, Strings, Listen) in Millisekunden
    const full = sortedObjects(b);
    expect(list.length).toBe(full.length);
    expect(JSON.stringify(list) === JSON.stringify(full)).toBe(true);
    const after = trees(list);
    const was = new Set<SortedItem>(before);
    const same = after.filter((t) => was.has(t)).length;
    expect(same / after.length).toBeGreaterThanOrEqual(0.9);
    expect(same).toBeLessThan(after.length); // mindestens eine Zelle wurde neu erzeugt
  }, 120000);
});
