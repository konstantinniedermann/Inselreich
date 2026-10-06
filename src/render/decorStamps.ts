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
// Mauerreste; L5: D1 Palme, E1 Wrack, E3 Meeresfels (und Felsnadel), E8 Felseiland. Die Platzierung kommt aus `decor.ts`; hier stehen Formen, Schatten, Zoomschwellen und der Stempel-Cache.
// Kein Zufall ausser `hash2`. Gezeichnet wird in Weltpixeln mit dem Ursprung in der Rautenmitte der Kachel (Boden y = 0,
// nach oben negativ), der Cache hält je (Art, Variante, Zoomstufe) eine feste Box.

export type DecorItem = Extract<SortedItem, { kind: 'decor' }>;

/** Zoomschwellen nach Katalog: A5/A6 ab 0,5, A9/A14 ab 0,75. */
export const DECOR_MIN_ZOOM: Record<StampKind, number> = {
  solitaire: 0.5,
  orchard: 0.5,
  menhir: 0.75,
  ruin: 0.75,
  palm: 0.5,
  wreck: 0.25,
  seaRock: 0.25,
  islet: 0.25,
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
  // Palme (D1): gelbstichiger als Laub und Nadel (crown/crownLight mit grassLight und etwas Stroh), Stamm aus Holz und Erde
  palmFrond: mixHex(mixHex(PALETTE.crownLight, PALETTE.grassLight, 0.6), PALETTE.roofThatch, 0.15),
  palmFrondLit: mixHex(PALETTE.grassLight, PALETTE.roofThatch, 0.22),
  palmFrondShade: mixHex(mixHex(PALETTE.crown, PALETTE.crownLight, 0.4), PALETTE.grassDark, 0.25),
  palmLine: mixHex(PALETTE.crown, PALETTE.rockDark, 0.45),
  palmTrunk: mixHex(PALETTE.roofWood, PALETTE.earth, 0.5),
  palmTrunkShade: mixHex(PALETTE.roofTimber, PALETTE.earthEdge, 0.5),
  palmShadow: mixHex(PALETTE.rockDark, PALETTE.sandWet, 0.3),
  palmNut: mixHex(PALETTE.roofTimber, PALETTE.rockDark, 0.4),
  // Wrack (E1): entsättigtes Holz (mit rockDark und waterMid), unten ins Wasser getaucht
  wreckWood: mixHex(mixHex(PALETTE.roofWood, PALETTE.rockDark, 0.5), PALETTE.waterMid, 0.18),
  wreckLit: mixHex(
    mixHex(mixHex(PALETTE.roofWood, PALETTE.rockDark, 0.5), PALETTE.rockLight, 0.2),
    PALETTE.waterMid,
    0.15,
  ),
  wreckShade: mixHex(mixHex(PALETTE.roofWood, PALETTE.rockDark, 0.62), PALETTE.waterDeep, 0.3),
  wreckWet: mixHex(mixHex(PALETTE.roofWood, PALETTE.rockDark, 0.5), PALETTE.waterMid, 0.62),
  wreckLine: mixHex(PALETTE.rockDark, PALETTE.waterDeep, 0.5),
  // Meeresfels (E3) und Felseiland (E8): Felstöne aus ROCK_TONES (DECOR_TONES), nasser Fuss, Sandring
  rockWet: mixHex(PALETTE.rockDark, PALETTE.waterDeep, 0.5),
  isletSand: mixHex(PALETTE.sandWet, PALETTE.rock, 0.3),
  isletSandLit: mixHex(PALETTE.sandDry, PALETTE.rockLight, 0.5),
  isletHalo: mixHex(PALETTE.waterShallow, PALETTE.rock, 0.3),
} as const;

