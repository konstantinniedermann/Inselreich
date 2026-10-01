import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { Building, BuildingDef, BuildingDefId, Category, World } from '../sim/types';
import { tileAt } from '../sim/world';
import { worldToScreen, type Camera } from './camera';
import { ISO_H, bodyHeight, project, spriteBounds, type Pt } from './iso';
import { PALETTE, mixHex, rgbOfCss } from './palette';

/** Platzhalter-Töne je Kategorie (heutige Werte); R1b und R2 ersetzen sie durch die Palette. */
export const BUILDING_COLORS: Record<Category, string> = {
  infrastructure: '#c9a227',
  housing: '#b5651d',
  production: '#4a7fb5',
  public: '#8e5ab8',
};

const OUTLINE = 'rgba(0,0,0,0.6)';
const LEFT_MIX = 0.18; // linke Wand heller
const RIGHT_MIX = -0.2; // rechte Wand dunkler
const TOP_MIX = -0.35; // Dach am dunkelsten
const INSET = 0.08; // Kachel, die der Grundriss je Seite eingezogen ist (Platzhalter-Körper)
/** Einzug des Grundrisses je Seite in Kacheln (ISO 7.1: höchstens 0,1; Grundriss ≥ 64 % der Raute). */
export const BODY_INSET = 0.08;
/** Schattenlänge je Höhe (Darstellungswert, ISO D-11; `lead-art` justiert ihn im Slice über AK-ISO-13). */
export const SHADOW_K = 0.3;
const GHOST_ALPHA = 0.5; // Bauvorschau (D-13)
const SHADOW_DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) }; // Kachelraum, nach rechts unten im Bild
/** Umrisslinie der Slice-Körper (aus der Palette abgeleitet, keine Signalfarbe). */
const EDGE = mixHex(PALETTE.wallTimber, '#000000', 0.55);
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

const ROAD_FILL = '#a0865a';
const ROAD_EDGE = '#c9b48a';
const ROAD_WIDTH = 0.25; // Kachel-Einheiten

/** Mischt eine Hex-Farbe (#rrggbb) mit Weiss (amt > 0) oder Schwarz (amt < 0). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const ch = (v: number): number => Math.round(v + (t - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

export interface BoxColors {
  left: string;
  right: string;
  top: string;
}
export const bodyColors = (category: Category): BoxColors => ({
  left: shade(BUILDING_COLORS[category], LEFT_MIX),
  right: shade(BUILDING_COLORS[category], RIGHT_MIX),
  top: shade(BUILDING_COLORS[category], TOP_MIX),
});

/** Footprint-lokale Koordinaten (u, v in Kacheln, z in Weltpixeln über dem Boden) → Bildpunkte. */
/** Umgebung, die der Renderer einem Körper mitgibt (aus der Welt gelesen; ohne Angabe gilt der Standard). */
export interface BodyEnv {
  /** Wasser an der vorderen linken bzw. vorderen rechten Seite (Kaimauer des Kontors). */
  waterLeft?: boolean;
  waterRight?: boolean;
}
export type SilhouetteFn = (p: IsoPainter, b: Building) => void;

export class IsoPainter {
  /** Umrissfarbe der Polygone. */
  edge: string = OUTLINE;
  env: BodyEnv = {};
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

