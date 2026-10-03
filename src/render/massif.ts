import { MIN_MOUNTAIN_PATCH } from '../sim/defs/map';
import { valueNoise } from '../sim/noise';
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
export const AMP_CAP = 150;
const PROFILE = 1.2; // Exponent des Grundprofils: hohle Flanken, steilere Kuppen
const RIM = 1; // Kacheln: Randband, in dem das Grundprofil auf 0 geht (h = 0 an der Grenze)
const BLUR = 2; // Knoten-Radius des Weichzeichners (2 Durchgänge): Kontur gerundet, keine Treppen
const RIDGE = 0.5; // Anteil der Grate an der Höhe (± um 1)
/**
 * Höhenstaffelung: Faktor exp(β · g), g = −1 vorn … +1 hinten (Tiefe x + y). β startet bei STAGGER und wächst je
 * Komponente höchstens bis STAGGER_MAX, bis die hintere Hälfte im Mittel BACK_RATIO-mal so hoch ist wie die vordere.
 */
const STAGGER = 0.3;
const STAGGER_MAX = 0.5;
const BACK_RATIO = 1.25;
const BUMP = 0.8; // px Geröll-Buckel am Fuss
/** Obergrenze jeder Massivhöhe (px): Amplitude mal Grate mal Staffelung plus Geröll. */
export const MASSIF_MAX_H = AMP_CAP * (1 + RIDGE) * Math.exp(STAGGER_MAX) + BUMP;
/** Kacheln: Höhe läuft im Umkreis eines Gebäudes oder Wegs auf dem Gebirge auf 0 (eingeschnittener Sattel). */
export const OCC_FADE = 1;
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
  /** Farbe des nächsten Nachbargeländes je Kachel des Rechtecks (für den Sockel), `null` = keine Mischung. */
  edge: (Rgb | null)[];
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
  const edge = nearestLand(w);
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
    comps.push(buildComponent(w, id, Int32Array.from(tiles), compOf, edge));
  }
  return { sig, seed: w.seed, width: W, height: H, compOf, comps };
}

