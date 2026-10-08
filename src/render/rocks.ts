import { worldToScreen, type Camera } from './camera';
import { ISO_H, ISO_W, ZOOM_STEPS, zoomStep, type Box, type Pt, type SortedItem } from './iso';
import { DEBRIS_MIX } from './light';
import { MASSIF_BUILDS_PER_FRAME, MASSIF_CACHE_MAX_BYTES, MASSIF_MAX_SCALE } from './limits';
import { hash2, valueNoise } from '../sim/noise';
import { FLOWER_TONES } from './groundDecor';
import { PALETTE, rgbOf, rgbOfCss } from './palette';
import { mixRgb, LIGHT_COLORS, type Rgb } from './light';
import {
  DEBRIS,
  EDGE_ON,
  SOFT_CUT,
  debrisOf,
  RIDGE_HI,
  RINNE_LO,
  ROCK_TONES,
  SUB,
  TONE_FLAT,
  SNOW_TONES,
  FOOT_GRASS,
  L2_FLOWER_SALT,
  L2_FLOWER_TONE_SALT,
  VEG_GRASS_TONES,
  VEG_MIX,
  VEG_TONES,
  lakeRadius,
  massifFeatures,
  massifTrees,
  pieceCells,
  pieceHeight,
  pieceMesh,
  toneStep,
  type MassifCairn,
  type MassifCave,
  type MassifFall,
  type MassifLake,
  type MassifPiece,
  type MassifTree,
  type MeshCell,
} from './massif';

// rocks.ts — Canvas-Hülle des Gebirgsmassivs (H-R9 Teil A, A4–A7): projiziert das Netz eines Teilstücks
// (`massif.ts`), malt es einmal je Zoomstufe und Geräte-DPR in eine Offscreen-Fläche (LRU mit Bytegrenze) und
// stempelt sie im sortierten Objektdurchgang auf ihren Halbstreifen. Liest die Welt nur.

export type MassifItem = Extract<SortedItem, { kind: 'massif' }>;

const STRIP = ISO_W / 2; // Bildbreite eines Halbstreifens (Weltpixel)
const NX = ISO_W / 2 / SUB,
  NY = ISO_H / 2 / SUB; // Bildversatz je Knotenschritt
/** Rand der Fläche über und unter der Silhouette (Weltpixel): Platz für die vergrösserten Zellen. */
const PAD = 2;
/** Bildpunkt (Weltpixel) des Knotens (I, J) in Höhe h. */
const nodePt = (I: number, J: number, h: number): Pt => ({ x: (I - J) * NX, y: (I + J) * NY - h });

/** Dreiecke einer Zelle (Eckindizes 0 hinten, 1 rechts, 2 vorn, 3 links), entlang der höheren Diagonale geteilt. */
type Corner = 0 | 1 | 2 | 3;
const cellTris = (n: MeshCell['n']): readonly (readonly [Corner, Corner, Corner])[] =>
  n[1].h + n[3].h >= n[0].h + n[2].h
    ? [
        [3, 0, 1],
        [3, 1, 2],
      ]
    : [
        [0, 1, 2],
        [0, 2, 3],
      ];

/**
 * Zellen eines Teilstücks als Bilddreiecke (Weltpixel), hinten nach vorn. Jede Zelle wird entlang der höheren
 * Diagonale geteilt: ein Grat bleibt gerade Kante, ein Kamm quer zum Raster sägt nicht. `fill` = Mittel der Ecken.
 */
export function pieceQuads(p: MassifPiece): { pts: Pt[]; fill: string; alpha: number }[] {
  const out: { pts: Pt[]; fill: string; alpha: number }[] = [];
  for (const c of pieceMesh(p)) {
    const v = [
      nodePt(c.I, c.J, c.n[0].h),
      nodePt(c.I + 1, c.J, c.n[1].h),
      nodePt(c.I + 1, c.J + 1, c.n[2].h),
      nodePt(c.I, c.J + 1, c.n[3].h),
    ];
    for (const t of cellTris(c.n)) {
      const m = [0, 1, 2].map((k) => (c.n[t[0]].c[k]! + c.n[t[1]].c[k]! + c.n[t[2]].c[k]!) / 3);
      out.push({
        pts: t.map((k) => v[k]!),
        fill: `rgb(${Math.round(m[0]!)},${Math.round(m[1]!)},${Math.round(m[2]!)})`,
        alpha: Math.min(c.n[t[0]].a, c.n[t[1]].a, c.n[t[2]].a),
      });
    }
  }
  return out;
}

const silhouettes = new WeakMap<MassifPiece, Pt[]>();
/**
 * Silhouette eines Teilstücks (Weltpixel): obere und untere Hülle der Knoten auf den fünf Knotenspalten des
 * Halbstreifens. Zwischen zwei Spalten liegt die Netzhülle unter der Sehne, das Polygon umschliesst also das Netz.
 * Für Verdeckung von Licht und Feuer (A7) und als Bildbox; gemerkt je Teilstück.
 */
export function massifSilhouette(item: MassifItem | { piece: MassifPiece }): Pt[] {
  const p = item.piece;
  const hit = silhouettes.get(p);
  if (hit) return hit;
  const W = p.comp.width;
  const top = new Array<number>(SUB + 1).fill(Infinity),
    bot = new Array<number>(SUB + 1).fill(-Infinity);
  for (const t of p.seam >= 0 ? [p.seam, ...p.tiles] : p.tiles) {
    const x = t % W,
      y = (t / W) | 0;
    for (let J = y * SUB; J <= (y + 1) * SUB; J++)
      for (let I = x * SUB; I <= (x + 1) * SUB; I++) {
        const m = I - J - SUB * p.strip;
        if (m < 0 || m > SUB) continue;
        const Y = (I + J) * NY - pieceHeight(p, I, J);
        if (Y < top[m]!) top[m] = Y;
        if (Y > bot[m]!) bot[m] = Y;
      }
  }
  const x0 = p.strip * STRIP;
  const out: Pt[] = [];
  for (let m = 0; m <= SUB; m++) out.push({ x: x0 + m * NX, y: top[m]! });
  for (let m = SUB; m >= 0; m--) out.push({ x: x0 + m * NX, y: bot[m]! });
  silhouettes.set(p, out);
  return out;
}

const treesOf = new WeakMap<MassifPiece, MassifTree[]>();
/**
 * Krüppelbäume, die ein Teilstück malt (L2 C3): Anker-Zelle (I, J) unter den Zellen des Teilstücks, auch Nahtzellen
 * (das vordere Teilstück übermalt sonst den Baum des hinteren). Nach Tiefe I + J geordnet.
 */
export function pieceTrees(p: MassifPiece): MassifTree[] {
  let out = treesOf.get(p);
  if (!out) {
    const all = massifTrees(p.comp).trees;
    if (all.length === 0) out = [];
    else {
      const cells = new Set(pieceCells(p).map((c) => c.J * 100000 + c.I));
      out = all
        .filter((t) => cells.has(t.J * 100000 + t.I))
        .sort((a, b) => a.I + a.J - (b.I + b.J) || a.I - b.I);
    }
    treesOf.set(p, out);
  }
  return out;
}

