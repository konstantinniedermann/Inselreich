import { worldToScreen, type Camera } from './camera';
import {
  GIANT_SCALE,
  TREE_H,
  crownGeom,
  type Crown,
  type CrownGeom,
  type CrownKind,
} from './crown';
import { SHAPES } from './forest';
import {
  ISO_H,
  ISO_W,
  ZOOM_STEPS,
  project,
  zoomStep,
  type Box,
  type Pt,
  type SortedItem,
} from './iso';
import { LIGHT } from './light';
import { PALETTE, mixHex, shadeSide, toLight, toShade } from './palette';

// trees.ts — Bäume zeichnen (ISO §6, D-08, D-12; ART-STIL-02 L1, WALD-02). Die Platzierung (jede Krone einzeln, aus dem
// Saumfeld) kommt aus `forest.ts`, die Kronenform aus `crown.ts`; hier stehen Farben, Malen, der Kronen-Atlas, Box und
// Schatten eines Wald-Objekts.
//
// Kronen-Atlas (WALD-02): je (Art, Form, Spiegelung, Tonklasse, Radiusstufe, Flag) und Zoomstufe ein kleines Canvas mit
// Krone und Stamm, Ursprung = Fusspunkt. Eine Krone mit Radius r zeichnet die Stufe r_b ≥ r, um r / r_b verkleinert
// (alle Kronenmasse sind linear in r, crown.ts). Der Inhalt hängt nicht vom Seed ab; der Cache gilt für alle Inseln.
// Obergrenze `TREE_CACHE_MAX_BYTES`; darüber fallen die am längsten ungenutzten Einträge.
//
// Schnittstellen für L6 (Lichtung): `paintCrown`/`paintTrunk` malen eine Krone, `drawTreeStamp` ein Wald-Objekt,
// `treeBounds`/`treeShadow` gehören zum Objekt; die Kronen eines Objekts stehen in `item.crowns`.

export { GIANT_SCALE, TREE_H, crownGeom, type Crown, type CrownGeom, type CrownKind };
export { slotKind } from './forest';

/** Wald-Objekt: eine Tiefenband-Zelle (oder Eng-Kachel) mit ihren Kronen, Fusspunkte relativ zur Kachel `fp`. */
export type TreeItem = Extract<SortedItem, { kind: 'tree' }>;

const TRUNK_COLOR = mixHex(PALETTE.rockDark, PALETTE.earth, 0.5);
/** Körper des Nadelbaums (R149). */
export const CONIFER_COLOR = mixHex(PALETTE.crown, PALETTE.rockDark, 0.35);
/** Körper des hellen Laubbaums (R149). */
export const LIGHT_CROWN_COLOR = mixHex(PALETTE.crown, PALETTE.grassLight, 0.45);
/** Stamm des hellen Laubbaums, heller als der Standardstamm (R149); Stamm der Birke (B4). */
export const LIGHT_TRUNK_COLOR = mixHex(PALETTE.wallLime, PALETTE.rockDark, 0.55);
/** Pinie (Waldtyp 3): warmes, trockenes Grün. */
export const PINE_COLOR = mixHex(PALETTE.crown, PALETTE.roofThatch, 0.28);
/** Ahorn (B5): gedecktes Rostrot aus Palettenmischungen, ΔE2000 ≥ 20 zu allen Signalfarben. */
export const MAPLE_COLOR = mixHex(PALETTE.roofTerracotta, PALETTE.crown, 0.38);
/** Totholz (B3): grauer, ausgeblichener Stamm und Schnittfläche des Stumpfs. */
export const DEADWOOD_COLOR = mixHex(PALETTE.rock, PALETTE.earth, 0.5);
export const STUMP_TOP_COLOR = mixHex(PALETTE.roofThatch, PALETTE.earth, 0.4);
const BODY: readonly string[] = [
  PALETTE.crown,
  CONIFER_COLOR,
  LIGHT_CROWN_COLOR,
  PINE_COLOR,
  MAPLE_COLOR,
];
/** Tonklassen des Kronendachs (B2): je Art dunkler (−1) und heller (+1), etwa eine Tonstufe. */
const TONE_DARK = 0.3,
  TONE_LIGHT = 0.26;
/** Körperfarbe je Baumart und Tonklasse. */
export const crownBase = (kind: CrownKind, tone: -1 | 0 | 1 = 0): string => {
  const b = BODY[kind]!;
  return tone < 0 ? toShade(b, TONE_DARK) : tone > 0 ? toLight(b, TONE_LIGHT) : b;
};
const SHADOW_SHIFT = 0.19; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const SHADOW_A = 0.5,
  SHADOW_B = 0.3;
