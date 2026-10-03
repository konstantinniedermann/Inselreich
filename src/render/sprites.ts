import { BUILDING_DEFS } from '../sim/defs/buildings';
import { LEVELS } from '../sim/defs/levels';
import type { Building, BuildingDef, BuildingDefId, Category, World } from '../sim/types';
import { hash2 } from '../sim/noise';
import { tileAt } from '../sim/world';
import { worldToScreen, type Camera } from './camera';
import { ISO_H, bodyHeight, project, setBodyShapes, spriteBounds, type Pt } from './iso';
import { PALETTE, rgbOfCss } from './palette';
import { VARIANT_LOOKS, keepSaturation, type Mix } from './variants';

/** Mischt zwei CSS-Farben (`#rrggbb` oder `rgb(r,g,b)`, also auch bereits gemischte Töne). */
function mixHex(a: string, b: string, t: number): string {
  const p = rgbOfCss(a),
    q = rgbOfCss(b),
    k = Math.min(1, Math.max(0, t));
  return `rgb(${p.map((v, i) => Math.round(v + (q[i]! - v) * k)).join(',')})`;
}

const OUTLINE = 'rgba(0,0,0,0.6)';
/** Einzug des Grundrisses je Seite in Kacheln (ISO 7.1: höchstens 0,1; Grundriss ≥ 64 % der Raute). */
export const BODY_INSET = 0.08;
/** Schattenlänge je Höhe (Darstellungswert, ISO D-11; `lead-art` justiert ihn im Slice über AK-ISO-13). */
export const SHADOW_K = 0.4;
const GHOST_ALPHA = 0.5; // Bauvorschau (D-13)
const SHADOW_DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) }; // Kachelraum, nach rechts unten im Bild
/** Umrisslinie der Slice-Körper (aus der Palette abgeleitet, keine Signalfarbe). */
export const EDGE = mixHex(PALETTE.wallTimber, '#000000', 0.55);
const SMOKE_PERIOD_MS = 1500;
const SMOKE_PUFFS = 3;
const SMOKE_ORIGIN = { x: 0.7, y: 0.32 }; // Anteil der Bildbox
/** Farben der Luft-Ebene (ISO 7.1): eigene, aus der Palette gemischte Töne, die kein Körper verwendet. */
export const AIR_COLORS = {
  /** Rauch als `r,g,b` für `rgba(…)`. */
  smoke: rgbOfCss(mixHex(PALETTE.rock, PALETTE.wallLime, 0.3)).join(','),
  /** Flaggentuch des Kontors (`wallLime` ist auch Wandfarbe, deshalb eigener Ton). */
  cloth: mixHex(PALETTE.wallLime, '#ffffff', 0.35),
  pole: mixHex(PALETTE.rockDark, '#000000', 0.3),
} as const;
const SMOKE_ALPHA = 0.4;

export interface BoxColors {
  left: string;
  right: string;
  top: string;
}
/** Footprint-lokale Koordinaten (u, v in Kacheln, z in Weltpixeln über dem Boden) → Bildpunkte. */
/** Umgebung, die der Renderer einem Körper mitgibt (aus der Welt gelesen; ohne Angabe gilt der Standard). */
export interface BodyEnv {
  /** Wasser an der Seite +v (vorn links), +u (vorn rechts), −u (hinten links) bzw. −v (hinten rechts) des Kontors. */
  waterLeft?: boolean;
  waterRight?: boolean;
  waterU0?: boolean;
  waterV0?: boolean;
}
export type SilhouetteFn = (p: IsoPainter, b: Building) => void;