const cairnOf = new WeakMap<MassifPiece, MassifCairn | null>();
/** Steinmännchen (L6 C9), das ein Teilstück malt: Ankerzelle unter den Zellen des Teilstücks (auch Nahtzellen), sonst null. */
export function pieceCairn(p: MassifPiece): MassifCairn | null {
  let out = cairnOf.get(p);
  if (out === undefined) {
    const c = massifFeatures(p.data).cairn;
    out =
      c && c.comp === p.comp && pieceCells(p).some((q) => q.I === c.I && q.J === c.J) ? c : null;
    cairnOf.set(p, out);
  }
  return out;
}

const boxes = new WeakMap<MassifPiece, Box>();
/** Bildbox eines Teilstücks (Weltpixel): Halbstreifen × Silhouette samt Rand. */
export function massifBounds(item: MassifItem | { piece: MassifPiece }): Box {
  const p = item.piece;
  let b = boxes.get(p);
  if (!b) {
    const s = massifSilhouette(item);
    let y0 = Infinity,
      y1 = -Infinity;
    for (const q of s) {
      y0 = Math.min(y0, q.y);
      y1 = Math.max(y1, q.y);
    }
    for (const t of pieceTrees(p)) y0 = Math.min(y0, (t.I + t.J) * NY - t.h - t.height); // Bäume ragen über die Silhouette
    const cairn = pieceCairn(p);
    if (cairn) y0 = Math.min(y0, (cairn.I + cairn.J) * NY - cairn.h - cairn.height - 1); // ragt über die Silhouette
    b = { x: p.strip * STRIP, y: y0 - PAD, w: STRIP, h: y1 - y0 + 2 * PAD };
    boxes.set(p, b);
  }
  return b;
}

/** Liegt die Bildbox des Teilstücks im Bild? (Culling je Teilstück, A6) */
export function massifOnScreen(
  cam: Pick<Camera, 'x' | 'y' | 'zoom'>,
  view: { w: number; h: number },
  item: MassifItem,
): boolean {
  const b = massifBounds(item);
  return (
    b.x + b.w >= cam.x &&
    b.x <= cam.x + view.w / cam.zoom &&
    b.y + b.h >= cam.y &&
    b.y <= cam.y + view.h / cam.zoom
  );
}

/** Silhouette in Bildschirmpixeln (Verdecker für Licht und Feuer). */
export const massifClips = (cam: Camera, item: MassifItem): Pt[] =>
  massifSilhouette(item).map((q) => worldToScreen(cam, q));

/** Schichtbänder je Weltpixel Höhe (Phase): alle ≈ 9 px eine feine Linie, nur an steilen Flanken. */
const STRATA = 0.11;
const STRATA_DARK = 0.07; // Abdunklung im Band (schwach)
/** Weltpixel je Texturpixel der Unterbrechungsmaske: Bänder reissen ab und springen versetzt weiter. */
const STRATA_BREAK = 0.09;
const GRAIN = 0.04; // Pixelkorn ±2 %
/** Breite der Stufenübergänge in Pixeln der Fläche (1–2 px, Abnahme lead-art Runde 1). */
export const TONE_EDGE_PX = 1.5;
/** Rauschen am Rand von Bewuchs und Schnee (Anteil des Felds): gebrochene Ränder statt Papierschnitt. */
const VEG_BREAK = 0.3,
  SNOW_BREAK = 0.4;
/** Weichheit der Sockelkontur: höchstens 1 Flächenpixel (L2). */
const CONTOUR_PX = 1;
const TEX_N = 128; // Kantenlänge der Felstextur (Wertrauschen, kachelbar, einmal beim Laden)
/** Texturpixel je Weltpixel: Merkmale ≈ 2 px (fein, feiner als die Tonstufen) und ≈ 6 px (Brocken). */
const TEX_FINE = 4,
  TEX_COARSE = 1.3;
const TEX_AMP = 0.15; // Helligkeit fein ±7,5 % (an steilen Flanken), grob ±3,5 %
/** Kachelbares Wertrauschen 0…1 (Gitter 16 × 16, geglättet auf TEX_N × TEX_N). */
const ROCK_TEX = (() => {
  const g = 16,
    out = new Float32Array(TEX_N * TEX_N);
  const at = (x: number, y: number): number => hash2(4711, ((x % g) + g) % g, ((y % g) + g) % g);
  for (let y = 0; y < TEX_N; y++)
    for (let x = 0; x < TEX_N; x++) {
      const u = (x / TEX_N) * g,
        v = (y / TEX_N) * g;
      const x0 = Math.floor(u),
        y0 = Math.floor(v);
      const tx = u - x0,
        ty = v - y0;
      const sx = tx * tx * (3 - 2 * tx),
        sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      out[y * TEX_N + x] = a + (b - a) * sy;
    }
  return out;
})();
/** Textur bilinear an (u, v) in Texturpixeln, kachelnd. */
function tex(u: number, v: number): number {
  const x0 = Math.floor(u),
    y0 = Math.floor(v);
  const tx = u - x0,
    ty = v - y0;
  const m = TEX_N - 1;
  const xa = x0 & m,
    xb = (x0 + 1) & m,
    ya = (y0 & m) * TEX_N,
    yb = ((y0 + 1) & m) * TEX_N;
  const a = ROCK_TEX[ya + xa]! + (ROCK_TEX[ya + xb]! - ROCK_TEX[ya + xa]!) * tx;
  const b = ROCK_TEX[yb + xa]! + (ROCK_TEX[yb + xb]! - ROCK_TEX[yb + xa]!) * tx;
  return a + (b - a) * ty;
}

/** Bandform 0…1 je Phase (64 Stufen): schmale dunkle Linie mit weichem Rand. */
const BAND = Float32Array.from({ length: 64 }, (_, i) => {
  const v = 0.5 + 0.5 * Math.cos((i / 64) * 2 * Math.PI);
  return v * v * v * v;
});

/**
 * Rastert ein Teilstück (RGBA, `w` × `h` Pixel, Halbstreifen auf `w` Pixel, senkrecht Faktor `f`): Dreiecke hinten
 * nach vorn mit Gouraud-Farben, je Pixel Schichtbänder nach Höhe an steilen Wänden und Korn. Innenkanten sind lückenlos
 * (Pixelmitten, Kanten inklusive), es gibt keine Antialias-Fugen; die Aussenkante wird bei kleinem Faktor 2 × 2
 * überabgetastet. Rein, ohne Canvas.
 */
