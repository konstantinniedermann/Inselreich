import { home } from '../sim/world';
import { hash2 } from '../sim/noise';
import type { World } from '../sim/types';
import { PALETTE, rgbaOf } from './palette';
import type { Weather } from './daynight';
import { CLEAR } from './weather';
import { SEA_PAD, seaContext, seaKontorBlocked, seaPlan, type SeaContext } from './decor';
import { coastField, coastValue, fieldWorld, rimWeight, terrainFields } from './terrainField';

// water.ts — Schaumsaum und Wellen (Spec 5.2, ISO §6). Alles im Kachelraum, Aufruf unter der Bodenmatrix.
// L5: Brandungsschaum an Riff, Wrack, Meeresfels und Felseiland (Salz 566–569 über `hash2` für die Phasen).
export const FOAM_PERIOD_MS = 3200; // Spec 5.2: Periode des Schaumsaums
export const FOAM_ALPHA: [number, number] = [0.35, 0.7]; // weicher Saum
export const FOAM_CORE_ALPHA: [number, number] = [0.85, 1]; // Kernlinie: farbnah zu foam (I2)
export const WAVE_ALPHA = 0.12;
const FOAM_SEAM_WIDTH = 0.09; // Kachel-Einheiten (unter der Bodenmatrix verzerrt, gewollt)
const FOAM_CORE_WIDTH = 0.07; // ≥ 1,5 px in jeder Richtung bei Zoom 1 (kleinster Singulärwert der Bodenmatrix 22,6 px je Kachel)
const FOAM_REST = 0.08; // Mittellage der Linie in Kacheln vor dem Strand
const FOAM_SWING = 0.075; // Wanderweite zum Strand hin und zurück (Spec 5.2: ≥ 3 px bei Zoom 1 zwischen den Extremlagen)
const WAVE_PERIOD_MS = 2400;
const WAVE_AMPLITUDE = 0.07;
const WAVE_LINE_WIDTH = 0.04;
/** Darstellungszuschläge im Sturm über die Spec-Faktoren hinaus (QA-R3 B2: Wellen sollen sichtbar höher wirken). */
export const STORM_AMP_BOOST = 0.5; // Amplitude × (1 + w) × (1 + 0,5 w)
export const STORM_WAVE_ALPHA = 0.32; // Deckkraft der Wellenstriche bei w = 1 (Ruhe: WAVE_ALPHA)
const STORM_WAVE_LENGTH = 0.15; // Verlängerung je Seite in Kacheln bei w = 1
export const stormWaveAlpha = (w: number): number =>
  WAVE_ALPHA + (STORM_WAVE_ALPHA - WAVE_ALPHA) * w;
/**
 * Tiefe (Kachelmitte, in Kacheln) ab der Wellenstriche liegen. Spec: nur auf Wasser mit −s ≥ 1. Eine Kachel mit
 * Mittenwert 1 enthält Pixel mit −s < 1, also Flachwasser; erst ab 2 liegt jede Lage der Striche im Tiefenbereich.
 */
const WAVE_MIN_DEPTH = 2;

interface WaterInfo {
  depth: Float32Array; // Tiefe je Kachelmitte (Kacheln, 0 auf Land)
  phase: Float32Array; // Wellenphase je Kachel (0..2π)
  lift: Float32Array; // Lage der Welle in der Kachel (0.25..0.75)
  start: Int32Array; // Index des ersten Küstensegments je Kachel (n + 1 Einträge)
  segs: Float32Array; // je Segment SEG Werte: zwei Endpunkte (x, y) mit je einer Normalen (nx, ny) ins Wasser
}
const SEG = 8;
const CELLS = 8; // Marching-Squares-Zellen je Kachelkante
const GRAD_H = 0.04; // Schrittweite für die Normale aus dem Feldgefälle (Kacheln)

// Terrain ändert sich im Spiel nicht: einmal je Welt vorberechnen.
// Gültig, solange Geländewechsel nur Wald ↔ Weide betreffen (Spec M10 7); andere Geländeänderungen müssen diesen Cache neu bewerten.
const cache = new WeakMap<World, WaterInfo>();

