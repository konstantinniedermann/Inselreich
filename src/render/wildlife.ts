// wildlife.ts — Wasser- und Luftleben (H-R2): Fischschwärme mit Sprüngen, seltener Wal, Vogelschwärme.
// Kosmetisch und deterministisch aus `timeMs`, `world.seed`, Küstenfeld und Kachelart (nur `hash2`, nie
// `Math.random`); kein Zustand ausser Caches je Welt, kein Schreibzugriff auf die Welt. `wildlifeAt` ist die
// eine Quelle für Bild (Renderer) und Name (Mouse-over); die Zeichner sind dünn und bündeln je Art.
import { hash2 } from '../sim/noise';
import type { World } from '../sim/types';
import { worldToScreen, type Camera, type TileRange } from './camera';
import { phaseAt, type Phase, type WeatherKind } from './daynight';
import { ISO_H, ISO_W, project } from './iso';
import { coastFor } from './life';
import { cap } from './limits';
import { PALETTE, mixHex, rgbaOf } from './palette';
import { shipTile } from './ship';
import type { Field } from './terrainField';

export type WildlifeKind = 'fish' | 'whale' | 'birds';

/** Umgebung wie beim Renderer (sonst stimmt der Name nicht mit dem Bild); Vorgaben: Phase aus `world.tick`, 'clear', false. */
export interface WildlifeEnv {
  phase?: Phase;
  weather?: WeatherKind;
  reduce?: boolean;
}

interface Pt2 {
  x: number;
  y: number;
}
export interface FishPose {
  /** Schimmerstriche (Kachelraum, Mitte des Strichs). */
  shimmer: Pt2[];
  /** Springender Fisch: Bodenpunkt, Höhe in Weltpixeln, Verlauf 0…1; sonst null. */
  jump: { x: number; y: number; z: number; t: number } | null;
  /** Spritzringe: Mitte (Kachelraum) und Alter 0…1. */
  splash: { x: number; y: number; age: number }[];
}
export interface WhalePose {
  x: number;
  y: number;
  /** Hebung des Rückens 0…1. */
  lift: number;
  /** Fontäne 0…1 (Verlauf) oder -1 ohne Fontäne. */
  spout: number;
  /** Fluke beim Abtauchen 0…1 oder -1. */
  fluke: number;
}
export interface FlockPose {
  birds: { x: number; y: number; z: number; flap: number }[];
}

export interface WildlifeHit {
  kind: WildlifeKind;
  name: 'Fischschwarm' | 'Wal' | 'Vogelschwarm';
  /** Bodenpunkt im Kachelraum (Schwarm- bzw. Tiermitte). */
  x: number;
  y: number;
  /** Höhe über dem Boden in Weltpixeln (Vögel > 0, Wasser 0). */
  z: number;
  /** Trefferradius in Kacheln. */
  r: number;
  pose: FishPose | WhalePose | FlockPose;
}

// --- Konstanten (Darstellungswerte, keine Spielwerte) ---------------------------------------------------

export const FISH_CELL = 6;
export const FISH_SHARE = 0.35;
export const FLOCK_CELL = 12;
export const FLOCK_SHARE = 0.3;
export const WHALE_EPISODE_MS = 60000;
export const WHALE_VISIBLE_MS = 12000;
const WHALE_SHARE = 0.35;
const WHALE_DRIFT = 0.15 / 1000; // Kacheln/ms
const WHALE_SHIP_GAP = 3; // Kacheln
const JUMP_MS = 600;
const SPLASH_MS = 500;
const JUMP_HEIGHT = 0.35 * ISO_H;
const BIRD_SPAN = 0.11 * ISO_H;
const BIRD_PHASES: readonly Phase[] = ['morning', 'day', 'evening'];
const BIRDS_PER_FLOCK = [6, 4] as const;

export const FISH_SHIMMER = rgbaOf(PALETTE.waterDeep, 0.22);
const FISH_SILVER = mixHex(PALETTE.foam, PALETTE.waterShallow, 0.5);
const SPLASH_RGB = PALETTE.foam;
export const WHALE_COLOR = mixHex(PALETTE.roofSlate, PALETTE.waterDeep, 0.4);
export const BIRD_COLOR = mixHex(PALETTE.rockDark, PALETTE.wallTimber, 0.5);

const clampTime = (t: number): number => (Number.isFinite(t) ? Math.max(0, t) : 0);
const fieldAt = (f: Field, x: number, y: number): number => {
  const tx = Math.floor(x),
    ty = Math.floor(y);
  return tx < 0 || ty < 0 || tx >= f.w || ty >= f.h ? 0 : f.v[ty * f.w + tx]!;
};