export function rasterPiece(
  item: MassifItem | { piece: MassifPiece },
  w: number,
  h: number,
  f: number,
  features = true,
  step = f,
): Uint8ClampedArray {
  const ss = f < 1.5 ? 2 : 1;
  const W = w * ss,
    H = h * ss;
  const b = massifBounds(item);
  const sx = (w / STRIP) * ss,
    sy = f * ss;
  const buf = new Uint8ClampedArray(W * H * 4);
  const seed = item.piece.comp.seed;
  const px = new Float64Array(4),
    py = new Float64Array(4);
  const trees = pieceTrees(item.piece);
  const cairn = features && step >= CAIRN_F ? pieceCairn(item.piece) : null;
  const decals = features ? pieceDecals(item.piece, step) : null;
  let ti = 0,
    ci = cairn ? 0 : 1;
  for (const c of pieceMesh(item.piece)) {
    // Bäume nach den Zellen bis zur Tiefe ihres Ankers: davor liegende Zellen überdecken den Fuss
    while (ti < trees.length && trees[ti]!.I + trees[ti]!.J < c.I + c.J)
      drawTree(buf, W, H, trees[ti++]!, b.x, b.y, sx, sy);
    if (ci === 0 && cairn!.I + cairn!.J < c.I + c.J) {
      drawCairn(buf, W, H, cairn!, b.x, b.y, sx, sy);
      ci = 1;
    }
    const I = [c.I, c.I + 1, c.I + 1, c.I],
      J = [c.J, c.J, c.J + 1, c.J + 1];
    for (let k = 0; k < 4; k++) {
      px[k] = ((I[k]! - J[k]!) * NX - b.x) * sx;
      py[k] = ((I[k]! + J[k]!) * NY - c.n[k]!.h - b.y) * sy;
    }
    const dec = decals ? cellDecal(decals, c.I, c.J) : null;
    for (const t of cellTris(c.n))
      triangle(buf, W, H, px, py, t, c.n, seed, b.x, b.y, sx, sy, dec, I, J);
  }
  while (ti < trees.length) drawTree(buf, W, H, trees[ti++]!, b.x, b.y, sx, sy);
  if (ci === 0) drawCairn(buf, W, H, cairn!, b.x, b.y, sx, sy);
  if (ss === 1) {
    // ImageData erwartet unvormultiplizierte Farben (nur im Sockelband nötig)
    for (let o = 0; o < buf.length; o += 4) {
      const al = buf[o + 3]!;
      if (al > 0 && al < 255) {
        const k = 255 / al;
        buf[o] = buf[o]! * k;
        buf[o + 1] = buf[o + 1]! * k;
        buf[o + 2] = buf[o + 2]! * k;
      }
    }
    return buf;
  }
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        bl = 0,
        a = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const i = ((2 * y + dy) * W + 2 * x + dx) * 4;
          r += buf[i]!;
          g += buf[i + 1]!;
          bl += buf[i + 2]!;
          a += buf[i + 3]!;
        }
      const o = (y * w + x) * 4;
      if (a > 0) {
        const k = 255 / a; // Quelle ist vormultipliziert (transparent = 0, 0, 0, 0)
        out[o] = r * k;
        out[o + 1] = g * k;
        out[o + 2] = bl * k;
        out[o + 3] = a / 4;
      }
    }
  return out;
}

// ---------- Entdecken (L6): Bergsee, Wasserfall, Höhle, Steinmännchen ----------
//
// Alle Töne aus der Palette gemischt (2–3 Stufen, Kontur als dunkler Eigenton, nie Schwarz, nichts heller als foam).
// Sichtbarkeit je Zoomstufe `step` (unabhängig von der DPR; Cache je Zoomstufe): See ab 0,5, Wasserfall ab 0,75, Höhle ab 1, Steinmännchen ab 1,5.

export const LAKE_F = 0.5,
  FALL_F = 0.75,
  CAVE_F = 1,
  CAIRN_F = 1.5;
const L = LIGHT_COLORS;
/** Bergsee: dunkler, entsättigter Spiegel (waterDeep mit 30 % Fels/kühl), hellere Spiegelung hinten, Ufer vorn hell, hinten Fels. */
export const LAKE_DEEP: Rgb = mixRgb(rgbOf(PALETTE.waterDeep), L.dark, 0.3),
  LAKE_SKY: Rgb = mixRgb(mixRgb(rgbOf(PALETTE.waterMid), L.dark, 0.25), L.light, 0.3),
  LAKE_LINE: Rgb = mixRgb(LAKE_DEEP, ROCK_TONES[0]!, 0.5),
  LAKE_SHORE: Rgb = mixRgb(DEBRIS, ROCK_TONES[2]!, 0.4),
  LAKE_SHORE_BACK: Rgb = ROCK_TONES[1]!;
/** Wasserfall: Kern foam/waterMid (steil hell, flach waterMid-grau), Nassfels weicher Felston, Gischt, Tümpel (Seestil). */
export const FALL_BAND: Rgb = mixRgb(rgbOf(PALETTE.foam), rgbOf(PALETTE.waterMid), 0.3),
  FALL_EDGE: Rgb = mixRgb(rgbOf(PALETTE.waterMid), ROCK_TONES[2]!, 0.35),
  FALL_WET: Rgb = mixRgb(ROCK_TONES[0]!, L.cool, 0.2),
  FALL_SPRAY: Rgb = mixRgb(rgbOf(PALETTE.foam), rgbOf(PALETTE.waterMid), 0.12),
  FALL_POOL: Rgb = LAKE_DEEP;
/** Höhle: zwei dunkle Töne (oben dunkler, nicht Schwarz), weicher Felsband-Überhang, Schuttfächer darunter. */
const dim = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];
export const CAVE_IN: Rgb = dim(mixRgb(ROCK_TONES[0]!, L.cool, 0.35), 0.7),
  CAVE_IN_TOP: Rgb = dim(mixRgb(ROCK_TONES[0]!, L.cool, 0.35), 0.52),
  CAVE_LINE: Rgb = mixRgb(ROCK_TONES[0]!, L.cool, 0.3),
  CAVE_LINTEL: Rgb = ROCK_TONES[3]!,
  CAVE_FAN: Rgb = mixRgb(ROCK_TONES[2]!, ROCK_TONES[3]!, 0.4); // Fels-/Schuttton, kein Gelb
/** Steinmännchen: Felstöne mit Licht oben links, Kontur dunkler Eigenton. */
export const CAIRN_LIT: Rgb = ROCK_TONES[3]!,
  CAIRN_MID: Rgb = ROCK_TONES[2]!,
  CAIRN_SHADE: Rgb = ROCK_TONES[1]!,
  CAIRN_LINE: Rgb = mixRgb(ROCK_TONES[0]!, L.cool, 0.25);
const PX_TILE = 1 / 30; // Kachel je Weltpixel (Näherung für Uferbreiten)

/** Abziehbilder einer Zelle (nur die sichtbaren Arten dieses Faktors). */
export interface CellDecal {
  lake: MassifLake | null;
  fall: MassifFall | null;
  cave: MassifCave | null;
}
interface PieceDecals {
  lake: MassifLake | null;
  fall: MassifFall | null;
  cave: MassifCave | null;
}
const touches = (nodes: Set<number>, I: number, J: number): boolean =>
  nodes.has(J * 100000 + I) ||
  nodes.has(J * 100000 + I + 1) ||
  nodes.has((J + 1) * 100000 + I) ||
  nodes.has((J + 1) * 100000 + I + 1);
