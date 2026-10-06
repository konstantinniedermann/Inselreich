import { fieldWorld } from '../../src/render/terrainField';
import { meadowTint } from '../../src/render/terrain';
import { FLOWER_TONES } from '../../src/render/groundDecor';
import { rotNoise } from '../../src/render/light';
import { beforeAll, describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { MIN_MOUNTAIN_PATCH } from '../../src/sim/defs/map';
import type { BuildingDefId, World } from '../../src/sim/types';
import { home, createWorld } from '../../src/sim/world';
import { centerOn, type Camera } from '../../src/render/camera';
import {
  ISO_H,
  ISO_W,
  buildingHulls,
  depthKey,
  pickBuilding,
  project,
  sortedObjects,
  type Moving,
  type SortedItem,
} from '../../src/render/iso';
import { MASSIF_CACHE_MAX_BYTES, MASSIF_MAX_SCALE } from '../../src/render/limits';
import { TREE_H } from '../../src/render/trees';
import { PALETTE, SIGNAL_NAMES, rgbOf, rgbOfCss } from '../../src/render/palette';
import {
  AMP_CAP,
  MASSIF_MAX_H,
  PIECE_RUN,
  RIM_H,
  SMALL_MASSIF,
  SUB,
  cellColor,
  massifData,
  massifPieces,
  massifTreeMask,
  massifTrees,
  nodeHeight,
  nodeInside,
  pieceCells,
  pieceNodes,
  DEBRIS,
  DEBRIS_HI,
  EDGE_COLORS,
  MEADOW,
  footRadius,
  HILL_AMP,
  ROCK_TONES,
  SNOW_TONES,
  SOFT_CUT,
  TONE_FLAT,
  debrisOf,
  toneStep,
  type MassifComponent,
  type MassifData,
  type MassifPiece,
} from '../../src/render/massif';
import {
  createMassifCache,
  treeLobes,
  massifBounds,
  massifOnScreen,
  massifSilhouette,
  pieceQuads,
  grainAt,
  rasterPiece,
  setMassifCanvasFactory,
  strataAt,
  type MassifItem,
} from '../../src/render/rocks';
import { render } from '../../src/render/renderer';
import { setCanvasFactory as setTreeCanvasFactory } from '../../src/render/trees';
import { targetTile } from '../../src/ui/target';
import { fakeCtx, type P } from './fakeCtx';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
import kernFixture from './fixtures/massif-kern-main.json';
import { KERN_SEEDS, bandNoise, kernNodes } from './fixtures/massifKern';

// H-R9 Teil A — Gebirgsmassiv als Höhenfeld je Zusammenhangskomponente (Kurz-Spec A1–A8).

const fakeCanvas = (): HTMLCanvasElement => {
  const { ctx } = fakeCtx();
  return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
};
beforeAll(() => {
  setTreeCanvasFactory(fakeCanvas);
  setMassifCanvasFactory(fakeCanvas);
});

/** Leere Welt (alles Gras, keine Gebäude) mit `rows` ab (ox, oy): M Gebirge, F Wald, ~ Wasser, S Sand, sonst Gras. */
function scene(rows: string[], ox = 10, oy = 10, seed = 5): World {
  const w = createWorld(seed, { unlockAll: true });
  for (const t of home(w).tiles) {
    t.terrain = 'grass';
    t.buildingId = null;
    t.road = false;
  }
  w.buildings = {};
  const T = { M: 'mountain', F: 'forest', '~': 'water', S: 'sand' } as const;
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      const t = home(w).tiles[(oy + y) * home(w).width + ox + x]!;
      t.terrain = c in T ? T[c as keyof typeof T] : 'grass';
    }),
  );
  return w;
}
let nextId = 500;
function put(w: World, defId: BuildingDefId, x: number, y: number): boolean {
  const d = BUILDING_DEFS[defId];
  if (x < 0 || y < 0 || x + d.w > home(w).width || y + d.h > home(w).height) return false;
  const tiles = [];
  for (let dy = 0; dy < d.h; dy++)
    for (let dx = 0; dx < d.w; dx++) tiles.push(home(w).tiles[(y + dy) * home(w).width + x + dx]!);
  // wie `checkGround` der Sim: Gebirge und Wasser sind kein Bauland
  if (
    tiles.some(
      (t) => t.buildingId !== null || t.road || t.terrain === 'water' || t.terrain === 'mountain',
    )
  )
    return false;
  const id = nextId++;
  w.buildings[id] = { id, defId, x, y, connected: true, progress: 0, state: 'ok', island: 0 };
  for (const t of tiles) t.buildingId = id;
  w.nextBuildingId = nextId;
  return true;
}
const square = (n: number): World => scene(Array.from({ length: n }, () => 'M'.repeat(n)));
const largest = (w: World): MassifComponent =>
  [...massifData(fieldWorld(w)).comps].sort((a, b) => b.n - a.n)[0]!;
/** Alle Knoten (globale Knotenkoordinaten) im Rechteck der Komponente. */
function* nodes(c: MassifComponent): Generator<[number, number]> {
  for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
    for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) yield [I, J];
}
const maxH = (c: MassifComponent): number => {
  let m = 0;
  for (const [I, J] of nodes(c)) m = Math.max(m, nodeHeight(c, I, J));
  return m;
};
const massifItems = (w: World, moving: readonly Moving[] = []): MassifItem[] =>
  sortedObjects(w, moving).filter((i): i is MassifItem => i.kind === 'massif');
const lum = (css: string): number => {
  const [r, g, b] = rgbOfCss(css);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
const dist3 = (a: number[], b: number[]): number =>
  Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);

describe('H-R9 A1 Komponenten', () => {
  it('A1 4er-Nachbarschaft, deterministisch, Reihenfolge nach kleinstem Kachelindex', () => {
    const rows = ['MM..M', 'MM...', '..M..', '...MM'];
    const a = massifData(fieldWorld(scene(rows))),
      b = massifData(fieldWorld(scene(rows)));
    const sets = a.comps.map((c) =>
      [...c.tiles].map((i) => `${(i % 64) - 10},${Math.floor(i / 64) - 10}`),
    );
    expect(sets).toEqual([['0,0', '1,0', '0,1', '1,1'], ['4,0'], ['2,2'], ['3,3', '4,3']]);
    expect(b.comps.map((c) => [...c.tiles])).toEqual(a.comps.map((c) => [...c.tiles]));
    expect(a.comps.map((c) => c.n)).toEqual([4, 1, 1, 2]);
  });

  it('A1 gemerkt je Welt und Geländeabbild: Bauen und Wege lösen keinen Neubau aus, neues Gebirge schon', () => {
    const w = square(6);
    const d = massifData(fieldWorld(w));
    expect(massifData(fieldWorld(w))).toBe(d);
    put(w, 'house', 30, 30);
    home(w).tiles[31 * 64 + 30]!.road = true;
    expect(massifData(fieldWorld(w))).toBe(d);
    home(w).tiles[40 * 64 + 40]!.terrain = 'mountain';
    expect(massifData(fieldWorld(w))).not.toBe(d);
  });
});

