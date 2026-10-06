import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import { DECOR_TONES } from './groundDecor';
import { ISO_H, ZOOM_STEPS, project, zoomStep, type Pt, type SortedItem } from './iso';
import { DECOR_CACHE_MAX_BYTES } from './limits';
import { LIGHT } from './light';
import { PALETTE, mixHex } from './palette';
import { crownGeom, paintCrown, type Crown } from './trees';
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
  // Mauerreste: Felstöne eine Stufe zum Gras hin gesenkt (weniger Kontrast), Moos und Gras am Fuss und oben
  ruinSide: mixHex(DECOR_TONES.rockMid, PALETTE.grass, 0.28),
  ruinShade: mixHex(DECOR_TONES.rockShade, PALETTE.grassDark, 0.3),
  ruinTop: mixHex(DECOR_TONES.rockLight, PALETTE.grass, 0.35),
} as const;

/** Feste Box des Stempel-Canvas relativ zur Rautenmitte (Weltpixel). */
export const STAMP_BOX = { x0: -40, y0: -46, x1: 40, y1: 20 } as const;
const VARIANTS = 4;

/** Gesamthöhe (Krone ohne Stamm) der Bäume in Weltpixeln: Solitär grösser als ein Waldbaum, Obstbaum kleiner. */
const CROWN_H = { solitaire: 27, orchard: 17 } as const;
/** Sichtbare Stammlänge unter der Krone. */
const TRUNK_H = 6;
const TREE_KIND = { solitaire: 0, orchard: 2 } as const; // Laub bzw. helle Krone (L1-Töne)

export interface TreeShape {
  crown: Crown;
  /** Zahl der Lappen der Krone. */
  lobes: number;
  /** Halbe Breite und Höhe der Krone und Mittelpunkt über dem Boden (Weltpixel). */
  hw: number;
  hh: number;
  cy: number;
}
const shapes = new Map<string, TreeShape>();
/**
 * Krone aus der Kronensprache von L1 (`crownGeom`/`paintCrown`): 5–6 überlappende runde Lappen, Höhe ≈ 0,7 × Breite
 * (Jungbaum-Flachheit), Formwert `s` so gewählt, dass es mindestens 5 Lappen gibt. Radius so, dass die Krone `CROWN_H` hoch ist.
 */
export function treeShape(kind: 'solitaire' | 'orchard', v: number): TreeShape {
  const key = `${kind}|${v}`;
  let t = shapes.get(key);
  if (t) return t;
  let s = 0,
    seen = -1;
  for (let i = 0; i < 400 && seen < v; i++) {
    s = (i + 0.5) / 400;
    if (crownGeom({ kind: TREE_KIND[kind], r: 0.3, s, bush: false, young: true }).lobes.length >= 5)
      seen += i % 3 === 0 ? 1 : 0;
  }
  const g0 = crownGeom({ kind: TREE_KIND[kind], r: 0.3, s, bush: false, young: true });
  const r = (0.3 * CROWN_H[kind]) / 2 / g0.hh;
  const g = crownGeom({ kind: TREE_KIND[kind], r, s, bush: false, young: true });
  const crown: Crown = {
    kind: TREE_KIND[kind],
    cx: 0.5,
    cy: 0.5,
    r,
    h: 0,
    bush: false,
    s,
    young: true,
  };
  t = { crown, lobes: g.lobes.length, hw: g.hw, hh: g.hh, cy: g.hh + TRUNK_H };
  shapes.set(key, t);
  return t;
}

/** Mauerreste: Blöcke (Kachelanteile relativ zur Mitte, Höhe in Weltpixeln), je Variante, ≤ 0,35 `ISO_H` hoch. */
export interface Block {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  h: number;
}
export const RUIN_H_MAX = 0.35 * ISO_H;
/** Gebrochene Mauerlinie: 4 ungleich hohe, ungleich lange Segmente mit Lücken (niedrig und lang, ≤ 0,35 `ISO_H`). */
export function ruinBlocks(variant: number): Block[] {
  const lens = [
    [0.2, 0.14, 0.22, 0.12],
    [0.14, 0.22, 0.12, 0.2],
    [0.22, 0.12, 0.2, 0.14],
    [0.12, 0.2, 0.14, 0.22],
  ][variant % VARIANTS]!;
  const hs = [
    [8, 5, 9, 4],
    [6, 9, 4, 7],
    [9, 6, 5, 8],
    [5, 8, 9, 6],
  ][variant % VARIANTS]!;
  const alongY = (variant & 2) !== 0;
  const t = 0.09; // Wanddicke in Kacheln
  const gap = 0.05;
  const total = lens.reduce((a, b) => a + b, 0) + gap * 3;
  let p = -total / 2;
  const out: Block[] = [];
  lens.forEach((l, i) => {
    const off = (i % 2 ? 0.035 : -0.03) - t / 2; // leicht versetzt: keine gerade Latte
    out.push(
      alongY
        ? { x0: off, y0: p, x1: off + t, y1: p + l, h: hs[i]! }
        : { x0: p, y0: off, x1: p + l, y1: off + t, h: hs[i]! },
    );
    p += l + gap;
  });
  return (variant & 1) === 1
    ? out.map((b) => ({ x0: -b.x1, y0: b.y0, x1: -b.x0, y1: b.y1, h: b.h })).reverse()
    : out;
}

