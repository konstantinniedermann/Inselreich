import { fieldWorld } from '../../src/render/terrainField';
import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { TEX } from '../../src/render/iso';
import { LIGHT } from '../../src/render/light';
import { PALETTE, rgbOf } from '../../src/render/palette';
import { LAND, terrainFields } from '../../src/render/terrainField';
import {
  DUNE_LAMBDA,
  DUNE_SKEW,
  RIPPLE_DEPTH,
  duneMicro,
  duneRipple,
  duneNode,
  duneOnset,
  duneProfile,
  duneSkew,
  duneSlope,
  type DuneNode,
} from '../../src/render/dunes';
import {
  RASTER,
  buildGrid,
  paintPixels,
  patchGrid,
  terrainCodes,
  terrainPatchRect,
  SMOOTH_BORDER,
  type TerrainGrid,
} from '../../src/render/terrain';

// H-R12b — Dünen, stetig gemalt (Kurz-Spec 2026-10-05, M1–M6, K1–K8).

const WET_SAND = 0.18;
const NODES = TEX / RASTER; // Knoten je Kachel
const STEP = RASTER / TEX; // Knotenabstand in Kacheln
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const grids = new Map<number, { w: ReturnType<typeof createWorld>; g: TerrainGrid }>();
const gridOf = (seed: number) => {
  if (!grids.has(seed)) {
    const w = createWorld(seed);
    grids.set(seed, { w, g: buildGrid(fieldWorld(w)) });
  }
  return grids.get(seed)!;
};
const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

/** Näherung für ∇s̃ an Knoten (i, j): Differenz der rohen Küstenwerte über ±1 Kachel, je Kachel. */
const coastGrad = (g: TerrainGrid, i: number, j: number): [number, number] => {
  const r = NODES;
  const at = (a: number, b: number) =>
    g.smooth[Math.min(g.ny - 1, Math.max(0, b)) * g.nx + Math.min(g.nx - 1, Math.max(0, a))]!;
  return [
    (at(i + r, j) - at(i - r, j)) / (2 * r * STEP),
    (at(i, j + r) - at(i, j - r)) / (2 * r * STEP),
  ];
};

/** Kachelfenster (T × T) mit der meisten Dünenpräsenz in Küstennähe (für Pixelmessungen). */
function duneWindow(seed: number, T = 10): { tx: number; ty: number } {
  const { w, g } = gridOf(seed);
  let best = -1,
    bx = 0,
    by = 0;
  for (let ty = 0; ty + T <= home(w).height; ty += 2)
    for (let tx = 0; tx + T <= home(w).width; tx += 2) {
      let s = 0;
      for (let j = ty * NODES; j < (ty + T) * NODES; j += 2)
        for (let i = tx * NODES; i < (tx + T) * NODES; i += 2)
          s += g.smooth[j * g.nx + i]! < 4 ? g.dpres[j * g.nx + i]! : 0;
      if (s > best) {
        best = s;
        bx = tx;
        by = ty;
      }
    }
  return { tx: bx, ty: by };
}

