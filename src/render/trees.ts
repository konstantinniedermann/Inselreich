import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import {
  GIANT_SCALE,
  TREE_H,
  crownGeom,
  groupParts,
  shapeIndex,
  type Crown,
  type CrownGeom,
  type CrownKind,
} from './crown';
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
import { bandCell } from './forest';
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
//
// Farn auf Lichtungen (L6 B2, REL-07 auf WALD-02 übertragen): die Lichtungskacheln stehen in `item.ferns`; ihre Büschel
// (`fernTufts`, Salz 584) zeichnet das Objekt, in dessen Tiefenband-Zelle der Fuss des Büschels fällt, in der
// Tiefenfolge zwischen seinen Kronen.

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
export const crownBase = (kind: CrownKind, tone = 0): string => {
  const b = BODY[kind]!;
  const t = Math.max(-1.4, Math.min(1.2, tone));
  // die Birke ist schon hell: halbe Aufhellung (ihre Kappe bleibt ΔE ≥ 20 zu signalOk)
  return t < 0
    ? toShade(b, -t * TONE_DARK)
    : t > 0
      ? toLight(b, t * TONE_LIGHT * (kind === 2 ? 0.5 : 1))
      : b;
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
    x: (c.cx - c.cy) * (ISO_W / 2) + (g.ox ?? 0),
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
  if (c.group !== undefined) {
    // Gruppe: die Kronen ihrer Bäume, hinten zuerst, um die Gruppenmitte (x, y)
    const { members, at } = groupParts(c);
    members.forEach((m, i) => paintCrown(ctx, m, x + at[i]!.x, y + at[i]!.y));
    return;
  }
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
      ctx.lineTo(bx + t.hr, by);
      ctx.lineTo(bx - t.hl, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = crownShade(base);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx + (sd > 0 ? t.hr : -t.hl), by);
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
  if (c.group !== undefined) {
    for (const m of groupParts(c).members)
      paintTree(ctx, m, x + (m.cx - m.cy) * (ISO_W / 2), ground + (m.cx + m.cy) * (ISO_H / 2));
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
  0.52, 0.4, 0.31, 0.24, 0.185, 0.143, 0.11, 0.085, 0.066, 0.05, 0.038,
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
  key: string;
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
  const key = `${c.kind}|${shapeIndex(c.s)}|${c.mirror ? 1 : 0}|${c.tone ?? 0}|${si}|${FLAGS(c)}|${c.group ?? '-'}`;
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
  if (c.group !== undefined) {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const m of groupParts(c).members) {
      const b = crownBox(m);
      const dx = (m.cx - m.cy) * (ISO_W / 2),
        dy = (m.cx + m.cy) * (ISO_H / 2);
      x0 = Math.min(x0, b.x0 + dx);
      x1 = Math.max(x1, b.x1 + dx);
      y0 = Math.min(y0, b.y0 + dy);
      y1 = Math.max(y1, b.y1 + dy);
    }
    return { x0, y0, x1, y1 };
  }
  const g = geomFor(c);
  const tw = c.bush ? 0 : trunkWidth(c) / 2 + (c.kind === 3 ? 2 : 0);
  const hw = Math.max(g.hw, tw);
  return { x0: -hw, y0: -c.h - g.hh, x1: hw, y1: Math.max(1, -c.h + g.hh) };
}

const atlas = new Map<string, Sprite>();
let atlasBytes = 0;
let atlasFrame = 0;
/** Zählt Verdrängungen; eine Zeichenliste mit älterer Zahl prüft ihre Einträge neu. */
let atlasGen = 0;
/** Dev/Test: Einträge und Bytes des Kronen-Atlas. */
export const treeCacheSize = (): number => atlas.size;
export const treeCacheBytes = (): number => atlasBytes;
export function resetTreeCache(): void {
  composites.clear();
  compositeBytes = 0;
  fernCache.clear();
  fernSeed = null;
  for (const s of atlas.values()) s.alive = false;
  atlasGen++;
  atlas.clear();
  atlasBytes = 0;
}

