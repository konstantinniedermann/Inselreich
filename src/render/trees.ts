import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import {
  ISO_H,
  ISO_W,
  TREE_VARIANTS,
  ZOOM_STEPS,
  pointBounds,
  project,
  zoomStep,
  type Box,
  type Pt,
  type SortedItem,
} from './iso';
import { PALETTE, mixHex } from './palette';

// trees.ts — aufrechte Baumstempel (ISO §6, D-08, D-12). Kronen liegen in der Spaltenbreite ihrer Kachel.
export type TreeItem = Extract<SortedItem, { kind: 'tree' }>;
/** Baumart: 0 Laubbaum, 1 Nadelbaum, 2 heller Laubbaum (R149). */
export type CrownKind = 0 | 1 | 2;
/** Eine Krone: Art, Lage in Kachel-Anteilen, Radius in Rautenbreiten, Höhe des Kronenmittelpunkts in Weltpixeln. */
export interface Crown {
  kind: CrownKind;
  cx: number;
  cy: number;
  r: number;
  h: number;
}

/** Stempelhöhe über der Rautenmitte (Weltpixel). */
export const TREE_H = 1.1 * ISO_H;
const STAMP_H = TREE_H + ISO_H / 2;
const CROWN_RY = 0.85; // Kronenhöhe im Verhältnis zur Breite
const TRUNK_COLOR = mixHex(PALETTE.rockDark, PALETTE.earth, 0.5);
/** Körper des Nadelbaums (R149). */
export const CONIFER_COLOR = mixHex(PALETTE.crown, PALETTE.rockDark, 0.35);
/** Körper des hellen Laubbaums (R149). */
export const LIGHT_CROWN_COLOR = mixHex(PALETTE.crown, PALETTE.grassLight, 0.45);
/** Stamm des hellen Laubbaums, heller als der Standardstamm (R149). */
export const LIGHT_TRUNK_COLOR = mixHex(PALETTE.wallLime, PALETTE.rockDark, 0.55);
const CONIFER_TOP = 1.6; // Spitze des Nadelbaums über dem Kronenmittelpunkt, in Kronenhöhen (ry)
const SHADOW_SHIFT = 0.19; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const SHADOW_A = 0.5,
  SHADOW_B = 0.3;
const DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };

/**
 * Feste Kronenplätze in Kachel-Anteilen (Ecken und Mitte der Raute). Bei Zoom 1 liegen die Plätze mindestens 6 px
 * auseinander, die Kronen sind klein genug, dass jede Lichtkappe sichtbar bleibt (Spec 5.3, I5).
 */
const SLOTS: readonly [number, number][] = [
  [0.72, 0.3], // rechts
  [0.3, 0.72], // links
  [0.3, 0.3], // hinten
  [0.72, 0.72], // vorn
  [0.5, 0.5], // Mitte
];

/** 3–5 Kronen je Variante auf verschiedenen Plätzen, deterministisch aus `hash2` (ISO §6). */
export function crownsFor(seed: number, variant: number): Crown[] {
  const n = 3 + Math.min(2, Math.floor(hash2(seed + 51, variant, 99) * 3));
  // Plätze nach Hashwert mischen; die Mitte kommt nur bei fünf Kronen dazu
  const order = SLOTS.slice(0, 4)
    .map((slot, i) => ({ slot, k: hash2(seed + 52, variant, i) }))
    .sort((p, q) => p.k - q.k)
    .map((e) => e.slot);
  if (n === 5) order.push(SLOTS[4]!);
  const out: Crown[] = [];
  for (let k = 0; k < n; k++) {
    const rnd = (j: number) => hash2(seed + 51, variant, k * 4 + j);
    const [sx, sy] = order[k]!;
    const cx = sx + (rnd(0) - 0.5) * 0.05,
      cy = sy + (rnd(1) - 0.5) * 0.05;
    const kr = hash2(seed + 68, variant, k); // Art je Krone (R149): 50 % Laub, 28 % Nadel, 22 % hell
    const kind: CrownKind = kr < 0.5 ? 0 : kr < 0.78 ? 1 : 2;
    const r = 0.08 + 0.07 * rnd(2);
    const ground = ((cx + cy - 1) * ISO_H) / 2; // Bild-y des Fusspunkts relativ zur Rautenmitte
    const top = kind === 1 ? CONIFER_TOP : 1; // Spitze steht höher als die Kuppe
    const hWanted = (0.26 + 0.14 * rnd(3) + (kind === 1 ? 0.06 : 0)) * ISO_H;
    const h = Math.min(hWanted, TREE_H - top * CROWN_RY * r * ISO_W + ground - 0.5);
    out.push({ kind, cx, cy, r, h });
  }
  return out;
}

/** Bildbox des Stempels (= `pointBounds` der Kachelmitte). */
export function treeBounds(item: TreeItem): Box {
  return pointBounds(item.fp.x + 0.5, item.fp.y + 0.5, TREE_H);
}

