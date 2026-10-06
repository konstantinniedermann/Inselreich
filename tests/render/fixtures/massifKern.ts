import { fieldWorld } from '../../../src/render/terrainField';
import { ISO_H, ISO_W } from '../../../src/render/iso';
import {
  SOFT_CUT,
  SUB,
  massifPieces,
  massifTreeMask,
  pieceCells,
  pieceNodes,
  type MassifPiece,
} from '../../../src/render/massif';
import { massifBounds, rasterPiece } from '../../../src/render/rocks';
import { createWorld } from '../../../src/sim/world';

// Mess-Helfer für ART-STIL-02 L2 (Gebirgskern-Fixture Q2 und Rauschenergie im Schuttband). Rein, nur Lesen.

export const KERN_SEEDS = [7, 14] as const;
/** Kern des Gebirges: ab dieser relativen Höhe bleibt die Darstellung pixelgleich (Referenz). */
export const KERN_HN = 0.35;

export interface KernNode {
  comp: number;
  I: number;
  J: number;
  hn: number;
  h: number;
  rgb: [number, number, number];
  /** Schneemaske (T4) bzw. Baummaske (T5) des heutigen Codes: der Knoten ist von L2 absichtlich geändert. */
  snow: boolean;
  tree: boolean;
}

/** Eindeutige Kernknoten (hn ≥ KERN_HN) einer Heimatinsel, I und J gerade. */
export function kernNodes(seed: number): KernNode[] {
  const w = createWorld(seed, { unlockAll: true });
  const seen = new Set<string>();
  const out: KernNode[] = [];
  for (const p of massifPieces(fieldWorld(w))) {
    const at = pieceNodes(p);
    for (const c of pieceCells(p))
      for (const [I, J] of [
        [c.I, c.J],
        [c.I + 1, c.J],
        [c.I, c.J + 1],
        [c.I + 1, c.J + 1],
      ] as const) {
        if (I % 2 !== 0 || J % 2 !== 0) continue;
        const k = `${p.comp.id}|${I}|${J}`;
        if (seen.has(k)) continue;
        const nd = at(I, J);
        const hn = nd.h / p.comp.amp;
        if (hn < KERN_HN) continue;
        seen.add(k);
        out.push({
          comp: p.comp.id,
          I,
          J,
          hn,
          h: nd.h,
          rgb: [Math.round(nd.c[0]), Math.round(nd.c[1]), Math.round(nd.c[2])],
          snow: nd.snow >= 0.5,
          tree: massifTreeMask(p.comp, I, J),
        });
      }
  }
  return out;
}

const NX = ISO_W / 2 / SUB,
  NY = ISO_H / 2 / SUB;

/** Pixel im Schuttband (Knoten-soft zwischen SOFT_CUT und `hi`, deckend) und ihre Luma bei f = 2, je Teilstück. */
function bandMask(
  p: MassifPiece,
  hi: number,
  f: number,
): { n: number; w: number; h: number; luma: Float32Array; band: Uint8Array } {
  const b = massifBounds({ piece: p });
  const w = Math.round((ISO_W / 2) * f),
    h = Math.ceil(b.h * f);
  const buf = rasterPiece({ piece: p }, w, h, f);
  const luma = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    luma[i] = 0.299 * buf[i * 4]! + 0.587 * buf[i * 4 + 1]! + 0.114 * buf[i * 4 + 2]!;
  const band = new Uint8Array(w * h);
  const at = pieceNodes(p);
  const sx = w / (ISO_W / 2),
    sy = f;
  let n = 0;
  for (const c of pieceCells(p)) {
    const nd = [at(c.I, c.J), at(c.I + 1, c.J), at(c.I + 1, c.J + 1), at(c.I, c.J + 1)];
    const ms = nd.reduce((a, q) => a + q.soft, 0) / 4;
    if (!(ms > SOFT_CUT && ms < hi)) continue;
    const I = [c.I, c.I + 1, c.I + 1, c.I],
      J = [c.J, c.J, c.J + 1, c.J + 1];
    const xs = nd.map((_, k) => ((I[k]! - J[k]!) * NX - b.x) * sx);
    const ys = nd.map((q, k) => ((I[k]! + J[k]!) * NY - q.h - b.y) * sy);
    // Mitte der Zelle (Raute), kleines Rechteck: keine Randpixel
    const cx = xs.reduce((a, v) => a + v, 0) / 4,
      cy = ys.reduce((a, v) => a + v, 0) / 4;
    const rx = NX * sx * 0.45,
      ry = NY * sy * 0.45;
    for (let y = Math.ceil(cy - ry); y < cy + ry; y++)
      for (let x = Math.ceil(cx - rx); x < cx + rx; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const o = y * w + x;
        if (!band[o] && buf[o * 4 + 3] === 255) {
          band[o] = 1;
          n++;
        }
      }
  }
  return { n, w, h, luma, band };
}

/**
 * Rauschenergie im Schuttband: mittleres |ΔLuma| benachbarter Bandpixel (waagrecht und senkrecht) in den 6 Teilstücken
 * mit den meisten Bandpixeln, bei f = 2.
 */
export function bandNoise(seed: number, hi: number): number {
  const w = createWorld(seed, { unlockAll: true });
  const masks = massifPieces(fieldWorld(w)).map((p) => bandMask(p, hi, 2));
  masks.sort((a, b) => b.n - a.n);
  let sum = 0,
    cnt = 0;
  for (const m of masks.slice(0, 6))
    for (let y = 0; y < m.h - 1; y++)
      for (let x = 0; x < m.w - 1; x++) {
        const o = y * m.w + x;
        if (!m.band[o]) continue;
        if (m.band[o + 1]) {
          sum += Math.abs(m.luma[o]! - m.luma[o + 1]!);
          cnt++;
        }
        if (m.band[o + m.w]) {
          sum += Math.abs(m.luma[o]! - m.luma[o + m.w]!);
          cnt++;
        }
      }
  return cnt ? sum / cnt : 0;
}
