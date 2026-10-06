// H-R15: Flachwasser-Saum der Fernansicht (Zoom ≤ 0,25). Das Küstenfeld des Bodens misst in 8er-Schritten
// (Chebyshev): seine Abstandslinien sind Quadrate, in der Isometrie Rauten, und die Treppenstufen der Küste ziehen
// waagrechte Zungen und Schlieren ins Wasser. Die Viertel-Kopie malt ihr Tiefwasser daher aus einem euklidischen
// Abstand neu; der Boden bei Zoom 1 und 2 bleibt unverändert. Reine Mathematik, ohne DOM.
import { MAX_DIST, sampleField, warp, type Field, type FieldWorld } from './terrainField';

/** Tiefster Wert des Fernabstands (Kacheln); darunter ist das Wasser überall gleich tief. */
export const FAR_DEPTH_MAX = MAX_DIST;
const INF = 1e12;

/** 1D-Transformation (Felzenszwalb/Huttenlocher) der quadrierten Abstände, in-place über `f` mit Schritt `stride`. */
function edt1d(
  f: Float64Array,
  off: number,
  stride: number,
  n: number,
  z: Float64Array,
  v: Int32Array,
  d: Float64Array,
) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s: number;
    for (;;) {
      const p = v[k]!;
      s = (f[off + q * stride]! + q * q - (f[off + p * stride]! + p * p)) / (2 * q - 2 * p);
      if (s <= z[k]!) k--;
      else break;
      if (k < 0) {
        k = 0;
        break;
      }
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1]! < q) k++;
    const p = v[k]!;
    d[q] = (q - p) * (q - p) + f[off + p * stride]!;
  }
  for (let q = 0; q < n; q++) f[off + q * stride] = d[q]!;
}

/** Quadrierter euklidischer Abstand je Kachel zur nächsten Kachel mit `source(i)`; INF, wenn es keine gibt. */
function squaredDistance(w: number, h: number, source: (i: number) => boolean): Float64Array {
  const f = new Float64Array(w * h);
  for (let i = 0; i < f.length; i++) f[i] = source(i) ? 0 : INF;
  const m = Math.max(w, h);
  const z = new Float64Array(m + 1),
    v = new Int32Array(m),
    d = new Float64Array(m);
  for (let x = 0; x < w; x++) edt1d(f, x, w, h, z, v, d);
  for (let y = 0; y < h; y++) edt1d(f, y * w, 1, w, z, v, d);
  return f;
}

/** Wie `coastField`, aber euklidisch gemessen (Land: Abstand zum Wasser, Wasser: −Abstand zum Land), gekappt. */
export function euclidCoast(isl: FieldWorld): Field {
  const { width: w, height: h } = isl;
  const isLand = (i: number) => isl.tiles[i]!.terrain !== 'water';
  const toWater = squaredDistance(w, h, (i) => !isLand(i));
  const toLand = squaredDistance(w, h, isLand);
  const v = new Float32Array(w * h);
  for (let i = 0; i < v.length; i++)
    v[i] = isLand(i)
      ? Math.min(Math.sqrt(toWater[i]!), MAX_DIST)
      : -Math.min(Math.sqrt(toLand[i]!), MAX_DIST);
  return { w, h, v };
}

/** Wassertiefe (Kacheln, ≥ 0) an Kachelpunkt (fx, fy) aus dem euklidischen Feld, mit derselben Verschiebung wie der Boden. */
export function farWaterDepth(e: Field, seed: number, fx: number, fy: number): number {
  const [wx, wy] = warp(seed, fx, fy);
  return Math.min(FAR_DEPTH_MAX, Math.max(0, -sampleField(e, wx, wy)));
}
