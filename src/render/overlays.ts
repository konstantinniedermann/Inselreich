import { BUILDING_DEFS } from '../sim/defs/buildings';
import {
  coverageMask,
  houseDiagnosis,
  layoutKey,
  placementZone,
  type CoverageKind,
  type Diagnosis,
} from '../sim/queries';
import type { BuildingDefId, GoodId, World } from '../sim/types';
import { TILE, tileToScreen, type Camera } from './camera';

// --- Darstellungswerte ---
export const SYMBOL_MIN_ZOOM = 0.75; // darunter keine Bedarfssymbole
const OUTLINE_COLOR = 'rgba(255,255,255,0.85)';
const CIRCLE_COLOR = 'rgba(255,255,255,0.7)';
const HIGHLIGHT_FILL = 'rgba(255,255,255,0.28)';
const BADGE_BG = 'rgba(255,255,255,0.92)';
const BADGE_EDGE = 'rgba(0,0,0,0.7)';
const EXTRA_DOT = '#e02020';
const SIGN_COLOR = '#8b5a2b';
const BELL_COLOR = '#e0b020';
const BOOK_COLOR = '#3a6ab8';
const FALLBACK_GOOD_COLOR = '#999999';
/** Warenfarben; neue Güter ohne Eintrag nutzen die Fallback-Farbe. */
export const GOOD_COLORS: Partial<Record<GoodId, string>> = {
  wood: '#8b5a2b',
  tools: '#6b7a8f',
  stone: '#9a9a9a',
  food: '#e07a3a',
  wool: '#f0ece0',
  cloth: '#b85ab0',
  cane: '#7fae4a',
  rum: '#7a2a2a',
};

// --- Abdeckungs-Cache ---
interface Entry {
  key: string;
  mask: boolean[];
  segments?: Array<[number, number, number, number]>;
}

/** Aussenkanten aller wahren Kacheln in Kachelkoordinaten [x0, y0, x1, y1]. */
export function outlineSegments(
  mask: boolean[],
  width: number,
): Array<[number, number, number, number]> {
  const height = Math.floor(mask.length / width);
  const on = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === true;
  const out: Array<[number, number, number, number]> = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!on(x, y)) continue;
      if (!on(x, y - 1)) out.push([x, y, x + 1, y]);
      if (!on(x, y + 1)) out.push([x, y + 1, x + 1, y + 1]);
      if (!on(x - 1, y)) out.push([x, y, x, y + 1]);
      if (!on(x + 1, y)) out.push([x + 1, y, x + 1, y + 1]);
    }
  }
  return out;
}

/** Cache je Abdeckungsart; neu gerechnet wird nur bei geändertem `layoutKey`. */
export function createCoverageCache(
  compute: (world: World, kind: CoverageKind) => boolean[] = coverageMask,
): {
  get(world: World, kind: CoverageKind): boolean[];
  outline(world: World, kind: CoverageKind): Array<[number, number, number, number]>;
} {
  const entries = new Map<CoverageKind, Entry>();
  const entryFor = (world: World, kind: CoverageKind): Entry => {
    const key = layoutKey(world);
    const hit = entries.get(kind);
    if (hit && hit.key === key && hit.mask.length === world.width * world.height) return hit;
    const fresh: Entry = { key, mask: compute(world, kind) };
    entries.set(kind, fresh);
    return fresh;
  };
  return {
    get: (world, kind) => entryFor(world, kind).mask,
    outline: (world, kind) => {
      const e = entryFor(world, kind);
      e.segments ??= outlineSegments(e.mask, world.width);
      return e.segments;
    },
  };
}

// --- Radiusanzeige je Werkzeug (Spec 10.2) ---
export interface OverlayPlan {
  circle: { cx: number; cy: number; radius: number } | null;
  coverage: CoverageKind | null;
  highlight: { x: number; y: number }[];
}

/** Welche Anzeige gehört zum Bau-Werkzeug? `null` = nur die grün/rot-Vorschau. */
export function overlayPlan(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
): OverlayPlan | null {
  const def = BUILDING_DEFS[defId];
  const zone = placementZone(world, defId, x, y);
  const coverage: CoverageKind | null =
    def.category === 'housing'
      ? 'supply'
      : def.supplyRadius !== undefined
        ? 'supply'
        : (def.service ?? null);
  if (!zone && !coverage) return null;
  const hasCoverageCircle = def.supplyRadius !== undefined || def.serviceRadius !== undefined;
  return {
    circle: zone ? { cx: zone.cx, cy: zone.cy, radius: zone.radius } : null,
    coverage,
    highlight: zone && !hasCoverageCircle ? zone.tiles : [],
  };
}

