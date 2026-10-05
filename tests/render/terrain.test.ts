import { fieldWorld } from '../../src/render/terrainField';
import { describe, expect, it } from 'vitest';
import { perfBudget } from '../helpers/perfBudget';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { home, createWorld } from '../../src/sim/world';
import type { World3 } from '../../src/render/terrain';
import type { World } from '../../src/sim/types';
import { FOREST_FLOOR, PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { TEX } from '../../src/render/iso';
import { LAND, depthAt, terrainFields } from '../../src/render/terrainField';
import {
  RASTER,
  SMOOTH_BORDER,
  buildGrid,
  patchGrid,
  defaultTerrainScale,
  dirtyRect,
  occupancy,
  paintPixels,
  shouldPatch,
  terrainCodes,
  terrainLayerSize,
  terrainPatchRect,
  tuftsFor,
  RELIEF_AMP,
  meadowHill,
} from '../../src/render/terrain';
import { clearForest, plantForest } from '../../src/sim/forest';
import { step } from '../../src/sim/tick';
import { layoutKey } from '../../src/sim/queries';
import { coastField } from '../../src/render/terrainField';
import { fishAnchors, flockAnchors } from '../../src/render/wildlife';
import { phaseAt } from '../../src/render/daynight';
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
  const grid = buildGrid(fieldWorld(world));
  const w = home(world).width * TEX,
    h = home(world).height * TEX;
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
const terrainOf = (w: World, x: number, y: number) => home(w).tiles[y * home(w).width + x]?.terrain;

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
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 3, k.y + 3, 4, 2, 'grass');
    w.money = 100000;
    for (const g of Object.keys(home(w).stock) as (keyof ReturnType<typeof home>['stock'])[])
      home(w).stock[g] = 1000;
    const before = occupancy(fieldWorld(w));
    expect(before.length).toBe(home(w).width * home(w).height);
    expect(before[(k.y + 3) * home(w).width + k.x + 3]).toBe(0);
    expect(placeBuilding(w, 'house', k.x + 3, k.y + 3).ok).toBe(true);
    expect(placeRoad(w, k.x + 5, k.y + 4).ok).toBe(true);
    const after = occupancy(fieldWorld(w));
    expect(after[(k.y + 3) * home(w).width + k.x + 3]).toBe(1);
    expect(after[(k.y + 4) * home(w).width + k.x + 5]).toBe(1);
    expect(after[(k.y + 3) * home(w).width + k.x + 4]).toBe(0);
    // Kontor-Kacheln sind belegt
    expect(after[k.y * home(w).width + k.x]).toBe(1);
  });

  it('AK-ISO-19 terrainLayerSize: Faktor 1 und 2 sowie halbe Kopie je Canvas ≤ 16 777 216 Pixel', () => {
    for (const scale of [1, 2]) {
      const sizes = terrainLayerSize(fieldWorld(createWorld(3)), scale);
      expect(sizes.length).toBe(2);
      for (const s of sizes) expect(s.w * s.h).toBeLessThanOrEqual(16777216);
    }
    expect(terrainLayerSize(fieldWorld(createWorld(3)), 1)[0]).toEqual({
      w: 64 * TEX,
      h: 64 * TEX,
    });
    expect(terrainLayerSize(fieldWorld(createWorld(3)), 2)[1]).toEqual({
      w: 64 * TEX,
      h: 64 * TEX,
    });
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

  const blockWorld = (seed = 9): World3 => {
    const n = 24;
    const tiles = Array.from({ length: n * n }, (_, i) => {
      const x = i % n,
        y = (i / n) | 0;
      const m = x >= 8 && x < 16 && y >= 8 && y < 16;
      return { terrain: m ? 'mountain' : 'grass', buildingId: null, road: false };
    });
    return { width: n, height: n, seed, tiles } as unknown as World3;
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
    // H-R9: die Wiese trägt jetzt eigenes Mikrorelief (Zufall je Seed); über 8 Seeds mittelt es sich heraus, der Gebirgsfuss bleibt
    const gs = Array.from({ length: 8 }, (_, k) => buildGrid(blockWorld(9 + k)));
    const avg = (x0: number, x1: number, y0: number, y1: number) =>
      gs.reduce((a, g) => a + meanShade(g, x0, x1, y0, y1), 0) / gs.length;
    const g = gs[0]!;
    // H-R9 R3: rechts/unten nur noch auf der Gebirgsseite gemessen; die Wiese davor trägt keinen dunklen Hof mehr
    const left = avg(7.6, 8.4, 9, 15),
      right = avg(15.2, 15.75, 9, 15),
      top = avg(9, 15, 7.6, 8.4),
      bottom = avg(9, 15, 15.2, 15.75);
    expect(left).toBeGreaterThan(0.02);
    expect(top).toBeGreaterThan(0.01);
    expect(right).toBeLessThan(-0.02);
    expect(bottom).toBeLessThan(-0.01);
    // Licht kommt stärker von links als von oben (−3 gegen −1)
    expect(left).toBeGreaterThan(top);
    // R149: Abweichung zu M7-Spec 5.1 — Gebirge ±12 %; H-R9: Gras/Strand ±14 % (Mikrorelief), Wald ±8 %
    const mtCls = 1 + LAND.indexOf('mountain');
    let mtMax = 0;
    for (let k = 0; k < g.shade.length; k++) {
      const a = Math.abs(g.shade[k]!);
      const limit = g.cls[k] === mtCls ? 0.12 : 0.2; // H-R9 R3: Gras/Strand ±20 %
      expect(a).toBeLessThanOrEqual(limit + 1e-6);
      if (g.cls[k] === mtCls) mtMax = Math.max(mtMax, a);
    }
    expect(mtMax).toBeGreaterThan(0.08); // das Gebirge nutzt die höhere Grenze tatsächlich
  });

  it('H-R9 R3 kein dunkler Hof: Wiese vor dem Gebirgsfuss (rechts/unten, Schattenseite) ist im Mittel kaum dunkler', () => {
    const gs = Array.from({ length: 8 }, (_, k) => buildGrid(blockWorld(9 + k)));
    const avg = (x0: number, x1: number, y0: number, y1: number) =>
      gs.reduce((a, g) => a + meanShade(g, x0, x1, y0, y1), 0) / gs.length;
    // gegen gleich breite Wiesenbänder weiter weg (das Mikrorelief mittelt sich über 8 Seeds nicht ganz heraus)
    expect(avg(16.15, 16.9, 9, 15) - avg(20.15, 20.9, 9, 15)).toBeGreaterThan(-0.02);
    expect(avg(9, 15, 16.15, 16.9) - avg(9, 15, 20.15, 20.9)).toBeGreaterThan(-0.02);
  });

  it('R149 Plastik: mittlere |shade| auf Land ≥ 0,035 und auf Gebirge ≥ 0,05 (Seeds 3, 5, 12588)', () => {
    const mtCls = 1 + LAND.indexOf('mountain');
    for (const seed of [3, 5, 12588]) {
      const g = buildGrid(fieldWorld(createWorld(seed)));
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

  it('R149 Pixel auf Gras tragen höchstens ±20 % Schattierung (H-R9 R3, vorher ±14 % bzw. ±8 %); Gebirgsanteil 0', () => {
    // Alle Knoten tragen 0,3 bzw. 0,2: Gleiche Pixel auf Gras beweisen, dass paintPixels bei ±20 % klemmt.
    const g = buildGrid(blockWorld());
    const hot = { ...g, shade: g.shade.map(() => 0.3) };
    const flat = { ...g, shade: g.shade.map(() => 0.2) };
    const a = paintPixels(hot, 1, 0, 0, 8 * TEX, 8 * TEX); // Gras links oben (kein Gebirge)
    const b = paintPixels(flat, 1, 0, 0, 8 * TEX, 8 * TEX);
    expect(firstDiff(a, b)).toBe(-1);
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
    const budget = perfBudget(1500); // im CI Faktor 1,5 (R217)
    const world = createWorld(5);
    let best = Infinity;
    for (let i = 0; i < 3 && best >= budget; i++) {
      const t0 = performance.now();
      paintAll(world);
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(budget);
  }, 30_000);

  it('H-R11 (löst AK-R1-08 I1 ab) Grasfläche 4 × 4 Kacheln zeigt ≥ 3 Farbwerte mit ΔE ≥ 2 (3 × 3-Mittel, ohne Korn)', () => {
    const w = world3;
    let found = false;
    for (let y = 0; y < home(w).height - 4 && !found; y++)
      for (let x = 0; x < home(w).width - 4 && !found; x++) {
        let all = true;
        for (let j = 0; j < 4 && all; j++)
          for (let i = 0; i < 4; i++) if (terrainOf(w, x + i, y + j) !== 'grass') all = false;
        if (!all) continue;
        found = true;
        const labs = [];
        for (let j = 0; j < 8; j++)
          for (let i = 0; i < 8; i++)
            labs.push(rgbToLab(mean3((x + (i + 0.5) / 2) * TEX, (y + (j + 0.5) / 2) * TEX)));
        const distinct: typeof labs = [];
        for (const l of labs) if (distinct.every((d) => deltaE2000(d, l) >= 2)) distinct.push(l);
        expect(distinct.length).toBeGreaterThanOrEqual(3);
      }
    expect(found).toBe(true);
  });

  it('AK-R1-08 I2 Flachwasser ~ waterShallow, Tiefwasser ~ waterDeep, Schaum am Saum', () => {
    const w = world3;
    const f = terrainFields(fieldWorld(w));
    let shallow = 0,
      shallowOk = 0,
      deep = 0,
      deepOk = 0,
      foamTiles = 0,
      coastTiles = 0;
    for (let y = 0; y < home(w).height; y++)
      for (let x = 0; x < home(w).width; x++) {
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
    for (let y = 0; y < home(w).height; y++)
      for (let x = 0; x < home(w).width; x++) {
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
      for (let y = 0; y < home(w).height; y++)
        for (let x = 0; x < home(w).width; x++) {
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

  it('H-R11 (löst R149 ab) Grasfläche 4 × 4 Kacheln zeigt ≥ 3 Farbwerte mit ΔE ≥ 2 (3 × 3-Mittel, ohne Korn)', () => {
    const w = world3;
    let checked = 0;
    for (let y = 0; y < home(w).height - 4 && checked < 5; y++)
      for (let x = 0; x < home(w).width - 4 && checked < 5; x++) {
        let all = true;
        for (let j = 0; j < 4 && all; j++)
          for (let i = 0; i < 4; i++) if (terrainOf(w, x + i, y + j) !== 'grass') all = false;
        if (!all) continue;
        checked++;
        const distinct: ReturnType<typeof rgbToLab>[] = [];
        // H-R11: die Tonstufen malen Flächen statt Verlauf; Probe daher 2 × 2 Punkte je Kachel (vorher nur die Mitte)
        for (let j = 0; j < 8; j++)
          for (let i = 0; i < 8; i++) {
            const l = rgbToLab(mean3((x + (i + 0.5) / 2) * TEX, (y + (j + 0.5) / 2) * TEX));
            if (distinct.every((d) => deltaE2000(d, l) >= 2)) distinct.push(l);
          }
        expect(distinct.length, `Fläche ${x},${y}`).toBeGreaterThanOrEqual(3);
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
    for (let y = 1; y < home(w).height - 1; y++)
      for (let x = 1; x < home(w).width - 1; x++) {
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
    for (let y = 0; y < home(w).height; y++)
      for (let x = 0; x < home(w).width; x++) {
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
    expect(firstDiff(a, b)).toBe(-1);
    const c = paintPixels(g, 2, 200, 200, 32, 32);
    expect(c.length).toBe(32 * 32 * 4);
    expect(a.every((v) => v >= 0 && v <= 255)).toBe(true);
  });
});

/**
 * R170 Messgrössen auf Leuchtdichte L (Texturpixel, Faktor 1), nur Binnenland (3 × 3-Kachelumfeld ohne Wasser):
 * - seam: mittlere quadrierte L-Differenz benachbarter Pixel nahe Kachelkanten (±2 px) ÷ über alle Paare; 1 = kein Raster
 * - axis: Diagonal- zu Achsdifferenzen (je Pixelabstand); 1 = richtungslos, √2 = rein achsparallel (Kachelachsen)
 * - rim95: 95-%-Quantil |ΔL| quer zur Kante Gebirge/Nicht-Gebirge (±4 px); harte Kontur = gross
 * - blob: Streuung der 8 × 8-Pixel-Mittel in Gebirgskacheln mit Gebirge rundum; grosse Flecken = gross
 */
function rasterStats(world: World, out: Uint8ClampedArray) {
  const W = home(world).width * TEX,
    H = home(world).height * TEX;
  const L = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++)
    L[k] = 0.2126 * out[k * 4]! + 0.7152 * out[k * 4 + 1]! + 0.0722 * out[k * 4 + 2]!;
  const T = (tx: number, ty: number) => terrainOf(world, tx, ty);
  const inland = new Uint8Array(home(world).width * home(world).height);
  for (let ty = 1; ty < home(world).height - 1; ty++)
    for (let tx = 1; tx < home(world).width - 1; tx++) {
      let ok = true;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (T(tx + dx, ty + dy) === 'water') ok = false;
      inland[ty * home(world).width + tx] = ok ? 1 : 0;
    }
  const land = (px: number, py: number) =>
    inland[((py / TEX) | 0) * home(world).width + ((px / TEX) | 0)] === 1;
  const nearEdge = (q: number) => q <= 2 || q >= TEX - 2;
  let seam = 0,
    nSeam = 0,
    all = 0,
    nAll = 0,
    ax = 0,
    dg = 0;
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (!land(x, y)) continue;
      const l = L[y * W + x]!;
      if (land(x + 1, y)) {
        const d = (L[y * W + x + 1]! - l) ** 2;
        all += d;
        nAll++;
        if (nearEdge((x + 1) % TEX)) {
          seam += d;
          nSeam++;
        }
      }
      if (land(x, y + 1)) {
        const d = (L[(y + 1) * W + x]! - l) ** 2;
        all += d;
        nAll++;
        if (nearEdge((y + 1) % TEX)) {
          seam += d;
          nSeam++;
        }
      }
      if (land(x + 1, y) && land(x, y + 1) && land(x + 1, y + 1) && land(x - 1, y + 1)) {
        ax += Math.abs(L[y * W + x + 1]! - l) + Math.abs(L[(y + 1) * W + x]! - l);
        dg +=
          (Math.abs(L[(y + 1) * W + x + 1]! - l) + Math.abs(L[(y + 1) * W + x - 1]! - l)) /
          Math.SQRT2;
      }
    }
  const rim: number[] = [];
  const blocks: number[] = [];
  for (let ty = 1; ty < home(world).height - 1; ty++)
    for (let tx = 1; tx < home(world).width - 1; tx++) {
      if (T(tx, ty) !== 'mountain') continue;
      let all9 = true;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const o = T(tx + dx, ty + dy);
        if (o !== 'mountain') all9 = false;
        if (o === 'mountain' || o === 'water') continue;
        for (let s = 4; s < TEX - 4; s++)
          for (let r = -4; r < 4; r++) {
            const e = dx !== 0 ? (dx > 0 ? tx + 1 : tx) * TEX : (dy > 0 ? ty + 1 : ty) * TEX;
            const [x, y] = dx !== 0 ? [e + r, ty * TEX + s] : [tx * TEX + s, e + r];
            const [x2, y2] = dx !== 0 ? [x + 1, y] : [x, y + 1];
            rim.push(Math.abs(L[y2 * W + x2]! - L[y * W + x]!));
          }
      }
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (T(tx + dx, ty + dy) !== 'mountain') all9 = false;
      if (!all9) continue;
      for (let by = 0; by < TEX; by += 8)
        for (let bx = 0; bx < TEX; bx += 8) {
          let m = 0;
          for (let j = 0; j < 8; j++)
            for (let i = 0; i < 8; i++) m += L[(ty * TEX + by + j) * W + tx * TEX + bx + i]!;
          blocks.push(m / 64);
        }
    }
  rim.sort((a, b) => a - b);
  const mu = blocks.reduce((a, b) => a + b, 0) / blocks.length;
  const blob = Math.sqrt(blocks.reduce((a, b) => a + (b - mu) ** 2, 0) / blocks.length);
  return {
    seam: seam / nSeam / (all / nAll),
    axis: dg / ax,
    rim95: rim[Math.floor(rim.length * 0.95)]!,
    blob,
  };
}

describe('R170 Terrain ohne Kachelraster, Gebirge ohne Kontur', () => {
  const seeds = [3, 5, 12588];
  const stats = new Map<number, ReturnType<typeof rasterStats>>();
  const statsOf = (seed: number) => {
    if (!stats.has(seed)) {
      const w = seed === 3 ? world3 : createWorld(seed);
      stats.set(seed, rasterStats(w, seed === 3 ? painted.out : paintAll(w).out));
    }
    return stats.get(seed)!;
  };

  it('R170 Kachelraster: Kantenenergie an Kachelgrenzen ≤ 2,3-fach des Mittels (vorher ≈ 4,3)', () => {
    for (const seed of seeds) expect(statsOf(seed).seam, `Seed ${seed}`).toBeLessThanOrEqual(2.3);
  }, 60_000);

  it('R170 Kachelraster: Achsindex ≤ 1,05 — Strukturen laufen nicht entlang der Kachelachsen (vorher ≈ 1,10)', () => {
    for (const seed of seeds) expect(statsOf(seed).axis, `Seed ${seed}`).toBeLessThanOrEqual(1.05);
  }, 60_000);

  it('R170 Gebirgsrand ohne harte Hell/Dunkel-Kontur: 95-%-Quantil |ΔL| am Rand ≤ 15 (vorher ≈ 74)', () => {
    for (const seed of seeds) expect(statsOf(seed).rim95, `Seed ${seed}`).toBeLessThanOrEqual(15);
  }, 60_000);

  it('R170 Fels ruhig: Streuung der 8 × 8-Pixel-Mittel im Gebirge ≤ 20 (vorher ≈ 34)', () => {
    for (const seed of seeds) expect(statsOf(seed).blob, `Seed ${seed}`).toBeLessThanOrEqual(20);
  }, 60_000);
});

describe('Auflösungsfaktor', () => {
  it('AK-R1-06 Standard-Faktor aus devicePixelRatio: ab 1,5 doppelt, sonst einfach (Spec 5.1)', () => {
    expect([undefined, 1, 1.25, 1.49].map(defaultTerrainScale)).toEqual([1, 1, 1, 1]);
    expect([1.5, 2, 3].map(defaultTerrainScale)).toEqual([2, 2, 2]);
  });
});

describe('M10 Terrain nach Geländewechsel (Spec 7)', () => {
  it('AK-R1-01 Gelände-Abbild unterscheidet sich genau in (x, y); Rechteck mit Glättungsrand, geklemmt; step allein patcht nicht', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const x = k.x + 6,
      y = k.y + 2;
    forceRect(w, x, y, 1, 1, 'forest');
    const a = terrainCodes(fieldWorld(w));
    const key = layoutKey(w);
    step(w);
    expect(shouldPatch({ world: w, key }, w, layoutKey(w))).toBe(false);
    expect(clearForest(w, x, y).ok).toBe(true);
    const b = terrainCodes(fieldWorld(w));
    expect([...a.keys()].filter((i) => a[i] !== b[i])).toEqual([y * home(w).width + x]);
    const r = terrainPatchRect(a, b, home(w).width, home(w).height)!;
    expect(r.x0).toBeLessThanOrEqual(x - SMOOTH_BORDER);
    expect(r.x1).toBeGreaterThanOrEqual(x + SMOOTH_BORDER);
    expect(terrainPatchRect(b, b, home(w).width, home(w).height)).toBeNull();
    const edge = terrainPatchRect(
      new Uint8Array(home(w).width * home(w).height),
      (() => {
        const c = new Uint8Array(home(w).width * home(w).height);
        c[0] = 1;
        return c;
      })(),
      home(w).width,
      home(w).height,
    )!;
    expect([edge.x0, edge.y0]).toEqual([0, 0]);
  });
  it('AK-R1-05 Tier-Anker (Fische, Vögel) und Küstenfeld (water.ts und life.ts nutzen coastField) bleiben gleich', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    w.money = 1000;
    const snap = () => ({
      fish: fishAnchors(w),
      flock: flockAnchors(w, phaseAt(w.tick)),
      coast: coastField(fieldWorld(w)),
    });
    const before = snap();
    expect(clearForest(w, k.x + 6, k.y + 2).ok).toBe(true);
    expect(plantForest(w, k.x + 7, k.y + 2).ok).toBe(true);
    expect(snap()).toEqual(before);
  });
});

describe('M10 Teil-Raster', () => {
  it('AK-R1-01 patchGrid im Rechteck ergibt dasselbe Raster wie ein Vollaufbau (Roden und Aufforsten)', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 2, 1, 'forest');
    const fields = terrainFields(fieldWorld(w));
    const grid = buildGrid(fieldWorld(w), fields);
    const prev = terrainCodes(fieldWorld(w));
    home(w).tiles[(k.y + 2) * home(w).width + k.x + 6]!.terrain = 'grass';
    home(w).tiles[(k.y + 2) * home(w).width + k.x + 7]!.terrain = 'sand';
    const next = terrainCodes(fieldWorld(w));
    const rect = terrainPatchRect(prev, next, home(w).width, home(w).height)!;
    patchGrid(fieldWorld(w), fields, grid, prev, next, rect);
    const full = buildGrid(fieldWorld(w));
    for (const f of [
      'sharp',
      'smooth',
      'grass',
      'rock',
      'shade',
      'tone',
      'patch',
      'cls',
      'dune',
      'dpres',
      'dphase',
    ] as const)
      expect(firstDiff(grid[f], full[f]), f).toBe(-1);
    grid.ind.forEach((a, t) => expect(a, `ind ${t}`).toEqual(full.ind[t]));
  }, 30000);
});

// ---------- H-R9 Teil B: Mikrorelief und Wiesenvarianz ----------

/**
 * Erster abweichender Index zweier gleich langer Zahlenfelder, −1 = gleich (Länge zählt). Statt `toEqual` auf
 * Millionen Elementen: ein Fehlschlag bleibt so schnell (Beobachtung „Vitest hängt bei grossen Arrays").
 */
function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return Math.min(a.length, b.length);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
  return -1;
}

const flat = (n: number, terrain: string, seed: number): World3 =>
  ({
    width: n,
    height: n,
    seed,
    tiles: Array.from({ length: n * n }, () => ({ terrain, buildingId: null, road: false })),
  }) as unknown as World3;

/** Knoten im Inneren (ohne Rand), über den gemessen wird. */
function inner(g: ReturnType<typeof buildGrid>, f: Float32Array, m = 16): number[] {
  const out: number[] = [];
  for (let j = m; j < g.ny - m; j++) for (let i = m; i < g.nx - m; i++) out.push(f[j * g.nx + i]!);
  return out;
}
const stdOf = (a: number[]): number => {
  const mu = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - mu) ** 2, 0) / a.length);
};

