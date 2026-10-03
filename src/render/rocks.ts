import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import {
  ISO_H,
  ISO_W,
  ROCK_SHAPES,
  ROCK_VARIANTS,
  ZOOM_STEPS,
  rockVariant,
  project,
  zoomStep,
  type Box,
  type Pt,
  type SortedItem,
} from './iso';
import { PALETTE, mixHex } from './palette';

// rocks.ts — Felsmassive als aufrechte Stempel über Gebirgskacheln (G3, ADR-012). Reine Darstellung: Gestalt, Grösse
// und Farbe sind Funktionen von (world.seed, x, y); die Sim kennt keine Höhe. Ein Stempel steht je 2×2-Block auf der
// vordersten freien Gebirgskachel, ist bis zwei Kacheln breit (`ROCK_W`) und überragt die Kachel höchstens bis H_MAX
// (< `H_MAX`); sortiert wird mit dem 1×1-Footprint der Ankerkachel (ISO §10).
export { ROCK_SHAPES, ROCK_VARIANTS, rockVariant };
export type RockItem = Extract<SortedItem, { kind: 'rock' }>;
/** Rolle einer Fläche: Sockelsilhouette, Lichtseite (links), Schattenseite (rechts), Sockelband, Felsband, Lichtkappe. */
export type FaceRole = 'base' | 'light' | 'shade' | 'foot' | 'band' | 'cap';
export interface RockFace {
  role: FaceRole;
  /** Punkte relativ zur Rautenmitte der Ankerkachel, Weltpixel bei Zoom 1 (y nach unten). */
  pts: Pt[];
  fill: string;
}

/** Stempelbreite (Weltpixel): zwei Kachelbreiten. */
export const ROCK_W = 2 * ISO_W;
/** Stempelhöhe über der Rautenmitte (Weltpixel), unter H_MAX. */
export const ROCK_H = 1.4 * ISO_H;
const STAMP_H = ROCK_H + ISO_H / 2;
const TOP_MARGIN = 6; // Abstand der höchsten Spitze zur Stempeloberkante
const SHADOW_SHIFT = 0.12; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };

