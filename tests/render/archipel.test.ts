import { describe, expect, it } from 'vitest';
import {
  CAMERA_MARGIN,
  archipelRect,
  cameraBounds,
  islandCam,
  islandView,
  pickArchipel,
  visibleIslands,
  type Placed,
} from '../../src/render/archipel';
import {
  type Camera,
  centerOn,
  screenToTile,
  visibleTileRange,
  worldToScreen,
} from '../../src/render/camera';
import { H_TOWER, project } from '../../src/render/iso';
import { createWorld } from '../../src/sim/world';
import { serialize } from '../../src/sim/save';
import { foundKontor2Literal, seaWorld } from '../sim/seaHelpers';
import { lumberjackLiteral } from './seaRender';

const HEIMAT: Placed = { ox: 0, oy: 0, width: 64, height: 64 };
const A: Placed = { ox: 90, oy: 10, width: 24, height: 24 };
const B: Placed = { ox: 20, oy: 100, width: 36, height: 36 };
const ISLANDS = [HEIMAT, A, B];
const VIEW = { w: 1920, h: 1080 };

/** Kamera direkt gesetzt, ohne Klemmung: Kachelpunkt (fx, fy) in der Bildmitte. */
const camOn = (fx: number, fy: number, zoom: number, view = VIEW): Camera => {
  const p = project(fx, fy);
  return { x: p.x - view.w / 2 / zoom, y: p.y - view.h / 2 / zoom, zoom };
};

describe('M12 E1 Archipel', () => {
  it('AK-E1-07 visibleIslands: Heimat, Meer, Übersicht in Tiefenfolge, Insel halb im Bild', () => {
    expect(visibleIslands(camOn(32, 32, 1), VIEW, ISLANDS)).toEqual([0]);
    expect(visibleIslands(camOn(110, 80, 1), VIEW, ISLANDS)).toEqual([]);
    const r = archipelRect(ISLANDS);
    expect(
      visibleIslands(camOn((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0.125), VIEW, ISLANDS),
    ).toEqual([0, 1, 2]);
    // A halb im Bild: linker Bildrand genau auf der Mitte von A
    const m = project(A.ox + A.width / 2, A.oy + A.height / 2);
    const half: Camera = { x: m.x - 50, y: m.y - 540, zoom: 1 };
    expect(visibleIslands(half, VIEW, ISLANDS)).toContain(1);
    const view = { w: 100, h: 100 };
    expect(visibleIslands({ x: m.x, y: m.y, zoom: 1 }, view, ISLANDS)).toContain(1);
  });

  it('AK-E1-08 islandCam: Bereich der Heimat unverändert, Insel A in Inselkoordinaten geklemmt', () => {
    for (const zoom of [0.5, 1, 2])
      for (let i = 0; i < 7; i++) {
        const c = camOn(8 + i * 8, 56 - i * 7, zoom);
        const heimat = visibleTileRange(islandCam(c, HEIMAT), VIEW, { w: 64, h: 64 });
        expect(heimat).toEqual(visibleTileRange(c, VIEW, { w: 64, h: 64 }));
        const a = visibleTileRange(islandCam(c, A), VIEW, { w: 24, h: 24 });
        expect(a.x0).toBeGreaterThanOrEqual(0);
        expect(a.y0).toBeGreaterThanOrEqual(0);
        expect(a.x1).toBeLessThanOrEqual(23);
        expect(a.y1).toBeLessThanOrEqual(23);
      }
    const c = camOn(100, 20, 1);
    const a = visibleTileRange(islandCam(c, A), VIEW, { w: 24, h: 24 });
    expect(a.x1).toBeGreaterThanOrEqual(a.x0);
  });

  it('AK-E1-09 pickArchipel: Kachelmitte je Insel, Meer, Gleichheit mit screenToTile über der Heimat', () => {
    const c = camOn(70, 60, 1);
    ISLANDS.forEach((isl, island) => {
      const s = worldToScreen(c, project(isl.ox + 3.5, isl.oy + 4.5));
      expect(pickArchipel(c, s.x, s.y, ISLANDS)).toEqual({ island, x: 3, y: 4 });
    });
    const sea = worldToScreen(c, project(80, 80));
    expect(pickArchipel(c, sea.x, sea.y, ISLANDS)).toBeNull();
    const c2 = camOn(32, 32, 1);
    for (let i = 0; i < 50; i++) {
      const sx = 400 + (i % 10) * 120,
        sy = 200 + Math.floor(i / 10) * 140;
      const t = screenToTile(c2, sx, sy);
      const p = pickArchipel(c2, sx, sy, ISLANDS);
      if (t.x >= 0 && t.x < 64 && t.y >= 0 && t.y < 64) expect(p).toEqual({ island: 0, ...t });
      else expect(p?.island).not.toBe(0);
    }
  });

  it('AK-E1-12 Sprungmodus: nur die aktive Insel', () => {
    const c = camOn(32, 32, 1);
    expect(visibleIslands(c, VIEW, ISLANDS, 1, 'jump').every((i) => i === 1)).toBe(true);
    expect(visibleIslands(c, VIEW, ISLANDS, 0, 'jump')).toEqual([0]);
    expect(cameraBounds(ISLANDS, 1, 'jump')).toEqual({ x0: 90, y0: 10, x1: 114, y1: 34 });
    const s = worldToScreen(c, project(10, 10));
    expect(pickArchipel(c, s.x, s.y, ISLANDS, 1, 'jump')).toBeNull();
  });

  it('cameraBounds sea: Rahmen ± CAMERA_MARGIN', () => {
    const r = archipelRect(ISLANDS);
    expect(r).toEqual({ x0: 0, y0: 0, x1: 114, y1: 136 });
    expect(cameraBounds(ISLANDS)).toEqual({
      x0: -CAMERA_MARGIN,
      y0: -CAMERA_MARGIN,
      x1: 114 + CAMERA_MARGIN,
      y1: 136 + CAMERA_MARGIN,
    });
  });

  it('AK-U3 cameraBounds <= Landausdehnung + Rand an allen vier Seiten, Seeds 1-10', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const isl = createWorld(seed).islands;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const i of isl)
        i.tiles.forEach((t, k) => {
          if (t.terrain === 'water') return;
          const x = i.ox + (k % i.width),
            y = i.oy + Math.floor(k / i.width);
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x + 1);
          y1 = Math.max(y1, y + 1);
        });
      const b = cameraBounds(isl);
      expect(CAMERA_MARGIN, `Seed ${seed}`).toBeLessThanOrEqual(8);
      expect(x0 - b.x0, `Seed ${seed} West`).toBeLessThanOrEqual(8);
      expect(y0 - b.y0, `Seed ${seed} Nord`).toBeLessThanOrEqual(8);
      expect(b.x1 - x1, `Seed ${seed} Ost`).toBeLessThanOrEqual(8);
      expect(b.y1 - y1, `Seed ${seed} Süd`).toBeLessThanOrEqual(8);
      // Land bleibt im Rahmen (kein Abschneiden)
      expect(b.x0).toBeLessThanOrEqual(x0);
      expect(b.y0).toBeLessThanOrEqual(y0);
      expect(b.x1).toBeGreaterThanOrEqual(x1);
      expect(b.y1).toBeGreaterThanOrEqual(y1);
    }
  });

  // Timeout: lokal ≤ 0,6 s (seriell, Last eher höher), CI bis ~4×, R270/R318
  it('AK-E1-17 Seeds 1…200: Rahmen bei Zoom 0,125 passt in 1280 × 800, Übersicht zeigt alle Inseln', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const isl = createWorld(seed).islands;
      const r = archipelRect(isl);
      const pts = [
        project(r.x0, r.y0),
        project(r.x1, r.y0),
        project(r.x0, r.y1),
        project(r.x1, r.y1),
      ];
      const xs = pts.map((p) => p.x),
        ys = pts.map((p) => p.y);
      const w = (Math.max(...xs) - Math.min(...xs)) * 0.125;
      const h = (Math.max(...ys) - Math.min(...ys) + H_TOWER) * 0.125;
      expect(w, `seed ${seed}`).toBeLessThanOrEqual(1280);
      expect(h, `seed ${seed}`).toBeLessThanOrEqual(800);
      const c: Camera = { x: 0, y: 0, zoom: 0.125 };
      centerOn(c, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, VIEW, r);
      expect(visibleIslands(c, VIEW, isl), `seed ${seed}`).toHaveLength(isl.length);
    }
  }, 15_000);
});

