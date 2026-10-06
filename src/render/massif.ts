import { MIN_MOUNTAIN_PATCH } from '../sim/defs/map';
import { ISO_H } from './iso';
import { hash2, valueNoise } from '../sim/noise';
import {
  DEBRIS,
  DEBRIS_MIX,
  LIGHT,
  LIGHT_COLORS,
  ROCK_TONES,
  mixRgb,
  rotNoise,
  smoothstep,
  toneColor,
  toneStep,
  type Rgb,
} from './light';
import type { Island, World } from '../sim/types';
import { FOREST_FLOOR, PALETTE, mixHex, rgbOf, rgbOfCss } from './palette';

// Tonleiter (H-R11): lebt in light.ts; hier zur Rückwärtsverträglichkeit weiter ausgeführt.
export { ROCK_TONES, toneColor, toneStep };

// massif.ts — Gebirgsmassiv als Höhenfeld je Zusammenhangskomponente (H-R9 Teil A, Kurz-Spec A1–A5). Reine
// Mathematik im Kachelraum: Komponenten, Höhenfeld auf einem Untergitter (SUB Knoten je Kachel), Zerlegung in
// Teilstücke (Halbkachel-Streifen) und Zellfarben. Keine Projektion, kein Canvas (das macht `rocks.ts`); liest die
// Welt nur. Höhen in Weltpixeln (Zoom 1), Darstellungswerte, keine Spielwerte.
// Salze (ART-STIL-02 L6, Block 576–584, Eintrag im zentralen Kopf von groundDecor.ts macht der Release-Merge):
// 576 Bergsee-Los, 577 Bergsee-Form, 578 Wasserfall-Los, 579 Wasserfall-Form, 580 Höhlen-Los, 581 Höhlen-Form,
// 582 Steinmännchen-Los, 583 Steinmännchen-Form (alle hier), 584 Farn (trees.ts).

export type MassifWorld = Island & Pick<World, 'seed'>;

/** Knoten je Kachel und Achse (Richtwert der Spec: 4). */
export const SUB = 4;
/**
 * Unter dieser Kachelzahl wird eine Komponente ein niedriger, runder Felshügel (gleicher Codepfad, Grate laufen
 * stetig aus). Gleich der kleinsten Gebirgsfläche der Kartenerzeugung (H-S1); alte Spielstände können kleinere
 * Flecken enthalten, die als Felshügel erscheinen.
 */
export const SMALL_MASSIF = MIN_MOUNTAIN_PATCH;
/** Höchstens so viele Kacheln je Teilstück (lange Läufe werden geteilt, A5); hält Offscreen-Flächen klein. */
export const PIECE_RUN = 8;
/**
 * Amplitude = AMP_K · (√Kacheln)^AMP_POW px, gedeckelt: kleine Flecken bleiben Hügel (3 × 3 ≈ 21 px), grosse Massive
 * steigen steiler als der Blickwinkel (≈ 16 px je Kachel Tiefe), damit hintere Grate über vorderen aufragen.
 */
const AMP_K = 5;
const AMP_POW = 1.3;
const AMP_SLOPE = 45; // höchstens so viel Amplitude je Kachel grösstem Randabstand (px): schmale Grate bleiben flacher
export const AMP_CAP = 135;
const PROFILE = 0.9; // Exponent des Körpers über dem Randabstand (< 1: Flanken steigen früh, kein breiter Saum)
const BODY_FLOOR = 0.24; // Anteil der Amplitude, den der Körper schon nach RIM Kacheln Randabstand erreicht
/** Kacheln: Randband, in dem die Höhe von 0 auf den Körper steigt (flacher Saum höchstens etwa 1 Kachel). */
const RIM = 1.1;
const BLUR = 2; // Knoten-Radius des Weichzeichners (2 Durchgänge): Kontur gerundet, keine Treppen
/** Grate: Faktor RIDGE_LO … RIDGE_LO + RIDGE_SPAN aus dem Ridged-Noise (Nebengrate und Vorberge im ganzen Massiv). */
const RIDGE_LO = 0.5,
  RIDGE_SPAN = 1.0;
/**
 * Höhenstaffelung: Faktor exp(β · g), g = −1 vorn … +1 hinten (Tiefe x + y). β startet bei STAGGER und wächst je
 * Komponente höchstens bis STAGGER_MAX, bis die hintere Hälfte im Mittel BACK_RATIO-mal so hoch ist wie die vordere.
 */
const STAGGER = 0.3;
const STAGGER_MAX = 0.5;
const BACK_RATIO = 1.25;
const BUMP = 0.8; // px Geröll-Buckel am Fuss
/**
 * L2 Gebirgsfuss (Bildziel 2.2(2)): konkaver Hangfuss. Unter FOOT_R Kacheln Randabstand wird der Körper mit
 * (dist / r)^FOOT_P gedämpft (1 ab r): das Massiv wächst aus dem Land statt als Wand zu stehen. An Rinnenausgängen
 * (Krümmung > 0 vor dem Fuss) läuft der Fuss bis FOOT_FAN Kacheln weiter hinaus (Schwemmkegel).
 */
export const FOOT_R = 2.45,
  FOOT_P = 1.6,
  FOOT_FAN = 0.5,
  FOOT_BACK = 0.3;
/** Fussradius je Knoten höchstens FOOT_WIDTH_K · lokaler grösster Randabstand (≈ 0,5 · lokale Breite): schmale Arme behalten ihren Grat. */
/** G3: Arm-Auslauf: lokale Breite (grösster Randabstand in 2 Kacheln) von ARM_LO bis ARM_HI Kacheln blendet die Höhe ein. */
const ARM_LO = 0.4,
  ARM_HI = 1.2;
const FOOT_WIDTH_K = 1,
  FOOT_LOCAL = 2 * SUB; // Radius des Max-Filters (Knoten)
/** Felshügel (< SMALL_MASSIF): Mindestamplitude (px, ≈ 0,9 ISO_H) und Kuppen-Modulation ± HILL_DOME. */
export const HILL_AMP = 29;
const HILL_DOME = 0.18;
const SKEL_SADDLE = 0.45; // Felsgrat kleiner/schmaler Flecken: Sattel zwischen den Kuppen in Anteilen der Gipfelhöhe
/** Obergrenze jeder Massivhöhe (px): Amplitude mal Grate mal Staffelung plus Geröll. */
export const MASSIF_MAX_H = AMP_CAP * (RIDGE_LO + RIDGE_SPAN) * Math.exp(STAGGER_MAX) + BUMP;
const ROT_A = 0.61,
  ROT_B = 1.37,
  ROT_C = 0.23; // Rauschdrehungen (rad): keine achsparallelen Grate

export interface MassifComponent {
  id: number;
  /** Kachelzahl. */
  n: number;
  /** Kachelindizes aufsteigend. */
  tiles: Int32Array;
  /** Kachelrechteck (inklusive). */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Knotengitter über dem Rechteck: nx × ny, Knoten (i, j) liegt bei (x0 + i/SUB, y0 + j/SUB). */
  nx: number;
  ny: number;
  /** Randabstand je Knoten in Kacheln (0 an der Grenze und ausserhalb). */
  dist: Float32Array;
  /** Weichgezeichneter Innen-Anteil je Knoten (0…1), für den gerundeten Sockel. */
  soft: Float32Array;
  /** Grundhöhe je Knoten in Weltpixeln (ohne Gebäude-Sattel). */
  height: Float32Array;
  amp: number;
  /** Schneegrenze (hn) für flache Lagen dieser Komponente (L2 C2), Bisektion in SNOW_HN_MIN … SNOW_HN_MAX */
  snowHn: number;
  /** Schnee-Füllung (G4): Knoten (1) in Löchern der Schneemaske, per Schliessen (Dilatation, Erosion) geschlossen */
  snowFill: Uint8Array;
  /** Fussradius je Knoten in Kacheln (L2 T1): unter diesem Randabstand ist der Körper gedämpft; 0 = kein Fuss */
  footR: Float32Array;
  /** 1 je Kachel des Rechtecks (Zeilen ab y0), die zur Komponente gehört. */
  mask: Uint8Array;
  seed: number;
  width: number;
}
export interface MassifData {
  sig: string;
  seed: number;
  width: number;
  height: number;
  /** Komponente je Kachel, −1 = kein Gebirge. */
  compOf: Int32Array;
  comps: MassifComponent[];
}

// ---------- Komponenten (A1) ----------

const isMountain = (isl: MassifWorld, i: number): boolean => isl.tiles[i]!.terrain === 'mountain';

/** Signatur des Geländeabbilds (nur Gebirge zählt): zwei FNV-Bahnen über die Gebirgskacheln. */
function signature(isl: MassifWorld): string {
  let a = 0x811c9dc5,
    b = 0x9e3779b9 ^ isl.seed;
  for (let i = 0; i < isl.tiles.length; i++)
    if (isMountain(isl, i)) {
      a = Math.imul(a ^ (i + 1), 0x01000193) >>> 0;
      b = Math.imul(b ^ (i + 7), 0x85ebca6b) >>> 0;
      b ^= b >>> 13;
    }
  return `${isl.seed}|${isl.width}x${isl.height}|${a.toString(36)}${b.toString(36)}`;
}

const cache = new WeakMap<object, MassifData>();

/** Komponenten und Höhenfelder, gemerkt je Welt und Geländeabbild; Bauen und Wege ändern nichts (A1). */
export function massifData(isl: MassifWorld): MassifData {
  const sig = signature(isl);
  const hit = cache.get(isl);
  if (hit && hit.sig === sig) return hit;
  const data = buildData(isl, sig);
  cache.set(isl, data);
  return data;
}

function buildData(isl: MassifWorld, sig: string): MassifData {
  const W = isl.width,
    H = isl.height,
    n = W * H;
  const compOf = new Int32Array(n).fill(-1);
  const comps: MassifComponent[] = [];
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!isMountain(isl, i) || compOf[i]! >= 0) continue;
    const id = comps.length;
    const tiles: number[] = [];
    compOf[i] = id;
    stack.push(i);
    while (stack.length) {
      const t = stack.pop()!;
      tiles.push(t);
      const x = t % W,
        y = (t / W) | 0;
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ] as const) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (compOf[k]! < 0 && isMountain(isl, k)) {
          compOf[k] = id;
          stack.push(k);
        }
      }
    }
    tiles.sort((p, q) => p - q);
    comps.push(buildComponent(isl, id, Int32Array.from(tiles), compOf));
  }
  return { sig, seed: isl.seed, width: W, height: H, compOf, comps };
}

/** Landart des nächsten Nicht-Gebirges (für den Sockel): 0 keine Mischung (Wasser, Rand), sonst Index in EDGE_COLORS. */
const EDGE_CODE: Partial<Record<string, number>> = { grass: 1, forest: 2, sand: 3 };
/**
 * Landart des nächsten Nicht-Gebirges je Kachel (4er-Breitensuche, deterministisch). Hängt von Wald/Gras ab (Roden,
 * Aufforsten) und wird deshalb je Zerlegung neu gerechnet, nicht mit dem Höhenfeld gemerkt.
 */
export function nearestLand(isl: PieceWorld): Uint8Array {
  const W = isl.width,
    n = W * isl.height;
  const out = new Uint8Array(n);
  const done = new Uint8Array(n);
  const q = new Int32Array(n);
  let head = 0,
    tail = 0;
  for (let i = 0; i < n; i++)
    if (!isMountain(isl, i)) {
      out[i] = EDGE_CODE[isl.tiles[i]!.terrain] ?? 0;
      done[i] = 1;
      q[tail++] = i;
    }
  while (head < tail) {
    const i = q[head++]!,
      x = i % W,
      y = (i / W) | 0;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= isl.height) continue;
      const k = ny * W + nx;
      if (done[k]) continue;
      done[k] = 1;
      out[k] = out[i]!;
      q[tail++] = k;
    }
  }
  return out;
}

// ---------- Höhenfeld (A2) ----------

const smooth01 = (t: number): number => {
  const v = t < 0 ? 0 : t > 1 ? 1 : t;
  return v * v * (3 - 2 * v);
};

