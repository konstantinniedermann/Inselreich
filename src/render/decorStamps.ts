import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import { DECOR_TONES } from './groundDecor';
import { ISO_H, ZOOM_STEPS, project, zoomStep, type Pt, type SortedItem } from './iso';
import { DECOR_CACHE_MAX_BYTES } from './limits';
import { LIGHT } from './light';
import { PALETTE, mixHex } from './palette';
import { crownBase, crownCap, crownShade } from './trees';
import type { StampKind } from './decor';

// decorStamps.ts — Zeichner und Cache der Deko-Stempel (ART-STIL-02 L4): A5 Solitärbaum, A6 Obstbaum, A9 Menhir, A14
// Mauerreste. Die Platzierung kommt aus `decor.ts`; hier stehen Formen, Schatten, Zoomschwellen und der Stempel-Cache.
// Kein Zufall ausser `hash2`. Gezeichnet wird in Weltpixeln mit dem Ursprung in der Rautenmitte der Kachel (Boden y = 0,
// nach oben negativ), der Cache hält je (Art, Variante, Zoomstufe) eine feste Box.

export type DecorItem = Extract<SortedItem, { kind: 'decor' }>;

/** Zoomschwellen nach Katalog: A5/A6 ab 0,5, A9/A14 ab 0,75. */
export const DECOR_MIN_ZOOM: Record<StampKind, number> = {
  solitaire: 0.5,
  orchard: 0.5,
  menhir: 0.75,
  ruin: 0.75,
};

/** Töne der Stempel (Mischungen aus `palette.ts`); Test: ΔE2000 ≥ 20 zu den Signalfarben. */
export const DECOR_STAMP_TONES = {
  trunk: mixHex(PALETTE.rockDark, PALETTE.earth, 0.5),
  orchardCrown: mixHex(PALETTE.crown, PALETTE.grassLight, 0.3),
  blossomWhite: PALETTE.wallLime,
  blossomPink: mixHex(PALETTE.wallLime, PALETTE.roofTerracotta, 0.28),
} as const;

/** Feste Box des Stempel-Canvas relativ zur Rautenmitte (Weltpixel). */
export const STAMP_BOX = { x0: -40, y0: -46, x1: 40, y1: 20 } as const;
const VARIANTS = 4;

interface Lobe {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
/** Kronenlappen des Solitärbaums: breiter als hoch; Spitze bei −34 (≤ `TREE_H` = 35,2). */
const SOLITAIRE_LOBES: readonly Lobe[] = [
  { x: 0, y: -21, rx: 22, ry: 12 },
  { x: -14, y: -18, rx: 13, ry: 9 },
  { x: 14, y: -18, rx: 13, ry: 9 },
  { x: -5, y: -26, rx: 12, ry: 8 },
  { x: 8, y: -25, rx: 10, ry: 7 },
];
const SOLITAIRE_SCALE = [1, 0.92, 0.97, 0.88] as const;
const ORCHARD_SCALE = [0.62, 0.56, 0.6, 0.52] as const;
/** Mauerreste: Blöcke (Kachelanteile relativ zur Mitte, Höhe in Weltpixeln), je Variante, ≤ 0,35 `ISO_H` hoch. */
interface Block {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  h: number;
}
export const RUIN_H_MAX = 0.35 * ISO_H;
function ruinBlocks(variant: number): Block[] {
  const mirror = variant & 1,
    flip = variant & 2;
  const hs = [
    [11, 7, 9, 10, 5, 8],
    [9, 11, 6, 7, 10, 5],
    [8, 10, 11, 9, 6, 10],
    [10, 6, 8, 11, 9, 7],
  ][variant % VARIANTS]!;
  const out: Block[] = [];
  const t = 0.1; // Wanddicke in Kacheln
  for (let i = 0; i < 3; i++) {
    // Schenkel entlang x: drei Blöcke, dazwischen Lücken (gebrochen)
    const x0 = -0.32 + i * 0.2;
    out.push({ x0, y0: -0.3, x1: x0 + 0.17, y1: -0.3 + t, h: hs[i]! });
    // Schenkel entlang y
    const y0 = -0.2 + i * 0.14;
    out.push({ x0: -0.32, y0, x1: -0.32 + t, y1: y0 + 0.12, h: hs[3 + i]! });
  }
  return out.map((b) => {
    let { x0, y0, x1, y1 } = b;
    if (mirror) [x0, x1] = [-x1, -x0];
    if (flip) [y0, y1] = [-y1, -y0];
    return { x0, y0, x1, y1, h: b.h };
  });
}

/** Höhe des gezeichneten Stempels über dem Boden in Weltpixeln (aus der Formtabelle, ohne Rasterung). */
export function stampHeight(kind: StampKind, variant: number): number {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  if (kind === 'solitaire' || kind === 'orchard') {
    const s = kind === 'solitaire' ? SOLITAIRE_SCALE[v]! : ORCHARD_SCALE[v]!;
    return Math.max(...SOLITAIRE_LOBES.map((l) => -(l.y - l.ry))) * s;
  }
  if (kind === 'menhir') return MENHIR_H[v]!;
  return Math.max(...ruinBlocks(v).map((b) => b.h));
}
const MENHIR_H = [21, 19, 22, 20] as const;
const MENHIR_W = 10;

// ---------- Schatten (gemeinsamer Schattenpfad, Kachelraum) ----------

const SHADOW_SHIFT = 0.19;
const DIR = { x: -LIGHT.x, y: -LIGHT.y };
const SHADOW_UNIT = (k: number): Pt[] =>
  Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const u = Math.cos(a) * 0.5 * k,
      v = Math.sin(a) * 0.3 * k;
    return { x: DIR.x * u - DIR.y * v, y: DIR.y * u + DIR.x * v };
  });