describe('M12 E2 Render Fremdinseln', () => {
  it('islandView(w, 0) ist die Welt selbst', () => {
    const w = seaWorld();
    expect(islandView(w, 0)).toBe(w);
  });

  it('islandView(w, 2): Gebäude der Insel als flache Kopien mit island 0, Insel 1 leer, Welt unverändert', () => {
    const w = seaWorld();
    const k = foundKontor2Literal(w, 2);
    const lj = lumberjackLiteral(w, 2);
    const before = serialize(w);
    const v = islandView(w, 2);
    expect(Object.keys(v.buildings).map(Number)).toEqual([k.id, lj.id].sort((a, b) => a - b));
    for (const b of [k, lj]) {
      const copy = v.buildings[b.id]!;
      expect(copy).not.toBe(b);
      expect(copy.island).toBe(0);
      expect({ ...copy, island: b.island }).toEqual(b);
    }
    expect(Object.keys(islandView(w, 1).buildings)).toEqual([]);
    expect(w.buildings[k.id]!.island).toBe(2);
    expect(serialize(w)).toBe(before);
  });

  it('islandView folgt neuen Gebäuden und abgerissenen (Ansicht bleibt dieselbe Identität)', () => {
    const w = seaWorld();
    const v = islandView(w, 2);
    expect(Object.keys(v.buildings)).toEqual([]);
    const lj = lumberjackLiteral(w, 2);
    expect(islandView(w, 2)).toBe(v);
    expect(Object.keys(islandView(w, 2).buildings).map(Number)).toEqual([lj.id]);
    delete w.buildings[lj.id];
    expect(Object.keys(islandView(w, 2).buildings)).toEqual([]);
  });
});