describe('H-R9 B1 Mikrorelief Wiese', () => {
  // R3 gemessen: 0,099/0,104/0,104 (Seeds 7/8/9); vor R3 0,053/0,057/0,056; main 0,0067
  it('H-R9 B1 Relief-Streuung: Standardabweichung von shade über Gras ≥ 0,085 (R3; vorher 0,03, main 0,0067)', () => {
    for (const seed of [7, 8, 9]) {
      const g = buildGrid(flat(40, 'grass', seed));
      expect(stdOf(inner(g, g.shade)), `Seed ${seed}`).toBeGreaterThanOrEqual(0.085);
    }
  });

  it('H-R9 B1 Grenzen: Gras und Strand ≤ ±20 % (und nutzen > 14 %, R3), Wald weiter ≤ ±8 %', () => {
    const grass = buildGrid(flat(40, 'grass', 7));
    const maxG = Math.max(...grass.shade.map(Math.abs));
    expect(maxG).toBeLessThanOrEqual(0.2 + 1e-6);
    expect(maxG).toBeGreaterThan(0.14);
    const sand = buildGrid(flat(40, 'sand', 7));
    expect(Math.max(...sand.shade.map(Math.abs))).toBeLessThanOrEqual(0.2 + 1e-6);
    const wood = buildGrid(flat(40, 'forest', 7));
    expect(Math.max(...wood.shade.map(Math.abs))).toBeLessThanOrEqual(0.08 + 1e-6);
    // Pixel: gleiche Klemmung wie am Knoten — Gras bis 20 %, Wald nur 8 %
    const g = buildGrid(flat(12, 'grass', 7));
    const f = buildGrid(flat(12, 'forest', 7));
    const hot = (gr: typeof g) => ({ ...gr, shade: gr.shade.map(() => 0.3) });
    const lim = (gr: typeof g, v: number) => ({ ...gr, shade: gr.shade.map(() => v) });
    const a = paintPixels(hot(g), 1, 64, 64, 64, 64);
    const b = paintPixels(lim(g, 0.2), 1, 64, 64, 64, 64);
    expect(firstDiff(a, b)).toBe(-1);
    const c = paintPixels(hot(f), 1, 64, 64, 64, 64);
    const d = paintPixels(lim(f, 0.08), 1, 64, 64, 64, 64);
    expect(firstDiff(c, d)).toBe(-1);
  });

  it('H-R9 B1 Kuppen heller, Senken dunkler: shade korreliert mit der Hanglage zur Sonne (Licht links oben)', () => {
    const g = buildGrid(flat(40, 'grass', 7));
    // Höhe der Kuppen aus dem reinen Helfer (Knoten i liegt bei i · RASTER / TEX Kacheln)
    const st = RASTER / TEX;
    const hill = (i: number, j: number): number => RELIEF_AMP.hill * meadowHill(7, i * st, j * st);
    // Lichtseite = fallende Höhe nach rechts/unten: shade ~ −(gx·Lx + gy·Ly) > 0 im Mittel bei positiver Korrelation
    let sxy = 0,
      n = 0;
    for (let j = 17; j < g.ny - 17; j++)
      for (let i = 17; i < g.nx - 17; i++) {
        const gx = hill(i + 1, j) - hill(i - 1, j);
        const gy = hill(i, j + 1) - hill(i, j - 1);
        sxy += g.shade[j * g.nx + i]! * -(gx * -3 + gy * -1);
        n++;
      }
    expect(sxy / n).toBeGreaterThan(0);
  });

  it('H-R11 (löst H-R9 R3 Senken ab) Schattenstufe auf Gras: dunkler, aber über den kühlen Farbton statt nur Abdunklung', () => {
    const g = buildGrid(flat(12, 'grass', 7));
    const at = (v: number) => paintPixels({ ...g, tone: g.tone.map(() => v) }, 1, 64, 64, 32, 32);
    const mean = (a: Uint8ClampedArray, k: number) => {
      let s = 0;
      for (let i = k; i < a.length; i += 4) s += a[i]!;
      return s / (a.length / 4);
    };
    const n = at(2),
      d = at(0);
    const L = (a: Uint8ClampedArray) =>
      0.299 * mean(a, 0) + 0.587 * mean(a, 1) + 0.114 * mean(a, 2);
    // gemessen: Luma-Verhältnis 0,82, Blau/Rot-Verhältnis 1,18
    expect(L(d)).toBeLessThan(0.9 * L(n));
    expect(mean(d, 2) / mean(d, 0)).toBeGreaterThan(1.1 * (mean(n, 2) / mean(n, 0)));
  });

  it('H-R9 B1 Determinismus: gleiche Felder und Pixel bei zweitem Aufbau', () => {
    const w = flat(10, 'grass', 5);
    const a = buildGrid(w),
      b = buildGrid(w);
    for (const f of ['shade', 'tone', 'warm', 'mottle', 'veil'] as const)
      expect(firstDiff(a[f], b[f]), f).toBe(-1);
    expect(firstDiff(paintPixels(a, 1, 0, 0, 96, 96), paintPixels(b, 1, 0, 0, 96, 96))).toBe(-1);
  });
});