const DIR = { x: -LIGHT.x, y: -LIGHT.y }; // vom Licht weg (Kachelraum)
/** Richtung zum Licht im Bild (Einheitsvektor, aus `LIGHT` projiziert; links oben). */
const LIGHT_PX = (() => {
  const p = project(LIGHT.x, LIGHT.y);
  const n = Math.hypot(p.x, p.y);
  return { x: p.x / n, y: p.y / n };
})();
/** Kappenversatz in Kronenradien (Richtung Licht) und Anteil des Schattenmonds. */
const CAP_SHIFT = 0.4,
  MOON_SHIFT = 0.14,
  MOON_SHRINK = 0.9;
/** Kronentöne (S2): kühler Schatten, Mitte, warme Kappe. */
export const crownShade = (base: string): string => shadeSide(base, 0.3);
export const crownCap = (base: string): string =>
  toLight(mixHex(base, PALETTE.grassLight, 0.3), 0.2);

const geomOf = new WeakMap<Crown, CrownGeom>();
/** `crownGeom` je Kronenobjekt einmal (die Kronen eines Layouts sind gecacht); je Frame kein Neuberechnen. */
function geomFor(c: Crown): CrownGeom {
  let g = geomOf.get(c);
  if (!g) geomOf.set(c, (g = crownGeom(c)));
  return g;
}