  poly(pts: readonly [number, number, number][], fill: string, outline = true): void {
    const { ctx } = this;
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
export function isoBox(p: IsoPainter, height: number, colors: BoxColors, inset = INSET): void {
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
  const r = roofColors(roof);
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

/** Kamin: Quader auf dem Dach, dessen Oberkante genau auf der Hüllenkante liegt (macht die Hülle oben dicht). */
function chimney(p: IsoPainter, s: Shell, h: number, cu: number, cv: number, color: string): void {
  const size = 0.11;
  const top = h + ISO_H * Math.min(cu, cv);
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

const WINDOW = mixHex(PALETTE.roofSlate, '#000000', 0.4);
const DOOR = mixHex(PALETTE.wallTimber, '#000000', 0.25);

function houseBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.house;
  const tier = b.house?.tier ?? 1;
  const h = bodyHeight(def, b);
  const zr = h + ISO_H * BODY_INSET; // Firstende genau auf der Hüllenkante
  yard(p, mixHex(PALETTE.grass, PALETTE.earth, 0.45));
  if (tier === 1) {
    // Hütte: Lehmwand, Strohdach (Walmdach)
    const s = makeShell(p, 0.5 * h, zr, 'hip', 'u');
    drawShell(p, s, wallColors(mixHex(PALETTE.wallLime, PALETTE.earth, 0.4)), PALETTE.roofThatch);
    leftQuad(p, s, 0.42, 0.58, 0, 0.36 * s.wz, DOOR);
    rightQuad(p, s, 0.4, 0.6, 0.4 * s.wz, 0.75 * s.wz, WINDOW);
    chimney(p, s, h, 0.22, 0.22, PALETTE.wallStone);
  } else if (tier === 2) {
    // Fachwerk auf Kalkputz, Terrakotta-Satteldach (First entlang u)
    const s = makeShell(p, 0.62 * h, zr, 'gable', 'u');
    const w = wallColors(PALETTE.wallLime);
    const t = wallColors(PALETTE.wallTimber);
    drawShell(p, s, w, PALETTE.roofTerracotta);
    for (const u of [0.18, 0.5, 0.82]) leftQuad(p, s, u - 0.025, u + 0.025, 0, s.wz, t.left);
    for (const v of [0.18, 0.5, 0.82]) rightQuad(p, s, v - 0.025, v + 0.025, 0, s.wz, t.right);
    leftQuad(p, s, s.u0, s.u1, 0.47 * s.wz, 0.47 * s.wz + 2, t.left);
    rightQuad(p, s, s.v0, s.v1, 0.47 * s.wz, 0.47 * s.wz + 2, t.right);
    leftQuad(p, s, 0.28, 0.4, 0.1, 0.6 * s.wz, DOOR);
    leftQuad(p, s, 0.6, 0.74, 0.5 * s.wz, 0.82 * s.wz, WINDOW);
    chimney(p, s, h, 0.2, 0.2, PALETTE.wallStone);
  } else {
    // Bürgerhaus: Steinwand, dunkler Ziegel, zwei Geschosse, Gaube (First entlang v)
    const s = makeShell(p, 0.6 * h, zr, 'gable', 'v');
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
    chimney(p, s, h, 0.2, 0.2, PALETTE.wallStone);
  }
}

function kontorBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.kontor;
  const h = bodyHeight(def, b);
  yard(p, mixHex(PALETTE.rock, PALETTE.sandDry, 0.45));
  const s = makeShell(p, 0.56 * h, h + ISO_H * BODY_INSET, 'gable', 'u');
  const w = wallColors(PALETTE.wallStone);
  drawShell(p, s, w, PALETTE.roofTimber);
  // Tor und Ladeluke, Balken
  leftQuad(p, s, 0.7, 1.3, 0, 0.55 * s.wz, DOOR);
  leftQuad(p, s, 0.95, 1.05, 0, 0.55 * s.wz, wallColors(PALETTE.wallTimber).left);
  leftQuad(p, s, 1.5, 1.7, 0.45 * s.wz, 0.8 * s.wz, WINDOW);
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
  // Kaimauer zur Wasserseite (ohne Angabe vorn rechts)
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
  if (waterRight === true || waterLeft !== true) {
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

function lumberjackBody(p: IsoPainter, b: Building): void {
  const def = BUILDING_DEFS.lumberjack;
  const h = bodyHeight(def, b);
  yard(p, mixHex(PALETTE.earth, PALETTE.sandDry, 0.4));
  // Sägemehlfleck (vorn, auf dem Hofboden)
  p.quad([0.5, 0.55, 0], [0.96, 0.55, 0], [0.96, 0.96, 0], [0.5, 0.96, 0], PALETTE.sandDry, false);
  const s = makeShell(p, 0.5 * h, h + ISO_H * BODY_INSET, 'gable', 'v');
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
  chimney(p, s, h, 0.2, 0.2, PALETTE.rockDark);
}

/** Silhouetten der umgestellten Typen; alle anderen zeichnen bis R2 den Platzhalter-Körper. */
const SILHOUETTES: Partial<Record<BuildingDefId, SilhouetteFn>> = {
  house: houseBody,
  kontor: kontorBody,
  lumberjack: lumberjackBody,
};

/** Körper (sortierter Durchgang): Silhouette samt Hof und Zubehör, ohne Schatten, ohne Rauch, ohne Signale. */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
  env?: BodyEnv,
): void {
  const p = new IsoPainter(ctx, cam, b.x, b.y, def.w, def.h);
  const fn = SILHOUETTES[def.id];
  if (fn) {
    p.edge = EDGE;
    if (env) p.env = env;
    fn(p, b);
  } else isoBox(p, bodyHeight(def, b), bodyColors(def.category));
}

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

/** Luft (Ebene 7): Rauch der laufenden Betriebe und Flagge des Kontors; nur aus Zeit und Gebäude. */
export function drawAir(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
): void {
  if (def.id === 'kontor') drawFlag(ctx, cam, def, b, timeMs);
  if (def.category !== 'production' || !b.connected || b.state !== 'ok') return;
  const box = spriteBounds(def, b);
  const o = worldToScreen(cam, { x: box.x, y: box.y });
  const w = box.w * cam.zoom,
    h = box.h * cam.zoom;
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    const phase = (timeMs / SMOKE_PERIOD_MS + i / SMOKE_PUFFS + (b.id % 7) / 7) % 1;
    const fx = SMOKE_ORIGIN.x + Math.sin(phase * Math.PI * 2) * 0.04;
    const fy = SMOKE_ORIGIN.y - phase * 0.3;
    ctx.fillStyle = `rgba(${AIR_COLORS.smoke},${(SMOKE_ALPHA * (1 - phase)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(o.x + fx * w, o.y + fy * h, (0.05 + phase * 0.05) * Math.min(w, h), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Wege im Kachelraum (Aufruf unter der Bodenmatrix, 1 Einheit = 1 Kachel); heutige Optik. */
export function drawRoads(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: { x0: number; y0: number; x1: number; y1: number },
): void {
  const road = (x: number, y: number): boolean => tileAt(world, x, y)?.road === true;
  for (let y = range.y0; y <= range.y1; y++) {
    for (let x = range.x0; x <= range.x1; x++) {
      if (!road(x, y)) continue;
      ctx.fillStyle = ROAD_FILL;
      ctx.fillRect(x, y, 1, 1);
      ctx.strokeStyle = ROAD_EDGE;
      ctx.lineWidth = ROAD_WIDTH;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      const c = { x: x + 0.5, y: y + 0.5 };
      for (const [on, tx, ty] of [
        [road(x, y - 1), c.x, y],
        [road(x + 1, y), x + 1, c.y],
        [road(x, y + 1), c.x, y + 1],
        [road(x - 1, y), x, c.y],
      ] as const) {
        ctx.moveTo(c.x, c.y);
        if (on) ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.fillStyle = ROAD_EDGE;
      ctx.fillRect(c.x - 0.125, c.y - 0.125, 0.25, 0.25);
    }
  }
}