describe('H-R9 B2 Dünen', () => {
  it('H-R12b (löst H-R9 B2 Dünen nur auf trockenem Sand ab) Dünenpräsenz am nassen Saum (s < WET_SAND) = 0, auf trockenem Sand > 0', () => {
    const g = buildGrid(fieldWorld(createWorld(3)));
    const sand = LAND.indexOf('sand');
    let wet = 0,
      dry = 0,
      dryMax = 0;
    for (let k = 0; k < g.cls.length; k++) {
      if (g.cls[k] !== 1 + sand || g.ind[LAND.indexOf('grass')]![k] !== 0) continue;
      if (g.smooth[k]! < 0.18) {
        wet++;
        expect(g.dpres[k]).toBe(0);
      } else if (g.smooth[k]! > 1.5) {
        dry++;
        dryMax = Math.max(dryMax, g.dpres[k]!);
      }
    }
    expect(wet).toBeGreaterThan(50);
    expect(dry).toBeGreaterThan(20);
    expect(dryMax).toBeGreaterThan(0.5);
  });
});

describe('H-R9 R4 Wiese satt und fleckig wie main', () => {
  /** Grasfläche 960 × 960 px ohne Hangbeleuchtung (shade 0): mittlere Chroma (Lab) und Streuung der 24-px-Blockhelligkeit. */
  const meadow = (seed: number): { chroma: number; patches: number } => {
    const g0 = buildGrid(flat(40, 'grass', seed));
    // H-R11 F1: Tonwert eben — gemessen wird nur die Farbvariation, nicht das Licht der Tonstufen
    const g = { ...g0, shade: g0.shade.map(() => 0), tone: g0.tone.map(() => 2) as Float32Array };
    const W = 960;
    const px = paintPixels(g, 1, 160, 160, W, W);
    const L = new Float32Array(W * W);
    let ch = 0;
    for (let i = 0; i < W * W; i++) {
      const lab = rgbToLab([px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!]);
      L[i] = lab[0];
      ch += Math.hypot(lab[1], lab[2]);
    }
    const B = 24,
      blocks: number[] = [];
    for (let by = 0; by < W / B; by++)
      for (let bx = 0; bx < W / B; bx++) {
        let s = 0;
        for (let y = 0; y < B; y++)
          for (let x = 0; x < B; x++) s += L[(by * B + y) * W + bx * B + x]!;
        blocks.push(s / (B * B));
      }
    const mu = blocks.reduce((a, b) => a + b, 0) / blocks.length;
    return {
      chroma: ch / (W * W),
      patches: Math.sqrt(blocks.reduce((a, b) => a + (b - mu) ** 2, 0) / blocks.length),
    };
  };
  // main (93f420e) gemessen, gleiche Funktion: Chroma 48,75/48,01/48,35, Flecken 4,30/4,65/4,74 (Seeds 7/8/42)
  const MAIN = { 7: [48.75, 4.3], 8: [48.01, 4.65], 42: [48.35, 4.74] } as const;

  it('H-R11 S5 (löst H-R9 R4 Chroma ≥ main − 2 % ab) Chroma der Wiese 15–45 % unter main: oliv statt knallgrün, nicht grau', () => {
    for (const seed of [7, 8, 42] as const) {
      const c = meadow(seed).chroma;
      expect(c, `Seed ${seed}`).toBeLessThanOrEqual(0.85 * MAIN[seed][0]);
      expect(c, `Seed ${seed}`).toBeGreaterThanOrEqual(0.55 * MAIN[seed][0]);
    }
  }, 60_000);

  it('H-R11 F1 (löst H-R9 R4 Fleckenkontrast ab) Streuung der Blockhelligkeit der Farbvariation (Ton eben) ≤ 1,5 statt main 4,3…4,7: Helligkeit nur aus den Tonstufen', () => {
    for (const seed of [7, 8, 42] as const)
      expect(meadow(seed).patches, `Seed ${seed}`).toBeLessThanOrEqual(1.5);
  }, 60_000);
});