/** Geländefarbe des nächsten Nicht-Gebirges je Kachel (4er-Breitensuche, deterministisch), Sockel-Mischung (A3). */
function nearestLand(w: MassifWorld): (Rgb | null)[] {
  const W = w.width,
    n = W * w.height;
  const out: (Rgb | null)[] = new Array<Rgb | null>(n).fill(null);
  const done = new Uint8Array(n);
  const q = new Int32Array(n);
  let head = 0,
    tail = 0;
  for (let i = 0; i < n; i++)
    if (!isMountain(w, i)) {
      out[i] = LAND_EDGE[w.tiles[i]!.terrain] ?? null;
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

/** Wertrauschen an gedrehten Koordinaten (keine achsparallelen Merkmale, wie `rotNoise` in terrain.ts). */
function rotNoise(seed: number, fx: number, fy: number, freq: number, rot: number): number {
  const c = Math.cos(rot) * freq,
    s = Math.sin(rot) * freq;
  return valueNoise(seed, c * fx - s * fy, s * fx + c * fy);
}
/** Ridged-Noise 1 − |2n − 1|, zwei Oktaven plus feine Zacken, quadriert (scharfe Grate), 0…1. */
export function ridged(seed: number, fx: number, fy: number): number {
  const r1 = 1 - Math.abs(2 * rotNoise(seed + 301, fx, fy, 0.24, ROT_A) - 1);
  const r2 = 1 - Math.abs(2 * rotNoise(seed + 303, fx, fy, 0.55, ROT_B) - 1);
  const r3 = 1 - Math.abs(2 * rotNoise(seed + 309, fx, fy, 1.15, ROT_C) - 1);
  const r = 0.62 * r1 + 0.26 * r2 + 0.12 * r3;
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
  nearest: (Rgb | null)[],
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
      // Grundform leicht verbeult (tieffrequent, gedreht): kein Kegel aus dem Abstandsfeld
      const wob = 0.78 + 0.44 * rotNoise(seed + 305, fx, fy, 0.16, ROT_C);
      const dn = Math.min(1, (base[k]! / maxBase) * wob);
      const mid = smoothstep(0.08, 0.55, dn) * ridgeW;
      shape[k] = Math.pow(dn, PROFILE) * (1 + RIDGE * mid * (2 * ridged(seed, fx, fy) - 1));
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
      const dn = base[k]! / maxBase;
      const rim = smooth01(dist[k]! / RIM);
      const bump = (valueNoise(seed + 307, fx * 1.7, fy * 1.7) - 0.5) * 2 * BUMP * rim * (1 - dn);
      height[k] = Math.max(0, amp * shape[k]! * Math.exp(beta * gs[k]!) + bump);
    }
  const edge: (Rgb | null)[] = [];
  const mask = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      edge.push(nearest[y * W + x]!);
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
    edge,
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
  /** Bebaute Kacheln der Komponente im Umkreis von 2 Kacheln (Sattel um Gebäude und Wege), aufsteigend. */
  occ: number[];
  /** Cache-Schlüssel (Geländeabbild, Lage, Sattel). */
  key: string;
}

const occupied = (w: PieceWorld, i: number): boolean =>
  w.tiles[i]!.buildingId !== null || w.tiles[i]!.road;

/**
 * Zerlegt alle Massive in Teilstücke (A5): je Halbstreifen k die maximalen Läufe freier Gebirgskacheln (ohne
 * Gebäude und Weg) in Tiefenfolge, geteilt in Abschnitte von höchstens `PIECE_RUN` Kacheln. Deterministisch, hinten
 * nach vorn je Streifen.
 */
export function massifPieces(w: PieceWorld, data: MassifData = massifData(w)): MassifPiece[] {
  const W = w.width,
    H = w.height;
  const out: MassifPiece[] = [];
  const free = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = y * W + x;
    return data.compOf[i]! >= 0 && !occupied(w, i);
  };
  const flush = (k: number, run: number[]): void => {
    for (let a = 0; a < run.length; a += PIECE_RUN) {
      const tiles = run.slice(a, a + PIECE_RUN);
      const front = tiles.at(-1)!;
      const comp = data.comps[data.compOf[front]!]!;
      const fx = front % W,
        fy = (front / W) | 0;
      const seam = a > 0 ? run[a - 1]! : -1;
      const occ = new Set<number>();
      for (const t of seam >= 0 ? [seam, ...tiles] : tiles) {
        const tx = t % W,
          ty = (t / W) | 0;
        for (let y = ty - 2; y <= ty + 2; y++)
          for (let x = tx - 2; x <= tx + 2; x++)
            if (inComp(comp, x, y) && occupied(w, y * W + x)) occ.add(y * W + x);
      }
      const occList = [...occ].sort((p, q) => p - q);
      const id = 2 * front + (fx - fy === k ? 0 : 1);
      out.push({
        id,
        comp,
        strip: k,
        tiles,
        seam,
        occ: occList,
        key: `${data.sig}|${id}|${tiles.length}|${occList.join(',')}`,
      });
    }
  };
  for (let k = -H; k < W; k++) {
    let run: number[] = [];
    for (let s = 0; s <= W + H - 2; s++) {
      const c = (((s - k) % 2) + 2) % 2 === 0 ? k : k + 1; // Spalte x − y hat die Parität von s
      const x = (s + c) / 2,
        y = (s - c) / 2;
      if (free(x, y)) run.push(y * W + x);
      else if (run.length) {
        flush(k, run);
        run = [];
      }
    }
    if (run.length) flush(k, run);
  }
  return out;
}

/** Sattelfaktor 0…1 am Kachelpunkt (fx, fy): 0 an bebauten Kacheln, 1 ab `OCC_FADE` Abstand. */
function fade(p: MassifPiece, fx: number, fy: number): number {
  let f = 1;
  const W = p.comp.width;
  for (const o of p.occ) {
    const ox = o % W,
      oy = (o / W) | 0;
    const dx = Math.max(ox - fx, 0, fx - ox - 1),
      dy = Math.max(oy - fy, 0, fy - oy - 1);
    f *= smooth01(Math.hypot(dx, dy) / OCC_FADE);
  }
  return f;
}
/** Höhe am Knoten (I, J) im Teilstück: Grundhöhe mal Sattel um Gebäude und Wege. */
export function pieceHeight(p: MassifPiece, I: number, J: number): number {
  const h = nodeHeight(p.comp, I, J);
  return h > 0 && p.occ.length ? h * fade(p, I / SUB, J / SUB) : h;
}

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

const LIGHT = { x: -3 / Math.sqrt(10), y: -1 / Math.sqrt(10) }; // Richtung zum Licht im Kachelraum (D-11)
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
};
const C = {
  ...P,
  /** Felsgrund des Massivs: etwas heller als `rock`, die Schattenseite dunkelt ohnehin ab */
  base: mixRgb(P.rock, P.light, 0.12),
  /** helle Grate und Kappen: rockLight mit 25 % foam (kein Schnee, höchstens 30 %) */
  cap: mixRgb(P.light, rgbOf(PALETTE.foam), 0.25),
  /** kühle Schattenseite */
  shadow: mixRgb(P.dark, rgbOf(PALETTE.waterDeep), 0.28),
  /** grünlich-brauner Bewuchs am Fuss */
  veg: mixRgb(rgbOf(PALETTE.grassDark), rgbOf(PALETTE.earthEdge), 0.35),
};
const LAND_EDGE: Partial<Record<string, Rgb>> = {
  grass: mixRgb(rgbOf(PALETTE.grass), rgbOf(PALETTE.grassDark), 0.25),
  forest: rgbOfCss(FOREST_FLOOR),
  sand: rgbOf(PALETTE.sandDry),
};

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