/** Sichtbare Abziehbilder dieses Teilstücks bei Faktor f (null, wenn die Karte keine hat). */
function pieceDecals(p: MassifPiece, step: number): PieceDecals | null {
  const m = massifFeatures(p.data);
  const lake = m.lake && m.lake.comp === p.comp && step >= LAKE_F ? m.lake : null,
    fall = m.fall && m.fall.comp === p.comp && step >= FALL_F ? m.fall : null,
    cave = m.cave && m.cave.comp === p.comp && step >= CAVE_F ? m.cave : null;
  return lake || fall || cave ? { lake, fall, cave } : null;
}
function cellDecal(d: PieceDecals, I: number, J: number): CellDecal | null {
  const lake = d.lake && touches(d.lake.nodes, I, J) ? d.lake : null,
    fall = d.fall && touches(d.fall.nodes, I, J) ? d.fall : null,
    cave = d.cave && touches(d.cave.nodes, I, J) ? d.cave : null;
  return lake || fall || cave ? { lake, fall, cave } : null;
}

const segDist = (
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { d: number; t: number } => {
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return { d: Math.hypot(ax + t * dx - x, ay + t * dy - y), t };
};

/** Farbe des Abziehbilds am Punkt (Kachelpunkt fx, fy; Bildpunkt wx, wy in Weltpixeln) oder null. */
function decalColor(
  dec: CellDecal,
  fx: number,
  fy: number,
  wx: number,
  wy: number,
): readonly number[] | null {
  const lake = dec.lake;
  if (lake) {
    const sd = lake.comp.seed;
    const dx = fx - lake.cx,
      dy = fy - lake.cy;
    const d = Math.hypot(dx, dy);
    // Wasserkante folgt einem Rauschen (± ≈ 1 px), kein glattes Oval
    const r =
      lakeRadius(lake, Math.atan2(dy, dx)) +
      (valueNoise(sd + 577, fx * 7, fy * 7) - 0.5) * 2.4 * PX_TILE;
    const front = dx + dy > 0; // zur Kamera
    if (d < r) {
      if (d > r - PX_TILE) return LAKE_LINE; // Kontur: 1 px dunkler Eigenton
      // Spiegelung am hinteren Ufer (Himmel): Richtung −x −y
      const q = (dx + dy) / (Math.SQRT2 * r);
      return q < -0.42 + 0.1 * Math.sin(dx * 23 + dy * 11) ? LAKE_SKY : LAKE_DEEP;
    }
    // Ufer ≈ 1 px und unterbrochen: vorn heller Kiesstrand, hinten der Schattenton des Felses
    if (d < r + PX_TILE) {
      const g = hash2(sd + 577, Math.floor(fx * 26), Math.floor(fy * 26));
      if (front ? g > 0.22 : g > 0.55) return front ? LAKE_SHORE : LAKE_SHORE_BACK;
    }
  }
  const fall = dec.fall;
  if (fall) {
    const pts = fall.path;
    const sd = fall.comp.seed;
    let best = Infinity,
      wBand = 1,
      hi = 0,
      side = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k]!,
        b = pts[k + 1]!;
      const ax = (a.I - a.J) * NX,
        ay = (a.I + a.J) * NY - a.h,
        bx = (b.I - b.J) * NX,
        by = (b.I + b.J) * NY - b.h;
      const { d, t } = segDist(wx, wy, ax, ay, bx, by);
      const wd = a.w + (b.w - a.w) * t;
      if (d - wd / 2 < best) {
        best = d - wd / 2;
        wBand = wd;
        hi = a.steep + (b.steep - a.steep) * t;
        side = wx - (ax + (bx - ax) * t);
      }
    }
    // Gischt an Knicken von steil zu flach: 2–3 überlappende Kleckse, Deckung blendet aus
    let spray = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k]!,
        b = pts[k + 1]!;
      if (!(a.steep >= 0.5 && b.steep < 0.5)) continue;
      const bx = (b.I - b.J) * NX,
        by = (b.I + b.J) * NY - b.h;
      const kx = Math.round(bx * 4),
        ky = Math.round(by * 4);
      const nb = 2 + Math.floor(hash2(sd + 579, kx, ky) * 2);
      for (let i = 0; i < nb; i++) {
        const cx = bx + (hash2(sd + 579, kx + i * 7 + 1, ky) - 0.5) * 3.2,
          cy = by + (hash2(sd + 579, kx, ky + i * 7 + 1) - 0.5) * 2,
          rr = 1.1 + 0.9 * hash2(sd + 579, kx + i * 3 + 2, ky + 5);
        const dd = Math.hypot((wx - cx) / 1.4, wy - cy) / rr;
        if (dd < 1) spray = Math.max(spray, 1 - dd);
      }
    }
    // Tümpel am Fuss: unregelmässiger flacher Fleck im Seestil (dunkles Wasser, vorn Kies, Kante mit Rauschen)
    const e = pts[pts.length - 1]!;
    const ex = wx - (e.I - e.J) * NX,
      ey = wy - ((e.I + e.J) * NY - e.h);
    {
      const u = ex / 3,
        v = ey / 2;
      const fac = 1 + (valueNoise(sd + 580, ex * 0.8 + 9, ey * 1.1 + 4) - 0.5) * 0.7;
      const q = Math.hypot(u, v);
      if (q < fac) {
        if (q > fac - 0.28) return LAKE_LINE;
        if (v < -0.2 && q < 0.55) return [...FALL_SPRAY, 0.75];
        return FALL_POOL;
      }
      if (q < fac + 0.3 && ey > 0 && hash2(sd + 581, Math.floor(wx * 2), Math.floor(wy * 2)) > 0.3)
        return LAKE_SHORE;
    }
    if (spray > 0.05) return [...FALL_SPRAY, Math.min(0.9, spray * 1.3)];
    // ausgefranste Ränder: fester Hash je halbem Weltpixel (± 0,5 px), kein Blinken; keine dunkle Kontur
    const ed = best + (hash2(sd + 579, Math.floor(wx * 2), Math.floor(wy * 2)) - 0.5);
    if (ed <= 0) {
      // Kern: steil am hellsten, flach waterMid-grau
      const c = mixRgb(FALL_EDGE, FALL_BAND, Math.max(0, Math.min(1, (hi - 0.15) / 0.55)));
      return ed < -0.3 - 0.1 * wBand ? c : [...c, 0.8];
    }
    // Nassfels: weicher, abgedunkelter Felston (≈ 50 % Deckung, ausblendend), nur auf der Schattenseite
    if (ed <= 1.4 && side > 0) return [...FALL_WET, 0.5 * (1 - ed / 1.4)];
  }
  const cave = dec.cave;
  if (cave) {
    const sd = cave.comp.seed;
    const ax = (cave.I - cave.J) * NX,
      ay = (cave.I + cave.J) * NY - cave.h;
    let v = (wy - ay + 0.3) / cave.ry;
    const u = (wx - ax) / cave.rx + 0.22 * v; // schief: unsymmetrisch
    if (v > 0) v *= 1.25; // flacherer Boden
    const ang = Math.atan2(v, u);
    const n = cave.shape.length;
    const tt = ((ang / (2 * Math.PI) + 1) % 1) * n,
      k = Math.floor(tt),
      fr = tt - k;
    const fac =
      cave.shape[k % n]! +
      (cave.shape[(k + 1) % n]! - cave.shape[k % n]!) * (fr * fr * (3 - 2 * fr));
    const q = Math.hypot(u, v) / fac;
    if (q < 1) return q > 0.88 ? CAVE_LINE : v < -0.15 ? CAVE_IN_TOP : CAVE_IN;
    // Überhang: weiches Felsband (1–2 px), läuft an den Enden aus
    if (v < -0.2 && q < 1 + 0.5 * Math.max(0, 1 - u * u)) return CAVE_LINTEL;
    // kleiner Schuttfächer unter dem Eingang
    if (v > 0.8 && v < 2 && Math.abs(u) < 0.3 + 0.55 * (v - 0.8)) {
      if (hash2(sd + 581, Math.floor(wx * 2), Math.floor(wy * 2)) < 0.95 - 0.45 * (v - 0.8))
        return CAVE_FAN;
    }
  }
  return null;
}