const SHADOWS: Partial<Record<StampKind, readonly Pt[]>> = {
  solitaire: SHADOW_UNIT(0.62),
  orchard: SHADOW_UNIT(0.4),
};
/** Schattenpolygon im Kachelraum für A5/A6 (Boden-Fleck unter der Krone); Menhir und Mauerreste werfen keinen. */
export function decorShadow(item: DecorItem): Pt[] | null {
  const unit = SHADOWS[item.stamp];
  if (!unit) return null;
  const mx = item.fp.x + 0.5 + DIR.x * SHADOW_SHIFT,
    my = item.fp.y + 0.5 + DIR.y * SHADOW_SHIFT;
  return unit.map((u) => ({ x: mx + u.x, y: my + u.y }));
}

// ---------- Zeichnen ----------

const LIGHT_PX = (() => {
  const p = project(-LIGHT.x, -LIGHT.y);
  const n = Math.hypot(p.x, p.y);
  return { x: -p.x / n, y: -p.y / n };
})();

function ell(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function poly(ctx: CanvasRenderingContext2D, color: string, pts: readonly Pt[]): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}

function paintCrownLobes(
  ctx: CanvasRenderingContext2D,
  base: string,
  s: number,
  mirror: boolean,
): void {
  const lobes = SOLITAIRE_LOBES.map((l) => ({
    x: (mirror ? -l.x : l.x) * s,
    y: l.y * s,
    rx: l.rx * s,
    ry: l.ry * s,
  })).sort((a, b) => a.y - b.y);
  for (const l of lobes) ell(ctx, crownShade(base), l.x, l.y, l.rx, l.ry);
  for (const l of lobes)
    ell(
      ctx,
      base,
      l.x + LIGHT_PX.x * 0.14 * l.rx,
      l.y + LIGHT_PX.y * 0.14 * l.ry,
      0.9 * l.rx,
      0.9 * l.ry,
    );
  for (const l of [...lobes]
    .sort((a, b) => b.x * LIGHT_PX.x + b.y * LIGHT_PX.y - (a.x * LIGHT_PX.x + a.y * LIGHT_PX.y))
    .slice(0, 2))
    ell(
      ctx,
      crownCap(base),
      l.x + LIGHT_PX.x * 0.54 * l.rx,
      l.y + LIGHT_PX.y * 0.54 * l.ry,
      0.55 * l.rx,
      0.5 * l.ry,
    );
}

