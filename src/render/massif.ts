import { MIN_MOUNTAIN_PATCH } from '../sim/defs/map';
import { valueNoise } from '../sim/noise';
import { LIGHT, rotNoise } from './light';
import type { World } from '../sim/types';
import { FOREST_FLOOR, PALETTE, rgbOf, rgbOfCss } from './palette';

// massif.ts — Gebirgsmassiv als Höhenfeld je Zusammenhangskomponente (H-R9 Teil A, Kurz-Spec A1–A5). Reine
// Mathematik im Kachelraum: Komponenten, Höhenfeld auf einem Untergitter (SUB Knoten je Kachel), Zerlegung in
// Teilstücke (Halbkachel-Streifen) und Zellfarben. Keine Projektion, kein Canvas (das macht `rocks.ts`); liest die
// Welt nur. Höhen in Weltpixeln (Zoom 1), Darstellungswerte, keine Spielwerte.

export type MassifWorld = Pick<World, 'width' | 'height' | 'tiles' | 'seed'>;
type Rgb = readonly [number, number, number];

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

const isMountain = (w: MassifWorld, i: number): boolean => w.tiles[i]!.terrain === 'mountain';

/** Signatur des Geländeabbilds (nur Gebirge zählt): zwei FNV-Bahnen über die Gebirgskacheln. */
function signature(w: MassifWorld): string {
  let a = 0x811c9dc5,
    b = 0x9e3779b9 ^ w.seed;
  for (let i = 0; i < w.tiles.length; i++)
    if (isMountain(w, i)) {
      a = Math.imul(a ^ (i + 1), 0x01000193) >>> 0;
      b = Math.imul(b ^ (i + 7), 0x85ebca6b) >>> 0;
      b ^= b >>> 13;
    }
  return `${w.seed}|${w.width}x${w.height}|${a.toString(36)}${b.toString(36)}`;
}

const cache = new WeakMap<object, MassifData>();

/** Komponenten und Höhenfelder, gemerkt je Welt und Geländeabbild; Bauen und Wege ändern nichts (A1). */
export function massifData(w: MassifWorld): MassifData {
  const sig = signature(w);
  const hit = cache.get(w);
  if (hit && hit.sig === sig) return hit;
  const data = buildData(w, sig);
  cache.set(w, data);
  return data;
}

function buildData(w: MassifWorld, sig: string): MassifData {
  const W = w.width,
    H = w.height,
    n = W * H;
  const compOf = new Int32Array(n).fill(-1);
  const comps: MassifComponent[] = [];
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!isMountain(w, i) || compOf[i]! >= 0) continue;
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
        if (compOf[k]! < 0 && isMountain(w, k)) {
          compOf[k] = id;
          stack.push(k);
        }
      }
    }
    tiles.sort((p, q) => p - q);
    comps.push(buildComponent(w, id, Int32Array.from(tiles), compOf));
  }
  return { sig, seed: w.seed, width: W, height: H, compOf, comps };
}

/** Landart des nächsten Nicht-Gebirges (für den Sockel): 0 keine Mischung (Wasser, Rand), sonst Index in EDGE_COLORS. */
const EDGE_CODE: Partial<Record<string, number>> = { grass: 1, forest: 2, sand: 3 };
/**
 * Landart des nächsten Nicht-Gebirges je Kachel (4er-Breitensuche, deterministisch). Hängt von Wald/Gras ab (Roden,
 * Aufforsten) und wird deshalb je Zerlegung neu gerechnet, nicht mit dem Höhenfeld gemerkt.
 */