/** Töne, die nur im Wasser vorkommen (nasser Fuss, Wrack, Eiland-Halo): dort ist Nähe zu den Wassertönen gewollt, nur die Signalfarben-Grenze gilt. */
export const SEA_ONLY_TONES = [
  'wreckWood',
  'wreckLit',
  'wreckShade',
  'wreckWet',
  'wreckLine',
  'rockWet',
  'isletSand',
  'isletSandLit',
  'isletHalo',
] as const satisfies readonly (keyof typeof DECOR_STAMP_TONES)[];

/** Feste Box des Stempel-Canvas relativ zur Rautenmitte (Weltpixel). */
export const STAMP_BOX = { x0: -40, y0: -46, x1: 40, y1: 20 } as const;
const VARIANTS = 4;
/** Zahl der Formvarianten je Art (Cache-Schlüssel und Zeichner): Palme 3 Formen × 4 Richtungen, Felsen 6 Haufen + 2 Nadeln. */
export const VARIANT_COUNT: Record<StampKind, number> = {
  solitaire: VARIANTS,
  orchard: VARIANTS,
  menhir: VARIANTS,
  ruin: VARIANTS,
  palm: 12,
  wreck: 4,
  seaRock: 8,
  islet: 4,
};
const variantOf = (kind: StampKind, variant: number): number => {
  const n = VARIANT_COUNT[kind];
  return ((variant % n) + n) % n;
};

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

/** Breite des gezeichneten Stempels in Weltpixeln (nur die Arten mit Mindestbreite in der Fernansicht, sonst 0). */
export function stampWidthPx(kind: StampKind, variant: number): number {
  const v = variantOf(kind, variant);
  if (kind === 'wreck') {
    const xs = wreckGeom(v).hull.map((p) => p.x);
    return Math.max(...xs) - Math.min(...xs);
  }
  if (kind === 'islet') return 50;
  return 0;
}
/** Mindestbreite von Wrack und Felseiland bei Zoom ≤ 0,25 in CSS-Pixeln (kleiner als das Schiff mit 16 px). */
export const FAR_MIN_CSS_PX = 10;
/** Vergrösserungsfaktor (≥ 1) für Wrack und Eiland bei Zoom ≤ 0,25 (wie `shipScale`, aber kleiner); sonst 1. */
export function minStampScale(kind: StampKind, variant: number, zoom: number): number {
  if ((kind !== 'wreck' && kind !== 'islet') || zoom > 0.25) return 1;
  return Math.max(1, FAR_MIN_CSS_PX / (stampWidthPx(kind, variant) * zoom));
}

/** Höhe des gezeichneten Stempels über dem Boden in Weltpixeln (aus der Formtabelle, ohne Rasterung). */
export function stampHeight(kind: StampKind, variant: number): number {
  const v = variantOf(kind, variant);
  if (kind === 'palm') return -palmGeom(v >> 2, v & 3).top;
  if (kind === 'wreck') return -wreckGeom(v).top;
  if (kind === 'seaRock') return v >= 6 ? NEEDLE_H : Math.max(...rockHeaps(v).map((b) => b.h));
  if (kind === 'islet') return ISLET_H;
  if (kind === 'solitaire' || kind === 'orchard') {
    const t = treeShape(kind, v);
    return t.cy + t.hh;
  }
  if (kind === 'menhir') return MENHIR_H[v]!;
  return Math.max(...ruinBlocks(v).map((b) => b.h)) + 1.5; // plus Bewuchs oben
}
const MENHIR_H = [21, 19, 22, 20] as const;
const MENHIR_W = 10;

// ---------- L5: Palme, Wrack, Meeresfels, Felseiland ----------

const quadAt = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

