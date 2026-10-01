import type { Building, BuildingDef, Category, World } from '../sim/types';
import { tileAt } from '../sim/world';
import { worldToScreen, type Camera } from './camera';
import { ISO_H, bodyHeight, project, spriteBounds, type Pt } from './iso';

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
const INSET = 0.08; // Kachel, die der Grundriss je Seite eingezogen ist
const SMOKE_PERIOD_MS = 1500;
const SMOKE_PUFFS = 3;
const SMOKE_ORIGIN = { x: 0.7, y: 0.32 }; // Anteil der Bildbox
/** Farben der Luft-Ebene (ISO 7.1): kein Körper verwendet sie. */
export const AIR_COLORS = { smoke: '128,128,128' } as const;
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
export class IsoPainter {
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
      ctx.strokeStyle = OUTLINE;
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

/** Körper (sortierter Durchgang): Platzhalter-Quader in Kategoriefarbe, Höhe aus `bodyHeight`. */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Signatur für animierte Silhouetten (R1b, R2)
  timeMs: number,
): void {
  const p = new IsoPainter(ctx, cam, b.x, b.y, def.w, def.h);
  isoBox(p, bodyHeight(def, b), bodyColors(def.category));
}

/** Luft (Ebene 7): aufsteigender Rauch der laufenden Betriebe; nur aus Zeit und Gebäude-Id. */
export function drawAir(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
): void {
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