interface Peak {
  px: number;
  py: number;
  w: number;
  rf: number; // Breite der rechten Flanke im Verhältnis zur linken
  top: number; // Spitze über der Rautenmitte
  skew: number;
  bx: number;
  tone: number;
}
/** Gipfel eines Massivs: Hauptgipfel plus 1–2 Nebengipfel (0,4–0,68 und 0,35–0,55 der Hauptgipfelhöhe), hinten zuerst. */
function peaksFor(seed: number, variant: number): Peak[] {
  const shape = variant % ROCK_SHAPES,
    small = variant >= ROCK_SHAPES;
  const rnd = (k: number, j: number) => hash2(seed + 72, shape * 13 + j, k);
  const sx = small ? 0.5 : 1,
    sh = small ? 0.6 : 1;
  const half = (ROCK_W / 2 - 2) * (small ? 0.55 : 1); // Platz nach links/rechts
  const usable = ROCK_H - TOP_MARGIN;
  const n = small ? 2 : 2 + Math.floor(rnd(0, 0) * 2);
  const topMain = usable * sh * (0.85 + 0.15 * rnd(1, 0));
  const side = rnd(2, 0) < 0.5 ? -1 : 1;
  const out: Peak[] = [];
  for (let i = 0; i < n; i++) {
    const main = i === 0;
    const frac = main ? 1 : i === 1 ? 0.4 + 0.28 * rnd(3, i) : 0.35 + 0.2 * rnd(3, i);
    const w = (main ? 38 + 8 * rnd(4, i) : 24 + 10 * rnd(4, i)) * sx;
    const rf = rnd(5, i) < 0.5 ? 0.55 + 0.15 * rnd(6, i) : 1.25 + 0.15 * rnd(6, i);
    let px = main
      ? (rnd(7, i) - 0.5) * 16 * sx
      : out[0]!.px + (i === 1 ? side : -side) * (out[0]!.w * 0.8 + w * 0.55 + 6 * rnd(7, i));
    // innerhalb der Stempelbreite halten
    px = Math.min(px, half - w * Math.max(1, rf));
    px = Math.max(px, -half + w);
    out.push({
      px,
      py: (main ? -2 : -4) + (main ? 4 : 8) * rnd(8, i) * sh,
      w,
      rf,
      top: topMain * frac,
      skew: (rnd(9, i) - 0.5) * 0.5 * w,
      bx: (rf < 1 ? 1 : -1) * (0.08 + 0.17 * rnd(10, i)) * w, // Grat verstärkt die Schieflage
      tone: rnd(11, i),
    });
  }
  return out.sort((a, b) => a.py - b.py); // hinten zuerst
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const off = (p: Pt, dx: number, dy: number): Pt => ({ x: p.x + dx, y: p.y + dy });

/** Flächen eines Massivs, hinten zuerst, in Zeichenreihenfolge (Sockel, Licht, Schatten, Sockelband, Felsband, Kappe). */
export function rockFaces(seed: number, variant: number): RockFace[] {
  const faces: RockFace[] = [];
  for (const p of peaksFor(seed, variant)) {
    const A = { x: p.px + p.skew, y: -p.top };
    const L = { x: p.px - p.w, y: p.py },
      R = { x: p.px + p.w * p.rf, y: p.py },
      B = { x: p.px + p.bx, y: Math.min(p.py + p.w * 0.45, ISO_H / 2 - 1) };
    // Kerben und Absätze in den Flanken (links stärker gezackt als rechts)
    const S1 = off(lerp(A, L, 0.4), -3, -1),
      S2 = off(lerp(A, L, 0.72), 3, 0);
    const T1 = off(lerp(A, R, 0.45), 2, 0),
      T2 = off(lerp(A, R, 0.75), -2.5, 1);
    const light = mixHex(PALETTE.rockLight, PALETTE.rock, 0.15 + 0.25 * p.tone);
    const shade = mixHex(PALETTE.rockDark, PALETTE.rock, 0.1 + 0.25 * p.tone);
    faces.push({ role: 'base', pts: [L, B, R, T2, T1, A, S1, S2], fill: shade });
    faces.push({ role: 'light', pts: [L, B, A, S1, S2], fill: light });
    faces.push({ role: 'shade', pts: [B, R, T2, T1, A], fill: shade });
    faces.push({
      role: 'foot',
      pts: [L, B, R, lerp(R, A, 0.16), lerp(B, A, 0.14), lerp(L, A, 0.16)],
      fill: mixHex(PALETTE.rockDark, PALETTE.rock, 0.2),
    });
    faces.push({
      role: 'band',
      pts: [lerp(B, A, 0.4), lerp(R, A, 0.42), lerp(R, A, 0.55), lerp(B, A, 0.52)],
      fill: mixHex(PALETTE.rockDark, PALETTE.rock, 0.05),
    });
    faces.push({
      role: 'cap',
      pts: [A, lerp(A, S1, 0.8), lerp(A, B, 0.3)],
      fill: PALETTE.rockLight,
    });
  }
  return faces;
}

/** Höhe des höchsten Gipfels (Weltpixel). */
const mainHeight = (seed: number, variant: number): number =>
  Math.max(...peaksFor(seed, variant).map((p) => p.top));

/** Bildbox des Stempels: `ROCK_W` breit, `ROCK_H` hoch über der Rautenmitte der Ankerkachel. */
export function rockBounds(item: RockItem): Box {
  const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
  return { x: c.x - ROCK_W / 2, y: c.y - ROCK_H, w: ROCK_W, h: ROCK_H + ISO_H / 2 };
}

/** Schattenpolygon im Kachelraum, nach rechts unten (+3, +1); länger bei höherem, breiter bei grossem Massiv. */
export function rockShadow(item: RockItem, seed: number): Pt[] {
  const len = 0.2 + (0.5 * mainHeight(seed, item.variant)) / ROCK_H;
  const mx = item.fp.x + 0.5 + DIR.x * (SHADOW_SHIFT + len / 2),
    my = item.fp.y + 0.5 + DIR.y * (SHADOW_SHIFT + len / 2);
  const a = 0.45 + len / 2,
    b = item.variant >= ROCK_SHAPES ? 0.32 : 0.55;
  const pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    const u = Math.cos(t) * a,
      v = Math.sin(t) * b;
    pts.push({ x: mx + DIR.x * u - DIR.y * v, y: my + DIR.y * u + DIR.x * v });
  }
  return pts;
}

