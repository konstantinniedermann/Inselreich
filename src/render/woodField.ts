import { rotNoise } from './light';

// woodField.ts — Saumfeld S(x, y) des Waldes (WALD-02, Spec 2.1.1): eine stetige Grösse im Kachelraum, deren
// Höhenlinie `SAUM_LEVEL` die sichtbare Waldkante ist — für Kronen (`forest.ts`), Waldboden und Waldschatten
// (`terrain.ts`). Reine Mathematik, kein Canvas, kein DOM.
//
// S = B + g(B) · R: B ist die Waldmaske (1 Wald, 0 sonst), mit einem 3 × 3-Binomialfilter weichgezeichnet und
// zwischen den Kachelmitten bilinear gelesen; R ist Randrauschen in [−1; 1] (drei gedrehte Oktaven), g(B) beschränkt
// es auf den Saum (tief im Wald und weit draussen ist g = 0). Die Glättung rundet konvexe Maskenecken (S ≈ 0,25 an der
// Ecke) und füllt konkave (≈ 0,75). Reichweite: eine Kachel wirkt über Filter und Bilinear höchstens 2 Kacheln weit;
// die Teil-Neuzeichnung der Terrain-Ebene (Rand `SMOOTH_BORDER` = 2) bleibt damit genau.
// Salze 518–520 (Kopf von forest.ts).

/** Weichgezeichnete Waldmaske, ein Wert je Kachel. */
export interface WoodMask {
  w: number;
  h: number;
  v: Float32Array;
  /** Ungeglättete Maske (1 Wald): Kern um jede Waldkachelmitte (`saumAt`). */
  raw?: ArrayLike<number>;
}

/** Höhenlinie der sichtbaren Waldkante (dichtes Kronendach und dunkler Waldboden). */
export const SAUM_LEVEL = 0.5;
/** Grösste Verschiebung der Höhenlinie durch das Rauschen in S-Einheiten: nach aussen und nach innen. */
const SAUM_OUT = 0.34,
  SAUM_IN = 0.56;
/** Gewicht des Rauschens am Saum: g(B) = min(1, SAUM_BAND · 4B(1 − B)). */
const SAUM_BAND = 2;
/** Rauschoktaven: Frequenz (je Kachel), Gewicht, Drehung; Verstärkung vor der Sättigung. */
const OCTAVES = [
  { salt: 518, freq: 1 / 5.5, w: 0.5, rot: 0.61 },
  { salt: 519, freq: 1 / 3.1, w: 0.32, rot: 1.37 },
  { salt: 520, freq: 1 / 1.35, w: 0.18, rot: 2.29 },
] as const;
const NOISE_GAIN = 5;

/** 3 × 3-Binomialfilter (1 2 1 / 2 4 2 / 1 2 1, durch 16) über eine 0/1-Maske; ausserhalb der Karte gilt 0. */
export function woodBlur(w: number, h: number, mask: ArrayLike<number>): WoodMask {
  const tmp = new Float32Array(w * h),
    v = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      tmp[i] = (2 * mask[i]! + (x > 0 ? mask[i - 1]! : 0) + (x < w - 1 ? mask[i + 1]! : 0)) / 4;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      v[i] = (2 * tmp[i]! + (y > 0 ? tmp[i - w]! : 0) + (y < h - 1 ? tmp[i + w]! : 0)) / 4;
    }
  return { w, h, v, raw: mask };
}

/** B: weichgezeichnete Maske bilinear zwischen den Kachelmitten (Kachel i hat die Mitte i + 0,5); ausserhalb 0. */
export function woodBase(m: WoodMask, fx: number, fy: number): number {
  const u = fx - 0.5,
    v = fy - 0.5;
  const x0 = Math.floor(u),
    y0 = Math.floor(v);
  const tx = u - x0,
    ty = v - y0;
  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.v[y * m.w + x]!;
  return (
    (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) +
    (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty
  );
}

/** Randrauschen R in [−1; 1]: drei gedrehte Oktaven (Perioden ≈ 5,5, 3,1 und 1,35 Kacheln), weich gesättigt. */
export function woodNoise(seed: number, fx: number, fy: number): number {
  let n = 0;
  for (const o of OCTAVES) n += o.w * (rotNoise(seed + o.salt, fx, fy, o.freq, o.rot) - 0.5);
  return Math.tanh(n * NOISE_GAIN);
}

/** Saumfeld S an (fx, fy): B plus Randrauschen, nur im Saum (g(B) > 0). */
export function saumAt(seed: number, m: WoodMask, fx: number, fy: number): number {
  const b = woodBase(m, fx, fy);
  if (b <= 0 || b >= 1) return b;
  return Math.max(saumRaw(seed, b, fx, fy), tileCore(m, fx, fy));
}

/**
 * Kern um jede Waldkachelmitte (Fix-Runde 1): S bleibt dort über der Saumlinie (bis `CORE_R` Kachel um die Mitte),
 * damit tiefe Buchten jede Waldkachel als Wald lesbar lassen (dunkler Boden unter ihren Kronen). Wirkt nur in der
 * eigenen Kachel, Reichweite 0.
 */
const CORE_R = 0.26,
  CORE_LIFT = 0.12;
function tileCore(m: WoodMask, fx: number, fy: number): number {
  if (!m.raw) return 0;
  const x = Math.floor(fx),
    y = Math.floor(fy);
  if (x < 0 || y < 0 || x >= m.w || y >= m.h || !m.raw[y * m.w + x]) return 0;
  const d2 = (fx - x - 0.5) ** 2 + (fy - y - 0.5) ** 2;
  return SAUM_LEVEL + CORE_LIFT * (1 - d2 / (CORE_R * CORE_R));
}

function saumRaw(seed: number, b: number, fx: number, fy: number): number {
  const g = Math.min(1, SAUM_BAND * 4 * b * (1 - b));
  const r = woodNoise(seed, fx, fy);
  // nach innen schon ab B ≈ 0,3 (Fix-Runde 1: Buchten auch an kleinen Waldstücken und langen geraden Kanten)
  const t = Math.min(1, Math.max(0, (b - 0.3) / 0.3));
  return b + g * (r > 0 ? SAUM_OUT * r : SAUM_IN * t * t * (3 - 2 * t) * r);
}