export interface Anchor {
  tx: number;
  ty: number;
  /** Sortierschlüssel. */
  key: number;
}

/** Je feste Zelle, die den Bereich schneidet und der Zellen-Hash erlaubt, die passende Kachel mit kleinstem Schlüssel. */
function cellAnchors(
  f: Field,
  range: TileRange,
  seed: number,
  cell: number,
  share: number,
  salt: number,
  ok: (x: number, y: number, s: number) => boolean,
  limit: number,
): Anchor[] {
  if (limit <= 0 || range.x1 < range.x0 || range.y1 < range.y0) return [];
  const cx0 = Math.floor(Math.max(0, range.x0) / cell),
    cx1 = Math.floor(Math.min(f.w - 1, range.x1) / cell),
    cy0 = Math.floor(Math.max(0, range.y0) / cell),
    cy1 = Math.floor(Math.min(f.h - 1, range.y1) / cell);
  const out: Anchor[] = [];
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      if (hash2(seed + salt, cx, cy) >= share) continue;
      let best: Anchor | null = null;
      const x1 = Math.min(f.w, (cx + 1) * cell),
        y1 = Math.min(f.h, (cy + 1) * cell);
      for (let y = cy * cell; y < y1; y++)
        for (let x = cx * cell; x < x1; x++) {
          if (!ok(x, y, f.v[y * f.w + x]!)) continue;
          const key = hash2(seed + salt + 1, x, y);
          if (!best || key < best.key) best = { tx: x, ty: y, key };
        }
      if (best) out.push(best);
    }
  return out.sort((a, b) => a.key - b.key).slice(0, limit);
}

/** Anker der Fischschwärme: Wasser mit `1 ≤ −s < 4`, Zellen 6×6, Anteil 0,35, `cap('fish')`. */
export const fishAnchors = (f: Field, range: TileRange, seed: number, reduce = false): Anchor[] =>
  cellAnchors(
    f,
    range,
    seed,
    FISH_CELL,
    FISH_SHARE,
    51,
    (_x, _y, s) => s <= -1 && s > -4,
    cap('fish', reduce),
  );

/** Anker der Vogelschwärme: Wald oder Wiese mit `s ≥ 2`, Zellen 12×12, Anteil 0,3, `cap('flocks')`. */
export const flockAnchors = (
  world: Pick<World, 'width' | 'tiles' | 'seed'>,
  f: Field,
  range: TileRange,
  phase: Phase,
  reduce = false,
): Anchor[] =>
  !BIRD_PHASES.includes(phase)
    ? []
    : cellAnchors(
        f,
        range,
        world.seed,
        FLOCK_CELL,
        FLOCK_SHARE,
        71,
        (x, y, s) => {
          const t = world.tiles[y * world.width + x]?.terrain;
          return s >= 2 && (t === 'forest' || t === 'grass');
        },
        cap('flocks', reduce),
      );

// --- Posen ---------------------------------------------------------------------------------------------

/** Schimmer, Sprung und Spritzringe des Schwarms am Anker `a`; im Sturm ohne Sprung und Ringe. */
export function fishPose(a: Anchor, seed: number, timeMs: number, storm = false): FishPose {
  const t = clampTime(timeMs);
  const hh = (salt: number): number => hash2(seed + 53 + salt, a.tx, a.ty);
  const cx = a.tx + 0.5,
    cy = a.ty + 0.5;
  const n = 3 + Math.floor(hh(0) * 3);
  const shimmer: Pt2[] = [];
  for (let i = 0; i < n; i++)
    shimmer.push({
      x:
        cx +
        (hash2(seed + 54, a.tx * 8 + i, a.ty) - 0.5) * 0.9 +
        Math.sin(t / 2300 + i + hh(1) * 6) * 0.05,
      y:
        cy +
        (hash2(seed + 55, a.tx * 8 + i, a.ty) - 0.5) * 0.9 +
        Math.cos(t / 2900 + i * 2 + hh(2) * 6) * 0.05,
    });
  const pose: FishPose = { shimmer, jump: null, splash: [] };
  if (storm) return pose;
  const period = 4000 + hh(3) * 3000;
  const u = t + hh(4) * period;
  const k = Math.floor(u / period),
    tIn = u - k * period;
  const jx = cx + (hash2(seed + 56, a.tx + k * 7, a.ty) - 0.5) * 0.8,
    jy = cy + (hash2(seed + 57, a.tx, a.ty + k * 7) - 0.5) * 0.8;
  if (tIn < JUMP_MS) {
    const p = tIn / JUMP_MS;
    pose.jump = { x: jx, y: jy, z: 4 * p * (1 - p) * JUMP_HEIGHT, t: p };
    if (tIn < SPLASH_MS) pose.splash.push({ x: jx, y: jy, age: tIn / SPLASH_MS });
  } else if (tIn < JUMP_MS + SPLASH_MS) {
    pose.splash.push({ x: jx, y: jy, age: (tIn - JUMP_MS) / SPLASH_MS });
  }
  return pose;
}

