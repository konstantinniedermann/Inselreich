import { describe, expect, it } from 'vitest';
import {
  ISO_H,
  ISO_W,
  ZOOM_STEPS,
  bodyHeight,
  bodyHull,
  buildingHulls,
  depthKey,
  pickBuilding,
  project,
  radiusEllipse,
  pointBounds,
  sortedObjects,
  spriteBounds,
  unproject,
  zoomStep,
  treeVariant,
  type Footprint,
  type Hull,
  type Pt,
} from '../../src/render/iso';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { demolish, placeBuilding } from '../../src/sim/build';
import { createWorld, tilesInRadius } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';
import { forceRect } from '../sim/helpers';

const inPoly = (h: readonly Pt[], x: number, y: number): boolean => {
  for (let i = 0; i < h.length; i++) {
    const a = h[i]!,
      b = h[(i + 1) % h.length]!;
    if ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) < 0) return false;
  }
  return true;
};
const mkBuilding = (id: number, defId: Building['defId'], x: number, y: number): Building => ({
  id,
  defId,
  x,
  y,
  connected: true,
  progress: 0,
  state: 'ok',
});

/** Welt mit freier Grasfläche östlich des Kontors (Versorgungsradius), Geld im Überfluss. */
function buildWorld(): { world: World; o: Pt } {
  const world = createWorld(3, { unlockAll: true });
  const k = world.buildings[world.kontorId]!;
  const o = { x: k.x + 3, y: k.y + 3 };
  forceRect(world, o.x, o.y, 5, 5, 'grass');
  world.money = 100000;
  for (const g of Object.keys(world.stock) as (keyof World['stock'])[]) world.stock[g] = 1000;
  return { world, o };
}

describe('Projektion', () => {
  it('AK-ISO-01 project/unproject sind zueinander invers', () => {
    for (const [x, y] of [
      [0, 0],
      [12.25, 40.5],
      [63.99, 0.01],
    ] as const) {
      const p = project(x, y);
      const t = unproject(p.x, p.y);
      expect(t.x).toBeCloseTo(x, 9);
      expect(t.y).toBeCloseTo(y, 9);
    }
    expect(project(1, 0)).toEqual({ x: ISO_W / 2, y: ISO_H / 2 });
  });
  it('ISO §16 zoomStep rastert auf die kleinste Stufe ≥ z, über 2 bleibt 2', () => {
    expect(zoomStep(0.5)).toBe(0.5);
    expect(zoomStep(0.51)).toBe(0.75);
    expect(zoomStep(1.1)).toBe(1.5);
    expect(zoomStep(2)).toBe(2);
    expect(zoomStep(3)).toBe(2);
    for (let z = 0.5; z <= 2; z += 0.01) expect(ZOOM_STEPS).toContain(zoomStep(z));
  });
  it('ISO D-13 treeVariant ist deterministisch und liegt in 0 … 7', () => {
    for (let i = 0; i < 200; i++) {
      const v = treeVariant(7, i % 64, (i * 7) % 64);
      expect(v).toBe(treeVariant(7, i % 64, (i * 7) % 64));
      expect(Number.isInteger(v) && v >= 0 && v < 8).toBe(true);
    }
  });
});

describe('Bildbox', () => {
  it('ISO D-12 pointBounds: Box um die Rautenmitte, Breite ISO_W, Höhe height + ISO_H / 2', () => {
    const c = project(10.5, 20.25);
    const b = pointBounds(10.5, 20.25, 40);
    expect(b).toEqual({ x: c.x - ISO_W / 2, y: c.y - 40, w: ISO_W, h: 40 + ISO_H / 2 });
    expect(b.y + b.h).toBe(c.y + ISO_H / 2);
  });
});