function spriteFor(ref: AtlasRef, step: number): Sprite | null {
  const key = `${ref.key}|${step}`;
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

// ---------------------------------------------------------------------------------------------------------------
// Farn auf Lichtungen (ART-STIL-02 L6, B2 Stempelteil). Salz 584 (Block 576–584, Register im zentralen Kopf von
// groundDecor.ts). Je Lichtungskachel 2–4 Büschel (Fächer aus 5–7 Wedeln) in der vorderen
// Kachelhälfte; WALD-02/REL-07: jedes Büschel wird mit der Tiefenband-Zelle seines Fusspunkts gezeichnet, in der
// Tiefenfolge zwischen deren Kronen. Eigener kleiner Cache (FERN_FORMS × ZOOM_STEPS), der Kronen-Atlas bleibt unberührt.

export const FERN_SALT = 584;
export const FERN_FORMS = 4;
/** Farn zeigt sich ab Zoom 0,5. */
export const FERN_MIN_ZOOM = 0.5;
/** Höhe eines Büschels (Weltpixel) höchstens ein Viertel der Baumhöhe. */
export const FERN_H = 0.25 * TREE_H;
/** Frisches Hellgrün, heller als die Kronen: crownLight mit grassLight; Kontur dunkler Eigenton (nie Schwarz). */
export const FERN_LIGHT = mixHex(PALETTE.crownLight, PALETTE.grassLight, 0.85);
export const FERN_MID = mixHex(PALETTE.crownLight, PALETTE.grassLight, 0.6);
export const FERN_LINE = mixHex(PALETTE.crown, PALETTE.rockDark, 0.35);
export interface FernTuft {
  /** Form 0 … FERN_FORMS − 1 */
  form: number;
  /** Fusspunkt in Kachel-Anteilen, vordere Hälfte (0,5 … 0,95) */
  u: number;
  v: number;
}
/** Büschel einer Lichtungskachel: 2–4, deterministisch aus (Seed, Kachel), nach Tiefe (u + v) geordnet. Rein. */
export function fernTufts(seed: number, x: number, y: number): FernTuft[] {
  const n = 2 + Math.floor(hash2(seed + FERN_SALT, x, y) * 3);
  const out: FernTuft[] = [];
  for (let k = 0; k < n; k++)
    out.push({
      form: Math.floor(hash2(seed + FERN_SALT, x * 16 + k + 1, y) * FERN_FORMS) % FERN_FORMS,
      u: 0.5 + 0.45 * hash2(seed + FERN_SALT, x * 16 + k + 1, y + 1000),
      v: 0.5 + 0.45 * hash2(seed + FERN_SALT, x * 16 + k + 1, y + 2000),
    });
  return out.sort((a, b) => a.u + a.v - (b.u + b.v));
}
/** Fläche eines Büschel-Canvas in Weltpixeln: Fusspunkt unten in der Mitte. */
const FERN_BOX = { w: 22, h: 11, cx: 11, cy: 10 };
/** Zeichnet ein Büschel (Fusspunkt bei (0, 0), Wedel nach oben) in Weltpixeln; Eigenkontur zuerst, dann 2 Töne. */
export function paintFern(ctx: CanvasRenderingContext2D, seed: number, form: number): void {
  const n = 5 + (form % 3);
  const H = FERN_H * (0.9 + 0.1 * (form / (FERN_FORMS - 1)));
  const fronds: { tx: number; ty: number; qx: number; qy: number; lit: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const a =
      ((i / (n - 1)) * 2 - 1) * 1.1 + (hash2(seed + FERN_SALT, form * 8 + i, 77) - 0.5) * 0.2; // ± 63°
    const len =
      H *
      (0.72 + 0.28 * Math.cos(a * 0.9)) *
      (0.92 + 0.08 * hash2(seed + FERN_SALT, form * 8 + i, 78));
    // Wedel: Bogen, der nach aussen kippt (Fächer), die Spitze liegt tiefer als die Mitte des Bogens
    const tx = Math.sin(a) * len * 0.95,
      ty = -Math.cos(a) * len * 0.92;
    fronds.push({
      tx,
      ty,
      qx: Math.sin(a) * len * 0.35,
      qy: -Math.cos(a) * len * 0.85,
      lit: a < 0.15,
    });
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pass = (width: number, color: (f: (typeof fronds)[number]) => string): void => {
    ctx.lineWidth = width;
    for (const f of fronds) {
      ctx.strokeStyle = color(f);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(f.qx, f.qy, f.tx, f.ty);
      ctx.stroke();
    }
  };
  pass(2.9, () => FERN_LINE);
  pass(1.6, (f) => (f.lit ? FERN_LIGHT : FERN_MID));
  ctx.restore();
}
const fernCache = new Map<number, HTMLCanvasElement>();
let fernSeed: number | null = null;
export const fernCacheSize = (): number => fernCache.size;
function fernFor(seed: number, form: number, step: number): HTMLCanvasElement | null {
  if (fernSeed !== seed) {
    fernCache.clear();
    fernSeed = seed;
  }
  const key = form * ZOOM_STEPS.length + ZOOM_STEPS.indexOf(step as (typeof ZOOM_STEPS)[number]);
  const hit = fernCache.get(key);
  if (hit) return hit;
  const canvas = makeCanvas();
  canvas.width = Math.ceil(FERN_BOX.w * step);
  canvas.height = Math.ceil(FERN_BOX.h * step);
  const c = canvas.getContext('2d');
  if (!c) return null;
  c.save();
  c.scale(step, step);
  c.translate(FERN_BOX.cx, FERN_BOX.cy);
  paintFern(c, seed, form);
  c.restore();
  if (fernCache.size < FERN_FORMS * ZOOM_STEPS.length) fernCache.set(key, canvas);
  return canvas;
}
/**
 * Farnbüschel eines Wald-Objekts: die Büschel der Lichtungskacheln in `item.ferns`, deren Fusspunkt in die
 * Tiefenband-Zelle des Objekts fällt, mit Fusspunkt relativ zur Objektkachel. Nach Tiefe geordnet. Rein.
 */
export function itemFerns(
  item: TreeItem,
  seed: number,
): { form: number; cx: number; cy: number; tile: { x: number; y: number } }[] {
  const out: { form: number; cx: number; cy: number; tile: { x: number; y: number } }[] = [];
  for (const t of item.ferns ?? [])
    for (const f of fernTufts(seed, t.x, t.y)) {
      const fx = t.x + f.u,
        fy = t.y + f.v;
      const c = bandCell(fx, fy);
      if (c.x !== item.fp.x || c.y !== item.fp.y) continue;
      out.push({ form: f.form, cx: fx - item.fp.x, cy: fy - item.fp.y, tile: t });
    }
  return out.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
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
  // der Kronen-Atlas hängt nicht vom Seed ab; der Seed würfelt nur die Farnbüschel (L6 B2)
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
    d.seed !== seed ||
    (d.gen !== atlasGen && d.list.some((e) => e.s !== null && !e.s.alive))
  )
    drawOf.set(item, (d = drawList(item, step, seed)));
  d.gen = atlasGen;
  const o = worldToScreen(cam, project(item.fp.x, item.fp.y));
  const fern = z >= FERN_MIN_ZOOM - 1e-9;
  // PERF-L57: ab dem zweiten Zeichnen ein Gesamtbild des Objekts mit einem einzigen drawImage
  const comp = compositeFor(item, d, step, fern);
  if (comp) {
    // Atlas-LRU nur grob nachführen (PERF-L57): das Gesamtbild bleibt auch ohne seine Sprites ein gültiges Bild
    if (windowNo - comp.touch >= COMPOSITE_TOUCH_WINDOWS) {
      comp.touch = windowNo;
      for (const e of d.list) if (e.s) e.s.used = atlasFrame;
    }
    ctx.drawImage(
      comp.canvas,
      o.x + comp.rx * z,
      o.y + comp.ry * z,
      (comp.canvas.width / step) * z,
      (comp.canvas.height / step) * z,
    );
    return;
  }
  for (const e of d.list) {
    if (e.f) {
      if (fern) ctx.drawImage(e.f, o.x + e.x * z, o.y + e.y * z, e.w * z, e.h * z);
      continue;
    }
    if (e.s === null) {
      if (!e.c) continue;
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

// ---------------------------------------------------------------------------------------------------------------
// Gesamtbild je Wald-Objekt (PERF-L57): ein Objekt hat 3–5 Kronen/Büschel; nach dem ersten Zeichnen wird es einmal in ein
// eigenes Canvas der Grösse treeBounds · step gemalt und danach mit einem drawImage gezeichnet. Die Sprites liegen dort
// auf ganzen Gerätepixeln der Zoomstufe (Abweichung zum Direktzeichnen höchstens ein halbes Pixel der Stufe).

/** Obergrenze aller Gesamtbilder in Bytes (RGBA), getrennt vom Kronen-Atlas. */
export const TREE_COMPOSITE_MAX_BYTES = 16 * 1024 * 1024;
/** Höchstens so viele Aufbauten je Zeitfenster (≈ Frame); alle anderen Objekte zeichnen direkt. */
export const TREE_COMPOSITE_PER_FRAME = 12;
/** Länge des Zeitfensters in ms (ein Frame bei 60 Hz). */
export const TREE_COMPOSITE_WINDOW_MS = 16;
/** Ein Gesamtbild über dieser Grösse (Bytes) lohnt nicht und wird nie gebaut. */
const COMPOSITE_ITEM_MAX_BYTES = 1024 * 1024;

interface Composite {
  canvas: HTMLCanvasElement;
  /** Ecke des Gesamtbilds relativ zum Fusspunkt der Objektkachel (Weltpixel). */
  rx: number;
  ry: number;
  bytes: number;
  step: number;
  fern: boolean;
  /** Zeichenliste, aus der es gebaut ist; ein neues Listenobjekt macht es ungültig. */
  list: DrawEntry[];
  used: number;
  /** Zeitfenster, in dem zuletzt die Atlas-Sprites der Liste als benutzt vermerkt wurden. */
  touch: number;
}
/** Sprites eines Gesamtbilds werden höchstens alle so viele Zeitfenster (≈ Frames) als benutzt vermerkt. */
const COMPOSITE_TOUCH_WINDOWS = 30;
/** Die Uhr wird nur bei jedem so vielten `compositeFor`-Aufruf gelesen (ein Frame hat ~500 Aufrufe). */
export const TREE_CLOCK_EVERY = 16;
let clockTick = 0;
const composites = new Map<TreeItem, Composite>();
let compositeBytes = 0;
/** Zeitfenster-Nummer und Aufbauten darin. */
let windowNo = 0;
let windowStart = -Infinity;
let windowBuilds = 0;
let clock: () => number = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();
/** Test: Uhr für das Aufbau-Budget. */
export function setTreeClock(fn: () => number): void {
  clock = fn;
  windowStart = -Infinity;
  clockTick = 0;
}
/** Dev/Test: Anzahl und Bytes der Gesamtbilder. */
export const treeCompositeCount = (): number => composites.size;
export const treeCompositeBytes = (): number => compositeBytes;

function dropComposite(item: TreeItem, c: Composite): void {
  composites.delete(item);
  compositeBytes -= c.bytes;
}
function compositeEvict(need: number): boolean {
  if (compositeBytes + need <= TREE_COMPOSITE_MAX_BYTES) return true; // Platz da: nichts verdrängen
  if (need > TREE_COMPOSITE_MAX_BYTES) return false;
  const order = [...composites.entries()]
    .filter(([, c]) => c.used !== windowNo)
    .sort((a, b) => a[1].used - b[1].used);
  for (const [k, c] of order) {
    if (compositeBytes + need <= TREE_COMPOSITE_MAX_BYTES * 0.9) break;
    dropComposite(k, c);
  }
  return compositeBytes + need <= TREE_COMPOSITE_MAX_BYTES;
}

/** Gesamtbild des Objekts, wenn vorhanden oder jetzt baubar; sonst null (dann direkt zeichnen). */
function compositeFor(item: TreeItem, d: DrawRec, step: number, fern: boolean): Composite | null {
  if (clockTick++ % TREE_CLOCK_EVERY === 0) {
    const now = clock();
    if (now - windowStart >= TREE_COMPOSITE_WINDOW_MS || now < windowStart) {
      windowStart = now;
      windowNo++;
      windowBuilds = 0;
    }
  }
  d.n++;
  const hit = composites.get(item);
  if (hit) {
    if (hit.list === d.list && hit.step === step && hit.fern === fern) {
      hit.used = windowNo;
      return hit;
    }
    dropComposite(item, hit);
  }
  if (d.skip || d.n < 2 || windowBuilds >= TREE_COMPOSITE_PER_FRAME) return null;
  // Riesenbaum und verdrängte Sprites: direkt zeichnen
  let parts = 0;
  for (const e of d.list) {
    if (e.f ? fern : e.s !== null) {
      if (e.s && !e.s.alive) return null;
      parts++;
    } else if (!e.f && e.s === null && e.c) {
      d.skip = true;
      return null;
    }
  }
  if (parts < 2) {
    d.skip = true;
    return null;
  }
  const b = treeBounds(item);
  const o = project(item.fp.x, item.fp.y);
  const rx = b.x - o.x,
    ry = b.y - o.y;
  const w = Math.max(1, Math.ceil(b.w * step)),
    h = Math.max(1, Math.ceil(b.h * step));
  const bytes = w * h * 4;
  if (bytes > COMPOSITE_ITEM_MAX_BYTES) {
    d.skip = true;
    return null;
  }
  if (!compositeEvict(bytes)) return null;
  const canvas = makeCanvas();
  canvas.width = w;
  canvas.height = h;
  const cx = canvas.getContext('2d');
  if (!cx) {
    d.skip = true;
    return null;
  }
  for (const e of d.list) {
    const img = e.f ? (fern ? e.f : null) : e.s ? e.s.canvas : null;
    if (!img) continue;
    cx.drawImage(
      img,
      Math.round((e.x - rx) * step),
      Math.round((e.y - ry) * step),
      Math.round(e.w * step),
      Math.round(e.h * step),
    );
  }
  windowBuilds++;
  const c: Composite = {
    canvas,
    rx,
    ry,
    bytes,
    step,
    fern,
    list: d.list,
    used: windowNo,
    touch: windowNo,
  };
  composites.set(item, c);
  compositeBytes += bytes;
  return c;
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
  /** Farnbüschel (L6 B2): Canvas aus dem Farn-Cache; dann sind `s` und `c` null. */
  f?: HTMLCanvasElement;
  c: Crown | null;
  x: number;
  y: number;
  w: number;
  h: number;
}
type DrawRec = {
  step: number;
  seed: number;
  gen: number;
  n: number;
  skip?: boolean;
  list: DrawEntry[];
};
const drawOf = new WeakMap<TreeItem, DrawRec>();
function drawList(item: TreeItem, step: number, seed: number): DrawRec {
  const list: DrawEntry[] = [];
  // Farnbüschel nach Tiefe zwischen die Kronen (beide Listen sind nach cx + cy geordnet)
  const ferns = itemFerns(item, seed);
  let fi = 0;
  const pushFerns = (depth: number): void => {
    for (; fi < ferns.length && ferns[fi]!.cx + ferns[fi]!.cy <= depth; fi++) {
      const t = ferns[fi]!;
      const canvas = fernFor(seed, t.form, step);
      if (!canvas) continue;
      list.push({
        s: null,
        c: null,
        f: canvas,
        x: (t.cx - t.cy) * (ISO_W / 2) - FERN_BOX.cx,
        y: (t.cx + t.cy) * (ISO_H / 2) - FERN_BOX.cy,
        w: canvas.width / step,
        h: canvas.height / step,
      });
    }
  };
  for (const c of item.crowns) {
    pushFerns(c.cx + c.cy);
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
  pushFerns(Infinity);
  return { step, seed, gen: atlasGen, n: 0, list };
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
  // Farn (L6 B2): die vordere Hälfte jeder Lichtungskachel samt Büschelfläche
  for (const t of item.ferns ?? [])
    for (const [u, v] of [
      [0.5, 0.5],
      [0.95, 0.5],
      [0.5, 0.95],
      [0.95, 0.95],
    ] as const) {
      const p = project(t.x + u - item.fp.x, t.y + v - item.fp.y);
      x0 = Math.min(x0, p.x - FERN_BOX.cx);
      x1 = Math.max(x1, p.x - FERN_BOX.cx + FERN_BOX.w);
      y0 = Math.min(y0, p.y - FERN_BOX.cy);
      y1 = Math.max(y1, p.y - FERN_BOX.cy + FERN_BOX.h);
    }
  if (!Number.isFinite(x0)) {
    // ohne Krone und Farn: die Kachelmitte (relativ zur Objektecke)
    const c = project(0.5, 0.5);
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
