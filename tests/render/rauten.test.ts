import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { fieldWorld } from '../../src/render/terrainField';
import {
  buildGrid,
  paintPixels,
  patchGrid,
  terrainCodes,
  terrainPatchRect,
  duneToneAtNode,
  landSharesAtNode,
  RASTER,
  sampleNode,
  type TerrainGrid,
} from '../../src/render/terrain';
import { TEX } from '../../src/render/iso';
import { LAND, terrainFields } from '../../src/render/terrainField';
import { forceRect } from '../sim/helpers';

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
      // Proxy: Stufe = gerundeter Dünen-Tonwert, Paritätswechsel = Stufenkante (die echte Stufung `toneStep` hat zusätzlich
      // eine 1-2 px breite Weichkante, die an der Lage der Kante nichts ändert)
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

function measureOn(world: ReturnType<typeof createWorld>, g: TerrainGrid, kind: Kind) {
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

const KINDS: Kind[] = ['sand', 'wald', 'stufe'];
type Measure = ReturnType<typeof measureOn>;
// Zeit-Reserve (R363): Welt, Raster und Messung je Seed und Kantenart werden einmal in `beforeAll` aufgebaut; die Tests
// prüfen nur noch die Schwellen. Die Messung bleibt unverändert (gleiche Fenster, gleiche Schwellen, `sampleNode`).
const GRIDS = new Map<number, { world: ReturnType<typeof createWorld>; g: TerrainGrid }>();
const MEASURES = new Map<string, Measure>();
const measure = (kind: Kind, seed: number): Measure => MEASURES.get(`${kind}${seed}`)!;
/** Herleitung: Aufbau lokal ≈ 2 s (Lauf der Datei 3,2 s); Runner-Faktor 3 und Reserve 50 % ⇒ ≥ 12 s, gesetzt 30 s. */
const SETUP_TIMEOUT = 30_000;

// Warum die Schwellen für wald/stufe in aa61ae5 von je-Seed auf gemeinsam über 3 Seeds wechselten: die Vorher-Werte
// streuen je Seed stark (Wald 0,12 bis 0,21), eine je-Seed-Schwelle bei 70 % des kleinsten Werts hätte nur Rauschen
// geprüft; Sand streut wenig und bleibt je Seed.
// Schwellen, gemessen am unveränderten Code (Stand 9cc3546, Seeds 1, 2, 7), Schwelle = 70 % des Ist (mind. 30 % Reserve).
// Ist longFrac: sand 0,817/0,751/0,700 (je Seed geprüft), meanRun 5,99/4,99/4,50;
// wald 0,120/0,214/0,126 und stufe 0,128/0,374/0,149 schwanken je Seed stark, darum über die drei Seeds nach Kantenschritten
// gewichtet gemittelt: wald 0,1535, stufe 0,200.
const MAX_SAND_LONG_FRAC = 0.49;
const MAX_SAND_MEAN_RUN = 3.15;
const MAX_AGG_LONG_FRAC = { wald: 0.107, stufe: 0.14 } as const;

describe('ART-WALD-RAUTEN Rauten-Metrik', () => {
  beforeAll(() => {
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      const g = buildGrid(fieldWorld(world));
      GRIDS.set(seed, { world, g });
      for (const kind of KINDS) MEASURES.set(`${kind}${seed}`, measureOn(world, g, kind));
    }
  }, SETUP_TIMEOUT);

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
    // frischer Aufbau (Welt + Raster) gegen die Messung aus `beforeAll`: ein Seed, eine Kantenart
    const world = createWorld(1);
    expect(measureOn(world, buildGrid(fieldWorld(world)), 'wald')).toEqual(measure('wald', 1));
  });

  it('AK-T02c sampleNode: deterministisch je Seed, Verschiebung höchstens 3 Texturpixel', () => {
    const g = GRIDS.get(1)!.g;
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

  let patchA: ReturnType<typeof paintPixels> | undefined,
    patchB: ReturnType<typeof paintPixels> | undefined;
  // Aufbau und Malen in `beforeAll` (R363, Zeit-Reserve: Welt, zwei Raster und Malen ≈ 0,9 s lokal); Timeout wie SETUP_TIMEOUT.
  beforeAll(() => {
    const w = createWorld(1, { unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 4, 3, 'forest');
    const fields = terrainFields(fieldWorld(w));
    const grid = buildGrid(fieldWorld(w), fields);
    const prev = terrainCodes(fieldWorld(w));
    home(w).tiles[(k.y + 3) * home(w).width + k.x + 7]!.terrain = 'grass';
    const next = terrainCodes(fieldWorld(w));
    const rect = terrainPatchRect(prev, next, home(w).width, home(w).height)!;
    patchGrid(fieldWorld(w), fields, grid, prev, next, rect);
    const full = buildGrid(fieldWorld(w));
    const x0 = rect.x0 * TEX,
      y0 = rect.y0 * TEX,
      pw = (rect.x1 - rect.x0 + 1) * TEX,
      ph = (rect.y1 - rect.y0 + 1) * TEX;
    patchA = paintPixels(grid, 1, x0, y0, pw, ph);
    patchB = paintPixels(full, 1, x0, y0, pw, ph);
  }, SETUP_TIMEOUT);

  it('AK-T02c Patch vs. Vollaufbau: gleiche Pixel im Überlapp (mit Verwerfung, Seed 1)', () => {
    const a = patchA!,
      b = patchB!;
    expect(a.length).toBe(b.length);
    expect(a.every((v, i) => v === b[i])).toBe(true);
  });
});