describe('Tiefe', () => {
  it('AK-ISO-06 depthKey zeichnet bei echt überlappenden Bildspalten das hintere zuerst', () => {
    const fps: Footprint[] = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) fps.push({ x, y, w: 1, h: 1 });
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) fps.push({ x, y, w: 2, h: 2 });
    for (let cy = 0.5; cy <= 7.5; cy += 0.25)
      for (let cx = 0.5; cx <= 7.5; cx += 0.25) fps.push({ x: cx - 0.5, y: cy - 0.5, w: 1, h: 1 });
    const disjoint = (a: Footprint, b: Footprint): boolean =>
      a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
    const back = (a: Footprint, b: Footprint): boolean => a.x + a.w <= b.x || a.y + a.h <= b.y;
    let pairs = 0,
      errors = 0,
      ties = 0,
      both = 0;
    for (const a of fps)
      for (const b of fps) {
        if (a === b || !disjoint(a, b)) continue;
        const lo = Math.max(a.x - (a.y + a.h), b.x - (b.y + b.h));
        const hi = Math.min(a.x + a.w - a.y, b.x + b.w - b.y);
        if (!(lo < hi)) continue; // Spalten überlappen nicht echt
        if (!back(a, b)) continue;
        if (back(b, a)) {
          both++;
          continue;
        }
        pairs++;
        const [ka, kb] = [depthKey(a), depthKey(b)];
        if (ka === kb) ties++;
        else if (ka > kb) errors++;
      }
    expect(pairs).toBeGreaterThan(10000);
    expect(both).toBe(0);
    expect(ties).toBe(0);
    expect(errors).toBe(0);
  });
});

describe('Radius', () => {
  it('AK-ISO-07 Ellipse = Sim-Metrik (tilesInRadius) für jede Kachel, ausser |d − r| ≤ 1e-9', () => {
    const world = createWorld(1, { unlockAll: true });
    for (const r of [2, 3.5, 6, 8])
      for (const [cx, cy] of [
        [10, 10],
        [20.5, 30.5],
        [31, 17.5],
        [1, 62],
      ] as const) {
        const inSim = new Set(tilesInRadius(world, cx, cy, r).map((p) => p.y * world.width + p.x));
        const { rx, ry } = radiusEllipse(r);
        expect(rx).toBeCloseTo(r * 32 * Math.SQRT2, 9);
        expect(ry).toBeCloseTo(r * 16 * Math.SQRT2, 9);
        const c = project(cx, cy);
        let checked = 0;
        for (let y = 0; y < world.height; y++)
          for (let x = 0; x < world.width; x++) {
            if (Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r) <= 1e-9) continue;
            const p = project(x + 0.5, y + 0.5);
            const inEllipse = ((p.x - c.x) / rx) ** 2 + ((p.y - c.y) / ry) ** 2 <= 1;
            expect(inEllipse, `r${r} (${cx},${cy}) Kachel (${x},${y})`).toBe(
              inSim.has(y * world.width + x),
            );
            checked++;
          }
        expect(checked).toBeGreaterThan(4000);
      }
  });
});

