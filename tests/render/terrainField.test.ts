import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { ISO_H, ISO_W, project } from '../../src/render/iso';
import {
  COAST_BAND,
  EDGE_BAND,
  WARP,
  coastField,
  depthAt,
  sampleField,
  terrainAt,
  terrainFields,
  warp,
} from '../../src/render/terrainField';

const mini = (rows: string[]) => ({
  // w = Wasser, s = Sand, g = Gras, f = Wald, m = Fels
  width: rows[0]!.length,
  height: rows.length,
  seed: 7,
  tiles: rows
    .join('')
    .split('')
    .map((c) => ({
      terrain: ({ w: 'water', s: 'sand', g: 'grass', f: 'forest', m: 'mountain' } as const)[
        c as 'w'
      ]!,
      buildingId: null,
      road: false,
    })),
});

/** AK-R1-02: 8×8-Raster je Kachel, ≥ 48 von 64 Punkten eigener Typ, Abweichungen nur im Randband ¼. */
function checkTiles(world: ReturnType<typeof mini> | ReturnType<typeof createWorld>) {
  const f = terrainFields(world);
  for (let y = 0; y < world.height; y++)
    for (let x = 0; x < world.width; x++) {
      const own = world.tiles[y * world.width + x]!.terrain;
      let hits = 0;
      for (let j = 0; j < 8; j++)
        for (let i = 0; i < 8; i++) {
          const u = (i + 0.5) / 8,
            v = (j + 0.5) / 8;
          if (terrainAt(f, x + u, y + v) === own) hits++;
          else expect(Math.min(u, 1 - u, v, 1 - v), `Kachel ${x},${y}`).toBeLessThan(0.25);
        }
      expect(hits, `Kachel ${x},${y}`).toBeGreaterThanOrEqual(48);
    }
}

