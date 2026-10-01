import { describe, expect, it } from 'vitest';
import { centerOn, visibleTileRange, type Camera } from '../../src/render/camera';
import { project } from '../../src/render/iso';
import { viewStats } from '../../src/render/viewStats';
import { createWorld, idx } from '../../src/sim/world';
import type { Terrain, World } from '../../src/sim/types';
import { SCENARIOS } from '../sim/scenarios';

const VIEW = { w: 1280, h: 720 };
const sum = (s: ReturnType<typeof viewStats>) => s.water + s.green + s.forest + s.rock + s.coast;
const seaWorld = (): World => {
  const w = createWorld(1);
  for (const t of w.tiles) t.terrain = 'water';
  return w;
};
const setT = (w: World, x: number, y: number, t: Terrain) => {
  w.tiles[idx(w, x, y)]!.terrain = t;
};

describe('viewStats', () => {
  it('AK-R5-01 Ausschnitt nur über Wasser: water 1, inhabitants 0', () => {
    const w = seaWorld();
    const cam: Camera = { x: 0, y: 0, zoom: 1 };
    centerOn(cam, w.width / 2, w.height / 2, VIEW, { w: w.width, h: w.height });
    const s = viewStats(w, cam, VIEW);
    expect(s.water).toBe(1);
    expect(s.inhabitants).toBe(0);
    expect(s.zoom).toBe(1);
  });

  it('AK-R5-01 Stadt: inhabitants = Summe der sichtbaren Häuser; Anteile summieren sich zu 1', () => {
    const w = SCENARIOS.galerie!();
    const houses = Object.values(w.buildings).filter((b) => b.house);
    const total = houses.reduce((a, b) => a + b.house!.inhabitants, 0);
    expect(total).toBeGreaterThan(0);
    const map = { w: w.width, h: w.height };
    const h0 = houses[0]!;
    // weit herausgezoomt über der Stadt: alle Häuser im Bild
    const wide: Camera = { x: 0, y: 0, zoom: 0.5 };
    const big = { w: 4000, h: 3000 };
    centerOn(wide, h0.x, h0.y, big, map);
    const s = viewStats(w, wide, big);
    expect(sum(s)).toBeCloseTo(1, 9);
    expect(s.inhabitants).toBe(total);
    // Mitte im Bild nur für das erste Haus: eng um dessen Mitte
    const tight: Camera = { x: 0, y: 0, zoom: 2 };
    const c = project(h0.x + 0.5, h0.y + 0.5);
    tight.x = c.x - 10;
    tight.y = c.y - 10;
    const t = viewStats(w, tight, { w: 40, h: 40 });
    expect(t.inhabitants).toBe(
      houses
        .filter((b) => {
          const p = project(b.x + 0.5, b.y + 0.5);
          return Math.abs(p.x - c.x) < 10 && Math.abs(p.y - c.y) < 10;
        })
        .reduce((a, b) => a + b.house!.inhabitants, 0),
    );
    expect(t.inhabitants).toBeLessThan(total);
    expect(sum(t)).toBeCloseTo(1, 9);
  });

  it('AK-R5-01 Bereiche ausserhalb der Karte zählen nicht', () => {
    const w = seaWorld();
    for (let y = 0; y < w.height; y++) for (let x = 0; x < w.width; x++) setT(w, x, y, 'grass');
    // Kamera links oben über die Kartenecke hinaus: ausserhalb läge Wasser, wird aber nie gezählt
    const cam: Camera = { x: -400, y: -200, zoom: 1 };
    const s = viewStats(w, cam, VIEW);
    expect(s.green).toBe(1);
    expect(s.water).toBe(0);
    expect(sum(s)).toBeCloseTo(1, 9);
  });

  it('RF-R5 Ausschnitt ganz ausserhalb: water 1, Rest 0 (Summe bleibt 1)', () => {
    const w = SCENARIOS.galerie!();
    const cam: Camera = { x: 100000, y: 100000, zoom: 1 };
    const s = viewStats(w, cam, VIEW);
    expect(s).toEqual({
      water: 1,
      green: 0,
      forest: 0,
      rock: 0,
      coast: 0,
      inhabitants: 0,
      zoom: 1,
    });
    const far: Camera = { x: -100000, y: -100000, zoom: 1 };
    expect(viewStats(w, far, VIEW).water).toBe(1);
  });

  it('AK-ISO-12 Landkachel in der Box, Mitte ausserhalb des Bildes, zählt nicht; Summe bleibt 1', () => {
    const w = seaWorld();
    const tx = 30,
      ty = 30;
    setT(w, tx, ty, 'grass');
    const mid = project(tx + 0.5, ty + 0.5);
    for (const zoom of [0.5, 1, 2]) {
      // Mitte 5 Bildpixel links ausserhalb, vertikal mittig
      const out: Camera = { x: mid.x + 5 / zoom, y: mid.y - VIEW.h / 2 / zoom, zoom };
      const r = visibleTileRange(out, VIEW, { w: w.width, h: w.height });
      expect(tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1).toBe(true);
      const s = viewStats(w, out, VIEW);
      expect(s.green).toBe(0);
      expect(s.water).toBe(1);
      expect(sum(s)).toBeCloseTo(1, 9);
      // gleiche Kachel mit Mitte 5 Pixel innerhalb: sie zählt
      const inside: Camera = { ...out, x: mid.x - 5 / zoom };
      expect(viewStats(w, inside, VIEW).green).toBeGreaterThan(0);
    }
  });
});