/** Ridged-Noise 1 − |2n − 1|, zwei Oktaven plus feine Zacken, quadriert (scharfe Grate), 0…1. */
export function ridged(seed: number, fx: number, fy: number): number {
  const r1 = 1 - Math.abs(2 * rotNoise(seed + 301, fx, fy, 0.3, ROT_A) - 1);
  const r2 = 1 - Math.abs(2 * rotNoise(seed + 303, fx, fy, 0.62, ROT_B) - 1);
  const r3 = 1 - Math.abs(2 * rotNoise(seed + 309, fx, fy, 1.25, ROT_C) - 1);
  const r = 0.55 * r1 + 0.3 * r2 * (0.5 + 0.5 * r1) + 0.15 * r3;
  return r * r;
}

/** Quadratischer euklidischer Abstand (Felzenszwalb, 1D) über `f`, Ergebnis in `d`. */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
    while (s <= z[k]!) {
      k--;
      s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1]! < q) k++;
    d[q] = (q - v[k]!) * (q - v[k]!) + f[v[k]!]!;
  }
}
/** Euklidischer Abstand je Knoten zur nächsten Quelle (`src` = 1), in Knoten. */
function edt(src: Uint8Array, nx: number, ny: number): Float32Array {
  const BIG = 1e12;
  const g = new Float64Array(nx * ny);
  const m = Math.max(nx, ny);
  const f = new Float64Array(m),
    d = new Float64Array(m),
    v = new Int32Array(m),
    z = new Float64Array(m + 1);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) f[i] = src[j * nx + i] ? 0 : BIG;
    edt1d(f, nx, d, v, z);
    for (let i = 0; i < nx; i++) g[j * nx + i] = d[i]!;
  }
  const out = new Float32Array(nx * ny);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) f[j] = g[j * nx + i]!;
    edt1d(f, ny, d, v, z);
    for (let j = 0; j < ny; j++) out[j * nx + i] = Math.sqrt(d[j]!);
  }
  return out;
}
/** Separabler Max-Filter (Quadrat, Radius r Knoten). */
function maxFilter(f: Float32Array, nx: number, ny: number, r: number): Float32Array {
  const tmp = new Float32Array(f.length),
    out = new Float32Array(f.length);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      let m = 0;
      for (let k = Math.max(0, i - r); k <= Math.min(nx - 1, i + r); k++)
        m = Math.max(m, f[j * nx + k]!);
      tmp[j * nx + i] = m;
    }
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      let m = 0;
      for (let k = Math.max(0, j - r); k <= Math.min(ny - 1, j + r); k++)
        m = Math.max(m, tmp[k * nx + i]!);
      out[j * nx + i] = m;
    }
  return out;
}
/** Separabler Box-Weichzeichner, Ränder geklemmt. */
function boxBlur(f: Float32Array, nx: number, ny: number, r: number): void {
  const tmp = new Float32Array(f.length);
  const span = 2 * r + 1;
  for (let j = 0; j < ny; j++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += f[j * nx + Math.min(nx - 1, Math.max(0, k))]!;
    for (let i = 0; i < nx; i++) {
      tmp[j * nx + i] = acc / span;
      acc += f[j * nx + Math.min(nx - 1, i + r + 1)]! - f[j * nx + Math.max(0, i - r)]!;
    }
  }
  for (let i = 0; i < nx; i++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[Math.min(ny - 1, Math.max(0, k)) * nx + i]!;
    for (let j = 0; j < ny; j++) {
      f[j * nx + i] = acc / span;
      acc += tmp[Math.min(ny - 1, j + r + 1) * nx + i]! - tmp[Math.max(0, j - r) * nx + i]!;
    }
  }
}

function buildComponent(
  isl: MassifWorld,
  id: number,
  tiles: Int32Array,
  compOf: Int32Array,
): MassifComponent {
  const W = isl.width;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const t of tiles) {
    const x = t % W,
      y = (t / W) | 0;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const nx = (x1 - x0 + 1) * SUB + 1,
    ny = (y1 - y0 + 1) * SUB + 1;
  const inTile = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < W && y < isl.height && compOf[y * W + x] === id;
  // Knoten innen, wenn alle berührenden Kacheln zur Komponente gehören; sonst Quelle des Abstands
  const src = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const I = x0 * SUB + i,
        J = y0 * SUB + j;
      src[j * nx + i] = insideNode((x, y) => inTile(x, y), I, J) ? 0 : 1;
    }
  const dist = edt(src, nx, ny);
  // weicher Innen-Anteil (Indikator weichgezeichnet, ≈ 0,5 an geraden Kanten, kleiner an Ecken): rundet den Sockel
  const soft = new Float32Array(nx * ny);
  for (let k = 0; k < soft.length; k++) soft[k] = src[k] ? 0 : 1;
  boxBlur(soft, nx, ny, BLUR);
  boxBlur(soft, nx, ny, BLUR);
  for (let k = 0; k < dist.length; k++) dist[k] = dist[k]! / SUB;
  const blur = Float32Array.from(dist);
  boxBlur(blur, nx, ny, BLUR);
  boxBlur(blur, nx, ny, BLUR);
  let maxBase = 0,
    maxD = 0,
    sMin = Infinity,
    sMax = -Infinity;
  const base = new Float32Array(nx * ny);
  for (let k = 0; k < base.length; k++) {
    if (src[k]) continue;
    base[k] = blur[k]! * smooth01(dist[k]! / RIM);
    maxBase = Math.max(maxBase, base[k]!);
    maxD = Math.max(maxD, dist[k]!);
    const s = (k % nx) + Math.floor(k / nx);
    sMin = Math.min(sMin, s);
    sMax = Math.max(sMax, s);
  }
  const n = tiles.length;
  // Felshügel-Mindesthöhe (Playtest R3): auch ein schmaler Fleck aus 8 Kacheln steht als Hügel, nicht als Platte
  const amp = Math.max(
    HILL_AMP * (0.9 + 0.1 * Math.min(1, n / 9)), // wächst noch leicht mit der Grösse (A2)
    Math.min(AMP_CAP, AMP_K * Math.pow(Math.sqrt(n), AMP_POW), AMP_SLOPE * Math.max(maxD, 0.25)),
  );
  // Grate, Verbeulung und Staffelung laufen bei kleinen Komponenten stetig aus: Felshügel ohne Sonderfall
  const ridgeW = smoothstep(SMALL_MASSIF * 0.75, SMALL_MASSIF * 3, n);
  // Randband nie breiter als der grösste Randabstand: der Hügel erreicht in der Mitte seinen Körper
  const rimR = Math.min(RIM, Math.max(0.3, 0.9 * maxD));
  // Playtest R5: kleine oder schmale Flecken (Randabstand wächst nie) tragen einen Grat entlang ihrer Längsachse mit
  // 1–3 Kuppen; Gewicht 1 bei kleinen Komponenten bzw. Breite ≤ 2 Kacheln, 0 bei grossen breiten Massiven
  const sk = Math.max(1 - ridgeW, 1 - smoothstep(1, 2, maxD));
  let cx = 0,
    cy = 0;
  for (const t of tiles) {
    cx += (t % W) + 0.5;
    cy += ((t / W) | 0) + 0.5;
  }
  cx /= n;
  cy /= n;
  let sxx = 0,
    syy = 0,
    sxy = 0;
  for (const t of tiles) {
    const dx = (t % W) + 0.5 - cx,
      dy = ((t / W) | 0) + 0.5 - cy;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  const phi = 0.5 * Math.atan2(2 * sxy, sxx - syy); // Hauptachse
  const ax = Math.cos(phi),
    ay = Math.sin(phi);
  let tMin = Infinity,
    tMax = -Infinity;
  for (const t of tiles) {
    const u = ((t % W) + 0.5 - cx) * ax + (((t / W) | 0) + 0.5 - cy) * ay;
    tMin = Math.min(tMin, u - 0.5);
    tMax = Math.max(tMax, u + 0.5);
  }
  const len = Math.max(1, tMax - tMin);
  const kuppen = Math.max(1, Math.min(3, Math.round(len / 3)));
  const sMid = (sMin + sMax) / 2,
    sHalf = Math.max(1, (sMax - sMin) / 2);
  const seed = isl.seed;
  const shape = new Float32Array(nx * ny),
    gs = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (src[k] || maxBase <= 0) continue;
      const fx = x0 + i / SUB,
        fy = y0 + j / SUB;
      // Körper: steigt im Randband schnell auf BODY_FLOOR, dann über dem (verbeulten) Randabstand weiter
      const wob = 1 + ridgeW * (0.44 * rotNoise(seed + 305, fx, fy, 0.16, ROT_C) - 0.22);
      const dn = Math.min(1, (base[k]! / maxBase) * wob);
      const body =
        smooth01(dist[k]! / rimR) * (BODY_FLOOR + (1 - BODY_FLOOR) * Math.pow(dn, PROFILE));
      // Grate und Vorberge überall im Massiv (nicht nur am Zentralgipfel); kleine Komponenten: 1–3 runde Kuppen
      const r = ridged(seed, fx, fy);
      const dome = HILL_DOME * (2 * rotNoise(seed + 323, fx, fy, 0.9, ROT_B) - 1);
      shape[k] = body * (1 + ridgeW * (RIDGE_LO + RIDGE_SPAN * r - 1) + (1 - ridgeW) * dome);
      if (sk > 0) {
        const u = (((fx - cx) * ax + (fy - cy) * ay - tMin) / len) * kuppen; // 0 … kuppen entlang der Achse
        const s2 = Math.sin(Math.PI * Math.min(kuppen, Math.max(0, u)));
        // Querprofil nur aus dem Randabstand (voll ab 0,6 · grösstem Randabstand): Grathöhe
        // unabhängig davon, wie weit der Randabstand wächst
        const ridgeLine =
          smooth01(dist[k]! / Math.max(0.3, 0.6 * maxD)) *
          (SKEL_SADDLE + (1 - SKEL_SADDLE) * s2 * s2);
        shape[k] = (1 - sk) * shape[k]! + sk * ridgeLine;
      }
      gs[k] = Math.max(-1, Math.min(1, (sMid - (i + j)) / sHalf));
    }
  // Staffelung: kleinstes β ≥ STAGGER (Schritt 0,05), mit dem die Rückseite im Mittel BACK_RATIO-mal so hoch ist
  let beta = STAGGER;
  for (; beta < STAGGER_MAX; beta += 0.05) {
    let sb = 0,
      nb = 0,
      sf = 0,
      nf = 0;
    for (let k = 0; k < shape.length; k++) {
      if (src[k]) continue;
      const v = shape[k]! * Math.exp(beta * gs[k]!);
      if (gs[k]! > 0) {
        sb += v;
        nb++;
      } else if (gs[k]! < 0) {
        sf += v;
        nf++;
      }
    }
    if (nb === 0 || nf === 0 || sb / nb >= BACK_RATIO * (sf / nf)) break;
  }
  beta = Math.min(beta, STAGGER_MAX) * ridgeW;
  // L2 Fuss: erst nach der Staffelung (β bleibt wie vor L2). Krümmung der Form vor dem Fuss steuert den Schwemmkegel.
  const pre = new Float32Array(nx * ny);
  for (let k = 0; k < pre.length; k++) pre[k] = amp * shape[k]! * Math.exp(beta * gs[k]!);
  const footW = (1 - sk) * smoothstep(1.5, 3, maxD); // Felshügel und schmale Grate: kein Fuss
  const foot = new Float32Array(nx * ny).fill(1);
  const footR = new Float32Array(nx * ny);
  const localMax = maxFilter(dist, nx, ny, FOOT_LOCAL);
  if (footW > 0)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i;
        if (src[k]) continue;
        const lap = pre[k - 1]! + pre[k + 1]! + pre[k - nx]! + pre[k + nx]! - 4 * pre[k]!;
        // Schwemmkegel nur an echten Rinnenausgängen (deutlich positive Krümmung)
        const r =
          Math.min(FOOT_R, FOOT_WIDTH_K * localMax[k]!) +
          FOOT_FAN * smoothstep(0.2 * LAP_REF, 0.6 * LAP_REF, lap);
        footR[k] = r;
        // G3: schmale Arme laufen zur Spitze stetig aus (Höhe folgt der lokalen Breite), keine Einzelzacke
        const arm = smoothstep(ARM_LO, ARM_HI, localMax[k]!);
        if (arm < 1) {
          foot[k] = 1 - footW * (1 - arm);
          footR[k] = Math.max(r, localMax[k]! + 0.05);
        }
        if (dist[k]! >= r) continue;
        // Rückseite (gs > 0) steht höher (Staffelung): ihr Fuss ist flacher gedämpft, die Vorderseite stärker
        const depth =
          footW * (1 - Math.pow(smooth01(dist[k]! / r), FOOT_P)) * (1 - FOOT_BACK * gs[k]!);
        foot[k] = Math.max(0, 1 - depth) * foot[k]!;
      }
  const height = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (src[k] || maxBase <= 0) continue;
      const fx = x0 + i / SUB,
        fy = y0 + j / SUB;
      const dn = Math.min(1, base[k]! / maxBase);
      const rim = smooth01(dist[k]! / rimR);
      const bump = (valueNoise(seed + 307, fx * 1.7, fy * 1.7) - 0.5) * 2 * BUMP * rim * (1 - dn);
      height[k] = Math.max(0, pre[k]! * foot[k]! + bump);
    }
  const snowHn = snowLine(seed, x0, y0, nx, ny, src, height, amp);
  const snowFill = snowFillMask(seed, x0, y0, nx, ny, src, height, amp, snowHn);
  const mask = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      mask[(y - y0) * (x1 - x0 + 1) + x - x0] = inTile(x, y) ? 1 : 0;
    }
  return {
    id,
    n,
    tiles,
    x0,
    y0,
    x1,
    y1,
    nx,
    ny,
    dist,
    soft,
    height,
    amp,
    snowHn,
    snowFill,
    footR,
    mask,
    seed,
    width: W,
  };
}