/** Steinmännchen (L6 C9) am Anker: gestapelte Steine, nach oben kleiner, Felstöne mit Licht oben links, Kontur. */
function drawCairn(
  buf: Uint8ClampedArray,
  W: number,
  H: number,
  t: MassifCairn,
  ox: number,
  oy: number,
  sx: number,
  sy: number,
): void {
  const fx = (t.I - t.J) * NX,
    fy = (t.I + t.J) * NY - t.h;
  const x0 = Math.max(0, Math.floor((fx - 3 - ox) * sx)),
    x1 = Math.min(W - 1, Math.ceil((fx + 3 - ox) * sx)),
    y0 = Math.max(0, Math.floor((fy - t.height - 1 - oy) * sy)),
    y1 = Math.min(H - 1, Math.ceil((fy + 0.5 - oy) * sy));
  // Steine mit Mittelpunkt (cu, cv) und Halbachsen
  const st: { cu: number; cv: number; rx: number; ry: number }[] = [];
  let base = 0;
  for (const s of t.stones) {
    st.push({ cu: s.dx, cv: base + s.h * 0.5, rx: s.w * 0.5, ry: s.h * 0.62 });
    base += s.h * 0.92;
  }
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const u = ox + (x + 0.5) / sx - fx,
        v = fy - (oy + (y + 0.5) / sy);
      let c: Rgb | null = null;
      for (let i = 0; i < st.length; i++) {
        const l = st[i]!;
        const qu = (u - l.cu) / l.rx,
          qv = (v - l.cv) / l.ry;
        const q = qu * qu + qv * qv;
        if (q > 1) continue;
        const rim = (1 - Math.sqrt(q)) * Math.min(l.rx, l.ry) < 0.35;
        const lit = -0.6 * qu + 0.8 * qv;
        c = rim ? CAIRN_LINE : lit > 0.25 ? CAIRN_LIT : lit < -0.45 ? CAIRN_SHADE : CAIRN_MID;
      }
      if (!c) continue;
      const o = (y * W + x) * 4;
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
      buf[o + 3] = 255;
    }
}

const TREE_CROWN = rgbOf(PALETTE.crown),
  TREE_LIGHT = rgbOf(PALETTE.crownLight),
  TREE_TRUNK = rgbOf(PALETTE.earthEdge),
  TREE_LINE = mixRgb(rgbOf(PALETTE.crown), LIGHT_COLORS.cool, 0.35); // dunkle Eigenkontur, nie Schwarz

/** Kronenlappen eines Baums in Weltpixeln relativ zum Anker (u rechts, v hoch): Mitte, Radien. */
export function treeLobes(t: MassifTree): { cu: number; cv: number; rx: number; ry: number }[] {
  const ws = 1.45; // Breitenmassstab (Höhe 14–20 px, Breite ≤ 12 px)
  const sh = t.height / 9;
  const off = [-1.2, 1.2, -0.4];
  const out: { cu: number; cv: number; rx: number; ry: number }[] = [];
  for (let i = 0; i < t.lobes; i++) {
    const a = t.lobes === 1 ? 0 : i / (t.lobes - 1); // 0 unten, 1 oben
    const cv = t.height * (0.45 + 0.27 * a);
    out.push({
      cu: t.lean * (0.35 + 0.65 * a) + off[i % 3]! * ws,
      cv,
      rx: (2.2 - 0.25 * a) * ws,
      ry: Math.min(2 * sh, t.height - cv) * (0.85 + 0.15 * (1 - a)) + 0.1,
    });
  }
  return out;
}

/**
 * Windschiefe Kiefer am Anker (L2 C3), in Weltpixeln gezeichnet (scharf bei jedem Faktor): Stamm in earthEdge, Krone
 * aus 3 Lappen in crown/crownLight (Licht links oben) mit dunkler Eigenkontur. Höhe 14–20, Breite höchstens 12 px.
 */
function drawTree(
  buf: Uint8ClampedArray,
  W: number,
  H: number,
  t: MassifTree,
  ox: number,
  oy: number,
  sx: number,
  sy: number,
): void {
  const fx = (t.I - t.J) * NX,
    fy = (t.I + t.J) * NY - t.h;
  const top = t.height,
    lean = t.lean;
  const lobes = treeLobes(t);
  const x0 = Math.max(0, Math.floor((fx - 8 - ox) * sx)),
    x1 = Math.min(W - 1, Math.ceil((fx + 8 - ox) * sx)),
    y0 = Math.max(0, Math.floor((fy - top - 1 - oy) * sy)),
    y1 = Math.min(H - 1, Math.ceil((fy + 0.5 - oy) * sy));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const u = ox + (x + 0.5) / sx - fx,
        v = fy - (oy + (y + 0.5) / sy);
      let c: readonly number[] | null = null;
      // Stamm: leicht gekrümmt bis 55 % der Höhe
      if (v >= 0 && v <= 0.55 * top && Math.abs(u - lean * 0.5 * (v / (0.55 * top)) ** 1.5) <= 0.6)
        c = TREE_TRUNK;
      // Lappen von oben nach unten: untere liegen vorn
      for (let i = lobes.length - 1; i >= 0; i--) {
        const l = lobes[i]!;
        const qu = (u - l.cu) / l.rx,
          qv = (v - l.cv) / l.ry;
        const q = qu * qu + qv * qv;
        if (q > 1) continue;
        const rim = (1 - Math.sqrt(q)) * Math.min(l.rx, l.ry) < 0.9;
        c = rim ? TREE_LINE : -0.6 * qu + 0.8 * qv > 0.1 ? TREE_LIGHT : TREE_CROWN;
      }
      if (!c) continue;
      const o = (y * W + x) * 4;
      buf[o] = c[0]!;
      buf[o + 1] = c[1]!;
      buf[o + 2] = c[2]!;
      buf[o + 3] = 255;
    }
}

