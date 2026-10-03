import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import {
  ISO_H,
  ISO_W,
  ROCK_VARIANTS,
  ZOOM_STEPS,
  rockVariant,
  pointBounds,
  project,
  zoomStep,
  type Box,
  type Pt,
  type SortedItem,
} from './iso';
import { PALETTE, mixHex } from './palette';

// rocks.ts — Felsmassive als aufrechte Stempel über Gebirgskacheln (G3, ADR-012). Reine Darstellung: Gestalt, Grösse
// und Farbe sind Funktionen von (world.seed, x, y); die Sim kennt keine Höhe. Wie `trees.ts` bleibt jeder Stempel in
// der Spaltenbreite seiner Kachel und überragt sie höchstens bis H_MAX, damit die 1×1-Sortierbeweise tragen (ISO §10).
export type RockItem = Extract<SortedItem, { kind: 'rock' }>;
/** Rolle einer Fläche: Sockelsilhouette, Lichtseite (links), Schattenseite (rechts), Lichtkappe an der Spitze. */
export type FaceRole = 'base' | 'light' | 'shade' | 'cap';
export interface RockFace {
  role: FaceRole;
  /** Punkte relativ zur Rautenmitte der Kachel, Weltpixel bei Zoom 1 (y nach unten). */
  pts: Pt[];
  fill: string;
}

export { ROCK_VARIANTS, rockVariant };
/** Stempelhöhe über der Rautenmitte (Weltpixel), unter H_MAX. */
export const ROCK_H = 1.4 * ISO_H;
const STAMP_H = ROCK_H + ISO_H / 2;
const TOP_MARGIN = 6; // Abstand der höchsten Spitze zur Stempeloberkante
const SHADOW_SHIFT = 0.12; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };
/** Fusspunkte der Gipfel (Pixel relativ zur Rautenmitte), hinten zuerst. */
const SLOTS: readonly [number, number][] = [
  [-9, -3],
  [10, -1],
  [0, 4],
];

interface Peak {
  px: number;
  py: number;
  w: number;
  h: number;
  ax: number;
  tone: number;
}
function peaksFor(seed: number, variant: number): Peak[] {
  const rnd = (k: number, j: number) => hash2(seed + 72, variant * 7 + j, k);
  const n = 2 + Math.floor(rnd(0, 0) * 2); // 2 oder 3 Gipfel
  const main = 0.55 + 0.45 * rnd(1, 0); // Hauptgipfel in Anteilen der nutzbaren Höhe
  const usable = ROCK_H - TOP_MARGIN;
  const order = SLOTS.map((s, i) => ({ s, k: rnd(2, i) })).sort((a, b) => a.k - b.k);
  const out: Peak[] = [];
  for (let i = 0; i < n; i++) {
    const [sx, sy] = order[i]!.s;
    const big = i === 0;
    const w = (big ? 17 : 12) + 3.5 * rnd(3 + i, 1);
    const h = usable * main * (big ? 1 : 0.4 + 0.35 * rnd(4 + i, 2));
    out.push({
      px: sx,
      py: sy,
      w,
      h,
      ax: sx + (rnd(5 + i, 3) - 0.5) * 6,
      tone: rnd(6 + i, 4),
    });
  }
  return out.sort((a, b) => a.py - b.py); // hinten zuerst
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Flächen eines Massivs, hinten zuerst, in Zeichenreihenfolge (Sockel, Licht, Schatten, Kappe je Gipfel). */
export function rockFaces(seed: number, variant: number): RockFace[] {
  const faces: RockFace[] = [];
  for (const p of peaksFor(seed, variant)) {
    const A = { x: p.ax, y: p.py - p.h };
    const L = { x: p.px - p.w, y: p.py },
      B = { x: p.px, y: p.py + p.w / 2 },
      R = { x: p.px + p.w, y: p.py };
    const sl = lerp(A, L, 0.5),
      sr = lerp(A, R, 0.5);
    const Sl = { x: sl.x - 2.5, y: sl.y - 1.5 },
      Sr = { x: sr.x + 1.5, y: sr.y + 1 };
    const light = mixHex(PALETTE.rockLight, PALETTE.rock, 0.15 + 0.25 * p.tone);
    const shade = mixHex(PALETTE.rockDark, PALETTE.rock, 0.1 + 0.25 * p.tone);
    faces.push({ role: 'base', pts: [L, B, R, Sr, A, Sl], fill: shade });
    faces.push({ role: 'light', pts: [L, B, A, Sl], fill: light });
    faces.push({ role: 'shade', pts: [B, R, Sr, A], fill: shade });
    faces.push({
      role: 'cap',
      pts: [A, lerp(A, Sl, 0.6), lerp(A, B, 0.28)],
      fill: PALETTE.rockLight,
    });
  }
  return faces;
}

/** Höhe des höchsten Gipfels (Weltpixel). */
const mainHeight = (seed: number, variant: number): number =>
  Math.max(...peaksFor(seed, variant).map((p) => p.h));

/** Bildbox des Stempels (= `pointBounds` der Kachelmitte). */
export function rockBounds(item: RockItem): Box {
  return pointBounds(item.fp.x + 0.5, item.fp.y + 0.5, ROCK_H);
}

/** Schattenpolygon im Kachelraum, nach rechts unten (+3, +1); länger bei höherem Massiv. */
export function rockShadow(item: RockItem, seed: number): Pt[] {
  const len = 0.2 + (0.5 * mainHeight(seed, item.variant)) / ROCK_H;
  const mx = item.fp.x + 0.5 + DIR.x * (SHADOW_SHIFT + len / 2),
    my = item.fp.y + 0.5 + DIR.y * (SHADOW_SHIFT + len / 2);
  const a = 0.45 + len / 2,
    b = 0.32;
  const pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    const u = Math.cos(t) * a,
      v = Math.sin(t) * b;
    pts.push({ x: mx + DIR.x * u - DIR.y * v, y: my + DIR.y * u + DIR.x * v });
  }
  return pts;
}

