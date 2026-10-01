import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import {
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

  it('AK-R1-01 warp verschiebt höchstens um WARP je Achse', () => {
    for (let i = 0; i < 300; i++) {
      const fx = i * 0.37,
        fy = i * 0.91;
      const [wx, wy] = warp(3, fx, fy);
      expect(Math.abs(wx - fx)).toBeLessThanOrEqual(WARP + 1e-9);
      expect(Math.abs(wy - fy)).toBeLessThanOrEqual(WARP + 1e-9);
    }
    expect(EDGE_BAND).toBeGreaterThanOrEqual(0.15);
    expect(EDGE_BAND).toBeLessThanOrEqual(0.25);
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
  it('AK-R1-02 weitere Seeds', () => {
    checkTiles(createWorld(1));
    checkTiles(createWorld(42));
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
