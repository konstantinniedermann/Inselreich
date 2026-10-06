import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fieldWorld } from '../../src/render/terrainField';
import { ISO_H, ISO_W } from '../../src/render/iso';
import {
  SUB,
  massifData,
  massifFeatures,
  massifPieces,
  massifTrees,
  nodeHeight,
  nodeInside,
  pieceCells,
  relLight,
  snowField,
  steepness,
  type MassifComponent,
  type MassifData,
  type MassifFeatures,
  type MassifPiece,
} from '../../src/render/massif';
import {
  CAIRN_F,
  CAIRN_LINE,
  CAIRN_LIT,
  CAIRN_MID,
  CAIRN_SHADE,
  CAVE_F,
  CAVE_FLOOR,
  CAVE_IN,
  CAVE_LINE,
  CAVE_LINTEL,
  CAVE_LINTEL_SHADE,
  FALL_BAND,
  FALL_BAND_HI,
  FALL_F,
  FALL_POOL,
  FALL_SPRAY,
  LAKE_DEEP,
  LAKE_F,
  LAKE_LINE,
  LAKE_SHORE,
  LAKE_SKY,
  massifBounds,
  pieceCairn,
  rasterPiece,
} from '../../src/render/rocks';
import { PALETTE, SIGNAL_NAMES, rgbOf } from '../../src/render/palette';
import { createWorld } from '../../src/sim/world';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';

// massif-l6.test.ts — ART-STIL-02 L6 (Anhang L6-T2, AK §7 L6): Bergsee C6, Wasserfall C7, Höhle C8, Steinmännchen C9.
// Der rote Starttest (Bergsee nur in einer Mulde) und die Kern-Referenz L6-T0 stehen in massif.test.ts.

const NX = ISO_W / 2 / SUB,
  NY = ISO_H / 2 / SUB;
const dataCache = new Map<number, { data: MassifData; isl: ReturnType<typeof fieldWorld> }>();
function mapOf(seed: number): { data: MassifData; isl: ReturnType<typeof fieldWorld> } {
  let m = dataCache.get(seed);
  if (!m) {
    const isl = fieldWorld(createWorld(seed, { unlockAll: true }));
    m = { data: massifData(isl), isl };
    dataCache.set(seed, m);
  }
  return m;
}
const feats = (seed: number): MassifFeatures => massifFeatures(mapOf(seed).data);
const SEEDS100 = Array.from({ length: 100 }, (_, i) => i + 1);

/** Knotenwerte wie `pieceNodes`: Gefälle, Krümmung, Steilheit, relative Beleuchtung. */
function info(c: MassifComponent, I: number, J: number) {
  const h = nodeHeight(c, I, J);
  const gx = ((nodeHeight(c, I + 1, J) - nodeHeight(c, I - 1, J)) / 2) * SUB,
    gy = ((nodeHeight(c, I, J + 1) - nodeHeight(c, I, J - 1)) / 2) * SUB;
  const lap =
    nodeHeight(c, I - 1, J) +
    nodeHeight(c, I + 1, J) +
    nodeHeight(c, I, J - 1) +
    nodeHeight(c, I, J + 1) -
    4 * h;
  return {
    h,
    hn: h / c.amp,
    gx,
    gy,
    lap,
    steep: steepness(gx, gy),
    e: Math.max(-1, Math.min(1, -lap / 16)),
    rl: relLight(gx, gy),
  };
}