/** Silhouetten (Bildschirmpixel) für die Verdeckung von Licht und Feuer: je Gipfel eine Gruppe. */
export function rockClips(cam: Camera, item: RockItem, seed: number): Pt[][] {
  const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
  return rockFaces(seed, item.variant)
    .filter((f) => f.role === 'base')
    .map((f) => f.pts.map((q) => worldToScreen(cam, { x: c.x + q.x, y: c.y + q.y })));
}

/** Zeichnet den Stempel einer Variante in Stempelpixeln (Faktor `step`); Ursprung = Rautenmitte unten in der Mitte. */
export function paintRock(
  ctx: CanvasRenderingContext2D,
  seed: number,
  variant: number,
  step: number,
): void {
  ctx.save();
  ctx.scale(step, step);
  ctx.translate(ISO_W / 2, ROCK_H);
  for (const f of rockFaces(seed, variant)) {
    ctx.fillStyle = f.fill;
    ctx.beginPath();
    f.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

let makeCanvas: () => HTMLCanvasElement | null = () =>
  typeof document === 'undefined' ? null : document.createElement('canvas');
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake (ohne `document` entsteht kein Stempel). */
export function setRockCanvasFactory(fn: () => HTMLCanvasElement | null): void {
  makeCanvas = fn;
}

/** Cache je Welt-Seed; höchstens ROCK_VARIANTS × ZOOM_STEPS.length Einträge (grösster: 128 × 122 px × 4 Byte). */
const cache = new Map<string, HTMLCanvasElement>();
let cacheSeed: number | null = null;
let cacheBytes = 0;
export const rockCacheSize = (): number => cache.size;
export const rockCacheBytes = (): number => cacheBytes;
export function resetRockCache(): void {
  cache.clear();
  cacheSeed = null;
  cacheBytes = 0;
}

function stampFor(seed: number, variant: number, step: number): HTMLCanvasElement | null {
  if (cacheSeed !== seed) {
    cache.clear();
    cacheBytes = 0;
    cacheSeed = seed;
  }
  const key = `${variant}|${step}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = makeCanvas();
  if (!canvas) return null;
  canvas.width = Math.ceil(ISO_W * step);
  canvas.height = Math.ceil(STAMP_H * step);
  const c = canvas.getContext('2d');
  if (!c) return null;
  paintRock(c, seed, variant, step);
  if (cache.size < ROCK_VARIANTS * ZOOM_STEPS.length) {
    cache.set(key, canvas);
    cacheBytes += canvas.width * canvas.height * 4;
  }
  return canvas;
}

/** Zeichnet den Stempel an der Kachelmitte; Zoom-Cache auf `ZOOM_STEPS`, Zielgrösse Faktor `z / zoomStep(z)`. */
export function drawRockStamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  item: RockItem,
  seed: number,
): void {
  const z = cam.zoom,
    step = zoomStep(z);
  const stamp = stampFor(seed, item.variant % ROCK_VARIANTS, step);
  if (!stamp) return;
  const f = z / step;
  const p = worldToScreen(cam, project(item.fp.x + 0.5, item.fp.y + 0.5));
  ctx.drawImage(stamp, p.x - (ISO_W / 2) * z, p.y - ROCK_H * z, stamp.width * f, stamp.height * f);
}

/** Stabile Rangzahl eines Felsens aus (Seed, Kachel); unabhängig von Ausschnitt und Listenposition. */
const rockPriority = (seed: number, it: { fp: { x: number; y: number } }): number =>
  hash2(seed + 73, it.fp.x, it.fp.y);

/**
 * Begrenzt die Felsen eines Frames auf `max`: behalten werden die mit der kleinsten Rangzahl aus (Seed, Kachel). Die
 * Wahl hängt nicht von der Kamera ab, ein Fels bleibt beim Scrollen gewählt, solange er im Bild ist und nicht mehr
 * Felsen mit kleinerer Rangzahl dazukommen als Platz ist. Andere Arten und die Reihenfolge bleiben; unter dem Limit
 * unverändert.
 */
export function thinRocks<T extends { kind: string; fp: { x: number; y: number } }>(
  items: readonly T[],
  max: number,
  seed: number,
): readonly T[] {
  const ranks: number[] = [];
  for (const it of items) if (it.kind === 'rock') ranks.push(rockPriority(seed, it));
  if (ranks.length <= max) return items;
  const keep = Math.max(0, max);
  const cut = keep === 0 ? -1 : ranks.sort((a, b) => a - b)[keep - 1]!;
  let left = keep;
  return items.filter((it) => {
    if (it.kind !== 'rock') return true;
    if (left > 0 && rockPriority(seed, it) <= cut) {
      left--;
      return true;
    }
    return false;
  });
}
