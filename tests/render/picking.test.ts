import { beforeAll, describe, expect, it } from 'vitest';
import { bodyHull, buildingHulls, pickBuilding, type Hull } from '../../src/render/iso';
import { SILHOUETTES, bodyPolygons } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { BuildingDef, BuildingDefId, Building, Tier, World } from '../../src/sim/types';
import { tileAt } from '../../src/sim/world';
import { VERDECKUNG, verdeckung } from '../sim/scenarios-iso';
import { inHull, type P } from './fakeCtx';

// Das Laden von sprites.ts meldet den Silhouetten-Provider an (setBodyShapes); ohne diesen Import fiele das Picking auf die Hülle zurück.
let world: World;
let chapel: Building;
beforeAll(() => {
  world = verdeckung();
  const id = tileAt(world, VERDECKUNG.C.x, VERDECKUNG.C.y)?.buildingId;
  if (id == null) throw new Error('keine Kapelle im Szenario');
  chapel = world.buildings[id]!;
});

const inPoly = (poly: readonly P[], x: number, y: number): boolean => {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) r = !r;
  }
  return r;
};
/** Nur die Kapelle als Hüllenliste, damit kein anderes Gebäude das Ergebnis bestimmt. */
const chapelHulls = (): Hull[] => buildingHulls(world).filter((h) => h.id === chapel.id);

/** Punkte in der Hülle (Rand 2 px innen), die in keinem Silhouetten-Polygon liegen. */
function emptyHullPoints(): P[] {
  const def = BUILDING_DEFS.chapel;
  const hull = bodyHull(def, chapel);
  const polys = bodyPolygons(def, chapel);
  const xs = hull.map((p) => p.x),
    ys = hull.map((p) => p.y);
  const out: P[] = [];
  for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1)
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1)
      if (inHull(hull, x, y, -2) && !polys.some((p) => inPoly(p, x, y))) out.push({ x, y });
  return out;
}

describe('Picking über Silhouetten (R113)', () => {
  it('AK-ISO-15 (R113) Hüllen-Leerfeld neben dem Kapellenturm liefert nicht die Kapelle', () => {
    const empty = emptyHullPoints();
    expect(empty.length).toBeGreaterThan(0);
    const hulls = chapelHulls();
    expect(hulls[0]!.shape).toBeTypeOf('function');
    for (const q of empty) expect(pickBuilding(hulls, q.x, q.y), `${q.x},${q.y}`).toBeNull();
  });

  it('AK-ISO-15 (R113) Punkt im Kapellenkörper liefert die Kapelle', () => {
    const polys = bodyPolygons(BUILDING_DEFS.chapel, chapel);
    const poly = polys.find((p) => p.length >= 3)!;
    const cx = poly.reduce((a, p) => a + p.x, 0) / poly.length;
    const cy = poly.reduce((a, p) => a + p.y, 0) / poly.length;
    // Schwerpunkt kann bei nicht konvexen Polygonen ausserhalb liegen: erster getroffener Rasterpunkt der Fläche
    const hit = inPoly(poly, cx, cy)
      ? { x: cx, y: cy }
      : (() => {
          for (
            let y = Math.min(...poly.map((p) => p.y));
            y < Math.max(...poly.map((p) => p.y));
            y++
          )
            for (
              let x = Math.min(...poly.map((p) => p.x));
              x < Math.max(...poly.map((p) => p.x));
              x++
            )
              if (inPoly(poly, x, y)) return { x, y };
          throw new Error('Polygon ohne Rasterpunkt');
        })();
    expect(pickBuilding(chapelHulls(), hit.x, hit.y)).toBe(chapel.id);
  });

  it('AK-ISO-15 (R113) Ohne Silhouetten-Provider (Hülle ohne shape) fällt das Picking auf die Hülle zurück', () => {
    const empty = emptyHullPoints();
    const plain: Hull[] = chapelHulls().map(({ id, hull }) => ({ id, hull }));
    expect(empty.length).toBeGreaterThan(0);
    for (const q of empty) expect(pickBuilding(plain, q.x, q.y), `${q.x},${q.y}`).toBe(chapel.id);
  });
});

describe('bodyPolygons für alle Typen (R113)', () => {
  const mk = (defId: BuildingDefId, tier?: Tier): Building => ({
    id: 1,
    defId,
    x: 5,
    y: 7,
    connected: true,
    progress: 1,
    state: 'ok',
    ...(tier
      ? {
          house: {
            tier,
            inhabitants: 4,
            demand: {},
            satisfied: {},
            services: {},
            satisfiedSince: 0,
            supplied: true,
          },
        }
      : {}),
  });
  const nonEmpty = (def: BuildingDef, b: Building): void => {
    const polys = bodyPolygons(def, b);
    expect(polys.length).toBeGreaterThan(0);
    for (const p of polys) {
      expect(p.length).toBeGreaterThanOrEqual(3);
      for (const q of p) {
        expect(Number.isFinite(q.x)).toBe(true);
        expect(Number.isFinite(q.y)).toBe(true);
      }
    }
  };

  for (const id of Object.keys(SILHOUETTES) as BuildingDefId[])
    if (id !== 'house')
      it(`RF-R113 ${id}: Polygone nicht leer`, () => nonEmpty(BUILDING_DEFS[id], mk(id)));

  for (const tier of [1, 2, 3] as Tier[])
    it(`RF-R113 house Stufe ${tier}: Polygone nicht leer`, () => {
      nonEmpty(BUILDING_DEFS.house, mk('house', tier));
    });

  for (const category of ['housing', 'production', 'public', 'infrastructure'] as const)
    for (const [w, h] of [
      [1, 1],
      [2, 2],
    ] as const)
      it(`RF-R113 Kategorie-Fallback ${category} ${w}x${h}: Polygone nicht leer`, () => {
        const def = { ...BUILDING_DEFS.fisher, id: 'unbekannt' as BuildingDefId, category, w, h };
        nonEmpty(def, mk('fisher'));
      });
});