/**
 * Küstenlinie als Höhenlinie `F = 0` desselben Felds, das das Terrain zeichnet (`coastValue`), per Marching Squares
 * auf einem Raster von 1/CELLS Kachel, nur in Kacheln mit Landkontakt. Die Normale kommt aus dem Gefälle von F.
 */
function contour(world: World, depth: Float32Array, start: Int32Array): number[] {
  const isl = home(world);
  const { width: w, height: h } = isl;
  const fields = terrainFields(fieldWorld(world));
  const flat: number[] = [];
  const normal = (x: number, y: number): [number, number] => {
    const gx = coastValue(fields, x + GRAD_H, y) - coastValue(fields, x - GRAD_H, y);
    const gy = coastValue(fields, x, y + GRAD_H) - coastValue(fields, x, y - GRAD_H);
    const len = Math.hypot(gx, gy) || 1;
    return [-gx / len, -gy / len];
  };
  const F = new Float32Array((CELLS + 1) * (CELLS + 1));
  const push = (p: [number, number], q: [number, number]): void => {
    const np = normal(p[0], p[1]),
      nq = normal(q[0], q[1]);
    flat.push(p[0], p[1], np[0], np[1], q[0], q[1], nq[0], nq[1]);
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      start[i] = flat.length / SEG;
      if (Math.abs(depth[i]!) > 1.5 && isl.tiles[i]!.terrain === 'water') continue;
      if (isl.tiles[i]!.terrain !== 'water' && !touchesWater(world, x, y)) continue;
      for (let j = 0; j <= CELLS; j++)
        for (let k = 0; k <= CELLS; k++)
          F[j * (CELLS + 1) + k] = coastValue(fields, x + k / CELLS, y + j / CELLS);
      for (let j = 0; j < CELLS; j++)
        for (let k = 0; k < CELLS; k++) {
          const a = F[j * (CELLS + 1) + k]!, // links oben
            b = F[j * (CELLS + 1) + k + 1]!, // rechts oben
            c = F[(j + 1) * (CELLS + 1) + k + 1]!, // rechts unten
            d = F[(j + 1) * (CELLS + 1) + k]!; // links unten
          const x0 = x + k / CELLS,
            y0 = y + j / CELLS,
            e = 1 / CELLS;
          const lerp = (u: number, v: number): number => (u === v ? 0.5 : u / (u - v));
          const top = (): [number, number] => [x0 + lerp(a, b) * e, y0];
          const right = (): [number, number] => [x0 + e, y0 + lerp(b, c) * e];
          const bottom = (): [number, number] => [x0 + lerp(d, c) * e, y0 + e];
          const left = (): [number, number] => [x0, y0 + lerp(a, d) * e];
          const idx = (a <= 0 ? 8 : 0) | (b <= 0 ? 4 : 0) | (c <= 0 ? 2 : 0) | (d <= 0 ? 1 : 0);
          switch (idx) {
            case 1:
            case 14:
              push(left(), bottom());
              break;
            case 2:
            case 13:
              push(bottom(), right());
              break;
            case 3:
            case 12:
              push(left(), right());
              break;
            case 4:
            case 11:
              push(top(), right());
              break;
            case 6:
            case 9:
              push(top(), bottom());
              break;
            case 7:
            case 8:
              push(left(), top());
              break;
            case 5:
            case 10: {
              const mid = (a + b + c + d) / 4;
              // Sattel: Mittelwert entscheidet, ob die Wasserecken verbunden sind
              if ((idx === 5) === mid <= 0) {
                push(left(), top());
                push(bottom(), right());
              } else {
                push(left(), bottom());
                push(top(), right());
              }
              break;
            }
            default:
              break;
          }
        }
    }
  start[w * h] = flat.length / SEG;
  return flat;
}

function touchesWater(world: World, x: number, y: number): boolean {
  const isl = home(world);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= isl.width || ny >= isl.height) continue;
      if (isl.tiles[ny * isl.width + nx]!.terrain === 'water') return true;
    }
  return false;
}