describe('Picking', () => {
  const house = BUILDING_DEFS.house;
  it('AK-ISO-08 bodyHull/pickBuilding: vorn gewinnt, Dach über der Kachel dahinter trifft', () => {
    const backB = mkBuilding(1, 'house', 10, 10);
    const frontB = mkBuilding(2, 'house', 11, 11);
    const hulls: Hull[] = [backB, frontB].map((b) => ({ id: b.id, hull: bodyHull(house, b) }));
    const x0 = project(10.5, 10.5).x;
    const overlapY = project(10.5, 10.5).y; // Mitte der hinteren Raute, im Dach der vorderen
    expect(inPoly(hulls[0]!.hull, x0, overlapY)).toBe(true);
    expect(inPoly(hulls[1]!.hull, x0, overlapY)).toBe(true);
    expect(pickBuilding(hulls, x0, overlapY)).toBe(2);
    // nur im hinteren Dach (hoch über der oberen Ecke)
    const top = project(10, 10);
    expect(pickBuilding(hulls, top.x, top.y - bodyHeight(house, backB) + 2)).toBe(1);
    // Dach über der Kachel dahinter: Punkt liegt über einer anderen Kachel als der eigenen
    const roof = { x: project(11, 11).x, y: project(11, 11).y - 20 };
    const single: Hull[] = [{ id: 2, hull: bodyHull(house, frontB) }];
    expect(pickBuilding(single, roof.x, roof.y)).toBe(2);
    const t = unproject(roof.x, roof.y);
    expect({ x: Math.floor(t.x), y: Math.floor(t.y) }).not.toEqual({ x: 11, y: 11 });
  });

  it('AK-ISO-08 Hülle ist ein konvexes Sechseck im Uhrzeigersinn (Kreuzprodukte ≥ 0)', () => {
    const b = mkBuilding(1, 'market', 5, 7);
    const h = bodyHull(BUILDING_DEFS.market, b);
    expect(h).toHaveLength(6);
    const m = project(5 + 1, 7 + 1);
    expect(inPoly(h, m.x, m.y)).toBe(true);
    expect(inPoly(h, m.x + 500, m.y)).toBe(false);
  });

  it('AK-ISO-08 Negativfall: Punkt in spriteBounds, aber ausserhalb der Körperhülle → null', () => {
    // Haus (11, 11) mit Weg auf der vorderen linken Nachbarkachel (11, 12)
    const b = mkBuilding(1, 'house', 11, 11);
    const box = spriteBounds(house, b);
    const px = box.x + 1,
      py = box.y + box.h - 1; // linke untere Ecke der Box
    const t = unproject(px, py);
    expect({ x: Math.floor(t.x), y: Math.floor(t.y) }).toEqual({ x: 11, y: 12 });
    expect(pickBuilding([{ id: 1, hull: bodyHull(house, b) }], px, py)).toBeNull();
  });

  it('AK-ISO-08 Negativfall: nur über Baumstempel, Schiff oder Figur → null; in keiner Hülle → null', () => {
    const world = createWorld(1, { unlockAll: true });
    const hulls = buildingHulls(world);
    const items = sortedObjects(world, [
      { kind: 'ship', id: 1, cx: 3.5, cy: 3.5 },
      { kind: 'walker', id: 2, cx: 10.5, cy: 50.5 },
    ]);
    const tree = items.find((i) => i.kind === 'tree');
    expect(tree).toBeDefined();
    const c = project(tree!.fp.x + 0.5, tree!.fp.y + 0.5);
    const kontor = world.buildings[world.kontorId]!;
    const kp = project(kontor.x + 1, kontor.y + 1);
    // Baum weit genug vom Kontor entfernt, sonst wäre der Test nicht aussagekräftig
    expect(Math.hypot(c.x - kp.x, c.y - kp.y)).toBeGreaterThan(200);
    expect(pickBuilding(hulls, c.x, c.y - 10)).toBeNull();
    for (const kind of ['ship', 'walker'] as const) {
      const m = items.find((i) => i.kind === kind)!;
      const p = project(m.fp.x + 0.5, m.fp.y + 0.5);
      expect(pickBuilding(hulls, p.x, p.y - 10)).toBeNull();
    }
    expect(pickBuilding(hulls, 1e6, 1e6)).toBeNull();
    expect(pickBuilding([], 0, 0)).toBeNull();
  });
});