describe('H-R12b Profil und Hilfsfunktionen (M2, M5, M6)', () => {
  it('H-R12b M2 Profil ist C¹: Ableitung stimmt mit der Differenz überein, Schiefe ≤ 0,8, glatt durch 0', () => {
    for (const k of [0, 0.3, DUNE_SKEW]) {
      expect(k).toBeLessThanOrEqual(0.8);
      for (let i = 0; i < 200; i++) {
        const p = (i / 200) * 2 * Math.PI,
          e = 1e-5;
        const num = (duneProfile(p + e, k) - duneProfile(p - e, k)) / (2 * e);
        expect(duneSlope(p, k)).toBeCloseTo(num, 4);
      }
    }
    expect(Math.abs(duneSkew(1))).toBeLessThanOrEqual(0.8);
    expect(duneSkew(0)).toBe(0);
    expect(duneSkew(-0.4)).toBeCloseTo(-duneSkew(0.4), 12);
    expect(Math.abs(duneSkew(0.01) - duneSkew(0))).toBeLessThan(0.02);
  });

  it('H-R12b K1 Einsatz: Präsenz 0 für s̃ < WET_SAND + 1 (nie im nassen Saum oder Schaum), danach stetig bis 1', () => {
    expect(duneOnset(-3)).toBe(0);
    expect(duneOnset(0)).toBe(0);
    expect(duneOnset(1)).toBe(0);
    expect(duneOnset(1.5)).toBeGreaterThan(0);
    expect(duneOnset(10)).toBe(1);
    // Raster: unter s ≈ 0,5 (roh, s̃ liegt höchstens wenig darüber) keine Präsenz
    for (const seed of [1, 3, 5]) {
      const { g } = gridOf(seed);
      for (let k = 0; k < g.smooth.length; k++)
        if (g.smooth[k]! < WET_SAND) expect(g.dpres[k]!, `Seed ${seed}`).toBe(0);
    }
  }, 60_000);

  it('H-R12b K2 Form: Schattenseite unter Stufe 1,5, Lichtseite liegt über der Ebene, kurze steile Seite, Maximalton ≤ 2,5 + Rippeln', () => {
    const o: DuneNode = { tone: 0, pres: 0, phase: 0 };
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * 2 * Math.PI;
      const gx = Math.cos(ang),
        gy = Math.sin(ang);
      const dn = gx * LIGHT.x + gy * LIGHT.y;
      if (Math.abs(dn) < 0.5) continue; // quer zum Licht zeigt die Düne wenig Ton (M5 gleicht nur bis 0,35 aus)
      let lo = 9,
        hi = -9,
        dark = 0,
        lit = 0;
      const N = 360;
      for (let i = 0; i < N; i++) {
        // rel so wählen, dass die Phase die ganze Periode durchläuft (Kachel-Abstand λ)
        const rel = 1 + (i / N) * DUNE_LAMBDA;
        duneNode(1, 20, 20, rel, 1, gx, gy, o);
        lo = Math.min(lo, o.tone);
        hi = Math.max(hi, o.tone);
        if (o.tone < 1.5) dark++;
        if (o.tone > 2.05) lit++;
      }
      expect(lo, `Winkel ${a}`).toBeLessThan(1.5);
      expect(hi, `Winkel ${a}`).toBeGreaterThan(2.2);
      expect(hi, `Winkel ${a}`).toBeLessThanOrEqual(2.7);
      expect(dark / N, `Winkel ${a} Schatten kurz`).toBeLessThan(0.3);
      expect(lit / N, `Winkel ${a} Licht lang`).toBeGreaterThan(dark / N);
    }
  });

  it('H-R12b M6 (korrigiert) Rippeln nur nach der Stufung, ≤ 3 % abdunkelnd, nur auf der Lichtseite; vor der Stufung nur Mikro ≤ 0,05', () => {
    for (let i = 0; i < 100; i++) {
      expect(duneRipple(i * 0.37, 1.3)).toBe(1);
      const r = duneRipple(i * 0.37, 2.4);
      expect(r).toBeLessThanOrEqual(1);
      expect(r).toBeGreaterThanOrEqual(1 - RIPPLE_DEPTH - 1e-12);
      expect(Math.abs(duneMicro(0.5))).toBeLessThanOrEqual(0.05 + 1e-12);
    }
    expect(RIPPLE_DEPTH).toBeLessThanOrEqual(0.03);
  });
});

describe('H-R12b M1 stetiger Malpfad', () => {
  it('H-R12b M1 Knotendifferenzen: Dünenton ≤ 0,35 Stufen, Präsenz ≤ 0,15 zwischen Nachbarknoten (Seeds 1–10)', () => {
    let maxT = 0,
      maxP = 0,
      pairs = 0;
    for (const seed of SEEDS) {
      const { g } = gridOf(seed);
      for (let j = 0; j < g.ny - 1; j++)
        for (let i = 0; i < g.nx - 1; i++) {
          const k = j * g.nx + i;
          for (const q of [k + 1, k + g.nx]) {
            // erst ab 5 % Präsenz sichtbar: darunter wirkt ein Tonsprung höchstens mit 5 % Kontrast
            if (Math.max(g.dpres[k]!, g.dpres[q]!) <= 0.05) continue;
            pairs++;
            maxT = Math.max(maxT, Math.abs(g.dune[k]! - g.dune[q]!));
            maxP = Math.max(maxP, Math.abs(g.dpres[k]! - g.dpres[q]!));
          }
        }
    }
    expect(pairs).toBeGreaterThan(5000);
    expect(maxT).toBeLessThanOrEqual(0.35);
    expect(maxP).toBeLessThanOrEqual(0.15);
  }, 120_000);
});

