import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { placeBuilding, placeRoad, demolish } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { clearForest, plantForest, canClearForest, canPlantForest } from '../../src/sim/forest';
import type { World } from '../../src/sim/types';
import { WOOD_REACH, sortedObjects, woodPending, type SortedItem } from '../../src/render/iso';

// bauRuckeln.test.ts — FIX-REL07 (a): ein Bau darf den Waldaufbau von `sortedObjects` nicht in einen Frame legen.
// Hier: (1) das Ergebnis nach Bau/Rodung ist elementweise das des Vollaufbaus einer frischen Welt,
// (2) ein Bau fernab des Waldes startet keinen Waldaufbau, (3) ein Bau nahe Wald verteilt ihn auf mehrere Schritte.

const SEEDS = [14, 7, 3, 21];
const fresh = (w: World): World => JSON.parse(JSON.stringify(w)) as World;
/** Arbeitet den Waldaufbau mit kleinem Budget ab; liefert die Zahl der Aufrufe. */
function settle(w: World): number {
  let n = 0;
  while (woodPending(w)) {
    sortedObjects(w, [], 0);
    if (++n > 5000) throw new Error('Waldaufbau endet nicht');
  }
  return n;
}
/** Elementweise gleich dem Vollaufbau einer frischen Welt (Zeichenketten statt `toEqual`: schnell, auch bei Abweichung). */
function same(w: World): void {
  // Massiv-Teilstücke tragen grosse Raster: dort Kennung und Kacheln statt der ganzen Struktur
  const sig = (i: SortedItem): string =>
    JSON.stringify(
      i.kind === 'massif' ? { id: i.id, fp: i.fp, key: i.key, tiles: i.piece.tiles } : i,
    );
  const a = sortedObjects(w).map(sig);
  const b = sortedObjects(fresh(w)).map(sig);
  expect(a.length).toBe(b.length);
  const k = a.findIndex((v, i) => v !== b[i]);
  expect(k < 0 ? null : [k, a[k], b[k]]).toBeNull();
}
function forestDist(w: World): (x: number, y: number) => number {
  const isl = home(w);
  const f: number[] = [];
  isl.tiles.forEach((t, i) => t.terrain === 'forest' && f.push(i));
  return (x, y) => {
    let d = Infinity;
    for (const i of f)
      d = Math.min(
        d,
        Math.max(Math.abs((i % isl.width) - x), Math.abs(Math.floor(i / isl.width) - y)),
      );
    return d;
  };
}
/** Bauplätze (Haus) um das Kontor, mit Abstand zum Wald. */
function spots(w: World): { x: number; y: number; d: number }[] {
  const k = w.buildings[1]!;
  const dist = forestDist(w);
  const out: { x: number; y: number; d: number }[] = [];
  for (let dy = -14; dy <= 14; dy++)
    for (let dx = -14; dx <= 14; dx++) {
      const x = k.x + dx,
        y = k.y + dy;
      if (canPlace(w, 'house', x, y).ok) out.push({ x, y, d: dist(x, y) });
    }
  return out;
}