describe('H-R9 R3 Dünen in Teilbereichen', () => {
  it('H-R12b (löst H-R9 R3 Dünen in Teilbereichen ab) Dünen setzen längs aus: auf jedem Seed 1–10 tragen 15–85 % des trockenen Sands Präsenz > 0,5 (gepoolt in dunes.test.ts: 30–70 %)', () => {
    const sa = LAND.indexOf('sand');
    for (let seed = 1; seed <= 10; seed++) {
      const g = buildGrid(fieldWorld(createWorld(seed)));
      let dry = 0,
        hi = 0;
      for (let k = 0; k < g.cls.length; k++) {
        if (g.cls[k] !== 1 + sa || g.smooth[k]! < 1.18) continue;
        dry++;
        if (g.dpres[k]! > 0.5) hi++;
      }
      expect(hi / dry, `Seed ${seed}`).toBeGreaterThan(0.15);
      expect(hi / dry, `Seed ${seed}`).toBeLessThan(0.85);
    }
  }, 60_000);
});

describe('H-R9 B3 Wiesenvarianz', () => {
  const W = 40 * TEX;
  const paintFlat = (seed: number) => {
    const g = buildGrid(flat(40, 'grass', seed));
    return { g, out: paintPixels(g, 1, 0, 0, W, W) };
  };

  // Messwert R3: RMS 5,66 (Seed 7) und 5,71 (Seed 8); vor R3 5,39/5,50; Basis main vor H-R9: 5,0
  it('H-R11 F1 (löst H-R9 B3 Farbstreuung ab) RMS-ΔE2000 zum Mittel über eine Grasfläche 1,8…6,0 (main-Basis 5,0; das Licht kommt jetzt gestuft aus den Tonstufen)', () => {
    for (const seed of [7, 8]) {
      const { out } = paintFlat(seed);
      const labs: [number, number, number][] = [];
      for (let y = 100; y < W - 100; y += 3)
        for (let x = 100; x < W - 100; x += 3) {
          const o = (y * W + x) * 4;
          labs.push(rgbToLab([out[o]!, out[o + 1]!, out[o + 2]!]));
        }
      const mean: [number, number, number] = [0, 0, 0];
      for (const l of labs) for (let c = 0; c < 3; c++) mean[c]! += l[c]! / labs.length;
      const rms = Math.sqrt(labs.reduce((a, l) => a + deltaE2000(l, mean) ** 2, 0) / labs.length);
      expect(rms, `Seed ${seed}`).toBeGreaterThanOrEqual(1.8);
      expect(rms, `Seed ${seed}`).toBeLessThanOrEqual(6);
    }
  });

  it('H-R11 F1 (löst H-R9 B3/R4 ab) Warmton und Schleier ändern nur den Farbton: Luma je Pixel gleich der Grundstruktur (ohne Ebenen) ±2 %', () => {
    const g0 = buildGrid(flat(30, 'grass', 7));
    const g = { ...g0, shade: g0.shade.map(() => 0) };
    const base = {
      ...g,
      warm: g.warm.map(() => 0),
      veil: g.veil.map(() => 0),
      mottle: g.mottle.map(() => 0),
    };
    const a = paintPixels(g, 1, 100, 100, 500, 500),
      b = paintPixels(base, 1, 100, 100, 500, 500);
    const luma = (p: Uint8ClampedArray, i: number) =>
      0.299 * p[i]! + 0.587 * p[i + 1]! + 0.114 * p[i + 2]!;
    let changed = 0;
    for (let i = 0; i < a.length; i += 4 * 3) {
      expect(Math.abs(luma(a, i) / luma(b, i) - 1)).toBeLessThanOrEqual(0.02);
      if (Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 2]! - b[i + 2]!) > 3) changed++;
    }
    expect(changed).toBeGreaterThan(450); // die Ebenen wirken tatsächlich
  });

  it('H-R9 B3 Kein Kachelraster: Farbsprung über Kachelkanten ≤ 1,08 × Sprung innerhalb der Kachel', () => {
    for (const seed of [7, 8]) {
      const { out } = paintFlat(seed);
      let cross = 0,
        nc = 0,
        within = 0,
        nw = 0;
      for (let y = 64; y < W - 64; y++)
        for (let x = 64; x < W - 65; x++) {
          const o = (y * W + x) * 4,
            p = o + 4;
          const d =
            Math.abs(out[o]! - out[p]!) +
            Math.abs(out[o + 1]! - out[p + 1]!) +
            Math.abs(out[o + 2]! - out[p + 2]!);
          if ((x + 1) % TEX === 0) {
            cross += d;
            nc++;
          } else {
            within += d;
            nw++;
          }
        }
      expect(cross / nc / (within / nw), `Seed ${seed}`).toBeLessThanOrEqual(1.08);
    }
  });

  it('H-R9 B3 Büschel-Dichte folgt dem Boden: satter Boden mehr Büschel als trockener, Standard bleibt 0–2', () => {
    let dry = 0,
      lush = 0;
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 40; x++) {
        dry += tuftsFor(3, x, y, 0).length;
        lush += tuftsFor(3, x, y, 1).length;
        expect(tuftsFor(3, x, y).length).toBeLessThanOrEqual(2);
      }
    expect(lush).toBeGreaterThan(dry * 1.5);
  });

  it('H-R9 B3 Keine Signalfarbe auf Wiese mit Relief und Blumenschleier', () => {
    const { out } = paintFlat(7);
    for (const name of SIGNAL_NAMES) {
      const lab = hexToLab(PALETTE[name as keyof typeof PALETTE] as string);
      for (let i = 0; i < out.length; i += 4 * 53)
        expect(deltaE2000(rgbToLab([out[i]!, out[i + 1]!, out[i + 2]!]), lab)).toBeGreaterThan(8);
    }
  });
});