export interface Frond {
  /** Umriss (Wedel mit gezackten Kanten), Lichtseite und Schattenseite als eigene Polygone. */
  outline: Pt[];
  lit: Pt[];
  shade: Pt[];
  /** sin θ der Wedelrichtung: > 0 zum Betrachter (vorn). */
  front: number;
}
export interface PalmGeom {
  /** Stammkanten links und rechts (unten nach oben), Mittellinie, Wedel (hinten zuerst), Schopfmitte. */
  left: Pt[];
  right: Pt[];
  mid: Pt[];
  fronds: Frond[];
  crown: Pt;
  /** Kleinstes y aller Punkte (negativ = Höhe über dem Boden). */
  top: number;
}
/** Horizontale Neigung je Richtung (0 +x, 1 +y, 2 −x, 3 −y im Kachelraum → rechts/links auf dem Bildschirm). */
const LEAN_SIGN = [1, -1, -1, 1] as const;
const PALM_H = [20, 22, 24] as const;
const geoms = new Map<string, PalmGeom>();

/** Geometrie einer Palme: schlanker, zur See gebogener Stamm und 5–7 gefiederte Wedel (Form 0…2 → 5…7). Rein, ohne Zufall. */
export function palmGeom(shape: number, dir: number): PalmGeom {
  const key = `${shape}|${dir}`;
  let g = geoms.get(key);
  if (g) return g;
  const H = PALM_H[shape % 3]!;
  const lx = LEAN_SIGN[dir & 3]! * (5 + shape);
  const a = { x: 0, y: 0 },
    c = { x: lx * 0.08, y: -H * 0.62 },
    b = { x: lx, y: -H };
  const left: Pt[] = [],
    right: Pt[] = [],
    mid: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6,
      m = quadAt(a, c, b, t),
      w = 2.1 - 0.9 * t;
    mid.push(m);
    left.push({ x: m.x - w, y: m.y });
    right.push({ x: m.x + w, y: m.y });
  }
  const n = 5 + (shape % 3);
  const fronds: Frond[] = [];
  const L = 12.5 + shape * 0.8;
  for (let i = 0; i < n; i++) {
    // gleichmässig um die Schopfmitte, je Form und Richtung versetzt; sinθ > 0 = zum Betrachter
    const th = ((i + 0.5 + 0.18 * shape + 0.07 * (dir & 3)) / n) * Math.PI * 2;
    const P0 = { x: b.x, y: b.y + 1 },
      C = { x: b.x + Math.cos(th) * L * 0.55, y: b.y - 5 + Math.sin(th) * L * 0.2 },
      P1 = { x: b.x + Math.cos(th) * L, y: b.y + 2.5 + Math.sin(th) * L * 0.3 };
    const N = 6;
    const up: Pt[] = [],
      dn: Pt[] = [],
      sp: Pt[] = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N,
        s0 = quadAt(P0, C, P1, t),
        s1 = quadAt(P0, C, P1, Math.min(1, t + 0.02)),
        tx = s1.x - s0.x,
        ty = s1.y - s0.y,
        tl = Math.hypot(tx, ty) || 1;
      // Fiederung: abwechselnd lange und kurze Zacken, zur Spitze schmaler
      const w = 3.1 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (k % 2 ? 1 : 0.55);
      sp.push(s0);
      up.push({ x: s0.x + (ty / tl) * w, y: s0.y - (tx / tl) * w });
      dn.push({ x: s0.x - (ty / tl) * w, y: s0.y + (tx / tl) * w });
    }
    const upper = mean(up) < mean(dn); // die obere Seite ist die Lichtseite
    const hi = upper ? up : dn,
      lo = upper ? dn : up;
    fronds.push({
      outline: [...up, ...dn.slice().reverse()],
      lit: [...sp, ...hi.slice().reverse()],
      shade: [...sp, ...lo.slice().reverse()],
      front: Math.sin(th),
    });
  }
  fronds.sort((p, q) => p.front - q.front);
  const all = [...left, ...right, ...fronds.flatMap((f) => f.outline)];
  g = { left, right, mid, fronds, crown: b, top: Math.min(...all.map((q) => q.y)) };
  geoms.set(key, g);
  return g;
}
const mean = (ps: readonly Pt[]): number => ps.reduce((s, p) => s + p.y, 0) / ps.length;