export const overlayCache = createCoverageCache();

interface Range {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Radius-Kreis, hervorgehobene Kacheln und Abdeckungs-Umriss für das aktive Bau-Werkzeug. */
export function drawPlacementOverlay(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  range: Range,
  defId: BuildingDefId,
  hx: number,
  hy: number,
): void {
  const plan = overlayPlan(world, defId, hx, hy);
  if (!plan) return;
  const s = TILE * cam.zoom;
  const o = tileToScreen(cam, 0, 0);
  ctx.save();
  if (plan.highlight.length) {
    ctx.fillStyle = HIGHLIGHT_FILL;
    for (const t of plan.highlight) {
      const p = tileToScreen(cam, t.x, t.y);
      const q = tileToScreen(cam, t.x + 1, t.y + 1);
      ctx.fillRect(p.x, p.y, q.x - p.x, q.y - p.y);
    }
  }
  if (plan.coverage) {
    ctx.beginPath();
    for (const [ax, ay, bx, by] of overlayCache.outline(world, plan.coverage)) {
      if (ax > range.x1 + 1 || bx < range.x0 || ay > range.y1 + 1 || by < range.y0) continue;
      const a = tileToScreen(cam, ax, ay);
      const b = tileToScreen(cam, bx, by);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (plan.circle) {
    ctx.beginPath();
    ctx.arc(o.x + plan.circle.cx * s, o.y + plan.circle.cy * s, plan.circle.radius * s, 0, 7);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CIRCLE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// --- Bedarfssymbole (Spec 10.4) ---
export interface Symbol {
  shape: 'sign' | 'good' | 'bell' | 'book';
  color: string;
}

export function symbolFor(d: Diagnosis): Symbol {
  if (d.kind === 'supply') return { shape: 'sign', color: SIGN_COLOR };
  if (d.kind === 'good')
    return { shape: 'good', color: GOOD_COLORS[d.good] ?? FALLBACK_GOOD_COLOR };
  return d.service === 'faith'
    ? { shape: 'bell', color: BELL_COLOR }
    : { shape: 'book', color: BOOK_COLOR };
}

/** Abzeichen über Häusern im Bereich; ausgeblendet bei Zoom < SYMBOL_MIN_ZOOM. */
export function drawNeedSymbols(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  range: Range,
): void {
  if (cam.zoom < SYMBOL_MIN_ZOOM) return;
  const s = TILE * cam.zoom;
  const r = s * 0.2;
  for (const b of Object.values(world.buildings)) {
    if (!b.house || b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1) continue;
    const diag = houseDiagnosis(world, b);
    const first = diag[0];
    if (!first) continue;
    const sym = symbolFor(first);
    const p = tileToScreen(cam, b.x, b.y);
    const cx = p.x + s * 0.78;
    const cy = p.y + s * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 7);
    ctx.fillStyle = BADGE_BG;
    ctx.fill();
    ctx.strokeStyle = BADGE_EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = sym.color;
    if (sym.shape === 'good') {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0, 7);
      ctx.fill();
    } else if (sym.shape === 'sign') {
      ctx.fillRect(cx - r * 0.1, cy - r * 0.6, r * 0.2, r * 1.2); // Pfosten
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy - r * 0.6);
      ctx.lineTo(cx + r * 0.6, cy - r * 0.3);
      ctx.lineTo(cx - r * 0.5, cy);
      ctx.closePath();
      ctx.fill();
    } else if (sym.shape === 'bell') {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy + r * 0.4);
      ctx.quadraticCurveTo(cx - r * 0.5, cy - r * 0.7, cx, cy - r * 0.7);
      ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.7, cx + r * 0.55, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(cx - r * 0.55, cy - r * 0.45, r * 1.1, r * 0.9); // Buch
      ctx.fillStyle = BADGE_BG;
      ctx.fillRect(cx - r * 0.05, cy - r * 0.45, r * 0.1, r * 0.9);
    }
    if (diag.length > 1) {
      ctx.beginPath();
      ctx.arc(cx + r * 0.85, cy + r * 0.85, r * 0.3, 0, 7);
      ctx.fillStyle = EXTRA_DOT;
      ctx.fill();
    }
  }
}