/** Höhe des gezeichneten Stempels über dem Boden in Weltpixeln (aus der Formtabelle, ohne Rasterung). */
export function stampHeight(kind: StampKind, variant: number): number {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  if (kind === 'solitaire' || kind === 'orchard') {
    const t = treeShape(kind, v);
    return t.cy + t.hh;
  }
  if (kind === 'menhir') return MENHIR_H[v]!;
  return Math.max(...ruinBlocks(v).map((b) => b.h)) + 1.5; // plus Bewuchs oben
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

function paintTree(ctx: CanvasRenderingContext2D, kind: 'solitaire' | 'orchard', v: number): void {
  const t = treeShape(kind, v);
  const k = kind === 'solitaire' ? 1 : 0.7;
  // Stamm: kurz und kräftig, unten verbreitert, oben in der Krone verschwindend
  ctx.fillStyle = DECOR_STAMP_TONES.trunk;
  ctx.beginPath();
  ctx.moveTo(-4.2 * k, 0.5);
  ctx.quadraticCurveTo(-2.6 * k, -3, -2.8 * k, -t.cy);
  ctx.lineTo(2.8 * k, -t.cy);
  ctx.quadraticCurveTo(2.6 * k, -3, 4.2 * k, 0.5);
  ctx.closePath();
  ctx.fill();
  paintCrown(ctx, t.crown, 0, -t.cy);
  if (kind === 'orchard') {
    // Blütentupfen weiss und rosa auf der Krone: je Variante fest (Salz 552 als Konstante, kein Seed nötig)
    const n = 12 + (v % 2) * 3;
    for (let i = 0; i < n; i++) {
      const a = hash2(552, v * 64 + i, 1) * Math.PI * 2,
        r = Math.sqrt(hash2(552, v * 64 + i, 2));
      const x = Math.cos(a) * r * t.hw * 0.8,
        y = -t.cy + Math.sin(a) * r * t.hh * 0.7;
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
  const T = DECOR_STAMP_TONES;
  for (const b of blocks) {
    const A = project(b.x0, b.y0),
      B = project(b.x1, b.y0),
      C = project(b.x1, b.y1),
      D = project(b.x0, b.y1);
    const up = (p: Pt): Pt => ({ x: p.x, y: p.y - b.h });
    // Bewuchs am Fuss: Gras vor und neben der Mauer
    const f = project((b.x0 + b.x1) / 2, b.y1 + 0.03);
    ell(ctx, DECOR_TONES.tallDark, f.x, f.y, (C.x - D.x) / 2 + 3, 2);
    poly(ctx, T.ruinSide, [D, C, up(C), up(D)]); // Seite links unten (Licht)
    poly(ctx, T.ruinShade, [C, B, up(B), up(C)]); // Seite rechts unten (Schatten)
    poly(ctx, T.ruinTop, [up(A), up(B), up(C), up(D)]); // Oberkante
    // oben bewachsen: Gras- und Moosflecken über die Oberkante, einzelne Halme am Fuss
    const m = project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    ell(ctx, DECOR_TONES.tallDark, m.x, m.y - b.h, (B.x - A.x) / 2 + 1.5, 2.1);
    ell(ctx, DECOR_TONES.tallLight, m.x - 1, m.y - b.h - 0.8, (B.x - A.x) / 3, 1.2);
    ell(ctx, DECOR_TONES.tallLight, f.x - 2, f.y - 1.2, 2.6, 1.2);
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
/** Seed, für den der Cache gerade gefüllt ist (null: leer). */
export const decorCacheSeed = (): number | null => cacheSeed;
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