function paintPalm(ctx: CanvasRenderingContext2D, shape: number, dir: number): void {
  const g = palmGeom(shape, dir),
    T = DECOR_STAMP_TONES;
  // weicher Kontaktschatten am Fuss, Richtung −LIGHT (im Stempel selbst, nicht über `decorShadow`)
  const so = project(DIR.x * 0.2, DIR.y * 0.2);
  ctx.save();
  ctx.globalAlpha = 0.32;
  ell(ctx, T.palmShadow, so.x, so.y, 8, 3.2);
  ctx.globalAlpha = 0.2;
  ell(ctx, T.palmShadow, so.x * 0.8, so.y * 0.8, 5, 2);
  ctx.restore();
  const strip = [...g.left, ...g.right.slice().reverse()];
  poly(ctx, T.palmTrunk, strip);
  // Schattenseite des Stamms (Licht links) und Ringe quer über den Stamm
  poly(ctx, T.palmTrunkShade, [
    ...g.mid.map((m, i) => ({ x: (m.x + g.right[i]!.x) / 2, y: m.y })),
    ...g.right.slice().reverse(),
  ]);
  ctx.strokeStyle = T.palmTrunkShade;
  ctx.lineWidth = 0.9;
  for (const i of [1, 2, 3, 4, 5]) {
    ctx.beginPath();
    ctx.moveTo(g.left[i]!.x, g.left[i]!.y + 0.6);
    ctx.lineTo(g.right[i]!.x, g.right[i]!.y - 0.4);
    ctx.stroke();
  }
  for (const f of g.fronds) {
    poly(ctx, T.palmFrond, f.outline);
    poly(ctx, T.palmFrondLit, f.lit);
    poly(ctx, T.palmFrondShade, f.shade);
    ctx.strokeStyle = T.palmLine;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    f.outline.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
  }
  ell(ctx, T.palmNut, g.crown.x - 1.4, g.crown.y + 2.2, 1.3, 1.3);
  ell(ctx, T.palmNut, g.crown.x + 1.2, g.crown.y + 2.6, 1.3, 1.3);
}

export interface WreckGeom {
  /** Rumpf (Umriss), Neigung des Decks gegen die Waagrechte in Grad, Mastrest, Deckkante (Bug → Heck). */
  hull: Pt[];
  tiltDeg: number;
  mast: Pt[];
  deck: [Pt, Pt];
  /** Gezackte Lücke im Rumpf (Bruchstelle) und die 2–4 darin sichtbaren Spanten. */
  gap: Pt[];
  ribs: [Pt, Pt][];
  top: number;
}
const WRECK_TILT = [22, 26, 24, 28] as const;
/**
 * Rumpf in Weltpixeln: schräg auf Grund (≥ 20°), ein Ende unter Wasser, Länge ≈ 1–1,2 Kacheln, in der Mitte aufgebrochen
 * (gezackte Lücke mit 3 Spanten), Maststumpf mit schräger Bruchkante, keine Segelfläche.
 */