export class IsoPainter {
  /** Umrissfarbe der Polygone. */
  edge: string = OUTLINE;
  env: BodyEnv = {};
  /** Hüllenhöhe des Körpers (für den Kategorie-Fallback, der keine eigene Höhe kennt). */
  height = 0;
  /** Variante (H-R7): verschiebt nur Töne und Zubehör, nie den Umriss; 0 = bisheriger Look. */
  variant = 0;
  private tones = new Map<string, string>();
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly cam: Camera,
    readonly ox: number,
    readonly oy: number,
    readonly w: number,
    readonly h: number,
  ) {}

  pt(u: number, v: number, z = 0): Pt {
    const p = project(this.ox + u, this.oy + v);
    return worldToScreen(this.cam, { x: p.x, y: p.y - z });
  }

  /** Farbe mit der Mischung `mix` der Variante; ohne Mischung unverändert. */
  tone(color: string, mix: Mix | null): string {
    if (!mix) return color;
    const k = `${color}|${mix[0]}|${mix[1]}`;
    let c = this.tones.get(k);
    if (c === undefined)
      this.tones.set(k, (c = keepSaturation(color, mixHex(color, mix[0], mix[1]))));
    return c;
  }
  get look() {
    return VARIANT_LOOKS[this.variant] ?? VARIANT_LOOKS[0]!;
  }

  poly(pts: readonly [number, number, number][], fill: string, outline = true): void {
    const { ctx } = this;
    fill = this.tone(fill, this.look.wall);
    ctx.beginPath();
    pts.forEach(([u, v, z], i) => {
      const p = this.pt(u, v, z);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = this.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  quad(
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    fill: string,
    outline = true,
  ): void {
    this.poly([a, b, c, d], fill, outline);
  }

  line(a: [number, number, number], b: [number, number, number], color: string): void {
    const { ctx } = this;
    const p = this.pt(...a),
      q = this.pt(...b);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * Quader über dem Footprint. Der Grundriss ist je Seite um `inset` Kachel eingezogen; die Wandhöhe wächst um
 * `inset·ISO_H`, damit die Dachecke oben die Hüllenoberkante trifft (`height` = Höhe über der oberen Ecke).
 */
export function isoBox(p: IsoPainter, height: number, colors: BoxColors, inset = BODY_INSET): void {
  const z = height + inset * ISO_H;
  const [u0, v0, u1, v1] = [inset, inset, p.w - inset, p.h - inset];
  p.quad([u0, v1, 0], [u1, v1, 0], [u1, v1, z], [u0, v1, z], colors.left); // vorn links
  p.quad([u1, v0, 0], [u1, v1, 0], [u1, v1, z], [u1, v0, z], colors.right); // vorn rechts
  p.quad([u0, v0, z], [u1, v0, z], [u1, v1, z], [u0, v1, z], colors.top); // Dach
}

// --- Slice-Körper (Spec 5.5, ISO 7.1): Wohnhaus (3 Stufen), Kontor, Holzfäller ---
// Hüllenregel: ein Punkt (u, v, z) liegt in `bodyHull`, wenn 0 ≤ u ≤ w, 0 ≤ v ≤ h und
// z ≤ H + ISO_H · min(u, v) (obere Hüllenkante, gemessen über der oberen Ecke des vollen Footprints, D-12).

export interface WallColors {
  left: string;
  right: string;
}
/** Linke Wand hell, rechte im Schatten (Luma links ≥ 1,1 · rechts, ISO 7.1). */
export const wallColors = (wall: string): WallColors => ({
  left: wall,
  right: mixHex(wall, '#000000', 0.18),
});
const roofColors = (roof: string): { light: string; shade: string } => ({
  light: mixHex(roof, '#ffffff', 0.18),
  shade: mixHex(roof, '#000000', 0.18),
});

/** Quader mit Dach über dem eingezogenen Grundriss; `wz` Traufhöhe, `zr` First- bzw. Spitzenhöhe. */
interface Shell {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  um: number;
  vm: number;
  wz: number;
  zr: number;
  kind: 'gable' | 'hip';
  /** Firstrichtung bei `gable`: entlang u oder entlang v. */
  axis: 'u' | 'v';
}
function makeShell(
  p: IsoPainter,
  wz: number,
  zr: number,
  kind: Shell['kind'],
  axis: Shell['axis'],
  v1 = p.h - BODY_INSET,
): Shell {
  const [u0, v0, u1] = [BODY_INSET, BODY_INSET, p.w - BODY_INSET];
  return { u0, u1, v0, v1, um: (u0 + u1) / 2, vm: (v0 + v1) / 2, wz, zr, kind, axis };
}

/** Obergrenze der Hülle über (u, v) bei Hüllenhöhe `h` (D-12): `h + ISO_H · min(u, v)`. */
const cap = (h: number, u: number, v: number): number => h + ISO_H * Math.min(u, v);

/** Hülle mit beliebigem Grundriss (Teilgebäude, Anbauten); der Rest wie `makeShell`. */
function shellAt(
  [u0, v0, u1, v1]: readonly [number, number, number, number],
  wz: number,
  zr: number,
  kind: Shell['kind'],
  axis: Shell['axis'],
): Shell {
  return { u0, u1, v0, v1, um: (u0 + u1) / 2, vm: (v0 + v1) / 2, wz, zr, kind, axis };
}

/** Quader mit linker (+v), rechter (+u) Wand und Deckfläche; Oberseite 12 % heller als die Wandfarbe. */
function cuboid(
  p: IsoPainter,
  [u0, v0, u1, v1]: readonly [number, number, number, number],
  z0: number,
  z1: number,
  wall: WallColors,
  top: string = mixHex(wall.left, '#ffffff', 0.12),
  outline = true,
): void {
  p.quad([u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1], wall.left, outline);
  p.quad([u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1], wall.right, outline);
  p.quad([u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1], top, outline);
}

/** Dachhöhe über (u, v). */
function roofZ(s: Shell, u: number, v: number): number {
  if (s.kind === 'gable') {
    const half = s.axis === 'u' ? s.vm - s.v0 : s.um - s.u0;
    const d = s.axis === 'u' ? Math.abs(v - s.vm) : Math.abs(u - s.um);
    return s.wz + (s.zr - s.wz) * Math.max(0, 1 - d / half);
  }
  const half = Math.min(s.u1 - s.u0, s.v1 - s.v0) / 2;
  const d = Math.min(u - s.u0, s.u1 - u, v - s.v0, s.v1 - v);
  return s.wz + (s.zr - s.wz) * Math.min(1, Math.max(0, d / half));
}

/** Wände (links hell, rechts im Schatten), Giebeldreieck und Dachflächen; Firstlinie trennt Licht und Schatten. */
function drawShell(p: IsoPainter, s: Shell, wall: WallColors, roof: string): void {
  const { u0, u1, v0, v1, um, vm, wz, zr } = s;
  const r = roofColors(p.tone(roof, p.look.roof));
  p.quad([u0, v1, 0], [u1, v1, 0], [u1, v1, wz], [u0, v1, wz], wall.left);
  p.quad([u1, v0, 0], [u1, v1, 0], [u1, v1, wz], [u1, v0, wz], wall.right);
  if (s.kind === 'gable' && s.axis === 'u') {
    p.poly(
      [
        [u1, v0, wz],
        [u1, v1, wz],
        [u1, vm, zr],
      ],
      wall.right,
    );
    p.quad([u0, v0, wz], [u1, v0, wz], [u1, vm, zr], [u0, vm, zr], r.shade); // hinten
    p.quad([u0, v1, wz], [u1, v1, wz], [u1, vm, zr], [u0, vm, zr], r.light); // vorn
  } else if (s.kind === 'gable') {
    p.poly(
      [
        [u0, v1, wz],
        [u1, v1, wz],
        [um, v1, zr],
      ],
      wall.left,
    );
    p.quad([u0, v0, wz], [u0, v1, wz], [um, v1, zr], [um, v0, zr], r.light); // hinten (Lichtseite)
    p.quad([u1, v0, wz], [u1, v1, wz], [um, v1, zr], [um, v0, zr], r.shade); // vorn
  } else {
    const half = Math.max(0, (u1 - u0 - (v1 - v0)) / 2);
    const [ra, rb] = [um - half, um + half];
    p.quad([u0, v0, wz], [u1, v0, wz], [rb, vm, zr], [ra, vm, zr], r.shade); // hinten
    p.poly(
      [
        [u0, v0, wz],
        [u0, v1, wz],
        [ra, vm, zr],
      ],
      r.light,
    ); // links hinten
    p.quad([u0, v1, wz], [u1, v1, wz], [rb, vm, zr], [ra, vm, zr], r.light); // vorn links
    p.poly(
      [
        [u1, v0, wz],
        [u1, v1, wz],
        [rb, vm, zr],
      ],
      r.shade,
    ); // vorn rechts
  }
}

const leftQuad = (
  p: IsoPainter,
  s: Shell,
  ua: number,
  ub: number,
  za: number,
  zb: number,
  c: string,
) => p.quad([ua, s.v1, za], [ub, s.v1, za], [ub, s.v1, zb], [ua, s.v1, zb], c, false);
const rightQuad = (
  p: IsoPainter,
  s: Shell,
  va: number,
  vb: number,
  za: number,
  zb: number,
  c: string,
) => p.quad([s.u1, va, za], [s.u1, vb, za], [s.u1, vb, zb], [s.u1, va, zb], c, false);

/** Kamin ragt höchstens so weit über das Dach (≤ 0,15 · ISO_H), damit er nicht wie ein Pfosten wirkt. */
export const CHIMNEY_OVER_ROOF = 4.5;
const CHIMNEY_SIZE = 0.11;

/** Lage und Oberkante des Kamins (nahe am First; Oberkante nie über der Hüllenkante). Auch für den Rauch. */
function chimneySpot(s: Shell, h: number): { cu: number; cv: number; top: number } {
  const [cu, cv] =
    s.kind === 'hip' ? [0.3, 0.3] : s.axis === 'u' ? [0.2, s.vm - 0.06] : [s.um - 0.06, 0.2];
  const roof = roofZ(s, cu + CHIMNEY_SIZE / 2, cv + CHIMNEY_SIZE / 2);
  return { cu, cv, top: Math.min(h + ISO_H * Math.min(cu, cv), roof + CHIMNEY_OVER_ROOF) };
}

function chimneyBox(p: IsoPainter, s: Shell, spot: ChimneySpot, color: string): void {
  const { cu, cv, size, top } = spot;
  const base = Math.min(roofZ(s, cu, cv), roofZ(s, cu + size, cv + size));
  const c = wallColors(color);
  p.quad(
    [cu, cv + size, base],
    [cu + size, cv + size, base],
    [cu + size, cv + size, top],
    [cu, cv + size, top],
    c.left,
  );
  p.quad(
    [cu + size, cv, base],
    [cu + size, cv + size, base],
    [cu + size, cv + size, top],
    [cu + size, cv, top],
    c.right,
  );
  p.quad(
    [cu, cv, top],
    [cu + size, cv, top],
    [cu + size, cv + size, top],
    [cu, cv + size, top],
    mixHex(color, '#ffffff', 0.12),
  );
}

function chimney(p: IsoPainter, s: Shell, h: number, color: string): void {
  chimneyBox(p, s, { ...chimneySpot(s, h), size: CHIMNEY_SIZE }, p.tone(color, p.look.chimney));
}

/** Bodenfläche (Hof) unter dem Körper: Raute des Footprints, minimal eingezogen. */
function yard(
  p: IsoPainter,
  color: string,
  u0 = 0.02,
  v0 = 0.02,
  u1 = p.w - 0.02,
  v1 = p.h - 0.02,
): void {
  p.quad([u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0], color, false);
}

/** Fensterläden (Variante): schmale Streifen links und rechts eines Fensters, innerhalb der Wandfläche. */
function shutters(p: IsoPainter, s: Shell, ua: number, ub: number, za: number, zb: number): void {
  const c = p.look.shutters;
  if (!c) return;
  const w = 0.035;
  leftQuad(p, s, ua - w - 0.01, ua - 0.01, za, zb, c);
  leftQuad(p, s, ub + 0.01, ub + w + 0.01, za, zb, c);
}

const WINDOW = mixHex(PALETTE.roofSlate, '#000000', 0.4);
const DOOR = mixHex(PALETTE.wallTimber, '#000000', 0.25);

/** Hülle des Wohnhauses je Stufe (Silhouette und Kamin des Herdrauchs teilen sie). */
function houseShell(p: IsoPainter, b: Building): Shell {
  const tier = b.house?.tier ?? 1;
  const h = bodyHeight(BUILDING_DEFS.house, b);
  const zr = h + ISO_H * BODY_INSET; // Firstende genau auf der Hüllenkante
  if (tier === 1) return makeShell(p, 0.5 * h, h + 0.5 * ISO_H, 'hip', 'u'); // Spitze genau auf der Hüllenkante
  return tier === 2
    ? makeShell(p, 0.62 * h, zr, 'gable', 'u')
    : makeShell(p, 0.6 * h, zr, 'gable', 'v');
}

/** Fensterreihen des Kaufmannshauses als Anteile der Traufhöhe (Zeichnung und Fensteranker teilen sie). */
const MERCHANT_ROWS: readonly (readonly [number, number])[] = [
  [0.14, 0.34],
  [0.48, 0.66],
  [0.78, 0.95],
];
/** Fenster links (Strassenseite) je Reihe; die mittlere Tür im Erdgeschoss ersetzt dort das Mittelfenster. */
const MERCHANT_LEFT: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0.16, 0.28],
    [0.68, 0.8],
  ],
  [
    [0.16, 0.28],
    [0.44, 0.56],
    [0.68, 0.8],
  ],
  [
    [0.16, 0.28],
    [0.44, 0.56],
    [0.68, 0.8],
  ],
];
const MERCHANT_RIGHT: readonly (readonly [number, number])[] = [
  [0.2, 0.32],
  [0.62, 0.74],
];
/** Treppengiebel: drei Stufen je Seite plus Spitzenstufe in Wandebene v = `s.v1`, darüber Ladeluke und Kranbalken. */
function stepGable(p: IsoPainter, s: Shell, wall: WallColors): void {
  const half = s.um - s.u0;
  const mid = 0.09; // halbe Breite der Spitzenstufe
  const n = 3;
  const dw = (half - mid) / n;
  const top = (u: number): number => roofZ(s, u, s.vm);
  const left: [number, number, number][] = [[s.u0, s.v1, s.wz]];
  for (let k = 0; k < n; k++) {
    const z = top(s.u0 + (k + 1) * dw);
    left.push([s.u0 + k * dw, s.v1, z], [s.u0 + (k + 1) * dw, s.v1, z]);
  }
  const right = left
    .slice(1)
    .map(([u, v, z]): [number, number, number] => [2 * s.um - u, v, z])
    .reverse();
  p.poly(
    [...left, [s.um - mid, s.v1, s.zr], [s.um + mid, s.v1, s.zr], ...right, [s.u1, s.v1, s.wz]],
    wall.left,
  );
  // Gesims-Kappen entlang der Stufenkanten
  const cap = wallColors(PALETTE.wallStone).left;
  for (let k = 0; k < n; k++) {
    const z = top(s.u0 + (k + 1) * dw);
    leftQuad(p, s, s.u0 + k * dw, s.u0 + (k + 1) * dw, z - 1.6, z, cap);
    leftQuad(p, s, 2 * s.um - (s.u0 + (k + 1) * dw), 2 * s.um - (s.u0 + k * dw), z - 1.6, z, cap);
  }
  leftQuad(p, s, s.um - mid, s.um + mid, s.zr - 1.6, s.zr, cap);
  // Ladeluke (dunkel) mit Kranbalken darüber, der nach vorn auskragt
  const z0 = s.wz + 3;
  leftQuad(p, s, s.um - 0.07, s.um + 0.07, z0, z0 + 10, DOOR);
  const beam = wallColors(PALETTE.wallTimber);
  cuboid(
    p,
    [s.um - 0.02, s.v1, s.um + 0.02, s.v1 + 0.07],
    s.zr - 6,
    s.zr - 3.5,
    beam,
    beam.left,
    false,
  );
}

/** Mündung des Hauskamins in Bildpunkten (Herdrauch, Spec 5.6); null für andere Typen. */
export function hearthAnchor(def: BuildingDef, b: Building, cam: Camera): Pt | null {
  if (def.id !== 'house') return null;
  const p = new IsoPainter(
    null as unknown as CanvasRenderingContext2D,
    cam,
    b.x,
    b.y,
    def.w,
    def.h,
  );
  const spot = chimneySpot(houseShell(p, b), bodyHeight(def, b));
  return p.pt(spot.cu + CHIMNEY_SIZE / 2, spot.cv + CHIMNEY_SIZE / 2, spot.top);
}

function houseBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.house;
  const tier = b.house?.tier ?? 1;
  const h = bodyHeight(def, b);
  yard(p, mixHex(PALETTE.grass, PALETTE.earth, 0.45));
  const s = houseShell(p, b);
  if (tier === 1) {
    // Hütte: Lehmwand, Strohdach (Walmdach)
    drawShell(p, s, wallColors(mixHex(PALETTE.wallLime, PALETTE.earth, 0.4)), PALETTE.roofThatch);
    leftQuad(p, s, 0.42, 0.58, 0, 0.36 * s.wz, DOOR);
    rightQuad(p, s, 0.4, 0.6, 0.4 * s.wz, 0.75 * s.wz, WINDOW);
    chimney(p, s, h, PALETTE.wallStone);
  } else if (tier === 2) {
    // Fachwerk auf Kalkputz, Terrakotta-Satteldach (First entlang u)
    const w = wallColors(PALETTE.wallLime);
    const t = wallColors(PALETTE.wallTimber);
    drawShell(p, s, w, PALETTE.roofTerracotta);
    for (const u of [0.18, 0.5, 0.82]) leftQuad(p, s, u - 0.025, u + 0.025, 0, s.wz, t.left);
    for (const v of [0.18, 0.5, 0.82]) rightQuad(p, s, v - 0.025, v + 0.025, 0, s.wz, t.right);
    leftQuad(p, s, s.u0, s.u1, 0.47 * s.wz, 0.47 * s.wz + 2, t.left);
    rightQuad(p, s, s.v0, s.v1, 0.47 * s.wz, 0.47 * s.wz + 2, t.right);
    leftQuad(p, s, 0.28, 0.4, 0.1, 0.6 * s.wz, DOOR);
    leftQuad(p, s, 0.6, 0.74, 0.5 * s.wz, 0.82 * s.wz, WINDOW);
    shutters(p, s, 0.6, 0.74, 0.5 * s.wz, 0.82 * s.wz);
    chimney(p, s, h, PALETTE.wallStone);
  } else if (tier === 3) {
    // Bürgerhaus: Steinwand, dunkler Ziegel, zwei Geschosse, Gaube (First entlang v)
    const w = wallColors(PALETTE.wallStone);
    drawShell(p, s, w, PALETTE.roofTerracottaDark);
    leftQuad(
      p,
      s,
      s.u0,
      s.u1,
      0.5 * s.wz,
      0.5 * s.wz + 2,
      mixHex(PALETTE.wallStone, '#000000', 0.3),
    );
    rightQuad(p, s, s.v0, s.v1, 0.5 * s.wz, 0.5 * s.wz + 2, mixHex(w.right, '#000000', 0.3));
    leftQuad(p, s, 0.3, 0.42, 0.04, 0.44 * s.wz, DOOR);
    leftQuad(p, s, 0.6, 0.72, 0.1, 0.4 * s.wz, WINDOW);
    leftQuad(p, s, 0.6, 0.72, 0.58 * s.wz, 0.9 * s.wz, WINDOW);
    rightQuad(p, s, 0.22, 0.34, 0.58 * s.wz, 0.9 * s.wz, WINDOW);
    rightQuad(p, s, 0.66, 0.78, 0.58 * s.wz, 0.9 * s.wz, WINDOW);
    shutters(p, s, 0.6, 0.72, 0.1, 0.4 * s.wz);
    shutters(p, s, 0.6, 0.72, 0.58 * s.wz, 0.9 * s.wz);
    // Gaube auf der Schattenseite (vorn rechts)
    const ud = 0.74,
      z0 = roofZ(s, ud + 0.06, 0.5),
      z1 = z0 + 0.3 * ISO_H;
    p.quad([ud, 0.36, z0], [ud, 0.64, z0], [ud, 0.64, z1], [ud, 0.36, z1], w.right);
    p.quad(
      [ud, 0.42, z0 + 2],
      [ud, 0.58, z0 + 2],
      [ud, 0.58, z1 - 2],
      [ud, 0.42, z1 - 2],
      WINDOW,
      false,
    );
    p.poly(
      [
        [ud, 0.34, z1],
        [ud, 0.66, z1],
        [ud, 0.5, z1 + 0.22 * ISO_H],
      ],
      roofColors(PALETTE.roofTerracottaDark).shade,
    );
    chimney(p, s, h, PALETTE.wallStone);
  } else {
    // Kaufmannshaus: hanseatisches Giebelhaus, Putzwand auf Steinsockel, Kupferdach, Treppengiebel zur Strasse
    const w = wallColors(PALETTE.wallLime);
    const stone = wallColors(PALETTE.wallStone);
    drawShell(p, s, w, PALETTE.roofCopper);
    chimney(p, s, h, PALETTE.wallStone);
    stepGable(p, s, w);
    leftQuad(p, s, s.u0, s.u1, 0, 4, stone.left); // Sockel
    rightQuad(p, s, s.v0, s.v1, 0, 4, stone.right);
    for (const f of [0.4, 0.72]) {
      leftQuad(p, s, s.u0, s.u1, f * s.wz, f * s.wz + 2, stone.left); // Gesimse
      rightQuad(p, s, s.v0, s.v1, f * s.wz, f * s.wz + 2, stone.right);
    }
    leftQuad(p, s, 0.4, 0.56, 4, 0.37 * s.wz, DOOR);
    for (const x of merchantWindows(s.wz)) {
      (x.wall === 'left' ? leftQuad : rightQuad)(p, s, x.a0, x.a1, x.z0, x.z1, WINDOW);
    }
  }
}

function kontorBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.kontor;
  const h = bodyHeight(def, b);
  yard(p, mixHex(PALETTE.rock, PALETTE.sandDry, 0.45));
  // Hintere Kaimauern zuerst: der Körper überdeckt sie, sichtbar bleibt der Rand links und rechts
  const back = wallColors(PALETTE.rockDark);
  const backTop = mixHex(PALETTE.rock, '#ffffff', 0.1);
  if (p.env.waterU0 === true) {
    p.quad([0, 0, 0], [0, p.h, 0], [0, p.h, 5], [0, 0, 5], back.right);
    p.quad([0, 0, 5], [0.22, 0, 5], [0.22, p.h, 5], [0, p.h, 5], backTop, false);
  }
  if (p.env.waterV0 === true) {
    p.quad([0, 0, 0], [p.w, 0, 0], [p.w, 0, 5], [0, 0, 5], back.left);
    p.quad([0, 0, 5], [p.w, 0, 5], [p.w, 0.22, 5], [0, 0.22, 5], backTop, false);
  }
  const s = makeShell(p, 0.56 * h, h + ISO_H * BODY_INSET, 'gable', 'u');
  const w = wallColors(PALETTE.wallStone);
  drawShell(p, s, w, PALETTE.roofTimber);
  // Tor und Ladeluke, Balken
  leftQuad(p, s, 0.7, 1.3, 0, 0.55 * s.wz, DOOR);
  leftQuad(p, s, 0.95, 1.05, 0, 0.55 * s.wz, wallColors(PALETTE.wallTimber).left);
  leftQuad(p, s, 1.5, 1.7, 0.45 * s.wz, 0.8 * s.wz, WINDOW);
  leftQuad(p, s, 0.45, 0.55, 0.3 * s.wz, 0.62 * s.wz, LAMP); // Laterne (leuchtet immer)
  rightQuad(p, s, 0.5, 0.8, 0.4 * s.wz, 0.8 * s.wz, WINDOW);
  rightQuad(p, s, 1.2, 1.5, 0.4 * s.wz, 0.8 * s.wz, WINDOW);
  // Kistenstapel (Hof) vor der linken Wand
  const crate = wallColors(PALETTE.roofWood);
  for (const [u, z, c] of [
    [0.2, 0, crate.left],
    [0.45, 0, crate.left],
    [0.2, 6, crate.left],
    [0.32, 12, mixHex(PALETTE.roofWood, '#ffffff', 0.15)],
  ] as const) {
    const q = u + 0.22;
    p.quad([u, s.v1, z], [q, s.v1, z], [q, s.v1, z + 6], [u, s.v1, z + 6], c);
    p.quad(
      [u, s.v1, z + 6],
      [q, s.v1, z + 6],
      [q, s.v1 - 0.05, z + 6],
      [u, s.v1 - 0.05, z + 6],
      mixHex(PALETTE.roofWood, '#ffffff', 0.25),
      false,
    );
  }
  // Kaimauer an jeder Wasserseite; ohne Wasser keine Mauer (kein Fallback auf die Landseite)
  const { waterLeft, waterRight } = p.env;
  const mauer = wallColors(PALETTE.rockDark);
  const top = mixHex(PALETTE.rock, '#ffffff', 0.1);
  if (waterLeft === true) {
    p.quad([s.u0, s.v1, 0], [s.u1, s.v1, 0], [s.u1, s.v1, 5], [s.u0, s.v1, 5], mauer.left);
    p.quad(
      [s.u0, s.v1 - 0.14, 5],
      [s.u1, s.v1 - 0.14, 5],
      [s.u1, s.v1, 5],
      [s.u0, s.v1, 5],
      top,
      false,
    );
  }
  if (waterRight === true) {
    p.quad([s.u1, s.v0, 0], [s.u1, s.v1, 0], [s.u1, s.v1, 5], [s.u1, s.v0, 5], mauer.right);
    p.quad(
      [s.u1 - 0.14, s.v0, 5],
      [s.u1, s.v0, 5],
      [s.u1, s.v1, 5],
      [s.u1 - 0.14, s.v1, 5],
      top,
      false,
    );
  }
}

const lumberjackShell = (p: IsoPainter, h: number): Shell =>
  makeShell(p, 0.5 * h, h + ISO_H * BODY_INSET, 'gable', 'v');

/** Lage, Kantenlänge und Oberkante eines Kamins in Footprint-Koordinaten. */
interface ChimneySpot {
  cu: number;
  cv: number;
  size: number;
  top: number;
}
/** Kamine der Typen, deren Rauch dort aufsteigt (die Silhouette zeichnet sie an derselben Stelle). */
const CHIMNEY_SPOTS: Partial<Record<BuildingDefId, (p: IsoPainter, h: number) => ChimneySpot>> = {
  lumberjack: (p, h) => ({ ...chimneySpot(lumberjackShell(p, h), h), size: CHIMNEY_SIZE }),
  distillery: (_p, h) => ({ cu: 0.25, cv: 0.4, size: 0.2, top: cap(h, 0.25, 0.4) }),
  toolmaker: (_p, h) => ({ cu: 0.3, cv: 0.35, size: 0.22, top: cap(h, 0.3, 0.35) }),
  // Schlot des Glasofens (Rauch steigt dort auf)
  glassworks: () => ({
    cu: GLASS_CONE.uc - 0.05,
    cv: GLASS_CONE.vc - 0.05,
    size: 0.1,
    top: GLASS_CONE.top,
  }),
};

/** Mündung des Kamins in Bildpunkten (Rauch steigt dort auf); null für Typen ohne eigenen Kamin. */
export function chimneyAnchor(def: BuildingDef, b: Building, cam: Camera): Pt | null {
  const spot = CHIMNEY_SPOTS[def.id];
  if (!spot) return null;
  const p = new IsoPainter(
    null as unknown as CanvasRenderingContext2D,
    cam,
    b.x,
    b.y,
    def.w,
    def.h,
  );
  const { cu, cv, size, top } = spot(p, bodyHeight(def, b));
  return p.pt(cu + size / 2, cv + size / 2, top);
}

function lumberjackBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.lumberjack;
  const h = bodyHeight(def, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.sandDry, 0.4));
  // Sägemehlfleck (vorn, auf dem Hofboden)
  p.quad([0.5, 0.55, 0], [0.96, 0.55, 0], [0.96, 0.96, 0], [0.5, 0.96, 0], PALETTE.sandDry, false);
  const s = lumberjackShell(p, h);
  const timber = mixHex(PALETTE.wallTimber, PALETTE.wallLime, 0.3);
  drawShell(p, s, wallColors(timber), PALETTE.roofWood);
  leftQuad(p, s, 0.58, 0.76, 0, 0.5 * s.wz, DOOR);
  rightQuad(p, s, 0.4, 0.62, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  // Stammstapel vor der linken Wand: drei Lagen
  const log = wallColors(PALETTE.roofWood);
  for (const [u0, u1, z] of [
    [0.12, 0.52, 0],
    [0.12, 0.52, 3.2],
    [0.2, 0.44, 6.4],
  ] as const)
    p.quad(
      [u0, s.v1, z],
      [u1, s.v1, z],
      [u1, s.v1, z + 3],
      [u0, s.v1, z + 3],
      z === 3.2 ? log.right : log.left,
    );
  p.quad(
    [0.12, s.v1, 0],
    [0.16, s.v1, 0],
    [0.16, s.v1, 9.4],
    [0.12, s.v1, 9.4],
    PALETTE.roofTimber,
    false,
  );
  // Hackklotz
  const bl = wallColors(PALETTE.earthEdge);
  p.quad([0.7, 0.86, 0], [0.84, 0.86, 0], [0.84, 0.86, 4], [0.7, 0.86, 4], bl.left, false);
  p.quad([0.84, 0.72, 0], [0.84, 0.86, 0], [0.84, 0.86, 4], [0.84, 0.72, 4], bl.right, false);
  p.quad(
    [0.7, 0.72, 4],
    [0.84, 0.72, 4],
    [0.84, 0.86, 4],
    [0.7, 0.86, 4],
    mixHex(PALETTE.earth, PALETTE.sandDry, 0.5),
    false,
  );
  chimney(p, s, h, PALETTE.rockDark);
}

// --- R2: übrige Typen (Spec 5.5, ISO 7.1). Jede Silhouette liegt in `bodyHull`: Spitzen und Firste
// sitzen genau auf `cap(h, u, v)`, alles andere darunter. Sichtbare Wände mit Fenstern liegen auf den
// eingezogenen Wandebenen (v = H − BODY_INSET links, u = W − BODY_INSET rechts), damit die Fensteranker passen.

const LAMP = mixHex(PALETTE.window, '#000000', 0.5);
const hallWall = (): WallColors => wallColors(mixHex(PALETTE.wallLime, PALETTE.wallStone, 0.5));
const woodWall = (): WallColors => wallColors(mixHex(PALETTE.wallTimber, PALETTE.wallLime, 0.3));
const I = BODY_INSET;

/** Senkrechte Rechteckfläche auf der linken Wandebene (v fest). */
function leftPlane(
  p: IsoPainter,
  v: number,
  ua: number,
  ub: number,
  za: number,
  zb: number,
  c: string,
  outline = false,
): void {
  p.quad([ua, v, za], [ub, v, za], [ub, v, zb], [ua, v, zb], c, outline);
}
/** Senkrechte Rechteckfläche auf der rechten Wandebene (u fest). */
function rightPlane(
  p: IsoPainter,
  u: number,
  va: number,
  vb: number,
  za: number,
  zb: number,
  c: string,
  outline = false,
): void {
  p.quad([u, va, za], [u, vb, za], [u, vb, zb], [u, va, zb], c, outline);
}

/** Pfosten (dünner Quader ohne Umriss). */
function pole(p: IsoPainter, u: number, v: number, z1: number, color: string, w = 0.04): void {
  cuboid(p, [u, v, u + w, v + w], 0, z1, wallColors(color), undefined, false);
}

/** Glockenstuhl bzw. Dachreiter über dem Dach bei (uc, vc): Körper bis zur Hüllenkante, Pyramidendach. */
function cupola(p: IsoPainter, s: Shell, h: number, uc: number, vc: number, size: number): void {
  const [a, b, c, d] = [uc - size / 2, vc - size / 2, uc + size / 2, vc + size / 2];
  const base = Math.min(roofZ(s, a, b), roofZ(s, c, d), roofZ(s, a, d), roofZ(s, c, b));
  const zb = cap(h, a, b);
  const apex = cap(h, uc, vc);
  const wood = wallColors(PALETTE.wallTimber);
  cuboid(p, [a, b, c, d], base, zb, wood, wood.left, true);
  // Schallöffnungen
  const half = size * 0.22;
  leftPlane(p, d, uc - half, uc + half, base + (zb - base) * 0.3, zb - (zb - base) * 0.12, WINDOW);
  rightPlane(p, c, vc - half, vc + half, base + (zb - base) * 0.3, zb - (zb - base) * 0.12, WINDOW);
  const r = roofColors(PALETTE.roofSlate);
  p.poly(
    [
      [a, d, zb],
      [c, d, zb],
      [uc, vc, apex],
    ],
    r.light,
  );
  p.poly(
    [
      [c, b, zb],
      [c, d, zb],
      [uc, vc, apex],
    ],
    r.shade,
  );
}

// Marktplatz: Pflaster, drei Stände mit gestreiften Sonnendächern, Laterne
const STALL_END = 0.15; // Firstende der Stände (Lage des tiefsten Firstpunkts)
function stall(p: IsoPainter, u0: number, v0: number, h: number, goods: readonly string[]): void {
  const u1 = u0 + 0.7,
    v1 = v0 + 0.7,
    vm = (v0 + v1) / 2;
  const zE = 0.7 * h,
    zR = h + ISO_H * STALL_END;
  for (const [pu, pv] of [
    [u0 + 0.02, v0 + 0.02],
    [u1 - 0.06, v0 + 0.02],
  ] as const)
    pole(p, pu, pv, zE, PALETTE.wallTimber);
  cuboid(p, [u0 + 0.06, v1 - 0.3, u1 - 0.06, v1 - 0.08], 0, 7, wallColors(PALETTE.roofWood));
  goods.forEach((g, i) => {
    const gu = u0 + 0.12 + i * 0.17;
    cuboid(p, [gu, v1 - 0.26, gu + 0.12, v1 - 0.12], 7, 10.5, wallColors(g), undefined, false);
  });
  for (const [pu, pv] of [
    [u0 + 0.02, v1 - 0.06],
    [u1 - 0.06, v1 - 0.06],
  ] as const)
    pole(p, pu, pv, zE, PALETTE.wallTimber);
  const stripes = 4;
  for (let i = 0; i < stripes; i++) {
    const ua = u0 + ((u1 - u0) * i) / stripes,
      ub = u0 + ((u1 - u0) * (i + 1)) / stripes;
    const col = i % 2 === 0 ? PALETTE.roofTimber : PALETTE.wallLime;
    const r = roofColors(p.tone(col, p.look.roof));
    p.quad([ua, v0, zE], [ub, v0, zE], [ub, vm, zR], [ua, vm, zR], r.shade, false);
    p.quad([ua, v1, zE], [ub, v1, zE], [ub, vm, zR], [ua, vm, zR], r.light, false);
  }
  p.line([u0, v1, zE], [u1, v1, zE], EDGE);
  p.line([u0, v1, zE], [u0, vm, zR], EDGE);
  p.line([u1, v1, zE], [u1, vm, zR], EDGE);
}

function marketBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.market, b);
  yard(p, mixHex(PALETTE.rock, PALETTE.sandDry, 0.55));
  const joint = mixHex(PALETTE.rockDark, PALETTE.sandDry, 0.45);
  for (const t of [0.6, 1.0, 1.4]) {
    p.line([t, 0.02, 0], [t, p.h - 0.02, 0], joint);
    p.line([0.02, t, 0], [p.w - 0.02, t, 0], joint);
  }
  const crown = mixHex(PALETTE.crownLight, PALETTE.grassLight, 0.4);
  const fruit = mixHex(PALETTE.roofTerracotta, PALETTE.roofThatch, 0.4);
  const cloth = mixHex(PALETTE.wallLime, PALETTE.sandDry, 0.4);
  stall(p, 0.15, 0.15, h, [crown, fruit, cloth]);
  stall(p, 1.0, 0.15, h, [fruit, cloth, crown]);
  stall(p, 0.15, 1.0, h, [cloth, crown, fruit]);
  // Laterne vorn: Pfosten mit Lampe auf der linken Wandebene
  pole(p, 1.82, 1.86, 14, PALETTE.wallTimber, 0.06);
  cuboid(p, [1.78, 1.84, 1.88, 1.92], 14, 24, wallColors(LAMP), undefined, true);
}

// Fischerhütte: Hütte, Netzgestell, kleiner Steg
function fisherBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.fisher, b);
  yard(p, mixHex(PALETTE.sandDry, PALETTE.earth, 0.35));
  // Steg
  const plank = wallColors(PALETTE.roofWood);
  cuboid(p, [0.5, 0.78, 0.95, 0.94], 0, 2.5, plank, mixHex(PALETTE.roofWood, '#ffffff', 0.2));
  for (const u of [0.58, 0.7, 0.82])
    p.line([u, 0.78, 2.5], [u, 0.94, 2.5], mixHex(PALETTE.roofTimber, '#000000', 0.2));
  const s = shellAt([I, I, 0.92, 0.6], 0.5 * h, h + ISO_H * I, 'gable', 'u');
  drawShell(p, s, woodWall(), PALETTE.roofWood);
  leftQuad(p, s, 0.4, 0.58, 0, 0.5 * s.wz, DOOR);
  rightQuad(p, s, 0.2, 0.4, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  // Netzgestell links vorn
  pole(p, 0.1, 0.76, 15, PALETTE.wallTimber);
  pole(p, 0.4, 0.76, 15, PALETTE.wallTimber);
  const net = mixHex(PALETTE.wallLime, PALETTE.rock, 0.45);
  leftPlane(p, 0.78, 0.12, 0.42, 3, 14, net, true);
  for (const u of [0.2, 0.3])
    p.line([u, 0.78, 3], [u, 0.78, 14], mixHex(PALETTE.rockDark, PALETTE.wallLime, 0.5));
  p.line([0.12, 0.78, 8.5], [0.42, 0.78, 8.5], mixHex(PALETTE.rockDark, PALETTE.wallLime, 0.5));
}

// Steinbruch: Felsanschnitt, Blöcke, Kran-Balken, kleiner Unterstand
function quarryBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.quarry, b);
  const zt = h + ISO_H * I;
  yard(p, mixHex(PALETTE.rock, PALETTE.earth, 0.4));
  const rock = wallColors(PALETTE.rock);
  cuboid(p, [I, I, 0.92, 0.38], 0, zt, rock, PALETTE.rockLight);
  cuboid(p, [I, 0.38, 0.5, 0.6], 0, 0.55 * zt, rock, PALETTE.rockLight);
  // Risse im Fels
  const crack = mixHex(PALETTE.rockDark, '#000000', 0.2);
  p.line([0.3, 0.38, 0.75 * zt], [0.42, 0.38, 0.3 * zt], crack);
  p.line([0.65, 0.38, 0.9 * zt], [0.7, 0.38, 0.45 * zt], crack);
  // Blöcke
  const block = wallColors(PALETTE.rockLight);
  cuboid(p, [0.56, 0.44, 0.74, 0.58], 0, 7, block);
  cuboid(p, [0.12, 0.66, 0.3, 0.8], 0, 6, block);
  cuboid(p, [0.34, 0.72, 0.46, 0.84], 0, 4.5, block);
  // Unterstand vorn rechts
  const shed = shellAt([0.58, 0.62, 0.92, 0.92], 0.3 * h, 0.3 * h + 6, 'gable', 'u');
  drawShell(p, shed, woodWall(), PALETTE.roofWood);
  rightQuad(p, shed, 0.7, 0.85, 0.3 * shed.wz, 0.8 * shed.wz, WINDOW);
  // Kran-Balken: Mast und Ausleger mit Seil
  const beam = wallColors(PALETTE.roofTimber);
  cuboid(p, [0.5, 0.5, 0.56, 0.56], 0, zt, beam, undefined, false);
  cuboid(p, [0.2, 0.5, 0.56, 0.54], zt - 3, zt, beam, undefined, false);
  p.line([0.22, 0.54, zt - 3], [0.22, 0.54, 9], mixHex(PALETTE.wallLime, PALETTE.rock, 0.3));
}

// Schäferei: Stall, Koppel mit Zaun, helle Schafpunkte im eigenen Körper-Aufruf (ISO 7.2)
const SHEEP: readonly (readonly [number, number])[] = [
  [0.35, 1.3],
  [0.85, 1.55],
  [1.3, 1.25],
  [1.55, 1.62],
];
function sheepfarmBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.sheepfarm, b);
  yard(p, mixHex(PALETTE.grass, PALETTE.earth, 0.3));
  p.quad(
    [I, 1.05, 0],
    [p.w - I, 1.05, 0],
    [p.w - I, p.h - I, 0],
    [I, p.h - I, 0],
    mixHex(PALETTE.grassLight, PALETTE.grass, 0.5),
    false,
  );
  const s = shellAt([I, I, 1.92, 1.0], 0.5 * h, h + ISO_H * I, 'gable', 'u');
  drawShell(p, s, woodWall(), PALETTE.roofWood);
  leftQuad(p, s, 0.5, 0.9, 0, 0.62 * s.wz, DOOR);
  leftQuad(p, s, 1.2, 1.5, 0.35 * s.wz, 0.7 * s.wz, WINDOW);
  rightQuad(p, s, 0.3, 0.5, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  rightQuad(p, s, 0.62, 0.82, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  // Schafe (hell, Kopf dunkel), von hinten nach vorn
  const wool = wallColors(mixHex(PALETTE.wallLime, PALETTE.rock, 0.12));
  const dark = wallColors(PALETTE.rockDark);
  for (const [u, v] of [...SHEEP].sort((a, c) => a[0] + a[1] - (c[0] + c[1]))) {
    cuboid(p, [u + 0.02, v + 0.02, u + 0.12, v + 0.08], 0, 2, dark, undefined, false);
    cuboid(p, [u, v, u + 0.15, v + 0.11], 2, 6.5, wool, mixHex(PALETTE.wallLime, '#ffffff', 0.2));
    cuboid(p, [u + 0.15, v + 0.02, u + 0.2, v + 0.08], 3, 6, dark, undefined, false);
  }
  // Zaun an den beiden sichtbaren Seiten
  const rail = PALETTE.roofWood;
  for (const u of [0.15, 0.65, 1.15, 1.65]) pole(p, u, 1.86, 7, rail);
  for (const v of [1.1, 1.45, 1.75]) pole(p, 1.86, v, 7, rail);
  pole(p, 1.86, 1.86, 7, rail);
  leftPlane(p, 1.92, 0.15, 1.9, 3.5, 4.8, rail);
  leftPlane(p, 1.92, 0.15, 1.9, 5.5, 6.5, rail);
  rightPlane(p, 1.92, 1.1, 1.9, 3.5, 4.8, rail);
  rightPlane(p, 1.92, 1.1, 1.9, 5.5, 6.5, rail);
}

// Weberei: Haus, Vordach mit Webrahmen, Stoffbahnen
function weaverBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.weaver, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.grass, 0.45));
  const s = shellAt([I, I, 1.92, 1.15], 0.5 * h, h + ISO_H * I, 'gable', 'u');
  drawShell(p, s, hallWall(), PALETTE.roofWood);
  rightQuad(p, s, 0.3, 0.5, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  rightQuad(p, s, 0.65, 0.85, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  leftQuad(p, s, 0.3, 0.55, 0, 0.55 * s.wz, DOOR);
  // Vordach vorn: Pfosten, Webrahmen und Stoffbahnen darunter, dann das Dach
  const zE = 0.34 * h;
  const frame = wallColors(PALETTE.wallTimber);
  cuboid(p, [0.9, 1.45, 1.0, 1.5], 0, 0.28 * h, frame, undefined, false);
  cuboid(p, [1.55, 1.45, 1.65, 1.5], 0, 0.28 * h, frame, undefined, false);
  cuboid(p, [0.9, 1.45, 1.65, 1.5], 0.24 * h, 0.28 * h, frame, undefined, false);
  const cloths = [
    mixHex(PALETTE.roofTerracotta, PALETTE.wallLime, 0.35),
    mixHex(PALETTE.crownLight, PALETTE.wallLime, 0.55),
    mixHex(PALETTE.roofThatch, PALETTE.wallLime, 0.4),
  ];
  cloths.forEach((c, i) => {
    const ua = 1.0 + i * 0.18;
    leftPlane(p, 1.5, ua, ua + 0.14, 0.09 * h, 0.24 * h, c, true);
  });
  for (const [pu, pv] of [
    [0.5, 1.84],
    [1.84, 1.84],
    [1.84, 1.2],
  ] as const)
    pole(p, pu, pv, zE, PALETTE.wallTimber);
  const r = roofColors(PALETTE.roofWood);
  p.quad([0.4, 1.15, 0.5 * h], [1.92, 1.15, 0.5 * h], [1.92, 1.92, zE], [0.4, 1.92, zE], r.light);
}

// Zuckerrohr: Feld in Reihen mit Halmen, kleine Hütte vorn rechts
function canefarmBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.canefarm, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.grass, 0.55));
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    if (i % 2 === 0) continue;
    const va = I + ((p.h - 2 * I) * i) / bands,
      vb = I + ((p.h - 2 * I) * (i + 1)) / bands;
    p.quad([I, va, 0], [p.w - I, va, 0], [p.w - I, vb, 0], [I, vb, 0], PALETTE.grassDark, false);
  }
  const stalk = wallColors(mixHex(PALETTE.crown, PALETTE.grassLight, 0.45));
  const sw = 0.035; // halbe Halmbreite in Kacheln
  const stems: [number, number][] = [];
  for (let v = 0.15; v < 1.8; v += 0.3)
    for (let u = 0.15; u < 1.8; u += 0.3) if (!(u > 1.1 && v > 1.1)) stems.push([u, v]);
  stems.sort((a, c) => a[0] + a[1] - (c[0] + c[1]));
  for (const [u, v] of stems) {
    const z = Math.min(0.75 * ISO_H, cap(h, u - sw, v));
    p.quad([u - sw, v, 0], [u + sw, v, 0], [u + sw, v, z], [u - sw, v, z], stalk.left, false);
    p.quad(
      [u + sw, v - 0.03, 0],
      [u + sw, v + 0.03, 0],
      [u + sw, v + 0.03, z * 0.8],
      [u + sw, v - 0.03, z * 0.8],
      stalk.right,
      false,
    );
  }
  const s = shellAt([1.2, 1.2, 1.92, 1.92], 0.72 * h, 0.72 * h + 8, 'gable', 'u');
  drawShell(p, s, woodWall(), PALETTE.roofWood);
  leftQuad(p, s, 1.6, 1.8, 0, 0.62 * s.wz, DOOR);
  leftQuad(p, s, 1.3, 1.5, 0.3 * s.wz, 0.8 * s.wz, WINDOW);
  rightQuad(p, s, 1.3, 1.5, 0.3 * s.wz, 0.8 * s.wz, WINDOW);
}

// Brennerei: Haus, gemauerter Schornstein, Fässer
function barrel(p: IsoPainter, u: number, v: number): void {
  const wood = wallColors(PALETTE.roofWood);
  cuboid(p, [u, v, u + 0.2, v + 0.2], 0, 11, wood, mixHex(PALETTE.roofWood, '#ffffff', 0.2));
  const band = PALETTE.roofTimber;
  for (const z of [2.5, 7.5]) {
    leftPlane(p, v + 0.2, u, u + 0.2, z, z + 1.2, band);
    rightPlane(p, u + 0.2, v, v + 0.2, z, z + 1.2, band);
  }
}
const distilleryShell = (h: number): Shell =>
  shellAt([I, I, 1.92, 1.15], 0.5 * h, h + ISO_H * I, 'gable', 'u');
function distilleryBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.distillery, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.sandDry, 0.45));
  const s = distilleryShell(h);
  drawShell(p, s, wallColors(PALETTE.wallStone), PALETTE.roofWood);
  leftQuad(p, s, 0.8, 1.2, 0, 0.6 * s.wz, DOOR);
  rightQuad(p, s, 0.3, 0.5, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  rightQuad(p, s, 0.7, 0.9, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  const spot = CHIMNEY_SPOTS.distillery!(p, h);
  chimneyBox(p, s, spot, PALETTE.wallStone);
  for (const [u, v] of [
    [1.45, 1.3],
    [0.3, 1.5],
    [0.75, 1.55],
    [1.5, 1.62],
  ] as const)
    barrel(p, u, v);
}

// Werkzeugmacher: Werkstatt mit Esse, Amboss und Schornstein
function toolmakerBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.toolmaker, b);
  yard(p, mixHex(PALETTE.rockDark, PALETTE.earth, 0.5));
  const s = shellAt([I, I, 1.15, 1.92], 0.5 * h, h + ISO_H * I, 'gable', 'v');
  drawShell(
    p,
    s,
    wallColors(mixHex(PALETTE.wallStone, PALETTE.wallTimber, 0.25)),
    PALETTE.roofWood,
  );
  leftQuad(p, s, 0.62, 0.88, 0, 0.6 * s.wz, DOOR);
  leftQuad(p, s, 0.2, 0.4, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  leftQuad(p, s, 0.95, 1.08, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  chimneyBox(p, s, CHIMNEY_SPOTS.toolmaker!(p, h), PALETTE.rockDark);
  // Amboss auf Holzblock, Kohlehaufen
  cuboid(p, [1.4, 1.35, 1.6, 1.55], 0, 5, wallColors(PALETTE.earthEdge));
  cuboid(p, [1.34, 1.32, 1.66, 1.58], 5, 8, wallColors(PALETTE.rockDark), PALETTE.rock);
  cuboid(p, [1.66, 1.4, 1.78, 1.5], 6, 7.5, wallColors(PALETTE.rockDark), PALETTE.rock, false);
  const coal = wallColors(PALETTE.rockDark);
  cuboid(p, [1.3, 1.7, 1.5, 1.88], 0, 4, coal, PALETTE.rock);
}

// Kapelle: Schieferdach mit Glockenturm (Spitze genau auf der Hüllenkante)
function chapelBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.chapel, b);
  yard(p, mixHex(PALETTE.grass, PALETTE.sandDry, 0.35));
  const stone = wallColors(PALETTE.wallStone);
  // Turm hinten links
  const [tu0, tv0, tu1, tv1] = [I, I, 0.62, 0.62];
  const uc = (tu0 + tu1) / 2;
  const apex = cap(h, uc, uc);
  const zEave = apex - 24;
  cuboid(p, [tu0, tv0, tu1, tv1], 0, zEave, stone, PALETTE.wallStone);
  leftPlane(p, tv1, 0.22, 0.46, zEave - 15, zEave - 5, WINDOW);
  rightPlane(p, tu1, 0.22, 0.46, zEave - 15, zEave - 5, WINDOW);
  const r = roofColors(PALETTE.roofSlate);
  p.poly(
    [
      [tu0, tv1, zEave],
      [tu1, tv1, zEave],
      [uc, uc, apex],
    ],
    r.light,
  );
  p.poly(
    [
      [tu1, tv0, zEave],
      [tu1, tv1, zEave],
      [uc, uc, apex],
    ],
    r.shade,
  );
  // Schiff
  const s = shellAt([I, 0.62, 1.92, 1.92], 0.3 * h, 0.5 * h, 'gable', 'u');
  drawShell(p, s, wallColors(PALETTE.wallLime), PALETTE.roofSlate);
  leftQuad(p, s, 0.3, 0.55, 0, 0.62 * s.wz, DOOR);
  for (const a of [0.75, 1.1, 1.45]) leftQuad(p, s, a, a + 0.15, 0.3 * s.wz, 0.85 * s.wz, WINDOW);
  for (const a of [0.9, 1.3]) rightQuad(p, s, a, a + 0.15, 0.3 * s.wz, 0.85 * s.wz, WINDOW);
}

// Schule: Schieferdach, Glocke über der Tür, Hof mit Bank
function schoolBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.school, b);
  yard(p, mixHex(PALETTE.sandDry, PALETTE.grass, 0.4));
  const s = shellAt([I, I, 1.2, 1.92], 0.5 * h, h + ISO_H * I, 'gable', 'v');
  drawShell(p, s, hallWall(), PALETTE.roofSlate);
  leftQuad(p, s, 0.45, 0.75, 0, 0.6 * s.wz, DOOR);
  leftQuad(p, s, 0.2, 0.34, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  leftQuad(p, s, 0.86, 1.0, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  cupola(p, s, h, s.um, 1.55, 0.2);
  // Bank im Hof
  const bench = wallColors(PALETTE.roofWood);
  cuboid(p, [1.4, 1.6, 1.85, 1.72], 0, 4, bench, undefined, false);
  cuboid(p, [1.4, 1.6, 1.85, 1.64], 4, 8, bench, undefined, false);
  pole(p, 1.38, 1.45, 3, PALETTE.wallTimber, 0.03);
}

// Feuerwache (M6): schmales Wachhaus mit Schieferdach, Glockenstuhl auf dem First, Eimerreihe an der Wand
function firestationBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.firestation, b);
  yard(p, mixHex(PALETTE.rock, PALETTE.sandDry, 0.4));
  const s = makeShell(p, 0.6 * h, h + ISO_H * I, 'gable', 'u');
  drawShell(p, s, hallWall(), PALETTE.roofSlate);
  leftQuad(p, s, 0.5, 0.78, 0, 0.62 * s.wz, DOOR);
  leftQuad(p, s, 0.18, 0.38, 0.45 * s.wz, 0.8 * s.wz, WINDOW);
  rightQuad(p, s, 0.35, 0.6, 0.45 * s.wz, 0.8 * s.wz, WINDOW);
  // Eimerreihe (wallTimber) links neben dem Tor
  const bucket = wallColors(PALETTE.wallTimber);
  for (const u of [0.14, 0.24, 0.34])
    p.quad(
      [u, s.v1, 5],
      [u + 0.07, s.v1, 5],
      [u + 0.07, s.v1, 11],
      [u, s.v1, 11],
      bucket.left,
      false,
    );
  cupola(p, s, h, s.um, s.vm, 0.24);
}

// Amtsstube (M10-R1): breite Halle mit Holzdach und Treppe, auf dem First ein Uhrturm mit Schieferspitze
const CLOCK_FACE = mixHex(PALETTE.wallLime, '#ffffff', 0.5);
const CLOCK_HAND = mixHex(PALETTE.rockDark, '#000000', 0.4);
const TOWNHALL_TOWER = 0.5; // Kantenlänge des Uhrturms in Kacheln
function townhallBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.townhall, b);
  yard(p, mixHex(PALETTE.sandDry, PALETTE.rock, 0.3));
  const s = makeShell(p, 0.45 * h, 0.66 * h, 'gable', 'u');
  drawShell(p, s, wallColors(PALETTE.wallLime), PALETTE.roofWood);
  leftQuad(p, s, 0.82, 1.18, 0, 0.6 * s.wz, DOOR);
  for (const [a0, a1] of [
    [0.22, 0.4],
    [1.6, 1.78],
  ] as const)
    leftQuad(p, s, a0, a1, 0.4 * s.wz, 0.8 * s.wz, WINDOW);
  for (const [a0, a1] of [
    [0.3, 0.45],
    [0.9, 1.05],
    [1.5, 1.65],
  ] as const)
    rightQuad(p, s, a0, a1, 0.4 * s.wz, 0.8 * s.wz, WINDOW);
  // Eingangstreppe
  cuboid(p, [0.8, s.v1, 1.2, s.v1 + 0.06], 0, 4, wallColors(PALETTE.wallStone), undefined, false);
  // Uhrturm auf dem First: Spitze genau auf der Hüllenkante
  const [uc, vc] = [s.um, s.vm];
  const half = TOWNHALL_TOWER / 2;
  const [a, bb, c, d] = [uc - half, vc - half, uc + half, vc + half];
  const apex = cap(h, uc, vc);
  const zEave = apex - 30;
  const base = Math.min(roofZ(s, a, bb), roofZ(s, c, d), roofZ(s, a, d), roofZ(s, c, bb));
  const stone = wallColors(PALETTE.wallStone);
  cuboid(p, [a, bb, c, d], base, zEave, stone, PALETTE.wallStone);
  // Zifferblatt mit Zeigern auf beiden sichtbaren Seiten, darüber die Schallöffnung
  const z0 = zEave - 22,
    z1 = zEave - 9,
    zc = (z0 + z1) / 2;
  leftPlane(p, d, uc - 0.14, uc + 0.14, z0, z1, CLOCK_FACE);
  rightPlane(p, c, vc - 0.14, vc + 0.14, z0, z1, CLOCK_FACE);
  p.line([uc, d, zc], [uc, d, z1 - 2], CLOCK_HAND);
  p.line([uc, d, zc], [uc + 0.08, d, zc], CLOCK_HAND);
  p.line([c, vc, zc], [c, vc, z1 - 2], CLOCK_HAND);
  p.line([c, vc, zc], [c, vc + 0.08, zc], CLOCK_HAND);
  leftPlane(p, d, uc - 0.07, uc + 0.07, zEave - 7, zEave - 2, WINDOW);
  rightPlane(p, c, vc - 0.07, vc + 0.07, zEave - 7, zEave - 2, WINDOW);
  const r = roofColors(PALETTE.roofSlate);
  p.poly(
    [
      [a, d, zEave],
      [c, d, zEave],
      [uc, vc, apex],
    ],
    r.light,
  );
  p.poly(
    [
      [c, bb, zEave],
      [c, d, zEave],
      [uc, vc, apex],
    ],
    r.shade,
  );
}

// --- M8-R1: Glashütte und Badehaus (Drehkörper aus Polygonen) ---

/** Dreht ein Profil [Radius, Höhe] um die Senkrechte bei (uc, vc); nur die zugewandte Hälfte, hinten nach vorn. */
function lathe(
  p: IsoPainter,
  uc: number,
  vc: number,
  rings: readonly (readonly [number, number])[],
  light: string,
  dark: string,
  n = 14,
): void {
  const facets: { a: number; b: number; depth: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n,
      b = (2 * Math.PI * (i + 1)) / n;
    const m = (a + b) / 2;
    const depth = Math.cos(m) + Math.sin(m); // + zum Betrachter (vorn, nach u und v)
    if (depth > -0.35) facets.push({ a, b, depth });
  }
  facets.sort((x, y) => x.depth - y.depth);
  for (const { a, b } of facets) {
    const m = (a + b) / 2;
    const t = 0.5 - (0.5 * (Math.sin(m) - Math.cos(m))) / Math.SQRT2; // links (+v) hell, rechts (+u) dunkel
    const color = mixHex(light, dark, t);
    for (let k = 0; k + 1 < rings.length; k++) {
      const [r0, z0] = rings[k]!;
      const [r1, z1] = rings[k + 1]!;
      p.poly(
        [
          [uc + r0 * Math.cos(a), vc + r0 * Math.sin(a), z0],
          [uc + r0 * Math.cos(b), vc + r0 * Math.sin(b), z0],
          [uc + r1 * Math.cos(b), vc + r1 * Math.sin(b), z1],
          [uc + r1 * Math.cos(a), vc + r1 * Math.sin(a), z1],
        ],
        color,
        false,
      );
    }
  }
}
/** Waagerechte Kreisscheibe als Polygon. */
function disc(
  p: IsoPainter,
  uc: number,
  vc: number,
  r: number,
  z: number,
  color: string,
  outline = false,
): void {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (2 * Math.PI * i) / 14;
    pts.push([uc + r * Math.cos(a), vc + r * Math.sin(a), z]);
  }
  p.poly(pts, color, outline);
}

// Glashütte: Werkhalle rechts, markanter Glasofenkegel links vorn mit glühendem Ofenmaul, Sandhaufen im Hof
const GLASS_CONE = { uc: 0.6, vc: 1.3, top: 63 } as const;
const GLASS_PROFILE: readonly (readonly [number, number])[] = [
  [0.46, 0],
  [0.36, 22],
  [0.27, 44],
  [0.2, 59],
  [0.23, 63],
];
const glassHallShell = (h: number): Shell =>
  shellAt([1.1, I, 1.92, 1.92], 0.42 * h, 0.76 * h, 'gable', 'v');
function glassworksBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.glassworks, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.rockDark, 0.3));
  // Sandhaufen hinten links (zwei Kegel)
  const sand = PALETTE.sandDry;
  for (const [uc, vc, r, z] of [
    [0.55, 0.38, 0.3, 9],
    [0.3, 0.62, 0.2, 6],
  ] as const) {
    const [a, c, d, e] = [uc - r, vc - r, uc + r, vc + r];
    p.poly(
      [
        [a, e, 0],
        [d, e, 0],
        [uc, vc, z],
      ],
      mixHex(sand, '#ffffff', 0.12),
      false,
    );
    p.poly(
      [
        [d, c, 0],
        [d, e, 0],
        [uc, vc, z],
      ],
      mixHex(sand, '#000000', 0.2),
      false,
    );
  }
  // Ofenkegel
  const { uc, vc, top } = GLASS_CONE;
  lathe(
    p,
    uc,
    vc,
    GLASS_PROFILE,
    mixHex(PALETTE.wallStone, PALETTE.rockDark, 0.1),
    mixHex(PALETTE.rockDark, PALETTE.wallStone, 0.25),
  );
  disc(p, uc, vc, 0.23, top, mixHex(PALETTE.wallStone, PALETTE.rockDark, 0.3), true); // Rand
  disc(p, uc, vc, 0.15, top, mixHex(PALETTE.rockDark, '#000000', 0.6)); // offener Schlot
  // Ofenmaul: Bogenöffnung nach vorn links, glühend
  const rAt = (z: number): number => 0.46 - (0.46 - 0.36) * (z / 22);
  const arch = (half: number, z0: number, z1: number, color: string): void => {
    const pt = (da: number, z: number): [number, number, number] => [
      uc + rAt(z) * Math.cos(Math.PI / 2 + da),
      vc + rAt(z) * Math.sin(Math.PI / 2 + da),
      z,
    ];
    p.poly([pt(-half, z0), pt(half, z0), pt(half * 0.7, z1), pt(-half * 0.7, z1)], color, false);
  };
  arch(0.3, 2, 15, mixHex(PALETTE.rockDark, '#000000', 0.5));
  arch(0.21, 2, 12, PALETTE.window);
  // Halle
  const s = glassHallShell(h);
  drawShell(p, s, woodWall(), PALETTE.roofWood);
  leftQuad(p, s, 1.28, 1.52, 0, 0.62 * s.wz, DOOR);
  leftQuad(p, s, 1.65, 1.8, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  rightQuad(p, s, 0.5, 0.7, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  rightQuad(p, s, 1.0, 1.2, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
}

// Badehaus: Kubus mit flacher Kuppel, Säulenportikus vorn, Becken mit Schaumrand im Hof
const BATH_CUBE = { u1: 1.3, v1: 1.3 } as const;
function bathhouseBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.bathhouse, b);
  yard(p, mixHex(PALETTE.sandDry, PALETTE.grass, 0.3));
  // Becken rechts im Hof
  p.quad([1.36, 0.7, 0], [1.88, 0.7, 0], [1.88, 1.82, 0], [1.36, 1.82, 0], PALETTE.foam, false);
  p.quad(
    [1.42, 0.76, 0],
    [1.82, 0.76, 0],
    [1.82, 1.76, 0],
    [1.42, 1.76, 0],
    PALETTE.waterShallow,
    false,
  );
  const wz = 0.75 * h;
  const wall = wallColors(PALETTE.wallStone);
  const lime = wallColors(PALETTE.wallLime);
  const cube = [I, I, BATH_CUBE.u1, BATH_CUBE.v1] as const;
  cuboid(p, cube, 0, wz, wall, mixHex(PALETTE.wallStone, PALETTE.roofSlate, 0.3));
  leftPlane(p, BATH_CUBE.v1, I, BATH_CUBE.u1, wz - 3, wz, lime.left); // Gesims
  rightPlane(p, BATH_CUBE.u1, I, BATH_CUBE.v1, wz - 3, wz, lime.right);
  const dz = 0.18;
  for (const [a, c] of [
    [0.2, 0.32],
    [1.0, 1.12],
  ] as const)
    leftPlane(p, BATH_CUBE.v1, a, c, 0.68 * wz, 0.9 * wz, WINDOW);
  for (const [a, c] of [
    [0.4, 0.6],
    [0.8, 1.0],
  ] as const)
    rightPlane(p, BATH_CUBE.u1, a, c, 0.5 * wz, 0.85 * wz, WINDOW);
  leftPlane(p, BATH_CUBE.v1, 0.5, 0.85, 0, 0.5 * wz, DOOR);
  // Heizungsschornstein hinten links, Oberkante genau auf der Hüllenkante
  cuboid(
    p,
    [0.12, 0.12, 0.23, 0.23],
    wz - 1,
    cap(h, 0.12, 0.12),
    wallColors(PALETTE.rockLight),
    PALETTE.rockDark,
  );
  // Flache Kuppel (Schiefer) mit Laterne
  const m = (I + BATH_CUBE.u1) / 2;
  const r = wallColors(PALETTE.roofSlate);
  lathe(
    p,
    m,
    m,
    [
      [0.53, wz],
      [0.47, wz + 5],
      [0.34, wz + 9],
      [0.14, wz + 11],
    ],
    mixHex(PALETTE.roofSlate, '#ffffff', 0.18),
    r.right,
  );
  disc(p, m, m, 0.14, wz + 11, mixHex(PALETTE.roofSlate, '#ffffff', 0.3), true);
  disc(p, m, m, 0.05, wz + 11.5, PALETTE.wallLime);
  // Säulenportikus vor der linken Wand: vier Säulen tragen Gebälk und Giebelfeld
  const zc = 0.5 * wz;
  const front = BATH_CUBE.v1 + 0.3;
  const cols = [0.28, 0.55, 0.82, 1.09];
  p.quad(
    [0.2, BATH_CUBE.v1, 0],
    [1.2, BATH_CUBE.v1, 0],
    [1.2, front, 0],
    [0.2, front, 0],
    mixHex(PALETTE.rock, PALETTE.sandDry, 0.5),
    false,
  );
  for (const u of cols) pole(p, u, front - 0.08, zc, PALETTE.wallLime, 0.08);
  cuboid(p, [0.22, BATH_CUBE.v1, 1.16, front + 0.02], zc, zc + 4, lime);
  leftPlane(p, front + 0.02, 0.22, 1.16, zc + 4, zc + 4, PALETTE.wallLime);
  p.poly(
    [
      [0.22, front + 0.02, zc + 4],
      [1.16, front + 0.02, zc + 4],
      [0.69, front + 0.02, zc + 4 + dz * ISO_H],
    ],
    PALETTE.wallLime,
  );
}

// Kategorie-Fallback: Dachfamilie der Kategorie (Spec 5.5), unabhängig von der Id
function fallbackShell(p: IsoPainter, category: Category): Shell {
  const h = p.height;
  const rect = [I, I, p.w - I, p.h - I] as const;
  if (category === 'housing') return shellAt(rect, 0.5 * h, cap(h, p.w / 2, p.h / 2), 'hip', 'u');
  return shellAt(rect, 0.55 * h, h + ISO_H * I, 'gable', 'u');
}
const FALLBACK_ROOF: Record<Category, string> = {
  housing: PALETTE.roofThatch,
  production: PALETTE.roofWood,
  public: PALETTE.roofSlate,
  infrastructure: PALETTE.roofTimber,
};
function fallbackBody(category: Category): SilhouetteFn {
  return (p) => {
    const h = p.height;
    yard(p, mixHex(PALETTE.grass, PALETTE.earth, category === 'housing' ? 0.45 : 0.3));
    const s = fallbackShell(p, category);
    const wall =
      category === 'public'
        ? wallColors(PALETTE.wallStone)
        : category === 'infrastructure'
          ? wallColors(PALETTE.wallStone)
          : woodWall();
    drawShell(p, s, wall, FALLBACK_ROOF[category]);
    const w = p.w - 2 * I;
    leftQuad(p, s, I + 0.2 * w, I + 0.2 * w + 0.2, 0, 0.55 * s.wz, DOOR);
    leftQuad(p, s, I + 0.62 * w, I + 0.62 * w + 0.2, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
    rightQuad(
      p,
      s,
      I + 0.35 * (p.h - 2 * I),
      I + 0.35 * (p.h - 2 * I) + 0.2,
      0.35 * s.wz,
      0.8 * s.wz,
      WINDOW,
    );
    if (category === 'public') cupola(p, s, h, s.um, s.vm, 0.2);
    else if (category === 'production') chimney(p, s, h, PALETTE.wallStone);
    else if (category === 'infrastructure') {
      // Sonnendach in Palettenfarbe und Kisten
      leftPlane(
        p,
        s.v1,
        I + 0.1,
        I + 0.3 * w,
        0.62 * s.wz,
        0.8 * s.wz,
        mixHex(PALETTE.wallLime, PALETTE.sandDry, 0.4),
        true,
      );
      const crate = wallColors(PALETTE.roofWood);
      cuboid(p, [I + 0.5 * w, s.v1 - 0.16, I + 0.5 * w + 0.14, s.v1 - 0.02], 0, 6, crate);
    }
  };
}
export const FALLBACKS: Record<Category, SilhouetteFn> = {
  housing: fallbackBody('housing'),
  production: fallbackBody('production'),
  public: fallbackBody('public'),
  infrastructure: fallbackBody('infrastructure'),
};

// Jagdhütte (M11-R2): kleine Blockhütte hinten links (Firstrichtung v), Fellgestell rechts, Holzstapel vorn
function hunterBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.hunter, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.grass, 0.4));
  const s = shellAt([I, I, 0.56, 0.6], 0.5 * h, h + ISO_H * I, 'gable', 'v');
  drawShell(p, s, woodWall(), PALETTE.roofTimber);
  rightQuad(p, s, 0.2, 0.4, 0.35 * s.wz, 0.8 * s.wz, WINDOW);
  // Fellgestell rechts: zwei Pfosten, Querholm, zwei gespannte Felle in Erdton
  const hide = mixHex(PALETTE.earth, PALETTE.roofWood, 0.35);
  const hideDark = mixHex(PALETTE.earth, PALETTE.rockDark, 0.4);
  pole(p, 0.74, 0.14, 16, PALETTE.wallTimber);
  pole(p, 0.74, 0.66, 16, PALETTE.wallTimber);
  rightPlane(p, 0.76, 0.14, 0.7, 14.5, 16, PALETTE.wallTimber);
  rightPlane(p, 0.77, 0.2, 0.38, 5, 14.5, hide, true);
  rightPlane(p, 0.77, 0.44, 0.6, 7, 14.5, hideDark, true);
  // Holzstapel vorn rechts
  const log = wallColors(PALETTE.roofWood);
  cuboid(p, [0.58, 0.74, 0.9, 0.9], 0, 6, log, mixHex(PALETTE.roofWood, '#ffffff', 0.2));
  cuboid(p, [0.62, 0.76, 0.86, 0.88], 6, 10, log, mixHex(PALETTE.roofWood, '#ffffff', 0.2));
}

// Rinderfarm (M11-R2): langer Stall links (Firstrichtung v), Weide mit Gatter und Heuballen rechts
const COWS: ReadonlyArray<readonly [number, number]> = [
  [1.15, 0.55],
  [1.5, 1.05],
  [1.2, 1.5],
];
function cattlefarmBody(p: IsoPainter, b: Building): void {
  const h = bodyHeight(BUILDING_DEFS.cattlefarm, b);
  yard(p, mixHex(PALETTE.grass, PALETTE.earth, 0.25));
  p.quad(
    [1.0, 0.2, 0],
    [p.w - I, 0.2, 0],
    [p.w - I, p.h - I, 0],
    [1.0, p.h - I, 0],
    mixHex(PALETTE.grassLight, PALETTE.grass, 0.6),
    false,
  );
  const s = shellAt([I, I, 0.92, 1.55], 0.5 * h, h + ISO_H * I, 'gable', 'v');
  drawShell(p, s, wallColors(PALETTE.wallLime), PALETTE.roofWood);
  rightQuad(p, s, 1.2, 1.4, 0, 0.62 * s.wz, DOOR);
  rightQuad(p, s, 0.4, 0.62, 0.35 * s.wz, 0.75 * s.wz, WINDOW);
  // Rinder (braun, Kopf dunkel, Fleck hell), von hinten nach vorn
  const coat = wallColors(mixHex(PALETTE.earth, PALETTE.rockDark, 0.3));
  const dark = wallColors(PALETTE.rockDark);
  const patch = mixHex(PALETTE.wallLime, PALETTE.earth, 0.4);
  for (const [u, v] of [...COWS].sort((a, c) => a[0] + a[1] - (c[0] + c[1]))) {
    cuboid(p, [u + 0.03, v + 0.03, u + 0.09, v + 0.12], 0, 3, dark, undefined, false);
    cuboid(p, [u + 0.17, v + 0.03, u + 0.23, v + 0.12], 0, 3, dark, undefined, false);
    cuboid(p, [u, v, u + 0.26, v + 0.15], 3, 8, coat);
    cuboid(p, [u + 0.06, v + 0.04, u + 0.14, v + 0.11], 8, 8.4, wallColors(patch), patch, false);
    cuboid(p, [u + 0.26, v + 0.03, u + 0.33, v + 0.12], 4, 8, dark, undefined, false);
  }
  // Heuballen vorn links der Weide
  const hay = wallColors(PALETTE.roofThatch);
  cuboid(p, [1.02, 1.62, 1.24, 1.8], 0, 6, hay, mixHex(PALETTE.roofThatch, '#ffffff', 0.2));
  // Gatter vorn und rechts: Pfosten und zwei Latten
  const rail = PALETTE.roofWood;
  for (const u of [1.0, 1.35, 1.7]) pole(p, u, 1.86, 7, rail);
  for (const v of [0.3, 0.7, 1.1, 1.5]) pole(p, 1.86, v, 7, rail);
  pole(p, 1.86, 1.86, 7, rail);
  leftPlane(p, 1.92, 1.0, 1.9, 3.5, 4.8, rail);
  leftPlane(p, 1.92, 1.0, 1.9, 5.5, 6.5, rail);
  rightPlane(p, 1.92, 0.3, 1.9, 3.5, 4.8, rail);
  rightPlane(p, 1.92, 0.3, 1.9, 5.5, 6.5, rail);
}