describe('H-R12b K1 Lage: Kämme küstenparallel', () => {
  it('H-R12b K1 an ≥ 90 % der Kammknoten liegt ∇φ (Kammnormale) innerhalb 30° von ∇s̃ (Seeds 1–10)', () => {
    let crest = 0,
      ok = 0;
    for (const seed of SEEDS) {
      const { g } = gridOf(seed);
      for (let j = 2; j < g.ny - 2; j += 2)
        for (let i = 2; i < g.nx - 2; i += 2) {
          const k = j * g.nx + i;
          if (g.dpres[k]! < 0.5 || g.dpres[k - 1]! <= 0 || g.dpres[k + g.nx]! <= 0) continue;
          const [sx, sy] = coastGrad(g, i, j);
          const sl = Math.hypot(sx, sy);
          if (sl < 0.3) continue;
          // Kamm: Profilmaximum, Schiefe aus dem Licht auf dem Küstengefälle
          const h = duneProfile(g.dphase[k]!, duneSkew((sx * LIGHT.x + sy * LIGHT.y) / sl));
          if (h < 0.95) continue;
          const px = (g.dphase[k + 1]! - g.dphase[k - 1]!) / 2,
            py = (g.dphase[k + g.nx]! - g.dphase[k - g.nx]!) / 2;
          const pl = Math.hypot(px, py);
          if (pl === 0) continue;
          crest++;
          if ((px * sx + py * sy) / (pl * sl) >= Math.cos((30 * Math.PI) / 180)) ok++;
        }
    }
    expect(crest).toBeGreaterThan(200);
    expect(ok / crest).toBeGreaterThanOrEqual(0.9);
  }, 60_000);
});

describe('H-R12b K5 Häufigkeit', () => {
  it('H-R12b K5 30–70 % des trockenen Sands (s ≥ WET_SAND + 1) tragen Präsenz > 0,5 (Seeds 1–10 gepoolt)', () => {
    const sa = LAND.indexOf('sand');
    let dry = 0,
      hi = 0;
    const none: number[] = [];
    for (const seed of SEEDS) {
      const { g } = gridOf(seed);
      let any = 0;
      for (let k = 0; k < g.cls.length; k++) {
        if (g.cls[k] !== sa + 1 || g.smooth[k]! < WET_SAND + 1) continue;
        dry++;
        if (g.dpres[k]! > 0.5) {
          hi++;
          any++;
        }
      }
      if (any === 0) none.push(seed);
    }
    expect(dry).toBeGreaterThan(50_000);
    expect(hi / dry).toBeGreaterThanOrEqual(0.3);
    expect(hi / dry).toBeLessThanOrEqual(0.7);
    expect(none, 'Seeds ohne jede Düne').toEqual([]);
  }, 60_000);
});

describe('H-R12b K6 S6 auf Sand', () => {
  it('H-R12b K6 der gestufte Dünenton ändert sich innerhalb einer Kachel um höchstens 1 Stufe (Seeds 1–10)', () => {
    let tiles = 0;
    for (const seed of SEEDS) {
      const { w, g } = gridOf(seed);
      for (let y = 0; y < home(w).height; y++)
        for (let x = 0; x < home(w).width; x++) {
          if (home(w).tiles[y * home(w).width + x]!.terrain !== 'sand') continue;
          let lo = 99,
            hi = -99,
            pres = 0;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const k = (y * NODES + j) * g.nx + x * NODES + i;
              pres = Math.max(pres, g.dpres[k]!);
              const st = Math.floor(g.dune[k]! + 0.5);
              lo = Math.min(lo, st);
              hi = Math.max(hi, st);
            }
          if (pres <= 0.05) continue;
          tiles++;
          expect(hi - lo, `Seed ${seed} Kachel ${x},${y}`).toBeLessThanOrEqual(1);
        }
    }
    expect(tiles).toBeGreaterThan(1000);
  }, 60_000);
});

