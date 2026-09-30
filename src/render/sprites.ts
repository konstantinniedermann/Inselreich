import type { Building, BuildingDef, BuildingDefId, Category } from '../sim/types';

export const BUILDING_COLORS: Record<Category, string> = {
  infrastructure: '#c9a227',
  housing: '#b5651d',
  production: '#4a7fb5',
  public: '#8e5ab8',
};

const OUTLINE = 'rgba(0,0,0,0.6)';
const LIGHT_MIX = 0.35; // Aufhellung für Details
const DARK_MIX = 0.35; // Abdunklung für Dächer
const SMOKE_PERIOD_MS = 1500;
const SMOKE_PUFFS = 3;
const SMOKE_ORIGIN = { x: 0.7, y: 0.32 }; // Anteil der Gebäudefläche
const SMOKE_COLOR = '128,128,128';
const SMOKE_ALPHA = 0.4;

/** Mischt eine Hex-Farbe (#rrggbb) mit Weiss (amt > 0) oder Schwarz (amt < 0). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const ch = (v: number): number => Math.round(v + (t - v) * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/** Zeichenfläche eines Gebäudes; alle Koordinaten sind Anteile (0..1) der Fläche. */
export class Painter {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly x: number,
    readonly y: number,
    readonly w: number,
    readonly h: number,
  ) {}

  private edge(fill: string, outline: boolean): void {
    this.ctx.fillStyle = fill;
    this.ctx.fill();
    if (outline) {
      this.ctx.strokeStyle = OUTLINE;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  rect(fx: number, fy: number, fw: number, fh: number, fill: string, outline = true): void {
    this.ctx.beginPath();
    this.ctx.rect(this.x + fx * this.w, this.y + fy * this.h, fw * this.w, fh * this.h);
    this.edge(fill, outline);
  }

  poly(pts: [number, number][], fill: string, outline = true): void {
    this.ctx.beginPath();
    pts.forEach(([fx, fy], i) => {
      const px = this.x + fx * this.w;
      const py = this.y + fy * this.h;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    });
    this.ctx.closePath();
    this.edge(fill, outline);
  }

  circ(fx: number, fy: number, fr: number, fill: string, outline = true): void {
    this.ctx.beginPath();
    this.ctx.arc(this.x + fx * this.w, this.y + fy * this.h, fr * Math.min(this.w, this.h), 0, 7);
    this.edge(fill, outline);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.ctx.beginPath();
    this.ctx.moveTo(this.x + x0 * this.w, this.y + y0 * this.h);
    this.ctx.lineTo(this.x + x1 * this.w, this.y + y1 * this.h);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}

export type SilhouetteFn = (p: Painter, base: string, b: Building) => void;

const roofOf = (base: string): string => shade(base, -DARK_MIX);
const lightOf = (base: string): string => shade(base, LIGHT_MIX);
const DOOR = '#4a3320';
const WOOD = '#8b5a2b';

/** Haus mit Satteldach in Anteilen der Fläche. */
function hut(p: Painter, base: string, x: number, y: number, w: number, h: number): void {
  const roofH = h * 0.5;
  p.rect(x, y + roofH * 0.9, w, h - roofH * 0.9, base);
  p.poly(
    [
      [x - w * 0.08, y + roofH],
      [x + w / 2, y],
      [x + w * 1.08, y + roofH],
    ],
    roofOf(base),
  );
  p.rect(x + w * 0.42, y + h * 0.68, w * 0.16, h * 0.32, DOOR, false);
}

const house: SilhouetteFn = (p, base, b) => {
  const tier = b.house?.tier ?? 1;
  if (tier === 1) {
    hut(p, base, 0.22, 0.3, 0.56, 0.62);
  } else if (tier === 2) {
    hut(p, base, 0.12, 0.2, 0.76, 0.74);
    p.line(0.12, 0.62, 0.88, 0.62, lightOf(base)); // Fachwerk
    p.line(0.5, 0.5, 0.5, 0.68, lightOf(base));
  } else {
    p.rect(0.14, 0.24, 0.72, 0.7, base);
    p.rect(0.1, 0.12, 0.8, 0.16, roofOf(base));
    for (const fy of [0.34, 0.56]) {
      p.rect(0.24, fy, 0.14, 0.12, lightOf(base), false);
      p.rect(0.62, fy, 0.14, 0.12, lightOf(base), false);
    }
    p.rect(0.44, 0.76, 0.12, 0.18, DOOR, false);
  }
};

const kontor: SilhouetteFn = (p, base) => {
  hut(p, base, 0.06, 0.16, 0.88, 0.78);
  p.rect(0.12, 0.72, 0.16, 0.16, WOOD); // Kisten
  p.rect(0.3, 0.77, 0.12, 0.11, lightOf(WOOD));
  p.line(0.5, 0.16, 0.5, 0.02, OUTLINE); // Flagge
  p.poly(
    [
      [0.5, 0.02],
      [0.68, 0.07],
      [0.5, 0.12],
    ],
    '#d03030',
    false,
  );
};

const market: SilhouetteFn = (p, base) => {
  p.rect(0.1, 0.5, 0.8, 0.4, lightOf(base)); // Theke
  p.rect(0.12, 0.3, 0.04, 0.6, WOOD, false);
  p.rect(0.84, 0.3, 0.04, 0.6, WOOD, false);
  for (let i = 0; i < 6; i++) {
    p.rect(0.06 + i * 0.14, 0.14, 0.14, 0.24, i % 2 === 0 ? roofOf(base) : '#f0e8d8');
  }
  p.circ(0.35, 0.62, 0.07, '#d04a2a', false);
  p.circ(0.55, 0.62, 0.07, '#e0b020', false);
  p.circ(0.7, 0.66, 0.06, '#6aa84f', false);
};

const fisher: SilhouetteFn = (p, base) => {
  hut(p, base, 0.1, 0.28, 0.5, 0.64);
  p.rect(0.66, 0.42, 0.26, 0.4, lightOf(base), false); // Netz
  for (let i = 1; i < 4; i++) {
    p.line(0.66 + i * 0.065, 0.42, 0.66 + i * 0.065, 0.82, OUTLINE);
    p.line(0.66, 0.42 + i * 0.1, 0.92, 0.42 + i * 0.1, OUTLINE);
  }
};

const lumberjack: SilhouetteFn = (p, base) => {
  hut(p, base, 0.1, 0.22, 0.52, 0.66);
  for (const [fx, fy] of [
    [0.74, 0.8],
    [0.9, 0.8],
    [0.82, 0.62],
  ] as const) {
    p.circ(fx, fy, 0.09, WOOD);
    p.circ(fx, fy, 0.035, lightOf(WOOD), false);
  }
};

const quarry: SilhouetteFn = (p, base) => {
  p.rect(0.08, 0.5, 0.44, 0.4, shade(base, 0.2));
  p.rect(0.4, 0.3, 0.42, 0.34, '#8a8a8a');
  p.rect(0.55, 0.62, 0.36, 0.28, '#a8a8a8');
  p.poly(
    [
      [0.1, 0.92],
      [0.22, 0.72],
      [0.34, 0.92],
    ],
    '#707070',
  );
  p.circ(0.2, 0.34, 0.06, '#9a9a9a');
};

const sheepfarm: SilhouetteFn = (p, base) => {
  hut(p, base, 0.1, 0.06, 0.8, 0.5);
  p.line(0.04, 0.78, 0.96, 0.78, WOOD); // Zaun
  p.line(0.04, 0.9, 0.96, 0.9, WOOD);
  for (let i = 0; i < 6; i++) p.rect(0.04 + i * 0.18, 0.72, 0.04, 0.24, WOOD, false);
  for (const fx of [0.25, 0.5, 0.75]) p.circ(fx, 0.68, 0.055, '#f4f4f4', false);
};

const weaver: SilhouetteFn = (p, base) => {
  hut(p, base, 0.06, 0.1, 0.6, 0.8);
  p.rect(0.7, 0.4, 0.24, 0.48, lightOf(base)); // Webrahmen
  for (let i = 1; i < 4; i++) {
    p.line(0.7 + i * 0.06, 0.4, 0.7 + i * 0.06, 0.88, OUTLINE);
    p.line(0.7, 0.4 + i * 0.12, 0.94, 0.4 + i * 0.12, OUTLINE);
  }
};

const canefarm: SilhouetteFn = (p, base) => {
  for (let i = 0; i < 4; i++) {
    p.rect(0.05, 0.4 + i * 0.14, 0.9, 0.14, i % 2 === 0 ? '#7fae4a' : '#5c8a34');
  }
  hut(p, base, 0.08, 0.04, 0.34, 0.36);
};

const distillery: SilhouetteFn = (p, base) => {
  hut(p, base, 0.08, 0.22, 0.6, 0.7);
  p.rect(0.5, 0.06, 0.12, 0.3, '#5a5a5a'); // Schornstein
  p.circ(0.82, 0.74, 0.12, WOOD); // Fass
  p.line(0.72, 0.74, 0.92, 0.74, OUTLINE);
};

const chapel: SilhouetteFn = (p, base) => {
  hut(p, base, 0.1, 0.4, 0.8, 0.54);
  p.rect(0.4, 0.14, 0.2, 0.42, base); // Turm
  p.poly(
    [
      [0.36, 0.16],
      [0.5, 0.02],
      [0.64, 0.16],
    ],
    roofOf(base),
  );
  p.rect(0.46, 0.24, 0.08, 0.1, DOOR, false); // Glockenöffnung
};

const school: SilhouetteFn = (p, base) => {
  hut(p, base, 0.08, 0.2, 0.84, 0.74);
  p.circ(0.5, 0.42, 0.07, '#e0b020'); // Glocke
  p.rect(0.16, 0.6, 0.18, 0.14, '#f0e8d8'); // Buch
  p.line(0.25, 0.6, 0.25, 0.74, OUTLINE);
};

/** Fallback für Typen ohne eigene Silhouette: Kategorie-Grundform. */
function fallback(category: Category): SilhouetteFn {
  return (p, base) => {
    if (category === 'production') {
      p.rect(0.1, 0.3, 0.8, 0.62, base);
      p.rect(0.06, 0.2, 0.88, 0.14, roofOf(base));
    } else {
      hut(p, base, 0.1, 0.2, 0.8, 0.72);
    }
  };
}

/** Eigene Silhouette je Gebäudetyp; fehlende Typen nutzen die Kategorie-Grundform. */
export const SILHOUETTES: Partial<Record<BuildingDefId, SilhouetteFn>> = {
  kontor,
  market,
  house,
  fisher,
  lumberjack,
  quarry,
  sheepfarm,
  weaver,
  canefarm,
  distillery,
  chapel,
  school,
};

/** Aufsteigende Rauchwölkchen; nur aus Zeit und Gebäude-ID (deterministisch). */
function drawSmoke(p: Painter, b: Building, timeMs: number): void {
  const ctx = p.ctx;
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    const phase = (timeMs / SMOKE_PERIOD_MS + i / SMOKE_PUFFS + (b.id % 7) / 7) % 1;
    const fx = SMOKE_ORIGIN.x + Math.sin(phase * Math.PI * 2) * 0.04;
    const fy = SMOKE_ORIGIN.y - phase * 0.3;
    ctx.fillStyle = `rgba(${SMOKE_COLOR},${(SMOKE_ALPHA * (1 - phase)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x + fx * p.w, p.y + fy * p.h, (0.05 + phase * 0.05) * Math.min(p.w, p.h), 0, 7);
    ctx.fill();
  }
}

/** px/py = linke obere Ecke, w/h = Grösse in Bildschirm-Pixeln (Differenz gerundeter Kanten, siehe tileToScreen). */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  def: BuildingDef,
  b: Building,
  px: number,
  py: number,
  w: number,
  h: number,
  timeMs = 0,
): void {
  const s = w / def.w;
  const inset = Math.max(1, s * 0.06);
  const p = new Painter(ctx, px + inset, py + inset, w - 2 * inset, h - 2 * inset);
  const draw = SILHOUETTES[def.id] ?? fallback(def.category);
  draw(p, BUILDING_COLORS[def.category], b);
  if (def.category === 'production' && b.connected && b.state === 'ok') {
    drawSmoke(p, b, timeMs);
  }

  if (!b.connected && def.id !== 'house' && def.id !== 'kontor') {
    ctx.fillStyle = '#e02020';
    ctx.beginPath();
    ctx.arc(px + w - s * 0.2, py + s * 0.2, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  n: { n: boolean; e: boolean; s: boolean; w: boolean },
): void {
  ctx.fillStyle = '#a0865a';
  ctx.fillRect(px, py, pw, ph);
  const s = pw;
  const c = s / 2;
  ctx.strokeStyle = '#c9b48a';
  ctx.lineWidth = Math.max(2, s * 0.25);
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(px + c, py + c);
  if (n.n) ctx.lineTo(px + c, py);
  ctx.moveTo(px + c, py + c);
  if (n.e) ctx.lineTo(px + s, py + c);
  ctx.moveTo(px + c, py + c);
  if (n.s) ctx.lineTo(px + c, py + s);
  ctx.moveTo(px + c, py + c);
  if (n.w) ctx.lineTo(px, py + c);
  ctx.stroke();
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(px + c - s * 0.125, py + c - s * 0.125, s * 0.25, s * 0.25);
}