describe('Küstenfeld', () => {
  it('AK-R1-01 coastField ist deterministisch, Land > 0, Wasser < 0, Küstenland in (0, 1]', () => {
    const w = createWorld(3);
    const a = coastField(w),
      b = coastField(w);
    expect(Array.from(a.v)).toEqual(Array.from(b.v));
    let coastLand = 0;
    w.tiles.forEach((t, i) => {
      const s = a.v[i]!;
      if (t.terrain === 'water') expect(s).toBeLessThan(0);
      else expect(s).toBeGreaterThan(0);
      if (t.terrain !== 'water') {
        const x = i % w.width,
          y = (i / w.width) | 0;
        let touches = false;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w.width || ny >= w.height) continue;
            if (w.tiles[ny * w.width + nx]!.terrain === 'water') touches = true;
          }
        if (touches) {
          coastLand++;
          expect(s).toBeGreaterThan(0);
          expect(s).toBeLessThanOrEqual(1);
        }
      }
    });
    expect(coastLand).toBeGreaterThan(0);
  });

  it('AK-R1-08 I1 (lead-art-Ersatzmass, I1-Neufassung bei L0 beantragt) Eckenschnitt und Welligkeit der Küste', () => {
    const cuts: number[] = [];
    const wave: number[] = [];
    const quote: number[] = [];
    for (const seed of [3, 1, 42, 12588]) {
      const w = createWorld(seed);
      const f = terrainFields(w);
      const land = (x: number, y: number) => {
        const t = w.tiles[y * w.width + x];
        return (
          t !== undefined &&
          t.terrain !== 'water' &&
          x >= 0 &&
          y >= 0 &&
          x < w.width &&
          y < w.height
        );
      };
      const wat = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < w.width && y < w.height && !land(x, y);
      for (let y = 2; y < w.height - 2; y++)
        for (let x = 2; x < w.width - 2; x++) {
          if (!land(x, y)) continue;
          // konvexe Ecke: Wasser an zwei Seiten und der Diagonale, Land dahinter
          for (const a of [-1, 1])
            for (const b of [-1, 1]) {
              if (!(wat(x + a, y) && wat(x, y + b) && wat(x + a, y + b))) continue;
              if (!(land(x - a, y) && land(x, y - b) && land(x - a, y - b))) continue;
              const px = x + (a > 0 ? 1 : 0),
                py = y + (b > 0 ? 1 : 0);
              let d = 0.7;
              for (let s = 0; s <= 0.7; s += 0.004)
                if (
                  terrainAt(f, px - (a * s) / Math.SQRT2, py - (b * s) / Math.SQRT2) !== 'water'
                ) {
                  d = s;
                  break;
                }
              cuts.push(d);
            }
          // gerade Küstenkante in allen vier Richtungen: Dreierlauf entlang der Kante
          for (const [nx, ny] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            const ux = ny !== 0 ? 1 : 0,
              uy = nx !== 0 ? 1 : 0;
            const ok = [-1, 0, 1].every(
              (k) => land(x + ux * k, y + uy * k) && wat(x + ux * k + nx, y + uy * k + ny),
            );
            if (!ok) continue;
            const off = (t: number): number => {
              for (let s = 0; s < 1.2; s += 0.004)
                if (terrainAt(f, x + 0.5 + nx * s + ux * t, y + 0.5 + ny * s + uy * t) === 'water')
                  return s - 0.5;
              return 0.7;
            };
            const offs: number[] = [];
            for (let t = -1.1; t <= 1.1; t += 0.05) offs.push(off(t));
            const iso = (v: number) => Math.abs(v) * Math.hypot(ISO_W / 2, ISO_H / 2);
            wave.push((Math.max(...offs) - Math.min(...offs)) * Math.hypot(ISO_W / 2, ISO_H / 2));
            quote.push(iso(off(0)) >= 2 ? 1 : 0);
          }
        }
    }
    const median = (v: number[]) => [...v].sort((p, q) => p - q)[Math.floor(v.length / 2)]!;
    expect(cuts.length).toBeGreaterThan(20);
    expect(wave.length).toBeGreaterThan(20);
    // Eckenschnitt in Kacheln entlang der Diagonale, Welligkeit in Iso-Pixeln (Zoom 1, über project-Mass)
    const kx = project(1, 0);
    expect(Math.hypot(kx.x, kx.y)).toBeCloseTo(Math.hypot(ISO_W / 2, ISO_H / 2), 9);
    console.info(
      `[I1] Eckenschnitt-Median ${median(cuts).toFixed(3)} Kachel (n=${cuts.length}), Welligkeit-Median ${median(wave).toFixed(2)} px (n=${wave.length}), Wortlaut-Quote ≥ 2 px ${(quote.reduce((p, q) => p + q, 0) / quote.length).toFixed(2)}`,
    );
    expect(median(cuts)).toBeGreaterThanOrEqual(0.19);
    expect(median(wave)).toBeGreaterThanOrEqual(2);
  });

  it('AK-R1-01 warp verschiebt höchstens um WARP je Achse', () => {
    for (let i = 0; i < 300; i++) {
      const fx = i * 0.37,
        fy = i * 0.91;
      const [wx, wy] = warp(3, fx, fy);
      expect(Math.abs(wx - fx)).toBeLessThanOrEqual(WARP + 1e-9);
      expect(Math.abs(wy - fy)).toBeLessThanOrEqual(WARP + 1e-9);
    }
    expect(EDGE_BAND).toBeGreaterThanOrEqual(0.15);
    expect(EDGE_BAND).toBeLessThanOrEqual(COAST_BAND);
  });

  it('AK-R1-01 sampleField klemmt am Kartenrand und depthAt ist ≥ 0', () => {
    const w = createWorld(3);
    const f = terrainFields(w);
    for (const [x, y] of [
      [-5, -5],
      [0, 0],
      [w.width + 5, w.height + 5],
      [w.width / 2, 0.01],
    ] as const) {
      expect(Number.isFinite(sampleField(f.coast, x, y, EDGE_BAND))).toBe(true);
      expect(depthAt(f, x, y)).toBeGreaterThanOrEqual(0);
    }
  });

  it('AK-R1-02 Karte 3: jede Kachel zeigt ihren Typ auf ≥ 75 %, Abweichung ≤ ¼ Kachel', () =>
    checkTiles(createWorld(3)));
  it('AK-R1-02 weitere Seeds (1, 42, 12588, 5, 7, 9, 100)', () => {
    for (const seed of [1, 42, 12588, 5, 7, 9, 100]) checkTiles(createWorld(seed));
  });
  it('RF-1a Karte ohne Wasser', () => checkTiles(mini(['ggg', 'gfg', 'ggg'])));
  it('RF-1b Karte ohne Land (keine Infinity/NaN)', () => {
    const w = mini(['www', 'www']);
    expect(Array.from(coastField(w).v).every(Number.isFinite)).toBe(true);
    checkTiles(w);
    const f = terrainFields(w);
    expect(Number.isFinite(depthAt(f, 1.5, 1))).toBe(true);
  });
  it('RF-1c einzelne Landkachel', () =>
    checkTiles(mini(['wwwww', 'wwwww', 'wwsww', 'wwwww', 'wwwww'])));
  it('RF-1d einzelne Wasserkachel im Land', () => {
    const w = mini(['ggggg', 'ggggg', 'ggwgg', 'ggggg', 'ggggg']);
    expect(Array.from(coastField(w).v).every(Number.isFinite)).toBe(true);
    checkTiles(w);
  });
});
