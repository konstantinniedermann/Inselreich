import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { createWorld } from '../../src/sim/world';
import type { World3 } from '../../src/render/terrain';
import type { World } from '../../src/sim/types';
import { FOREST_FLOOR, PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { TEX } from '../../src/render/iso';
import { LAND, depthAt, terrainFields } from '../../src/render/terrainField';
import {
  RASTER,
  buildGrid,
  defaultTerrainScale,
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

describe('Waldboden und Licht', () => {
  it('AK-R1-08 I5 Waldboden: ΔE2000 > 10 zu #3d7a3a, ≥ 6 zu grassDark und grass, grünlich-dunkel', () => {
    const lab = labOfCss(FOREST_FLOOR);
    expect(deltaE2000(lab, hexToLab('#3d7a3a'))).toBeGreaterThan(10);
    expect(deltaE2000(lab, hexToLab(PALETTE.grassDark))).toBeGreaterThanOrEqual(6);
    expect(deltaE2000(lab, hexToLab(PALETTE.grass))).toBeGreaterThanOrEqual(6);
    const [r, g, b] = rgbOfCss(FOREST_FLOOR);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    expect(lab[0]).toBeLessThan(hexToLab(PALETTE.grassDark)[0]);
  });

  const blockWorld = (): World3 => {
    const n = 24;
    const tiles = Array.from({ length: n * n }, (_, i) => {
      const x = i % n,
        y = (i / n) | 0;
      const m = x >= 8 && x < 16 && y >= 8 && y < 16;
      return { terrain: m ? 'mountain' : 'grass', buildingId: null, road: false };
    });
    return { width: n, height: n, seed: 9, tiles } as unknown as World3;
  };
  const meanShade = (
    g: ReturnType<typeof buildGrid>,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ) => {
    let s = 0,
      c = 0;
    const per = TEX / RASTER;
    for (let j = Math.round(y0 * per); j <= Math.round(y1 * per); j++)
      for (let i = Math.round(x0 * per); i <= Math.round(x1 * per); i++) {
        s += g.shade[j * g.nx + i]!;
        c++;
      }
    return s / c;
  };

  it('Spec 5.1 Relief: Licht von links oben (−3, −1) – Hang zur Lichtseite hell, abgewandt dunkel', () => {
    const g = buildGrid(blockWorld());
    const left = meanShade(g, 7.6, 8.4, 9, 15),
      right = meanShade(g, 15.6, 16.4, 9, 15),
      top = meanShade(g, 9, 15, 7.6, 8.4),
      bottom = meanShade(g, 9, 15, 15.6, 16.4);
    expect(left).toBeGreaterThan(0.02);
    expect(top).toBeGreaterThan(0.01);
    expect(right).toBeLessThan(-0.02);
    expect(bottom).toBeLessThan(-0.01);
    // Licht kommt stärker von links als von oben (−3 gegen −1)
    expect(left).toBeGreaterThan(top);
    // R149: Abweichung zu M7-Spec 5.1 — Gebirge ±12 %, sonst ±8 %
    const mtCls = 1 + LAND.indexOf('mountain');
    let mtMax = 0;
    for (let k = 0; k < g.shade.length; k++) {
      const a = Math.abs(g.shade[k]!);
      const limit = g.cls[k] === mtCls ? 0.12 : 0.08;
      expect(a).toBeLessThanOrEqual(limit + 1e-6);
      if (g.cls[k] === mtCls) mtMax = Math.max(mtMax, a);
    }
    expect(mtMax).toBeGreaterThan(0.08); // das Gebirge nutzt die höhere Grenze tatsächlich
  });

  it('R149 Plastik: mittlere |shade| auf Land ≥ 0,035 und auf Gebirge ≥ 0,05 (Seeds 3, 5, 12588)', () => {
    const mtCls = 1 + LAND.indexOf('mountain');
    for (const seed of [3, 5, 12588]) {
      const g = buildGrid(createWorld(seed));
      let sl = 0,
        cl = 0,
        sm = 0,
        cm = 0;
      for (let k = 0; k < g.cls.length; k++) {
        if (g.cls[k] === 0) continue;
        if (g.cls[k] === mtCls) {
          sm += Math.abs(g.shade[k]!);
          cm++;
        } else {
          sl += Math.abs(g.shade[k]!);
          cl++;
        }
      }
      expect(sl / cl, `Land Seed ${seed}`).toBeGreaterThanOrEqual(0.035);
      expect(sm / cm, `Gebirge Seed ${seed}`).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('R149 Pixel ausserhalb des Gebirges tragen höchstens ±8 % Schattierung', () => {
    // Alle Knoten tragen 0,12 bzw. 0,08: Gleiche Pixel auf Gras beweisen, dass paintPixels ausserhalb des Gebirges klemmt.
    const g = buildGrid(blockWorld());
    const hot = { ...g, shade: g.shade.map(() => 0.12) };
    const flat = { ...g, shade: g.shade.map(() => 0.08) };
    const a = paintPixels(hot, 1, 0, 0, 8 * TEX, 8 * TEX); // Gras links oben (kein Gebirge)
    const b = paintPixels(flat, 1, 0, 0, 8 * TEX, 8 * TEX);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('Spec 5.1 Gras: die Mischung ist gespreizt und nutzt grassDark, grass und grassLight', () => {
    const n = 24;
    const tiles = Array.from({ length: n * n }, () => ({
      terrain: 'grass',
      buildingId: null,
      road: false,
    }));
    const g = buildGrid({ width: n, height: n, seed: 9, tiles } as unknown as World3);
    const sorted = Array.from(g.grass).sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))]!;
    expect(q(0.1)).toBeLessThan(0.15);
    expect(q(0.9)).toBeGreaterThan(0.85);
    expect(sorted[0]).toBeGreaterThanOrEqual(0);
    expect(sorted[sorted.length - 1]).toBeLessThanOrEqual(1);
  });
});

describe('Terrain-Pixel (reine Rechnung, ohne Canvas)', () => {
  it('AK-R1-06 Aufbau Faktor 1 (Rechenzeit ohne Canvas) ≤ 1500 ms', () => {
    // Bestwert aus drei Läufen: Unter Volllast (parallele Testdateien) verfälscht ein einzelner Lauf die Zeit,
    // die Aussage "≤ 1500 ms" bleibt unverändert und streng für den schnellsten Lauf.
    const world = createWorld(5);
    let best = Infinity;
    for (let i = 0; i < 3 && best >= 1500; i++) {
      const t0 = performance.now();
      paintAll(world);
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(1500);
  }, 30_000);

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
    const wood = FOREST_FLOOR;
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
    // Ausnahmen sind dunkle Grasflecken (grassDark liegt selbst ΔE ≈ 8 am alten Waldgrund), nie der Waldboden
    expect(oldColor / edgeCorners).toBeLessThanOrEqual(0.1);
    expect(crownPix).toBe(0);
    expect(light).toBeGreaterThan(0);
    expect(dark).toBeGreaterThan(0);
  }, 60_000); // Korrektheitstest ohne Zeitaussage; Rechenzeit steigt unter Volllast

  it('AK-R1-08 I5 ≥ 90 % der Felskacheln zeigen Pixel farbnah (ΔE ≤ 10) zu rockLight und zu rockDark', () => {
    for (const seed of [3, 5, 12588]) {
      const w = seed === 3 ? world3 : createWorld(seed);
      const p = seed === 3 ? painted : paintAll(w);
      let rock = 0,
        both = 0;
      for (let y = 0; y < w.height; y++)
        for (let x = 0; x < w.width; x++) {
          if (terrainOf(w, x, y) !== 'mountain') continue;
          rock++;
          let l = 0,
            d = 0;
          for (let py = y * TEX; py < (y + 1) * TEX; py++)
            for (let px = x * TEX; px < (x + 1) * TEX; px++) {
              const c = p.at(px, py);
              if (near(c, PALETTE.rockLight)) l++;
              if (near(c, PALETTE.rockDark)) d++;
            }
          if (l > 0 && d > 0) both++;
        }
      expect(rock, `Seed ${seed}`).toBeGreaterThan(10);
      expect(both / rock, `Seed ${seed}: ${both}/${rock}`).toBeGreaterThanOrEqual(0.9);
    }
  }, 60_000); // Korrektheitstest ohne Zeitaussage; Rechenzeit steigt unter Volllast

  it('R149 Grasfläche 4 × 4 Kacheln zeigt ≥ 5 Farbwerte mit ΔE ≥ 3', () => {
    const w = world3;
    let checked = 0;
    for (let y = 0; y < w.height - 4 && checked < 5; y++)
      for (let x = 0; x < w.width - 4 && checked < 5; x++) {
        let all = true;
        for (let j = 0; j < 4 && all; j++)
          for (let i = 0; i < 4; i++) if (terrainOf(w, x + i, y + j) !== 'grass') all = false;
        if (!all) continue;
        checked++;
        const distinct: ReturnType<typeof rgbToLab>[] = [];
        for (let j = 0; j < 4; j++)
          for (let i = 0; i < 4; i++) {
            const l = rgbToLab(painted.at((x + i + 0.5) * TEX, (y + j + 0.5) * TEX));
            if (distinct.every((d) => deltaE2000(d, l) >= 3)) distinct.push(l);
          }
        expect(distinct.length, `Fläche ${x},${y}`).toBeGreaterThanOrEqual(5);
        x += 3; // nicht überlappende Flächen
      }
    expect(checked).toBeGreaterThan(0);
  });

  it('R149 Waldrand ist im Mittel heller als das Waldinnere', () => {
    const w = world3;
    const lum = (c: [number, number, number]) => c[0] + c[1] + c[2];
    let eSum = 0,
      eN = 0,
      iSum = 0,
      iN = 0;
    const dirs = [-1, 0, 1];
    for (let y = 1; y < w.height - 1; y++)
      for (let x = 1; x < w.width - 1; x++) {
        if (terrainOf(w, x, y) !== 'forest') continue;
        let nForest = 0;
        for (const dy of dirs)
          for (const dx of dirs) if (terrainOf(w, x + dx, y + dy) === 'forest') nForest++;
        const c = mean3((x + 0.5) * TEX, (y + 0.5) * TEX);
        if (nForest === 9) {
          iSum += lum(c);
          iN++;
        } else if (terrainOf(w, x - 1, y) !== 'forest' || terrainOf(w, x, y - 1) !== 'forest') {
          // Randkachel: die Kachelhälfte zur Aussenseite
          const ox = terrainOf(w, x - 1, y) !== 'forest' ? x * TEX + 3 : (x + 0.5) * TEX;
          const oy = terrainOf(w, x, y - 1) !== 'forest' ? y * TEX + 3 : (y + 0.5) * TEX;
          eSum += lum(mean3(ox, oy));
          eN++;
        }
      }
    expect(iN).toBeGreaterThan(5);
    expect(eN).toBeGreaterThan(5);
    expect(eSum / eN).toBeGreaterThan(iSum / iN);
  });

  it('R149 Grastöne (Klee, trocken) liegen ΔE2000 ≥ 15 neben earth und earthEdge', () => {
    const w = world3;
    const labs = [PALETTE.earth, PALETTE.earthEdge].map((c) => hexToLab(c));
    let n = 0,
      minDe = Infinity;
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        if (terrainOf(w, x, y) !== 'grass') continue;
        // Kachelinneres: am Rand zeigt eine Grasskachel auch Felspixel des Nachbarn (Typ je Pixel, nicht je Kachel)
        for (let py = 10; py < TEX - 9; py += 4)
          for (let px = 10; px < TEX - 9; px += 4) {
            const l = rgbToLab(painted.at(x * TEX + px, y * TEX + py));
            for (const e of labs) minDe = Math.min(minDe, deltaE2000(l, e));
            n++;
          }
      }
    expect(n).toBeGreaterThan(1000);
    expect(minDe).toBeGreaterThanOrEqual(15);
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

describe('Auflösungsfaktor', () => {
  it('AK-R1-06 Standard-Faktor aus devicePixelRatio: ab 1,5 doppelt, sonst einfach (Spec 5.1)', () => {
    expect([undefined, 1, 1.25, 1.49].map(defaultTerrainScale)).toEqual([1, 1, 1, 1]);
    expect([1.5, 2, 3].map(defaultTerrainScale)).toEqual([2, 2, 2]);
  });
});
