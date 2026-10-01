import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { PALETTE, SIGNAL_NAMES, mixHex } from '../../src/render/palette';
import { TEX } from '../../src/render/iso';
import { depthAt, terrainFields } from '../../src/render/terrainField';
import {
  buildGrid,
  dirtyRect,
  occupancy,
  paintPixels,
  shouldPatch,
  terrainLayerSize,
  tuftsFor,
} from '../../src/render/terrain';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
import { forceRect } from '../sim/helpers';

const rgbOfCss = (c: string): [number, number, number] => {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c)!;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};
const labOfCss = (c: string) => rgbToLab(rgbOfCss(c));

/** Ganze Karte bei Faktor 1 als RGBA (Texturpixel). */
function paintAll(world: World) {
  const grid = buildGrid(world);
  const w = world.width * TEX,
    h = world.height * TEX;
  const out = paintPixels(grid, 1, 0, 0, w, h);
  const at = (px: number, py: number): [number, number, number] => {
    const cx = Math.min(w - 1, Math.max(0, Math.floor(px))),
      cy = Math.min(h - 1, Math.max(0, Math.floor(py)));
    const i = (cy * w + cx) * 4;
    return [out[i]!, out[i + 1]!, out[i + 2]!];
  };
  return { grid, out, w, h, at };
}
const world3 = createWorld(3);
const painted = paintAll(world3);
const near = (c: [number, number, number], css: string, tol = 10) =>
  deltaE2000(rgbToLab(c), labOfCss(css)) <= tol;
/** Schaumpixel: dichter an `foam` als an `waterShallow` (der Saum mischt 0,6 `foam` ins Flachwasser). */
const foamish = (c: [number, number, number]): boolean =>
  deltaE2000(rgbToLab(c), hexToLab(PALETTE.foam)) <
  deltaE2000(rgbToLab(c), hexToLab(PALETTE.waterShallow));
/** Mittel eines 3 × 3-Pixel-Felds um (px, py), wie bei den Prüfmerkmalen in Spec 4.4. */
const mean3 = (px: number, py: number): [number, number, number] => {
  const sum = [0, 0, 0];
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const c = painted.at(px + i, py + j);
      sum[0]! += c[0];
      sum[1]! += c[1];
      sum[2]! += c[2];
    }
  return [sum[0]! / 9, sum[1]! / 9, sum[2]! / 9];
};
const terrainOf = (w: World, x: number, y: number) => w.tiles[y * w.width + x]?.terrain;

describe('Terrain-Helfer', () => {
  it('AK-R1-06 dirtyRect liefert die geänderten Kacheln plus 1 Kachel Rand, geklemmt', () => {
    const prev = new Uint8Array(64 * 64),
      next = prev.slice();
    next[10 * 64 + 20] = 1;
    expect(dirtyRect(prev, next, 64, 64)).toEqual({ x0: 19, y0: 9, x1: 21, y1: 11 });
    expect(dirtyRect(prev, prev.slice(), 64, 64)).toBeNull();
    const edge = prev.slice();
    edge[0] = 1;
    expect(dirtyRect(prev, edge, 64, 64)).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 });
    const far = prev.slice();
    far[63 * 64 + 63] = 1;
    far[5 * 64 + 5] = 1;
    expect(dirtyRect(prev, far, 64, 64)).toEqual({ x0: 4, y0: 4, x1: 63, y1: 63 });
  });

  it('AK-R1-06 occupancy markiert Gebäude- und Wegkacheln', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 3, k.y + 3, 4, 2, 'grass');
    w.money = 100000;
    for (const g of Object.keys(w.stock) as (keyof World['stock'])[]) w.stock[g] = 1000;
    const before = occupancy(w);
    expect(before.length).toBe(w.width * w.height);
    expect(before[(k.y + 3) * w.width + k.x + 3]).toBe(0);
    expect(placeBuilding(w, 'house', k.x + 3, k.y + 3).ok).toBe(true);
    expect(placeRoad(w, k.x + 5, k.y + 4).ok).toBe(true);
    const after = occupancy(w);
    expect(after[(k.y + 3) * w.width + k.x + 3]).toBe(1);
    expect(after[(k.y + 4) * w.width + k.x + 5]).toBe(1);
    expect(after[(k.y + 3) * w.width + k.x + 4]).toBe(0);
    // Kontor-Kacheln sind belegt
    expect(after[k.y * w.width + k.x]).toBe(1);
  });

  it('AK-ISO-19 terrainLayerSize: Faktor 1 und 2 sowie halbe Kopie je Canvas ≤ 16 777 216 Pixel', () => {
    for (const scale of [1, 2]) {
      const sizes = terrainLayerSize(createWorld(3), scale);
      expect(sizes.length).toBe(2);
      for (const s of sizes) expect(s.w * s.h).toBeLessThanOrEqual(16777216);
    }
    expect(terrainLayerSize(createWorld(3), 1)[0]).toEqual({ w: 64 * TEX, h: 64 * TEX });
    expect(terrainLayerSize(createWorld(3), 2)[1]).toEqual({ w: 64 * TEX, h: 64 * TEX });
  });

  it('RF-2 shouldPatch: fremde Welt oder gleicher Schlüssel zeichnet nichts teilweise neu', () => {
    const a = createWorld(3),
      b = createWorld(3);
    const meta = { world: a, key: 'k1' };
    expect(shouldPatch(meta, a, 'k1')).toBe(false);
    expect(shouldPatch(meta, a, 'k2')).toBe(true);
    expect(shouldPatch(meta, b, 'k2')).toBe(false);
    expect(shouldPatch(meta, b, 'k1')).toBe(false);
  });

  it('AK-R1-06 tuftsFor ist deterministisch und bleibt in der Kachel', () => {
    let total = 0;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const t = tuftsFor(3, x, y);
        expect(tuftsFor(3, x, y)).toEqual(t);
        total += t.length;
        for (const p of t) {
          expect(p.x).toBeGreaterThanOrEqual(0.1);
          expect(p.x).toBeLessThanOrEqual(0.9);
          expect(p.y).toBeGreaterThanOrEqual(0.1);
          expect(p.y).toBeLessThanOrEqual(0.9);
        }
      }
    expect(total).toBeGreaterThan(0);
  });
});