/** Wal-Kandidaten (Wasserkacheln mit `−s ≥ 5`) der ganzen Karte, Cache je Welt. */
const whaleCandidates = new WeakMap<World, number[]>();
function candidatesOf(world: World): number[] {
  let c = whaleCandidates.get(world);
  if (!c) {
    const f = coastFor(world);
    c = [];
    for (let i = 0; i < f.v.length; i++) if (f.v[i]! <= -5) c.push(i);
    whaleCandidates.set(world, c);
  }
  return c;
}

const DIRS = 8;
/** Kleinster Abstand des Punktes `p` zur Strecke `a`–`b`. */
function segDist(a: Pt2, b: Pt2, p: Pt2): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}

/**
 * Wal zur Zeit `timeMs` oder null. Episoden zu 60 s; in ca. 35 % taucht ein Wal für 12 s auf einer Kandidatenkachel
 * auf und driftet 0,15 Kacheln/s in eine Richtung, die tiefes Wasser (`−s ≥ 5`) und 3 Kacheln Abstand zum Schiff hält.
 */
export function whaleAt(world: World, timeMs: number): WhalePose | null {
  const t = clampTime(timeMs);
  const e = Math.floor(t / WHALE_EPISODE_MS);
  if (hash2(world.seed + 61, e, 0) >= WHALE_SHARE) return null;
  const start =
    e * WHALE_EPISODE_MS + hash2(world.seed + 62, e, 0) * (WHALE_EPISODE_MS - WHALE_VISIBLE_MS);
  const dt = t - start;
  if (dt < 0 || dt >= WHALE_VISIBLE_MS) return null;
  const cands = candidatesOf(world);
  const n = cands.length;
  if (n === 0) return null;
  const f = coastFor(world);
  const ship = shipTile(world);
  const sp = ship ? { x: ship.x + 0.5, y: ship.y + 0.5 } : null;
  const i0 = Math.min(n - 1, Math.floor(hash2(world.seed + 63, e, 0) * n));
  const d0 = Math.floor(hash2(world.seed + 64, e, 0) * DIRS);
  const reach = WHALE_DRIFT * WHALE_VISIBLE_MS;
  for (let j = 0; j < n; j++) {
    const c = cands[(i0 + j) % n]!;
    const a = { x: (c % f.w) + 0.5, y: Math.floor(c / f.w) + 0.5 };
    for (let d = 0; d <= DIRS; d++) {
      // letzter Versuch ohne Drift
      const ang = ((d0 + d) / DIRS) * Math.PI * 2;
      const b = d === DIRS ? a : { x: a.x + Math.cos(ang) * reach, y: a.y + Math.sin(ang) * reach };
      const deep = [0, 0.25, 0.5, 0.75, 1].every(
        (u) => fieldAt(f, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u) <= -5,
      );
      if (!deep || (sp && segDist(a, b, sp) < WHALE_SHIP_GAP)) continue;
      const u = dt / WHALE_VISIBLE_MS;
      const rise = Math.min(1, dt / 1500),
        sink = Math.min(1, (WHALE_VISIBLE_MS - dt) / 1500);
      const sprayU = (dt - 2000) / 1200,
        flukeU = (dt - 10000) / 2000;
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        lift: Math.max(0, Math.min(rise, sink)),
        spout: sprayU >= 0 && sprayU <= 1 ? sprayU : -1,
        fluke: flukeU >= 0 ? Math.min(1, flukeU) : -1,
      };
    }
  }
  return null;
}