function infoFor(world: World): WaterInfo {
  const hit = cache.get(world);
  if (hit) return hit;
  const { width: w, height: h } = home(world);
  const { seed } = world;
  const field = coastField(fieldWorld(world));
  const n = w * h;
  const depth = new Float32Array(n);
  const phase = new Float32Array(n);
  const lift = new Float32Array(n);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      phase[i] = hash2(seed + 101, x, y) * Math.PI * 2;
      lift[i] = 0.25 + hash2(seed + 202, x, y) * 0.5;
      depth[i] = Math.max(0, -field.v[i]!);
    }
  const start = new Int32Array(n + 1);
  // Kacheln ohne Küste (Tiefe 0 = Land, ≥ 2 = offenes Wasser) liefern keine Segmente; Land trägt Tiefe 0
  const segs = Float32Array.from(contour(world, depth, start));
  const info = { depth, phase, lift, start, segs };
  cache.set(world, info);
  return info;
}

// ---------- L5: Schaum an Riff, Wrack, Meeresfels, Felseiland ----------

export interface FoamPiece {
  /** Radius des Bogenstücks um die Objektmitte (Kacheln), Winkelbereich a0 < a1 (rad), Phase und Strichstärke. */
  r: number;
  a0: number;
  a1: number;
  phase: number;
  thick: boolean;
}
export interface FoamRing {
  /** Mitte (Kachelraum), Fussabdruck-Radius des Objekts und die 3–5 unregelmässigen Bogenstücke (nie ein geschlossener Kreis). */
  x: number;
  y: number;
  fp: number;
  pieces: FoamPiece[];
  /** Kachel des Objekts und Zuschlag für den R4-Sichtbarkeitsfilter (`seaKontorBlocked`). */
  tx: number;
  ty: number;
  pad: number;
}
/** Kurze gebogene Schaumsichel am Riff (Anfang, Steuerpunkt, Ende im Kachelraum); `tx`/`ty` = Riffkachel. */
export interface FoamReef {
  tx: number;
  ty: number;
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  phase: number;
  /** Einheitsvektor zur See (Wanderrichtung). */
  dx: number;
  dy: number;
}
export interface SeaFoam {
  rings: FoamRing[];
  reefs: FoamReef[];
}
const seaFoamCache = new WeakMap<World, SeaFoam>();
/** Fussabdruck-Radien der Objekte (Kacheln); der Schaum liegt bei Fussabdruck + 0,03 … 0,145. */
const FOOT = { wreck: 0.5, rock: 0.3, needle: 0.26, islet: 0.5 } as const;
/** Reichweite der Landsuche für die Seeseite (Kacheln). */
const LAND_REACH = 7;

/** Einheitsvektor vom Land weg (zur See) an der Kachel `t`: Landkacheln im Umkreis, gewichtet mit 1 / Abstand². */
function seaward(isl: ReturnType<typeof home>, tx: number, ty: number): [number, number] {
  const { width: w, height: h } = isl;
  let lx = 0,
    ly = 0;
  for (let dy = -LAND_REACH; dy <= LAND_REACH; dy++)
    for (let dx = -LAND_REACH; dx <= LAND_REACH; dx++) {
      const nx = tx + dx,
        ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || isl.tiles[ny * w + nx]!.terrain === 'water')
        continue;
      const d = Math.hypot(dx, dy);
      lx += dx / (d * d);
      ly += dy / (d * d);
    }
  const l = Math.hypot(lx, ly);
  return l > 1e-9 ? [-lx / l, -ly / l] : [1, 0];
}

/**
 * Schaumelemente der Heimat aus `seaPlan` (statisch, je Welt einmal): unregelmässige Bogenstücke dicht am Objekt, vor allem
 * auf der Seeseite (Salze 566–568 über `hash2`), und kurze gebogene Sicheln an der Seekante des Riffs (569). Die Welt wird
 * nur gelesen. Ohne Heimat-Art (Testwelten) leer.
 */