/**
 * Stufen-Aufsatz (M11-R2) für jeden Betrieb mit `LEVELS`-Eintrag; liest nur `b.level`.
 * Stufe 2: Anbau vorn links. Stufe 3: zusätzlich Steinsockel auf beiden Aussenwänden und Fahne hinten rechts.
 */
export function drawLevelTopper(p: IsoPainter, def: BuildingDef, b: Building): void {
  const level = b.level ?? 1;
  if (level < 2) return;
  const stone = wallColors(PALETTE.wallStone);
  cuboid(
    p,
    [I, def.h - I - 0.3, I + 0.3, def.h - I],
    0,
    0.35 * ISO_H,
    stone,
    PALETTE.roofTerracotta,
  );
  if (level < 3) return;
  const sock = 0.12 * ISO_H;
  const band = mixHex(PALETTE.wallStone, '#000000', 0.08);
  leftPlane(p, def.h - I, I + 0.3, def.w - I, 0, sock, band, true);
  rightPlane(p, def.w - I, I, def.h - I, 0, sock, mixHex(band, '#000000', 0.18), true);
  // Fahne an der hinteren rechten Ecke: Mast bis zur Hüllenkante (`cap` bei v = I), breiter Wimpel nach innen
  const [u, v, top] = [def.w - I - 0.09, I, p.height + ISO_H * I - 0.2];
  pole(p, u, v, top, PALETTE.wallTimber, 0.09);
  p.poly(
    [
      [u, v + 0.02, top],
      [u - 0.34, v + 0.02, top - 1.5],
      [u - 0.34, v + 0.02, top - 7.5],
      [u, v + 0.02, top - 9],
    ],
    PALETTE.roofTerracotta,
  );
}

/** Silhouetten aller heutigen Typen; unbekannte Ids zeichnen den Kategorie-Fallback (`FALLBACKS`). */
export const SILHOUETTES: Partial<Record<BuildingDefId, SilhouetteFn>> = {
  house: houseBody,
  kontor: kontorBody,
  lumberjack: lumberjackBody,
  market: marketBody,
  fisher: fisherBody,
  hunter: hunterBody, // M11-R2
  cattlefarm: cattlefarmBody, // M11-R2
  quarry: quarryBody,
  sheepfarm: sheepfarmBody,
  weaver: weaverBody,
  canefarm: canefarmBody,
  distillery: distilleryBody,
  toolmaker: toolmakerBody,
  chapel: chapelBody,
  school: schoolBody,
  firestation: firestationBody,
  bathhouse: bathhouseBody, // M8-R1
  glassworks: glassworksBody, // M8-R1
  townhall: townhallBody, // M10-R1
};

// --- Fensteranker (Spec 6.2, ISO D-20): Rechtecke auf der linken oder rechten Wand ---

/** Anteile 0…1 von `spriteBounds`; `always` = Laterne (leuchtet immer). */
export interface LightAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
  wall: 'left' | 'right';
  always?: boolean;
  /** Wandebene in Footprint-Koordinaten, nur wenn nicht die äussere Wand (Schäferei: Stall hinter der Koppel). */
  plane?: number;
}
/** Fenster in Wandkoordinaten: `a` entlang der Wand in Kacheln (u links, v rechts), `z` in Weltpixeln. */
interface WallWindow {
  wall: 'left' | 'right';
  a0: number;
  a1: number;
  z0: number;
  z1: number;
  always?: boolean;
  plane?: number;
}
const L = (a0: number, a1: number, z0: number, z1: number, always?: boolean): WallWindow => ({
  wall: 'left',
  a0,
  a1,
  z0,
  z1,
  ...(always ? { always } : {}),
});
const R = (a0: number, a1: number, z0: number, z1: number): WallWindow => ({
  wall: 'right',
  a0,
  a1,
  z0,
  z1,
});

/** Fenster des Kaufmannshauses in Wandkoordinaten (drei Reihen, links 2 + 3 + 3, rechts 2 je Reihe). */
function merchantWindows(wz: number): WallWindow[] {
  const out: WallWindow[] = [];
  MERCHANT_ROWS.forEach(([a, b], row) => {
    for (const [u0, u1] of MERCHANT_LEFT[row]!) out.push(L(u0, u1, a * wz, b * wz));
    for (const [v0, v1] of MERCHANT_RIGHT) out.push(R(v0, v1, a * wz, b * wz));
  });
  return out;
}