/** Vogelschwarm am Anker `a`: Figur-Acht-Schleife (Radius 2 bis 3 Kacheln, Periode 20 bis 35 s), Vögel mit Versatz. */
export function flockPose(
  a: Anchor,
  seed: number,
  timeMs: number,
  reduce = false,
): FlockPose & { z: number; x: number; y: number } {
  const t = clampTime(timeMs);
  const hh = (salt: number): number => hash2(seed + 73 + salt, a.tx, a.ty);
  const R = 2 + hh(0),
    period = 20000 + hh(1) * 15000,
    th0 = (t / period + hh(2)) * Math.PI * 2;
  const baseZ = (1.6 + 0.6 * hh(3)) * ISO_H;
  const at = (th: number): Pt2 => ({
    x: a.tx + 0.5 + R * Math.sin(th),
    y: a.ty + 0.5 + R * 0.8 * Math.sin(2 * th),
  });
  const count = BIRDS_PER_FLOCK[reduce ? 1 : 0];
  const birds: FlockPose['birds'] = [];
  for (let i = 0; i < count; i++) {
    const p = at(th0 - 0.05 * i);
    birds.push({
      x: p.x + (hash2(seed + 77, a.tx * 8 + i, a.ty) - 0.5) * 0.7,
      y: p.y + (hash2(seed + 78, a.tx * 8 + i, a.ty) - 0.5) * 0.7,
      z: baseZ + Math.sin(th0 * 2 + i) * 0.12 * ISO_H,
      flap: Math.sin(t / (130 + (i % 3) * 20) + i * 1.7),
    });
  }
  const c = at(th0);
  return { birds, x: c.x, y: c.y, z: baseZ };
}

// --- Abfrage -------------------------------------------------------------------------------------------

const inRange = (r: TileRange, x: number, y: number): boolean =>
  x >= r.x0 && x < r.x1 + 1 && y >= r.y0 && y < r.y1 + 1;

/**
 * Alle sichtbaren Tiere im Bereich zur Zeit `timeMs` (Fische, Wal, Vögel; leerer Bereich → []). Rein, wirft nicht,
 * schreibt nie in die Welt. Zeiger-Treffer legt die UI im Bildraum gegen `project(x, y) − z` und `r`.
 */
export function wildlifeAt(
  world: World,
  range: TileRange,
  timeMs: number,
  env: WildlifeEnv = {},
): WildlifeHit[] {
  if (!(range.x1 >= range.x0) || !(range.y1 >= range.y0)) return [];
  const phase = env.phase ?? phaseAt(world.tick);
  const weather = env.weather ?? 'clear';
  const reduce = env.reduce === true;
  const field = coastFor(world);
  const out: WildlifeHit[] = [];
  for (const a of fishAnchors(field, range, world.seed, reduce)) {
    const x = a.tx + 0.5,
      y = a.ty + 0.5;
    if (!inRange(range, x, y)) continue;
    out.push({
      kind: 'fish',
      name: 'Fischschwarm',
      x,
      y,
      z: 0,
      r: 0.6,
      pose: fishPose(a, world.seed, timeMs, weather === 'storm'),
    });
  }
  if (cap('whales', reduce) > 0) {
    const w = whaleAt(world, timeMs);
    if (w && inRange(range, w.x, w.y))
      out.push({ kind: 'whale', name: 'Wal', x: w.x, y: w.y, z: 0, r: 1.0, pose: w });
  }
  if (weather === 'clear' || weather === 'cloudy')
    for (const a of flockAnchors(world, field, range, phase, reduce)) {
      const p = flockPose(a, world.seed, timeMs, reduce);
      if (!inRange(range, p.x, p.y)) continue;
      out.push({
        kind: 'birds',
        name: 'Vogelschwarm',
        x: p.x,
        y: p.y,
        z: p.z,
        r: 1.2,
        pose: { birds: p.birds },
      });
    }
  return out;
}

// --- Zeichner (dünn, Bildraum) -----------------------------------------------------------------------------