export function seaFoam(world: World): SeaFoam {
  const hit = seaFoamCache.get(world);
  if (hit) return hit;
  const out: SeaFoam = { rings: [], reefs: [] };
  const isl = home(world);
  if (isl.kind === 'home') {
    const plan = seaPlan(world.seed, isl, seaContext(world));
    const seed = world.seed;
    const ring = (salt: number, tx: number, ty: number, fp: number, pad: number): void => {
      const hs = (k: number): number => hash2(seed + salt, tx * 64 + k, ty);
      const [dx, dy] = seaward(isl, tx, ty);
      const th = Math.atan2(dy, dx);
      const n = 3 + Math.floor(hs(0) * 3);
      const offs = [
        0,
        1.2 + 0.4 * hs(1),
        -(1.2 + 0.4 * hs(2)),
        2.3 + 0.3 * hs(3),
        -(2.3 + 0.3 * hs(4)),
      ];
      const pieces: FoamPiece[] = [];
      for (let k = 0; k < n; k++) {
        const len =
          k === 0 ? 0.9 + 0.5 * hs(10) : k === n - 1 ? 0.3 + 0.1 * hs(11) : 0.35 + 0.4 * hs(12 + k);
        const r = k === 0 ? fp + 0.03 : k === 1 ? fp + 0.145 : fp + 0.03 + 0.115 * hs(20 + k);
        const c = th + offs[k]!;
        pieces.push({
          r,
          a0: c - len / 2,
          a1: c + len / 2,
          phase: hs(30 + k) * Math.PI * 2,
          thick: hs(40 + k) < 0.45,
        });
      }
      out.rings.push({ x: tx + 0.5, y: ty + 0.5, fp, pieces, tx, ty, pad });
    };
    if (plan.wreck) ring(566, plan.wreck.x, plan.wreck.y, FOOT.wreck, SEA_PAD.wreck);
    for (const r of plan.rocks)
      ring(567, r.x, r.y, r.needle ? FOOT.needle : FOOT.rock, SEA_PAD.rock);
    if (plan.islet) ring(568, plan.islet.x, plan.islet.y, FOOT.islet, SEA_PAD.islet);
    for (const a of plan.reefs)
      for (const t of a.tiles) {
        const [dx, dy] = seaward(isl, t.x, t.y);
        const px = -dy,
          py = dx;
        const hs = (k: number): number => hash2(seed + 569, t.x * 64 + k, t.y + 400);
        if (hs(0) < 0.15) continue; // Lücke
        const count = hs(1) < 0.5 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const off = 0.3 + 0.2 * hs(2 + k * 8);
          const s0 = -0.5 + 0.55 * hs(3 + k * 8) + (k ? 0.1 : 0);
          const len = 0.22 + 0.5 * hs(4 + k * 8);
          const bulge = (0.08 + 0.14 * hs(5 + k * 8)) * (hs(6 + k * 8) < 0.5 ? -1 : 1);
          const x0 = t.x + 0.5 + dx * off + px * s0,
            y0 = t.y + 0.5 + dy * off + py * s0;
          const drift = 0.06 * (hs(7 + k * 8) - 0.5);
          const x1 = x0 + px * len + dx * drift,
            y1 = y0 + py * len + dy * drift;
          out.reefs.push({
            tx: t.x,
            ty: t.y,
            x0,
            y0,
            x1,
            y1,
            cx: (x0 + x1) / 2 + dx * bulge,
            cy: (y0 + y1) / 2 + dy * bulge,
            phase: hs(9 + k * 8) * Math.PI * 2,
            dx,
            dy,
          });
        }
      }
  }
  seaFoamCache.set(world, out);
  return out;
}

const visibleCache = new WeakMap<SeaContext, SeaFoam>();
/**
 * `seaFoam` ohne die Objekte, die R4 wegen eines jetzigen Kontors in < 4 Kacheln ausblendet (derselbe Filter wie bei den
 * Stempeln: nie Schaum ohne Objekt). Je Seekontext einmal gehalten; die Riffsicheln bleiben (Flächen sind nur Bodentönung).
 */
export function seaFoamVisible(world: World): SeaFoam {
  const f = seaFoam(world);
  if (home(world).kind !== 'home') return f;
  const ctx = seaContext(world);
  let v = visibleCache.get(ctx);
  if (!v) {
    v = { rings: f.rings.filter((r) => !seaKontorBlocked(ctx, r.tx, r.ty, r.pad)), reefs: f.reefs };
    visibleCache.set(ctx, v);
  }
  return v;
}