/** Schichtband 0…1 am Weltpunkt (wx, wy) in Höhe h: nur an steilen Flanken, unterbrochen und versetzt (A3). */
export function strataAt(h: number, steep: number, warp: number, wx: number, wy: number): number {
  if (steep < 0.35) return 0;
  const m = tex(wx * STRATA_BREAK * 4 + 11, wy * STRATA_BREAK * 4 + 53);
  const on = m < 0.42 ? 0 : Math.min(1, (m - 0.42) * 12); // abgerissen, wo die Maske tief ist
  if (on === 0) return 0;
  const jump = tex(wx * STRATA_BREAK * 2 + 71, wy * STRATA_BREAK * 2 + 17) > 0.5 ? 0.5 : 0; // Versatz
  const ph = h * STRATA + warp + jump;
  const sm = (steep - 0.35) / 0.65;
  return BAND[Math.floor((ph - Math.floor(ph)) * 64) & 63]! * on * sm * sm;
}

/** Blütendichte auf dem Blütenbereich (Anteil der Zellen); insgesamt höchstens 3 % der Bewuchspixel. */
const FLOWER_DENSITY = 0.04;
const FLOWER_RGB = FLOWER_TONES.map((c) => rgbOfCss(c));
/** Seed-Versatz des Felskorns (Liste der Versätze in groundDecor.ts). */
const GRAIN_SEED = 321;
/**
 * Pixelkorn 1 ± GRAIN/2 am Weltpunkt (wx, wy), Zelle = ein Flächenpixel (sx, sy Pixel je Weltpixel), in Weltkoordinaten
 * verankert: Nachbarstreifen tragen nicht dasselbe Muster.
 */
export function grainAt(seed: number, wx: number, wy: number, sx: number, sy: number): number {
  return 1 + (hash2(seed + GRAIN_SEED, Math.floor(wx * sx), Math.floor(wy * sy)) - 0.5) * GRAIN;
}

/** Korn im Schuttband (L2): Zellen von 2 Weltpixeln, halbe Amplitude (Salz 532, Liste in groundDecor.ts). */
export function bandGrainAt(seed: number, wx: number, wy: number): number {
  return 1 + (hash2(seed + 532, Math.floor(wx / 2), Math.floor(wy / 2)) - 0.5) * GRAIN * 0.5;
}

/** Halbe Übergangsbreite (in Einheiten des Werts) für TONE_EDGE_PX Pixel bei Gefälle |∇v| (je Pixel). */
const halfWidth = (g: number): number => Math.min(0.5, Math.max(0.02, 0.5 * TONE_EDGE_PX * g));
const sstep = (v: number, t: number, hw: number): number => {
  const x = (v - (t - hw)) / (2 * hw);
  return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
};

/**
 * Ein Dreieck in den Puffer (Pixelmitten inklusive Kante): Tonstufen mit 1–2 px weichen Übergängen (Breite aus dem
 * Gefälle der Tonstufe im Dreieck), Grat- und Rinnenkanten, Bewuchsflecken, Geröll, Schichtbänder, Felstextur.
 */