export function wreckGeom(v: number): WreckGeom {
  const tiltDeg = WRECK_TILT[v & 3]!;
  const mirror = (v & 1) === 1 ? -1 : 1;
  const len = 35 + (v >> 1) * 2.5;
  const rot = (p: Pt): Pt => {
    const r = (-tiltDeg * Math.PI) / 180;
    const x = p.x * Math.cos(r) - p.y * Math.sin(r),
      y = p.x * Math.sin(r) + p.y * Math.cos(r);
    return { x: x * mirror, y };
  };
  // Profil vor der Drehung (Bug rechts): Deckkante, Bug, Kiel, Heck; Höhe nach oben negativ
  const pre: Pt[] = [
    { x: -len, y: -7 },
    { x: -len * 0.2, y: -8.2 },
    { x: len * 0.85, y: -10 },
    { x: len, y: -12.5 },
    { x: len * 0.8, y: -1 },
    { x: len * 0.3, y: 3.5 },
    { x: -len * 0.5, y: 4 },
    { x: -len * 0.95, y: 1 },
  ];
  const hull = pre.map(rot);
  const deck: [Pt, Pt] = [rot(pre[3]!), rot(pre[0]!)];
  // Bruchstelle: Zacken von der Deckkante nach unten, dahinter das dunkle Innere
  const gx = [-0.36, -0.3, -0.23, -0.17, -0.1, -0.04, 0.03, 0.1];
  const gy = [-8.3, -1.2, -5.6, -0.4, -4.6, -1.8, -3.4, -9.2];
  const gap = gx.map((f, i) => rot({ x: len * f, y: gy[i]! }));
  const ribs: [Pt, Pt][] = [-0.28, -0.16, -0.05].map((f) => [
    rot({ x: len * f, y: -9 }),
    rot({ x: len * f * 0.98, y: 1.2 }),
  ]);
  // Maststumpf: schräg abgebrochen, am Deck etwas vor der Mitte, kippt gegen das Heck
  const base = { x: len * 0.32, y: -9.4 };
  const top = { x: len * 0.32 - 5, y: -9.4 - 11 };
  const mast: Pt[] = [
    rot({ x: base.x - 2, y: base.y }),
    rot({ x: top.x - 1.8, y: top.y + 1.5 }),
    rot({ x: top.x - 0.4, y: top.y - 1.4 }),
    rot({ x: top.x + 0.8, y: top.y + 1.6 }),
    rot({ x: top.x + 1.9, y: top.y - 0.3 }),
    rot({ x: base.x + 2, y: base.y }),
  ];
  return {
    hull,
    tiltDeg,
    mast,
    deck,
    gap,
    ribs,
    top: Math.min(...[...hull, ...mast].map((p) => p.y)),
  };
}

function paintWreck(ctx: CanvasRenderingContext2D, v: number): void {
  const g = wreckGeom(v),
    T = DECOR_STAMP_TONES;
  // Schatten im Wasser unter dem Rumpf
  ell(ctx, T.rockWet, 0, 2, 36, 7);
  poly(ctx, T.wreckWood, g.hull);
  // Lichtseite oben, Schattenseite unten
  ctx.save();
  ctx.beginPath();
  g.hull.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  const x0 = Math.min(...g.hull.map((p) => p.x)) - 1,
    x1 = Math.max(...g.hull.map((p) => p.x)) + 1;
  ctx.fillStyle = T.wreckLit;
  ctx.fillRect(x0, -30, x1 - x0, 12);
  ctx.fillStyle = T.wreckShade;
  ctx.fillRect(x0, -4, x1 - x0, 6);
  // halb versunken: alles unter der Wasserlinie in Wasserton gemischt (ein Ende ganz darunter)
  ctx.fillStyle = T.wreckWet;
  ctx.fillRect(x0, -0.5, x1 - x0, 24);
  ctx.restore();
  // aufgebrochen: gezackte Lücke mit dunklem Inneren, darin 3 Spanten
  poly(ctx, T.wreckLine, g.gap);
  ctx.strokeStyle = T.wreckLit;
  ctx.lineWidth = 1.3;
  for (const [a, b] of g.ribs) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.strokeStyle = T.wreckLine;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  g.hull.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
  poly(ctx, T.wreckShade, g.mast);
  ctx.strokeStyle = T.wreckLine;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  g.mast.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
  // Wellenstrich vor dem versunkenen Teil
  ctx.strokeStyle = T.isletHalo;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-20, 1);
  ctx.quadraticCurveTo(-9, -1, 2, 1);
  ctx.quadraticCurveTo(12, 2.4, 22, 0.4);
  ctx.stroke();
}

