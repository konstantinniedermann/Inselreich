import { beforeEach, describe, expect, it } from 'vitest';
import {
  coveredBuildingIds,
  createCoverageCache,
  outlineSegments,
  overlayPlan,
  symbolFor,
  SYMBOL_MIN_ZOOM,
} from '../../src/render/overlays';
import { placeRoad } from '../../src/sim/build';
import { coverageMask, layoutKey } from '../../src/sim/queries';
import { isProtected } from '../../src/sim/crises';
import { createWorld, idx } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[w.kontorId]!;
});

describe('overlays', () => {
  it('AK-A3-05 Cache rechnet nur bei geänderter Anordnung oder Art neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls += 1;
      return coverageMask(world, kind);
    });
    for (let i = 0; i < 100; i++) cache.get(w, 'supply');
    expect(calls).toBe(1);
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    cache.get(w, 'supply');
    expect(calls).toBe(2);
    cache.get(w, 'faith');
    expect(calls).toBe(3);
    cache.get(w, 'supply'); // Art getrennt gehalten: kein Neuberechnen
    expect(calls).toBe(3);
  });

  it('AK-A3-05 Cache rechnet für eine andere Welt mit gleichem layoutKey neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls += 1;
      return coverageMask(world, kind);
    });
    const a = createWorld(3);
    const b = createWorld(4);
    expect(layoutKey(a)).toBe(layoutKey(b));
    cache.get(a, 'supply');
    const mb = cache.get(b, 'supply');
    expect(calls).toBe(2);
    expect(mb).toEqual(coverageMask(b, 'supply'));
  });

  it('AK-A3-05 Umriss-Segmente werden mit der Maske gecacht', () => {
    const cache = createCoverageCache();
    expect(cache.outline(w, 'supply')).toBe(cache.outline(w, 'supply'));
  });

  it('outlineSegments (Basis für AK-A3-01/02): eine Kachel hat 4 Kanten, zwei Nachbarn 6', () => {
    const m = new Array<boolean>(9).fill(false);
    m[4] = true;
    expect(outlineSegments(m, 3)).toHaveLength(4);
    m[5] = true;
    expect(outlineSegments(m, 3)).toHaveLength(6);
  });

  it('outlineSegments (Basis für AK-A3-01/02): Kartenrand zählt als Aussenkante', () => {
    expect(outlineSegments([true], 1)).toHaveLength(4);
  });

  it('AK-A3-02 overlayPlan je Werkzeug nach Spec 10.2', () => {
    expect(overlayPlan(w, 'house', 5, 5)).toMatchObject({ circle: null, coverage: 'supply' });
    expect(overlayPlan(w, 'market', 5, 5)).toMatchObject({ coverage: 'supply' });
    expect(overlayPlan(w, 'market', 5, 5)?.circle?.radius).toBe(8);
    expect(overlayPlan(w, 'chapel', 5, 5)).toMatchObject({ coverage: 'faith' });
    expect(overlayPlan(w, 'school', 5, 5)).toMatchObject({ coverage: 'school' });
    expect(overlayPlan(w, 'lumberjack', 5, 5)?.circle?.radius).toBe(2);
    expect(overlayPlan(w, 'lumberjack', 5, 5)?.coverage).toBeNull();
    expect(overlayPlan(w, 'fisher', 5, 5)).toBeNull();
  });

  it('AK-A3-04 symbolFor wählt Zeichen je Diagnose', () => {
    expect(symbolFor({ kind: 'supply' }).shape).toBe('sign');
    expect(symbolFor({ kind: 'good', good: 'food' }).shape).toBe('good');
    expect(symbolFor({ kind: 'service', service: 'faith' }).shape).toBe('bell');
    expect(symbolFor({ kind: 'service', service: 'school' }).shape).toBe('book');
    expect(SYMBOL_MIN_ZOOM).toBe(0.75);
  });
});

describe('M6-R2 Feuerwache im Overlay', () => {
  it('M6-AK-R2-01 overlayPlan für die Feuerwache: Kreis Radius 8, Abdeckung fire', () => {
    const plan = overlayPlan(w, 'firestation', k.x + 6, k.y - 4);
    expect(plan?.coverage).toBe('fire');
    expect(plan?.circle?.radius).toBe(8);
    expect(overlayPlan(w, 'chapel', k.x + 6, k.y - 4)?.coverage).toBe('faith');
    expect(overlayPlan(w, 'house', k.x + 6, k.y - 4)?.coverage).toBe('supply');
  });

  it('M6-AK-R2-01 Cache rechnet fire nur bei geändertem layoutKey neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls++;
      return coverageMask(world, kind);
    });
    cache.get(w, 'fire');
    cache.get(w, 'fire');
    cache.outline(w, 'fire');
    expect(calls).toBe(1);
  });

  it('M6-AK-R2-01 coveredBuildingIds(fire) deckt sich mit isProtected für 1×1-Gebäude (angebundene und nicht angebundene Wache)', () => {
    const add = (
      defId: 'firestation' | 'house',
      x: number,
      y: number,
      connected: boolean,
    ): Building => {
      const id = w.nextBuildingId++;
      const b: Building = { id, defId, x, y, connected, progress: 0, state: 'ok' };
      w.buildings[id] = b;
      w.tiles[idx(w, x, y)]!.buildingId = id;
      return b;
    };
    add('firestation', k.x + 6, k.y - 6, true);
    add('firestation', k.x + 6, k.y + 8, false); // nicht angebunden: schützt nicht
    const houses = [];
    for (let dx = -8; dx <= 14; dx += 2)
      for (let dy = -12; dy <= 12; dy += 2) {
        const x = k.x + 3 + dx,
          y = k.y - 6 + dy;
        const t = w.tiles[idx(w, x, y)];
        if (t && t.buildingId === null) houses.push(add('house', x, y, false));
      }
    expect(houses.length).toBeGreaterThan(20);
    // Maske ohne die nicht angebundene Wache: coverageMask zählt nur angebundene Quellen
    const ids = new Set(coveredBuildingIds(w, 'fire', coverageMask(w, 'fire')));
    let covered = 0;
    for (const h of houses) {
      expect(ids.has(h.id), `Haus ${h.x},${h.y}`).toBe(isProtected(w, h));
      if (ids.has(h.id)) covered++;
    }
    expect(covered).toBeGreaterThan(0);
    expect(covered).toBeLessThan(houses.length);
  });
});