describe('H-R12b K2/K3 Pixel (Zoom 2)', () => {
  const ZOOM = 2;
  const T = 10;
  /** Ausschnitt bei Zoom 2: RGBA, Dünenpräsenz je Pixel (bilinear aus den Knoten wie in `paintPixels`). */
  function paintWindow(seed: number, shade = true) {
    const { g } = gridOf(seed);
    const { tx, ty } = duneWindow(seed, T);
    const g2 = shade ? g : { ...g, shade: g.shade.map(() => 0) };
    const px0 = tx * TEX * ZOOM,
      py0 = ty * TEX * ZOOM,
      W = T * TEX * ZOOM;
    const out = paintPixels(g2, ZOOM, px0, py0, W, W);
    const pres = new Float32Array(W * W);
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const gx = (px0 + x + 0.5) / ZOOM / RASTER,
          gy = (py0 + y + 0.5) / ZOOM / RASTER;
        const i = Math.min(Math.max(Math.floor(gx), 0), g.nx - 2),
          j = Math.min(Math.max(Math.floor(gy), 0), g.ny - 2);
        const fx = gx - i,
          fy = gy - j,
          a = j * g.nx + i;
        pres[y * W + x] =
          g.dpres[a]! * (1 - fx) * (1 - fy) +
          g.dpres[a + 1]! * fx * (1 - fy) +
          g.dpres[a + g.nx]! * (1 - fx) * fy +
          g.dpres[a + g.nx + 1]! * fx * fy;
      }
    return { out, pres, W, px0, py0 };
  }

  it('H-R12b K2 Lichtseite warm, Schattenseite kühler und dunkler als ohne Düne; Maximalton ≤ sandDry + 1 Stufe', () => {
    const dry = rgbOf(PALETTE.sandDry);
    const lDry = luma(dry[0], dry[1], dry[2]);
    const blueOf = (r: number, g: number, b: number) => b / (r + g + b);
    let found = 0;
    for (const seed of [1, 3, 5, 7]) {
      const { g } = gridOf(seed);
      const { tx, ty } = duneWindow(seed, T);
      const W = T * TEX * ZOOM,
        px0 = tx * TEX * ZOOM,
        py0 = ty * TEX * ZOOM;
      const base = { ...g, shade: g.shade.map(() => 0) };
      const on = paintPixels(base, ZOOM, px0, py0, W, W);
      const off = paintPixels({ ...base, dpres: g.dpres.map(() => 0) }, ZOOM, px0, py0, W, W);
      const { pres } = paintWindow(seed, false);
      let maxL = 0;
      const lee = { n: 0, dL: 0, dB: 0 },
        lit = { n: 0, dL: 0, dB: 0 };
      for (let k = 0; k < W * W; k++) {
        if (pres[k]! < 0.6) continue;
        const r = on[k * 4]!,
          gg = on[k * 4 + 1]!,
          b = on[k * 4 + 2]!;
        const r0 = off[k * 4]!,
          g0 = off[k * 4 + 1]!,
          b0 = off[k * 4 + 2]!;
        if (r0 < 150 || g0 < 120 || r0 - b0 < 25) continue; // nur Sandpixel
        maxL = Math.max(maxL, luma(r, gg, b));
        const dL = luma(r, gg, b) - luma(r0, g0, b0);
        const acc = dL < -10 ? lee : dL > 3 ? lit : null;
        if (!acc) continue;
        acc.n++;
        acc.dL += dL;
        acc.dB += blueOf(r, gg, b) - blueOf(r0, g0, b0);
      }
      expect(maxL, `Seed ${seed} Maximalton`).toBeLessThanOrEqual(lDry * 1.085 + 2);
      if (lee.n < 100) continue;
      found++;
      // Schattenseite: mindestens eine Stufe dunkler (≈ −8 %) und kühler (Blauanteil höher) als ohne Düne
      expect(lee.dL / lee.n, `Seed ${seed} Schatten dunkler`).toBeLessThan(-12);
      expect(lee.dB / lee.n, `Seed ${seed} Schatten kühler (Blauanteil)`).toBeGreaterThan(0.0005);
      if (lit.n >= 100)
        expect(lit.dB / lit.n, `Seed ${seed} Licht nicht kühler`).toBeLessThan(0.0005);
    }
    expect(found, 'Seeds mit Schattenseite').toBeGreaterThanOrEqual(2);
  }, 60_000);

  it('H-R12b K3 stetig: Kantenenergie an Knotenlinien (px mod 8 ∈ {0,1,7}) und Kachelgrenzen je ≤ 1,3 × Mittel, Achsindex ≤ 1,05 (Dünenpixel, Seeds 1–10)', () => {
    const NODE_PX = RASTER * ZOOM,
      TILE_PX = TEX * ZOOM;
    let all = 0,
      nAll = 0,
      nodeE = 0,
      nNode = 0,
      tileE = 0,
      nTile = 0,
      ax = 0,
      dg = 0;
    for (const seed of SEEDS) {
      const { out, pres, W, px0, py0 } = paintWindow(seed);
      const L = new Float32Array(W * W);
      for (let k = 0; k < W * W; k++) L[k] = luma(out[k * 4]!, out[k * 4 + 1]!, out[k * 4 + 2]!);
      const dune = (x: number, y: number) => pres[y * W + x]! > 0.2;
      const near = (q: number, period: number) =>
        q % period === 0 || q % period === 1 || q % period === period - 1;
      for (let y = 1; y < W - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (!dune(x, y)) continue;
          const l = L[y * W + x]!;
          if (dune(x + 1, y)) {
            const d = (L[y * W + x + 1]! - l) ** 2;
            all += d;
            nAll++;
            if (near(px0 + x + 1, NODE_PX)) {
              nodeE += d;
              nNode++;
            }
            if (near(px0 + x + 1, TILE_PX)) {
              tileE += d;
              nTile++;
            }
          }
          if (dune(x, y + 1)) {
            const d = (L[(y + 1) * W + x]! - l) ** 2;
            all += d;
            nAll++;
            if (near(py0 + y + 1, NODE_PX)) {
              nodeE += d;
              nNode++;
            }
            if (near(py0 + y + 1, TILE_PX)) {
              tileE += d;
              nTile++;
            }
          }
          if (dune(x + 1, y) && dune(x, y + 1) && dune(x + 1, y + 1) && dune(x - 1, y + 1)) {
            ax += Math.abs(L[y * W + x + 1]! - l) + Math.abs(L[(y + 1) * W + x]! - l);
            dg +=
              (Math.abs(L[(y + 1) * W + x + 1]! - l) + Math.abs(L[(y + 1) * W + x - 1]! - l)) /
              Math.SQRT2;
          }
        }
    }
    const mean = all / nAll;
    expect(nodeE / nNode / mean, 'Knotenlinien').toBeLessThanOrEqual(1.3);
    expect(tileE / nTile / mean, 'Kachelgrenzen').toBeLessThanOrEqual(1.3);
    expect(dg / ax, 'Achsindex').toBeLessThanOrEqual(1.05);
  }, 120_000);
});