/**
 * Schneegrenze (hn) einer Komponente: Bisektion, so dass etwa SNOW_TARGET der Knoten Schnee tragen (Spec: über hn 0,8,
 * hier je Komponente angepasst, damit jedes grosse Massiv eine Kappe trägt und keines ganz weiss wird). Komponenten
 * unter SNOW_MIN_AMP: ohne Bedeutung (1).
 */
function snowLine(
  seed: number,
  x0: number,
  y0: number,
  nx: number,
  ny: number,
  src: Uint8Array,
  height: Float32Array,
  amp: number,
): number {
  if (amp < SNOW_MIN_AMP) return 1;
  const hn: number[] = [],
    steep: number[] = [],
    lap: number[] = [],
    fx: number[] = [],
    fy: number[] = [];
  for (let j = 1; j < ny - 1; j++)
    for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      if (src[k]) continue;
      const h = height[k]!;
      hn.push(h / amp);
      steep.push(
        steepness(
          ((height[k + 1]! - height[k - 1]!) / 2) * SUB,
          ((height[k + nx]! - height[k - nx]!) / 2) * SUB,
        ),
      );
      lap.push(height[k - 1]! + height[k + 1]! + height[k - nx]! + height[k + nx]! - 4 * h);
      fx.push(x0 + i / SUB);
      fy.push(y0 + j / SUB);
    }
  const share = (line: number): number => {
    let c = 0;
    for (let q = 0; q < hn.length; q++)
      if (snowField(seed, fx[q]!, fy[q]!, amp, line, hn[q]!, steep[q]!, lap[q]!) >= 0.5) c++;
    return hn.length ? c / hn.length : 0;
  };
  let lo = SNOW_HN_MIN,
    hi = SNOW_HN_MAX;
  if (share(lo) < SNOW_TARGET) return lo; // zu wenig Fläche: tiefste Grenze
  for (let it = 0; it < 10; it++) {
    const mid = (lo + hi) / 2;
    if (share(mid) > SNOW_TARGET) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Löcher der Schneemaske schliessen (G4): Knotenmaske um SNOW_CLOSE Knoten dilatieren, dann erodieren; neu gefüllt
 * werden nur Knoten innerhalb der Schneezone (hn ≥ Schneegrenze minus Rinnenabfall). Die Ränder behalten ihr
 * Rauschen, weil nur Knoten zugefügt werden, die die Maske rundum umschliesst.
 */
function snowFillMask(
  seed: number,
  x0: number,
  y0: number,
  nx: number,
  ny: number,
  src: Uint8Array,
  height: Float32Array,
  amp: number,
  snowHn: number,
): Uint8Array {
  const fill = new Uint8Array(nx * ny);
  if (amp < SNOW_MIN_AMP) return fill;
  const raw = new Uint8Array(nx * ny);
  let any = false;
  for (let j = 1; j < ny - 1; j++)
    for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      if (src[k]) continue;
      const h = height[k]!;
      const steep = steepness(
        ((height[k + 1]! - height[k - 1]!) / 2) * SUB,
        ((height[k + nx]! - height[k - nx]!) / 2) * SUB,
      );
      const lap = height[k - 1]! + height[k + 1]! + height[k - nx]! + height[k + nx]! - 4 * h;
      if (snowField(seed, x0 + i / SUB, y0 + j / SUB, amp, snowHn, h / amp, steep, lap) >= 0.5) {
        raw[k] = 1;
        any = true;
      }
    }
  if (!any) return fill;
  const morph = (m: Uint8Array, grow: boolean): Uint8Array => {
    const tmp = new Uint8Array(m.length),
      out = new Uint8Array(m.length);
    const r = SNOW_CLOSE;
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = grow ? 0 : 1;
        for (let a = Math.max(0, i - r); a <= Math.min(nx - 1, i + r); a++)
          if (grow ? m[j * nx + a] : !m[j * nx + a]) {
            v = grow ? 1 : 0;
            break;
          }
        tmp[j * nx + i] = v;
      }
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = grow ? 0 : 1;
        for (let b = Math.max(0, j - r); b <= Math.min(ny - 1, j + r); b++)
          if (grow ? tmp[b * nx + i] : !tmp[b * nx + i]) {
            v = grow ? 1 : 0;
            break;
          }
        out[j * nx + i] = v;
      }
    return out;
  };
  const closed = morph(morph(raw, true), false);
  for (let k = 0; k < fill.length; k++)
    if (closed[k] && !raw[k] && !src[k] && height[k]! / amp >= snowHn - SNOW_GULLY_DROP)
      fill[k] = 1;
  return fill;
}

/** Knoten (I, J) innen: alle Kacheln, die ihn berühren, erfüllen `inTile`. */
function insideNode(inTile: (x: number, y: number) => boolean, I: number, J: number): boolean {
  const xs = I % SUB === 0 ? [I / SUB - 1, I / SUB] : [Math.floor(I / SUB)];
  const ys = J % SUB === 0 ? [J / SUB - 1, J / SUB] : [Math.floor(J / SUB)];
  for (const y of ys) for (const x of xs) if (!inTile(x, y)) return false;
  return true;
}

/** Kachel (x, y) gehört zur Komponente. */
export const inComp = (c: MassifComponent, x: number, y: number): boolean =>
  x >= c.x0 &&
  y >= c.y0 &&
  x <= c.x1 &&
  y <= c.y1 &&
  c.mask[(y - c.y0) * (c.x1 - c.x0 + 1) + x - c.x0] === 1;

/** Knoten (I, J) (globale Knotenkoordinaten) liegt im Innern der Komponente. */
export function nodeInside(c: MassifComponent, I: number, J: number): boolean {
  return insideNode((x, y) => inComp(c, x, y), I, J);
}
/** Wirksamer Fussradius (Kacheln) am Knoten (I, J): bis 88 % des Radius dämpft der Fuss um mehr als 3 %; 0 ausserhalb oder ohne Fuss. */
export function footRadius(c: MassifComponent, I: number, J: number): number {
  const i = I - c.x0 * SUB,
    j = J - c.y0 * SUB;
  return i < 0 || j < 0 || i >= c.nx || j >= c.ny ? 0 : 0.88 * c.footR[j * c.nx + i]!;
}
/** Grundhöhe am Knoten (I, J) in Weltpixeln; 0 ausserhalb. */
export function nodeHeight(c: MassifComponent, I: number, J: number): number {
  const i = I - c.x0 * SUB,
    j = J - c.y0 * SUB;
  if (i < 0 || j < 0 || i >= c.nx || j >= c.ny) return 0;
  return c.height[j * c.nx + i]!;
}

// ---------- Teilstücke (A5) ----------

export type PieceWorld = MassifWorld & Pick<Island, 'tiles'>;
export interface MassifPiece {
  /** Eindeutig je Welt: 2 × Index der vordersten Kachel + Hälfte (0 rechte, 1 linke Kachelhälfte im Streifen). */
  id: number;
  comp: MassifComponent;
  /** Die Daten der Karte (L6: Entdeckungs-Elemente gelten kartenweit). */
  data: MassifData;
  /** Halbstreifen k: Bild-x ∈ [k · ISO_W/2, (k + 1) · ISO_W/2], Kachelspalten x − y ∈ {k, k + 1}. */
  strip: number;
  /** Kachelindizes hinten nach vorn (Tiefe s = x + y steigt je Schritt um 1). */
  tiles: number[];
  /** Letzte Kachel des vorigen Abschnitts desselben Laufs (wird darunter mitgezeichnet, keine Naht), sonst −1. */
  seam: number;
  /** Landart des nächsten Nicht-Gebirges je Kachel der Welt (`nearestLand`, Sockelfarbe). */
  near: Uint8Array;
  /** Cache-Schlüssel (Geländeabbild, Lage, Landart rund um die Kacheln: Roden/Aufforsten ändert den Sockel). */
  key: string;
}

/**
 * Zerlegt alle Massive in Teilstücke (A5): je Halbstreifen k die maximalen Läufe von Gebirgskacheln (Gebirge ist
 * nicht bebaubar, `isLand` in mapgen.ts; Bebauung grenzt nur aussen an) in Tiefenfolge, geteilt in Abschnitte von höchstens `PIECE_RUN` Kacheln. Deterministisch, hinten
 * nach vorn je Streifen.
 */
export function massifPieces(isl: PieceWorld, data: MassifData = massifData(isl)): MassifPiece[] {
  const W = isl.width,
    H = isl.height;
  const out: MassifPiece[] = [];
  const isM = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < W && y < H && data.compOf[y * W + x]! >= 0;
  const near = nearestLand(isl);
  /** Landart rund um die Kacheln (je 3 × 3), Teil des Cache-Schlüssels. */
  const around = (ts: readonly number[]): string => {
    let out = '';
    for (const t of ts) {
      const tx = t % W,
        ty = (t / W) | 0;
      for (let y = ty - 1; y <= ty + 1; y++)
        for (let x = tx - 1; x <= tx + 1; x++)
          out += x < 0 || y < 0 || x >= W || y >= H ? '9' : String(near[y * W + x]);
    }
    return out;
  };
  const flush = (k: number, run: number[]): void => {
    for (let a = 0; a < run.length; a += PIECE_RUN) {
      const tiles = run.slice(a, a + PIECE_RUN);
      const front = tiles.at(-1)!;
      const comp = data.comps[data.compOf[front]!]!;
      const fx = front % W,
        fy = (front / W) | 0;
      const seam = a > 0 ? run[a - 1]! : -1;
      const id = 2 * front + (fx - fy === k ? 0 : 1);
      out.push({
        id,
        comp,
        data,
        strip: k,
        tiles,
        seam,
        near,
        key: `${data.sig}|${id}|${tiles.length}|${around(seam >= 0 ? [seam, ...tiles] : tiles)}`,
      });
    }
  };
  for (let k = -H; k < W; k++) {
    let run: number[] = [];
    for (let s = 0; s <= W + H - 2; s++) {
      const c = (((s - k) % 2) + 2) % 2 === 0 ? k : k + 1; // Spalte x − y hat die Parität von s
      const x = (s + c) / 2,
        y = (s - c) / 2;
      if (isM(x, y)) run.push(y * W + x);
      else if (run.length) {
        flush(k, run);
        run = [];
      }
    }
    if (run.length) flush(k, run);
  }
  return out;
}