/** Lagen wie in den Silhouetten gezeichnet (gleiche Wandebenen, gleiche Anteile an der Traufhöhe `wz`). */
const WINDOWS: Partial<Record<BuildingDefId, (b: Building, h: number) => WallWindow[]>> = {
  house: (b, h) => {
    const tier = b.house?.tier ?? 1;
    if (tier === 1) {
      const wz = 0.5 * h;
      return [R(0.4, 0.6, 0.4 * wz, 0.75 * wz)];
    }
    if (tier === 2) {
      const wz = 0.62 * h;
      return [L(0.6, 0.74, 0.5 * wz, 0.82 * wz)];
    }
    const wz = 0.6 * h;
    if (tier >= 4) return merchantWindows(wz);
    return [
      L(0.6, 0.72, 0.1, 0.4 * wz),
      L(0.6, 0.72, 0.58 * wz, 0.9 * wz),
      R(0.22, 0.34, 0.58 * wz, 0.9 * wz),
      R(0.66, 0.78, 0.58 * wz, 0.9 * wz),
    ];
  },
  kontor: (_b, h) => {
    const wz = 0.56 * h;
    return [
      L(1.5, 1.7, 0.45 * wz, 0.8 * wz),
      R(0.5, 0.8, 0.4 * wz, 0.8 * wz),
      R(1.2, 1.5, 0.4 * wz, 0.8 * wz),
      L(0.45, 0.55, 0.3 * wz, 0.62 * wz, true), // Laterne neben dem Tor
    ];
  },
  lumberjack: (_b, h) => [R(0.4, 0.62, 0.35 * 0.5 * h, 0.8 * 0.5 * h)],
  market: () => [L(1.78, 1.88, 14, 24, true)], // Laterne
  fisher: (_b, h) => [R(0.2, 0.4, 0.35 * 0.5 * h, 0.8 * 0.5 * h)],
  hunter: (_b, h) => [{ ...R(0.2, 0.4, 0.35 * 0.5 * h, 0.8 * 0.5 * h), plane: 0.56 }],
  cattlefarm: (_b, h) => [{ ...R(0.4, 0.62, 0.35 * 0.5 * h, 0.75 * 0.5 * h), plane: 0.92 }],
  quarry: (_b, h) => [R(0.7, 0.85, 0.3 * 0.3 * h, 0.8 * 0.3 * h)],
  sheepfarm: (_b, h) => [
    { ...L(1.2, 1.5, 0.35 * 0.5 * h, 0.7 * 0.5 * h), plane: 1.0 }, // Stallwand liegt bei v = 1,0 (Koppel davor)
    R(0.3, 0.5, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
    R(0.62, 0.82, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
  ],
  weaver: (_b, h) => [
    R(0.3, 0.5, 0.35 * 0.5 * h, 0.8 * 0.5 * h),
    R(0.65, 0.85, 0.35 * 0.5 * h, 0.8 * 0.5 * h),
  ],
  canefarm: (_b, h) => {
    const wz = 0.72 * h;
    return [L(1.3, 1.5, 0.3 * wz, 0.8 * wz), R(1.3, 1.5, 0.3 * wz, 0.8 * wz)];
  },
  distillery: (_b, h) => [
    R(0.3, 0.5, 0.35 * 0.5 * h, 0.8 * 0.5 * h),
    R(0.7, 0.9, 0.35 * 0.5 * h, 0.8 * 0.5 * h),
  ],
  toolmaker: (_b, h) => [
    L(0.2, 0.4, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
    L(0.95, 1.08, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
  ],
  chapel: (_b, h) => {
    const wz = 0.3 * h;
    return [
      L(0.75, 0.9, 0.3 * wz, 0.85 * wz),
      L(1.1, 1.25, 0.3 * wz, 0.85 * wz),
      L(1.45, 1.6, 0.3 * wz, 0.85 * wz),
      R(0.9, 1.05, 0.3 * wz, 0.85 * wz),
      R(1.3, 1.45, 0.3 * wz, 0.85 * wz),
    ];
  },
  firestation: (_b, h) => [
    L(0.18, 0.38, 0.45 * 0.6 * h, 0.8 * 0.6 * h),
    R(0.35, 0.6, 0.45 * 0.6 * h, 0.8 * 0.6 * h),
  ],
  glassworks: (_b, h) => {
    const wz = 0.42 * h;
    return [
      L(1.65, 1.8, 0.35 * wz, 0.75 * wz),
      R(0.5, 0.7, 0.35 * wz, 0.75 * wz),
      R(1.0, 1.2, 0.35 * wz, 0.75 * wz),
    ];
  },
  bathhouse: (_b, h) => {
    const wz = 0.75 * h;
    const pl = BATH_CUBE.v1; // Würfelwand bei 1,3 (nicht die äussere Wand)
    return [
      { ...L(0.2, 0.32, 0.68 * wz, 0.9 * wz), plane: pl },
      { ...L(1.0, 1.12, 0.68 * wz, 0.9 * wz), plane: pl },
      { ...R(0.4, 0.6, 0.5 * wz, 0.85 * wz), plane: BATH_CUBE.u1 },
      { ...R(0.8, 1.0, 0.5 * wz, 0.85 * wz), plane: BATH_CUBE.u1 },
    ];
  },
  townhall: (_b, h) => {
    const wz = 0.45 * h;
    return [
      L(0.22, 0.4, 0.4 * wz, 0.8 * wz),
      L(1.6, 1.78, 0.4 * wz, 0.8 * wz),
      R(0.3, 0.45, 0.4 * wz, 0.8 * wz),
      R(0.9, 1.05, 0.4 * wz, 0.8 * wz),
      R(1.5, 1.65, 0.4 * wz, 0.8 * wz),
    ];
  },
  school: (_b, h) => [
    L(0.2, 0.34, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
    L(0.86, 1.0, 0.35 * 0.5 * h, 0.75 * 0.5 * h),
  ],
};

/** Fenster des Kategorie-Fallbacks (wie `fallbackBody`). */
function fallbackWindows(def: BuildingDef, h: number): WallWindow[] {
  const wz = (def.category === 'housing' ? 0.5 : 0.55) * h;
  const w = def.w - 2 * I,
    d = def.h - 2 * I;
  return [
    L(I + 0.62 * w, I + 0.62 * w + 0.2, 0.35 * wz, 0.8 * wz),
    R(I + 0.35 * d, I + 0.35 * d + 0.2, 0.35 * wz, 0.8 * wz),
  ];
}

/** Wand als Parallelogramm in Weltpixeln auf der eingezogenen Wandebene, von 0 bis zur Hüllenhöhe (rein). */
export function wallPolygon(
  def: BuildingDef,
  b: Building,
  side: 'left' | 'right',
  plane?: number,
): Pt[] {
  const H = bodyHeight(def, b);
  const at = (u: number, v: number, z: number): Pt => {
    const q = project(b.x + u, b.y + v);
    return { x: q.x, y: q.y - z };
  };
  const [u0, v0, u1, v1] = [I, I, def.w - I, def.h - I];
  const poly =
    side === 'left'
      ? [
          at(u0, plane ?? v1, 0),
          at(u1, plane ?? v1, 0),
          at(u1, plane ?? v1, H),
          at(u0, plane ?? v1, H),
        ]
      : [
          at(plane ?? u1, v0, 0),
          at(plane ?? u1, v1, 0),
          at(plane ?? u1, v1, H),
          at(plane ?? u1, v0, H),
        ];
  // im Uhrzeigersinn (Bild-y nach unten), wie `bodyHull`
  const area = poly.reduce((a, q, i) => {
    const r = poly[(i + 1) % poly.length]!;
    return a + q.x * r.y - r.x * q.y;
  }, 0);
  return area < 0 ? poly.reverse() : poly;
}

/**
 * Fensteranker des Gebäudes (für den Lichtdurchgang R4): je Fenster das größte achsenparallele Rechteck im
 * Wand-Parallelogramm, als Anteile von `spriteBounds`.
 */
export function lightAnchors(def: BuildingDef, b: Building): LightAnchor[] {
  const h = bodyHeight(def, b);
  const wins = WINDOWS[def.id]?.(b, h) ?? fallbackWindows(def, h);
  const box = spriteBounds(def, b);
  return wins.map((w) => {
    const fixed = w.plane ?? (w.wall === 'left' ? def.h - I : def.w - I);
    const corner = (a: number, z: number): Pt => {
      const q = w.wall === 'left' ? project(b.x + a, b.y + fixed) : project(b.x + fixed, b.y + a);
      return { x: q.x, y: q.y - z };
    };
    const cs = [corner(w.a0, w.z0), corner(w.a1, w.z0), corner(w.a1, w.z1), corner(w.a0, w.z1)];
    const xs = cs.map((c) => c.x);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    // Obere Kanten: grösstes y der beiden oberen Ecken; untere: kleinstes y der beiden unteren Ecken
    const yTop = Math.max(cs[2]!.y, cs[3]!.y);
    const yBot = Math.min(cs[0]!.y, cs[1]!.y);
    const out: LightAnchor = {
      x: (x0 - box.x) / box.w,
      y: (yTop - box.y) / box.h,
      w: (x1 - x0) / box.w,
      h: Math.max(0, yBot - yTop) / box.h,
      wall: w.wall,
    };
    if (w.always) out.always = true;
    if (w.plane !== undefined) out.plane = w.plane;
    return out;
  });
}

/** Körper (sortierter Durchgang): Silhouette samt Hof und Zubehör, ohne Schatten, ohne Rauch, ohne Signale. */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
  env?: BodyEnv,
  variant = 0,
): void {
  const p = new IsoPainter(ctx, cam, b.x, b.y, def.w, def.h);
  p.edge = EDGE;
  p.variant = variant;
  p.height = bodyHeight(def, b);
  if (env) p.env = env;
  (SILHOUETTES[def.id] ?? FALLBACKS[def.category])(p, b);
  if (b.level !== undefined && LEVELS[def.id]) drawLevelTopper(p, def, b);
}

/**
 * Gezeichnete Körperpolygone in Weltpixeln (R113): zeichnet die Silhouette auf einen aufzeichnenden Kontext und
 * sammelt jede gefüllte Fläche (Hof, Wände, Dächer, Zubehör). Für das Picking, nicht für den Frame.
 * Der Aufzeichnungskontext kennt nur Pfadoperationen (beginPath/moveTo/lineTo/quadraticCurveTo/rect/arc/fill);
 * Verläufe (createLinearGradient …) und Clips lieferten dort `undefined` bzw. nichts und würden werfen oder
 * Flächen verlieren. Silhouetten dürfen deshalb keine Verläufe oder Clips benutzen.
 */
export function bodyPolygons(def: BuildingDef, b: Building, variant = 0): Pt[][] {
  return bodyFaces(def, b, variant).map((f) => f.pts);
}

/** Gefüllte Fläche des Körpers samt Füllfarbe (für die Materialschicht des Sprite-Caches). */
export interface BodyFace {
  pts: Pt[];
  fill: string;
}

/** Wie `bodyPolygons`, mit Füllfarbe und frei wählbarer Kamera (Standard: Weltpixel). */
export function bodyFaces(
  def: BuildingDef,
  b: Building,
  variant = 0,
  cam: Camera = { x: 0, y: 0, zoom: 1 },
): BodyFace[] {
  const faces: BodyFace[] = [];
  let path: Pt[] = [];
  let fillStyle = '';
  const rec: Record<string, unknown> = {
    beginPath: () => {
      path = [];
    },
    moveTo: (x: number, y: number) => path.push({ x, y }),
    lineTo: (x: number, y: number) => path.push({ x, y }),
    quadraticCurveTo: (cx: number, cy: number, x: number, y: number) =>
      path.push({ x: cx, y: cy }, { x, y }),
    rect: (x: number, y: number, w: number, h: number) =>
      path.push({ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }),
    arc: (x: number, y: number, r: number) =>
      path.push({ x: x - r, y }, { x, y: y - r }, { x: x + r, y }, { x, y: y + r }),
    fill: () => {
      if (path.length >= 3) faces.push({ pts: path.slice(), fill: fillStyle });
    },
  };
  const ctx = new Proxy(rec, {
    get: (t, k) => (k in t ? t[k as string] : () => undefined),
    set: (_t, k, v) => {
      if (k === 'fillStyle') fillStyle = String(v);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  drawBody(ctx, cam, def, b, 0, undefined, variant);
  return faces;
}
setBodyShapes(bodyPolygons);

/** Geist der Bauvorschau (D-13): derselbe Körper mit Deckkraft 0,5; gehört in die Signalebene. */
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  x: number,
  y: number,
): void {
  const b: Building = { id: -1, defId: def.id, x, y, connected: true, progress: 0, state: 'ok' };
  ctx.save();
  ctx.globalAlpha = GHOST_ALPHA;
  drawBody(ctx, cam, def, b, 0);
  ctx.restore();
}

/** Konvexe Hülle (Monotone Chain), Orientierung wie die Schattenpolygone der Bäume und des Schiffs. */
function convexHull(pts: readonly Pt[]): Pt[] {
  const a = [...pts].sort((p, q) => p.x - q.x || p.y - q.y);
  const cross = (o: Pt, p: Pt, q: Pt): number =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const half = (list: Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 1e-12)
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(a), ...half([...a].reverse())];
}

/** Schattenpolygon im Kachelraum: eingezogener Footprint ∪ derselbe, um `SHADOW_K · H / ISO_H` Kacheln nach (+3, +1) versetzt. */
export function buildingShadow(def: BuildingDef, b: Building): Pt[] {
  const i = BODY_INSET;
  const rect: Pt[] = [
    { x: b.x + i, y: b.y + i },
    { x: b.x + def.w - i, y: b.y + i },
    { x: b.x + def.w - i, y: b.y + def.h - i },
    { x: b.x + i, y: b.y + def.h - i },
  ];
  const k = (SHADOW_K * bodyHeight(def, b)) / ISO_H;
  const moved = rect.map((p) => ({ x: p.x + SHADOW_DIR.x * k, y: p.y + SHADOW_DIR.y * k }));
  return convexHull([...rect, ...moved]);
}

/** Kontor-Flagge (Luft): Stange und wehendes Tuch über dem First. */
function drawFlag(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
): void {
  const p = new IsoPainter(ctx, cam, b.x, b.y, def.w, def.h);
  const zr = bodyHeight(def, b) + ISO_H * BODY_INSET;
  const base = p.pt(def.w * 0.72, def.h / 2, zr);
  const z = cam.zoom;
  const len = 0.5 * ISO_H * z;
  ctx.fillStyle = AIR_COLORS.pole;
  ctx.fillRect(base.x - 0.75 * z, base.y - len, 1.5 * z, len);
  const wave = (k: number): number => Math.sin(timeMs / 420 + k) * 1.6 * z;
  const x0 = base.x + 0.75 * z,
    y0 = base.y - len;
  ctx.fillStyle = AIR_COLORS.cloth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + 7 * z, y0 + 1 * z + wave(0));
  ctx.lineTo(x0 + 14 * z, y0 + 3 * z + wave(1.6));
  ctx.lineTo(x0 + 7 * z, y0 + 6 * z + wave(0.8));
  ctx.lineTo(x0, y0 + 8 * z);
  ctx.closePath();
  ctx.fill();
}

/** Rauchpuffs, die ein laufender Betrieb zeichnet (0 für alle anderen); zählt gegen das Rauch-Budget. */
export function operatingPuffs(def: BuildingDef, b: Building): number {
  return def.category === 'production' && b.connected && b.state === 'ok' ? SMOKE_PUFFS : 0;
}

/**
 * Luft (Ebene 7): Rauch der laufenden Betriebe und Flagge des Kontors; nur aus Zeit und Gebäude. `maxPuffs` ist
 * der Rest des Rauch-Budgets (Standard: alle Puffs).
 */
export function drawAir(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
  maxPuffs: number = SMOKE_PUFFS,
): void {
  if (def.id === 'kontor') drawFlag(ctx, cam, def, b, timeMs);
  const puffs = Math.min(operatingPuffs(def, b), Math.max(0, Math.floor(maxPuffs)));
  if (puffs <= 0) return;
  const box = spriteBounds(def, b);
  const o = worldToScreen(cam, { x: box.x, y: box.y });
  const w = box.w * cam.zoom,
    h = box.h * cam.zoom;
  // Ursprung: Kaminmündung der Silhouette, sonst fester Anteil der Bildbox (Platzhalter bis R2)
  const chim = chimneyAnchor(def, b, cam);
  const ox = chim ? chim.x : o.x + SMOKE_ORIGIN.x * w;
  const oy = chim ? chim.y : o.y + SMOKE_ORIGIN.y * h;
  for (let i = 0; i < puffs; i++) {
    const phase = (timeMs / SMOKE_PERIOD_MS + i / SMOKE_PUFFS + (b.id % 7) / 7) % 1;
    const fx = Math.sin(phase * Math.PI * 2) * 0.04;
    const fy = -phase * 0.3;
    ctx.fillStyle = `rgba(${AIR_COLORS.smoke},${(SMOKE_ALPHA * (1 - phase)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(ox + fx * w, oy + fy * h, (0.05 + phase * 0.05) * Math.min(w, h), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Breite des äusseren und inneren Erdpfads in Kacheln (M7-Spec 5.4). */
export const ROAD_EDGE_WIDTH = 0.62;
export const ROAD_WIDTH = 0.5;
/** Grösste Mittelpunkt-Verschiebung je Achse in Kacheln (Kantenrauschen ≤ ±0,04, Spec 5.4). */
export const ROAD_JITTER = 0.08;

/** Mittelpunkt der Wegkachel (x, y) im Kachelraum samt Rauschen; Nachbarn teilen ihn, damit die Nähte schliessen. */
export function roadCenter(seed: number, x: number, y: number): Pt {
  return {
    x: x + 0.5 + (hash2(seed + 61, x, y) - 0.5) * ROAD_JITTER,
    y: y + 0.5 + (hash2(seed + 62, x, y) - 0.5) * ROAD_JITTER,
  };
}

/**
 * Wege als Erdpfade im Kachelraum (Aufruf unter der Bodenmatrix, 1 Einheit = 1 Kachel; Spec 5.4, ISO §6).
 * Segmente laufen zwischen den Mittelpunkten benachbarter Wegkacheln (nur Ost- und Südnachbar), aussen
 * `earthEdge`, innen `earth`, runde Enden; eine einzelne Kachel ohne Nachbar ist ein Kreis.
 */
export function drawRoads(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: { x0: number; y0: number; x1: number; y1: number },
): void {
  const road = (x: number, y: number): boolean => tileAt(world, x, y)?.road === true;
  const seed = world.seed;
  const segs: [Pt, Pt][] = [];
  const dots: Pt[] = [];
  const stones: Pt[] = [];
  for (let y = range.y0 - 1; y <= range.y1 + 1; y++)
    for (let x = range.x0 - 1; x <= range.x1 + 1; x++) {
      if (!road(x, y)) continue;
      const c = roadCenter(seed, x, y);
      const e = road(x + 1, y),
        s = road(x, y + 1);
      if (e) segs.push([c, roadCenter(seed, x + 1, y)]);
      if (s) segs.push([c, roadCenter(seed, x, y + 1)]);
      if (!e && !s && !road(x - 1, y) && !road(x, y - 1)) dots.push(c);
      const r = hash2(seed + 63, x, y);
      if (r > 0.8)
        stones.push({
          x: c.x + (hash2(seed + 64, x, y) - 0.5) * 0.36,
          y: c.y + (hash2(seed + 65, x, y) - 0.5) * 0.36,
        });
    }
  if (segs.length === 0 && dots.length === 0) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [style, width] of [
    [PALETTE.earthEdge, ROAD_EDGE_WIDTH],
    [PALETTE.earth, ROAD_WIDTH],
  ] as const) {
    ctx.strokeStyle = style;
    ctx.fillStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const [a, b] of segs) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (const d of dots) {
      ctx.moveTo(d.x + width / 2, d.y);
      ctx.arc(d.x, d.y, width / 2, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // Steinchen
  ctx.fillStyle = PALETTE.rockLight;
  for (const t of stones) ctx.fillRect(t.x - 0.03, t.y - 0.03, 0.06, 0.06);
}