export function nearestLand(w: PieceWorld): Uint8Array {
  const W = w.width,
    n = W * w.height;
  const out = new Uint8Array(n);
  const done = new Uint8Array(n);
  const q = new Int32Array(n);
  let head = 0,
    tail = 0;
  for (let i = 0; i < n; i++)
    if (!isMountain(w, i)) {
      out[i] = EDGE_CODE[w.tiles[i]!.terrain] ?? 0;
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
      if (nx < 0 || ny < 0 || nx >= W || ny >= w.height) continue;
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
const smoothstep = (a: number, b: number, t: number): number => smooth01((t - a) / (b - a));

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
  w: MassifWorld,
  id: number,
  tiles: Int32Array,
  compOf: Int32Array,
): MassifComponent {
  const W = w.width;
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
    x >= 0 && y >= 0 && x < W && y < w.height && compOf[y * W + x] === id;
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
  const amp = Math.min(
    AMP_CAP,
    AMP_K * Math.pow(Math.sqrt(n), AMP_POW),
    AMP_SLOPE * Math.max(maxD, 0.25),
  );
  // Grate laufen bei kleinen Komponenten stetig aus: Felshügel ohne Sonderfall
  const ridgeW = smoothstep(SMALL_MASSIF * 0.75, SMALL_MASSIF * 3, n);
  const sMid = (sMin + sMax) / 2,
    sHalf = Math.max(1, (sMax - sMin) / 2);
  const seed = w.seed;
  const shape = new Float32Array(nx * ny),
    gs = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (src[k] || maxBase <= 0) continue;
      const fx = x0 + i / SUB,
        fy = y0 + j / SUB;
      // Körper: steigt im Randband schnell auf BODY_FLOOR, dann über dem (verbeulten) Randabstand weiter
      const wob = 0.78 + 0.44 * rotNoise(seed + 305, fx, fy, 0.16, ROT_C);
      const dn = Math.min(1, (base[k]! / maxBase) * wob);
      const body =
        smooth01(dist[k]! / RIM) * (BODY_FLOOR + (1 - BODY_FLOOR) * Math.pow(dn, PROFILE));
      // Grate und Vorberge überall im Massiv (nicht nur am Zentralgipfel); kleine Komponenten bleiben rund
      const r = ridged(seed, fx, fy);
      shape[k] = body * (1 + ridgeW * (RIDGE_LO + RIDGE_SPAN * r - 1));
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
  beta = Math.min(beta, STAGGER_MAX);
  const height = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (src[k] || maxBase <= 0) continue;
      const fx = x0 + i / SUB,
        fy = y0 + j / SUB;
      const dn = Math.min(1, base[k]! / maxBase);
      const rim = smooth01(dist[k]! / RIM);
      const bump = (valueNoise(seed + 307, fx * 1.7, fy * 1.7) - 0.5) * 2 * BUMP * rim * (1 - dn);
      height[k] = Math.max(0, amp * shape[k]! * Math.exp(beta * gs[k]!) + bump);
    }
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
    mask,
    seed,
    width: W,
  };
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
/** Grundhöhe am Knoten (I, J) in Weltpixeln; 0 ausserhalb. */
export function nodeHeight(c: MassifComponent, I: number, J: number): number {
  const i = I - c.x0 * SUB,
    j = J - c.y0 * SUB;
  if (i < 0 || j < 0 || i >= c.nx || j >= c.ny) return 0;
  return c.height[j * c.nx + i]!;
}

// ---------- Teilstücke (A5) ----------

