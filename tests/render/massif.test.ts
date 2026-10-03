import { beforeAll, describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { BuildingDefId, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
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
import { MASSIF_CACHE_MAX_BYTES } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbOf, rgbOfCss } from '../../src/render/palette';
import {
  PIECE_RUN,
  SMALL_MASSIF,
  SUB,
  cellColor,
  massifData,
  massifPieces,
  nodeHeight,
  nodeInside,
  pieceCells,
  type MassifComponent,
  type MassifPiece,
} from '../../src/render/massif';
import {
  createMassifCache,
  inflate,
  massifBounds,
  massifSilhouette,
  pieceQuads,
  setMassifCanvasFactory,
  type MassifItem,
} from '../../src/render/rocks';
import { render } from '../../src/render/renderer';
import { setCanvasFactory as setTreeCanvasFactory } from '../../src/render/trees';
import { fakeCtx, type P } from './fakeCtx';

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
  for (const t of w.tiles) {
    t.terrain = 'grass';
    t.buildingId = null;
    t.road = false;
  }
  w.buildings = {};
  const T = { M: 'mountain', F: 'forest', '~': 'water', S: 'sand' } as const;
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      const t = w.tiles[(oy + y) * w.width + ox + x]!;
      t.terrain = c in T ? T[c as keyof typeof T] : 'grass';
    }),
  );
  return w;
}
let nextId = 500;
function put(w: World, defId: BuildingDefId, x: number, y: number): boolean {
  const d = BUILDING_DEFS[defId];
  if (x < 0 || y < 0 || x + d.w > w.width || y + d.h > w.height) return false;
  const tiles = [];
  for (let dy = 0; dy < d.h; dy++)
    for (let dx = 0; dx < d.w; dx++) tiles.push(w.tiles[(y + dy) * w.width + x + dx]!);
  if (tiles.some((t) => t.buildingId !== null || t.road || t.terrain === 'water')) return false;
  const id = nextId++;
  w.buildings[id] = { id, defId, x, y, connected: true, progress: 0, state: 'ok' };
  for (const t of tiles) t.buildingId = id;
  w.nextBuildingId = nextId;
  return true;
}
const square = (n: number): World => scene(Array.from({ length: n }, () => 'M'.repeat(n)));
const largest = (w: World): MassifComponent =>
  [...massifData(w).comps].sort((a, b) => b.n - a.n)[0]!;
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
    const a = massifData(scene(rows)),
      b = massifData(scene(rows));
    const sets = a.comps.map((c) =>
      [...c.tiles].map((i) => `${(i % 64) - 10},${Math.floor(i / 64) - 10}`),
    );
    expect(sets).toEqual([['0,0', '1,0', '0,1', '1,1'], ['4,0'], ['2,2'], ['3,3', '4,3']]);
    expect(b.comps.map((c) => [...c.tiles])).toEqual(a.comps.map((c) => [...c.tiles]));
    expect(a.comps.map((c) => c.n)).toEqual([4, 1, 1, 2]);
  });

  it('A1 gemerkt je Welt und Geländeabbild: Bauen und Wege lösen keinen Neubau aus, neues Gebirge schon', () => {
    const w = square(6);
    const d = massifData(w);
    expect(massifData(w)).toBe(d);
    put(w, 'house', 30, 30);
    w.tiles[11 * 64 + 11]!.road = true;
    expect(massifData(w)).toBe(d);
    w.tiles[40 * 64 + 40]!.terrain = 'mountain';
    expect(massifData(w)).not.toBe(d);
  });
});