/** Höhe am Knoten (I, J) im Teilstück (Grundhöhe der Komponente). */
export const pieceHeight = (p: MassifPiece, I: number, J: number): number =>
  nodeHeight(p.comp, I, J);

export interface PieceCell {
  /** Zelle mit linkem oberem Knoten (I, J): fx ∈ [I/SUB, (I+1)/SUB], fy ∈ [J/SUB, (J+1)/SUB]. */
  I: number;
  J: number;
  /** 0 ganz, 1 nur links der Zellmitte (u ≤ (I − J)/SUB), 2 nur rechts davon (Streifenkante). */
  part: 0 | 1 | 2;
  /** Zelle der Nahtkachel (gehört zum vorigen Abschnitt, wird nur darunter mitgezeichnet). */
  seam: boolean;
}
/** Netzzellen eines Teilstücks im Halbstreifen, hinten nach vorn (I + J aufsteigend). */
export function pieceCells(p: MassifPiece): PieceCell[] {
  const W = p.comp.width;
  const out: PieceCell[] = [];
  const add = (t: number, seam: boolean): void => {
    const x = t % W,
      y = (t / W) | 0,
      c = x - y;
    const right = c === p.strip; // rechte Kachelhälfte liegt im Streifen
    for (let J = y * SUB; J < (y + 1) * SUB; J++)
      for (let I = x * SUB; I < (x + 1) * SUB; I++) {
        const d = I - J - SUB * c;
        if (right ? d < 0 : d > 0) continue;
        out.push({ I, J, part: d === 0 ? (right ? 2 : 1) : 0, seam });
      }
  };
  if (p.seam >= 0) add(p.seam, true);
  for (const t of p.tiles) add(t, false);
  return out.sort((a, b) => a.I + a.J - (b.I + b.J) || a.I - b.I);
}

// ---------- Färbung (A3) ----------

const LIGHT_ELEV = (32 * Math.PI) / 180; // Licht leicht erhöht
const L3 = {
  x: LIGHT.x * Math.cos(LIGHT_ELEV),
  y: LIGHT.y * Math.cos(LIGHT_ELEV),
  z: Math.sin(LIGHT_ELEV),
};
/** Weltpixel Höhe, die einer Kachel waagrechter Strecke entspricht (Kachelseite 64/√2), für Gefälle und Licht. */
const TILE_PX = 45;
/** Sockel: Mischung ins Nachbargelände nach dem weichen Innen-Anteil (Ecken stärker, gerundet), höchstens EDGE_MIX. */
const SOFT_LO = 0.35,
  SOFT_HI = 0.85,
  EDGE_MIX = 0.1,
  EDGE_MIX_FOREST = 0.15; // dunkler Waldboden zieht den hellen Fuss nicht herunter
/**
 * Sockel ohne Naht (A3, Entscheid lead-art Runde 1; Playtest Runde 3 schmal statt breit): die Kontur ist die
 * Höhenlinie SOFT_CUT des weichgezeichneten Innen-Anteils (an geraden Kanten die Kachelgrenze, an Ecken gerundet);
 * der Rasterizer blendet dort über 1–2 px aus. Davor läuft ein helles Geröll-/Schuttband (DEBRIS).
 */
export const SOFT_CUT = 0.52; // Wert an einer geraden Kante (gemessen), Kontur = Kachelgrenze
const SOFT_A_LO = SOFT_CUT - 0.05,
  SOFT_A_HI = SOFT_CUT + 0.05;
/** Schuttband: voll am Rand (Innen-Anteil SOFT_CUT), aus ab DEBRIS_HI. */
export const DEBRIS_HI = 0.68;
/** Ab dieser Höhe (px) deckt das Netz immer voll: durchsichtig ist nur der flache Sockel. */
export const RIM_H = 6;
const P = LIGHT_COLORS;
/** Bewuchs in denselben Stufen (grassDark/crown, gering eingesetzt). */
export const VEG_TONES: readonly Rgb[] = [
  mixRgb(rgbOf(PALETTE.crown), P.dark, 0.45),
  mixRgb(rgbOf(PALETTE.crown), P.dark, 0.2),
  mixRgb(rgbOf(PALETTE.grassDark), rgbOf(PALETTE.crown), 0.45),
  rgbOf(PALETTE.grassDark),
  mixRgb(rgbOf(PALETTE.grassDark), P.warm, 0.2),
];
/** Helles Geröll-/Schuttband am Massivfuss: rock/rockLight mit etwas sandDry (Playtest R3: kein dunkler Saum). */
export { DEBRIS };
/**
 * Die gemalte Wiese der Geländeebene (G2): `meadowTint` aus terrain.ts auf `grass` (Oliv-Entsättigung bei gleicher
 * Helligkeit). Dort nachgebildet, weil terrain.ts über iso.ts dieses Modul lädt (Zyklus); der Test prüft die Gleichheit.
 */
const MEADOW_OLIVE = rgbOfCss(mixHex(PALETTE.grassDark, PALETTE.sandDry, 0.35)),
  MEADOW_OLIVE_MIX = 0.72;
const luma = (c: Rgb): number => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
export const MEADOW: Rgb = (() => {
  const g = rgbOf(PALETTE.grass),
    k = luma(g) / luma(MEADOW_OLIVE);
  return mixRgb(
    g,
    [MEADOW_OLIVE[0] * k, MEADOW_OLIVE[1] * k, MEADOW_OLIVE[2] * k],
    MEADOW_OLIVE_MIX,
  );
})();
/** Bewuchs unten (L2): Wiesentöne wie die Wiese (grassDark … grassLight), nicht die dunklen Kronentöne. */
export const VEG_GRASS_TONES: readonly Rgb[] = (() => {
  // F4: die gedämpften Oliv-Töne der Geländeebene (wie EDGE_COLORS[1]), nach Tonstufe gestuft
  const w = MEADOW;
  return [
    mixRgb(mixRgb(w, P.dark, 0.3), P.cool, 0.15),
    mixRgb(w, P.dark, 0.15),
    w,
    mixRgb(w, P.warm, 0.12),
    mixRgb(w, P.warm, 0.22),
  ];
})();
/** Bewuchstöne bei relativer Höhe hn: Wiesentöne unten, Kronentöne ab hn 0,35 (weiche Überblendung). */
export const vegTones = (hn: number): readonly Rgb[] => {
  const k = 1 - smoothstep(VEG_GRASS_HN, LOW_HN, hn);
  return k >= 1
    ? VEG_GRASS_TONES
    : k <= 0
      ? VEG_TONES
      : VEG_TONES.map((t, i) => mixRgb(t, VEG_GRASS_TONES[i]!, k));
};
/** Blütenbereich der Alpenwiese (C5): hn 0,2–0,35 auf flachen Lagen. */
export const flowerWeight = (hn: number, steep: number): number =>
  smoothstep(0.2, 0.23, hn) *
  (1 - smoothstep(0.32, LOW_HN, hn)) *
  (1 - smoothstep(0.2, 0.4, steep));
/**
 * Schnee (L2 C2): drei Stufen, nach der Tonstufe des Felses darunter, von warmweiss (Licht) bis kühlblau (Schatten);
 * nie heller als `foam`. Rampe mit 5 Einträgen für `toneColor`: Stufen 0–1 Schatten (kühl), 2–3 Mitte, 4 Licht (nur Lichtseite).
 */
const SNOW_LIGHT = mixRgb(rgbOf(PALETTE.foam), P.warm, 0.08),
  SNOW_MID = mixRgb(rgbOf(PALETTE.foam), P.light, 0.15),
  SNOW_SHADE = mixRgb(mixRgb(rgbOf(PALETTE.foam), P.cool, 0.22), P.light, 0.08);
export const SNOW_TONES: readonly Rgb[] = [SNOW_SHADE, SNOW_SHADE, SNOW_MID, SNOW_MID, SNOW_LIGHT];
/** Schnee nur auf Komponenten mit dieser Amplitude (px) und mehr. */
export const SNOW_MIN_AMP = 90;
/** Schneegrenze (hn): flache Lagen darüber, Rinnen (Krümmung > 0) bis SNOW_HN_GULLY hinab; Rand ± SNOW_JITTER nach Rauschen. */
const SNOW_HN_MIN = 0.66,
  SNOW_HN_MAX = 1.1,
  SNOW_TARGET = 0.045, // Anteil der Komponentenknoten mit Schnee (Bisektion der Schneegrenze)
  SNOW_GULLY_DROP = 0.12, // Rinnen: Schneegrenze so viel tiefer (≈ 0,65 bei Grenze 0,8)
  SNOW_CLOSE = 2, // Knoten: Schliessen der Schneemaske (Dilatation, dann Erosion)
  SNOW_JITTER = 0.05,
  SNOW_STEEP = 0.45;
export const L2_SNOW_SALT = 533;
/**
 * Schneefeld 0…1 am Netzpunkt (Schwelle 0,5 beim Rastern, 1–2 px weicher Rand): reine Funktion der Knotenwerte, auch
 * für die Maske im Kerntest. 0 bei Komponenten unter SNOW_MIN_AMP.
 */
export function snowField(
  seed: number,
  fx: number,
  fy: number,
  amp: number,
  snowHn: number,
  hn: number,
  steep: number,
  lap: number,
): number {
  if (amp < SNOW_MIN_AMP) return 0;
  const rinne = smoothstep(0.3, 0.6, Math.max(-1, Math.min(1, lap / LAP_REF)));
  const edge =
    snowHn -
    SNOW_GULLY_DROP * rinne +
    SNOW_JITTER * (2 * rotNoise(seed + L2_SNOW_SALT, fx, fy, 1.1, ROT_B) - 1);
  const lage = hn - edge;
  return (
    smoothstep(-0.05, 0.05, lage) *
    (1 -
      smoothstep(
        SNOW_STEEP + 0.5 * smoothstep(0.75, 0.95, hn),
        SNOW_STEEP + 0.5 * smoothstep(0.75, 0.95, hn) + 0.15,
        steep,
      ))
  ); // Gipfelflächen ohne Löcher;
}
/** Mittlere Stufe der ebenen Fläche (Fuss, Plateau). */
export const TONE_FLAT = 2;
const TONE_GAIN = 2.4; // Stufen je Einheit relativer Beleuchtung auf der Lichtseite
const TONE_GAIN_SHADE = 1.6; // auf der Schattenseite (die dem Blick zugewandten Flanken sollen nicht absaufen)
const TONE_NOISE = 0.22; // grossflächige Tönung ± (Stufen): die Stufengrenzen wandern, kein Kachelraster
/** Unterhalb LOW_HN_FROM Tonumfang auf TONE_FLAT ± 1 gestaucht, bis LOW_HN überblendet; Rauschanteil dort. */
const LOW_HN_FROM = 0.2,
  LOW_HN = 0.35,
  LOW_NOISE = 0.4;
const LAP_REF = 16; // px Krümmung für volle Grat- bzw. Rinnenkante
/** Sockelfarbe je Landart (Index = Code aus `nearestLand`; 0 = keine Mischung). */
export const EDGE_COLORS: readonly (Rgb | null)[] = [
  null,
  MEADOW,
  rgbOfCss(FOREST_FLOOR),
  rgbOf(PALETTE.sandDry),
];

/**
 * Wiesenfuss (F3, G2): unter einer Schwelle auf hn (0,2 ± 0,08 nach Rauschen, Salz 535) ist der Fuss Wiese mit Kies.
 * Das Feld (0…1, Schwelle 0,5) wird je Pixel gestuft (1–2 px Übergang wie die Bewuchsflecken): Fels läuft in Zungen
 * und Rinnen in die Wiese, die Wiese in Bändern hinauf.
 */
export const FOOT_GRASS = 0.5,
  L2_FOOT_SALT = 538;
const FOOT_THR = 0.62,
  FOOT_HN_TOP = 0.25,
  FOOT_STEP = 0.1;