function triangle(
  buf: Uint8ClampedArray,
  W: number,
  H: number,
  px: Float64Array,
  py: Float64Array,
  t: readonly [Corner, Corner, Corner],
  n: MeshCell['n'],
  seed: number,
  ox: number,
  oy: number,
  sx: number,
  sy: number,
  dec: CellDecal | null = null,
  cI: readonly number[] = [],
  cJ: readonly number[] = [],
): void {
  const [i0, i1, i2] = t;
  const x0 = px[i0]!,
    y0 = py[i0]!,
    x1 = px[i1]!,
    y1 = py[i1]!,
    x2 = px[i2]!,
    y2 = py[i2]!;
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (Math.abs(area) < 1e-9) return;
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))),
    maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2))),
    minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))),
    maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
  const a = n[i0],
    b = n[i1],
    c = n[i2];
  // Gefälle der baryzentrischen Gewichte je Pixel: Übergangsbreiten konstant je Dreieck
  const d0x = (y1 - y2) / area,
    d0y = (x2 - x1) / area,
    d1x = (y2 - y0) / area,
    d1y = (x0 - x2) / area;
  const grad = (va: number, vb: number, vc: number): number =>
    Math.hypot((va - vc) * d0x + (vb - vc) * d1x, (va - vc) * d0y + (vb - vc) * d1y);
  const hwS = Math.min(0.5, Math.max(0.02, 0.5 * CONTOUR_PX * grad(a.soft, b.soft, c.soft))),
    hwT = halfWidth(grad(a.t, b.t, c.t)),
    hwE = halfWidth(grad(a.e, b.e, c.e)),
    hwV = halfWidth(grad(a.veg, b.veg, c.veg)),
    hwN = halfWidth(grad(a.snow, b.snow, c.snow)),
    hwF = halfWidth(grad(a.foot, b.foot, c.foot));
  const eps = -1e-7;
  const top = ROCK_TONES.length - 1;
  for (let y = minY; y <= maxY; y++) {
    const yc = y + 0.5;
    for (let x = minX; x <= maxX; x++) {
      const xc = x + 0.5;
      const w0 = ((x1 - xc) * (y2 - yc) - (x2 - xc) * (y1 - yc)) / area;
      if (w0 < eps) continue;
      const w1 = ((x2 - xc) * (y0 - yc) - (x0 - xc) * (y2 - yc)) / area;
      if (w1 < eps) continue;
      const w2 = 1 - w0 - w1;
      if (w2 < eps) continue;
      const lerp = (va: number, vb: number, vc: number): number => va * w0 + vb * w1 + vc * w2;
      // Tonstufe
      const soft = lerp(a.soft, b.soft, c.soft);
      const deb = debrisOf(soft);
      const st = Math.min(top, toneStep(lerp(a.t, b.t, c.t), hwT)); // Band: Stufen schon im Netz flach
      const k0 = Math.floor(st),
        k1 = Math.min(top, k0 + 1),
        fr = st - k0;
      const vl = lerp(a.vlow, b.vlow, c.vlow); // Wiesentöne unten, Kronentöne oben
      const R = ROCK_TONES[k0]!,
        R1 = ROCK_TONES[k1]!,
        V = VEG_TONES[k0]!,
        V1 = VEG_TONES[k1]!,
        G = VEG_GRASS_TONES[k0]!,
        G1 = VEG_GRASS_TONES[k1]!;
      let r = R[0] + (R1[0] - R[0]) * fr,
        g = R[1] + (R1[1] - R[1]) * fr,
        bl = R[2] + (R1[2] - R[2]) * fr;
      // Bewuchsflecken
      // Weltpixel (stetig über Streifen und Zoomstufen) und grobes Rauschen für gebrochene Ränder (Bewuchs, Schnee)
      const wx = ox + xc / sx,
        wy = oy + yc / sy;
      // nur dort rechnen, wo Bewuchs, Schnee oder Fusswiese wirken (Review R3)
      const brk =
        a.veg + b.veg + c.veg > 0.3 ||
        a.snow + b.snow + c.snow > 0.3 ||
        a.foot + b.foot + c.foot > 0.15
          ? tex(wx * 1.1 + 31, wy * 1.1 + 5) - 0.5
          : 0;
      const vg = VEG_MIX * sstep(lerp(a.veg, b.veg, c.veg) + VEG_BREAK * brk, 0.5, hwV);
      if (vg > 0) {
        for (let q = 0; q < 3; q++) {
          const v0 = V[q]! + (G[q]! - V[q]!) * vl,
            v1 = V1[q]! + (G1[q]! - V1[q]!) * vl;
          const target = v0 + (v1 - v0) * fr;
          if (q === 0) r += (target - r) * vg;
          else if (q === 1) g += (target - g) * vg;
          else bl += (target - bl) * vg;
        }
      }
      // knappe helle Kante auf Graten (Lichtseite), dunkle in Rinnen
      const e = lerp(a.e, b.e, c.e);
      const hi = e > 0 ? RIDGE_HI * sstep(e, EDGE_ON, hwE) * (st >= TONE_FLAT ? 1 : 0) : 0,
        lo = e < 0 ? RINNE_LO * sstep(-e, EDGE_ON, hwE) : 0;
      if (hi > 0) {
        const L = ROCK_TONES[top]!;
        r += (L[0] - r) * hi;
        g += (L[1] - g) * hi;
        bl += (L[2] - bl) * hi;
      } else if (lo > 0) {
        const D = ROCK_TONES[0]!;
        r += (D[0] - r) * lo;
        g += (D[1] - g) * lo;
        bl += (D[2] - bl) * lo;
      }
      // Schnee (L2 C2): 3 Stufen nach der Tonstufe, 1–2 px weicher Rand, ersetzt Fels und Bewuchs
      const sn =
        a.snow + b.snow + c.snow > 0.3
          ? sstep(lerp(a.snow, b.snow, c.snow) + SNOW_BREAK * brk, 0.5, hwN)
          : 0;
      if (sn > 0) {
        const S = SNOW_TONES[k0]!,
          S1 = SNOW_TONES[k1]!;
        r += (S[0] + (S1[0] - S[0]) * fr - r) * sn;
        g += (S[1] + (S1[1] - S[1]) * fr - g) * sn;
        bl += (S[2] + (S1[2] - S[2]) * fr - bl) * sn;
      }
      // Schuttband am Fuss (hell), vor der Kontur
      const db = DEBRIS_MIX * debrisOf(soft);
      if (db > 0) {
        r += (DEBRIS[0] - r) * db;
        g += (DEBRIS[1] - g) * db;
        bl += (DEBRIS[2] - bl) * db;
      }
      // Textur, Geröll und Schichtbänder in Weltpixeln
      const steep = lerp(a.steep, b.steep, c.steep);
      const tf = tex(wx * TEX_FINE, wy * TEX_FINE) - 0.5,
        tc = tex(wx * TEX_COARSE + 37, wy * TEX_COARSE + 91) - 0.5;
      // Schuttband (L2): keine feinen Brocken und kein Feinkorn, nur grobe Tönung und Korn in 2-px-Zellen
      let k =
        1 +
        TEX_AMP *
          (tf * (0.45 + 0.55 * steep) * (1 - deb) + 0.45 * tc * (1 - 0.6 * deb)) *
          (1 - 0.5 * sn); // Schnee: Textur halb
      const rub = lerp(a.rub, b.rub, c.rub) * (1 - deb);
      if (rub > 0.05) {
        const s2 = tex(wx * 2.6 + 101, wy * 2.6 + 7);
        if (s2 > 0.72)
          k *= 1 + 0.22 * rub; // helle Brocken
        else if (s2 < 0.26) k *= 1 - 0.18 * rub; // ihre Schatten
      }
      k *=
        1 -
        STRATA_DARK *
          (1 - sn) * // Schnee: keine Schichtbänder
          strataAt(lerp(a.h, b.h, c.h), steep, lerp(a.warp, b.warp, c.warp), wx, wy);
      if (sn > 0 && k > 1) k = 1 + (k - 1) * (1 - sn); // Schnee nie heller als seine Stufe (≤ foam)
      k *= deb > 0.5 ? bandGrainAt(seed, wx, wy) : grainAt(seed, wx, wy, sx, sy);
      if (sn > 0.5 && k > 1) k = 1;
      r *= k;
      g *= k;
      bl *= k;
      // Sockel: Nachbargelände einmischen, Deckkraft
      const mx = lerp(a.mix, b.mix, c.mix);
      if (mx > 0) {
        r += (lerp(a.ec[0], b.ec[0], c.ec[0]) - r) * mx;
        g += (lerp(a.ec[1], b.ec[1], c.ec[1]) - g) * mx;
        bl += (lerp(a.ec[2], b.ec[2], c.ec[2]) - bl) * mx;
      }
      // Wiesenfuss (G2): gestufte Kante, 1–2 px, Rand per Rauschen gebrochen
      const fv = a.foot + b.foot + c.foot;
      if (fv > 0.15) {
        const fm = FOOT_GRASS * sstep(lerp(a.foot, b.foot, c.foot) + 0.25 * brk, 0.5, hwF);
        if (fm > 0) {
          r += (lerp(a.fc[0], b.fc[0], c.fc[0]) - r) * fm;
          g += (lerp(a.fc[1], b.fc[1], c.fc[1]) - g) * fm;
          bl += (lerp(a.fc[2], b.fc[2], c.fc[2]) - bl) * fm;
        }
      }
      // C5 Alpenwiese: vereinzelte Blütenpunkte auf flachen Bewuchsflecken, Zelle = 1 Weltpixel (weltfest, kein Flimmern)
      if (vg >= 0.9 * VEG_MIX && lerp(a.flower, b.flower, c.flower) > 0.5) {
        const cx = Math.floor(wx),
          cy = Math.floor(wy);
        if (hash2(seed + L2_FLOWER_SALT, cx, cy) < FLOWER_DENSITY) {
          const f =
            FLOWER_RGB[Math.min(2, Math.floor(hash2(seed + L2_FLOWER_TONE_SALT, cx, cy) * 3))]!;
          r = f[0];
          g = f[1];
          bl = f[2];
        }
      }
      if (dec) {
        // L6: Abziehbilder (See, Wasserfall, Höhle) nach Weltpunkt bzw. Bildpunkt, ersetzen die Zellfarbe
        const fx = (cI[i0]! * w0 + cI[i1]! * w1 + cI[i2]! * w2) / SUB,
          fy = (cJ[i0]! * w0 + cJ[i1]! * w1 + cJ[i2]! * w2) / SUB;
        const q = decalColor(dec, fx, fy, wx, wy);
        if (q) {
          const qa = q.length > 3 ? q[3]! : 1; // weiche Abziehbilder (Nassfels, Gischt) mit Deckung
          r += (q[0]! - r) * qa;
          g += (q[1]! - g) * qa;
          bl += (q[2]! - bl) * qa;
        }
      }
      const o = (y * W + x) * 4;
      // Kontur: 1–2 px weich an der Höhenlinie SOFT_CUT; ab RIM_H Höhe immer deckend
      const al = Math.max(sstep(soft, SOFT_CUT, hwS), lerp(a.ah, b.ah, c.ah));
      if (al >= 0.999) {
        buf[o] = r;
        buf[o + 1] = g;
        buf[o + 2] = bl;
        buf[o + 3] = 255;
      } else {
        // „über“ das schon Gezeichnete (Sockelband): Puffer vormultipliziert
        const keep = 1 - al;
        buf[o] = r * al + buf[o]! * keep;
        buf[o + 1] = g * al + buf[o + 1]! * keep;
        buf[o + 2] = bl * al + buf[o + 2]! * keep;
        buf[o + 3] = 255 * al + buf[o + 3]! * keep;
      }
    }
  }
}