export interface Heap {
  /** Mitte (Bildschirm-x), Halbbreite und Höhe in Weltpixeln. */
  cx: number;
  w: number;
  h: number;
}
/** Felshaufen: 1–3 Brocken (Variante % 3 + 1), Varianten ≥ 3 gespiegelt. Brocken von hinten nach vorn (kleinstes Gewicht zuerst). */
export function rockHeaps(v: number): Heap[] {
  const m = v >= 3 ? -1 : 1;
  const all: Heap[] = [
    { cx: 0, w: 8.5, h: 13 },
    { cx: 11 * m, w: 6, h: 8.5 },
    { cx: -10 * m, w: 5, h: 6.5 },
  ];
  return all.slice(0, (v % 3) + 1);
}
export const NEEDLE_H = 27.5;
export interface NeedleGeom {
  /** Umriss des Pfeilers (≥ 8 Punkte), Licht- und Schattenfläche, Nebenbrocken. */
  pillar: Pt[];
  lit: Pt[];
  shade: Pt[];
  side: Heap[];
}
/** Felsnadel (Variante 6/7 gespiegelt): Fuss ≈ 15 px breit, Höhe `NEEDLE_H` ≤ 0,8 · TREE_H, Spitze schräg abgebrochen mit Kerbe. */
export function needleGeom(v: number): NeedleGeom {
  const m = v === 7 ? -1 : 1;
  const P = (x: number, y: number): Pt => ({ x: x * m, y });
  return {
    pillar: [
      P(-7, 0),
      P(-6.8, -6),
      P(-4.6, -11),
      P(-5.2, -17),
      P(-3.4, -23),
      P(-1.6, -27.5),
      P(0.6, -24.5),
      P(3, -27),
      P(3.8, -22.5),
      P(6, -18),
      P(5.5, -12),
      P(7, -6),
      P(7.5, 0),
    ],
    lit: [
      P(-7, 0),
      P(-6.8, -6),
      P(-4.6, -11),
      P(-5.2, -17),
      P(-3.4, -23),
      P(-1.6, -27.5),
      P(-0.4, -14),
      P(-1, 0),
    ],
    shade: [
      P(2.4, 0),
      P(1.4, -12),
      P(0.6, -24.5),
      P(3, -27),
      P(3.8, -22.5),
      P(6, -18),
      P(5.5, -12),
      P(7, -6),
      P(7.5, 0),
    ],
    side: [
      { cx: -11.5 * m, w: 4.6, h: 6.5 },
      { cx: 11 * m, w: 3.6, h: 4.5 },
    ],
  };
}
const ISLET_H = 30;

/** Ein Felsbrocken (flach facettiert, Licht links) mit nassem Fuss. */
function paintBoulder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  w: number,
  h: number,
  lean = 0,
): void {
  const T = DECOR_STAMP_TONES;
  const top = { x: cx + lean, y: -h };
  const pts: Pt[] = [
    { x: cx - w, y: 0 },
    { x: cx - w * 0.95, y: -h * 0.5 },
    { x: top.x - w * 0.35, y: top.y + 1 },
    top,
    { x: top.x + w * 0.45, y: top.y + h * 0.18 },
    { x: cx + w * 0.95, y: -h * 0.45 },
    { x: cx + w, y: 0 },
  ];
  poly(ctx, DECOR_TONES.rockMid, pts);
  poly(ctx, DECOR_TONES.rockLight, [
    pts[0]!,
    pts[1]!,
    pts[2]!,
    top,
    { x: cx - w * 0.1, y: -h * 0.45 },
    { x: cx - w * 0.3, y: 0 },
  ]);
  poly(ctx, DECOR_TONES.rockShade, [
    { x: cx + w * 0.25, y: 0 },
    { x: cx + w * 0.1 + lean * 0.5, y: -h * 0.5 },
    top,
    pts[4]!,
    pts[5]!,
    pts[6]!,
  ]);
  // nasser Fuss: dunkles, kühles Band an der Wasserlinie
  poly(ctx, T.rockWet, [
    pts[0]!,
    { x: cx - w * 0.85, y: -2.4 },
    { x: cx + w * 0.85, y: -2.2 },
    pts[6]!,
    { x: cx, y: 1.6 },
  ]);
  ctx.strokeStyle = DECOR_TONES.rockDark;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}