export function footField(seed: number, fx: number, fy: number, hn: number, e: Rgb | null): number {
  if (e === null) return 0;
  // Flecken statt Fläche (Review R1): Rauschen gegen eine Schwelle, die mit hn steigt; unten rund FOOT_SHARE Wiese,
  // der Fels (Kies) bleibt Fels; die Wiese steigt in Bändern, wo das Rauschen hoch ist, bis hn FOOT_HN_TOP
  const n = rotNoise(seed + L2_FOOT_SALT, fx, fy, 1.3, ROT_A);
  const thr = FOOT_THR + (1 - FOOT_THR + 0.15) * smoothstep(0, FOOT_HN_TOP, hn);
  return Math.max(0, Math.min(1, 0.5 + (n - thr) / FOOT_STEP));
}
/** Zielfarbe des Fusses: Nachbargelände, bei Wald und Wasser die Wiese. */
const footTarget = (e: Rgb | null): Rgb => (e && e !== EDGE_COLORS[2] ? e : EDGE_COLORS[1]!);
const edgeMix = (e: Rgb): number => (e === EDGE_COLORS[2] ? EDGE_MIX_FOREST : EDGE_MIX);

export interface CellShade {
  /** mittlere Höhe (px) */
  h: number;
  /** Höhe relativ zur Amplitude der Komponente (0 Fuss, ≈ 1 Gipfel) */
  hn: number;
  /** Gefälle in px je Kachel (positiv: steigt nach +x bzw. +y) */
  gx: number;
  gy: number;
  /** Krümmung (Summe der Nachbarn − 4 · Mitte, px): positiv in Rinnen */
  lap: number;
  /** Anteil der eigenen Farbe am Sockel: 0 = EDGE_MIX Nachbargelände (Ecken), 1 = keine Mischung (innen) */
  rim: number;
  /** Farbe des Nachbargeländes oder `null` */
  edge: Rgb | null;
  /** weicher Innen-Anteil (Schuttband am Rand); fehlt = innen */
  soft?: number;
  /** Amplitude der Komponente (px): Schnee nur ab SNOW_MIN_AMP; fehlt = kein Schnee */
  amp?: number;
  snowHn?: number;
  /** Knoten in einem geschlossenen Schneeloch */
  snowFill?: boolean;
}
/** Anteil des Schuttbands 0…1 aus dem weichen Innen-Anteil. */
export const debrisOf = (soft: number): number => 1 - smoothstep(SOFT_CUT, DEBRIS_HI, soft);

/** Steilheit 0…1 aus dem Gefälle (px je Kachel). */
export const steepness = (gx: number, gy: number): number =>
  smoothstep(0.35, 1.15, Math.hypot(gx, gy) / TILE_PX);

/** Relative Beleuchtung (Lambert gegen die ebene Fläche, 1 = eben, > 1 Lichtseite, < 1 Schattenseite). */
export function relLight(gx: number, gy: number): number {
  const nx = -gx / TILE_PX,
    ny = -gy / TILE_PX;
  return (nx * L3.x + ny * L3.y + L3.z) / Math.hypot(nx, ny, 1) / L3.z;
}

/** Stetige Tonstufe 0…4 an einem Netzpunkt: Licht, grossflächige Tönung, etwas dunkler in tiefen Lagen. */
export function toneLevel(seed: number, fx: number, fy: number, s: CellShade): number {
  const rl = relLight(s.gx, s.gy);
  // Playtest R5: flache Oberseiten (Kuppen, Plateaus) nie in den dunklen Stufen
  const top = (1 - smoothstep(0.25, 0.45, steepness(s.gx, s.gy))) * smoothstep(0.35, 0.55, s.hn);
  const tone =
    0.7 * (rotNoise(seed + 311, fx, fy, 0.55, ROT_C) - 0.5) +
    0.3 * (rotNoise(seed + 315, fx, fy, 1.6, ROT_A) - 0.5);
  const gain = (rl >= 1 ? TONE_GAIN : TONE_GAIN_SHADE) * (rl - 1),
    lift = 0.35 * (Math.min(1, s.hn) - 0.4);
  const t = TONE_FLAT + gain + 2 * TONE_NOISE * tone + lift;
  const full = Math.max(0, TONE_FLAT - 2 * (1 - top), Math.min(ROCK_TONES.length - 1, t));
  if (s.hn >= LOW_HN) return full;
  // L2 Kontrast nach Höhe: unten Tonumfang gestaucht (T in TONE_FLAT ± 1, Rauschen 0,4-fach), bei LOW_HN_FROM … LOW_HN
  // sanft zum vollen Wert (hn ≥ LOW_HN bitgleich wie vor L2)
  // Fuss nicht dunkler als die Flanke: nicht nach unten verschoben, Stufe 1 nur an steilen Schattenhängen (F3)
  const lo = -smoothstep(0.35, 0.75, steepness(s.gx, s.gy));
  const squeezed = TONE_FLAT + Math.max(lo, Math.min(1, gain + 2 * TONE_NOISE * LOW_NOISE * tone));
  const k = smoothstep(LOW_HN_FROM, LOW_HN, s.hn);
  return squeezed + (full - squeezed) * k;
}

/** Salze von L2 Gebirge (Block 530–539, Liste in groundDecor.ts): Bewuchsvariante, Blütenraster, Blütenton. */
const L2_VARIANT_SALT = 500; // hash2(seed + 500, 0, 3): Inselvariante (k = 3 = Gebirge)
export const L2_FLOWER_SALT = 530,
  L2_FLOWER_TONE_SALT = 531;
/** Bewuchsdichte unten je Insel: Gewinn 1 ± BASE_VEG_VARIANT aus der Inselvariante (Anteil 20–35 %). */
const VEG_LOW_BIAS = 0.3,
  VEG_LOW_GAIN = 1.0,
  VEG_LOW_VARIANT = 0.22;
/** Bis zu dieser relativen Höhe (hn) wächst Gras in Rinnen und auf Schultern; darüber nichts (Kern bleibt Referenz). */
const VEG_TOP_HN = 0.3;
/** Weicher Übergang der Bewuchsfarbe: Wiesentöne unter VEG_GRASS_HN, Kronentöne darüber. */
const VEG_GRASS_HN = 0.25;

/**
 * Bewuchs-Feld 0…1 am Netzpunkt (Schwelle 0,5 beim Rastern): Flecken in tiefen, flachen Lagen; ab hn 0,35 unverändert
 * (Kern). L2: unter hn 0,3 Gras auf Schultern (flach) und in Rinnen (Krümmung > 0), Dichte je Insel aus der Variante.
 */
function vegField(
  seed: number,
  fx: number,
  fy: number,
  hn: number,
  steep: number,
  lap: number,
): number {
  const n = rotNoise(seed + 317, fx, fy, 1.9, ROT_A);
  if (hn >= LOW_HN) return n * 0.25; // wie vor L2 (der Tiefenfaktor war dort schon 0)
  const rinne = smoothstep(0.3, 0.7, Math.max(-1, Math.min(1, lap / LAP_REF)));
  // keine flächigen Teppiche auf Graten (Krümmung < 0): Bewuchs weicht der Kante
  const grat = smoothstep(0.1, 0.5, Math.max(-1, Math.min(1, -lap / LAP_REF)));
  const flach = Math.max(1 - steep, 0.85 * rinne) * (1 - 0.8 * grat);
  const low =
    smoothstep(0.01, 0.05, hn) * (1 - smoothstep(VEG_TOP_HN - 0.08, VEG_TOP_HN, hn)) * flach;
  const variant = 1 + VEG_LOW_VARIANT * (2 * hash2(seed + L2_VARIANT_SALT, 0, 3) - 1);
  return Math.min(1, n * (0.25 + VEG_LOW_GAIN * variant * low) + VEG_LOW_BIAS * variant * low);
}
/** Geröll-Feld 0…1 am Netzpunkt: tiefe, flache Lagen und Fuss der Flanken. */
function rubbleField(seed: number, fx: number, fy: number, hn: number, steep: number): number {
  // am flachen Fuss (hn < 0,22, nicht steil) kein Gesprenkel, an steilen Fussflanken bleibt das Geröll
  const low = (1 - smoothstep(0.08, 0.4, hn)) * (1 - (1 - smoothstep(0.1, 0.22, hn)) * (1 - steep));
  return low * (0.4 + 0.6 * steep) * smoothstep(0.3, 0.6, rotNoise(seed + 319, fx, fy, 1.7, ROT_B));
}

/**
 * Farbe an einem Netzpunkt (A3), ohne weiche Übergänge: gestufte Tonstufe, Grat-/Rinnenkante, Bewuchs, Sockel. Für
 * Tests und als Füllfarbe der Netzdreiecke; gerastert wird je Pixel mit denselben Regeln (`rocks.ts`).
 */
export function shadeColor(seed: number, fx: number, fy: number, s: CellShade): Rgb {
  const steep = steepness(s.gx, s.gy);
  const st = toneStep(toneLevel(seed, fx, fy, s), 0);
  const veg = vegField(seed, fx, fy, s.hn, steep, s.lap) >= 0.5 ? 1 : 0;
  const vt = vegTones(s.hn);
  let c = mixRgb(toneColor(st), toneColor(st, vt), VEG_MIX * veg);
  const e = Math.max(-1, Math.min(1, -s.lap / LAP_REF));
  if (e > EDGE_ON && st >= TONE_FLAT) c = mixRgb(c, ROCK_TONES[4]!, RIDGE_HI);
  if (e < -EDGE_ON) c = mixRgb(c, ROCK_TONES[0]!, RINNE_LO);
  if (
    s.amp !== undefined &&
    (s.snowFill || snowField(seed, fx, fy, s.amp, s.snowHn ?? 1, s.hn, steep, s.lap) >= 0.5)
  )
    c = toneColor(st, SNOW_TONES);
  c = mixRgb(c, DEBRIS, DEBRIS_MIX * debrisOf(s.soft ?? 1));
  if (s.edge && s.rim < 1) c = mixRgb(c, s.edge, edgeMix(s.edge) * (1 - s.rim));
  if (footField(seed, fx, fy, s.hn, s.edge) >= 0.5) c = mixRgb(c, footTarget(s.edge), FOOT_GRASS);
  return c;
}
/** Bewuchsanteil eines Flecks, Schwellen der Grat- und Rinnenkante und ihre Stärke. */
export const VEG_MIX = 0.75,
  EDGE_ON = 0.72,
  RIDGE_HI = 0.75,
  RINNE_LO = 0.55;
/** Wie `shadeColor`, als CSS-Farbe. */
export function cellColor(seed: number, fx: number, fy: number, s: CellShade): string {
  const c = shadeColor(seed, fx, fy, s);
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}

/** Netzpunkt eines Teilstücks: Attribute, die der Rasterizer je Pixel interpoliert und stuft. */
export interface NodeShade {
  /** Füllfarbe ohne weiche Übergänge (Tests, Netzdreiecke). */
  c: Rgb;
  /** Deckkraft 0…1 (nur im Sockelband < 1). */
  a: number;
  h: number;
  steep: number;
  /** stetige Tonstufe 0…4 */
  t: number;
  /** Grat (+1) bzw. Rinne (−1) aus der Krümmung */
  e: number;
  /** Bewuchs- und Geröll-Feld */
  veg: number;
  /** Anteil der Wiesentöne an der Bewuchsfarbe (1 unten, 0 ab hn 0,35) und Blütenbereich (0…1, hn 0,2–0,35, flach) */
  vlow: number;
  flower: number;
  /** Wiesenfuss-Feld 0…1 (Schwelle 0,5) und Zielfarbe */
  foot: number;
  fc: Rgb;
  /** Schneefeld 0…1 (Schwelle 0,5), nur Komponenten mit amp ≥ SNOW_MIN_AMP */
  snow: number;
  rub: number;
  /** weicher Innen-Anteil (Kontur bei SOFT_CUT, Schuttband) und Deckkraft aus der Höhe (h ≥ RIM_H deckt immer) */
  soft: number;
  ah: number;
  /** Sockel: Anteil und Farbe des Nachbargeländes */
  mix: number;
  ec: Rgb;
  /** Phasenversatz der Schichtbänder (verworfen, gedreht). */
  warp: number;
}
/**
 * Netzpunkte eines Teilstücks, gemerkt: Attribute hängen nur von (Komponente, Sattel, Knoten) ab, die geteilten
 * Randzellen zweier Halbstreifen bekommen also exakt dieselben Werte (keine Naht an der Streifenkante).
 */