/** Mittelpunkt und halbe Masse einer Krone, Ursprung = Rautenmitte der Objektkachel (Weltpixel; y nach unten). */
export function crownScreen(c: Crown): { x: number; y: number; rx: number; ry: number } {
  const g = geomFor(c);
  return {
    x: (c.cx - c.cy) * (ISO_W / 2),
    y: ((c.cx + c.cy - 1) * ISO_H) / 2 - c.h,
    rx: g.hw,
    ry: g.hh,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Malen

const ellipse = (
  ctx: CanvasRenderingContext2D,
  fill: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * Zeichnet eine Krone (ohne Stamm) um ihren Mittelpunkt (x, y) in drei Tonstufen: Laub-artige Kronen als Klumpen aus
 * Lappen (Schattenmond, Mitte, Kappe zum Licht), der Nadelbaum als Etagen. Tonklasse aus `c.tone`.
 */
export function paintCrown(ctx: CanvasRenderingContext2D, c: Crown, x: number, y: number): void {
  const g = geomFor(c);
  const base = crownBase(c.kind, c.tone ?? 0);
  if (g.tiers.length > 0) {
    const sd = LIGHT_PX.x > 0 ? -1 : 1; // Seite des Schattens im Bild
    for (const t of g.tiers) {
      const ax = x + t.ax,
        ay = y + t.ay,
        bx = x + t.bx,
        by = y + t.by;
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx + t.hw, by);
      ctx.lineTo(bx - t.hw, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = crownShade(base);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx + sd * t.hw, by);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = crownCap(base);
      ctx.beginPath();
      ctx.moveTo(ax - sd * 0.05 * t.hw, ay + 0.08 * t.th);
      ctx.lineTo(ax - sd * 0.05 * t.hw, ay + 0.74 * t.th);
      ctx.lineTo(ax - sd * 0.72 * t.hw, ay + 0.74 * t.th);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  const lobes = [...g.lobes].sort((a, b) => a.y - b.y); // hinten zuerst
  // Schattenmond: alle Lappen im kühlen Ton (die gezackte Silhouette)
  for (const l of lobes) ellipse(ctx, crownShade(base), x + l.x, y + l.y, l.rx, l.ry);
  // Mitte: Lappen zum Licht versetzt und etwas kleiner (Pinie: nach oben, die Unterseite bleibt dunkel)
  const pine = c.kind === 3;
  for (const l of lobes)
    ellipse(
      ctx,
      base,
      x + l.x + LIGHT_PX.x * MOON_SHIFT * l.rx,
      y + l.y + (pine ? -0.2 * l.ry : LIGHT_PX.y * MOON_SHIFT * l.ry),
      (pine ? 0.94 : MOON_SHRINK) * l.rx,
      (pine ? 0.8 : MOON_SHRINK) * l.ry,
    );
  // Kappe: die am stärksten zum Licht liegenden Lappen (bei Büschen einer, beim Schirm oben)
  const lit = [...lobes]
    .sort((a, b) => b.x * LIGHT_PX.x + b.y * LIGHT_PX.y - (a.x * LIGHT_PX.x + a.y * LIGHT_PX.y))
    .slice(0, c.bush ? 1 : pine ? 3 : 2);
  for (const l of lit)
    ellipse(
      ctx,
      crownCap(base),
      x + l.x + LIGHT_PX.x * (MOON_SHIFT + CAP_SHIFT) * l.rx,
      y + l.y + (pine ? -0.5 * l.ry : LIGHT_PX.y * (MOON_SHIFT + CAP_SHIFT) * l.ry),
      0.55 * l.rx,
      (pine ? 0.4 : 0.5) * l.ry,
    );
}

/** Stammbreite in Weltpixeln (Riesenbaum doppelt). */
const trunkWidth = (c: Crown): number =>
  ((c.kind === 2 ? 2.2 : 2.6) + (c.r > 0.2 ? 0.8 : 0)) * (c.giant ? 2 : 1);

/** Zeichnet den Stamm einer Krone: vom Boden (x, ground) bis zum Kronenmittelpunkt. */
export function paintTrunk(
  ctx: CanvasRenderingContext2D,
  c: Crown,
  x: number,
  ground: number,
): void {
  if (c.bush) return;
  const w = trunkWidth(c);
  ctx.fillStyle = c.kind === 2 ? LIGHT_TRUNK_COLOR : TRUNK_COLOR;
  ctx.beginPath();
  if (c.kind === 3) {
    // Pinie: leicht geneigter Stamm
    const lean = (c.s - 0.5) * 4;
    ctx.moveTo(x - w / 2, ground);
    ctx.lineTo(x + w / 2, ground);
    ctx.lineTo(x + w / 2 + lean, ground - c.h);
    ctx.lineTo(x - w / 2 + lean, ground - c.h);
    ctx.closePath();
  } else ctx.rect(x - w / 2, ground - c.h, w, c.h);
  ctx.fill();
}

/** Totholz-Masse in Weltpixeln je Kachel Radius: Stumpf (Breite, Höhe), toter Stamm (Höhe). */
const STUMP_H = 0.55,
  SNAG_H = 1.9;
/** Zeichnet Totholz (B3) am Fuss (x, ground): Stumpf mit heller Schnittfläche oder entasteter Stamm. */
function paintDead(ctx: CanvasRenderingContext2D, c: Crown, x: number, ground: number): void {
  const w = c.r * ISO_W * 0.45;
  if (c.dead === 1) {
    const h = c.r * ISO_W * STUMP_H;
    ctx.fillStyle = TRUNK_COLOR;
    ctx.fillRect(x - w / 2, ground - h, w, h);
    ellipse(ctx, STUMP_TOP_COLOR, x, ground - h, w / 2, w / 4);
    return;
  }
  const h = c.r * ISO_W * SNAG_H;
  const tw = Math.max(1.6, w * 0.4);
  const sd = c.mirror ? -1 : 1;
  ctx.fillStyle = DEADWOOD_COLOR;
  ctx.fillRect(x - tw / 2, ground - h, tw, h);
  ctx.beginPath(); // zwei Aststummel
  ctx.moveTo(x + (sd * tw) / 2, ground - 0.55 * h);
  ctx.lineTo(x + sd * (tw / 2 + 0.35 * w), ground - 0.72 * h);
  ctx.lineTo(x + (sd * tw) / 2, ground - 0.62 * h);
  ctx.moveTo(x - (sd * tw) / 2, ground - 0.75 * h);
  ctx.lineTo(x - sd * (tw / 2 + 0.28 * w), ground - 0.86 * h);
  ctx.lineTo(x - (sd * tw) / 2, ground - 0.8 * h);
  ctx.fill();
  ctx.fillStyle = shadeSide(DEADWOOD_COLOR, 0.3);
  ctx.fillRect(x + (sd > 0 ? 0 : -tw / 2), ground - h, tw / 2, h);
}

/** Malt eine Krone samt Stamm (oder Totholz) mit dem Fusspunkt bei (x, ground). */
export function paintTree(
  ctx: CanvasRenderingContext2D,
  c: Crown,
  x: number,
  ground: number,
): void {
  if (c.dead) {
    paintDead(ctx, c, x, ground);
    return;
  }
  paintTrunk(ctx, c, x, ground);
  paintCrown(ctx, c, x, ground - c.h);
}

/** Malt alle Kronen eines Wald-Objekts direkt (ohne Atlas), Ursprung = Rautenmitte der Objektkachel, Faktor `step`. */
export function paintItem(ctx: CanvasRenderingContext2D, item: TreeItem, step: number): void {
  ctx.save();
  ctx.scale(step, step);
  for (const c of item.crowns) {
    const p = project(c.cx - 0.5, c.cy - 0.5);
    paintTree(ctx, c, p.x, p.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Kronen-Atlas

/** Radiusstufen (Kacheln), Verhältnis 1,3: eine Krone nimmt die kleinste Stufe ≥ r und wird verkleinert. */
export const RADIUS_STEPS = [
  0.4, 0.31, 0.24, 0.185, 0.143, 0.11, 0.085, 0.066, 0.05, 0.038,
] as const;
/** Obergrenze des Kronen-Atlas in Bytes (RGBA). */
export const TREE_CACHE_MAX_BYTES = 12 * 1024 * 1024;

const stepIndex = (r: number): number => {
  let i = 0;
  while (i + 1 < RADIUS_STEPS.length && RADIUS_STEPS[i + 1]! >= r) i++;
  return i;
};
/** Atlas-Schlüssel einer Krone (ohne Zoomstufe) und Verkleinerung r / r_b. */
interface AtlasRef {
  key: number;
  f: number;
  proto: Crown;
}
const refOf = new WeakMap<Crown, AtlasRef>();
const FLAGS = (c: Crown): number => (c.dead ? 2 + c.dead : c.bush ? 1 : c.young ? 5 : 0);
function atlasRef(c: Crown): AtlasRef {
  let a = refOf.get(c);
  if (a) return a;
  const si = stepIndex(c.r);
  const rb = RADIUS_STEPS[si]!;
  const shape = Math.min(SHAPES - 1, Math.floor(c.s * SHAPES));
  const key =
    ((((c.kind * SHAPES + shape) * 2 + (c.mirror ? 1 : 0)) * 3 + ((c.tone ?? 0) + 1)) *
      RADIUS_STEPS.length +
      si) *
      6 +
    FLAGS(c);
  const f = c.r / rb;
  // Urbild der Atlas-Kachel: dieselbe Form bei Radius r_b, Höhe im selben Verhältnis
  const proto: Crown = { ...c, cx: 0, cy: 0, r: rb, h: c.h / f };
  delete proto.cast;
  a = { key, f, proto };
  refOf.set(c, a);
  return a;
}

interface Sprite {
  canvas: HTMLCanvasElement;
  /** Fusspunkt im Sprite (Sprite-Pixel bei der Zoomstufe). */
  ox: number;
  oy: number;
  bytes: number;
  used: number;
  /** false, sobald der Eintrag verdrängt ist (Zeichenlisten der Objekte bauen sich dann neu). */
  alive: boolean;
}

let makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas');
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake. */
export function setCanvasFactory(fn: () => HTMLCanvasElement): void {
  makeCanvas = fn;
}

/** Hüllbox einer Krone samt Stamm relativ zum Fusspunkt (Weltpixel; y nach unten). */
export function crownBox(c: Crown): { x0: number; y0: number; x1: number; y1: number } {
  if (c.dead) {
    const w = c.r * ISO_W * 0.45;
    const h = c.r * ISO_W * (c.dead === 1 ? STUMP_H + 0.15 : SNAG_H);
    const half = c.dead === 1 ? w / 2 : w * 0.7;
    return { x0: -half, y0: -h, x1: half, y1: 1 };
  }
  const g = geomFor(c);
  const tw = c.bush ? 0 : trunkWidth(c) / 2 + (c.kind === 3 ? 2 : 0);
  const hw = Math.max(g.hw, tw);
  return { x0: -hw, y0: -c.h - g.hh, x1: hw, y1: Math.max(1, -c.h + g.hh) };
}

const atlas = new Map<number, Sprite>();
let atlasBytes = 0;
let atlasFrame = 0;
/** Zählt Verdrängungen; eine Zeichenliste mit älterer Zahl prüft ihre Einträge neu. */
let atlasGen = 0;
/** Dev/Test: Einträge und Bytes des Kronen-Atlas. */
export const treeCacheSize = (): number => atlas.size;
export const treeCacheBytes = (): number => atlasBytes;
export function resetTreeCache(): void {
  for (const s of atlas.values()) s.alive = false;
  atlasGen++;
  atlas.clear();
  atlasBytes = 0;
}

function spriteFor(ref: AtlasRef, step: number): Sprite | null {
  const key = ref.key * ZOOM_STEPS.length + ZOOM_STEPS.indexOf(step as (typeof ZOOM_STEPS)[number]);
  const hit = atlas.get(key);
  if (hit) {
    hit.used = atlasFrame;
    return hit;
  }
  const c = ref.proto;
  const b = crownBox(c);
  const canvas = makeCanvas();
  canvas.width = Math.max(1, Math.ceil((b.x1 - b.x0 + 2) * step));
  canvas.height = Math.max(1, Math.ceil((b.y1 - b.y0 + 2) * step));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const ox = (1 - b.x0) * step,
    oy = (1 - b.y0) * step;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(step, step);
  paintTree(ctx, c, 0, 0);
  ctx.restore();
  const s: Sprite = {
    canvas,
    ox,
    oy,
    bytes: canvas.width * canvas.height * 4,
    used: atlasFrame,
    alive: true,
  };
  if (atlasBytes + s.bytes > TREE_CACHE_MAX_BYTES) evict(s.bytes);
  atlas.set(key, s);
  atlasBytes += s.bytes;
  return s;
}
/** Wirft die am längsten ungenutzten Einträge, bis `need` Bytes unter der Obergrenze Platz haben. */
function evict(need: number): void {
  const order = [...atlas.entries()].sort((a, b) => a[1].used - b[1].used);
  for (const [k, s] of order) {
    if (atlasBytes + need <= TREE_CACHE_MAX_BYTES * 0.8) break;
    atlas.delete(k);
    atlasBytes -= s.bytes;
    s.alive = false;
    atlasGen++;
  }
}

/**
 * Zeichnet ein Wald-Objekt: je Krone ein Atlas-Eintrag der Zoomstufe `zoomStep(z)`, an den Fusspunkt gesetzt und um
 * `z / step · r / r_b` skaliert. Der Riesenbaum (B3, höchstens einer je Karte) wird direkt gemalt, nie aus dem Atlas.
 */
export function drawTreeStamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  item: TreeItem,
  seed: number,
): void {
  void seed; // der Atlas hängt nicht vom Seed ab (Signatur für renderer.ts)
  const z = cam.zoom,
    step = zoomStep(z);
  atlasFrame++;
  // Bildausschnitt: der Kachelbereich des Renderers ist das achsparallele Rechteck um die Bildraute und enthält viele
  // Objekte neben dem Bild; Objekte ganz ausserhalb kosten hier keinen Zeichenaufruf (WALD-02, viele Einzelkronen)
  const v = viewOf(ctx);
  if (v) {
    const b = treeBounds(item);
    const x0 = (b.x - cam.x) * z,
      y0 = (b.y - cam.y) * z;
    if (x0 > v.w || y0 > v.h || x0 + b.w * z < 0 || y0 + b.h * z < 0) return;
  }
  let d = drawOf.get(item);
  if (
    !d ||
    d.step !== step ||
    (d.gen !== atlasGen && d.list.some((e) => e.s !== null && !e.s.alive))
  )
    drawOf.set(item, (d = drawList(item, step)));
  d.gen = atlasGen;
  const o = worldToScreen(cam, project(item.fp.x, item.fp.y));
  for (const e of d.list) {
    if (e.s === null) {
      // Riesenbaum: direkt gemalt
      ctx.save();
      ctx.translate(o.x + e.x * z, o.y + e.y * z);
      ctx.scale(z, z);
      paintTree(ctx, e.c, 0, 0);
      ctx.restore();
      continue;
    }
    e.s.used = atlasFrame;
    ctx.drawImage(e.s.canvas, o.x + e.x * z, o.y + e.y * z, e.w * z, e.h * z);
  }
}

/** Bildgrösse in CSS-Pixeln (Canvas durch die DPR der Basismatrix), gemerkt je Kontext und Canvasgrösse; ohne Canvas null. */
let viewKey: { ctx: CanvasRenderingContext2D | null; w: number; h: number } = {
  ctx: null,
  w: 0,
  h: 0,
};
let viewVal: { w: number; h: number } | null = null;
function viewOf(ctx: CanvasRenderingContext2D): { w: number; h: number } | null {
  const c = (ctx as { canvas?: HTMLCanvasElement }).canvas;
  if (!c || typeof c.width !== 'number') return null;
  if (viewKey.ctx !== ctx || viewKey.w !== c.width || viewKey.h !== c.height) {
    const m = ctx.getTransform?.();
    const dpr = m && Number.isFinite(m.a) && m.a > 0 ? m.a : 1;
    viewKey = { ctx, w: c.width, h: c.height };
    viewVal = { w: c.width / dpr, h: c.height / dpr };
  }
  return viewVal;
}

/** Zeichenliste eines Objekts je Zoomstufe: Atlas-Eintrag und Zielrechteck in Weltpixeln relativ zur Objektecke. */
interface DrawEntry {
  s: Sprite | null;
  c: Crown;
  x: number;
  y: number;
  w: number;
  h: number;
}
const drawOf = new WeakMap<TreeItem, { step: number; gen: number; list: DrawEntry[] }>();
function drawList(item: TreeItem, step: number): { step: number; gen: number; list: DrawEntry[] } {
  const list: DrawEntry[] = [];
  for (const c of item.crowns) {
    const fx = (c.cx - c.cy) * (ISO_W / 2),
      fy = (c.cx + c.cy) * (ISO_H / 2);
    if (c.giant) {
      list.push({ s: null, c, x: fx, y: fy, w: 0, h: 0 });
      continue;
    }
    const ref = atlasRef(c);
    const s = spriteFor(ref, step);
    if (!s) continue;
    const k = ref.f / step; // Sprite-Pixel → Weltpixel
    list.push({
      s,
      c,
      x: fx - s.ox * k,
      y: fy - s.oy * k,
      w: s.canvas.width * k,
      h: s.canvas.height * k,
    });
  }
  return { step, gen: atlasGen, list };
}

// ---------------------------------------------------------------------------------------------------------------
// Box, Schatten

const boundsOf = new WeakMap<TreeItem, Box>();
/** Bildbox des Objekts (Weltpixel): Hülle aller Kronen samt Stamm; je Objekt einmal berechnet. */
export function treeBounds(item: TreeItem): Box {
  let b = boundsOf.get(item);
  if (b) return b;
  const o = project(item.fp.x, item.fp.y);
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const c of item.crowns) {
    const p = project(c.cx, c.cy);
    const q = crownBox(c);
    x0 = Math.min(x0, p.x + q.x0);
    x1 = Math.max(x1, p.x + q.x1);
    y0 = Math.min(y0, p.y + q.y0);
    y1 = Math.max(y1, p.y + q.y1);
  }
  if (!Number.isFinite(x0)) {
    const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
    x0 = x1 = c.x;
    y0 = y1 = c.y;
  }
  b = { x: o.x + x0 - 1, y: o.y + y0 - 1, w: x1 - x0 + 2, h: y1 - y0 + 2 };
  boundsOf.set(item, b);
  return b;
}

/** Schattenform je Kachel Radius: Ellipse nach rechts unten (+3, +1) versetzt (D-11), 8 Punkte. */
const SHADOW_UNIT: readonly Pt[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  const u = Math.cos(a) * SHADOW_A * 2,
    v = Math.sin(a) * SHADOW_B * 2;
  return { x: DIR.x * u - DIR.y * v, y: DIR.y * u + DIR.x * v };
});
const shadowOf = new WeakMap<TreeItem, Pt[]>();
/**
 * Schattenpolygon im Kachelraum: je Krone mit eigenem Schatten (`cast`: Vorwald, Saum hinter der Saumlinie) eine
 * Ellipse unter der Krone, nach rechts unten versetzt; mehrere Ellipsen als ein Umlauf, über den ersten Punkt verkettet
 * (gleicher Drehsinn, die Brücken sind hin und zurück derselbe Weg und haben keine Fläche). Kronen innerhalb der
 * Saumlinie werfen keinen eigenen Schatten: der liegt als Waldschatten im Boden (terrain.ts). Leer, wenn nichts wirft.
 */
export function treeShadow(item: TreeItem): Pt[] {
  let out = shadowOf.get(item);
  if (out) return out;
  out = [];
  let first: Pt | null = null;
  for (const c of item.crowns) {
    if (!c.cast && !c.giant) continue;
    const k = c.giant ? 0.5 : c.r * (c.bush ? 0.9 : 1.1);
    const sh = c.giant ? 2 * SHADOW_SHIFT : (SHADOW_SHIFT * (c.h + 6)) / 30;
    const mx = item.fp.x + c.cx + DIR.x * sh,
      my = item.fp.y + c.cy + DIR.y * sh;
    const ring = SHADOW_UNIT.map((u) => ({ x: mx + u.x * k, y: my + u.y * k }));
    if (first) out.push(...ring, ring[0]!, first);
    else {
      out.push(...ring);
      first = ring[0]!;
      out.push(first);
    }
  }
  shadowOf.set(item, out);
  return out;
}