const ROCK_MARGIN = 40; // Rand um die Bildbox für den Schatten nach rechts unten

/** Liegt die Bildbox des Stempels (samt Schattenrand) im Bild? Genauer als der Kachelbereich, der unten `H_TOWER` zugibt. */
export function rockOnScreen(
  cam: Pick<Camera, 'x' | 'y' | 'zoom'>,
  view: { w: number; h: number },
  item: RockItem,
): boolean {
  // Bildbox wie `rockBounds`, ohne Allokation (läuft je Fels und Frame)
  const cx = (item.fp.x - item.fp.y) * (ROCK_W / 2),
    cy = (item.fp.x + item.fp.y + 1) * (ISO_H / 2);
  const right = cam.x + view.w / cam.zoom,
    bottom = cam.y + view.h / cam.zoom;
  return (
    cx + ROCK_W / 2 >= cam.x - ROCK_MARGIN &&
    cx - ROCK_W / 2 <= right + ROCK_MARGIN &&
    cy + ISO_H / 2 >= cam.y - ROCK_MARGIN &&
    cy - ROCK_H <= bottom + ROCK_MARGIN
  );
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
  ctx.translate(ROCK_W / 2, ROCK_H);
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
  canvas.width = Math.ceil(ROCK_W * step);
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
  ctx.drawImage(stamp, p.x - (ROCK_W / 2) * z, p.y - ROCK_H * z, stamp.width * f, stamp.height * f);
}

/**
 * Stabile Rangzahl eines Felsens aus (Seed, Kachel); Randfelsen (Schattenseite offen) liegen vor allen Binnenfelsen,
 * damit die Silhouette des Massivs erhalten bleibt.
 */
const rockPriority = (
  seed: number,
  it: { fp: { x: number; y: number }; shadow?: boolean },
): number => hash2(seed + 73, it.fp.x, it.fp.y) + (it.shadow ? 0 : 1);

/** Letzte Wahl: exakt die Id-Folge des Vorframes (kein Hash, daher keine Kollision) und die behaltenen Ids. */
let memo: { seed: number; max: number; ids: number[]; keep: Set<number> } | null = null;

/**
 * Begrenzt die Felsen eines Frames auf `max`: behalten werden die mit der kleinsten Rangzahl. Die Wahl hängt nicht von
 * der Kamera ab, ein Fels bleibt beim Scrollen gewählt, solange er im Bild ist und nicht mehr Felsen mit kleinerer
 * Rangzahl dazukommen als Platz ist. Andere Arten und die Reihenfolge bleiben; unter dem Limit unverändert. Bei
 * gleichem Ausschnitt wie im Vorframe (Id-Folge gleich) wird die Wahl wiederverwendet.
 */
export function thinRocks<
  T extends { kind: string; id: number; fp: { x: number; y: number }; shadow?: boolean },
>(items: readonly T[], max: number, seed: number): readonly T[] {
  let n = 0;
  for (const it of items) if (it.kind === 'rock') n++;
  if (n <= max) return items;
  let same = memo !== null && memo.seed === seed && memo.max === max && memo.ids.length === n;
  if (same) {
    let i = 0;
    for (const it of items)
      if (it.kind === 'rock' && memo!.ids[i++] !== it.id) {
        same = false;
        break;
      }
  }
  if (!same) {
    const rocks = items.filter((it) => it.kind === 'rock');
    const ids = rocks.map((r) => r.id);
    rocks.sort((a, b) => rockPriority(seed, a) - rockPriority(seed, b));
    memo = {
      seed,
      max,
      ids,
      keep: new Set(rocks.slice(0, Math.max(0, max)).map((r) => r.id)),
    };
  }
  const keep = memo!.keep;
  return items.filter((it) => it.kind !== 'rock' || keep.has(it.id));
}
