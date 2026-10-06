import { describe, expect, it } from 'vitest';
import { H_TOWER, ZOOM_STEPS, footprintOrigin, project, type Pt } from '../../src/render/iso';
import {
  type Camera,
  centerOn,
  clampToMap,
  clampToRect,
  groundMatrix,
  screenToTile,
  screenToTileF,
  screenToWorld,
  tileCorners,
  visibleTileRange,
  worldToScreen,
  zoomAt,
} from '../../src/render/camera';

const ZOOMS = [0.5, 0.75, 1, 1.1, 1.33, 1.7, 2];
const OFFSETS = [
  { x: 0, y: 0 },
  { x: 13.7, y: 5.3 },
];
/** Kamera so, dass Kachel (64/2, 0) sicher im Bild liegt; Versatz addiert. */
const camAt = (zoom: number, o: { x: number; y: number }): Camera => ({
  x: -640 + o.x,
  y: -40 + o.y,
  zoom,
});
const MAPS = [
  { w: 64, h: 64 },
  { w: 48, h: 64 },
];
const VIEW = { w: 1280, h: 720 };

describe('Iso-Kamera: Projektion und Kanten', () => {
  it('AK-ISO-01 Rundreise über die Rautenmitte, alle Kacheln, Zoomstufen, Versätze', () => {
    for (const zoom of ZOOMS)
      for (const o of OFFSETS) {
        const c = camAt(zoom, o);
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const p = project(x + 0.5, y + 0.5);
            const s = { x: Math.round((p.x - c.x) * zoom), y: Math.round((p.y - c.y) * zoom) };
            expect(screenToTile(c, s.x, s.y)).toEqual({ x, y });
          }
      }
  });

  it('AK-ISO-02 obere Ecke: 0,01 px darunter (x, y), 1 px darüber (x − 1, y − 1)', () => {
    for (const zoom of ZOOMS)
      for (const o of OFFSETS) {
        const c = camAt(zoom, o);
        for (let y = 1; y < 64; y += 3)
          for (let x = 1; x < 64; x += 3) {
            const s = worldToScreen(c, project(x, y)); // exakt, ungerundet
            expect(screenToTile(c, s.x, s.y + 0.01)).toEqual({ x, y });
            expect(screenToTile(c, s.x, s.y - 1)).toEqual({ x: x - 1, y: y - 1 });
          }
      }
  });

  it('AK-ISO-02 jede Pixelmitte > 1 px von jeder Kante liegt in der gezeichneten Raute (Zoom 1 und 0,5)', () => {
    const segDist = (p: Pt, a: Pt, b: Pt): number => {
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
      );
      return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    };
    const inPoly = (p: Pt, q: Pt[]): boolean => {
      let inside = false;
      for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
        const a = q[i]!,
          b = q[j]!;
        if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
          inside = !inside;
      }
      return inside;
    };
    let checked = 0;
    for (const zoom of [1, 0.5]) {
      const c = camAt(zoom, { x: 0, y: 0 }); // ganzzahlig
      const tiles: { x: number; y: number; q: Pt[] }[] = [];
      for (let ty = 10; ty < 13; ty++)
        for (let tx = 10; tx < 13; tx++) tiles.push({ x: tx, y: ty, q: tileCorners(c, tx, ty) });
      const all = tiles.flatMap((t) => t.q);
      const x0 = Math.min(...all.map((p) => p.x)),
        x1 = Math.max(...all.map((p) => p.x));
      const y0 = Math.min(...all.map((p) => p.y)),
        y1 = Math.max(...all.map((p) => p.y));
      for (let py = y0; py < y1; py++)
        for (let px = x0; px < x1; px++) {
          const p = { x: px + 0.5, y: py + 0.5 };
          const near = tiles.some((t) => t.q.some((a, i) => segDist(p, a, t.q[(i + 1) % 4]!) <= 1));
          if (near) continue;
          const hit = tiles.filter((t) => inPoly(p, t.q));
          if (hit.length === 0) continue;
          expect(hit).toHaveLength(1);
          expect(screenToTile(c, p.x, p.y)).toEqual({ x: hit[0]!.x, y: hit[0]!.y });
          checked++;
        }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('AK-ISO-03 ganze Pixel, Schritte in beiden Achsen, geteilte Ecken (Nachfolger AK-A1-05)', () => {
    for (const zoom of ZOOMS) {
      const c = { x: 13.7, y: 5.3, zoom };
      const fl = [Math.floor(32 * zoom), Math.ceil(32 * zoom)];
      const fh = [Math.floor(16 * zoom), Math.ceil(16 * zoom)];
      for (let n = 0; n < 64; n++) {
        const [a, ax] = [tileCorners(c, n, 0), tileCorners(c, n + 1, 0)];
        const [b, by] = [tileCorners(c, 0, n), tileCorners(c, 0, n + 1)];
        for (const p of [...a, ...ax, ...b, ...by])
          expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
        expect(fl).toContain(ax[0].x - a[0].x);
        expect(fh).toContain(ax[0].y - a[0].y);
        expect(ax[0]).toEqual(a[1]); // geteilte Ecke
        expect(fl).toContain(b[0].x - by[0].x);
        expect(fh).toContain(by[0].y - b[0].y);
        expect(by[0]).toEqual(b[3]);
      }
    }
  });
});