describe('Terrain-Pixel (reine Rechnung, ohne Canvas)', () => {
  it('AK-R1-06 Aufbau Faktor 1 (Rechenzeit ohne Canvas) ≤ 1500 ms', () => {
    const t0 = performance.now();
    paintAll(createWorld(5));
    expect(performance.now() - t0).toBeLessThan(1500);
  });

  it('AK-R1-08 I1 Küste liegt an ≥ 8 von 10 Küstenkacheln nicht auf der Kachelgrenze (≥ 2 px)', () => {
    const w = world3;
    const cands: { x: number; y: number }[] = [];
    for (let y = 1; y < w.height - 1; y++)
      for (let x = 1; x < w.width - 2; x++)
        if (
          terrainOf(w, x, y) === 'sand' &&
          terrainOf(w, x + 1, y) === 'water' &&
          terrainOf(w, x, y - 1) !== 'water' &&
          terrainOf(w, x, y + 1) !== 'water'
        )
          cands.push({ x, y });
    expect(cands.length).toBeGreaterThanOrEqual(10);
    const step = Math.floor(cands.length / 10);
    let off = 0;
    for (let k = 0; k < 10; k++) {
      const c = cands[k * step]!;
      const py = c.y * TEX + TEX / 2;
      let first = -1;
      for (let px = c.x * TEX; px < (c.x + 2) * TEX; px++) {
        const [r, , b] = painted.at(px, py);
        if (b > r) {
          first = px;
          break;
        }
      }
      expect(first).toBeGreaterThan(-1);
      if (Math.abs(first - (c.x + 1) * TEX) >= 2) off++;
    }
    expect(off).toBeGreaterThanOrEqual(8);
  });

  it('AK-R1-08 I1 Grasfläche 4 × 4 Kacheln zeigt ≥ 3 Farbwerte mit ΔE ≥ 3', () => {
    const w = world3;
    let found = false;
    for (let y = 0; y < w.height - 4 && !found; y++)
      for (let x = 0; x < w.width - 4 && !found; x++) {
        let all = true;
        for (let j = 0; j < 4 && all; j++)
          for (let i = 0; i < 4; i++) if (terrainOf(w, x + i, y + j) !== 'grass') all = false;
        if (!all) continue;
        found = true;
        const labs = [];
        for (let j = 0; j < 4; j++)
          for (let i = 0; i < 4; i++)
            labs.push(rgbToLab(painted.at((x + i + 0.5) * TEX, (y + j + 0.5) * TEX)));
        const distinct: typeof labs = [];
        for (const l of labs) if (distinct.every((d) => deltaE2000(d, l) >= 3)) distinct.push(l);
        expect(distinct.length).toBeGreaterThanOrEqual(3);
      }
    expect(found).toBe(true);
  });

  it('AK-R1-08 I2 Flachwasser ~ waterShallow, Tiefwasser ~ waterDeep, Schaum am Saum', () => {
    const w = world3;
    const f = terrainFields(w);
    let shallow = 0,
      shallowOk = 0,
      deep = 0,
      deepOk = 0,
      foamTiles = 0,
      coastTiles = 0;
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        if (terrainOf(w, x, y) !== 'water') continue;
        const d = depthAt(f, x + 0.5, y + 0.5);
        const c = painted.at((x + 0.5) * TEX, (y + 0.5) * TEX);
        if (d > 0.9 && d < 1.1) {
          shallow++;
          if (near(c, PALETTE.waterShallow)) shallowOk++;
        }
        if (d >= 6) {
          deep++;
          if (near(c, PALETTE.waterDeep)) deepOk++;
        }
        // Küstenwasser: Land in der 4er-Nachbarschaft
        const landN = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => {
          const t = terrainOf(w, x + dx!, y + dy!);
          return t !== undefined && t !== 'water';
        });
        if (!landN) continue;
        coastTiles++;
        let hasFoam = false;
        for (let py = y * TEX - 5; py < (y + 1) * TEX + 5 && !hasFoam; py++)
          for (let px = x * TEX - 5; px < (x + 1) * TEX + 5; px++)
            if (foamish(painted.at(px, py))) {
              hasFoam = true;
              break;
            }
        if (hasFoam) foamTiles++;
      }
    expect(shallow).toBeGreaterThan(0);
    expect(shallowOk / shallow).toBeGreaterThanOrEqual(0.9);
    expect(deep).toBeGreaterThan(0);
    expect(deepOk / deep).toBeGreaterThanOrEqual(0.9);
    expect(coastTiles).toBeGreaterThan(10);
    expect(foamTiles / coastTiles).toBeGreaterThanOrEqual(0.8);
  });

  it('AK-R1-08 I5 Waldboden ohne Kronen, nicht der alte Waldgrund; Fels mit rockLight und rockDark', () => {
    const w = world3;
    const wood = mixHex(PALETTE.grassDark, PALETTE.crown, 0.3);
    let forest = 0,
      edgeCorners = 0,
      oldColor = 0,
      crownPix = 0,
      light = 0,
      dark = 0;
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        const t = terrainOf(w, x, y);
        if (t === 'forest') {
          forest++;
          // Ecke am Waldrand: Nachbarn links, oben und die Diagonale sind kein Wald
          if (
            terrainOf(w, x - 1, y) !== 'forest' &&
            terrainOf(w, x, y - 1) !== 'forest' &&
            terrainOf(w, x - 1, y - 1) !== 'forest'
          ) {
            edgeCorners++;
            if (near(mean3(x * TEX + 1, y * TEX + 1), '#3d7a3a', 10)) oldColor++;
          }
          for (let k = 0; k < 8; k++) {
            const c = painted.at(x * TEX + 4 + k * 3, y * TEX + 4 + k * 3);
            if (near(c, PALETTE.crownLight, 5) && !near(c, wood, 5)) crownPix++;
          }
        } else if (t === 'mountain') {
          for (let py = y * TEX; py < (y + 1) * TEX; py += 2)
            for (let px = x * TEX; px < (x + 1) * TEX; px += 2) {
              const c = painted.at(px, py);
              if (near(c, PALETTE.rockLight)) light++;
              if (near(c, PALETTE.rockDark)) dark++;
            }
        }
      }
    expect(forest).toBeGreaterThan(0);
    expect(edgeCorners).toBeGreaterThan(0);
    // Warp schiebt den Waldrand bis 0,12 Kachel nach aussen; an der Mehrheit der Ecken liegt Gras
    expect(oldColor / edgeCorners).toBeLessThanOrEqual(0.5);
    expect(crownPix).toBe(0);
    expect(light).toBeGreaterThan(0);
    expect(dark).toBeGreaterThan(0);
  });

  it('AK-R1-03 keine Signalfarbe in der Terrain-Ebene (Stichprobe über die ganze Karte)', () => {
    const labs = SIGNAL_NAMES.map((n) => hexToLab(PALETTE[n]));
    for (let py = 0; py < painted.h; py += 13)
      for (let px = 0; px < painted.w; px += 13) {
        const l = rgbToLab(painted.at(px, py));
        for (const s of labs) expect(deltaE2000(l, s)).toBeGreaterThan(5);
      }
  });

  it('AK-R1-06 paintPixels ist deterministisch und Faktor 2 liefert vierfache Pixelzahl', () => {
    const g = painted.grid;
    const a = paintPixels(g, 1, 100, 100, 16, 16);
    const b = paintPixels(g, 1, 100, 100, 16, 16);
    expect(Array.from(a)).toEqual(Array.from(b));
    const c = paintPixels(g, 2, 200, 200, 32, 32);
    expect(c.length).toBe(32 * 32 * 4);
    expect(a.every((v) => v >= 0 && v <= 255)).toBe(true);
  });
});