describe('H-R9 A2 Höhenfeld', () => {
  it('A2 h = 0 an der Komponentengrenze, h ≥ 0 innen, h > 0 ab einer halben Kachel Randabstand', () => {
    for (const w of [
      createWorld(7, { unlockAll: true }),
      square(5),
      scene(['MMM.', 'M.MM', 'MMMM']),
    ])
      for (const c of massifData(w).comps)
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
    expect(hs.at(-1)!).toBeLessThan(6 * ISO_H); // gedeckelt
    expect(SMALL_MASSIF).toBe(12);
    // gleicher Codepfad: der Hügel ist rund (Gipfel innen, nicht am Rand)
    const hill = largest(square(2));
    expect(nodeHeight(hill, (hill.x0 + 1) * SUB, (hill.y0 + 1) * SUB)).toBeCloseTo(maxH(hill), -1);
  });

  it('A2 Höhenstaffelung: Rückseite (kleineres x + y) im Mittel höher als Vorderseite', () => {
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
      let back = 0,
        nb = 0,
        front = 0,
        nf = 0;
      for (const [I, J] of nodes(c)) {
        if (!nodeInside(c, I, J)) continue;
        const h = nodeHeight(c, I, J);
        if (I + J < mid) {
          back += h;
          nb++;
        } else if (I + J > mid) {
          front += h;
          nf++;
        }
      }
      expect(back / nb, `Seed ${w.seed}`).toBeGreaterThan(1.1 * (front / nf));
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
});

describe('H-R9 A3 Färbung', () => {
  const base = { h: 20, hn: 0.4, gx: 0, gy: 0, lap: 0, rim: 1, edge: null };

  it('A3 Lichtseite (zum Licht −x, −y geneigt) heller als flach, Schattenseite dunkler', () => {
    const lit = cellColor(5, 3.3, 4.1, { ...base, gx: 60, gy: 20 }); // Höhe steigt nach +x: Hang schaut nach −x
    const flat = cellColor(5, 3.3, 4.1, base);
    const shade = cellColor(5, 3.3, 4.1, { ...base, gx: -60, gy: -20 });
    expect(lum(lit)).toBeGreaterThan(lum(flat) + 8);
    expect(lum(shade)).toBeLessThan(lum(flat) - 8);
  });

  it('A3 Sockel ohne Naht: bei h = 0 Felsgrund, am Rand halb zum Nachbargelände gemischt', () => {
    const rock = rgbOf(PALETTE.rock);
    const foot = rgbOfCss(cellColor(5, 2.2, 7.7, { ...base, h: 0, hn: 0 }));
    expect(dist3(foot, rock)).toBeLessThan(30);
    const grass = rgbOf(PALETTE.grass);
    const edge = rgbOfCss(cellColor(5, 2.2, 7.7, { ...base, h: 0, hn: 0, rim: 0, edge: grass }));
    expect(dist3(edge, grass)).toBeLessThan(dist3(foot, grass) - 20);
    expect(dist3(edge, rock)).toBeLessThan(dist3(grass, rock));
  });

  it('A3 nur Palettentöne: keine Signalfarben, kein Schnee (heller als rockLight/foam-Mischung 30 %)', () => {
    const w = createWorld(7, { unlockAll: true });
    const sig = SIGNAL_NAMES.map((n) => rgbOf(PALETTE[n]));
    const snow = rgbOfCss(
      `rgb(${rgbOf(PALETTE.rockLight)
        .map((v, i) => Math.round(v + (rgbOf(PALETTE.foam)[i]! - v) * 0.3))
        .join(',')})`,
    );
    let n = 0;
    for (const p of massifPieces(w))
      for (const q of pieceQuads(p)) {
        const c = rgbOfCss(q.fill);
        for (const s of sig) expect(dist3(c, s)).toBeGreaterThan(60);
        expect(lum(q.fill)).toBeLessThanOrEqual(
          0.299 * snow[0]! + 0.587 * snow[1]! + 0.114 * snow[2]! + 1,
        );
        n++;
      }
    expect(n).toBeGreaterThan(1000);
  });
});

describe('H-R9 A4/A5 Teilstücke', () => {
  const W = 64;
  const strips = (p: MassifPiece) => p.strip;
  it('A5 Teilstücke: Läufe freier Gebirgskacheln im Halbstreifen, höchstens PIECE_RUN, Schlüssel = vorderste Kachel', () => {
    const w = createWorld(7, { unlockAll: true });
    put(w, 'quarry', 0, 0);
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
        const t = w.tiles[i]!;
        expect(t.terrain).toBe('mountain');
        expect(t.buildingId === null && !t.road).toBe(true);
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

  it('A5 Teilstücke partitionieren die Netzzellen jeder freien Gebirgskachel und bleiben im Halbstreifen', () => {
    const w = scene(['MMMMM.', 'MM.MMM', 'MMMMMM', '.MMMM.']);
    put(w, 'house', 13, 11);
    const seen = new Map<string, number>();
    for (const p of massifPieces(w))
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
        const t = w.tiles[y * 64 + x]!;
        const isFree = t.terrain === 'mountain' && t.buildingId === null && !t.road;
        if (isFree) free++;
        for (let J = y * SUB; J < (y + 1) * SUB; J++)
          for (let I = x * SUB; I < (x + 1) * SUB; I++)
            expect(seen.get(`${I},${J}`) ?? 0, `${x},${y}`).toBe(isFree ? 2 : 0);
      }
    expect(free).toBe(21 - 1);
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
    // Steinbruch auf Gebirgskacheln, Weg quer durchs Massiv, Häuser und Betriebe in der Bucht und an den Rändern
    expect(put(w, 'quarry', 8 + 8, 8 + 1)).toBe(true);
    for (let x = 8 + 2; x <= 8 + 8; x++) w.tiles[(8 + 5) * 64 + x]!.road = true;
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
      const t = w.tiles[y * 64 + x];
      return !!t && t.terrain === 'mountain' && t.buildingId === null && !t.road;
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
      const pieces = massifPieces(w);
      for (const p of pieces) {
        const list = byStrip.get(p.strip) ?? [];
        for (const q of pieceQuads(p, 0)) list.push(q.pts);
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

  it('A4 keine Antialias-Nähte: Zellen werden um mindestens einen halben Gerätepixel vergrössert gezeichnet', () => {
    const sq: P[] = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 10 },
      { x: -10, y: 5 },
    ];
    const big = inflate(sq, 0.5);
    for (const p of sq) expect(inPoly(big, p)).toBe(true);
    for (let i = 0; i < 4; i++) {
      const a = big[i]!,
        o = sq[i]!;
      expect(Math.hypot(a.x - o.x, a.y - o.y)).toBeGreaterThanOrEqual(0.5);
    }
    // gemalt: jede Füllung im Teilstück-Canvas ist vergrössert (Faktor 2: 0,6 Gerätepixel = 0,3 Weltpixel)
    const w = square(4);
    const p = massifPieces(w)[3]!;
    const nominal = pieceQuads(p, 0);
    const grown = pieceQuads(p, 0.3);
    expect(grown).toHaveLength(nominal.length);
    for (let i = 0; i < nominal.length; i++)
      expect(area(grown[i]!.pts)).toBeGreaterThan(area(nominal[i]!.pts));
  });

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
  it('A7 Massiv erzeugt keine Hülle; Klick auf das Massiv trifft kein Gebäude', () => {
    const w = createWorld(7, { unlockAll: true });
    const hulls = buildingHulls(w);
    expect(hulls.length).toBe(Object.keys(w.buildings).length);
    const c = largest(w);
    const p = project(c.x0 + 2, c.y0 + 2);
    const blocked = hulls.some((h) => pickBuilding([h], p.x, p.y - 20) !== null);
    if (!blocked) expect(pickBuilding(hulls, p.x, p.y - 20)).toBeNull();
  });

  it('A7 Silhouette je Teilstück umschliesst alle gezeichneten Zellen (Licht- und Feuerverdeckung)', () => {
    const w = createWorld(7, { unlockAll: true });
    let n = 0;
    for (const it of massifItems(w).slice(0, 60)) {
      const sil = massifSilhouette(it);
      for (const q of pieceQuads(it.piece, 0))
        for (const v of q.pts) {
          const k = it.piece.strip * (ISO_W / 2);
          const vx = Math.min(Math.max(v.x, k + 1e-6), k + ISO_W / 2 - 1e-6);
          expect(inPoly(sil, { x: vx, y: v.y }) || nearPoly(sil, { x: vx, y: v.y }, 0.5)).toBe(
            true,
          );
          n++;
        }
    }
    expect(n).toBeGreaterThan(500);
  });

  it('A7 Fensterlicht hinter dem Massiv steht unter einem Clip mit der Massiv-Silhouette', () => {
    const w = scene(
      ['........', '........', '..MMMM..', '.MMMMMM.', '.MMMMMM.', '..MMMM..'],
      20,
      20,
    );
    expect(put(w, 'house', 23, 20)).toBe(true);
    const b = Object.values(w.buildings)[0]!;
    b.house = { tier: 3, inhabitants: 20 } as never;
    w.tick = 3600;
    const cam: Camera = { x: 0, y: 0, zoom: 1 };
    const view = { w: 1280, h: 800 };
    centerOn(cam, 24, 23, view, { w: 64, h: 64 });
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
function area(poly: readonly P[]): number {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    s += (poly[j]!.x - poly[i]!.x) * (poly[j]!.y + poly[i]!.y);
  return Math.abs(s / 2);
}