function paintTree(ctx: CanvasRenderingContext2D, kind: 'solitaire' | 'orchard', v: number): void {
  const s = kind === 'solitaire' ? SOLITAIRE_SCALE[v]! : ORCHARD_SCALE[v]!;
  const mirror = (v & 1) === 1;
  // Stamm
  const th = (kind === 'solitaire' ? 15 : 10) * (kind === 'solitaire' ? 1 : 0.9);
  ctx.fillStyle = DECOR_STAMP_TONES.trunk;
  ctx.beginPath();
  ctx.moveTo(-2.6 * s - 1, 0);
  ctx.lineTo(-1.8 * s - 0.5, -th);
  ctx.lineTo(1.8 * s + 0.5, -th);
  ctx.lineTo(2.6 * s + 1, 0);
  ctx.closePath();
  ctx.fill();
  const base = kind === 'solitaire' ? crownBase(0) : DECOR_STAMP_TONES.orchardCrown;
  paintCrownLobes(ctx, base, s, mirror);
  if (kind === 'orchard') {
    // Blütentupfen weiss und rosa auf der Krone: je Variante fest (Salz 552 als Konstante, kein Seed nötig)
    const n = 12 + (v % 2) * 3;
    for (let i = 0; i < n; i++) {
      const a = hash2(552, v * 64 + i, 1) * Math.PI * 2,
        r = Math.sqrt(hash2(552, v * 64 + i, 2));
      const x = Math.cos(a) * r * 22 * s * (mirror ? -1 : 1),
        y = -21 * s + Math.sin(a) * r * 10 * s;
      ctx.fillStyle =
        hash2(552, v * 64 + i, 3) < 0.55
          ? DECOR_STAMP_TONES.blossomWhite
          : DECOR_STAMP_TONES.blossomPink;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
}

function paintMenhir(ctx: CanvasRenderingContext2D, v: number): void {
  const h = MENHIR_H[v]!,
    w = MENHIR_W / 2,
    lean = (v - 1.5) * 0.9;
  const pts: Pt[] = [
    { x: -w, y: 0 },
    { x: w, y: 0 },
    { x: w - 1 + lean, y: -h * 0.65 },
    { x: 2 + lean, y: -h },
    { x: -2.5 + lean, y: -h + 1.2 },
    { x: -w + 1 + lean, y: -h * 0.6 },
  ];
  poly(ctx, DECOR_TONES.rockMid, pts);
  // Lichtseite links, Schattenseite rechts (Licht aus `LIGHT`, links oben)
  poly(ctx, DECOR_TONES.rockLight, [
    pts[0]!,
    pts[5]!,
    pts[4]!,
    { x: -0.5 + lean, y: -h * 0.5 },
    { x: -1, y: 0 },
  ]);
  poly(ctx, DECOR_TONES.rockShade, [
    pts[1]!,
    { x: 1.2, y: 0 },
    { x: 1 + lean, y: -h * 0.55 },
    pts[3]!,
    pts[2]!,
  ]);
  ctx.strokeStyle = DECOR_TONES.rockDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}

function paintRuin(ctx: CanvasRenderingContext2D, v: number): void {
  // Blöcke hinten zuerst (x + y aufsteigend)
  const blocks = ruinBlocks(v).sort((a, b) => a.x0 + a.y0 - (b.x0 + b.y0));
  for (const b of blocks) {
    const A = project(b.x0, b.y0),
      B = project(b.x1, b.y0),
      C = project(b.x1, b.y1),
      D = project(b.x0, b.y1);
    const up = (p: Pt): Pt => ({ x: p.x, y: p.y - b.h });
    poly(ctx, DECOR_TONES.rockMid, [D, C, up(C), up(D)]); // Seite links unten (Licht)
    poly(ctx, DECOR_TONES.rockShade, [C, B, up(B), up(C)]); // Seite rechts unten (Schatten)
    poly(ctx, DECOR_TONES.rockLight, [up(A), up(B), up(C), up(D)]); // Oberkante
    // oben bewachsen: kleine Gras- und Moosflecken
    const m = project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    ell(ctx, DECOR_TONES.tallDark, m.x, m.y - b.h, 3.2, 1.6);
    ell(ctx, DECOR_TONES.tallLight, m.x - 1, m.y - b.h - 0.6, 1.8, 0.9);
  }
}

/** Malt einen Stempel mit dem Ursprung (`ox`, `oy`) in Zielpixeln und dem Faktor `scale`. */
export function paintDecorStamp(
  ctx: CanvasRenderingContext2D,
  kind: StampKind,
  variant: number,
  scale: number,
  ox: number,
  oy: number,
): void {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  if (kind === 'solitaire' || kind === 'orchard') paintTree(ctx, kind, v);
  else if (kind === 'menhir') paintMenhir(ctx, v);
  else paintRuin(ctx, v);
  ctx.restore();
}

// ---------- Cache (LRU über Bytes) ----------

let makeCanvas: (() => HTMLCanvasElement) | null = null;
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake (ohne Fabrik und DOM zeichnet `drawDecorStamp` nichts). */
export function setDecorCanvasFactory(fn: (() => HTMLCanvasElement) | null): void {
  makeCanvas = fn;
}

interface Entry {
  canvas: HTMLCanvasElement;
  bytes: number;
}
/** Älteste zuerst: eine `Map` merkt die Einfügereihenfolge, ein Treffer wird ans Ende geschoben. */
const cache = new Map<string, Entry>();
let cacheBytes = 0;
let cacheSeed: number | null = null;
let clears = 0;

export const decorCacheSize = (): number => cache.size;
export const decorCacheBytes = (): number => cacheBytes;
/** Wie oft der Cache wegen eines Seed-Wechsels (`cacheSeed`) geleert wurde (Dev-Zähler, Test L4-T1). */
export const decorCacheClears = (): number => clears;
export function resetDecorCache(): void {
  cache.clear();
  cacheBytes = 0;
  cacheSeed = null;
  clears = 0;
}
/** Schlüssel der Einträge in Reihenfolge ältester zuerst (Test L4-T4). */
export const decorCacheKeys = (): string[] => [...cache.keys()];

/** Stempel-Canvas für (Art, Variante, Zoomstufe); `max` überschreibt die Bytegrenze (Test). */
export function decorStampFor(
  seed: number,
  kind: StampKind,
  variant: number,
  step: number,
  max = DECOR_CACHE_MAX_BYTES,
): HTMLCanvasElement | null {
  if (cacheSeed !== seed) {
    if (cacheSeed !== null) clears++;
    cache.clear();
    cacheBytes = 0;
    cacheSeed = seed;
  }
  const key = `${kind}|${variant}|${ZOOM_STEPS.indexOf(step as (typeof ZOOM_STEPS)[number])}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.canvas;
  }
  // ohne Fabrik und ohne DOM (Node-Tests) gibt es keine Stempel: dann wird nichts gezeichnet
  if (!makeCanvas && typeof document === 'undefined') return null;
  const canvas = makeCanvas ? makeCanvas() : document.createElement('canvas');
  canvas.width = Math.ceil((STAMP_BOX.x1 - STAMP_BOX.x0) * step);
  canvas.height = Math.ceil((STAMP_BOX.y1 - STAMP_BOX.y0) * step);
  const c = canvas.getContext('2d');
  if (!c) return null;
  paintDecorStamp(c, kind, variant, step, -STAMP_BOX.x0 * step, -STAMP_BOX.y0 * step);
  const bytes = canvas.width * canvas.height * 4;
  if (bytes <= max) {
    for (const [k, e] of cache) {
      if (cacheBytes + bytes <= max) break;
      cache.delete(k);
      cacheBytes -= e.bytes;
    }
    cache.set(key, { canvas, bytes });
    cacheBytes += bytes;
  }
  return canvas;
}

/**
 * Zeichnet einen Deko-Stempel an der Kachelmitte; unter der Zoomschwelle der Art nichts (Katalog). Zoom-Cache auf
 * `ZOOM_STEPS`, Zielgrösse Faktor `z / zoomStep(z)`; gefüllt wird nur, was gezeichnet wird.
 */
export function drawDecorStamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  item: DecorItem,
  seed: number,
): void {
  const z = cam.zoom;
  if (z < DECOR_MIN_ZOOM[item.stamp]) return;
  const step = zoomStep(z);
  const stamp = decorStampFor(seed, item.stamp, item.variant, step);
  if (!stamp) return;
  const p = worldToScreen(cam, project(item.fp.x + 0.5, item.fp.y + 0.5));
  const f = z / step;
  ctx.drawImage(
    stamp,
    p.x + STAMP_BOX.x0 * z,
    p.y + STAMP_BOX.y0 * z,
    stamp.width * f,
    stamp.height * f,
  );
}