/** Ring als Raute-Ellipse im Bildraum (Polylinie), `age` 0…1 wächst und verblasst. */
function ringPath(ctx: CanvasRenderingContext2D, c: Pt2, rx: number): void {
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = c.x + Math.cos(a) * rx,
      y = c.y + Math.sin(a) * rx * 0.5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

/** Wasserleben (Fische, Wal) aus `wildlifeAt`-Treffern; Fische gebündelt je Art (Schimmer, Sprünge, Ringe). */
export function drawWaterLife(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly WildlifeHit[],
): void {
  const z = cam.zoom;
  const fish = hits.filter((x) => x.kind === 'fish');
  const scr = (p: Pt2, up = 0): Pt2 => {
    const q = project(p.x, p.y);
    return worldToScreen(cam, { x: q.x, y: q.y - up });
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (fish.length > 0) {
    ctx.strokeStyle = FISH_SHIMMER;
    ctx.lineWidth = Math.max(1, 2.2 * z);
    ctx.beginPath();
    for (const f of fish)
      for (const s of (f.pose as FishPose).shimmer) {
        const c = scr(s);
        ctx.moveTo(c.x - 0.1 * ISO_W * z, c.y - 0.05 * ISO_H * z);
        ctx.lineTo(c.x + 0.1 * ISO_W * z, c.y + 0.05 * ISO_H * z);
      }
    ctx.stroke();
    // Spritzringe (andere Strichbreite und Tonart als die Möwen)
    ctx.strokeStyle = rgbaOf(SPLASH_RGB, 0.45);
    ctx.lineWidth = Math.max(0.75, 1 * z);
    ctx.beginPath();
    let rings = 0;
    for (const f of fish)
      for (const s of (f.pose as FishPose).splash) {
        ringPath(ctx, scr(s), (0.05 + 0.2 * s.age) * ISO_W * z);
        rings++;
      }
    if (rings > 0) ctx.stroke();
    // springende Fische: kurzer silbriger Strich, Neigung folgt dem Bogen
    ctx.strokeStyle = FISH_SILVER;
    ctx.lineWidth = Math.max(1, 2 * z);
    ctx.beginPath();
    let jumps = 0;
    for (const f of fish) {
      const j = (f.pose as FishPose).jump;
      if (!j) continue;
      const c = scr(j, j.z);
      const tilt = (0.5 - j.t) * 0.12 * ISO_H * z;
      ctx.moveTo(c.x - 0.09 * ISO_W * z, c.y - tilt);
      ctx.lineTo(c.x + 0.09 * ISO_W * z, c.y + tilt);
      jumps++;
    }
    if (jumps > 0) ctx.stroke();
  }
  for (const w of hits) {
    if (w.kind !== 'whale') continue;
    const p = w.pose as WhalePose;
    if (p.lift <= 0) continue;
    const b = scr(p);
    const rx = 0.5 * ISO_W * z,
      top = p.lift * 0.22 * ISO_H * z;
    // Kielwasser
    ctx.strokeStyle = rgbaOf(SPLASH_RGB, 0.35 * p.lift);
    ctx.lineWidth = Math.max(0.75, z);
    ctx.beginPath();
    ringPath(ctx, b, rx * 1.15);
    ctx.stroke();
    // flacher Rücken (Halbellipse)
    ctx.fillStyle = WHALE_COLOR;
    ctx.beginPath();
    ctx.moveTo(b.x - rx, b.y);
    for (let i = 1; i < 8; i++) {
      const a = Math.PI - (i / 8) * Math.PI;
      ctx.lineTo(b.x + Math.cos(a) * rx, b.y - Math.sin(a) * top);
    }
    ctx.lineTo(b.x + rx, b.y);
    ctx.closePath();
    ctx.fill();
    if (p.spout >= 0) {
      const hgt = Math.sin(p.spout * Math.PI) * 0.55 * ISO_H * z;
      ctx.strokeStyle = rgbaOf(SPLASH_RGB, 0.7 * (1 - p.spout * 0.5));
      ctx.lineWidth = Math.max(1, 1.2 * z);
      ctx.beginPath();
      for (const dx of [-0.08, 0, 0.08]) {
        ctx.moveTo(b.x + rx * 0.4, b.y - top);
        ctx.lineTo(b.x + rx * 0.4 + dx * ISO_W * z * 1.5, b.y - top - hgt);
      }
      ctx.stroke();
    }
    if (p.fluke >= 0) {
      const up = Math.sin(Math.min(1, p.fluke * 1.2) * Math.PI * 0.8) * 0.3 * ISO_H * z;
      const tx = b.x - rx * 0.9;
      ctx.fillStyle = WHALE_COLOR;
      ctx.beginPath();
      ctx.moveTo(tx - 0.12 * ISO_W * z, b.y - up);
      ctx.lineTo(tx, b.y - up * 0.5);
      ctx.lineTo(tx + 0.12 * ISO_W * z, b.y - up);
      ctx.lineTo(tx, b.y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Vogelschwärme (Luft): alle Vögel aller Schwärme in einem Pfad mit einem Strich, dunkel und klein. */
export function drawFlocks(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly WildlifeHit[],
): void {
  const flocks = hits.filter((x) => x.kind === 'birds');
  if (flocks.length === 0) return;
  const z = cam.zoom,
    span = BIRD_SPAN * z;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = BIRD_COLOR;
  ctx.lineWidth = Math.max(1, 1.3 * z);
  ctx.beginPath();
  for (const f of flocks)
    for (const b of (f.pose as FlockPose).birds) {
      const p = project(b.x, b.y);
      const c = worldToScreen(cam, { x: p.x, y: p.y - b.z });
      const lift = b.flap * 0.4 * span;
      ctx.moveTo(c.x - span, c.y - lift);
      ctx.lineTo(c.x, c.y + 0.12 * span);
      ctx.lineTo(c.x + span, c.y - lift);
    }
  ctx.stroke();
  ctx.restore();
}