/** Brandungsschaum der Meer-Elemente im `range`: gleitend (Phase je Stück), nie aus; `reduce` = statisch. */
function drawSeaFoam(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: { x0: number; y0: number; x1: number; y1: number },
  phaseT: number,
  alpha: number,
  core: number,
  widthK: number,
  reduce: boolean,
): void {
  const f = seaFoamVisible(world);
  if (!f.rings.length && !f.reefs.length) return;
  const inRange = (x: number, y: number, pad: number): boolean =>
    x + pad >= range.x0 &&
    x - pad <= range.x1 + 1 &&
    y + pad >= range.y0 &&
    y - pad <= range.y1 + 1;
  // zwei Strichstärken; die Deckkraft liegt im unteren Teil des Bands
  const lo = (v: number, band: readonly [number, number], k: number): number =>
    band[0] + (v - band[0]) * k;
  const aSeam = lo(alpha, FOAM_ALPHA, 0.5),
    aCore = lo(core, FOAM_CORE_ALPHA, 0.4);
  for (const thick of [true, false]) {
    ctx.beginPath();
    let any = false;
    for (const r of f.rings) {
      if (!inRange(r.x, r.y, r.fp + 0.3)) continue;
      for (const p of r.pieces) {
        if (p.thick !== thick) continue;
        const rad = p.r + (reduce ? 0 : 0.01 * Math.sin(phaseT + p.phase));
        ctx.moveTo(r.x + Math.cos(p.a0) * rad, r.y + Math.sin(p.a0) * rad);
        ctx.arc(r.x, r.y, rad, p.a0, p.a1);
        any = true;
      }
    }
    if (!thick)
      for (const c of f.reefs) {
        if (!inRange(c.tx + 0.5, c.ty + 0.5, 0.9)) continue;
        const w = reduce ? 0 : 0.035 * Math.sin(phaseT + c.phase);
        const ox = c.dx * w,
          oy = c.dy * w;
        ctx.moveTo(c.x0 + ox, c.y0 + oy);
        ctx.quadraticCurveTo(c.cx + ox, c.cy + oy, c.x1 + ox, c.y1 + oy);
        any = true;
      }
    if (!any) continue;
    ctx.lineWidth = FOAM_SEAM_WIDTH * widthK * (thick ? 1.25 : 0.75);
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(aSeam.toFixed(4)));
    ctx.stroke();
    ctx.lineWidth = FOAM_CORE_WIDTH * widthK * (thick ? 1.2 : 0.7);
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(aCore.toFixed(4)));
    ctx.stroke();
  }
}

/**
 * Schaumsaum und Wellenstriche auf Wasserkacheln im Bereich x0..x1/y0..y1 (inklusive).
 * Zeichnet im Kachelraum (1 Einheit = 1 Kachel): Aufruf unter der Bodenmatrix (`withGround`).
 * Sturm (Spec 5.2): Amplitude × (1 + w), Schaumbreite × (1 + 1,5 w), Periode × (1 − 0,4 w); `reduce` halbiert
 * die Amplitude (Spec 9.2). `seaElements` false lässt den Schaum an Riff, Wrack, Fels und Eiland (L5) weg (Küstentests).
 */
