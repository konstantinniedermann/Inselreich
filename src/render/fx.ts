import type { Pt } from './isoBase';
import { cap, fireTongues } from './limits';
import { INK_TONE, LIGHT_TONE, PALETTE, rgbOfCss, rgbaOf, rgbaOfCss, toInk } from './palette';

// fx.ts — Krisen-Effekte (Spec 6.5): Feuer mit Rauch, Glühen, Warnring, Boom-Münze. Bildraum, `rect` ist die
// Bildbox des Gebäudes in CSS-Pixeln. Reine Zeichenfunktionen: kein Weltzugriff, kein Zustand.

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
export const SMOKE_COLOR = rgbOfCss(toInk(PALETTE.rockDark, 0.95)); // QA-R3 B1: dunkler, auch auf Fels lesbar
const SMOKE_PERIOD_MS = 3000;
const SMOKE_PUFFS = [14, 5] as const; // je Feuer [normal, reduziert]; Summe bleibt unter CAP_SMOKE
/** Anzahl Rauchpuffs eines Feuers zur Rauchstärke `smoke`. */
export const smokePuffs = (smoke: number, reduce = false): number =>
  Math.ceil(clamp01(smoke) * SMOKE_PUFFS[reduce ? 1 : 0]);
const FLAME_PERIOD_MS = 420;
const DARK_OUTLINE = toInk(PALETTE.rockDark, 0.95);

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
  ctx.strokeStyle = LIGHT_TONE; // warmer Lichtton statt Weiss (S4)
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
  g.addColorStop(0, rgbaOfCss(INK_TONE, 0));
  g.addColorStop(1, rgbaOfCss(INK_TONE, (EDGE_ALPHA * k).toFixed(4)));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.restore();
}

// --- M13-E2 T08: Aufflammen der Feuerschale des Denkmals (Abschluss-Moment, Spec U-12) ---
/** Dauer des Aufflammens in ms (Darstellungswert). */
const FLARE_MS = 3000;
const FLARE_RISE_MS = 300;
/** Stärke 0…1 des Aufflammens über die Zeit seit Start: schneller Anstieg, sanftes Abklingen; 0 ab 3000 ms und bei `reduce`. */
export function flareStrength(elapsedMs: number, reduce: boolean): number {
  if (reduce || !Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= FLARE_MS) return 0;
  const k =
    elapsedMs < FLARE_RISE_MS
      ? elapsedMs / FLARE_RISE_MS
      : 1 - (elapsedMs - FLARE_RISE_MS) / (FLARE_MS - FLARE_RISE_MS);
  return Math.max(0.01, k * k * (3 - 2 * k));
}

/**
 * Aufflammen über der Feuerschale bei `top` (Bildpunkt der Schalenmitte): Schein und aufsteigende Funken in
 * `lightEvening`/`window`. Der Aufrufer setzt im additiven Durchgang `'lighter'`; hier keine Compositing-Änderung.
 * Höchstens `cap('flareSparks')` Funken; bei `reduce` oder nach 3 s wird nichts gezeichnet.
 */