/** Malt ein Teilstück in seine Fläche (`w` × `h` Pixel) über ImageData; ohne ImageData (Fake-Kontext) nichts. */
export function paintPiece(
  ctx: CanvasRenderingContext2D,
  item: MassifItem | { piece: MassifPiece },
  w: number,
  h: number,
  f: number,
  step = f,
): void {
  const img = (
    ctx.createImageData as ((w: number, h: number) => ImageData | undefined) | undefined
  )?.(w, h);
  if (!img) return;
  img.data.set(rasterPiece(item, w, h, f, true, step));
  ctx.putImageData(img, 0, 0);
}

let makeCanvas: () => HTMLCanvasElement | null = () =>
  typeof document === 'undefined' ? null : document.createElement('canvas');
/** Fabrik für die Offscreen-Flächen des Standard-Caches; im Node-Test ein Fake (ohne `document` kein Massiv). */
export function setMassifCanvasFactory(fn: () => HTMLCanvasElement | null): void {
  makeCanvas = fn;
}

export interface MassifCacheStats {
  hits: number;
  misses: number;
  /** Aufrufe, die eine Fläche einer anderen Zoomstufe skaliert zeigten (Baubudget des Frames erschöpft). */
  fallbacks: number;
  /** Im letzten Frame gestempelte Teilstücke. */
  draws: number;
  entries: number;
  bytes: number;
}
interface Entry {
  surface: HTMLCanvasElement;
  bytes: number;
  w: number;
  h: number;
  f: number;
  frame: number;
}

/**
 * Cache der Teilstück-Flächen je (Teilstück, Zoomstufe, DPR), LRU mit Bytegrenze (A6). Einträge des laufenden
 * Frames werden nie verdrängt; passt eine neue Fläche nicht mehr unter die Grenze, wird sie gezeichnet und
 * verworfen. Je Frame höchstens `buildsPerFrame` neue Flächen, solange eine andere Zoomstufe als Ersatz da ist.
 */
export function createMassifCache(
  opts: {
    factory?: () => HTMLCanvasElement | null;
    maxBytes?: number;
    buildsPerFrame?: number;
  } = {},
) {
  const maxBytes = opts.maxBytes ?? MASSIF_CACHE_MAX_BYTES;
  const budget = opts.buildsPerFrame ?? MASSIF_BUILDS_PER_FRAME;
  const factory = (): HTMLCanvasElement | null => (opts.factory ?? makeCanvas)();
  const map = new Map<string, Entry>(); // Einfügereihenfolge = LRU
  let bytes = 0,
    frame = 0,
    dpr = 1,
    builds = 0;
  const st = { hits: 0, misses: 0, fallbacks: 0, draws: 0 };
  const keyOf = (p: MassifPiece, step: number): string =>
    `${p.key}|${step}|${Math.round(dpr * 1000)}`;

  function release(e: Entry): void {
    e.surface.width = 0;
    e.surface.height = 0;
  }
  /** Verdrängt die ältesten Einträge ausserhalb des laufenden Frames, bis `room` Bytes passen. */
  function makeRoom(room: number): boolean {
    for (const [k, e] of map) {
      if (bytes + room <= maxBytes) break;
      if (e.frame === frame) continue;
      map.delete(k);
      release(e);
      bytes -= e.bytes;
    }
    return bytes + room <= maxBytes;
  }
  function build(item: MassifItem, step: number): Entry | null {
    const surface = factory();
    if (!surface) return null;
    const f = Math.min(step * dpr, MASSIF_MAX_SCALE);
    const b = massifBounds(item);
    const w = Math.max(1, Math.round(STRIP * f)),
      h = Math.max(1, Math.ceil(b.h * f));
    surface.width = w;
    surface.height = h;
    const c = surface.getContext('2d');
    if (!c) return null;
    paintPiece(c, item, w, h, f, step);
    return { surface, bytes: w * h * 4, w, h, f, frame };
  }
  function stamp(ctx: CanvasRenderingContext2D, cam: Camera, item: MassifItem, e: Entry): void {
    // Streifenkanten auf Gerätepixel: Nachbarstreifen teilen ihre Kante exakt, keine Naht beim Zwischenzoom
    const z = cam.zoom,
      b = massifBounds(item);
    const snap = (v: number): number => Math.round(v * z * dpr) / dpr;
    const l = snap(b.x - cam.x),
      r = snap(b.x + STRIP - cam.x),
      t = snap(b.y - cam.y);
    ctx.drawImage(e.surface, l, t, r - l, (e.h / e.f) * z);
    st.draws++;
  }

  return {
    /** Vor den Teilstücken eines Frames, mit der Geräte-DPR des Zielkontexts. */
    beginFrame(d: number): void {
      frame++;
      builds = 0;
      st.draws = 0;
      dpr = d > 0 && Number.isFinite(d) ? d : 1;
    },
    draw(ctx: CanvasRenderingContext2D, cam: Camera, item: MassifItem): void {
      const p = item.piece,
        step = zoomStep(cam.zoom);
      const key = keyOf(p, step);
      let e = map.get(key);
      if (e) {
        map.delete(key);
        map.set(key, e);
        st.hits++;
      } else {
        if (builds >= budget) {
          for (const s of ZOOM_STEPS) {
            const alt = s === step ? undefined : map.get(keyOf(p, s));
            if (alt) {
              alt.frame = frame;
              st.fallbacks++;
              stamp(ctx, cam, item, alt);
              return;
            }
          }
        }
        const made = build(item, step);
        if (!made) return;
        builds++;
        st.misses++;
        if (made.bytes <= maxBytes && makeRoom(made.bytes)) {
          map.set(key, made);
          bytes += made.bytes;
        } else {
          stamp(ctx, cam, item, made);
          release(made);
          return;
        }
        e = made;
      }
      e.frame = frame;
      stamp(ctx, cam, item, e);
    },
    stats(): MassifCacheStats {
      return { ...st, entries: map.size, bytes };
    },
    clear(): void {
      for (const e of map.values()) release(e);
      map.clear();
      bytes = 0;
    },
  };
}

/** Standard-Cache des Renderers. */
export const massifCache = createMassifCache();