export function pieceNodes(p: MassifPiece): (I: number, J: number) => NodeShade {
  const c = p.comp;
  const hm = new Map<number, number>(),
    nm = new Map<number, NodeShade>();
  const hAt = (I: number, J: number): number => {
    const k = J * 100000 + I;
    let v = hm.get(k);
    if (v === undefined) {
      v = pieceHeight(p, I, J);
      hm.set(k, v);
    }
    return v;
  };
  const W = c.width;
  return (I, J) => {
    const k = J * 100000 + I;
    const hit = nm.get(k);
    if (hit) return hit;
    const h = hAt(I, J);
    const gx = ((hAt(I + 1, J) - hAt(I - 1, J)) / 2) * SUB,
      gy = ((hAt(I, J + 1) - hAt(I, J - 1)) / 2) * SUB;
    const lap = hAt(I - 1, J) + hAt(I + 1, J) + hAt(I, J - 1) + hAt(I, J + 1) - 4 * h;
    const i = I - c.x0 * SUB,
      j = J - c.y0 * SUB;
    const soft = i < 0 || j < 0 || i >= c.nx || j >= c.ny ? 0 : c.soft[j * c.nx + i]!;
    const tx = Math.min(c.x1, Math.max(c.x0, Math.floor((I - 0.5) / SUB))),
      ty = Math.min(c.y1, Math.max(c.y0, Math.floor((J - 0.5) / SUB)));
    const fx = I / SUB,
      fy = J / SUB;
    const hn = h / c.amp;
    const edge = EDGE_COLORS[p.near[ty * W + tx]!] ?? null;
    const sh: CellShade = {
      h,
      hn,
      gx,
      gy,
      lap,
      rim: smoothstep(SOFT_LO, SOFT_HI, soft),
      edge,
      soft,
      amp: c.amp,
      snowHn: c.snowHn,
      snowFill: c.snowFill[j * c.nx + i] === 1,
    };
    const steep = steepness(gx, gy);
    const out: NodeShade = {
      c: shadeColor(c.seed, fx, fy, sh),
      // Sockel ohne Naht (Entscheid lead-art Runde 1): nur das flache Randband (h < RIM_H) blendet in die
      // Geländeebene aus; dort zeigt sie ihren eigenen Felsgrund mit gerundeter Typgrenze statt der Kachelkontur
      a: Math.max(smoothstep(SOFT_A_LO, SOFT_A_HI, soft), smoothstep(RIM_H * 0.25, RIM_H, h)),
      soft,
      ah: smoothstep(RIM_H * 0.25, RIM_H, h),
      h,
      steep,
      t: toneLevel(c.seed, fx, fy, sh),
      e: Math.max(-1, Math.min(1, -lap / LAP_REF)),
      veg: vegField(c.seed, fx, fy, hn, steep, lap),
      snow: Math.max(
        snowField(c.seed, fx, fy, c.amp, c.snowHn, hn, steep, lap),
        c.snowFill[j * c.nx + i] ? 1 : 0,
      ),
      vlow: 1 - smoothstep(VEG_GRASS_HN, LOW_HN, hn),
      flower: flowerWeight(hn, steep),
      rub: rubbleField(c.seed, fx, fy, hn, steep),
      mix: edge ? edgeMix(edge) * (1 - sh.rim) : 0,
      ec: edge ?? ROCK_TONES[TONE_FLAT]!,
      foot: footField(c.seed, fx, fy, hn, edge),
      fc: footTarget(edge),
      warp: 3.2 * rotNoise(c.seed + 313, fx, fy, 0.7, ROT_B),
    };
    nm.set(k, out);
    return out;
  };
}

export interface MeshCell extends PieceCell {
  /** Ecken (I,J), (I+1,J), (I+1,J+1), (I,J+1). */
  n: [NodeShade, NodeShade, NodeShade, NodeShade];
}
/** Netz eines Teilstücks: Zellen hinten nach vorn mit ihren Eckpunkten (rein, ohne Projektion). */
export function pieceMesh(p: MassifPiece): MeshCell[] {
  const at = pieceNodes(p);
  return pieceCells(p).map((cell) => {
    const { I, J } = cell;
    return { ...cell, n: [at(I, J), at(I + 1, J), at(I + 1, J + 1), at(I, J + 1)] };
  });
}

// ---------- Krüppelbäume (L2 C3) ----------

/** Salz der Baumauswahl und der Formvariante (Block 530–539, Liste in groundDecor.ts). */
export const L2_TREE_SALT = 534;
const TREE_HN_MIN = 0.08,
  TREE_HN_MAX = 0.5,
  TREE_STEEP_MAX = 0.7,
  TREE_SPACING = 1.5 * SUB, // Knoten (Abstand ≥ 1,5 Kacheln)
  TREE_MAX_BIG = 20,
  TREE_MAX_SMALL = 3,
  TREE_BIG_N = 24, // grosses Massiv: amp ≥ SNOW_MIN_AMP oder n ≥ TREE_BIG_N
  TREE_PER_TILES = 22, // etwa ein Baum je so viele Kacheln, im Rahmen der Obergrenzen
  TREE_MASK_R = 2; // Baummaske: Knoten im Umkreis von 2 Knoten um den Anker
export interface MassifTree {
  /** Anker: Knoten (globale Knotenkoordinaten), (I − J) mod 4 = 2 = Mitte des Halbstreifens */
  I: number;
  J: number;
  /** Höhe des Geländes am Anker (px) */
  h: number;
  /** Baumhöhe in Weltpixeln (14–20) */
  height: number;
  /** Windschiefe: Krone neigt sich um so viele Weltpixel zur Seite (−3 … 3) */
  lean: number;
  /** Kronenlappen (3) */
  lobes: number;
  /** Formvariante 0…1 */
  v: number;
}
export interface MassifTrees {
  trees: MassifTree[];
  /** Knoten im Umkreis von TREE_MASK_R Knoten um einen Anker (Schlüssel J · 100000 + I) */
  mask: Set<number>;
}
const treeCache = new WeakMap<MassifComponent, MassifTrees>();

/**
 * Krüppelbäume einer Komponente, gemerkt: Anker auf Knoten in der Mitte des Halbstreifens (kein Baum quert eine
 * Streifenkante), in Bewuchs- oder Rinnenlage, hn 0,08–0,5, nicht steil, nicht im Schnee; Auswahl nach
 * `hash2(seed + 534, I, J)`, Abstand ≥ 1,5 Kacheln. 3–20 je grossem Massiv, höchstens 3 je kleinem. Rein.
 */
export function massifTrees(c: MassifComponent): MassifTrees {
  const hit = treeCache.get(c);
  if (hit) return hit;
  const big = c.amp >= SNOW_MIN_AMP || c.n >= TREE_BIG_N;
  const cap = big
    ? Math.max(3, Math.min(TREE_MAX_BIG, Math.round(c.n / TREE_PER_TILES)))
    : Math.min(TREE_MAX_SMALL, Math.floor(c.n / 8));
  const cand: { I: number; J: number; r: number }[] = [];
  for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
    for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) {
      if ((((I - J) % 4) + 4) % 4 !== 2 || !nodeInside(c, I, J)) continue;
      const h = nodeHeight(c, I, J),
        hn = h / c.amp;
      if (hn < TREE_HN_MIN || hn >= TREE_HN_MAX) continue;
      const gx = ((nodeHeight(c, I + 1, J) - nodeHeight(c, I - 1, J)) / 2) * SUB,
        gy = ((nodeHeight(c, I, J + 1) - nodeHeight(c, I, J - 1)) / 2) * SUB;
      const lap =
        nodeHeight(c, I - 1, J) +
        nodeHeight(c, I + 1, J) +
        nodeHeight(c, I, J - 1) +
        nodeHeight(c, I, J + 1) -
        4 * h;
      const steep = steepness(gx, gy);
      if (steep >= TREE_STEEP_MAX) continue;
      const fx = I / SUB,
        fy = J / SUB;
      const rinne = Math.max(-1, Math.min(1, -lap / LAP_REF)) < -0.3;
      if (!rinne && vegField(c.seed, fx, fy, hn, steep, lap) < 0.5) continue;
      if (snowField(c.seed, fx, fy, c.amp, c.snowHn, hn, steep, lap) >= 0.5) continue;
      cand.push({ I, J, r: hash2(c.seed + L2_TREE_SALT, I, J) });
    }
  cand.sort((a, b) => a.r - b.r || a.J - b.J || a.I - b.I);
  const trees: MassifTree[] = [];
  for (const k of cand) {
    if (trees.length >= cap) break;
    if (trees.some((t) => Math.hypot(t.I - k.I, t.J - k.J) < TREE_SPACING)) continue;
    const v = hash2(c.seed + L2_TREE_SALT + 1, k.I, k.J);
    trees.push({
      I: k.I,
      J: k.J,
      h: nodeHeight(c, k.I, k.J),
      height: 14 + Math.round(6 * hash2(c.seed + L2_TREE_SALT + 2, k.I, k.J)),
      lean: (hash2(c.seed + L2_TREE_SALT + 3, k.I, k.J) - 0.5) * 6,
      lobes: 3,
      v,
    });
  }
  const mask = new Set<number>();
  for (const t of trees)
    for (let dj = -TREE_MASK_R; dj <= TREE_MASK_R; dj++)
      for (let di = -TREE_MASK_R; di <= TREE_MASK_R; di++) mask.add((t.J + dj) * 100000 + t.I + di);
  const out = { trees, mask };
  treeCache.set(c, out);
  return out;
}
/** Knoten (I, J) liegt in der Baummaske (Umkreis von 2 Knoten um einen Anker). */
export const massifTreeMask = (c: MassifComponent, I: number, J: number): boolean =>
  massifTrees(c).mask.has(J * 100000 + I);

// ---------- Entdecken (L6 C6–C9): Bergsee, Wasserfall, Höhle, Steinmännchen ----------
//
// Je Karte (über alle Komponenten) höchstens ein Element je Art. Erst die Eignung (das Gelände entscheidet: Mulde,
// Rinne, Schattenflanke, höchster Gipfel), dann das Los (`hash2(seed + Salz, 0, 0) < p`, p aus der gemessenen
// Eignungsrate, damit der Anteil über alle Seeds im Quotenband liegt). Die Elemente ändern die Höhen nicht (kein
// Eingriff ins Netz): sie sind Abziehbilder bzw. ein kleines Objekt, die `rocks.ts` im Dreiecks-Shader bzw. wie
// einen Baum zeichnet. Reine Mathematik, keine Projektion ausser den Bildpunkt-Formeln der Geometrie.

export const L6_LAKE_SALT = 576, // Los, +1 Form (Uferradien)
  L6_FALL_SALT = 578, // Los, +1 Form (Breite)
  L6_CAVE_SALT = 580, // Los, +1 Form (Umriss)
  L6_CAIRN_SALT = 582; // Los, +1 Form (Steine)
/**
 * Lospunkte p = min(1, Quote / Eignungsrate). Messung (`createWorld(seed, { unlockAll: true })`, Seeds 1–400):
 * Eignungsrate Bergsee 34,8 %, Wasserfall 53,5 %, Höhle 88,3 %, Steinmännchen 94,5 %; Quoten 25 / 20 / 20 / 45 %.
 * Ergebnis mit Los und Überlappungsprüfung: Seeds 1–100 27 / 19 / 22 / 46 %, Seeds 1–400 21,0 / 15,5 / 24,8 / 42,8 %.
 */
export const L6_LOT = { lake: 0.72, fall: 0.37, cave: 0.23, cairn: 0.48 } as const;