describe('H-R9 A2 Höhenfeld', () => {
  it('A2 h = 0 an der Komponentengrenze, h ≥ 0 innen, h > 0 ab einer halben Kachel Randabstand', () => {
    for (const w of [
      createWorld(7, { unlockAll: true }),
      square(5),
      scene(['MMM.', 'M.MM', 'MMMM']),
    ])
      for (const c of massifData(fieldWorld(w)).comps)
        for (const [I, J] of nodes(c)) {
          const h = nodeHeight(c, I, J);
          if (!nodeInside(c, I, J)) expect(h, `${I},${J}`).toBe(0);
          else expect(h).toBeGreaterThanOrEqual(0);
        }
    const c = largest(square(8));
    // Knoten in der Mitte einer Kachel im Innern (Randabstand ≥ 0,5 Kachel)
    expect(nodeHeight(c, (c.x0 + 1) * SUB + 2, (c.y0 + 1) * SUB + 2)).toBeGreaterThan(0);
    expect(nodeHeight(c, (c.x0 + 4) * SUB, (c.y0 + 4) * SUB)).toBeGreaterThan(0);
  });

  it('A2 Amplitude wächst mit der Grösse; kleine Komponente (< SMALL_MASSIF) bleibt niedriger Felshügel', () => {
    const sizes = [1, 2, 3, 4, 6, 9, 14];
    const hs = sizes.map((n) => maxH(largest(square(n))));
    for (let i = 1; i < hs.length; i++) expect(hs[i]!, `n=${sizes[i]}`).toBeGreaterThan(hs[i - 1]!);
    for (const [i, n] of sizes.entries())
      if (n * n < SMALL_MASSIF) expect(hs[i]!).toBeLessThan(ISO_H);
    expect(hs.at(-1)!).toBeGreaterThan(2.5 * ISO_H);
    // gedeckelt: sehr grosse Massive erreichen AMP_CAP, keine Höhe über MASSIF_MAX_H
    const huge = largest(square(30));
    expect(huge.amp).toBe(AMP_CAP);
    expect(maxH(huge)).toBeLessThanOrEqual(MASSIF_MAX_H);
    expect(SMALL_MASSIF).toBe(MIN_MOUNTAIN_PATCH); // H-S1; kleinere Flecken nur aus alten Spielständen
    // gleicher Codepfad: der Hügel ist rund (Gipfel innen, nicht am Rand)
    const hill = largest(square(2));
    expect(nodeHeight(hill, (hill.x0 + 1) * SUB, (hill.y0 + 1) * SUB)).toBeCloseTo(maxH(hill), -1);
  });

  it('A2 Felshügel (Playtest R3): Fleck aus 8 Kacheln hat 1–3 Kuppen, Gipfel ≥ 0,8 ISO_H, Licht- und Schattenseite, Geröll am Fuss, heller Rand', () => {
    const shapes = [
      ['MMM', 'MMM', '.MM'],
      ['MMMMMMMM'], // schmaler Streifen wie im Playtest-Bild 09
      ['MMMM', '.MMMM'],
      ['M..', 'MMM', 'MMM', '.M.'],
    ];
    for (const [k, rows] of shapes.entries())
      for (const seed of [5, 11]) {
        const w = scene(rows, 20, 20, seed);
        const c = largest(w);
        expect(c.n).toBeLessThan(SMALL_MASSIF);
        const top = maxH(c);
        expect(top, `Form ${k} Seed ${seed}`).toBeGreaterThanOrEqual(0.8 * ISO_H);
        expect(top).toBeLessThan(1.3 * ISO_H);
        let peaks = 0;
        for (const [I, J] of nodes(c)) {
          const h = nodeHeight(c, I, J);
          if (h < 0.5 * top) continue;
          let max = true;
          for (let dj = -2; dj <= 2 && max; dj++)
            for (let di = -2; di <= 2; di++)
              if ((di || dj) && nodeHeight(c, I + di, J + dj) >= h) {
                max = false;
                break;
              }
          if (max) peaks++;
        }
        expect(peaks, `Form ${k} Seed ${seed}`).toBeGreaterThanOrEqual(1);
        expect(peaks, `Form ${k} Seed ${seed}`).toBeLessThanOrEqual(3);
        let lit = 0,
          shade = 0,
          rub = 0,
          dark = 0;
        // L2 (Spec 2.2(3)): der Fuss mischt stärker ins Nachbargelände (Wiese mit Kies); nie dunkler als die Wiese
        const rockL = Math.min(lum(PALETTE.rock), lum(`rgb(${EDGE_COLORS[1]!.join(',')})`));
        for (const p of massifPieces(fieldWorld(w))) {
          const at = pieceNodes(p);
          for (const cell of pieceCells(p)) {
            const nd = at(cell.I, cell.J);
            if (nd.t > TONE_FLAT + 0.5) lit++;
            if (nd.t < TONE_FLAT - 0.5) shade++;
            if (nd.rub > 0.3) rub++;
            const css = `rgb(${nd.c.map((v) => Math.round(v)).join(',')})`;
            if (nd.soft < 0.62 && lum(css) < rockL - 5) dark++;
          }
        }
        expect(lit, `Form ${k} Lichtseite`).toBeGreaterThan(0);
        expect(shade, `Form ${k} Schattenseite`).toBeGreaterThan(0);
        expect(rub, `Form ${k} Geröll`).toBeGreaterThan(0);
        expect(dark, `Form ${k} dunkler Rand`).toBe(0);
      }
    expect(HILL_AMP).toBeGreaterThanOrEqual(0.8 * ISO_H);
  });

  it('A2 schmale Felsflecken (Playtest R5): Linien 1 × 8, 2 × 5, 2 × 7 längs x und y haben Gipfel ≥ 0,8 ISO_H, Lichtseite, keine dunklen flachen Oberseiten', () => {
    const shapes: string[][] = [
      ['MMMMMMMM'],
      Array.from({ length: 8 }, () => 'M'),
      ['MMMMM', 'MMMMM'],
      Array.from({ length: 5 }, () => 'MM'),
      ['MMMMMMM', 'MMMMMMM'],
    ];
    for (const [k, rows] of shapes.entries())
      for (const seed of [5, 11, 23]) {
        const w = scene(rows, 20, 20, seed);
        const c = largest(w);
        expect(maxH(c), `Form ${k} Seed ${seed}`).toBeGreaterThanOrEqual(0.8 * ISO_H);
        let lit = 0,
          n = 0,
          darkTop = 0;
        for (const p of massifPieces(fieldWorld(w))) {
          const at = pieceNodes(p);
          for (const cell of pieceCells(p)) {
            const nd = at(cell.I, cell.J);
            if (nd.h < 0.3 * c.amp) continue;
            n++;
            if (nd.t > TONE_FLAT + 0.5) lit++;
            if (nd.steep < 0.3 && nd.h > 0.6 * c.amp && nd.t < TONE_FLAT - 0.5) darkTop++;
          }
        }
        expect(lit / n, `Form ${k} Seed ${seed} Lichtseite`).toBeGreaterThan(0.05);
        expect(darkTop, `Form ${k} Seed ${seed} dunkle Oberseite`).toBe(0);
      }
  });

  it('A2 Höhenstaffelung: Rückseite (kleineres x + y) im Mittel höher als Vorderseite, je Randabstand-Band verglichen (Entscheid lead-art R1: sonst bestimmt die Umrissform das Mittel)', () => {
    // Vergleich je Randabstand-Band (halbe Kachel): die Form der Komponente (z. B. schmaler Rücken, breite Front)
    // soll das Ergebnis nicht bestimmen; zusätzlich für das Quadrat der reine Mittelwert je Hälfte.
    const worlds = [
      square(14),
      createWorld(7, { unlockAll: true }),
      createWorld(14, { unlockAll: true }),
    ];
    for (const w of worlds) {
      const c = largest(w);
      let sMin = Infinity,
        sMax = -Infinity;
      for (const [I, J] of nodes(c))
        if (nodeInside(c, I, J)) {
          sMin = Math.min(sMin, I + J);
          sMax = Math.max(sMax, I + J);
        }
      const mid = (sMin + sMax) / 2;
      const bands = new Map<number, { b: number; nb: number; f: number; nf: number }>();
      let back = 0,
        nb = 0,
        front = 0,
        nf = 0;
      for (const [I, J] of nodes(c)) {
        if (!nodeInside(c, I, J)) continue;
        const h = nodeHeight(c, I, J);
        const d = c.dist[(J - c.y0 * SUB) * c.nx + I - c.x0 * SUB]!;
        const band = bands.get(Math.round(d * 2)) ?? { b: 0, nb: 0, f: 0, nf: 0 };
        if (I + J < mid) {
          back += h;
          nb++;
          band.b += h;
          band.nb++;
        } else if (I + J > mid) {
          front += h;
          nf++;
          band.f += h;
          band.nf++;
        }
        bands.set(Math.round(d * 2), band);
      }
      let ratio = 0,
        weight = 0;
      for (const v of bands.values())
        if (v.nb > 4 && v.nf > 4 && v.f > 0) {
          const wgt = Math.min(v.nb, v.nf);
          ratio += (v.b / v.nb / (v.f / v.nf)) * wgt;
          weight += wgt;
        }
      expect(ratio / weight, `Seed ${w.seed}`).toBeGreaterThan(1.2);
      if (w.seed === 5) expect(back / nb).toBeGreaterThan(1.2 * (front / nf));
    }
  });

  it('A2 kein Kachelraster: Krümmung an Kachelkanten nicht grösser als innerhalb der Kacheln', () => {
    const c = largest(createWorld(7, { unlockAll: true }));
    let edge = 0,
      ne = 0,
      inner = 0,
      ni = 0;
    for (const [I, J] of nodes(c)) {
      if (!nodeInside(c, I - 1, J) || !nodeInside(c, I + 1, J) || !nodeInside(c, I, J)) continue;
      const d2 = Math.abs(
        nodeHeight(c, I - 1, J) - 2 * nodeHeight(c, I, J) + nodeHeight(c, I + 1, J),
      );
      if (I % SUB === 0) {
        edge += d2;
        ne++;
      } else {
        inner += d2;
        ni++;
      }
    }
    expect(edge / ne).toBeLessThan(1.5 * (inner / ni));
  });

  it('A2 Grate und Gipfel: grosses Massiv hat mehrere lokale Gipfel', () => {
    const c = largest(createWorld(7, { unlockAll: true }));
    const top = maxH(c);
    let peaks = 0;
    for (const [I, J] of nodes(c)) {
      const h = nodeHeight(c, I, J);
      if (h < 0.35 * top) continue;
      let max = true;
      for (let dj = -2; dj <= 2 && max; dj++)
        for (let di = -2; di <= 2; di++)
          if ((di || dj) && nodeHeight(c, I + di, J + dj) >= h) {
            max = false;
            break;
          }
      if (max) peaks++;
    }
    expect(peaks).toBeGreaterThanOrEqual(3);
  });

  it('A2 Nebengrate und Vorberge über das ganze Massiv: lokale Gipfel in mindestens drei Vierteln des Rechtecks', () => {
    for (const seed of [7, 14]) {
      const c = largest(createWorld(seed, { unlockAll: true }));
      const top = maxH(c);
      const quads = new Set<number>();
      let peaks = 0;
      const mx = ((c.x0 + c.x1 + 1) / 2) * SUB,
        my = ((c.y0 + c.y1 + 1) / 2) * SUB;
      for (const [I, J] of nodes(c)) {
        const h = nodeHeight(c, I, J);
        if (h < 0.2 * top) continue;
        let max = true;
        for (let dj = -3; dj <= 3 && max; dj++)
          for (let di = -3; di <= 3; di++)
            if ((di || dj) && nodeHeight(c, I + di, J + dj) >= h) {
              max = false;
              break;
            }
        if (!max) continue;
        peaks++;
        quads.add((I < mx ? 0 : 1) + (J < my ? 0 : 2));
      }
      expect(peaks, `Seed ${seed}`).toBeGreaterThanOrEqual(6);
      expect(quads.size, `Seed ${seed}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('L2 Fuss: Randabstand, bei dem der Körper 24 % der Amplitude erreicht, ≥ 1,6 Kacheln (AK L2 angepasst, Entscheid lead-art, D an L0; ersetzt A2 „kein breiter flacher Saum“, Spec 2.2(2) hebt den Playtest-R3-Entscheid auf)', () => {
    for (const seed of [7, 14]) {
      const c = largest(createWorld(seed, { unlockAll: true }));
      const d: number[] = [];
      for (const [I, J] of nodes(c)) {
        const k = (J - c.y0 * SUB) * c.nx + I - c.x0 * SUB;
        if (c.dist[k]! > 0 && Math.abs(nodeHeight(c, I, J) / c.amp - 0.24) < 0.03)
          d.push(c.dist[k]!);
      }
      d.sort((a, b) => a - b);
      expect(d.length, `Seed ${seed}`).toBeGreaterThan(20);
      expect(d[Math.floor(d.length / 2)]!, `Seed ${seed}`).toBeGreaterThanOrEqual(1.6);
    }
  });

  it('L2 Fuss ohne Knick: Median-Steigung je 0,25-Kachel-Band steigt bis Randabstand 2,0 monoton (konkav, Toleranz 10 %), kein Band steiler als 0,5 · Amplitude je Kachel (der Körper ohne Fuss steht dort bei 0,49)', () => {
    // Abweichung vom Auftrag (lead-art): „kein Band steiler als 1,3 × das Band 2,5–3,0“ ist nicht erfüllbar, der Körper
    // verläuft dort fast flach (≈ 5–10 px je Kachel nach der Schulter); als Obergrenze dient die Wandsteilheit vor L2.
    for (const seed of [7, 14]) {
      const c = largest(createWorld(seed, { unlockAll: true }));
      const bands: number[][] = Array.from({ length: 13 }, () => []);
      for (let k = 0; k < c.height.length; k++) {
        const d = c.dist[k]!;
        if (d > 0 && d < 3) bands[Math.floor(d / 0.25)]!.push(c.height[k]!);
      }
      const med = bands.slice(1).map((b) => {
        b.sort((x, y) => x - y);
        return b[b.length >> 1]!;
      });
      const slope = med
        .slice(1)
        .map((h, i) => (h - med[i]!) / 0.25) // Band 0,25·(i+1) → 0,25·(i+2)
        .filter(Number.isFinite);
      const info = `Seed ${seed}: ${slope.map((v) => v.toFixed(0)).join(' ')}`;
      for (let i = 1; i < 7; i++)
        expect(slope[i]!, `${info} Band ${i}`).toBeGreaterThanOrEqual(0.9 * slope[i - 1]!);
      for (const v of slope) expect(v, info).toBeLessThanOrEqual(0.5 * c.amp);
    }
  });

  it('L2 Arm-Spitze (G3): schmale Arme laufen stetig aus, die Höhe folgt der lokalen Breite (kein Einzelkegel an der Spitze)', () => {
    const R = 8; // Knoten: lokale Breite = grösster Randabstand binnen 2 Kacheln
    for (const seed of [7, 14]) {
      const c = largest(createWorld(seed, { unlockAll: true }));
      let dünn = 0;
      for (let j = 0; j < c.ny; j += 1)
        for (let i = 0; i < c.nx; i += 1) {
          const k = j * c.nx + i;
          if (c.dist[k]! <= 0) continue;
          let m = 0;
          for (let b = Math.max(0, j - R); b <= Math.min(c.ny - 1, j + R); b++)
            for (let a = Math.max(0, i - R); a <= Math.min(c.nx - 1, i + R); a++)
              m = Math.max(m, c.dist[b * c.nx + a]!);
          const arm = Math.min(1, Math.max(0, (m - 0.4) / 0.8));
          // Höhe ohne Fuss ≤ 2,5 · Amplitude (Grate mal Staffelung), Geröll ≤ 1 px
          expect(c.height[k]!, `Seed ${seed} Knoten ${i},${j}`).toBeLessThanOrEqual(
            2.5 * c.amp * arm * arm * (3 - 2 * arm) + 1,
          );
          if (m < 1.2) dünn++;
        }
      expect(dünn, `Seed ${seed} dünne Knoten`).toBeGreaterThan(0);
    }
  });
});

describe('H-R9 A3 Färbung', () => {
  const base = { h: 20, hn: 0.4, gx: 0, gy: 0, lap: 0, rim: 1, edge: null };

  it('A3 Lichtseite (zum Licht −x, −y geneigt) heller als flach, Schattenseite dunkler', () => {
    const lit = cellColor(5, 3.3, 4.1, { ...base, gx: 60, gy: 20 }); // Höhe steigt nach +x: Hang schaut nach −x
    const flat = cellColor(5, 3.3, 4.1, base);
    const shade = cellColor(5, 3.3, 4.1, { ...base, gx: -60, gy: -20 });
    expect(lum(lit)).toBeGreaterThan(lum(flat) + 8);
    expect(lum(shade)).toBeLessThan(lum(flat) - 8);
    // auf einen Blick: Lichtseite deutlich heller als Schattenseite, schon bei sanfter Flanke (≈ 16°)
    const lit2 = cellColor(5, 3.3, 4.1, { ...base, gx: 12, gy: 4 }),
      shade2 = cellColor(5, 3.3, 4.1, { ...base, gx: -12, gy: -4 });
    expect(lum(lit) - lum(shade)).toBeGreaterThan(45);
    expect(lum(lit2) - lum(shade2)).toBeGreaterThan(40);
  });

  it('A3 Tonstufen (lead-art R1): 5 Stufen hell aufsteigend, Schatten kühl, Licht warm (sandDry höchstens 20 %)', () => {
    expect(ROCK_TONES).toHaveLength(5);
    const L = ROCK_TONES.map((c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]);
    for (let i = 1; i < L.length; i++) expect(L[i]!).toBeGreaterThan(L[i - 1]! + 10);
    const rock = rgbOf(PALETTE.rock);
    const warmth = (c: readonly number[]): number => c[0]! - c[2]!;
    expect(warmth(ROCK_TONES[0]!)).toBeLessThan(warmth(rgbOf(PALETTE.rockDark)));
    expect(warmth(ROCK_TONES[1]!)).toBeLessThan(warmth(rock));
    expect(warmth(ROCK_TONES[4]!)).toBeGreaterThan(warmth(rgbOf(PALETTE.rockLight)));
    const lim = rgbOf(PALETTE.rockLight).map((v, i) => v + (rgbOf(PALETTE.sandDry)[i]! - v) * 0.2);
    expect(warmth(ROCK_TONES[4]!)).toBeLessThanOrEqual(warmth(lim) + 1);
  });

  it('A3 Stufung: ausserhalb des Übergangs ganzzahlig, Übergang nur um k + 0,5 und höchstens 2 · hw breit', () => {
    for (let t = 0; t <= 4; t += 0.01) {
      const hw = 0.1;
      const v = toneStep(t, hw),
        f = t - Math.floor(t);
      if (Math.abs(f - 0.5) > hw) expect(Math.abs(v - Math.round(v))).toBeLessThan(1e-9);
      expect(v).toBeGreaterThanOrEqual(Math.floor(t) - 1e-9);
      expect(v).toBeLessThanOrEqual(Math.floor(t) + 1 + 1e-9);
    }
    expect(toneStep(2.3, 0)).toBe(2);
    expect(toneStep(2.7, 0)).toBe(3);
    // gerastert: im grossen Massiv liegen höchstens 30 % der Pixel im Übergang zwischen zwei Stufen
    const w = createWorld(14, { unlockAll: true });
    const ps = massifPieces(fieldWorld(w)).filter((_, i) => i % 9 === 0);
    let n = 0,
      mid = 0;
    const tones = ROCK_TONES.map((c) => [...c]);
    for (const p of ps) {
      const b = massifBounds({ piece: p });
      const px = rasterPiece({ piece: p }, 64, Math.ceil(b.h * 2), 2);
      for (let o = 0; o < px.length; o += 4) {
        if (px[o + 3] !== 255) continue;
        n++;
        // Abstand zur nächsten Stufe nach Helligkeit relativ zum Stufenabstand (Textur ±11 % eingerechnet)
        const l = 0.299 * px[o]! + 0.587 * px[o + 1]! + 0.114 * px[o + 2]!;
        const ls = tones.map((c) => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!);
        const d = Math.min(...ls.map((v) => Math.abs(v - l) / v));
        if (d > 0.12) mid++;
      }
    }
    expect(n).toBeGreaterThan(5000);
    expect(mid / n).toBeLessThan(0.3);
    expect(TONE_FLAT).toBe(2);
  });

  it('A3 Schichtbänder (lead-art R1): nur an steilen Flanken, entlang einer Höhenlinie unterbrochen, keine geschlossenen Ringe', () => {
    expect(strataAt(30, 0.2, 0, 10, 10)).toBe(0);
    let off = 0,
      on = 0,
      n = 0;
    // Höhenlinie: gleiche Höhe, voll steil, 600 Weltpixel lang; Phase so gewählt, dass das Band dort liegt
    for (let x = 0; x < 600; x += 1) {
      const v = strataAt(0, 1, 0, x, 0.37 * x);
      n++;
      if (v < 0.05) off++;
      if (v > 0.3) on++;
    }
    expect(off / n).toBeGreaterThan(0.3);
    expect(on / n).toBeGreaterThan(0.15);
  });

  it('A3 Bewuchsflecken nur in tiefen, flachen Lagen; hoch oben nie', () => {
    const w = createWorld(14, { unlockAll: true });
    let low = 0,
      high = 0;
    for (const p of massifPieces(fieldWorld(w))) {
      const at = pieceNodes(p);
      for (const c of pieceCells(p)) {
        const nd = at(c.I, c.J);
        if (nd.veg < 0.5) continue;
        if (nd.h / p.comp.amp > 0.4) high++;
        else low++;
      }
    }
    expect(low).toBeGreaterThan(50);
    expect(high).toBe(0);
  });

  it('A3 Sockel (Playtest R3): innen Felsgrund, am Rand helles Schuttband (heller als rock), leicht zum Nachbargelände getönt, nie dunkel', () => {
    const rock = rgbOf(PALETTE.rock);
    const foot = rgbOfCss(cellColor(5, 2.2, 7.7, { ...base, h: 0, hn: 0 }));
    expect(dist3(foot, rock)).toBeLessThan(30);
    const grass = rgbOf(PALETTE.grass);
    const edgeCss = cellColor(5, 2.2, 7.7, {
      ...base,
      h: 0,
      hn: 0,
      rim: 0,
      edge: grass,
      soft: SOFT_CUT,
    });
    const edge = rgbOfCss(edgeCss);
    const L = (c: readonly number[]): number => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!;
    expect(L(edge)).toBeGreaterThan(L(rock));
    expect(dist3(edge, grass)).toBeLessThan(dist3([...DEBRIS], grass));
    expect(debrisOf(SOFT_CUT)).toBe(1);
    expect(debrisOf(0.9)).toBe(0);
  });

  it('A3 Sockel: Deckkraft < 1 nur an der Kontur (h < RIM_H), an geraden Kanten auf der Kachelgrenze, innen voll deckend (Entscheid lead-art R1, schmal nach Playtest R3)', () => {
    for (const w of [createWorld(7, { unlockAll: true }), square(3), square(10)]) {
      let partial = 0,
        full = 0;
      for (const p of massifPieces(fieldWorld(w))) {
        const at = pieceNodes(p);
        for (const c of pieceCells(p))
          for (const [I, J] of [
            [c.I, c.J],
            [c.I + 1, c.J + 1],
          ] as const) {
            const n = at(I, J);
            if (n.a < 1) {
              partial++;
              expect(n.h, `${I},${J}`).toBeLessThan(RIM_H);
            } else full++;
          }
      }
      if (w.seed !== 5 || largest(w).n > 9) expect(full).toBeGreaterThan(partial);
    }
    // gerade Kante eines Quadrats: die Kontur (SOFT_CUT) liegt auf der Kachelgrenze, einen Knoten innen deckt es voll
    const q = largest(square(10));
    const p = massifPieces(fieldWorld(square(10))).find((x) => x.comp.n === q.n)!;
    expect(pieceNodes(p)((q.x0 + 5) * SUB, q.y0 * SUB).a).toBeLessThanOrEqual(0.55);
    expect(pieceNodes(p)((q.x0 + 5) * SUB, q.y0 * SUB + 1).a).toBe(1);
  });

  it('A3 Sockelfarbe folgt dem Nachbargelände: Aufforsten an einer Randkachel ändert Schlüssel und Farbe, nicht das Höhenfeld', () => {
    const w = scene(['......', '.MMMM.', '.MMMM.', '.MMMM.', '......'], 20, 20);
    const data = massifData(fieldWorld(w));
    const before = new Map(massifPieces(fieldWorld(w)).map((p) => [p.id, p]));
    home(w).tiles[23 * 64 + 25]!.terrain = 'forest'; // rechts neben der Randkachel (24, 23)
    expect(massifData(fieldWorld(w))).toBe(data); // Gebirge unverändert: kein Neubau des Höhenfelds
    const after = massifPieces(fieldWorld(w));
    const changed = after.filter((p) => before.get(p.id)!.key !== p.key);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.length).toBeLessThan(after.length);
    // Farbe an den Randknoten zwischen (24, 23) und (25, 23) wechselt von Wiese zu Waldboden
    let diff = 0;
    for (const p1 of changed) {
      const n0 = pieceNodes(before.get(p1.id)!),
        n1 = pieceNodes(p1);
      for (const c of pieceCells(p1))
        for (const [I, J] of [
          [c.I, c.J],
          [c.I + 1, c.J],
          [c.I + 1, c.J + 1],
          [c.I, c.J + 1],
        ] as const)
          diff = Math.max(diff, dist3([...n0(I, J).c], [...n1(I, J).c]));
    }
    expect(diff).toBeGreaterThan(5);
  });

  it('A3 Felskorn in Weltkoordinaten: gleiche Lage im Nachbarstreifen trägt ein anderes Korn', () => {
    let same = 0,
      n = 0;
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 32; x++) {
        const a = grainAt(9, 0 * 32 + x + 0.5, y + 0.5, 1, 1),
          b = grainAt(9, 1 * 32 + x + 0.5, y + 0.5, 1, 1);
        if (a === b) same++;
        n++;
        expect(grainAt(9, x + 0.25, y + 0.25, 1, 1)).toBe(a); // stetig je Flächenpixel
      }
    expect(same / n).toBeLessThan(0.05);
  });

  it('A3 nur Palettentöne: keine Signalfarben, kein Schnee ausserhalb der Schneemaske (heller als rockLight/foam-Mischung 30 %)', () => {
    const w = createWorld(7, { unlockAll: true });
    const sig = SIGNAL_NAMES.map((n) => rgbOf(PALETTE[n]));
    const snow = rgbOfCss(
      `rgb(${rgbOf(PALETTE.rockLight)
        .map((v, i) => Math.round(v + (rgbOf(PALETTE.foam)[i]! - v) * 0.3))
        .join(',')})`,
    );
    let n = 0;
    for (const p of massifPieces(fieldWorld(w))) {
      const at = pieceNodes(p);
      for (const c of pieceCells(p)) {
        const nd = at(c.I, c.J);
        if (nd.snow >= 0.5) continue; // Schneemaske (L2 T4): eigene Töne, siehe Schnee-Tests
        const css = `rgb(${nd.c.map((v) => Math.round(v)).join(',')})`;
        const col = rgbOfCss(css);
        for (const s of sig) expect(dist3(col, s)).toBeGreaterThan(60);
        expect(lum(css)).toBeLessThanOrEqual(
          0.299 * snow[0]! + 0.587 * snow[1]! + 0.114 * snow[2]! + 1,
        );
        n++;
      }
    }
    expect(n).toBeGreaterThan(1000);
  });
});

describe('H-R9 A4/A5 Teilstücke', () => {
  const W = 64;
  const strips = (p: MassifPiece) => p.strip;
  it('A5 Teilstücke: Läufe von Gebirgskacheln im Halbstreifen, höchstens PIECE_RUN, Schlüssel = vorderste Kachel', () => {
    const w = createWorld(7, { unlockAll: true });
    const items = massifItems(w);
    expect(items.length).toBeGreaterThan(20);
    for (const it of items) {
      const p = it.piece;
      expect(p.tiles.length).toBeGreaterThan(0);
      expect(p.tiles.length).toBeLessThanOrEqual(PIECE_RUN);
      let prevS = -1;
      for (const i of p.tiles) {
        const x = i % W,
          y = Math.floor(i / W);
        const t = home(w).tiles[i]!;
        expect(t.terrain).toBe('mountain');
        expect([strips(p), strips(p) + 1]).toContain(x - y);
        if (prevS >= 0) expect(x + y).toBe(prevS + 1);
        prevS = x + y;
      }
      const f = p.tiles.at(-1)!;
      expect(it.fp).toEqual({ x: f % W, y: Math.floor(f / W), w: 1, h: 1 });
      expect(it.key).toBe(depthKey(it.fp));
    }
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('A5 Teilstücke partitionieren die Netzzellen jeder Gebirgskachel und bleiben im Halbstreifen', () => {
    const w = scene(['MMMMM.', 'MM.MMM', 'MMMMMM', '.MMMM.']);
    expect(put(w, 'house', 12, 11)).toBe(true); // in der Bucht
    const seen = new Map<string, number>();
    for (const p of massifPieces(fieldWorld(w)))
      for (const c of pieceCells(p)) {
        if (c.seam) continue;
        // Zelle (I, J): u = fx − fy in [(I − J − 1)/SUB, (I − J + 1)/SUB]; Teil 1 links, 2 rechts der Mitte
        const lo = (c.I - c.J - (c.part === 2 ? 0 : 1)) / SUB,
          hi = (c.I - c.J + (c.part === 1 ? 0 : 1)) / SUB;
        expect(lo).toBeGreaterThanOrEqual(p.strip - 1e-9);
        expect(hi).toBeLessThanOrEqual(p.strip + 1 + 1e-9);
        const k = `${c.I},${c.J}`;
        seen.set(k, (seen.get(k) ?? 0) + (c.part === 0 ? 2 : 1));
      }
    let free = 0;
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const t = home(w).tiles[y * 64 + x]!;
        const isFree = t.terrain === 'mountain';
        if (isFree) free++;
        for (let J = y * SUB; J < (y + 1) * SUB; J++)
          for (let I = x * SUB; I < (x + 1) * SUB; I++)
            expect(seen.get(`${I},${J}`) ?? 0, `${x},${y}`).toBe(isFree ? 2 : 0);
      }
    expect(free).toBe(20);
  });

  /** Kachelfolge des Halbstreifens k, die eine Grundfläche `fp` mit positiver Fläche schneidet (Tiefen s). */
  const stripDepths = (k: number, fp: { x: number; y: number; w: number; h: number }): number[] => {
    const out: number[] = [];
    for (let b = Math.floor(fp.y); b < fp.y + fp.h; b++)
      for (let a = Math.floor(fp.x); a < fp.x + fp.w; a++) {
        if (a - b !== k && a - b !== k + 1) continue;
        const x0 = Math.max(fp.x, a),
          x1 = Math.min(fp.x + fp.w, a + 1),
          y0 = Math.max(fp.y, b),
          y1 = Math.min(fp.y + fp.h, b + 1);
        if (x1 - x0 < 1e-9 || y1 - y0 < 1e-9) continue;
        const u0 = Math.max(x0 - y1, k),
          u1 = Math.min(x1 - y0, k + 1);
        if (u1 - u0 > 1e-9) out.push(a + b);
      }
    return out;
  };

  it('A5 Property: Gebäude, Bäume und Läufer an Massivrändern und in Buchten liegen im Halbstreifen ganz vor oder hinter jedem Teilstück und werden passend sortiert', () => {
    const w = scene(
      [
        '..........FF......',
        '..MMMMMMM..F......',
        '..M.....MM...MMM..',
        '..M..F...M...M.M..',
        '..M.....MM...MMM..',
        '..MMM.MMM.........',
        '....M.M.....M.....',
        '....MMM....MMM....',
        '.........M..M.....',
        '..MM....MMM.......',
        '...MM....M....MMMM',
        '....MM........M..M',
      ],
      8,
      8,
    );
    // Gebirge ist nicht bebaubar: Steinbruch, Weg, Häuser und Betriebe direkt an den Rändern und in den Buchten
    expect(put(w, 'quarry', 8 + 3, 8 + 2)).toBe(true); // in der Bucht des Rings
    for (let x = 8; x <= 8 + 8; x++) home(w).tiles[(8 + 8) * 64 + x]!.road = true; // Weg am Fuss entlang
    for (let x = 8; x <= 8 + 8; x++)
      expect(home(w).tiles[(8 + 8) * 64 + x]!.terrain).not.toBe('mountain');
    const spots: [BuildingDefId, number, number][] = [];
    for (let y = 6; y < 22; y++)
      for (let x = 8; x < 28; x++) spots.push([(x + y) % 3 === 0 ? 'lumberjack' : 'house', x, y]);
    let k = 0;
    for (const [d, x, y] of spots) if (k++ % 3 === 0) put(w, d, x, y);
    for (const [x, y] of [
      [8 + 4, 8 + 2],
      [8 + 5, 8 + 3],
      [8 + 15, 8 + 3],
    ] as const)
      put(w, 'market', x, y);
    expect(Object.keys(w.buildings).length).toBeGreaterThan(20);
    const free = (x: number, y: number): boolean => {
      const t = home(w).tiles[y * 64 + x];
      return !!t && t.terrain === 'mountain';
    };
    const movers: Moving[] = [];
    let id = 2000;
    for (let y = 6; y < 22; y++)
      for (let x = 6; x < 28; x++) {
        if (free(x, y)) continue;
        movers.push({ kind: 'walker', id: id++, cx: x + 0.5, cy: y + 0.5 });
        if (!free(x + 1, y)) movers.push({ kind: 'walker', id: id++, cx: x + 1, cy: y + 0.5 });
        if (!free(x, y + 1)) movers.push({ kind: 'walker', id: id++, cx: x + 0.5, cy: y + 1 });
      }
    const out = sortedObjects(w, movers);
    const pos = new Map<SortedItem, number>();
    out.forEach((it, i) => pos.set(it, i));
    let checked = 0;
    for (const p of out) {
      if (p.kind !== 'massif') continue;
      const piece = (p as MassifItem).piece;
      const ds = piece.tiles.map((i) => (i % 64) + Math.floor(i / 64));
      const s0 = Math.min(...ds),
        s1 = Math.max(...ds);
      for (const o of out) {
        if (o.kind === 'massif') continue;
        const os = stripDepths(piece.strip, o.fp);
        if (os.length === 0) continue;
        const behind = os.every((s) => s < s0),
          front = os.every((s) => s > s1);
        expect(behind || front, `${o.kind}${o.id} schneidet Teilstück ${p.id}`).toBe(true);
        if (behind)
          expect(pos.get(o)!, `${o.kind}${o.id} hinter ${p.id}`).toBeLessThan(pos.get(p)!);
        else expect(pos.get(o)!, `${o.kind}${o.id} vor ${p.id}`).toBeGreaterThan(pos.get(p)!);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(400);
  });

  it('A4 geschlossene Fläche: jede Grundfläche einer freien Gebirgskachel ist von Netzzellen ihres Halbstreifens bedeckt', () => {
    for (const w of [
      createWorld(7, { unlockAll: true }),
      scene(['MMMM', 'M.MM', 'MMMM', '..M.']),
    ]) {
      const byStrip = new Map<number, P[][]>();
      const pieces = massifPieces(fieldWorld(w));
      for (const p of pieces) {
        const list = byStrip.get(p.strip) ?? [];
        for (const q of pieceQuads(p)) list.push(q.pts);
        byStrip.set(p.strip, list);
      }
      let n = 0;
      for (const p of pieces) {
        const quads = byStrip.get(p.strip)!;
        for (const i of p.tiles) {
          const x = i % 64,
            y = Math.floor(i / 64);
          // Dreieck der Kachelhälfte im Streifen (Weltpixel)
          const right = x - y === p.strip;
          const tri = right
            ? [project(x, y), project(x + 1, y), project(x + 1, y + 1)]
            : [project(x, y), project(x + 1, y + 1), project(x, y + 1)];
          for (const [a, b] of [
            [0.1, 0.1],
            [0.3, 0.3],
            [0.6, 0.2],
            [0.2, 0.6],
            [0.45, 0.45],
            [0.05, 0.9],
            [0.9, 0.05],
          ] as const) {
            const c = 1 - a - b;
            const pt = {
              x: tri[0]!.x * c + tri[1]!.x * a + tri[2]!.x * b,
              y: tri[0]!.y * c + tri[1]!.y * a + tri[2]!.y * b,
            };
            expect(
              quads.some((q) => inPoly(q, pt)),
              `Kachel ${x},${y} Punkt ${a},${b}`,
            ).toBe(true);
            n++;
          }
        }
      }
      expect(n).toBeGreaterThan(50);
    }
  });

  it('A4 keine Antialias-Nähte: gerastert ist jeder Pixel deckend, dessen Abtastpunkte in Netzdreiecken liegen', () => {
    const w = createWorld(7, { unlockAll: true });
    const pieces = massifPieces(fieldWorld(w)).filter((_, i) => i % 7 === 0);
    let inside = 0;
    for (const f of [1, 2]) {
      const ss = f < 1.5 ? 2 : 1;
      for (const p of pieces) {
        const b = massifBounds({ piece: p });
        const pw = Math.round((ISO_W / 2) * f),
          ph = Math.ceil(b.h * f);
        const px = rasterPiece({ piece: p }, pw, ph, f);
        // nur voll deckende Dreiecke (Sockelband blendet gewollt in die Geländeebene aus, eigener Test)
        const tris = pieceQuads(p)
          .filter((q) => q.alpha >= 1)
          .map((q) =>
            q.pts.map((v) => ({
              x: (v.x - b.x) * (pw / (ISO_W / 2)) * ss,
              y: (v.y - b.y) * f * ss,
            })),
          );
        const covered = (x: number, y: number): boolean => tris.some((t) => inTri(t, x, y));
        for (let y = 0; y < ph; y++)
          for (let x = 0; x < pw; x++) {
            let all = true;
            for (let dy = 0; dy < ss && all; dy++)
              for (let dx = 0; dx < ss && all; dx++)
                all = covered(x * ss + dx + 0.5, y * ss + dy + 0.5);
            if (!all) continue;
            inside++;
            expect(px[(y * pw + x) * 4 + 3], `f=${f} Teilstück ${p.id} Pixel ${x},${y}`).toBe(255);
          }
      }
    }
    expect(inside).toBeGreaterThan(2000);
  }, 30_000); // H-T5: CI bis 3,9 s (Default 5 s); lokal CI=true ≈ 1,5 s, Timeout > 3 ×, Reserve für den Runner

  it('A5 Sortierung je Halbstreifen: Teilstücke weiter hinten zuerst, Zellen im Teilstück hinten nach vorn', () => {
    const w = createWorld(7, { unlockAll: true });
    const items = massifItems(w);
    const byStrip = new Map<number, number[]>();
    for (const it of items) {
      const l = byStrip.get(it.piece.strip) ?? [];
      l.push(it.key);
      byStrip.set(it.piece.strip, l);
    }
    for (const l of byStrip.values())
      for (let i = 1; i < l.length; i++) expect(l[i]!).toBeGreaterThan(l[i - 1]!);
    for (const it of items.slice(0, 20)) {
      const cells = pieceCells(it.piece);
      for (let i = 1; i < cells.length; i++)
        expect(cells[i]!.I + cells[i]!.J).toBeGreaterThanOrEqual(cells[i - 1]!.I + cells[i - 1]!.J);
    }
  });
});

describe('H-R9 A6 Cache und Culling', () => {
  const cam: Camera = { x: 0, y: 0, zoom: 1 };
  const mk = () => {
    let made = 0;
    const factory = () => {
      made++;
      return fakeCanvas();
    };
    return { factory, made: () => made };
  };

  it('A6 Treffer im zweiten Frame, neue Fläche nur bei anderer Zoomstufe; Zwischenzoom nutzt die Stufe', () => {
    const w = square(6);
    const items = massifItems(w);
    const f = mk();
    const cache = createMassifCache({ factory: f.factory });
    const { ctx } = fakeCtx();
    const frame = (zoom: number): void => {
      cache.beginFrame(1);
      for (const it of items) cache.draw(ctx, { ...cam, zoom }, it);
    };
    frame(1);
    const n = f.made();
    expect(n).toBe(items.length);
    frame(1);
    expect(f.made()).toBe(n);
    expect(cache.stats().hits).toBeGreaterThanOrEqual(items.length);
    frame(0.9); // Stufe 1
    expect(f.made()).toBe(n);
    frame(2);
    expect(f.made()).toBeGreaterThan(n);
  });

  it('A6 Bytegrenze: LRU hält MASSIF_CACHE_MAX_BYTES (Richtwert 48 MB) bzw. die gesetzte Grenze ein', () => {
    expect(MASSIF_CACHE_MAX_BYTES).toBeLessThanOrEqual(64 * 1024 * 1024);
    expect(MASSIF_CACHE_MAX_BYTES).toBeGreaterThanOrEqual(32 * 1024 * 1024);
    const w = createWorld(7, { unlockAll: true });
    const items = massifItems(w);
    const one = createMassifCache({ factory: fakeCanvas });
    one.beginFrame(2);
    one.draw(fakeCtx().ctx, { ...cam, zoom: 2 }, items[0]!);
    const limit = one.stats().bytes * 6;
    const cache = createMassifCache({ factory: fakeCanvas, maxBytes: limit });
    const { ctx } = fakeCtx();
    for (const it of items) {
      cache.beginFrame(2);
      cache.draw(ctx, { ...cam, zoom: 2 }, it);
      expect(cache.stats().bytes).toBeLessThanOrEqual(limit);
    }
    expect(cache.stats().entries).toBeLessThan(items.length);
  });

  it('A6 bildfüllendes grosses Massiv (Seed 14) passt bei 1920 × 1080 und DPR 2 auf jeder Zoomstufe unter die Grenze: zweiter Frame ohne Neubau', () => {
    const w = createWorld(14, { unlockAll: true });
    const c = largest(w);
    expect(c.n).toBeGreaterThan(400);
    const view = { w: 1920, h: 1080 };
    for (const zoom of [0.5, 1, 1.5, 2]) {
      const cam2: Camera = { x: 0, y: 0, zoom };
      centerOn(cam2, (c.x0 + c.x1 + 1) / 2, (c.y0 + c.y1 + 1) / 2, view, { w: 64, h: 64 });
      const vis = massifItems(w).filter((it) => massifOnScreen(cam2, view, it));
      const cache = createMassifCache({ factory: fakeCanvas, buildsPerFrame: 1e9 });
      const { ctx } = fakeCtx();
      for (let frame = 0; frame < 2; frame++) {
        cache.beginFrame(2);
        for (const it of vis) cache.draw(ctx, cam2, it);
      }
      const st = cache.stats();
      expect(st.misses, `Zoom ${zoom}`).toBe(vis.length);
      expect(st.bytes).toBeLessThanOrEqual(MASSIF_CACHE_MAX_BYTES * 0.75); // Luft für den Zoomwechsel
    }
  });

  it('A6 Rasterfaktor: Zoom 1 bei DPR 2 voll (Faktor 2), erst darüber gedeckelt auf MASSIF_MAX_SCALE (Entscheid lead-art R1: Bytegrenze)', () => {
    const w = square(6);
    const it0 = massifItems(w)[5]!;
    const widths: number[] = [];
    const factory = (): HTMLCanvasElement => {
      const c = fakeCanvas();
      widths.push(-1);
      const i = widths.length - 1;
      return new Proxy(c, {
        set(t, k, v) {
          if (k === 'width') widths[i] = v as number;
          return Reflect.set(t, k, v);
        },
      });
    };
    for (const [zoom, dpr, want] of [
      [1, 2, 64],
      [1, 1, 32],
      [2, 1, 64],
      [2, 2, 32 * MASSIF_MAX_SCALE],
    ] as const) {
      const cache = createMassifCache({ factory });
      cache.beginFrame(dpr);
      cache.draw(fakeCtx().ctx, { x: 0, y: 0, zoom }, it0);
      expect(widths.at(-1), `Zoom ${zoom} DPR ${dpr}`).toBe(want);
    }
  });

  it('A6 Culling je Teilstück über die Bildbox; render zeichnet nur sichtbare Teilstücke, save/restore ausgeglichen', () => {
    const w = createWorld(7, { unlockAll: true });
    const c = largest(w);
    const view = { w: 800, h: 600 };
    const cam2: Camera = { x: 0, y: 0, zoom: 1 };
    centerOn(cam2, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, view, { w: 64, h: 64 });
    const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
    const { ctx, log } = fakeCtx();
    render(ctx, w, cam2, layer, null, null, view, { timeMs: 0 });
    const visible = massifItems(w).filter((it) => {
      const b = massifBounds(it);
      const x = (b.x - cam2.x) * cam2.zoom,
        y = (b.y - cam2.y) * cam2.zoom;
      return x < view.w && x + b.w * cam2.zoom > 0 && y < view.h && y + b.h * cam2.zoom > 0;
    });
    expect(visible.length).toBeGreaterThan(10);
    const draws = log.events.filter((e) => e.op === 'drawImage' && e.points.length === 2);
    const massifDraws = draws.filter((e) => {
      const wpx = e.points[1]!.x - e.points[0]!.x;
      return Math.abs(wpx - (ISO_W / 2) * cam2.zoom) < 1.01;
    });
    expect(massifDraws.length).toBe(visible.length);
    expect(log.saves).toBe(log.restores);
    expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('A6 Halbstreifen auf Gerätepixel: Nachbarstreifen teilen ihre Kante exakt (keine Naht)', () => {
    const w = square(5);
    const items = massifItems(w);
    const cache = createMassifCache({ factory: fakeCanvas });
    const { ctx, log } = fakeCtx();
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const c: Camera = { x: 13.37, y: 7.9, zoom: 0.9 };
    cache.beginFrame(2);
    for (const it of items) cache.draw(ctx, c, it);
    const edges = new Map<number, { l: number; r: number }>();
    log.events
      .filter((e) => e.op === 'drawImage')
      .forEach((e, i) =>
        edges.set(items[i]!.piece.strip, { l: e.points[0]!.x, r: e.points[1]!.x }),
      );
    for (const [k, e] of edges) {
      expect(Number.isInteger(Math.round(e.l * 1e6) / 1e6)).toBe(true);
      const n = edges.get(k + 1);
      if (n) expect(n.l).toBeCloseTo(e.r, 9);
    }
  });
});

describe('H-R9 A7 Picking und Verdeckung', () => {
  it('A7 Picking der Kacheln unverändert: Klick auf die Rautenmitte jeder Gebirgskachel trifft genau diese Kachel (Auswahl, Abriss, Bau)', () => {
    const w = createWorld(7, { unlockAll: true });
    const cam: Camera = { x: -37.5, y: 112.25, zoom: 1.5 };
    let n = 0;
    for (const c of massifData(fieldWorld(w)).comps)
      for (const t of c.tiles) {
        const x = t % 64,
          y = Math.floor(t / 64);
        const p = project(x + 0.5, y + 0.5);
        const sx = (p.x - cam.x) * cam.zoom,
          sy = (p.y - cam.y) * cam.zoom;
        // Auswahl/Abriss treffen zuerst einen Gebäudekörper davor (gewollt); sonst die Gebirgskachel
        const hit = pickBuilding(buildingHulls(w), p.x, p.y);
        const tools =
          hit === null ? (['select', 'demolish', 'road'] as const) : (['road'] as const);
        for (const kind of tools)
          expect(targetTile(w, cam, { kind }, sx, sy), `${x},${y} ${kind}`).toEqual({ x, y });
        n++;
      }
    expect(n).toBeGreaterThan(300);
  });

  it('A7 Silhouette je Teilstück umschliesst alle gezeichneten Zellen (Licht- und Feuerverdeckung)', () => {
    const w = createWorld(7, { unlockAll: true });
    let n = 0;
    for (const it of massifItems(w).slice(0, 60)) {
      const sil = massifSilhouette(it);
      for (const q of pieceQuads(it.piece))
        for (const v of q.pts) {
          // Ecken ausserhalb des Halbstreifens schneidet die Flächenkante ab
          const k = it.piece.strip * (ISO_W / 2);
          if (v.x < k - 1e-9 || v.x > k + ISO_W / 2 + 1e-9) continue;
          expect(inPoly(sil, v) || nearPoly(sil, v, 0.5)).toBe(true);
          n++;
        }
    }
    expect(n).toBeGreaterThan(500);
  });

  it('A7 Fensterlicht hinter dem Massiv steht unter einem Clip mit der Massiv-Silhouette', () => {
    // Haus direkt hinter einem grossen Massiv (12 × 10 Kacheln ab y = 21)
    const w = scene(['............', ...Array.from({ length: 10 }, () => 'MMMMMMMMMMMM')], 20, 20);
    expect(put(w, 'house', 26, 20)).toBe(true);
    const b = Object.values(w.buildings)[0]!;
    b.house = { tier: 3, inhabitants: 20 } as never;
    w.tick = 3600;
    const cam: Camera = { x: 0, y: 0, zoom: 1 };
    const view = { w: 1280, h: 800 };
    centerOn(cam, 26, 23, view, { w: 64, h: 64 });
    const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
    const { ctx, log } = fakeCtx();
    render(ctx, w, cam, layer, null, null, view, { timeMs: 0, dayNight: true });
    const lighter = log.events.filter((e) => e.op === 'fill' && e.composite === 'lighter');
    expect(lighter.length).toBeGreaterThan(0);
    const sils = massifItems(w).map((it) =>
      massifSilhouette(it).map((q) => ({
        x: (q.x - cam.x) * cam.zoom,
        y: (q.y - cam.y) * cam.zoom,
      })),
    );
    const hit = lighter.some((e) =>
      e.clips.some(
        (c) =>
          c.rule === 'evenodd' &&
          sils.some((s) =>
            s.every((p) =>
              c.points.some((q) => Math.abs(p.x - q.x) < 0.01 && Math.abs(p.y - q.y) < 0.01),
            ),
          ),
      ),
    );
    expect(hit).toBe(true);
  });
});

function inPoly(poly: readonly P[], p: P): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}
function nearPoly(poly: readonly P[], p: P, tol: number): boolean {
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
    );
    if (Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y) <= tol) return true;
  }
  return false;
}
function inTri(t: readonly P[], x: number, y: number): boolean {
  const [a, b, c] = t as [P, P, P];
  const d = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  if (Math.abs(d) < 1e-9) return false;
  const w0 = ((b.x - x) * (c.y - y) - (c.x - x) * (b.y - y)) / d,
    w1 = ((c.x - x) * (a.y - y) - (a.x - x) * (c.y - y)) / d;
  return w0 >= 1e-6 && w1 >= 1e-6 && 1 - w0 - w1 >= 1e-6;
}

// ART-STIL-02 L2 (Q2): der Gebirgskern (hn ≥ 0,35) bleibt die Referenz, ausser Schnee- und Baummaske.
/**
 * Fusszone (L2 T1): Randabstand unter dem lokalen Fussradius der Komponente plus ein Knoten Hof (die Höhenlinie des
 * Fusses wirkt über das Gefälle noch einen Knoten weiter). Nur hier darf sich ein Kernknoten ändern oder fehlen.
 */
const inFussZone = (data: MassifData, comp: number, I: number, J: number): boolean => {
  const c = data.comps[comp]!;
  return c.dist[(J - c.y0 * SUB) * c.nx + I - c.x0 * SUB]! < footRadius(c, I, J) + 1 / SUB;
};

describe('ART-STIL-02 L2 Kern', { timeout: 60000 }, () => {
  it('L2 Kern unverändert: ausserhalb von Fusszone, Schnee- und Baummaske sind alle Kernknoten da und gleich (ΔE2000 < 1, |Δh| ≤ 1 px); Fusszone (Ausnahme plus fehlende) ≤ 40 % der Fixture-Knoten', () => {
    type Fx = Record<string, { nodes: number[][] }>;
    for (const seed of KERN_SEEDS) {
      const data = massifData(fieldWorld(createWorld(seed, { unlockAll: true })));
      const now = new Map(kernNodes(seed).map((n) => [`${n.comp}|${n.I}|${n.J}`, n]));
      const all = (kernFixture as Fx)[String(seed)]!.nodes;
      let ausser = 0,
        inZone = 0,
        fehlt = 0,
        verglichen = 0,
        dE = 0,
        dH = 0,
        dEzone = 0,
        nZone = 0;
      for (const r of all) {
        const n = now.get(`${r[0]}|${r[1]}|${r[2]}`);
        if (n?.snow || n?.tree) {
          ausser++;
          continue;
        }
        const zone = inFussZone(data, r[0]!, r[1]!, r[2]!);
        if (zone) inZone++;
        if (!n) {
          if (!zone) fehlt++; // ausserhalb der Zone ein Fehler
          ausser++;
          continue;
        }
        const e = deltaE2000(rgbToLab(n.rgb), rgbToLab([r[4]!, r[5]!, r[6]!]));
        if (zone) {
          ausser++;
          dEzone += e;
          nZone++;
          continue;
        }
        verglichen++;
        dE += e;
        dH += Math.abs(n.h - r[3]!);
      }
      const info = `Seed ${seed}: Zone ${((100 * inZone) / all.length).toFixed(0)} %, Schnee/Baum+Zone ${((100 * ausser) / all.length).toFixed(0)} %, verglichen ${((100 * verglichen) / all.length).toFixed(0)} %, ΔE ${(dE / verglichen).toFixed(2)}, ΔE Zone ${(dEzone / Math.max(1, nZone)).toFixed(1)}`;
      expect(fehlt, `${info} (fehlende ausserhalb der Zone)`).toBe(0);
      expect(dE / verglichen, info).toBeLessThan(1);
      expect(dH / verglichen, `Seed ${seed} |Δh|`).toBeLessThanOrEqual(1);
      expect(inZone / all.length, `${info}: Anteil Fusszone`).toBeLessThanOrEqual(0.4);
    }
  });
});

describe('ART-STIL-02 L2 Kontrast nach Höhe', { timeout: 60000 }, () => {
  it('L2 Kontrast: für Knoten mit hn < 0,2 überspannen die Stufen toneStep(t, 0) höchstens 3 aufeinanderfolgende Werte', () => {
    for (const seed of KERN_SEEDS) {
      const lo: number[] = [];
      let hi = 0;
      for (const p of massifPieces(fieldWorld(createWorld(seed, { unlockAll: true })))) {
        const at = pieceNodes(p);
        for (const c of pieceCells(p)) {
          const nd = at(c.I, c.J),
            hn = nd.h / p.comp.amp;
          if (hn < 0.2) lo.push(toneStep(nd.t, 0));
          else if (hn >= 0.35) hi = Math.max(hi, Math.abs(toneStep(nd.t, 0) - TONE_FLAT));
        }
      }
      expect(lo.length, `Seed ${seed}`).toBeGreaterThan(200);
      expect(Math.max(...lo) - Math.min(...lo), `Seed ${seed}`).toBeLessThanOrEqual(2);
      expect(hi, `Seed ${seed}: oben bleibt der volle Umfang`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('ART-STIL-02 L2 Fuss und Bewuchs', { timeout: 60000 }, () => {
  /** Grösste Komponenten (Seeds 7, 14): Mittelfarbe der Knoten im Fussband gegen die Wiese. */
  it('L2 Fussband ↔ Wiese ΔE2000 ≤ 15: Mittelfarbe der Knoten im Fussband (soft zwischen SOFT_CUT und DEBRIS_HI, h < 2 · RIM_H)', () => {
    const wiese = rgbToLab(meadowTint(rgbOf(PALETTE.grass))); // die gemalte Wiese der Geländeebene (G2)
    for (let q = 0; q < 3; q++)
      expect(MEADOW[q]!).toBeCloseTo(meadowTint(rgbOf(PALETTE.grass))[q]!, 6);
    for (const seed of KERN_SEEDS) {
      const w = createWorld(seed, { unlockAll: true });
      const big = largest(w);
      const sum = [0, 0, 0];
      let n = 0;
      const seen = new Set<string>();
      for (const p of massifPieces(fieldWorld(w))) {
        if (p.comp !== big) continue;
        const at = pieceNodes(p);
        for (const c of pieceCells(p)) {
          const k = `${c.I}|${c.J}`;
          if (seen.has(k)) continue;
          seen.add(k);
          const nd = at(c.I, c.J);
          if (!(nd.soft > SOFT_CUT && nd.soft < DEBRIS_HI && nd.h < 2 * RIM_H)) continue;
          for (let q = 0; q < 3; q++) sum[q]! += nd.c[q]!;
          n++;
        }
      }
      expect(n, `Seed ${seed}`).toBeGreaterThan(30);
      const mean = sum.map((v) => v / n) as [number, number, number];
      expect(deltaE2000(rgbToLab(mean), wiese), `Seed ${seed}`).toBeLessThanOrEqual(15);
    }
  });

  /** Alle eindeutigen Knoten (comp, I, J) der Teilstücke einer Heimatinsel mit ihren Netzwerten. */
  function allNodes(seed: number) {
    const w = createWorld(seed, { unlockAll: true });
    const seen = new Set<string>();
    const out: {
      nd: ReturnType<ReturnType<typeof pieceNodes>>;
      hn: number;
      I: number;
      J: number;
    }[] = [];
    for (const p of massifPieces(fieldWorld(w))) {
      const at = pieceNodes(p);
      for (const c of pieceCells(p)) {
        const k = `${p.comp.id}|${c.I}|${c.J}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const nd = at(c.I, c.J);
        out.push({ nd, hn: nd.h / p.comp.amp, I: c.I, J: c.J });
      }
    }
    return out;
  }

  it('L2 Bewuchs unten: Anteil Bewuchsknoten bei hn < 0,25 in [0,2; 0,35] (± 0,03) für Seeds 7 und 14, Gras bis hn 0,3 in Rinnen und auf Schultern', () => {
    for (const seed of KERN_SEEDS) {
      const low = allNodes(seed).filter((n) => n.hn < 0.25);
      const share = low.filter((n) => n.nd.veg >= 0.5).length / low.length;
      expect(share, `Seed ${seed}`).toBeGreaterThanOrEqual(0.17);
      expect(share, `Seed ${seed}`).toBeLessThanOrEqual(0.38);
    }
    const hoch = KERN_SEEDS.flatMap((s) =>
      allNodes(s).filter((n) => n.hn >= 0.25 && n.hn < 0.32 && n.nd.veg >= 0.5),
    );
    expect(hoch.length).toBeGreaterThan(10);
  });

  it('L2 Bewuchs: bei hn ≥ 0,35 identisch zu vor L2 (veg = 0,25 · Rauschen, nie ≥ 0,5)', () => {
    for (const seed of KERN_SEEDS) {
      const w = createWorld(seed, { unlockAll: true });
      const comp = largest(w);
      const hi = allNodes(seed).filter((n) => n.hn >= 0.35);
      expect(hi.length).toBeGreaterThan(500);
      for (const n of hi.slice(0, 400)) {
        expect(n.nd.veg).toBeCloseTo(
          0.25 * rotNoise(comp.seed + 317, n.I / SUB, n.J / SUB, 1.9, 0.61),
          6,
        );
      }
    }
  });

  it('L2 C5 Alpenwiese: Blütenpunkte (FLOWER_TONES) nur auf Bewuchsflecken, ≤ 3 % der Bewuchspixel, deterministisch, bei f = 2 scharf', () => {
    const tones = FLOWER_TONES.map((c) =>
      rgbOfCss(c)
        .map((v) => Math.round(v))
        .join(','),
    );
    let bloom = 0,
      veg = 0;
    const w = createWorld(14, { unlockAll: true });
    const items = massifItems(w);
    for (const it of items) {
      const b = massifBounds(it);
      const wpx = Math.round((ISO_W / 2) * 2),
        hpx = Math.ceil(b.h * 2);
      const buf = rasterPiece(it, wpx, hpx, 2);
      const again = rasterPiece(it, wpx, hpx, 2);
      expect(Buffer_equal(buf, again)).toBe(true);
      for (let o = 0; o < buf.length; o += 4) {
        if (buf[o + 3] !== 255) continue;
        if (tones.includes(`${buf[o]},${buf[o + 1]},${buf[o + 2]}`)) bloom++;
        else if (buf[o + 1]! > buf[o]! + 8 && buf[o + 1]! > buf[o + 2]! + 20) veg++;
      }
    }
    expect(bloom).toBeGreaterThan(0);
    expect(bloom / (bloom + veg)).toBeLessThanOrEqual(0.03);
  });
});

function Buffer_equal(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

describe('ART-STIL-02 L2 Sockel ohne Pixelrauschen', { timeout: 60000 }, () => {
  it('L2 Sockel: Rauschenergie im Schuttband bei Zoom 2 ≤ 0,5 × Fixture-Wert vor L2, je Seed', () => {
    type Fx = Record<string, { sockelRauschen: number }>;
    for (const seed of KERN_SEEDS) {
      const vorher = (kernFixture as Fx)[String(seed)]!.sockelRauschen;
      const jetzt = bandNoise(seed, DEBRIS_HI);
      expect(vorher, `Seed ${seed} Fixture`).toBeGreaterThan(1);
      expect(
        jetzt,
        `Seed ${seed} jetzt ${jetzt.toFixed(2)} vorher ${vorher.toFixed(2)}`,
      ).toBeLessThanOrEqual(0.5 * vorher);
    }
  });
});

describe('ART-STIL-02 L2 Schnee (C2)', { timeout: 60000 }, () => {
  /** Eindeutige Knoten je Komponente (comp-Index → Knoten). */
  function perComp(seed: number) {
    const w = createWorld(seed, { unlockAll: true });
    const res = new Map<number, { amp: number; n: number; snow: number; hnSnow: number[] }>();
    const seen = new Set<string>();
    for (const p of massifPieces(fieldWorld(w))) {
      const at = pieceNodes(p);
      const r = res.get(p.comp.id) ?? { amp: p.comp.amp, n: 0, snow: 0, hnSnow: [] };
      res.set(p.comp.id, r);
      for (const c of pieceCells(p)) {
        const k = `${p.comp.id}|${c.I}|${c.J}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const nd = at(c.I, c.J);
        r.n++;
        if (nd.snow >= 0.5) {
          r.snow++;
          r.hnSnow.push(nd.h / p.comp.amp);
        }
      }
    }
    return res;
  }

  it('L2 Schnee nur bei amp ≥ 90; Anteil Schneeknoten 2–8 % je Komponente mit amp ≥ 90 (Seeds 1–20 der Heimatinsel)', () => {
    let big = 0;
    for (let seed = 1; seed <= 20; seed++)
      for (const [id, r] of perComp(seed)) {
        if (r.amp < 90) {
          expect(r.snow, `Seed ${seed} Komponente ${id} amp ${r.amp.toFixed(0)}`).toBe(0);
          continue;
        }
        big++;
        const share = r.snow / r.n;
        expect(share, `Seed ${seed} Komponente ${id}`).toBeGreaterThanOrEqual(0.02);
        expect(share, `Seed ${seed} Komponente ${id}`).toBeLessThanOrEqual(0.08);
        expect(
          Math.min(...r.hnSnow),
          `Seed ${seed} Komponente ${id} tiefster Schnee`,
        ).toBeGreaterThanOrEqual(0.5);
      }
    expect(big).toBeGreaterThan(5);
  });

  it('L2 Schnee G4: keine Löcher in der Schneemaske (kein nicht-verschneiter Knoten mit Schnee in allen vier Achsrichtungen binnen 2 Knoten, innerhalb der Schneezone)', () => {
    let holes = 0,
      snowN = 0;
    for (const seed of [7, 14, 2, 18]) {
      const fw = fieldWorld(createWorld(seed, { unlockAll: true }));
      const snow = new Map<string, number>();
      const meta: { k: string; hn: number; cap: number }[] = [];
      for (const p of massifPieces(fw)) {
        const at = pieceNodes(p);
        for (const c of pieceCells(p)) {
          const k = `${p.comp.id}|${c.I}|${c.J}`;
          if (snow.has(k)) continue;
          const nd = at(c.I, c.J);
          snow.set(k, nd.snow >= 0.5 ? 1 : 0);
          if (p.comp.amp >= 90) meta.push({ k, hn: nd.h / p.comp.amp, cap: p.comp.snowHn });
        }
      }
      for (const m of meta) {
        if (snow.get(m.k) || m.hn < m.cap) continue;
        const [id, I, J] = m.k.split('|').map(Number) as [number, number, number];
        const dirs: [number, number][] = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        const surrounded = dirs.every(([dx, dy]) =>
          [1, 2].some((d) => snow.get(`${id}|${I + dx * d}|${J + dy * d}`) === 1),
        );
        if (surrounded) holes++;
      }
      snowN += [...snow.values()].reduce((a, b) => a + b, 0);
    }
    expect(snowN).toBeGreaterThan(500);
    expect(holes).toBe(0);
  });

  it('L2 Schneetöne: Luminanz ≤ foam, 3 Stufen warmweiss bis kühlblau, ΔE2000 ≥ 20 zu den Signalfarben', () => {
    const foam = lum(PALETTE.foam);
    const sig = SIGNAL_NAMES.map((n) => hexToLab(PALETTE[n]));
    expect(new Set(SNOW_TONES.map((t) => t.join(','))).size).toBe(3);
    for (const t of SNOW_TONES) {
      expect(lum(`rgb(${t.map(Math.round).join(',')})`)).toBeLessThanOrEqual(foam + 0.01);
      for (const s of sig)
        expect(deltaE2000(rgbToLab([...t] as [number, number, number]), s)).toBeGreaterThanOrEqual(
          20,
        );
    }
    // Licht warm, Schatten kühl: blauer Anteil im Schatten relativ zum Rot höher
    const [sh, , li] = [SNOW_TONES[0]!, SNOW_TONES[2]!, SNOW_TONES[4]!];
    expect(sh[2] - sh[0]).toBeGreaterThan(li[2] - li[0]);
  });

  it('L2 Schnee im Raster: helle Pixel auf grossen Massiven, nie heller als foam (Luma), kein reines Weiss', () => {
    const w = createWorld(14, { unlockAll: true });
    const foam = lum(PALETTE.foam);
    const fels = lum(`rgb(${ROCK_TONES[4]!.map(Math.round).join(',')})`);
    let schnee = 0,
      maxL = 0;
    for (const it of massifItems(w)) {
      if (it.piece.comp.amp < 90) continue;
      const b = massifBounds(it);
      const buf = rasterPiece(it, Math.round((ISO_W / 2) * 2), Math.ceil(b.h * 2), 2);
      for (let o = 0; o < buf.length; o += 4) {
        if (buf[o + 3] !== 255) continue;
        const l = 0.299 * buf[o]! + 0.587 * buf[o + 1]! + 0.114 * buf[o + 2]!;
        maxL = Math.max(maxL, l);
        if (l > fels + 12) schnee++;
      }
    }
    expect(maxL).toBeLessThanOrEqual(foam + 0.5);
    expect(schnee).toBeGreaterThan(300);
  }, 60000);
});

describe('ART-STIL-02 L2 Krüppelbäume (C3)', { timeout: 60000 }, () => {
  it('L2 Bäume: 3–20 je grossem Massiv, kleine 0–3, deterministisch (Seeds 7 und 14)', () => {
    for (const seed of KERN_SEEDS) {
      const a = massifData(fieldWorld(createWorld(seed, { unlockAll: true })));
      const b = massifData(fieldWorld(createWorld(seed, { unlockAll: true })));
      for (const [i, c] of a.comps.entries()) {
        const n = massifTrees(c).trees.length;
        if (c.amp >= 90 || c.n >= 24) {
          expect(n, `Seed ${seed} Komponente ${i}`).toBeGreaterThanOrEqual(3);
          expect(n, `Seed ${seed} Komponente ${i}`).toBeLessThanOrEqual(20);
        } else expect(n, `Seed ${seed} Komponente ${i} klein`).toBeLessThanOrEqual(3);
        expect(massifTrees(b.comps[i]!).trees, `Seed ${seed} deterministisch`).toEqual(
          massifTrees(c).trees,
        );
        expect(massifTrees(c), 'gemerkt je Komponente').toBe(massifTrees(c));
      }
    }
  });

  it('L2 Bäume: Anker in Bewuchs- oder Rinnenlage, hn 0,08–0,5, steep < 0,7, kein Schnee, Streifen-Mitte ((I − J) mod 4 = 2), Abstand ≥ 1,5 Kacheln', () => {
    for (const seed of KERN_SEEDS) {
      const fw = fieldWorld(createWorld(seed, { unlockAll: true }));
      const pieces = massifPieces(fw);
      for (const c of massifData(fw).comps.filter((k) => k.amp >= 90 || k.n >= 24)) {
        const ts = massifTrees(c).trees;
        const own = pieces.filter((p) => p.comp === c);
        for (const t of ts) {
          expect((((t.I - t.J) % 4) + 4) % 4).toBe(2);
          const p = own.find((q) =>
            pieceCells(q).some((k) => k.I === t.I && k.J === t.J && !k.seam),
          )!;
          expect(p, 'Anker liegt in genau einem Teilstück').toBeDefined();
          const nd = pieceNodes(p)(t.I, t.J);
          const hn = nd.h / c.amp;
          expect(hn).toBeGreaterThanOrEqual(0.08);
          expect(hn).toBeLessThan(0.5);
          expect(nd.veg >= 0.5 || nd.e < -0.3).toBe(true);
          expect(nd.steep).toBeLessThan(0.7);
          expect(nd.snow).toBeLessThan(0.5);
          expect(t.height).toBeGreaterThanOrEqual(14);
          expect(t.height).toBeLessThanOrEqual(20);
          const lo = treeLobes(t);
          const l = Math.min(...lo.map((k) => k.cu - k.rx)),
            r = Math.max(...lo.map((k) => k.cu + k.rx));
          expect(r - l, 'Breite ≤ 12 px').toBeLessThanOrEqual(12);
          expect(Math.max(-l, r), 'im eigenen Halbstreifen (±16 px)').toBeLessThan(16);
          expect(t.height).toBeLessThanOrEqual(TREE_H);
        }
        for (const [i, a] of ts.entries())
          for (const b of ts.slice(i + 1))
            expect(Math.hypot(a.I - b.I, a.J - b.J) / SUB).toBeGreaterThanOrEqual(1.5);
      }
    }
  });

  it('L2 Bäume im Raster: Stamm (earthEdge) und Krone (crown/crownLight) erscheinen bei f = 2 scharf, Baummaske umfasst den Umkreis von 2 Knoten', () => {
    const w = createWorld(14, { unlockAll: true });
    const c = largest(w);
    const { trees, mask } = massifTrees(c);
    expect(trees.length).toBeGreaterThanOrEqual(3);
    for (const t of trees) expect(massifTreeMask(c, t.I + 2, t.J - 2)).toBe(true);
    expect(massifTreeMask(c, trees[0]!.I + 3, trees[0]!.J + 3) || mask.size > 0).toBe(true);
    const want = new Set(
      [PALETTE.earthEdge, PALETTE.crown, PALETTE.crownLight].map((h) =>
        rgbOfCss(h)
          .map((v) => Math.round(v))
          .join(','),
      ),
    );
    const found = new Set<string>();
    for (const it of massifItems(w)) {
      if (it.piece.comp !== c) continue;
      const b = massifBounds(it);
      const buf = rasterPiece(it, Math.round((ISO_W / 2) * 2), Math.ceil(b.h * 2), 2);
      for (let o = 0; o < buf.length; o += 4) {
        if (buf[o + 3] !== 255) continue;
        const k = `${buf[o]},${buf[o + 1]},${buf[o + 2]}`;
        if (want.has(k)) found.add(k);
      }
    }
    expect(found.size).toBe(3);
  }, 60000);
});