describe('H-R12b K7 Teil-Neuzeichnung mit Dünen', () => {
  it('H-R12b K7 patchGrid im Rechteck ergibt dasselbe Raster und dieselben Pixel wie der Vollaufbau; SMOOTH_BORDER wächst höchstens um 1', () => {
    expect(SMOOTH_BORDER).toBeLessThanOrEqual(2 + 1);
    const w = createWorld(5, { unlockAll: true });
    const full0 = buildGrid(fieldWorld(w));
    // dünenreichste Sandkachel (Präsenz im Knoten der Kachelmitte), sie wird zu Gras
    const sa = LAND.indexOf('sand');
    let best = -1,
      bx = 0,
      by = 0;
    for (let y = 2; y < home(w).height - 2; y++)
      for (let x = 2; x < home(w).width - 2; x++) {
        if (home(w).tiles[y * home(w).width + x]!.terrain !== 'sand') continue;
        const v = full0.dpres[(y * NODES + NODES / 2) * full0.nx + x * NODES + NODES / 2]!;
        if (v > best) {
          best = v;
          bx = x;
          by = y;
        }
      }
    expect(best).toBeGreaterThan(0.5);
    expect(sa).toBeGreaterThanOrEqual(0);
    const fields = terrainFields(fieldWorld(w));
    const grid = buildGrid(fieldWorld(w), fields);
    const prev = terrainCodes(fieldWorld(w));
    home(w).tiles[by * home(w).width + bx]!.terrain = 'grass';
    const next = terrainCodes(fieldWorld(w));
    const rect = terrainPatchRect(prev, next, home(w).width, home(w).height)!;
    patchGrid(fieldWorld(w), fields, grid, prev, next, rect);
    const full = buildGrid(fieldWorld(w));
    for (const f of ['dune', 'dpres', 'dphase', 'smooth', 'tone', 'shade', 'cls'] as const)
      expect(firstDiff(grid[f], full[f]), f).toBe(-1);
    const x0 = rect.x0 * TEX,
      y0 = rect.y0 * TEX,
      pw = (rect.x1 - rect.x0 + 1) * TEX,
      ph = (rect.y1 - rect.y0 + 1) * TEX;
    expect(
      firstDiff(paintPixels(grid, 1, x0, y0, pw, ph), paintPixels(full, 1, x0, y0, pw, ph)),
    ).toBe(-1);
    // die Düne verschwindet an der geänderten Kachel (Vergleich mit vorher: Raster hat sich dort geändert)
    expect(firstDiff(full0.dpres, full.dpres)).toBeGreaterThanOrEqual(0);
  }, 60_000);
});

function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return Math.min(a.length, b.length);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
  return -1;
}