interface NodeInfo {
  h: number;
  hn: number;
  steep: number;
  lap: number;
  /** Grat (+1) bzw. Rinne (−1) wie `NodeShade.e` */
  e: number;
  rl: number;
  /** Gefälle-Vektor (px je Kachel), Gefälle abwärts = −(gx, gy) */
  gx: number;
  gy: number;
}
function nodeInfo(c: MassifComponent, I: number, J: number): NodeInfo {
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
    steep: steepness(gx, gy),
    lap,
    e: Math.max(-1, Math.min(1, -lap / LAP_REF)),
    rl: relLight(gx, gy),
    gx,
    gy,
  };
}
const nodeSnow = (c: MassifComponent, I: number, J: number, n: NodeInfo): boolean =>
  c.snowFill[(J - c.y0 * SUB) * c.nx + I - c.x0 * SUB] === 1 ||
  snowField(c.seed, I / SUB, J / SUB, c.amp, c.snowHn, n.hn, n.steep, n.lap) >= 0.5;
const nkey = (I: number, J: number): number => J * 100000 + I;
/** Liegt einer der Knoten im Schnee? */
function snowIn(c: MassifComponent, nodes: Set<number>): boolean {
  for (const k of nodes) {
    const I = k % 100000,
      J = (k - I) / 100000;
    if (nodeSnow(c, I, J, nodeInfo(c, I, J))) return true;
  }
  return false;
}
/** Alle Knoten (I ± r, J ± r) innen? */
function boxInside(c: MassifComponent, I: number, J: number, r: number): boolean {
  for (let j = J - r; j <= J + r; j++)
    for (let i = I - r; i <= I + r; i++) if (!nodeInside(c, i, j)) return false;
  return true;
}
/** Höhe (px) an einem Kachelpunkt, bilinear zwischen den Knoten. */
export function heightAtF(c: MassifComponent, fx: number, fy: number): number {
  const u = fx * SUB,
    v = fy * SUB;
  const I = Math.floor(u),
    J = Math.floor(v),
    tx = u - I,
    ty = v - J;
  const a = nodeHeight(c, I, J) + (nodeHeight(c, I + 1, J) - nodeHeight(c, I, J)) * tx,
    b = nodeHeight(c, I, J + 1) + (nodeHeight(c, I + 1, J + 1) - nodeHeight(c, I, J + 1)) * tx;
  return a + (b - a) * ty;
}

/** Höchste Massivhöhe (px) an einem Kachelpunkt über alle Komponenten der Karte (0 ausserhalb). */
function heightAnywhere(data: MassifData, fx: number, fy: number): number {
  let m = 0;
  for (const c of data.comps)
    if (fx >= c.x0 && fx <= c.x1 + 1 && fy >= c.y0 && fy <= c.y1 + 1)
      m = Math.max(m, heightAtF(c, fx, fy));
  return m;
}
/** Blick von vorn (Kamera schaut Richtung −x −y) und Mindestabstand: so viele Kacheln nach +x +y wird geprüft. */
const SIGHT_RANGE = 4,
  SIGHT_STEP = 0.1;
/**
 * Liegt der Kachelpunkt (fx, fy) in Höhe h frei im Bild? Entlang der Blicklinie nach vorn (+x +y, gleiche Bild-x) darf
 * kein Gelände den Punkt verdecken: das Bild-y der Fläche davor (32 px je Kachel nach unten, minus ihre Höhe) liegt
 * mindestens `margin` px unter dem des Punkts.
 */
function sightFree(data: MassifData, fx: number, fy: number, h: number, margin: number): boolean {
  for (let t = SIGHT_STEP; t <= SIGHT_RANGE; t += SIGHT_STEP)
    if (heightAnywhere(data, fx + t, fy + t) - h > 2 * SUB * (ISO_H / 2 / SUB) * t - margin)
      return false;
  return true;
}
/** Knoten im Umkreis `r` (Kacheln) um (cx, cy). */
function discNodes(cx: number, cy: number, r: number): Set<number> {
  const out = new Set<number>();
  const R = Math.ceil(r * SUB) + 1;
  const I0 = Math.round(cx * SUB),
    J0 = Math.round(cy * SUB);
  for (let J = J0 - R; J <= J0 + R; J++)
    for (let I = I0 - R; I <= I0 + R; I++)
      if (Math.hypot(I / SUB - cx, J / SUB - cy) <= r) out.add(nkey(I, J));
  return out;
}
function boxNodes(I: number, J: number, r: number): Set<number> {
  const out = new Set<number>();
  for (let j = J - r; j <= J + r; j++) for (let i = I - r; i <= I + r; i++) out.add(nkey(i, j));
  return out;
}

// --- C6 Bergsee ---
const LAKE_RAYS = 16,
  LAKE_STEP = 0.05, // Kacheln
  LAKE_RISE = 3, // px: das Ufer liegt dort, wo das Gelände so viel über den Spiegel steigt
  LAKE_R_MIN = 0.4,
  LAKE_R_MAX = 0.7,
  LAKE_RAW_MIN = 0.3, // kleinere Mulden taugen nicht
  LAKE_HN_LO = 0.4,
  LAKE_HN_HI = 0.7,
  LAKE_STEEP_MAX = 0.19,
  LAKE_LAP_MIN = 0.8, // konkav (Mulde, nicht Grat), px
  LAKE_SIGHT = 1, // px Mindestabstand zur Verdeckung
  LAKE_RING_STEEP = 0.4; // mittlere Steilheit auf dem Ring um den Mittelpunkt
export interface MassifLake {
  comp: MassifComponent;
  /** Mittelknoten (global) und Mittelpunkt in Kachelkoordinaten */
  I: number;
  J: number;
  cx: number;
  cy: number;
  /** Ufer-Radius in Kacheln je Richtung (LAKE_RAYS Richtungen, Winkel k · 2π / LAKE_RAYS im Kachelraum, 0,4 … 0,7) */
  radii: number[];
  /** Knoten, deren Zellen der See berührt (Umkreis grösster Radius + eine Zelle) */
  nodes: Set<number>;
}
/** Ufer-Radius (Kacheln) in Richtung `th` (rad, im Kachelraum): zyklisch geglättet zwischen den Strahlen. */
export function lakeRadius(l: Pick<MassifLake, 'radii'>, th: number): number {
  const n = l.radii.length;
  const t = ((th / (2 * Math.PI)) % 1) * n;
  const u = t < 0 ? t + n : t;
  const k = Math.floor(u),
    f = u - k;
  const s = f * f * (3 - 2 * f);
  return l.radii[k % n]! + (l.radii[(k + 1) % n]! - l.radii[k % n]!) * s;
}
function findLake(
  data: MassifData,
  c: MassifComponent,
  trees: Set<number>,
): { lake: MassifLake; score: number } | null {
  let best: { lake: MassifLake; score: number; r: number } | null = null;
  for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
    for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) {
      if (!nodeInside(c, I, J)) continue;
      const hn = nodeHeight(c, I, J) / c.amp;
      if (hn < LAKE_HN_LO || hn > LAKE_HN_HI) continue;
      const n = nodeInfo(c, I, J);
      if (n.steep >= LAKE_STEEP_MAX || n.lap <= LAKE_LAP_MIN || nodeSnow(c, I, J, n)) continue;
      const cx = I / SUB,
        cy = J / SUB;
      const raw: number[] = [];
      for (let k = 0; k < LAKE_RAYS; k++) {
        const th = (k * 2 * Math.PI) / LAKE_RAYS;
        let s = LAKE_STEP;
        while (s < LAKE_R_MAX + 0.2) {
          if (heightAtF(c, cx + Math.cos(th) * s, cy + Math.sin(th) * s) - n.h > LAKE_RISE) break;
          s += LAKE_STEP;
        }
        raw.push(s - LAKE_STEP / 2);
      }
      if (Math.min(...raw) < LAKE_RAW_MIN) continue;
      // 3-Punkt-Glättung, auf 0,42 … 0,66 gestaucht (kein Sättigen an den Klemmen: der Rand bleibt unregelmässig), dazu
      // Formrauschen ±0,04 (Salz 577), Klemme auf 0,4 … 0,7
      const radii = raw.map((_, k) => {
        const m =
          (raw[(k + LAKE_RAYS - 1) % LAKE_RAYS]! + 2 * raw[k]! + raw[(k + 1) % LAKE_RAYS]!) / 4;
        const q = 0.42 + (Math.max(0.3, Math.min(0.9, m)) - 0.3) * 0.4;
        const w = (hash2(c.seed + L6_LAKE_SALT + 1, I * 31 + k, J) - 0.5) * 0.08;
        return Math.max(LAKE_R_MIN, Math.min(LAKE_R_MAX, q + w));
      });
      const rMax = Math.max(...radii);
      const reach = rMax + 0.36;
      const R = Math.ceil(reach * SUB) + 1;
      if (!boxInside(c, I, J, R)) continue;
      const nodes = discNodes(cx, cy, reach);
      let bad = false;
      for (const k of nodes) if (trees.has(k)) bad = true;
      if (bad) continue;
      // frei im Bild: Mitte und Ring bei 60 % des Radius (keine Bergflanke davor)
      let hidden = !sightFree(data, cx, cy, n.h, LAKE_SIGHT);
      for (let k = 0; k < 8 && !hidden; k++) {
        const th = (k * 2 * Math.PI) / 8,
          px = cx + Math.cos(th) * 0.6 * rMax,
          py = cy + Math.sin(th) * 0.6 * rMax;
        hidden = !sightFree(data, px, py, heightAtF(c, px, py), LAKE_SIGHT);
      }
      if (hidden) continue;
      // Ring bei 0,35 Kacheln: mittlere Steilheit (flach = gut), Wert je Mulde
      let ring = 0;
      for (let k = 0; k < 8; k++) {
        const th = (k * 2 * Math.PI) / 8;
        const Ik = Math.round((cx + Math.cos(th) * 0.35) * SUB),
          Jk = Math.round((cy + Math.sin(th) * 0.35) * SUB);
        ring += nodeInfo(c, Ik, Jk).steep / 8;
      }
      if (ring > LAKE_RING_STEEP) continue;
      if (snowIn(c, nodes)) continue;
      const score =
        ring + n.steep - 0.02 * Math.min(1, n.lap) + 0.001 * hash2(c.seed + L6_LAKE_SALT, I, J);
      if (!best || score < best.score)
        best = { lake: { comp: c, I, J, cx, cy, radii, nodes }, score, r: rMax };
    }
  return best;
}

// --- C7 Wasserfall (statisch) ---
const FALL_HN_LO = 0.45,
  FALL_HN_HI = 0.75,
  FALL_HN_END = 0.15, // endet im Schutt
  FALL_START_STEEP = 0.5,
  FALL_START_E = -0.3,
  FALL_MAX_STEPS = 90,
  FALL_MIN_STEPS = 8,
  FALL_SIGHT = 1.5, // px
  FALL_SHOWN = 0.8, // Anteil der Pfadpunkte, der frei im Bild liegt
  FALL_RINNE_SHARE = 0.4; // Anteil der Pfadknoten in einer Rinne (e < −0,1)
