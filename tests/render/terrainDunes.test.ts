import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { TEX } from '../../src/render/iso';
import { DUNE_ONSET, DUNE_TONE_FLAT } from '../../src/render/dunes';
import {
  buildGrid,
  duneInputs,
  paintPixels,
  patchGrid,
  terrainCodes,
  terrainPatchRect,
} from '../../src/render/terrain';
import { LAND, terrainFields } from '../../src/render/terrainField';

// H-R12 — Dünen im Sandzweig des Terrains (Stilrahmen D7, S2, S6).

const NODES = TEX / 4; // Knoten je Kachel (RASTER = 4)
const SAND = LAND.indexOf('sand');
const worlds = [1, 7].map((seed) => {
  const world = createWorld(seed, { unlockAll: true });
  return { seed, world, grid: buildGrid(world) };
});
const stepOf = (v: number): number => Math.floor(v + 0.5);

describe('H-R12 Dünen im Terrain', () => {
  it('H-R12 S6 auf Sandkacheln ändert sich die Tonstufe der Düne innerhalb einer Kachel um höchstens 1 (Seeds 1, 7)', () => {
    let tiles = 0,
      violations = 0,
      lit = 0;
    for (const { world, grid } of worlds)
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          if (world.tiles[y * world.width + x]!.terrain !== 'sand') continue;
          let lo = 99,
            hi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = stepOf(grid.dtone[(y * NODES + j) * grid.nx + x * NODES + i]!);
              lo = Math.min(lo, s);
              hi = Math.max(hi, s);
            }
          tiles++;
          if (hi - lo > 1) violations++;
          if (hi > DUNE_TONE_FLAT) lit++;
        }
    expect(tiles).toBeGreaterThan(100);
    expect(violations).toBe(0);
    expect(lit).toBeGreaterThan(5); // es gibt Dünen
  });

  it('H-R12 D7 kein Dünenansatz im Saum: Höhe 0 für s < WET_SAND + 1, und Dünen existieren dahinter (Seeds 1, 7)', () => {
    let before = 0,
      after = 0,
      maxBefore = 0,
      maxAfter = 0;
    for (const { grid } of worlds)
      for (let k = 0; k < grid.cls.length; k++) {
        if (grid.cls[k] !== 1 + SAND) continue;
        if (grid.smooth[k]! < DUNE_ONSET) {
          before++;
          maxBefore = Math.max(maxBefore, grid.dune[k]!);
        } else {
          after++;
          maxAfter = Math.max(maxAfter, grid.dune[k]!);
        }
      }
    expect(before).toBeGreaterThan(200);
    expect(after).toBeGreaterThan(50);
    // Fix 4: die Front folgt dem euklidischen Feld (Kacheln, geglättet), `smooth` ist der Chebyshev-Abstand; beide weichen
    // um Bruchteile einer Kachel ab, die Einblendung (0,5 Kachel) lässt dort höchstens einen Hauch Höhe zu
    expect(maxBefore).toBeLessThan(0.05);
    expect(maxAfter).toBeGreaterThan(0.5);
  });

  it('H-R12 Tonobergrenze im Bild: die Düne hellt Sand höchstens um eine Stufe auf (Seeds 1, 7, Strand bei 7,32)', () => {
    let litAll = 0;
    for (const { world, grid } of worlds) {
      const x0 = 2,
        y0 = 26,
        w = 14,
        h = 12;
      const flat = {
        ...grid,
        dtone: grid.dtone.map(() => DUNE_TONE_FLAT) as Float32Array,
        rip: grid.rip.map(() => 0) as Float32Array,
      };
      const a = paintPixels(grid, 1, x0 * TEX, y0 * TEX, w * TEX, h * TEX);
      const b = paintPixels(flat, 1, x0 * TEX, y0 * TEX, w * TEX, h * TEX);
      let sandPx = 0,
        lit = 0,
        maxRatio = 0;
      for (let y = 0; y < h * TEX; y += 2)
        for (let x = 0; x < w * TEX; x += 2) {
          const tile = world.tiles[(y0 + ((y / TEX) | 0)) * world.width + x0 + ((x / TEX) | 0)]!;
          if (tile.terrain !== 'sand') continue;
          sandPx++;
          const o = (y * w * TEX + x) * 4;
          const r = (a[o]! + a[o + 1]! + a[o + 2]!) / (b[o]! + b[o + 1]! + b[o + 2]! + 1e-6);
          maxRatio = Math.max(maxRatio, r);
          if (r > 1.05) lit++;
        }
      expect(sandPx).toBeGreaterThan(500);
      // eine Stufe: +8,5 % Helligkeit und warmer Ton (≈ +4 %), dazu Rippeln ±3 %: höchstens +17 %
      expect(maxRatio).toBeLessThan(1.17);
      litAll += lit;
    }
    expect(litAll).toBeGreaterThan(50); // Luvseiten sind heller
  });

  it('H-R12 Sandwechsel: patchGrid gleicht im Rechteck dem Neuaufbau (dtone, dune, rip, rwarp, dtn), der sandRest-Cache wird verworfen', () => {
    const { world: w0 } = worlds[1]!; // Seed 7
    const at = (w: typeof w0, x: number, y: number) => w.tiles[y * w.width + x]!;
    const sandNear = (x: number, y: number): boolean =>
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => at(w0, x + dx!, y + dy!).terrain === 'sand');
    let checked = 0,
      withDune = 0;
    for (let y = 2; y < w0.height - 2 && checked < 6; y++)
      for (let x = 2; x < w0.width - 2 && checked < 6; x++) {
        if (at(w0, x, y).terrain !== 'grass' || !sandNear(x, y)) continue;
        const w = createWorld(7, { unlockAll: true });
        const fields = terrainFields(w);
        const grid = buildGrid(w, fields); // füllt den Cache mit dem Abstand vor dem Wechsel
        const prev = terrainCodes(w);
        at(w, x, y).terrain = 'sand';
        const next = terrainCodes(w);
        const rect = terrainPatchRect(prev, next, w.width, w.height)!;
        patchGrid(w, fields, grid, prev, next, rect);
        const full = buildGrid(w);
        for (const f of ['dtone', 'dune', 'rip', 'rwarp', 'dtn'] as const)
          for (let j = rect.y0 * NODES; j <= (rect.y1 + 1) * NODES; j++)
            for (let i = rect.x0 * NODES; i <= (rect.x1 + 1) * NODES; i++) {
              const k = j * grid.nx + i;
              expect(grid[f][k], `${f} Kachel ${x},${y} Knoten ${i},${j}`).toBe(full[f][k]);
              if (f === 'dune' && full.dune[k]! > 0) withDune++;
            }
        checked++;
      }
    expect(checked).toBe(6);
    expect(withDune).toBeGreaterThan(0); // der Vergleich trifft wirklich Dünenknoten
  }, 60_000);

  it('H-R12 Fix 3: dtone springt nicht an den Kachelmittellinien (keine achsparallelen Stufen, Seeds 1, 2, 3, 5)', () => {
    // Das Küstenfeld ist je Kachel gestuft (Chebyshev-Abstand): sein Gefälle knickt an den Kachelmitten (Knoten 4 mod 8).
    // Ungeglättet ging das Gefälle in den Dünenton ein → Sprünge dort. Geglättet verteilen sich Sprünge gleichmässig.
    for (const seed of [1, 2, 3, 5]) {
      const g = buildGrid(createWorld(seed, { unlockAll: true }));
      let big = 0,
        onLines = 0;
      for (let j = 1; j < g.ny - 1; j++)
        for (let i = 1; i < g.nx - 1; i++) {
          const k = j * g.nx + i;
          if (g.dune[k]! < 0.2) continue;
          if (g.dune[k + 1]! >= 0.2 && Math.abs(g.dtone[k + 1]! - g.dtone[k]!) > 0.12) {
            big++;
            if (i % 8 === 3 || i % 8 === 4) onLines++;
          }
          if (g.dune[k + g.nx]! >= 0.2 && Math.abs(g.dtone[k + g.nx]! - g.dtone[k]!) > 0.12) {
            big++;
            if (j % 8 === 3 || j % 8 === 4) onLines++;
          }
        }
      // gleichverteilt wären 2 von 8 Positionen = 25 %; die Stufen lagen bei 52…70 %
      if (big > 30) expect(onLines / big, `Seed ${seed} (${onLines}/${big})`).toBeLessThan(0.38);
    }
  }, 60_000);

  it('H-R12 Fix 4: keine Kachelstruktur in den Eingangsgewichten (diagonale Küste und Sand/Gras-Grenze)', () => {
    // Küste und Sand/Gras-Grenze laufen exakt diagonal (x + y = const): ein Kachelfeld (Chebyshev, harter Gate) zeigt dort
    // Treppen mit der Periode √2 Kacheln entlang der Linie. Gemessen wird die Amplitude dieser Periode (und der halben)
    // entlang küstenparalleler Linien in Schritten von 1/16 Kachel.
    const world = createWorld(2, { unlockAll: true });
    const COAST = 50, // x + y < COAST: Wasser
      EDGE = COAST + 9; // dann Sand, ab EDGE Gras
    for (let y = 0; y < world.height; y++)
      for (let x = 0; x < world.width; x++)
        world.tiles[y * world.width + x]!.terrain =
          x + y < COAST ? 'water' : x + y < EDGE ? 'sand' : 'grass';
    const fields = terrainFields(world);
    // Linie u = fx + fy = c; ein Schritt von 1/16 in fx (und −1/16 in fy) ist 1/16 Periode der Kachelstufen
    const N = 16 * 8; // 8 Perioden
    const amp = (c: number, pick: (r: ReturnType<typeof duneInputs>) => number): number => {
      const v: number[] = [];
      for (let k = 0; k < N; k++)
        v.push(pick(duneInputs(world, fields, c / 2 - 4 + k / 16, c / 2 + 4 - k / 16)));
      const mean = v.reduce((a, b) => a + b, 0) / N;
      let best = 0;
      for (const h of [1, 2]) {
        let re = 0,
          im = 0;
        for (let k = 0; k < N; k++) {
          const ph = (2 * Math.PI * h * k) / 16;
          re += (v[k]! - mean) * Math.cos(ph);
          im += (v[k]! - mean) * Math.sin(ph);
        }
        best = Math.max(best, (2 * Math.hypot(re, im)) / N);
      }
      return best;
    };
    const weight = (r: ReturnType<typeof duneInputs>): number =>
      r.sand * Math.min(1, Math.max(0, (r.s - DUNE_ONSET) / 0.5));
    const worst = { s: 0, beach: 0, weight: 0 };
    const line = (sPerp: number): number => COAST + 1 + sPerp * Math.SQRT2; // Linie im Abstand sPerp von der Küste
    for (const d of [2, 3, 4]) {
      worst.s = Math.max(
        worst.s,
        amp(line(d), (r) => r.s),
      );
      worst.beach = Math.max(
        worst.beach,
        amp(line(d), (r) => r.beach),
      );
    }
    // Gewicht: am Dünenansatz und nahe der Sand/Gras-Grenze (Sand bis EDGE + 1 − 0,5)
    for (const c of [line(1.3), line(1.6), EDGE + 0.4, EDGE + 0.7, EDGE + 1.0])
      worst.weight = Math.max(worst.weight, amp(c, weight));
    expect(worst.s).toBeLessThan(0.03);
    expect(worst.beach).toBeLessThan(0.04);
    expect(worst.weight).toBeLessThan(0.03);
  });

  it('H-R12 Fix 5: Präsenz wirkt nach der Stufung stetig — Helligkeitssprung zwischen Nachbarknoten ≤ Stufe · Präsenz (Seeds 1, 2, 5)', () => {
    // Form (dtone) ist ungewichtet; am Maskenrand fällt nur `dw` von 1 auf 0. Eine Tonkante dort wäre ein Sprung ohne
    // Präsenz. Gemessen an Knotenpixeln (Zoom 1, Knoten = jedes 4. Texel) auf reinem Sand gegen dasselbe Bild mit
    // flachem dtone: der Quotient weicht nur um (Stufe 2→3 ≈ 0,12) · dw ab.
    const STEP = 0.2; // Stufe 2→3 (Licht, Wärme, Akzent) mit Reserve; entscheidend ist der Faktor dmax bei kleiner Präsenz
    let pairs = 0,
      lowPairs = 0;
    for (const seed of [1, 2, 5]) {
      const world = createWorld(seed, { unlockAll: true });
      const g = buildGrid(world);
      const W = world.width * TEX,
        H = world.height * TEX;
      const flat = { ...g, dtone: g.dtone.map(() => DUNE_TONE_FLAT) as Float32Array };
      const a = paintPixels(g, 1, 0, 0, W, H);
      const b = paintPixels(flat, 1, 0, 0, W, H);
      const ratio = (i: number, j: number): number => {
        const o = (j * 4 * W + i * 4) * 4;
        return (a[o]! + a[o + 1]! + a[o + 2]!) / (b[o]! + b[o + 1]! + b[o + 2]! + 1e-6);
      };
      const sandAt = (i: number, j: number): boolean =>
        world.tiles[Math.floor((j * 4) / TEX) * world.width + Math.floor((i * 4) / TEX)]!
          .terrain === 'sand';
      for (let j = 2; j < g.ny - 2; j += 1)
        for (let i = 2; i < g.nx - 2; i += 1) {
          if (!sandAt(i, j) || !sandAt(i + 1, j)) continue;
          const k = j * g.nx + i;
          const dmax = Math.max(g.dw[k]!, g.dw[k + 1]!);
          pairs++;
          if (dmax < 0.15) lowPairs++;
          expect(
            Math.abs(ratio(i, j) - ratio(i + 1, j)),
            `Seed ${seed} Knoten ${i},${j}`,
          ).toBeLessThan(STEP * dmax + 0.02);
        }
    }
    expect(pairs).toBeGreaterThan(5000);
    expect(lowPairs).toBeGreaterThan(500);
  }, 120_000);
});