describe('Iso-Kamera: Klemmen, Zoom, Zentrieren', () => {
  it('AK-ISO-04 clampToMap: Mittelpunkt in [0, w] × [0, h], vier Ecken erreichbar, 64 × 64 und 48 × 64', () => {
    for (const map of MAPS)
      for (const zoom of [0.5, 1, 2]) {
        const centerOf = (c: Camera): Pt => screenToTileF(c, VIEW.w / 2, VIEW.h / 2);
        for (const [x, y] of [
          [-5000, -5000],
          [5000, 5000],
          [-5000, 5000],
          [5000, -5000],
          [0, 0],
        ] as const) {
          const c = { x, y, zoom };
          clampToMap(c, map, VIEW.w, VIEW.h);
          const m = centerOf(c);
          expect(m.x).toBeGreaterThanOrEqual(-1e-9);
          expect(m.x).toBeLessThanOrEqual(map.w + 1e-9);
          expect(m.y).toBeGreaterThanOrEqual(-1e-9);
          expect(m.y).toBeLessThanOrEqual(map.h + 1e-9);
        }
        for (const [fx, fy] of [
          [0, 0],
          [map.w, 0],
          [0, map.h],
          [map.w, map.h],
        ] as const) {
          const c = { x: 0, y: 0, zoom };
          centerOn(c, fx, fy, VIEW, map);
          const m = centerOf(c);
          expect(m.x).toBeCloseTo(fx, 6);
          expect(m.y).toBeCloseTo(fy, 6);
        }
      }
  });

  it('AK-ISO-04 zoomAt hält den Weltpunkt unter dem Cursor (±1 px), 20 × hinein = 2, 40 × hinaus = ZOOM_STEPS[0] (0,125 seit M12 E1), nie NaN', () => {
    for (const map of MAPS) {
      const c = { x: 0, y: 0, zoom: 1 };
      centerOn(c, map.w / 2, map.h / 2, VIEW, map);
      const [sx, sy] = [500, 300];
      for (const f of [1.1, 1.25, 1 / 1.1]) {
        const before = screenToWorld(c, sx, sy);
        zoomAt(c, f, sx, sy, VIEW, map);
        const after = worldToScreen(c, before);
        expect(Math.abs(after.x - sx)).toBeLessThanOrEqual(1);
        expect(Math.abs(after.y - sy)).toBeLessThanOrEqual(1);
      }
      for (let i = 0; i < 20; i++) zoomAt(c, 1.25, sx, sy, VIEW, map);
      expect(c.zoom).toBe(2);
      for (let i = 0; i < 40; i++) zoomAt(c, 0.8, sx, sy, VIEW, map);
      expect(c.zoom).toBe(ZOOM_STEPS[0]);
      for (const v of [c.x, c.y, c.zoom]) expect(Number.isFinite(v)).toBe(true);
      zoomAt(c, NaN, sx, sy, VIEW, map);
      for (const v of [c.x, c.y, c.zoom]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('AK-ISO-04 centerOn legt den Kachelpunkt in die Bildmitte (±1 px)', () => {
    for (const map of MAPS)
      for (const zoom of [0.5, 1, 2]) {
        const c = { x: 0, y: 0, zoom };
        for (const [fx, fy] of [
          [map.w / 2, map.h / 2],
          [20.25, 30.75],
        ] as const) {
          centerOn(c, fx, fy, VIEW, map);
          const s = worldToScreen(c, project(fx, fy));
          expect(Math.abs(s.x - VIEW.w / 2)).toBeLessThanOrEqual(1);
          expect(Math.abs(s.y - VIEW.h / 2)).toBeLessThanOrEqual(1);
        }
      }
  });

  it('AK-ISO-03 groundMatrix bildet Texturpixel auf die Raute ab (Ecken der Kachel)', () => {
    const c = { x: 13.7, y: 5.3, zoom: 1.5 };
    const [a, b, cc, d, e, f] = groundMatrix(c, 32);
    const map = (u: number, v: number): Pt => ({ x: a * u + cc * v + e, y: b * u + d * v + f });
    for (const [tx, ty] of [
      [0, 0],
      [3, 7],
    ] as const) {
      const exp = worldToScreen(c, project(tx + 1, ty));
      const got = map((tx + 1) * 32, ty * 32);
      expect(got.x).toBeCloseTo(exp.x, 6);
      expect(got.y).toBeCloseTo(exp.y, 6);
    }
  });
});

/** Konvexes Polygon schneidet Rechteck (SAT). */
function intersectsRect(
  poly: Pt[],
  r: { x0: number; y0: number; x1: number; y1: number },
): boolean {
  const rect: Pt[] = [
    { x: r.x0, y: r.y0 },
    { x: r.x1, y: r.y0 },
    { x: r.x1, y: r.y1 },
    { x: r.x0, y: r.y1 },
  ];
  const axes: Pt[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!,
      b = poly[(i + 1) % poly.length]!;
    axes.push({ x: -(b.y - a.y), y: b.x - a.x });
  }
  for (const ax of axes) {
    const pr = (q: Pt[]): [number, number] => {
      const v = q.map((p) => p.x * ax.x + p.y * ax.y);
      return [Math.min(...v), Math.max(...v)];
    };
    const [a0, a1] = pr(poly),
      [b0, b1] = pr(rect);
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}

describe('Iso-Kamera: Culling', () => {
  it('AK-ISO-05 visibleTileRange enthält jede Kachel, deren Raute samt H_TOWER das Bild schneidet', () => {
    for (const map of MAPS)
      for (const zoom of [0.5, 1, 2])
        for (const kind of ['mitte', 'versetzt', 'ecke'] as const) {
          const c = { x: 0, y: 0, zoom };
          if (kind === 'mitte') centerOn(c, map.w / 2, map.h / 2, VIEW, map);
          else if (kind === 'versetzt') centerOn(c, map.w * 0.3, map.h * 0.7, VIEW, map);
          else centerOn(c, map.w, map.h, VIEW, map); // geklemmt an der Ecke
          const range = visibleTileRange(c, VIEW, map);
          expect(range.x0).toBeGreaterThanOrEqual(0);
          expect(range.y0).toBeGreaterThanOrEqual(0);
          expect(range.x1).toBeLessThanOrEqual(map.w - 1);
          expect(range.y1).toBeLessThanOrEqual(map.h - 1);
          const view = {
            x0: c.x,
            y0: c.y,
            x1: c.x + VIEW.w / zoom,
            y1: c.y + VIEW.h / zoom,
          };
          let visible = 0;
          for (let y = 0; y < map.h; y++)
            for (let x = 0; x < map.w; x++) {
              const t = project(x, y),
                r = project(x + 1, y),
                b = project(x + 1, y + 1),
                l = project(x, y + 1);
              const up = (p: Pt): Pt => ({ x: p.x, y: p.y - H_TOWER });
              const hull = [up(t), up(r), r, b, l, up(l)];
              if (!intersectsRect(hull, view)) continue;
              visible++;
              const inside = x >= range.x0 && x <= range.x1 && y >= range.y0 && y <= range.y1;
              expect(inside, `${kind} z${zoom} ${map.w}x${map.h} (${x},${y})`).toBe(true);
            }
          expect(visible).toBeGreaterThan(0);
        }
  });
});

describe('Iso-Kamera: Bau-Anker', () => {
  it('AK-ISO-09 footprintOrigin: 1 × 1 = screenToTile; 2 × 2 enthält den Cursor, ≤ ½ Kachel zur Mitte; Rand ohne Fehler', () => {
    for (const zoom of [0.5, 1, 2]) {
      const c = camAt(zoom, OFFSETS[1]!);
      for (let sy = 0; sy < 720; sy += 17)
        for (let sx = 0; sx < 1280; sx += 23) {
          const f = screenToTileF(c, sx, sy);
          expect(footprintOrigin(f.x, f.y, 1, 1)).toEqual(screenToTile(c, sx, sy));
          const o = footprintOrigin(f.x, f.y, 2, 2);
          expect(f.x).toBeGreaterThanOrEqual(o.x);
          expect(f.x).toBeLessThan(o.x + 2);
          expect(f.y).toBeGreaterThanOrEqual(o.y);
          expect(f.y).toBeLessThan(o.y + 2);
          expect(Math.abs(f.x - (o.x + 1))).toBeLessThanOrEqual(0.5 + 1e-9);
          expect(Math.abs(f.y - (o.y + 1))).toBeLessThanOrEqual(0.5 + 1e-9);
        }
    }
    // Kartenrand: Ursprünge mit Teilen ausserhalb, ohne Fehler
    expect(footprintOrigin(0.2, 0.2, 2, 2)).toEqual({ x: -1, y: -1 });
    expect(footprintOrigin(63.9, 63.9, 2, 2)).toEqual({ x: 63, y: 63 });
    expect(() => footprintOrigin(-3, 70, 3, 3)).not.toThrow();
  });
});

describe('M12 E1 Zoom 0,125 und clampToRect', () => {
  it('AK-E1-13 ZOOM_STEPS[0] = 0,125; zehnmal hinaus = 0,125', () => {
    expect(ZOOM_STEPS[0]).toBe(0.125);
    const c: Camera = { x: 0, y: 0, zoom: 1 };
    for (let i = 0; i < 10; i++) zoomAt(c, 0.5, 600, 300, VIEW, { w: 64, h: 64 });
    expect(c.zoom).toBe(0.125);
  });
  it('AK-E1-13 clampToMap gleich clampToRect mit {0,0,w,h}', () => {
    const map = { w: 64, h: 48 };
    for (let i = 0; i < 20; i++) {
      const a: Camera = { x: -2000 + i * 230, y: -900 + i * 120, zoom: ZOOMS[i % ZOOMS.length]! };
      const b = { ...a };
      clampToMap(a, map, VIEW.w, VIEW.h);
      clampToRect(b, { x0: 0, y0: 0, x1: map.w, y1: map.h }, VIEW.w, VIEW.h);
      expect(b).toEqual(a);
    }
  });
  it('zoomAt akzeptiert ein TileRect', () => {
    const c: Camera = { x: 0, y: 0, zoom: 1 };
    zoomAt(c, 0.5, 600, 300, VIEW, { x0: -8, y0: -8, x1: 120, y1: 140 });
    expect(c.zoom).toBe(0.5);
  });
});