export function drawWaves(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: { x0: number; y0: number; x1: number; y1: number },
  timeMs: number,
  weather: Weather = CLEAR,
  reduce = false,
  seaElements = true,
): void {
  const info = infoFor(world);
  const isl = home(world);
  const { width: w, height: h } = isl;
  const x0 = Math.max(0, range.x0),
    x1 = Math.min(w - 1, range.x1),
    y0 = Math.max(0, range.y0),
    y1 = Math.min(h - 1, range.y1);
  if (x1 < x0 || y1 < y0) return;
  ctx.lineCap = 'round';
  const sw =
    weather.kind === 'storm' && Number.isFinite(weather.w)
      ? Math.min(1, Math.max(0, weather.w))
      : 0;
  const ampK = (1 + sw) * (1 + STORM_AMP_BOOST * sw) * (reduce ? 0.5 : 1),
    widthK = 1 + 1.5 * sw,
    periodK = 1 - 0.4 * sw;

  // Schaumsaum: ein Pfad je Frame entlang der Küstenlinie, einmal als weicher Saum und einmal als Kernlinie
  const phaseT = (2 * Math.PI * timeMs) / (FOAM_PERIOD_MS * periodK);
  const swing = 0.5 + 0.5 * Math.sin(phaseT);
  const alpha = FOAM_ALPHA[0] + (FOAM_ALPHA[1] - FOAM_ALPHA[0]) * swing;
  const core = FOAM_CORE_ALPHA[0] + (FOAM_CORE_ALPHA[1] - FOAM_CORE_ALPHA[0]) * swing;
  ctx.beginPath();
  let any = false;
  const at = (px: number, py: number, nx: number, ny: number): [number, number] => {
    // Phase hängt am Punkt, damit benachbarte Segmente nahtlos wandern
    const off = FOAM_REST + FOAM_SWING * Math.sin(phaseT + 0.35 * (px + py));
    return [px + nx * off, py + ny * off];
  };
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      for (let p = info.start[i]!; p < info.start[i + 1]!; p++) {
        const o = p * SEG,
          g = info.segs;
        const a = at(g[o]!, g[o + 1]!, g[o + 2]!, g[o + 3]!),
          b = at(g[o + 4]!, g[o + 5]!, g[o + 6]!, g[o + 7]!);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        any = true;
      }
    }
  if (any) {
    ctx.lineWidth = FOAM_SEAM_WIDTH * widthK;
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(alpha.toFixed(4)));
    ctx.stroke();
    ctx.lineWidth = FOAM_CORE_WIDTH * widthK;
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(core.toFixed(4)));
    ctx.stroke();
  }

  // L5: Schaum an Riff, Wrack, Fels und Eiland (reduceMotion: statisch, Mittelwert der Deckkraft)
  const calm = reduce
    ? { a: (FOAM_ALPHA[0] + FOAM_ALPHA[1]) / 2, c: (FOAM_CORE_ALPHA[0] + FOAM_CORE_ALPHA[1]) / 2 }
    : { a: alpha, c: core };
  if (seaElements)
    drawSeaFoam(ctx, world, { x0, y0, x1, y1 }, phaseT, calm.a, calm.c, widthK, reduce);

  // Wellenstriche: foam mit Deckkraft 0,12, nur im tiefen Wasser
  const t = (timeMs / (WAVE_PERIOD_MS * periodK)) * Math.PI * 2;
  ctx.lineWidth = WAVE_LINE_WIDTH * (1 + sw);
  const ext = STORM_WAVE_LENGTH * sw;
  ctx.beginPath();
  let waves = false;
  // Meerkante (M12 E1): Kacheln am Rand der Inselansicht bekommen weniger oder keine Striche; je Gewicht ein eigener Pfad
  const faded = new Map<number, [number, number, number][]>();
  const stroke = (x: number, wy: number, ph: number): void => {
    ctx.moveTo(x + 0.2 - ext, wy);
    ctx.quadraticCurveTo(x + 0.5, wy - 0.1 * ampK * Math.cos(t + ph), x + 0.8 + ext, wy);
  };
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (isl.tiles[i]!.terrain !== 'water' || info.depth[i]! < WAVE_MIN_DEPTH) continue;
      const rim = rimWeight(x + 0.5, y + 0.5, w, h);
      if (rim === 0) continue;
      const ph = info.phase[i]!;
      const wy = y + info.lift[i]! + Math.sin(t + ph) * WAVE_AMPLITUDE * ampK;
      if (rim < 1) {
        const list = faded.get(rim) ?? [];
        list.push([x, wy, ph]);
        faded.set(rim, list);
        continue;
      }
      stroke(x, wy, ph);
      waves = true;
    }
  const alphaW = stormWaveAlpha(sw);
  if (waves) {
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(alphaW.toFixed(4)));
    ctx.stroke();
  }
  for (const [rim, list] of faded) {
    ctx.beginPath();
    for (const [x, wy, ph] of list) stroke(x, wy, ph);
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number((alphaW * rim).toFixed(4)));
    ctx.stroke();
  }
}
