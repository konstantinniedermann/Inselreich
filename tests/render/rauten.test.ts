import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { fieldWorld } from '../../src/render/terrainField';
import {
  buildGrid,
  duneToneAtNode,
  landSharesAtNode,
  RASTER,
  sampleNode,
  type TerrainGrid,
} from '../../src/render/terrain';
import { TEX } from '../../src/render/iso';
import { LAND } from '../../src/render/terrainField';

// ART-WALD-RAUTEN T01: Rautigkeits-Metrik auf Pixelauflösung. Gemessen wird dieselbe Abtastung wie in `paintPixels`
// (`sampleNode`), danach die Schwelle (Anteil 0,5) bzw. die Sand-Stufe.

const FOREST = LAND.indexOf('forest');
const SAND = LAND.indexOf('sand');
const SEEDS = [1, 2, 7];
const WIN = 6; // Fenster in Kacheln
const MAX_WINDOWS = 5;

type Kind = 'wald' | 'sand' | 'stufe';

/** Fenster (Kachel-Ursprung), in denen die beiden Typen der Kantenart aneinander grenzen. */
function windows(world: ReturnType<typeof createWorld>, a: string, b: string): [number, number][] {
  const isl = home(world);
  const out: [number, number][] = [];
  for (let y = 1; y < isl.height - WIN; y += 2)
    for (let x = 1; x < isl.width - WIN; x += 2) {
      if (out.some(([ox, oy]) => Math.abs(ox - x) < WIN + 2 && Math.abs(oy - y) < WIN + 2))
        continue;
      let hasA = 0,
        hasB = 0;
      for (let j = 0; j < WIN; j++)
        for (let i = 0; i < WIN; i++) {
          const t = isl.tiles[(y + j) * isl.width + x + i]!.terrain;
          if (t === a) hasA++;
          if (t === b) hasB++;
        }
      if (hasA >= 8 && hasB >= 8) out.push([x, y]);
      if (out.length >= MAX_WINDOWS) return out;
    }
  return out;
}

/** Binärbild der Kantenart in einem Fenster (Pixel = Texturpixel). */
function binary(g: TerrainGrid, kind: Kind, x0: number, y0: number): Uint8Array {
  const n = WIN * TEX;
  const bin = new Uint8Array(n * n);
  const node = [0, 0];
  for (let py = 0; py < n; py++)
    for (let px = 0; px < n; px++) {
      sampleNode(g, x0 * TEX + px + 0.5, y0 * TEX + py + 0.5, node);
      if (kind === 'stufe')
        bin[py * n + px] = Math.round(duneToneAtNode(g, node[0]!, node[1]!)) & 1;
      else {
        const s = landSharesAtNode(g, node[0]!, node[1]!);
        bin[py * n + px] = s[kind === 'wald' ? FOREST : SAND]! >= 0.5 ? 1 : 0;
      }
    }
  return bin;
}

/** Mittlere Länge gerader Kantenstücke und Anteil der Kantenschritte in Stücken ab `LONG` Pixeln. */
const LONG = 6;
function straightness(bin: Uint8Array): { steps: number; meanRun: number; longFrac: number } {
  const n = WIN * TEX;
  let steps = 0,
    runs = 0,
    long = 0;
  const scan = (vertical: boolean): void => {
    for (let u = 0; u < n - 1; u++) {
      let run = 0;
      for (let v = 0; v <= n; v++) {
        const edge =
          v < n &&
          (vertical
            ? bin[v * n + u] !== bin[v * n + u + 1]
            : bin[u * n + v] !== bin[(u + 1) * n + v]);
        if (edge) run++;
        else if (run > 0) {
          steps += run;
          runs++;
          if (run >= LONG) long += run;
          run = 0;
        }
      }
    }
  };
  scan(true);
  scan(false);
  return { steps, meanRun: runs ? steps / runs : 0, longFrac: steps ? long / steps : 0 };
}

function measure(kind: Kind, seed: number) {
  const world = createWorld(seed);
  const g = buildGrid(fieldWorld(world));
  const [a, b] = kind === 'wald' ? ['forest', 'grass'] : ['sand', 'grass'];
  let steps = 0,
    weightedRun = 0,
    long = 0;
  for (const [x, y] of windows(world, a!, b!)) {
    const m = straightness(binary(g, kind, x, y));
    steps += m.steps;
    weightedRun += m.meanRun * m.steps;
    long += m.longFrac * m.steps;
  }
  return { steps, meanRun: steps ? weightedRun / steps : 0, longFrac: steps ? long / steps : 0 };
}

// Schwellen, gemessen am unveränderten Code (Stand 9cc3546, Seeds 1, 2, 7), Schwelle = 70 % des Ist (mind. 30 % Reserve).
// Ist longFrac: sand 0,817/0,751/0,700 (je Seed geprüft), meanRun 5,99/4,99/4,50;
// wald 0,120/0,214/0,126 und stufe 0,128/0,374/0,149 schwanken je Seed stark, darum über die drei Seeds nach Kantenschritten
// gewichtet gemittelt: wald 0,1535, stufe 0,200.
const MAX_SAND_LONG_FRAC = 0.49;
const MAX_SAND_MEAN_RUN = 3.15;
const MAX_AGG_LONG_FRAC = { wald: 0.107, stufe: 0.14 } as const;

describe('ART-WALD-RAUTEN Rauten-Metrik', () => {
  for (const seed of SEEDS) {
    it(`AK-T01 sand Seed ${seed}: wenige lange gerade Kantenstücke`, () => {
      const m = measure('sand', seed);
      expect(m.steps).toBeGreaterThan(200);
      expect(m.longFrac).toBeLessThan(MAX_SAND_LONG_FRAC);
      expect(m.meanRun).toBeLessThan(MAX_SAND_MEAN_RUN);
    });
  }
  for (const kind of ['wald', 'stufe'] as const) {
    it(`AK-T01 ${kind}: Seeds ${SEEDS.join(', ')} gemeinsam, wenige lange gerade Kantenstücke`, () => {
      let steps = 0,
        long = 0;
      for (const seed of SEEDS) {
        const m = measure(kind, seed);
        steps += m.steps;
        long += m.longFrac * m.steps;
      }
      expect(steps).toBeGreaterThan(500);
      expect(long / steps).toBeLessThan(MAX_AGG_LONG_FRAC[kind]);
    });
  }

  it('AK-T01 deterministisch: zwei Messungen gleich', () => {
    expect(measure('wald', 1)).toEqual(measure('wald', 1));
  });

  it('AK-T02c sampleNode: deterministisch je Seed, Verschiebung höchstens 3 Texturpixel', () => {
    const g = buildGrid(fieldWorld(createWorld(1)));
    const a = [0, 0],
      b = [0, 0];
    for (let k = 0; k < 400; k++) {
      const qx = 37.5 + k * 1.37,
        qy = 91.5 + k * 0.71;
      sampleNode(g, qx, qy, a);
      sampleNode(g, qx, qy, b);
      expect(a).toEqual(b);
      expect(Math.abs(a[0]! * RASTER - qx)).toBeLessThanOrEqual(3);
      expect(Math.abs(a[1]! * RASTER - qy)).toBeLessThanOrEqual(3);
    }
  });
});