export type PieceWorld = MassifWorld & Pick<World, 'tiles'>;
export interface MassifPiece {
  /** Eindeutig je Welt: 2 × Index der vordersten Kachel + Hälfte (0 rechte, 1 linke Kachelhälfte im Streifen). */
  id: number;
  comp: MassifComponent;
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
export function massifPieces(w: PieceWorld, data: MassifData = massifData(w)): MassifPiece[] {
  const W = w.width,
    H = w.height;
  const out: MassifPiece[] = [];
  const isM = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < W && y < H && data.compOf[y * W + x]! >= 0;
  const near = nearestLand(w);
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
const SOFT_LO = 0.2,
  SOFT_HI = 0.85,
  EDGE_MIX = 0.5;
/**
 * Sockel ohne Naht (A3): Deckkraft läuft im äussersten Band (weicher Innen-Anteil unter SOFT_A_HI, Höhe ≈ 0) auf 0;
 * dort zeigt die Geländeebene ihren eigenen Felsgrund mit der gerundeten Typgrenze. Innen deckt das Netz voll.
 */
export const SOFT_A_LO = 0.5,
  SOFT_A_HI = 0.85;
/** Ab dieser Höhe (px) deckt das Netz immer voll: durchsichtig ist nur der flache Sockel. */
export const RIM_H = 6;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};
const P = {
  rock: rgbOf(PALETTE.rock),
  light: rgbOf(PALETTE.rockLight),
  dark: rgbOf(PALETTE.rockDark),
  cool: rgbOf(PALETTE.waterDeep),
  warm: rgbOf(PALETTE.sandDry),
};
/**
 * Tonstufen des Felses (A3, Abnahme lead-art Runde 1: „gemalte Low-Poly-Felsen“ statt stufenloser Beleuchtung),
 * dunkel nach hell: Schattenseite kühl (rockDark mit waterDeep), Lichtseite warm (rockLight mit sandDry ≤ 20 %).
 */
export const ROCK_TONES: readonly Rgb[] = [
  mixRgb(P.dark, P.cool, 0.22),
  mixRgb(mixRgb(P.dark, P.rock, 0.35), P.cool, 0.12),
  mixRgb(P.rock, P.dark, 0.12),
  mixRgb(mixRgb(P.rock, P.light, 0.55), P.warm, 0.08),
  mixRgb(P.light, P.warm, 0.18),
];
/** Bewuchs in denselben Stufen (grassDark/crown, gering eingesetzt). */
export const VEG_TONES: readonly Rgb[] = [
  mixRgb(rgbOf(PALETTE.crown), P.dark, 0.45),
  mixRgb(rgbOf(PALETTE.crown), P.dark, 0.2),
  mixRgb(rgbOf(PALETTE.grassDark), rgbOf(PALETTE.crown), 0.45),
  rgbOf(PALETTE.grassDark),
  mixRgb(rgbOf(PALETTE.grassDark), P.warm, 0.2),
];
/** Mittlere Stufe der ebenen Fläche (Fuss, Plateau). */
export const TONE_FLAT = 2;
const TONE_GAIN = 2.4; // Stufen je Einheit relativer Beleuchtung auf der Lichtseite
const TONE_GAIN_SHADE = 1.6; // auf der Schattenseite (die dem Blick zugewandten Flanken sollen nicht absaufen)
const TONE_NOISE = 0.22; // grossflächige Tönung ± (Stufen): die Stufengrenzen wandern, kein Kachelraster
const LAP_REF = 16; // px Krümmung für volle Grat- bzw. Rinnenkante
/** Sockelfarbe je Landart (Index = Code aus `nearestLand`; 0 = keine Mischung). */
export const EDGE_COLORS: readonly (Rgb | null)[] = [
  null,
  mixRgb(rgbOf(PALETTE.grass), rgbOf(PALETTE.grassDark), 0.25),
  rgbOfCss(FOREST_FLOOR),
  rgbOf(PALETTE.sandDry),
];

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
}

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
  const tone =
    0.7 * (rotNoise(seed + 311, fx, fy, 0.55, ROT_C) - 0.5) +
    0.3 * (rotNoise(seed + 315, fx, fy, 1.6, ROT_A) - 0.5);
  const t =
    TONE_FLAT +
    (rl >= 1 ? TONE_GAIN : TONE_GAIN_SHADE) * (rl - 1) +
    2 * TONE_NOISE * tone +
    0.35 * (Math.min(1, s.hn) - 0.4);
  return Math.max(0, Math.min(ROCK_TONES.length - 1, t));
}

/**
 * Stufung: T wird auf ganze Stufen gerundet, mit einem weichen Übergang der halben Breite `hw` (in Stufen) um jede
 * Stufengrenze k + 0,5. Der Rasterizer setzt `hw` aus dem Gefälle von T so, dass der Übergang 1–2 px breit ist.
 */