describe('H-R9 B4 Teil-Neuzeichnung', () => {
  it('H-R9 B4 patchGrid ergibt auch für shade/warm/mottle/veil dasselbe Raster wie Vollaufbau; Pixel im Rechteck gleich', () => {
    const w = createWorld(3, { unlockAll: true });
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
    for (const f of [
      'shade',
      'tone',
      'warm',
      'mottle',
      'veil',
      'dune',
      'dpres',
      'dphase',
    ] as const) {
      expect(grid[f], `${f} vorhanden`).toBeDefined();
      expect(firstDiff(grid[f], full[f]), f).toBe(-1);
    }
    const x0 = (rect.x0 * TEX) | 0,
      y0 = (rect.y0 * TEX) | 0,
      pw = (rect.x1 - rect.x0 + 1) * TEX,
      ph = (rect.y1 - rect.y0 + 1) * TEX;
    expect(
      firstDiff(paintPixels(grid, 1, x0, y0, pw, ph), paintPixels(full, 1, x0, y0, pw, ph)),
    ).toBe(-1);
  }, 30000);

  it('H-R9 B4 Teil-Neuzeichnung eines 3 × 3-Rechtecks (Raster + Pixel) ≤ 8 ms (Median)', () => {
    const g = buildGrid(flat(40, 'grass', 7));
    const ts: number[] = [];
    for (let r = 0; r < 9; r++) {
      const t0 = performance.now();
      paintPixels(g, 1, 400, 400, 5 * TEX, 5 * TEX);
      ts.push(performance.now() - t0);
    }
    ts.sort((a, b) => a - b);
    // R235: Runner für paintPixels ≈ 4× langsamer als lokal; lokal bleibt 8 ms, CI 20 ms
    expect(ts[4]!).toBeLessThanOrEqual(perfBudget(8, undefined, 2.5));
  });
});