describe('Sortierung und Cache', () => {
  it('AK-ISO-21 sortedObjects mischt bewegte Objekte ein; Gleichstand: Baum < Gebäude < Schiff < Boot < Figur, dann Id', () => {
    const world = createWorld(1, { unlockAll: true });
    const t0 = sortedObjects(world).find((i) => i.kind === 'tree')!;
    const [tx, ty] = [t0.fp.x, t0.fp.y];
    // Gebäude mit niedriger Id auf derselben Kachel wie der Baum (Kachel bewusst nicht belegt)
    world.buildings[2] = mkBuilding(2, 'house', tx, ty);
    world.nextBuildingId = 3;
    const at = (kind: 'ship' | 'boat' | 'walker', id: number, dx = 0, dy = 0) => ({
      kind,
      id,
      cx: tx + 0.5 + dx,
      cy: ty + 0.5 + dy,
    });
    const out = sortedObjects(world, [
      at('walker', 7),
      at('walker', 3),
      at('boat', 4),
      at('ship', 9),
      at('walker', 50, -3, 0), // kleinerer key: vor allen festen Objekten dieser Kachel
      at('walker', 51, 3, 0), // grösserer key: dahinter
    ]);
    const key = depthKey({ x: tx, y: ty, w: 1, h: 1 });
    const same = out.filter((i) => i.key === key && i.fp.x === tx);
    expect(same.map((i) => `${i.kind}${i.id}`)).toEqual([
      `tree${t0.id}`,
      'building2',
      'ship9',
      'boat4',
      'walker3',
      'walker7',
    ]);
    const idx = (kind: string, id: number) => out.findIndex((i) => i.kind === kind && i.id === id);
    expect(idx('walker', 50)).toBeLessThan(idx('tree', t0.id));
    expect(idx('walker', 51)).toBeGreaterThan(idx('walker', 7));
    for (let i = 1; i < out.length; i++)
      expect(out[i]!.key).toBeGreaterThanOrEqual(out[i - 1]!.key);
    expect(out).toHaveLength(sortedObjects(world).length + 6);
  });

  it('AK-ISO-21 sortedObjects: drei Permutationen der Gebäudeliste → gleiche Reihenfolge', () => {
    const spots: [Parameters<typeof placeBuilding>[1], number, number][] = [
      ['house', 0, 0],
      ['house', 1, 0],
      ['house', 0, 1], // Gleichstand mit (1, 0): gleicher depthKey
      ['market', 2, 2],
    ];
    const orders = [
      [0, 1, 2, 3],
      [3, 2, 1, 0],
      [2, 0, 3, 1],
    ];
    const seqs = orders.map((ord) => {
      const { world, o } = buildWorld();
      for (const i of ord) {
        const [d, dx, dy] = spots[i]!;
        expect(placeBuilding(world, d, o.x + dx, o.y + dy).ok).toBe(true);
      }
      return sortedObjects(world)
        .filter((i) => i.kind === 'building')
        .map((i) => {
          const b = world.buildings[i.id]!;
          return `${b.defId}@${b.x - o.x},${b.y - o.y}`;
        });
    });
    expect(seqs[0]).toHaveLength(5); // inkl. Kontor
    expect(seqs[1]).toEqual(seqs[0]);
    expect(seqs[2]).toEqual(seqs[0]);
  });

  it('AK-ISO-21 nach placeBuilding enthält die gecachte Liste das Gebäude, nach demolish nicht mehr; pickBuilding → null bzw. dahinter', () => {
    const { world, o } = buildWorld();
    const back = placeBuilding(world, 'house', o.x, o.y).id!;
    const before = sortedObjects(world);
    expect(before.some((i) => i.kind === 'building' && i.id === back)).toBe(true);
    const id = placeBuilding(world, 'house', o.x + 1, o.y + 1).id!;
    const after = sortedObjects(world);
    expect(after).not.toBe(before);
    expect(after.some((i) => i.kind === 'building' && i.id === id)).toBe(true);
    // gleiche Welt, gleicher Schlüssel → gleiche Liste aus dem Cache
    expect(sortedObjects(world)).toBe(after);
    const b = world.buildings[id]!;
    const px = project(b.x + 0.5, b.y + 0.5).x;
    const overlapY = project(b.x, b.y).y - 8; // im Dach beider Häuser
    const frontOnlyY = project(b.x + 0.5, b.y + 0.5).y; // unterhalb der hinteren Hülle
    expect(pickBuilding(buildingHulls(world), px, overlapY)).toBe(id);
    expect(pickBuilding(buildingHulls(world), px, frontOnlyY)).toBe(id);
    expect(demolish(world, id).ok).toBe(true);
    const gone = sortedObjects(world);
    expect(gone.some((i) => i.kind === 'building' && i.id === id)).toBe(false);
    expect(pickBuilding(buildingHulls(world), px, overlapY)).toBe(back);
    expect(pickBuilding(buildingHulls(world), px, frontOnlyY)).toBeNull();
  });
});