describe('FIX-REL07 a: Bau und Waldaufbau', () => {
  for (const seed of SEEDS)
    it(`RF-bau-1: Seed ${seed}: nach Bauten, Rodung und Aufforstung gleich dem Vollaufbau`, () => {
      const w = createWorld(seed, { unlockAll: true });
      w.money = 1e6;
      sortedObjects(w); // Erstaufbau, voll
      const sp = spots(w);
      const near = sp.filter((s) => s.d <= WOOD_REACH).slice(0, 40);
      const far = sp.filter((s) => s.d > WOOD_REACH).slice(0, 40);
      const picks = [
        near[0],
        far[0],
        near[near.length >> 1],
        near[near.length - 1],
        far[far.length - 1],
      ];
      const isl = home(w);
      for (const p of picks) {
        if (!p || !canPlace(w, 'house', p.x, p.y).ok) continue;
        placeBuilding(w, 'house', p.x, p.y);
        sortedObjects(w, [], 0);
        settle(w);
        same(w);
      }
      // Weg, Abriss
      const k = w.buildings[1]!;
      for (let i = 1; i < 8; i++) placeRoad(w, k.x - i, k.y);
      sortedObjects(w, [], 0);
      settle(w);
      same(w);
      const ids = Object.keys(w.buildings)
        .map(Number)
        .filter((id) => id !== 1);
      if (ids.length) demolish(w, ids[0]!);
      sortedObjects(w, [], 0);
      settle(w);
      same(w);
      // Roden und Aufforsten
      let cut = 0;
      for (let y = 0; y < isl.height && cut < 6; y++)
        for (let x = 0; x < isl.width && cut < 6; x++)
          if (canClearForest(w, x, y).ok && clearForest(w, x, y).ok) cut++;
      sortedObjects(w, [], 0);
      settle(w);
      same(w);
      let pl = 0;
      for (let y = 0; y < isl.height && pl < 4; y++)
        for (let x = 0; x < isl.width && pl < 4; x++)
          if (canPlantForest(w, x, y).ok && plantForest(w, x, y).ok) pl++;
      sortedObjects(w, [], 0);
      settle(w);
      same(w);
    }, 60_000); // Timeout: lokal ≤ 8 s (Vollaufbau je Vergleich ~0,05 s), Reserve für CI, R270/R318

  it('RF-bau-2: ein Bau fernab des Waldes startet keinen Waldaufbau und behält die Waldobjekte', () => {
    let tested = 0;
    for (const seed of SEEDS) {
      const w = createWorld(seed, { unlockAll: true });
      w.money = 1e6;
      const before = sortedObjects(w).filter((i) => i.kind === 'tree');
      const far = spots(w).find((s) => s.d > WOOD_REACH);
      if (!far) continue; // manche Karten sind bis ans Kontor bewaldet (Seed 14)
      tested++;
      placeBuilding(w, 'house', far!.x, far!.y);
      const after = sortedObjects(w, [], 0);
      expect(woodPending(w)).toBe(false);
      const trees = after.filter((i) => i.kind === 'tree');
      expect(trees.length).toBe(before.length);
      expect(trees.every((t, i) => t === before[i])).toBe(true);
      expect(
        after.some((i) => i.kind === 'building' && i.fp.x === far!.x && i.fp.y === far!.y),
      ).toBe(true);
    }
    expect(tested).toBeGreaterThanOrEqual(1);
  });

  it('RF-bau-3: ein Bau nahe Wald verteilt den Aufbau auf viele Aufrufe, das Haus steht sofort', () => {
    const w = createWorld(14, { unlockAll: true });
    w.money = 1e6;
    sortedObjects(w);
    const near = spots(w).find((s) => s.d <= 3);
    expect(near).toBeDefined();
    placeBuilding(w, 'house', near!.x, near!.y);
    const first = sortedObjects(w, [], 0);
    expect(
      first.some((i) => i.kind === 'building' && i.fp.x === near!.x && i.fp.y === near!.y),
    ).toBe(true);
    expect(woodPending(w)).toBe(true);
    expect(settle(w)).toBeGreaterThanOrEqual(8);
  });

  it('RF-bau-4: ohne Budget rechnet sortedObjects sofort fertig (Picking, Tests)', () => {
    const w = createWorld(14, { unlockAll: true });
    w.money = 1e6;
    sortedObjects(w);
    const near = spots(w).find((s) => s.d <= 3)!;
    placeBuilding(w, 'house', near.x, near.y);
    sortedObjects(w, [], 0);
    expect(woodPending(w)).toBe(true);
    sortedObjects(w);
    expect(woodPending(w)).toBe(false);
  });

  it('RF-bau-5: kein Schritt des Waldaufbaus braucht einen ganzen Frame', () => {
    const w = createWorld(7, { unlockAll: true });
    w.money = 1e6;
    sortedObjects(w);
    const near = spots(w).find((s) => s.d <= 3)!;
    placeBuilding(w, 'house', near.x, near.y);
    let worst = 0;
    while (woodPending(w)) {
      const t = performance.now();
      sortedObjects(w, [], 0);
      worst = Math.max(worst, performance.now() - t);
    }
    // Vollaufbau ~20 ms; ein Schritt deutlich darunter (Reserve für Aufwärmen und Fertigstellung)
    expect(worst).toBeLessThan(16);
  });
});