export function drawMonumentFlare(
  ctx: CanvasRenderingContext2D,
  top: Pt,
  elapsedMs: number,
  reduce: boolean,
): void {
  const k = flareStrength(elapsedMs, reduce);
  if (k <= 0) return;
  const r = 34 + 30 * k;
  ctx.save();
  const g = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, r);
  g.addColorStop(0, rgbaOf(PALETTE.window, Number((0.8 * k).toFixed(3))));
  g.addColorStop(0.5, rgbaOf(PALETTE.lightEvening, Number((0.35 * k).toFixed(3))));
  g.addColorStop(1, rgbaOf(PALETTE.lightEvening, 0));
  ctx.fillStyle = g;
  ctx.fillRect(top.x - r, top.y - r, 2 * r, 2 * r);
  const n = Math.min(cap('flareSparks', reduce), Math.ceil(k * cap('flareSparks', reduce)));
  const t = elapsedMs / FLARE_MS;
  ctx.fillStyle = PALETTE.window;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (t * 1.6 + spread(i, 5)) % 1; // Alter 0…1
    const x = top.x + (spread(i, 6) - 0.5) * 26 + Math.sin(a * 6 + i) * 4;
    const y = top.y - a * (30 + 40 * spread(i, 7));
    ctx.arc(x, y, 1.6 * (1 - a * 0.6), 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

// --- I-118: Aufstiegs-Funkeln (ein Haus steigt eine Stufe auf) ---
/** Dauer des Funkelns in ms (gleich `RISE_MS` in `aufstieg.ts`; Darstellungswert). */
const RISE_TOTAL_MS = 1500;
const RISE_PEAK_MS = 200;
/**
 * Stärke 0…1 des Aufstiegs-Kranzes über die Zeit seit Start: Anstieg (smoothstep) bis 200 ms, danach sanftes
 * Abklingen; 0 bei negativer Zeit, `NaN` und ab 1500 ms.
 */
export function riseStrength(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || elapsedMs >= RISE_TOTAL_MS) return 0;
  const k =
    elapsedMs < RISE_PEAK_MS
      ? elapsedMs / RISE_PEAK_MS
      : 1 - (elapsedMs - RISE_PEAK_MS) / (RISE_TOTAL_MS - RISE_PEAK_MS);
  return Math.max(0.01, k * k * (3 - 2 * k));
}
/** Zahl der Funken nach erreichter Stufe (2 → 6, 3 → 7, ab 4 → 8), gedeckelt auf `cap('riseSparks')`; reduziert 0. */
export function riseSparkCount(tier: number, reduce: boolean): number {
  const want = tier >= 4 ? 8 : tier === 3 ? 7 : 6;
  return Math.min(want, cap('riseSparks', reduce));
}
/**
 * Lichtkranz über dem Haus (`rect` = Bildbox) mit aufsteigenden Funken, Farben `window`/`lightEvening`. Der
 * Aufrufer setzt im additiven Durchgang `'lighter'`; hier keine Compositing-Änderung. Funken streuen
 * deterministisch aus `id`. Bei `reduce` ein statischer Schein ohne Puls und ohne Funken, der 1500 ms linear ausblendet.
 */
export function drawRiseGlow(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  elapsedMs: number,
  tier: number,
  id: number,
  reduce: boolean,
): void {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= RISE_TOTAL_MS) return;
  const k = reduce
    ? 1 - elapsedMs / RISE_TOTAL_MS
    : riseStrength(elapsedMs) * (0.92 + 0.08 * Math.sin(elapsedMs / 70));
  if (k <= 0) return;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.18;
  const rx = Math.max(12, rect.w * 0.6);
  const ry = rx * 0.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgbaOf(PALETTE.window, Number((0.7 * k).toFixed(3))));
  g.addColorStop(0.55, rgbaOf(PALETTE.lightEvening, Number((0.35 * k).toFixed(3))));
  g.addColorStop(1, rgbaOf(PALETTE.lightEvening, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const n = riseSparkCount(tier, reduce);
  if (n === 0) return;
  const t = elapsedMs / RISE_TOTAL_MS;
  const big = tier >= 3 ? 2.2 : 1.6;
  ctx.save();
  ctx.fillStyle = PALETTE.window;
  ctx.globalAlpha = clamp01(k);
  for (let i = 0; i < n; i++) {
    const x = rect.x + rect.w * (0.15 + 0.7 * spread(i, id + 11));
    const y = cy + 6 - t * (18 + 26 * spread(i, id + 17)) - spread(i, id + 23) * 6;
    ctx.beginPath();
    ctx.arc(x, y, big * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const BEACON_R = 46;
/**
 * Leuchtfeuer der fertigen Feuerschale bei Nacht (Spec Anhang 06 A, AK-M13E2-46): ruhiger Schein bei `top`
 * (Schalenmitte), Stärke `k` 0…1 aus dem Nachtlicht; flackert leicht, bei `reduce` nicht. Der Aufrufer setzt
 * im additiven Durchgang `'lighter'`; keine Partikel, keine Compositing-Änderung hier.
 */
export function drawMonumentBeacon(
  ctx: CanvasRenderingContext2D,
  top: Pt,
  k: number,
  timeMs: number,
  reduce: boolean,
): void {
  const s = clamp01(k);
  if (s <= 0) return;
  const flick = reduce ? 1 : 0.9 + 0.1 * Math.sin(timeMs / 210);
  ctx.save();
  const g = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, BEACON_R);
  g.addColorStop(0, rgbaOf(PALETTE.window, Number((0.7 * s * flick).toFixed(3))));
  g.addColorStop(0.45, rgbaOf(PALETTE.lightEvening, Number((0.3 * s * flick).toFixed(3))));
  g.addColorStop(1, rgbaOf(PALETTE.lightEvening, 0));
  ctx.fillStyle = g;
  ctx.fillRect(top.x - BEACON_R, top.y - BEACON_R, 2 * BEACON_R, 2 * BEACON_R);
  ctx.restore();
}