/** Schattenpolygon im Kachelraum, nach rechts unten (+3, +1) versetzt; der Schattendurchgang zeichnet es (R1b). */
export function treeShadow(item: TreeItem): Pt[] {
  const mx = item.fp.x + 0.5 + DIR.x * SHADOW_SHIFT,
    my = item.fp.y + 0.5 + DIR.y * SHADOW_SHIFT;
  const pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const u = Math.cos(a) * SHADOW_A,
      v = Math.sin(a) * SHADOW_B;
    pts.push({ x: mx + DIR.x * u - DIR.y * v, y: my + DIR.y * u + DIR.x * v });
  }
  return pts;
}

/** Zeichnet den Stempel einer Variante in Stempelpixeln (Faktor `step`); Ursprung = Rautenmitte unten in der Mitte. */
export function paintStamp(
  ctx: CanvasRenderingContext2D,
  seed: number,
  variant: number,
  step: number,
): void {
  const crowns = crownsFor(seed, variant)
    .map((c) => ({
      c,
      x: (c.cx - c.cy) * (ISO_W / 2),
      y: ((c.cx + c.cy - 1) * ISO_H) / 2,
    }))
    .sort((a, b) => a.y - b.y); // hinten zuerst
  ctx.save();
  ctx.scale(step, step);
  ctx.translate(ISO_W / 2, TREE_H);
  for (const { c, x, y } of crowns) {
    const rx = c.r * ISO_W,
      ry = rx * CROWN_RY,
      cyc = y - c.h;
    ctx.fillStyle = c.kind === 2 ? LIGHT_TRUNK_COLOR : TRUNK_COLOR;
    ctx.beginPath();
    ctx.rect(x - 1.5, cyc, 3, c.h);
    ctx.fill();
    if (c.kind === 1) {
      // Nadelbaum: zwei Dreiecksstufen, die obere trägt die Lichtkappe
      ctx.fillStyle = CONIFER_COLOR;
      ctx.beginPath();
      ctx.moveTo(x, cyc - 0.4 * ry);
      ctx.lineTo(x + rx, cyc + 0.9 * ry);
      ctx.lineTo(x - rx, cyc + 0.9 * ry);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, cyc - CONIFER_TOP * ry);
      ctx.lineTo(x + 0.75 * rx, cyc + 0.25 * ry);
      ctx.lineTo(x - 0.75 * rx, cyc + 0.25 * ry);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.crownLight;
      ctx.beginPath();
      ctx.moveTo(x - 0.05 * rx, cyc - (CONIFER_TOP - 0.1) * ry);
      ctx.lineTo(x - 0.05 * rx, cyc + 0.1 * ry);
      ctx.lineTo(x - 0.7 * rx, cyc + 0.1 * ry);
      ctx.closePath();
      ctx.fill();
      continue;
    }
    ctx.fillStyle = c.kind === 2 ? LIGHT_CROWN_COLOR : PALETTE.crown;
    ctx.beginPath();
    ctx.ellipse(x, cyc, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.crownLight;
    ctx.beginPath();
    ctx.ellipse(x - 0.28 * rx, cyc - 0.3 * ry, 0.55 * rx, 0.5 * ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

let makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas');
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake. */
export function setCanvasFactory(fn: () => HTMLCanvasElement): void {
  makeCanvas = fn;
}

/** Cache je Welt-Seed (neue Welt → neuer Cache); höchstens TREE_VARIANTS × ZOOM_STEPS.length Einträge. */
const cache = new Map<string, HTMLCanvasElement>();
let cacheSeed: number | null = null;
export const treeCacheSize = (): number => cache.size;
export function resetTreeCache(): void {
  cache.clear();
  cacheSeed = null;
}

function stampFor(seed: number, variant: number, step: number): HTMLCanvasElement | null {
  if (cacheSeed !== seed) {
    cache.clear();
    cacheSeed = seed;
  }
  const key = `${variant}|${step}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = makeCanvas();
  canvas.width = Math.ceil(ISO_W * step);
  canvas.height = Math.ceil(STAMP_H * step);
  const c = canvas.getContext('2d');
  if (!c) return null;
  paintStamp(c, seed, variant, step);
  if (cache.size < TREE_VARIANTS * ZOOM_STEPS.length) cache.set(key, canvas);
  return canvas;
}

/** Zeichnet den Stempel an der Kachelmitte; Zoom-Cache auf `ZOOM_STEPS`, Zielgrösse Faktor `z / zoomStep(z)`. */
export function drawTreeStamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  item: TreeItem,
  seed: number,
): void {
  const z = cam.zoom,
    step = zoomStep(z);
  const stamp = stampFor(seed, item.variant % TREE_VARIANTS, step);
  if (!stamp) return;
  const f = z / step;
  const p = worldToScreen(cam, project(item.fp.x + 0.5, item.fp.y + 0.5));
  ctx.drawImage(stamp, p.x - (ISO_W / 2) * z, p.y - TREE_H * z, stamp.width * f, stamp.height * f);
}