export function toneStep(t: number, hw: number): number {
  const n = Math.floor(t),
    f = t - n;
  return n + (hw <= 0 ? (f >= 0.5 ? 1 : 0) : smoothstep(0.5 - hw, 0.5 + hw, f));
}
/** Farbe zur gestuften Tonstufe `st` (0…4), Rampe `ramp`. */
export function toneColor(st: number, ramp: readonly Rgb[] = ROCK_TONES): Rgb {
  const n = Math.max(0, Math.min(ramp.length - 1, Math.floor(st)));
  return n >= ramp.length - 1 ? ramp[n]! : mixRgb(ramp[n]!, ramp[n + 1]!, st - n);
}

/** Bewuchs-Feld 0…1 am Netzpunkt (Schwelle 0,5 beim Rastern): Flecken nur in tiefen, flachen Lagen. */
function vegField(seed: number, fx: number, fy: number, hn: number, steep: number): number {
  const low = smoothstep(0.01, 0.05, hn) * (1 - smoothstep(0.16, 0.34, hn)) * (1 - steep);
  return rotNoise(seed + 317, fx, fy, 1.9, ROT_A) * (0.25 + 0.7 * low);
}
/** Geröll-Feld 0…1 am Netzpunkt: tiefe, flache Lagen und Fuss der Flanken. */
function rubbleField(seed: number, fx: number, fy: number, hn: number, steep: number): number {
  const low = 1 - smoothstep(0.08, 0.4, hn);
  return (
    low * (0.4 + 0.6 * steep) * smoothstep(0.35, 0.65, rotNoise(seed + 319, fx, fy, 1.7, ROT_B))
  );
}

/**
 * Farbe an einem Netzpunkt (A3), ohne weiche Übergänge: gestufte Tonstufe, Grat-/Rinnenkante, Bewuchs, Sockel. Für
 * Tests und als Füllfarbe der Netzdreiecke; gerastert wird je Pixel mit denselben Regeln (`rocks.ts`).
 */
export function shadeColor(seed: number, fx: number, fy: number, s: CellShade): Rgb {
  const steep = steepness(s.gx, s.gy);
  const st = toneStep(toneLevel(seed, fx, fy, s), 0);
  const veg = vegField(seed, fx, fy, s.hn, steep) >= 0.5 ? 1 : 0;
  let c = mixRgb(toneColor(st), toneColor(st, VEG_TONES), VEG_MIX * veg);
  const e = Math.max(-1, Math.min(1, -s.lap / LAP_REF));
  if (e > EDGE_ON && st >= TONE_FLAT) c = mixRgb(c, ROCK_TONES[4]!, RIDGE_HI);
  if (e < -EDGE_ON) c = mixRgb(c, ROCK_TONES[0]!, RINNE_LO);
  if (s.edge && s.rim < 1) c = mixRgb(c, s.edge, EDGE_MIX * (1 - s.rim));
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
  rub: number;
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
    const sh: CellShade = { h, hn, gx, gy, lap, rim: smoothstep(SOFT_LO, SOFT_HI, soft), edge };
    const steep = steepness(gx, gy);
    const out: NodeShade = {
      c: shadeColor(c.seed, fx, fy, sh),
      // Sockel ohne Naht (Entscheid lead-art Runde 1): nur das flache Randband (h < RIM_H) blendet in die
      // Geländeebene aus; dort zeigt sie ihren eigenen Felsgrund mit gerundeter Typgrenze statt der Kachelkontur
      a: Math.max(smoothstep(SOFT_A_LO, SOFT_A_HI, soft), smoothstep(RIM_H * 0.25, RIM_H, h)),
      h,
      steep,
      t: toneLevel(c.seed, fx, fy, sh),
      e: Math.max(-1, Math.min(1, -lap / LAP_REF)),
      veg: vegField(c.seed, fx, fy, hn, steep),
      rub: rubbleField(c.seed, fx, fy, hn, steep),
      mix: edge ? EDGE_MIX * (1 - sh.rim) : 0,
      ec: edge ?? ROCK_TONES[TONE_FLAT]!,
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
