import { fireTongues } from './limits';
import { PALETTE, mixHex, rgbOfCss, rgbaOf } from './palette';

// fx.ts — Krisen-Effekte (Spec 6.5): Feuer mit Rauch, Glühen, Warnring, Boom-Münze. Bildraum, `rect` ist die
// Bildbox des Gebäudes in CSS-Pixeln. Reine Zeichenfunktionen: kein Weltzugriff, kein Zustand.

/** Dauer des Gelöscht-Effekts in Ticks (R85 Punkt 12: M6 importiert die Konstante). */
export const EXTINGUISHED_TICKS = 60;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
/** Deterministischer Streuwert 0…1 aus einem Index. */
const spread = (i: number, salt: number): number => {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Rauchfarbe als `r,g,b`-Tripel (Tests und Renderer erkennen den Rauch daran). */
export const SMOKE_COLOR = rgbOfCss(mixHex(PALETTE.rockDark, '#000000', 0.7)); // QA-R3 B1: dunkler, auch auf Fels lesbar
const SMOKE_PERIOD_MS = 3000;
const SMOKE_PUFFS = [14, 5] as const; // je Feuer [normal, reduziert]; Summe bleibt unter CAP_SMOKE
/** Anzahl Rauchpuffs eines Feuers zur Rauchstärke `smoke`. */
export const smokePuffs = (smoke: number, reduce = false): number =>
  Math.ceil(clamp01(smoke) * SMOKE_PUFFS[reduce ? 1 : 0]);
const FLAME_PERIOD_MS = 420;
const DARK_OUTLINE = mixHex(PALETTE.rockDark, '#000000', 0.7);

export interface FireOpts {
  flames: number;
  smoke: number;
  reduce?: boolean;
  /** Obergrenze der Rauchpuffs dieses Feuers (Rest des Rauchbudgets); Flammen bleiben unberührt. */
  maxPuffs?: number;
}

/** Feuer auf dem Dach: Flammenzungen in einem Verlauf `lightEvening` → `window`, darüber dunkler Rauch mit Wind. */
export function drawFire(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  timeMs: number,
  { flames, smoke, reduce = false, maxPuffs = Infinity }: FireOpts,
): void {
  const baseY = rect.y + rect.h * 0.5,
    maxH = rect.h * 0.45;
  const n = fireTongues(flames, reduce);
  ctx.save();
  if (n > 0) {
    const g = ctx.createLinearGradient(0, baseY, 0, baseY - maxH);
    g.addColorStop(0, PALETTE.lightEvening);
    g.addColorStop(1, PALETTE.window);
    ctx.fillStyle = g;
    ctx.beginPath();
    const f = clamp01(flames);
    for (let i = 0; i < n; i++) {
      const x = rect.x + rect.w * (0.18 + 0.64 * spread(i, 1));
      const flick = 0.55 + 0.45 * Math.sin((timeMs / FLAME_PERIOD_MS) * 2 * Math.PI + i * 2.1);
      const h = maxH * (0.45 + 0.55 * spread(i, 2)) * flick * (0.5 + 0.5 * f);
      const half = rect.w * 0.05;
      const sway = Math.sin(timeMs / 260 + i) * half * 0.6;
      ctx.moveTo(x - half, baseY);
      ctx.quadraticCurveTo(x - half * 0.3, baseY - h * 0.5, x + sway, baseY - h);
      ctx.quadraticCurveTo(x + half * 0.3, baseY - h * 0.5, x + half, baseY);
      ctx.closePath();
    }
    ctx.fill();
  }
  const puffs = Math.max(0, Math.min(smokePuffs(smoke, reduce), Math.floor(maxPuffs)));
  for (let i = 0; i < puffs; i++) {
    const a = (timeMs / SMOKE_PERIOD_MS + i / puffs + spread(i, 3) * 0.1) % 1; // Alter 0…1
    const x = rect.x + rect.w * (0.3 + 0.4 * spread(i, 4)) + a * rect.w * 0.7; // Wind nach rechts
    const y = baseY - maxH * 0.3 - a * rect.h * 1.1;
    const r = rect.w * (0.1 + 0.16 * a);
    const fade = (1 - a) * clamp01(smoke);
    ctx.fillStyle = `rgba(${SMOKE_COLOR.join(',')},${(0.85 * fade).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // leichte Kontur: hebt den Rauch vom Untergrund ab
    ctx.strokeStyle = `rgba(${rgbOfCss(DARK_OUTLINE).join(',')},${(0.5 * fade).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/** Weicher Schein des Feuers in `lightEvening`; der Aufrufer setzt `'lighter'` (additiver Durchgang). */
export function drawFireGlow(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  timeMs: number,
  flames: number,
): void {
  const f = clamp01(flames);
  if (f <= 0) return;
  const cx = rect.x + rect.w / 2,
    cy = rect.y + rect.h * 0.4,
    r = rect.w * 0.9;
  const flick = 0.8 + 0.2 * Math.sin(timeMs / 170);
  ctx.save();
  // Schein am Boden (QA-R3 B1): flache Ellipse um den Fuss des Gebäudes
  const gx = cx,
    gy = rect.y + rect.h * 0.82,
    gr = rect.w * 1.1;
  ctx.translate(gx, gy);
  ctx.scale(1, 0.5);
  const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, gr);
  ground.addColorStop(0, rgbaOf(PALETTE.lightEvening, Number((0.7 * f * flick).toFixed(3))));
  ground.addColorStop(0.6, rgbaOf(PALETTE.lightEvening, Number((0.3 * f * flick).toFixed(3))));
  ground.addColorStop(1, rgbaOf(PALETTE.lightEvening, 0));
  ctx.fillStyle = ground;
  ctx.fillRect(-gr, -gr, 2 * gr, 2 * gr);
  ctx.restore();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgbaOf(PALETTE.lightEvening, Number((0.5 * f * flick).toFixed(3))));
  g.addColorStop(1, rgbaOf(PALETTE.lightEvening, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  ctx.restore();
}

const WARN_PERIOD_MS = 1200;
const WARN_PLATEAU_MS = 500;
const WARN_MIN = 0.6;
/** Deckkraft des Warnrings: 100 % für 0,5 s, dann sanft auf 60 % und zurück (Periode 1,2 s). */
export function warnRingAlpha(timeMs: number): number {
  if (!Number.isFinite(timeMs)) return 1;
  const t = ((timeMs % WARN_PERIOD_MS) + WARN_PERIOD_MS) % WARN_PERIOD_MS;
  if (t < WARN_PLATEAU_MS) return 1;
  const u = (t - WARN_PLATEAU_MS) / (WARN_PERIOD_MS - WARN_PLATEAU_MS);
  return WARN_MIN + (1 - WARN_MIN) * (0.5 + 0.5 * Math.cos(2 * Math.PI * u));
}

/** Warnring um die Bildbox: `signalWarn` 2 px über einem dunklen Umriss von 1,5 px (Signal, ungetönt). */
export function drawWarnRing(ctx: CanvasRenderingContext2D, rect: Rect, timeMs: number): void {
  ctx.save();
  ctx.globalAlpha = warnRingAlpha(timeMs);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = DARK_OUTLINE;
  ctx.lineWidth = 2 + 2 * 1.5;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = PALETTE.signalWarn;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Boom-Münze über der Gebäudemitte: `roofThatch` mit wandernden Glanz in `window`, weisser Umriss (Signal). */
export function drawBoomCoin(ctx: CanvasRenderingContext2D, rect: Rect, timeMs: number): void {
  const r = 9,
    cx = rect.x + rect.w / 2,
    cy = rect.y - r - 6 + Math.sin(timeMs / 400) * 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.roofThatch;
  ctx.fill();
  // Glanz: schmale Ellipse, die über die Münze wandert
  const k = Math.sin(timeMs / 600);
  ctx.beginPath();
  ctx.ellipse(cx + k * r * 0.45, cy - r * 0.15, r * 0.18, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgbaOf(PALETTE.window, 0.8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

const RAIN_SPEED = 14; // Kacheln/s (Spec 6.4)
const RAIN_SLANT = { rain: 0.25, storm: 0.6 } as const;
const RAIN_LENGTH = 0.7; // Kacheln
const RAIN_ALPHA = 0.25;
const TILE_PX = 32; // Bildpixel je Kachel-Einheit bei Zoom 1 (halbe Rautenbreite)

/** Regenschlieren: schräge Linien in `foam`, ein Pfad im Bildraum; Positionen aus Index und `timeMs`. */
export function drawRain(
  ctx: CanvasRenderingContext2D,
  view: { w: number; h: number },
  zoom: number,
  kind: 'rain' | 'storm',
  streaks: number,
  timeMs: number,
): void {
  if (streaks <= 0 || view.w <= 0 || view.h <= 0) return;
  const tile = TILE_PX * Math.max(0.25, zoom),
    slant = RAIN_SLANT[kind],
    len = RAIN_LENGTH * tile,
    fall = RAIN_SPEED * tile * (timeMs / 1000);
  const wrap = (v: number, m: number): number => ((v % m) + m) % m;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < streaks; i++) {
    const x = wrap(spread(i, 5) * view.w + slant * fall, view.w),
      y = wrap(spread(i, 6) * view.h + fall, view.h);
    ctx.moveTo(x, y);
    ctx.lineTo(x + slant * len, y + len);
  }
  ctx.strokeStyle = rgbaOf(PALETTE.foam, RAIN_ALPHA);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

const EDGE_ALPHA = 0.25; // Deckkraft des Sturm-Randschattens bei w = 1

/** Dunkle Fläche am Bildrand im Sturm (Verlauf, Deckkraft 0,25·w), normales `source-over`. */
export function drawStormEdge(
  ctx: CanvasRenderingContext2D,
  view: { w: number; h: number },
  w: number,
): void {
  const k = clamp01(w);
  if (k <= 0) return;
  const cx = view.w / 2,
    cy = view.h / 2,
    r = Math.hypot(cx, cy);
  const g = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${(EDGE_ALPHA * k).toFixed(4)})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.restore();
}