/**
 * Farbe an einem Netzpunkt (A3): Material nach Hang und Höhe, Lambert-Licht von links oben, Sockel ohne Naht. Die
 * Schichtung (Bänder nach Höhe) und das Korn kommen je Pixel beim Rastern dazu (`rocks.ts`).
 */
export function shadeColor(seed: number, fx: number, fy: number, s: CellShade): Rgb {
  const steep = steepness(s.gx, s.gy);
  // Felsgrund mit grossflächiger Tönung (gedreht, kein Kachelraster)
  const tone =
    0.65 * (rotNoise(seed + 311, fx, fy, 0.85, ROT_C) - 0.5) +
    0.35 * (rotNoise(seed + 315, fx, fy, 2.3, ROT_A) - 0.5); // grossflächig plus Fleckung
  let c: Rgb =
    tone >= 0 ? mixRgb(C.base, C.light, tone * 0.6) : mixRgb(C.base, C.dark, -tone * 0.6);
  // flach und hoch: helle Grate und Kappen
  c = mixRgb(c, C.cap, (1 - steep) * smoothstep(0.55, 1.0, s.hn) * 0.5);
  // flach und tief: Bewuchs und Geröll am Fuss
  const mask = smoothstep(0.42, 0.72, rotNoise(seed + 317, fx, fy, 1.3, ROT_A));
  const foot = smoothstep(0, 0.04, s.hn) * (1 - smoothstep(0.12, 0.38, s.hn));
  c = mixRgb(c, C.veg, (1 - steep) * foot * (0.12 + 0.38 * mask));
  const rubble = smoothstep(0.6, 0.85, rotNoise(seed + 319, fx, fy, 2.6, ROT_B));
  c = mixRgb(c, C.light, 0.18 * rubble * (1 - smoothstep(0, 0.3, s.hn))); // Geröll am Fuss
  // Umgebungsverdeckung in Rinnen, helle Kanten auf Graten
  if (s.lap > 0) c = mixRgb(c, C.shadow, Math.min(0.4, s.lap * 0.05));
  else c = mixRgb(c, C.cap, Math.min(0.3, -s.lap * 0.04));
  // Lambert: Normale (−gx, −gy, 1) gegen das Licht, relativ zur ebenen Fläche
  const nx = -s.gx / TILE_PX,
    ny = -s.gy / TILE_PX;
  const rel = (nx * L3.x + ny * L3.y + L3.z) / Math.hypot(nx, ny, 1) / L3.z;
  c =
    rel >= 1
      ? mixRgb(c, C.cap, Math.min(0.55, (rel - 1) * 1.5))
      : mixRgb(c, C.shadow, Math.min(0.7, (1 - rel) * 1.25));
  // Sockel: zur Grenze hin ins Nachbargelände (wie die Typmischung der Geländeebene), an Ecken stärker
  if (s.edge && s.rim < 1) c = mixRgb(c, s.edge, EDGE_MIX * (1 - s.rim));
  return c;
}
/** Wie `shadeColor`, als CSS-Farbe. */
export function cellColor(seed: number, fx: number, fy: number, s: CellShade): string {
  const c = shadeColor(seed, fx, fy, s);
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}

/** Netzpunkt eines Teilstücks: Farbe ohne Schichtung, Höhe, Steilheit und Versatz der Schichtbänder. */
export interface NodeShade {
  c: Rgb;
  /** Deckkraft 0…1 (nur im Sockelband < 1). */
  a: number;
  h: number;
  steep: number;
  /** Phasenversatz der Schichtbänder (verworfen, gedreht). */
  warp: number;
}
/**
 * Netzpunkte eines Teilstücks, gemerkt: Farbe und Attribute hängen nur von (Komponente, Sattel, Knoten) ab, die
 * geteilten Randzellen zweier Halbstreifen bekommen also exakt dieselben Werte (keine Naht an der Streifenkante).
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
  const bw = c.x1 - c.x0 + 1;
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
    const col = shadeColor(c.seed, fx, fy, {
      h,
      hn: h / c.amp,
      gx,
      gy,
      lap,
      rim: smoothstep(SOFT_LO, SOFT_HI, soft),
      edge: c.edge[(ty - c.y0) * bw + tx - c.x0] ?? null,
    });
    const out: NodeShade = {
      c: col,
      a: Math.max(smoothstep(SOFT_A_LO, SOFT_A_HI, soft), smoothstep(RIM_H * 0.25, RIM_H, h)),
      h,
      steep: steepness(gx, gy),
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