export interface MassifFallPoint {
  I: number;
  J: number;
  /** Geländehöhe (px) */
  h: number;
  /** Bandbreite in Weltpixeln, 1 … 1,5 (steil breiter) */
  w: number;
  /** Steilheit 0…1 (steil heller) */
  steep: number;
}
export interface MassifFall {
  comp: MassifComponent;
  /**
   * Polylinie von oben (Start) nach unten (Schutt am Fuss), Höhe strikt fallend: reine Daten für Glitzern (L7). Der
   * steilste Abstieg über die Knoten, einmal geglättet (I und J darum auch gebrochen, Höhe ist die der Knotenlinie).
   */
  path: MassifFallPoint[];
  /** Knoten, deren Zellen das Band berühren (Pfad ± 1 Knoten) */
  nodes: Set<number>;
}
/** Eine Runde Eckenschneiden (Chaikin), Endpunkte bleiben: der Lauf wird weich, Höhe bleibt strikt fallend. */
function chaikin(pts: MassifFallPoint[]): MassifFallPoint[] {
  const mixP = (a: MassifFallPoint, b: MassifFallPoint, t: number): MassifFallPoint => ({
    I: a.I + (b.I - a.I) * t,
    J: a.J + (b.J - a.J) * t,
    h: a.h + (b.h - a.h) * t,
    w: a.w + (b.w - a.w) * t,
    steep: a.steep + (b.steep - a.steep) * t,
  });
  const out: MassifFallPoint[] = [pts[0]!];
  for (let k = 0; k + 1 < pts.length; k++) {
    out.push(mixP(pts[k]!, pts[k + 1]!, 0.25), mixP(pts[k]!, pts[k + 1]!, 0.75));
  }
  out.push(pts[pts.length - 1]!);
  return out;
}
const NEIGH8: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];
function findFall(
  data: MassifData,
  c: MassifComponent,
  trees: Set<number>,
): { fall: MassifFall; score: number } | null {
  let best: { fall: MassifFall; score: number } | null = null;
  for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
    for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) {
      if (!nodeInside(c, I, J)) continue;
      const hn0 = nodeHeight(c, I, J) / c.amp;
      if (hn0 < FALL_HN_LO || hn0 > FALL_HN_HI) continue;
      const n0 = nodeInfo(c, I, J);
      if (n0.steep < FALL_START_STEEP || n0.e >= FALL_START_E) continue;
      // steilster Abstieg über die Knoten (8er-Nachbarschaft)
      const path: MassifFallPoint[] = [];
      let i = I,
        j = J,
        ok = false;
      for (let step = 0; step < FALL_MAX_STEPS; step++) {
        const n = nodeInfo(c, i, j);
        if (!boxInside(c, i, j, 1) || nodeSnow(c, i, j, n) || trees.has(nkey(i, j))) break;
        path.push({
          I: i,
          J: j,
          h: n.h,
          w: 1 + 0.5 * n.steep,
          steep: n.steep,
        });
        if (n.hn < FALL_HN_END) {
          ok = path.length >= FALL_MIN_STEPS;
          break;
        }
        let bi = i,
          bj = j,
          bd = 0;
        for (const [di, dj] of NEIGH8) {
          const d = (n.h - nodeHeight(c, i + di, j + dj)) / Math.hypot(di, dj);
          if (d > bd) {
            bd = d;
            bi = i + di;
            bj = j + dj;
          }
        }
        if (bd <= 0) break;
        i = bi;
        j = bj;
      }
      if (!ok) continue;
      let rinne = 0,
        steepSum = 0,
        shown = 0;
      for (const q of path) {
        const nq = nodeInfo(c, q.I, q.J);
        if (nq.e < -0.1) rinne++;
        if (sightFree(data, q.I / SUB, q.J / SUB, q.h, FALL_SIGHT)) shown++;
        steepSum += q.steep;
      }
      if (rinne / path.length < FALL_RINNE_SHARE || shown / path.length < FALL_SHOWN) continue;
      const nodes = new Set<number>();
      for (const q of path) for (const k of boxNodes(q.I, q.J, 1)) nodes.add(k);
      if (snowIn(c, nodes)) continue; // auch der Hof des Bandes bleibt schneefrei
      const score =
        path.length + 10 * (steepSum / path.length) + 0.001 * hash2(c.seed + L6_FALL_SALT, I, J);
      if (!best || score > best.score) {
        // Breite mit Formrauschen (Salz 579): ± 0,1 px je Punkt, in 1 … 1,5 gehalten
        const jittered = path.map((q, k) => ({
          ...q,
          w: Math.max(
            1,
            Math.min(1.5, q.w + (hash2(c.seed + L6_FALL_SALT + 1, q.I, q.J * 7 + k) - 0.5) * 0.2),
          ),
        }));
        best = { fall: { comp: c, path: chaikin(jittered), nodes }, score };
      }
    }
  return best;
}

// --- C8 Höhle ---
const CAVE_HN_LO = 0.25,
  CAVE_HN_HI = 0.55,
  CAVE_STEEP_MIN = 0.6,
  CAVE_REL_MAX = 0, // relLight < 0: Schattenseite
  CAVE_SIGHT = 5, // px: Öffnung samt Sturz bleibt frei
  CAVE_FACE_COS = 0.8; // Gefälle nach unten ≈ Richtung +x +y (zur Kamera)
export interface MassifCave {
  comp: MassifComponent;
  /** Anker: Knoten (I − J) mod 4 = 2 (Mitte des Halbstreifens) */
  I: number;
  J: number;
  h: number;
  /** Halbachsen der Öffnung (Weltpixel, ≈ 6 × 5 gesamt) */
  rx: number;
  ry: number;
  /** Radiusfaktoren des unregelmässigen Umrisses (8 Richtungen, 0,8 … 1,2) */
  shape: number[];
  nodes: Set<number>;
}
function findCave(
  data: MassifData,
  c: MassifComponent,
  trees: Set<number>,
): { cave: MassifCave; score: number } | null {
  let best: { cave: MassifCave; score: number } | null = null;
  for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
    for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) {
      if ((((I - J) % 4) + 4) % 4 !== 2 || !boxInside(c, I, J, 3)) continue;
      const hn = nodeHeight(c, I, J) / c.amp;
      if (hn < CAVE_HN_LO || hn > CAVE_HN_HI) continue;
      const n = nodeInfo(c, I, J);
      if (n.steep < CAVE_STEEP_MIN || n.rl >= CAVE_REL_MAX || nodeSnow(c, I, J, n)) continue;
      const down = -(n.gx + n.gy) / Math.SQRT2; // abwärts Richtung (+x, +y)
      if (down / Math.hypot(n.gx, n.gy) < CAVE_FACE_COS) continue;
      if (!sightFree(data, I / SUB, J / SUB, n.h, CAVE_SIGHT)) continue;
      const nodes = boxNodes(I, J, 2);
      if (snowIn(c, nodes)) continue;
      let bad = false;
      for (const k of nodes) if (trees.has(k)) bad = true;
      if (bad) continue;
      const score = n.steep - n.rl + 0.001 * hash2(c.seed + L6_CAVE_SALT, I, J);
      if (!best || score > best.score) {
        const shape = Array.from(
          { length: 8 },
          (_, k) => 0.82 + 0.36 * hash2(c.seed + L6_CAVE_SALT + 1, I * 13 + k, J),
        );
        best = {
          cave: { comp: c, I, J, h: n.h, rx: 3.2, ry: 2.6, shape, nodes },
          score,
        };
      }
    }
  return best;
}

// --- C9 Steinmännchen ---
const CAIRN_MIN_AMP = 45; // Felshügel (amp ≈ 29) bekommen keines
export interface MassifCairn {
  comp: MassifComponent;
  I: number;
  J: number;
  h: number;
  /** Höhe über dem Anker (px) und Steine unten nach oben: Breite, Höhe, Versatz (px) */
  height: number;
  stones: { w: number; h: number; dx: number }[];
  nodes: Set<number>;
}
function findCairn(data: MassifData): MassifCairn | null {
  let best: { c: MassifComponent; I: number; J: number; h: number } | null = null;
  for (const c of data.comps) {
    if (c.amp < CAIRN_MIN_AMP) continue;
    for (let J = c.y0 * SUB; J <= (c.y1 + 1) * SUB; J++)
      for (let I = c.x0 * SUB; I <= (c.x1 + 1) * SUB; I++) {
        if ((((I - J) % 4) + 4) % 4 !== 2) continue;
        const h = nodeHeight(c, I, J);
        if (best && h <= best.h) continue;
        if (!boxInside(c, I, J, 1)) continue;
        const trees = massifTrees(c).mask;
        if ([...boxNodes(I, J, 2)].some((k) => trees.has(k))) continue; // keine Baummaske
        best = { c, I, J, h };
      }
  }
  if (!best) return null;
  const { c, I, J, h } = best;
  const cnt = hash2(c.seed + L6_CAIRN_SALT + 1, I, J) < 0.5 ? 3 : 4;
  const stones: { w: number; h: number; dx: number }[] = [];
  let total = 0;
  for (let k = 0; k < cnt; k++) {
    const w = 3 - k * (cnt === 3 ? 0.9 : 0.6),
      sh = cnt === 3 ? 1.7 : 1.25;
    stones.push({
      w,
      h: sh,
      dx: (hash2(c.seed + L6_CAIRN_SALT + 1, I * 7 + k, J) - 0.5) * 0.5,
    });
    total += sh;
  }
  return { comp: c, I, J, h, height: total, stones, nodes: boxNodes(I, J, 2) };
}

export interface MassifFeatures {
  lake: MassifLake | null;
  fall: MassifFall | null;
  cave: MassifCave | null;
  cairn: MassifCairn | null;
  /** Vereinigung der Knotenmasken aller vorhandenen Elemente (Schlüssel J · 100000 + I) */
  mask: Set<number>;
}
/** Eignung je Art (vor dem Los): bestes Gelände der ganzen Karte, ohne Los und ohne Überlappungsprüfung. */
export interface MassifSuitable {
  lake: MassifLake | null;
  fall: MassifFall | null;
  cave: MassifCave | null;
  cairn: MassifCairn | null;
}
const suitCache = new WeakMap<MassifData, MassifSuitable>();
export function massifSuitable(data: MassifData): MassifSuitable {
  const hit = suitCache.get(data);
  if (hit) return hit;
  let lake: { lake: MassifLake; score: number } | null = null,
    fall: { fall: MassifFall; score: number } | null = null,
    cave: { cave: MassifCave; score: number } | null = null;
  for (const c of data.comps) {
    if (c.n < SMALL_MASSIF) continue; // Felshügel: keine Elemente
    const trees = massifTrees(c).mask;
    const a = findLake(data, c, trees);
    if (a && (!lake || a.score < lake.score)) lake = a;
    const b = findFall(data, c, trees);
    if (b && (!fall || b.score > fall.score)) fall = b;
    const d = findCave(data, c, trees);
    if (d && (!cave || d.score > cave.score)) cave = d;
  }
  const out = {
    lake: lake?.lake ?? null,
    fall: fall?.fall ?? null,
    cave: cave?.cave ?? null,
    cairn: findCairn(data),
  };
  suitCache.set(data, out);
  return out;
}

const featCache = new WeakMap<MassifData, MassifFeatures>();
const overlaps = (a: Set<number>, b: Set<number>): boolean => {
  for (const k of a) if (b.has(k)) return true;
  return false;
};
/**
 * Die Entdeckungs-Elemente der Karte (gemerkt je Daten): Eignung (`massifSuitable`), dann Los, dann kein Überlappen
 * mit einem früheren Element (Reihenfolge See, Wasserfall, Höhle, Steinmännchen). Rein.
 */
export function massifFeatures(data: MassifData): MassifFeatures {
  const hit = featCache.get(data);
  if (hit) return hit;
  const s = massifSuitable(data);
  const lot = (salt: number, p: number): boolean => hash2(data.seed + salt, 0, 0) < p;
  const mask = new Set<number>();
  const take = <T extends { nodes: Set<number> }>(
    e: T | null,
    salt: number,
    p: number,
  ): T | null => {
    if (!e || !lot(salt, p) || overlaps(e.nodes, mask)) return null;
    for (const k of e.nodes) mask.add(k);
    return e;
  };
  const out: MassifFeatures = {
    lake: take(s.lake, L6_LAKE_SALT, L6_LOT.lake),
    fall: take(s.fall, L6_FALL_SALT, L6_LOT.fall),
    cave: take(s.cave, L6_CAVE_SALT, L6_LOT.cave),
    cairn: take(s.cairn, L6_CAIRN_SALT, L6_LOT.cairn),
    mask,
  };
  featCache.set(data, out);
  return out;
}
/** Knoten (I, J) liegt in der Maske eines Entdeckungs-Elements (für Referenz-Tests: dort darf sich der Kern ändern). */
export const massifFeatureMask = (data: MassifData, I: number, J: number): boolean =>
  massifFeatures(data).mask.has(nkey(I, J));