function paintSeaRock(ctx: CanvasRenderingContext2D, v: number): void {
  if (v >= 6) {
    // Felsnadel: unregelmässiger, kantiger Pfeiler mit breitem Fuss, abgebrochener Spitze und 1–2 Nebenbrocken
    const g = needleGeom(v);
    for (const b of g.side) paintBoulder(ctx, b.cx, b.w, b.h);
    poly(ctx, DECOR_TONES.rockMid, g.pillar);
    poly(ctx, DECOR_TONES.rockLight, g.lit);
    poly(ctx, DECOR_TONES.rockShade, g.shade);
    const m = v === 7 ? -1 : 1;
    // nasser dunkler Fuss
    poly(ctx, DECOR_STAMP_TONES.rockWet, [
      { x: -8.2 * m, y: 0.4 },
      { x: -7.2 * m, y: -3.2 },
      { x: 7.6 * m, y: -3 },
      { x: 8.4 * m, y: 0.4 },
      { x: 0, y: 2 },
    ]);
    ctx.strokeStyle = DECOR_TONES.rockDark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    g.pillar.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    return;
  }
  const heaps = rockHeaps(v);
  // hinten zuerst: die kleineren Brocken stehen seitlich, der grosse in der Mitte zuletzt
  for (const hp of heaps.slice().reverse()) paintBoulder(ctx, hp.cx, hp.w, hp.h, hp.cx * 0.06);
}

function paintIslet(ctx: CanvasRenderingContext2D, v: number): void {
  const T = DECOR_STAMP_TONES,
    m = v & 1 ? -1 : 1;
  // flacher Halo in Flachwasserton, Sandring (schmal), darin Fels; keine grüne Fläche
  ell(ctx, T.isletHalo, 0, 0.5, 25, 12.5);
  ell(ctx, T.isletSand, 0, 0, 21, 10.5);
  ell(ctx, T.isletSandLit, -3 * m, -1, 15, 7);
  paintBoulder(ctx, -7 * m, 7.5, 10 + (v >> 1) * 1.5, -1);
  paintBoulder(ctx, -1 * m, 5, 6.5);
  // genau eine Palme auf dem Sand, kleiner als am Strand
  ctx.save();
  ctx.translate(8 * m, 2);
  ctx.scale(0.72, 0.72);
  paintPalm(ctx, v >> 1, m > 0 ? 0 : 2);
  ctx.restore();
}

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
/** Schattenpolygon im Kachelraum für A5/A6 (Boden-Fleck unter der Krone); Menhir, Mauerreste und die L5-Stempel (Palme am Strand, Wrack, Felsen, Eiland) werfen keinen. */
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
  const v = variantOf(kind, variant);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  if (kind === 'solitaire' || kind === 'orchard') paintTree(ctx, kind, v);
  else if (kind === 'menhir') paintMenhir(ctx, v);
  else if (kind === 'palm') paintPalm(ctx, v >> 2, v & 3);
  else if (kind === 'wreck') paintWreck(ctx, v);
  else if (kind === 'seaRock') paintSeaRock(ctx, v);
  else if (kind === 'islet') paintIslet(ctx, v);
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
  const k = minStampScale(item.stamp, item.variant, z); // vergrössert um den Fusspunkt
  ctx.drawImage(
    stamp,
    p.x + STAMP_BOX.x0 * z * k,
    p.y + STAMP_BOX.y0 * z * k,
    stamp.width * f * k,
    stamp.height * f * k,
  );
}