describe('L6 Elemente je Karte', { timeout: 60000 }, () => {
  it('L6 Bergsee, Wasserfall, Höhle und Steinmännchen höchstens je 1 je Karte (Seeds 1–100); Steinmännchen nur an einem Teilstück', () => {
    for (const seed of SEEDS100) {
      const { data, isl } = mapOf(seed);
      const m = massifFeatures(data);
      for (const k of ['lake', 'fall', 'cave', 'cairn'] as const)
        expect(Array.isArray(m[k]), `${k} ist ein einzelnes Element`).toBe(false);
      const carrying = massifPieces(isl, data).filter((p) => pieceCairn(p) !== null);
      expect(carrying.length, `Seed ${seed}`).toBeLessThanOrEqual(m.cairn ? 2 : 0); // Anker kann auch Nahtzelle sein
    }
  });

  it('L6 Quoten über Seeds 1–100 im Band: Bergsee 25 %, Wasserfall 20 %, Höhle 20 % je ± 10 Punkte, Steinmännchen 30–60 %', () => {
    const n = { lake: 0, fall: 0, cave: 0, cairn: 0 };
    for (const seed of SEEDS100) {
      const m = feats(seed);
      for (const k of ['lake', 'fall', 'cave', 'cairn'] as const) if (m[k]) n[k]++;
    }
    expect(n.lake, 'Bergsee').toBeGreaterThanOrEqual(15);
    expect(n.lake, 'Bergsee').toBeLessThanOrEqual(35);
    expect(n.fall, 'Wasserfall').toBeGreaterThanOrEqual(10);
    expect(n.fall, 'Wasserfall').toBeLessThanOrEqual(30);
    expect(n.cave, 'Höhle').toBeGreaterThanOrEqual(10);
    expect(n.cave, 'Höhle').toBeLessThanOrEqual(30);
    expect(n.cairn, 'Steinmännchen').toBeGreaterThanOrEqual(30);
    expect(n.cairn, 'Steinmännchen').toBeLessThanOrEqual(60);
  });

  it('L6 Bergsee: Mulde mit Rand, der der Mulde folgt (Radius 0,4–0,7, kein exakter Kreis), nur auf flachem Gelände', () => {
    let seen = 0,
      round = 0;
    for (const seed of SEEDS100) {
      const l = feats(seed).lake;
      if (!l) continue;
      seen++;
      const n = info(l.comp, l.I, l.J);
      expect(n.steep, `Seed ${seed}`).toBeLessThan(0.2);
      expect(n.hn).toBeGreaterThanOrEqual(0.4);
      expect(n.hn).toBeLessThanOrEqual(0.7);
      expect(n.lap).toBeGreaterThan(0);
      for (const r of l.radii) {
        expect(r).toBeGreaterThanOrEqual(0.4 - 1e-9);
        expect(r).toBeLessThanOrEqual(0.7 + 1e-9);
      }
      if (Math.max(...l.radii) - Math.min(...l.radii) < 0.03) round++;
    }
    expect(seen).toBeGreaterThan(10);
    expect(round, 'Seen mit fast kreisrundem Rand').toBeLessThanOrEqual(Math.floor(seen * 0.1));
  });

  it('L6 Wasserfall: Start in einer steilen Rinne bei hn 0,45–0,75, fällt monoton, endet im Schutt (hn < 0,15), Band 1–1,5 px', () => {
    let seen = 0;
    for (const seed of SEEDS100) {
      const f = feats(seed).fall;
      if (!f) continue;
      seen++;
      const p = f.path;
      expect(p.length, `Seed ${seed}`).toBeGreaterThanOrEqual(8);
      const s = info(f.comp, p[0]!.I, p[0]!.J);
      expect(s.hn).toBeGreaterThanOrEqual(0.45);
      expect(s.hn).toBeLessThanOrEqual(0.75);
      expect(s.e, 'Rinne').toBeLessThan(-0.3);
      expect(s.steep, 'steil').toBeGreaterThanOrEqual(0.5);
      const last = p[p.length - 1]!;
      expect(last.h / f.comp.amp, `Seed ${seed}: endet im Schutt`).toBeLessThan(0.15);
      for (let k = 1; k < p.length; k++)
        expect(p[k]!.h, `Seed ${seed}: Punkt ${k} fällt`).toBeLessThan(p[k - 1]!.h);
      for (const q of p) {
        expect(q.w).toBeGreaterThanOrEqual(1 - 1e-9);
        expect(q.w).toBeLessThanOrEqual(1.5 + 1e-9);
      }
      // steiler = breiter: das Mittel der Breite über die steilere Hälfte ist nicht kleiner
      const hi = p.filter((q) => q.steep >= 0.6),
        lo = p.filter((q) => q.steep < 0.6);
      if (hi.length && lo.length) {
        const mean = (a: typeof p) => a.reduce((x, q) => x + q.w, 0) / a.length;
        expect(mean(hi)).toBeGreaterThanOrEqual(mean(lo) - 0.05);
      }
    }
    expect(seen).toBeGreaterThan(5);
  });

  it('L6 Höhle: Flanke zur Kamera auf der Schattenseite (relLight < 0, Gefälle nach +x +y), steil, hn 0,25–0,55, Anker in der Streifenmitte', () => {
    let seen = 0;
    for (const seed of SEEDS100) {
      const c = feats(seed).cave;
      if (!c) continue;
      seen++;
      const n = info(c.comp, c.I, c.J);
      expect(n.rl, `Seed ${seed}`).toBeLessThan(0);
      expect(n.steep).toBeGreaterThanOrEqual(0.6);
      expect(n.hn).toBeGreaterThanOrEqual(0.25);
      expect(n.hn).toBeLessThanOrEqual(0.55);
      expect(-n.gx, 'abwärts nach +x').toBeGreaterThan(0);
      expect(-n.gy, 'abwärts nach +y').toBeGreaterThan(0);
      expect((((c.I - c.J) % 4) + 4) % 4).toBe(2);
      expect(c.rx * 2).toBeGreaterThanOrEqual(5.5);
      expect(c.rx * 2).toBeLessThanOrEqual(7);
      expect(c.ry * 2).toBeGreaterThanOrEqual(4.5);
      expect(c.ry * 2).toBeLessThanOrEqual(6);
    }
    expect(seen).toBeGreaterThan(5);
  });

  it('L6 Steinmännchen am höchsten Knoten der Karte (Anker in der Streifenmitte), 3–4 Steine, nach oben kleiner, 3 px breit und 5 hoch', () => {
    let seen = 0;
    for (const seed of SEEDS100) {
      const { data } = mapOf(seed);
      const c = feats(seed).cairn;
      if (!c) continue;
      seen++;
      let top = 0,
        topAnchor = 0;
      for (const comp of data.comps)
        for (let J = comp.y0 * SUB; J <= (comp.y1 + 1) * SUB; J++)
          for (let I = comp.x0 * SUB; I <= (comp.x1 + 1) * SUB; I++)
            if (nodeInside(comp, I, J)) {
              top = Math.max(top, nodeHeight(comp, I, J));
              if ((((I - J) % 4) + 4) % 4 === 2)
                topAnchor = Math.max(topAnchor, nodeHeight(comp, I, J));
            }
      // der höchste Knoten der Karte, auf das Ankerraster (Streifenmitte) gerundet: höchstens 25 % darunter
      expect(c.h, `Seed ${seed}: Anker ± Ankerraster`).toBeGreaterThanOrEqual(0.75 * top);
      expect(c.h, `Seed ${seed}: höchster Ankerknoten`).toBeLessThanOrEqual(topAnchor + 1e-6);
      expect((((c.I - c.J) % 4) + 4) % 4).toBe(2);
      expect(c.stones.length).toBeGreaterThanOrEqual(3);
      expect(c.stones.length).toBeLessThanOrEqual(4);
      for (let k = 1; k < c.stones.length; k++)
        expect(c.stones[k]!.w).toBeLessThan(c.stones[k - 1]!.w);
      expect(c.stones[0]!.w).toBeGreaterThanOrEqual(2.5);
      expect(c.stones[0]!.w).toBeLessThanOrEqual(3.2);
      expect(c.height).toBeGreaterThanOrEqual(4.5);
      expect(c.height).toBeLessThanOrEqual(5.3);
    }
    expect(seen).toBeGreaterThan(30);
  });

  it('L6 Steinmännchen ragt über die Silhouette: massifBounds des Teilstücks reicht über dem Anker bis zur Steinspitze', () => {
    let checked = 0;
    for (const seed of SEEDS100.slice(0, 40)) {
      const { data, isl } = mapOf(seed);
      const c = feats(seed).cairn;
      if (!c) continue;
      for (const p of massifPieces(isl, data)) {
        if (!pieceCairn(p)) continue;
        const top = (c.I + c.J) * NY - c.h - c.height;
        expect(massifBounds({ piece: p }).y, `Seed ${seed}`).toBeLessThanOrEqual(top);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('L6 Elemente meiden Schnee (See, Wasserfall, Höhle), die Bergbaum-Masken und einander', () => {
    for (const seed of SEEDS100) {
      const { data } = mapOf(seed);
      const m = massifFeatures(data);
      const all = [
        ['lake', m.lake],
        ['fall', m.fall],
        ['cave', m.cave],
        ['cairn', m.cairn],
      ] as const;
      const seen = new Set<number>();
      for (const [name, e] of all) {
        if (!e) continue;
        const trees = massifTrees(e.comp).mask;
        for (const k of e.nodes) {
          expect(trees.has(k), `Seed ${seed}: ${name} auf Baummaske`).toBe(false);
          expect(seen.has(k), `Seed ${seed}: ${name} überlappt`).toBe(false);
          seen.add(k);
          if (name === 'cairn') continue; // der Gipfel liegt im Schnee, das Steinmännchen darf dort stehen
          const I = k % 100000,
            J = (k - I) / 100000;
          const c = e.comp;
          if (!nodeInside(c, I, J)) continue;
          const n = info(c, I, J);
          const fill = c.snowFill[(J - c.y0 * SUB) * c.nx + I - c.x0 * SUB] === 1;
          expect(
            fill ||
              snowField(c.seed, I / SUB, J / SUB, c.amp, c.snowHn, n.hn, n.steep, n.lap) >= 0.5,
            `Seed ${seed}: ${name} im Schnee`,
          ).toBe(false);
        }
      }
      expect(m.mask.size).toBe(seen.size);
    }
  });

  it('L6 deterministisch: zwei unabhängige Aufbauten (neue Welt) liefern gleiche Elemente; Sondierung über die Daten gemerkt', () => {
    const sum = (m: MassifFeatures): string =>
      JSON.stringify({
        lake: m.lake && { I: m.lake.I, J: m.lake.J, r: m.lake.radii },
        fall: m.fall && m.fall.path,
        cave: m.cave && { I: m.cave.I, J: m.cave.J, s: m.cave.shape },
        cairn: m.cairn && { I: m.cairn.I, J: m.cairn.J, s: m.cairn.stones },
        mask: m.mask.size,
      });
    for (const seed of [3, 7, 14, 21, 40]) {
      const a = massifFeatures(massifData(fieldWorld(createWorld(seed, { unlockAll: true }))));
      const b = massifFeatures(massifData(fieldWorld(createWorld(seed, { unlockAll: true }))));
      expect(sum(a), `Seed ${seed}`).toBe(sum(b));
      expect(massifFeatures(mapOf(seed).data)).toBe(massifFeatures(mapOf(seed).data));
    }
  });
});

describe('L6 Farben', () => {
  const tones: [string, readonly number[]][] = [
    ['LAKE_DEEP', LAKE_DEEP],
    ['LAKE_SKY', LAKE_SKY],
    ['LAKE_LINE', LAKE_LINE],
    ['LAKE_SHORE', LAKE_SHORE],
    ['FALL_BAND', FALL_BAND],
    ['FALL_BAND_HI', FALL_BAND_HI],
    ['FALL_SPRAY', FALL_SPRAY],
    ['FALL_POOL', FALL_POOL],
    ['CAVE_IN', CAVE_IN],
    ['CAVE_FLOOR', CAVE_FLOOR],
    ['CAVE_LINE', CAVE_LINE],
    ['CAVE_LINTEL', CAVE_LINTEL],
    ['CAVE_LINTEL_SHADE', CAVE_LINTEL_SHADE],
    ['CAIRN_LIT', CAIRN_LIT],
    ['CAIRN_MID', CAIRN_MID],
    ['CAIRN_SHADE', CAIRN_SHADE],
    ['CAIRN_LINE', CAIRN_LINE],
  ];
  const luma = (c: readonly number[]): number => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!;
  it('L6 alle neuen Töne: ΔE2000 ≥ 20 zu allen Signalfarben (signalOk ist türkis: Seewasser dunkel und entsättigt)', () => {
    for (const [name, c] of tones)
      for (const sig of SIGNAL_NAMES)
        expect(
          deltaE2000(
            rgbToLab(c.map(Math.round) as [number, number, number]),
            hexToLab(PALETTE[sig]),
          ),
          `${name} ↔ ${sig}`,
        ).toBeGreaterThanOrEqual(20);
  });
  it('L6 nichts heller als foam, nie Schwarz oder Weiss', () => {
    const foam = luma(rgbOf(PALETTE.foam));
    for (const [name, c] of tones) {
      expect(luma(c), name).toBeLessThanOrEqual(foam);
      expect(luma(c), `${name} nicht Schwarz`).toBeGreaterThan(25);
      expect(Math.min(...c), `${name} nicht Weiss`).toBeLessThan(235);
    }
  });
  it('L6 Bergsee dunkel und entsättigt: dunkler als waterMid, Spiegelung heller als der See, Ufer heller als beides', () => {
    expect(luma(LAKE_DEEP)).toBeLessThan(luma(rgbOf(PALETTE.waterMid)));
    expect(luma(LAKE_SKY)).toBeGreaterThan(luma(LAKE_DEEP));
    expect(luma(LAKE_SHORE)).toBeGreaterThan(luma(LAKE_SKY));
  });
});

describe('L6 Raster', { timeout: 120000 }, () => {
  /** Rasterpixel eines Teilstücks mit und ohne Elemente. */
  function both(p: MassifPiece, f: number) {
    const b = massifBounds({ piece: p });
    const w = Math.round((ISO_W / 2) * f),
      h = Math.ceil(b.h * f);
    return {
      w,
      h,
      b,
      on: rasterPiece({ piece: p }, w, h, f),
      off: rasterPiece({ piece: p }, w, h, f, false),
    };
  }
  /** Bereiche (Pixel, mit `pad` Rand) der Zellen, die einen Knoten aus `nodes` berühren. */
  function regions(
    p: MassifPiece,
    nodes: Set<number>,
    w: number,
    b: { x: number; y: number },
    f: number,
    pad: number,
  ): { x0: number; y0: number; x1: number; y1: number }[] {
    const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const sx = w / (ISO_W / 2),
      sy = f;
    for (const c of pieceCells(p)) {
      const ks = [
        [c.I, c.J],
        [c.I + 1, c.J],
        [c.I, c.J + 1],
        [c.I + 1, c.J + 1],
      ] as const;
      if (!ks.some(([I, J]) => nodes.has(J * 100000 + I))) continue;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const [I, J] of ks) {
        const h = nodeHeight(p.comp, I, J);
        const X = ((I - J) * NX - b.x) * sx,
          Y = ((I + J) * NY - h - b.y) * sy;
        x0 = Math.min(x0, X);
        x1 = Math.max(x1, X);
        y0 = Math.min(y0, Y);
        y1 = Math.max(y1, Y);
      }
      out.push({ x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad });
    }
    return out;
  }
  /** Differenzpixel ausserhalb der Bereiche und in ihnen. */
  function diff(
    r: ReturnType<typeof both>,
    regs: { x0: number; y0: number; x1: number; y1: number }[],
    cairnBox: { x0: number; y0: number; x1: number; y1: number } | null,
  ): { outside: number; inside: number } {
    let outside = 0,
      inside = 0;
    const all = cairnBox ? [...regs, cairnBox] : regs;
    for (let y = 0; y < r.h; y++)
      for (let x = 0; x < r.w; x++) {
        const o = (y * r.w + x) * 4;
        let d = false;
        for (let k = 0; k < 4; k++) if (r.on[o + k] !== r.off[o + k]) d = true;
        if (!d) continue;
        if (
          all.some((g) => x + 0.5 >= g.x0 && x + 0.5 <= g.x1 && y + 0.5 >= g.y0 && y + 0.5 <= g.y1)
        )
          inside++;
        else outside++;
      }
    return { outside, inside };
  }
  const cairnBox = (
    p: MassifPiece,
    r: ReturnType<typeof both>,
    f: number,
    pad: number,
  ): { x0: number; y0: number; x1: number; y1: number } | null => {
    const c = pieceCairn(p);
    if (!c) return null;
    const sx = r.w / (ISO_W / 2),
      sy = f;
    const X = ((c.I - c.J) * NX - r.b.x) * sx,
      Y = ((c.I + c.J) * NY - c.h - r.b.y) * sy;
    return {
      x0: X - 3 * sx - pad,
      x1: X + 3 * sx + pad,
      y0: Y - (c.height + 1) * sy - pad,
      y1: Y + sy + pad,
    };
  };

  it('L6 Pixelgleichheit ausserhalb der Elementbereiche (Elementmaske plus 2 px Rand): Seeds 7 und 14, alle Teilstücke, f = 1 und f = 2', () => {
    let inside = 0;
    for (const seed of [7, 14]) {
      const { data, isl } = mapOf(seed);
      const m = massifFeatures(data);
      for (const f of [1, 2])
        for (const p of massifPieces(isl, data)) {
          const r = both(p, f);
          const d = diff(r, regions(p, m.mask, r.w, r.b, f, 2), cairnBox(p, r, f, 2));
          expect(d.outside, `Seed ${seed} Teilstück ${p.id} f=${f}`).toBe(0);
          inside += d.inside;
        }
    }
    expect(inside, 'die Elemente ändern Pixel').toBeGreaterThan(0);
  });

  /** Erster Seed ≤ 100, der das Element hat. */
  const firstSeed = (k: 'lake' | 'fall' | 'cave' | 'cairn'): number =>
    SEEDS100.find((s) => feats(s)[k] !== null)!;

  it('L6 jede Art ändert Pixel nur in ihren Teilstücken, und nur ausserhalb davon gleich (Seeds mit See, Wasserfall, Höhle, Steinmännchen; f = 2)', () => {
    for (const k of ['lake', 'fall', 'cave', 'cairn'] as const) {
      const seed = firstSeed(k);
      const { data, isl } = mapOf(seed);
      const m = massifFeatures(data);
      let inside = 0;
      for (const p of massifPieces(isl, data)) {
        if (p.comp !== m[k]!.comp) continue;
        const r = both(p, 2);
        const d = diff(r, regions(p, m.mask, r.w, r.b, 2, 2), cairnBox(p, r, 2, 2));
        expect(d.outside, `${k} Seed ${seed} Teilstück ${p.id}`).toBe(0);
        inside += d.inside;
      }
      expect(inside, `${k} Seed ${seed}`).toBeGreaterThan(0);
    }
  });

  it('L6 Sichtbarkeit je Rasterfaktor: See ab 0,5, Wasserfall ab 0,75, Höhle ab 1, Steinmännchen ab 1,5', () => {
    expect([LAKE_F, FALL_F, CAVE_F, CAIRN_F]).toEqual([0.5, 0.75, 1, 1.5]);
    const changed = (seed: number, k: 'lake' | 'fall' | 'cave' | 'cairn', f: number): number => {
      const { data, isl } = mapOf(seed);
      const m = massifFeatures(data);
      let n = 0;
      for (const p of massifPieces(isl, data)) {
        if (p.comp !== m[k]!.comp) continue;
        const r = both(p, f);
        const reg = regions(p, m[k]!.nodes, r.w, r.b, 2, f === 0.5 ? 6 : 2);
        const box = k === 'cairn' ? cairnBox(p, r, f, 2) : null;
        n += diff(r, reg, box).inside;
      }
      return n;
    };
    // Seed mit allen Arten gemeinsam würde sich überlagern: je Art den ersten Seed nehmen, Pixel nur in der eigenen Maske zählen
    const lake = firstSeed('lake'),
      fall = firstSeed('fall'),
      cave = firstSeed('cave'),
      cairn = firstSeed('cairn');
    expect(changed(lake, 'lake', 0.25), 'See bei 0,25').toBe(0);
    expect(changed(lake, 'lake', 0.5), 'See bei 0,5').toBeGreaterThan(0);
    expect(changed(fall, 'fall', 0.5), 'Wasserfall bei 0,5').toBe(0);
    expect(changed(fall, 'fall', 0.75), 'Wasserfall bei 0,75').toBeGreaterThan(0);
    expect(changed(cave, 'cave', 0.75), 'Höhle bei 0,75').toBe(0);
    expect(changed(cave, 'cave', 1), 'Höhle bei 1').toBeGreaterThan(0);
    expect(changed(cairn, 'cairn', 1), 'Steinmännchen bei 1').toBe(0);
    expect(changed(cairn, 'cairn', 1.5), 'Steinmännchen bei 1,5').toBeGreaterThan(0);
  });

  it('L6 Streifennähte: der See malt sich über die Halbstreifen, an der gemeinsamen Kante sind die Spalten ohne Sprung', () => {
    // der erste See, der mindestens zwei benachbarte Streifen berührt
    for (const seed of SEEDS100) {
      const l = feats(seed).lake;
      if (!l) continue;
      const { data, isl } = mapOf(seed);
      const ps = massifPieces(isl, data).filter((p) => p.comp === l.comp);
      const water = (p: MassifPiece): number => {
        const r = both(p, 2);
        let n = 0;
        for (let o = 0; o < r.on.length; o += 4)
          if (
            Math.abs(r.on[o]! - LAKE_DEEP[0]) < 1 &&
            Math.abs(r.on[o + 1]! - LAKE_DEEP[1]) < 1 &&
            Math.abs(r.on[o + 2]! - LAKE_DEEP[2]) < 1
          )
            n++;
        return n;
      };
      const strips = new Set(ps.filter((p) => water(p) > 0).map((p) => p.strip));
      if (strips.size < 2) continue;
      // jeder Streifen mit Wasser hat Nachbarn mit Wasser (zusammenhängende Fläche über die Kante)
      for (const k of strips)
        if (strips.size > 1) expect(strips.has(k - 1) || strips.has(k + 1)).toBe(true);
      return;
    }
    throw new Error('kein See über mehrere Streifen in Seeds 1–100');
  });
});

describe('L6 Quelltext', () => {
  it('L6-T2 kein Math.random in massif.ts und rocks.ts; Salze 576–584 im Kopf von massif.ts', () => {
    for (const f of ['src/render/massif.ts', 'src/render/rocks.ts'])
      expect(readFileSync(f, 'utf8')).not.toMatch(/Math\.random/);
    const head = readFileSync('src/render/massif.ts', 'utf8').slice(0, 4000);
    for (const s of ['576', '577', '578', '579', '580', '581', '582', '583', '584'])
      expect(head).toContain(s);
  });
});
