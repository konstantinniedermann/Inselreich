import { home } from '../sim/world';
// wildlife.ts — Wasser- und Luftleben (H-R2): Fischschwärme mit Sprüngen, seltener Wal, Vogelschwärme.
// Kosmetisch und deterministisch aus `timeMs`, `world.seed`, Küstenfeld und Kachelart (nur `hash2`, nie
// `Math.random`); kein Zustand ausser Caches je Welt, kein Schreibzugriff auf die Welt. `wildlifeAt` ist die
// eine Quelle für Bild (Renderer) und Name (Mouse-over); die Zeichner sind dünn und bündeln je Art.
import { BUILDING_DEFS } from '../sim/defs/buildings';
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
export type WhalePhase = 'surface' | 'swim' | 'dive' | 'fluke';
export interface WhalePose {
  x: number;
  y: number;
  /** Schwimmrichtung im Kachelraum (Bogenmass). */
  heading: number;
  /** Phase des 12-s-Ablaufs: 0–2 s Auftauchen, 2–8 s Schwimmen, 8–10 s Abtauchen, 10–12 s Fluke. */
  phase: WhalePhase;
  /** Hebung des Rückens 0…1 (in der Fluke-Phase 0). */
  lift: number;
  /** Fontäne 0…1 (Verlauf, nur beim Auftauchen) oder -1 ohne Fontäne. */
  spout: number;
  /** Höhe der Fluke 0…1 oder -1 ausserhalb der Fluke-Phase. */
  fluke: number;
  /** Deckkraft der Fluke 0…1 (blendet am Ende aus). */
  fade: number;
  /** Wellenbogen des Rückens beim Schwimmen −1…1. */
  swell: number;
  /** Krümmung beim Abtauchen 0…1 (Kopf sinkt zuerst). */
  curl: number;
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
// Jede Zelle darf einen Schwarm tragen (Land mit Abstand zum Wasser ist knapp); die Kappe und der Nähe-Vorrang wählen aus.
export const FLOCK_SHARE = 1;
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

export const FISH_SHIMMER = rgbaOf(PALETTE.waterDeep, 0.32);
const FISH_RIM = rgbaOf(PALETTE.waterDeep, 0.75);
export const FISH_SILVER = mixHex(PALETTE.foam, PALETTE.waterShallow, 0.5);
const SPLASH_RGB = PALETTE.foam;
// Nur Hex-Werte in mixHex (rgbOf parst kein `rgb(…)`): dunkles Blaugrau, Unterseite dunkler, Glanz heller
const WHALE_DARK = '#1c2430';
export const WHALE_COLOR = mixHex(PALETTE.roofSlate, WHALE_DARK, 0.35);
export const WHALE_GLOSS = mixHex(PALETTE.roofSlate, PALETTE.foam, 0.3);
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
  near?: Pt2,
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
  // Nähe-Vorrang: Der Sortierschlüssel der Kappung enthält den Abstand zum Kontor (Anteil Abstand/Kartenbreite),
  // damit in der Startansicht Tiere stehen. Er hängt nur von Welt und Anker ab (global je Welt), so sehen
  // Renderer und UI weiterhin dieselbe Menge.
  const rank = (a: Anchor): number =>
    near ? a.key + Math.hypot(a.tx + 0.5 - near.x, a.ty + 0.5 - near.y) / f.w : a.key;
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

/** Schleifenradius des Vogelschwarms in Kacheln (1,5 bis 2), aus dem Ankerhash. */
const flockRadius = (seed: number, x: number, y: number): number =>
  1.5 + 0.5 * hash2(seed + 73, x, y);

/**
 * Anker je Welt und Kappe: Fische und Vögel werden einmal über die ganze Karte bestimmt und global nach Schlüssel
 * auf `cap(...)` gekappt (Cache in einer WeakMap je Welt; die Kachelarten ändern sich im Spiel nicht, ein Schlüssel
 * entfällt). Der Bereich filtert erst ganz am Ende in `wildlifeAt`. So kostet ein Anker aus einer angeschnittenen
 * Zelle keinen Kappenplatz, und Renderer (weiter Bereich) und UI (kleiner Bereich) sehen dieselben Tiere; Scrollen
 * ändert die gezeichnete Menge nicht. Phase und Wetter wirken danach als Filter.
 */
// Gültig, solange Geländewechsel nur Wald ↔ Weide betreffen (Spec M10 7); andere Geländeänderungen müssen diesen Cache neu bewerten.
const anchorCache = new WeakMap<World, { fish: Anchor[][]; flocks: Anchor[][] }>();
function anchorsOf(world: World): { fish: Anchor[][]; flocks: Anchor[][] } {
  let c = anchorCache.get(world);
  if (!c) {
    const f = coastFor(world);
    const all: TileRange = { x0: 0, y0: 0, x1: f.w - 1, y1: f.h - 1 };
    const k = world.buildings[home(world).kontorId];
    const kd = k ? BUILDING_DEFS[k.defId] : null;
    const near = k && kd ? { x: k.x + kd.w / 2, y: k.y + kd.h / 2 } : { x: f.w / 2, y: f.h / 2 };
    const make = (reduce: boolean) => ({
      fish: cellAnchors(
        f,
        all,
        world.seed,
        FISH_CELL,
        FISH_SHARE,
        51,
        (_x, _y, s) => s <= -1 && s > -4,
        cap('fish', reduce),
        near,
      ),
      flocks: cellAnchors(
        f,
        all,
        world.seed,
        FLOCK_CELL,
        FLOCK_SHARE,
        71,
        (x, y, s) => {
          const t = home(world).tiles[y * home(world).width + x]?.terrain;
          // der Schwarm bleibt über Land: Abstand zum Wasser ≥ Schleifenradius + 1
          return (t === 'forest' || t === 'grass') && s >= flockRadius(world.seed, x, y) + 1;
        },
        cap('flocks', reduce),
        near,
      ),
    });
    const n = make(false),
      r = make(true);
    c = { fish: [n.fish, r.fish], flocks: [n.flocks, r.flocks] };
    anchorCache.set(world, c);
  }
  return c;
}

/** Anker der Fischschwärme: Wasser mit `1 ≤ −s < 4`, Zellen 6×6, Anteil 0,35, global auf `cap('fish')` gekappt. */
export const fishAnchors = (world: World, reduce = false): Anchor[] =>
  anchorsOf(world).fish[reduce ? 1 : 0]!;

/** Anker der Vogelschwärme: Wald oder Wiese mit `s ≥ Radius + 1`, Zellen 12×12, Anteil 0,3, global gekappt; nur Tagesphasen. */
export const flockAnchors = (world: World, phase: Phase, reduce = false): Anchor[] =>
  BIRD_PHASES.includes(phase) ? anchorsOf(world).flocks[reduce ? 1 : 0]! : [];

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
/**
 * Wal zur Zeit `timeMs` oder null. Episoden zu 60 s; in ca. 35 % taucht ein Wal für 12 s auf einer Kandidatenkachel
 * auf und driftet 0,15 Kacheln/s in eine Richtung, die tiefes Wasser (`−s ≥ 5`) hält. Bahn und Kandidat hängen nur
 * von Seed, Episode und Tiefwasser ab, nie vom Schiff: liegt das Schiff näher als 3 Kacheln am aktuellen Walpunkt,
 * ist der Wal einfach nicht sichtbar (er springt nie).
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
  const c = cands[Math.min(n - 1, Math.floor(hash2(world.seed + 63, e, 0) * n))]!;
  const a = { x: (c % f.w) + 0.5, y: Math.floor(c / f.w) + 0.5 };
  const d0 = Math.floor(hash2(world.seed + 64, e, 0) * DIRS);
  const reach = WHALE_DRIFT * WHALE_VISIBLE_MS;
  let ang = (d0 / DIRS) * Math.PI * 2,
    drift = 0;
  for (let d = 0; d < DIRS; d++) {
    const q = ((d0 + d) / DIRS) * Math.PI * 2;
    const bx = a.x + Math.cos(q) * reach,
      by = a.y + Math.sin(q) * reach;
    if (
      [0.25, 0.5, 0.75, 1].every(
        (u) => fieldAt(f, a.x + (bx - a.x) * u, a.y + (by - a.y) * u) <= -5,
      )
    ) {
      ang = q;
      drift = reach;
      break;
    }
  }
  const u = dt / WHALE_VISIBLE_MS;
  const x = a.x + Math.cos(ang) * drift * u,
    y = a.y + Math.sin(ang) * drift * u;
  const ship = shipTile(world);
  if (ship && Math.hypot(x - (ship.x + 0.5), y - (ship.y + 0.5)) < WHALE_SHIP_GAP) return null;
  const smooth = (v: number): number => v * v * (3 - 2 * v);
  const phase: WhalePhase =
    dt < 2000 ? 'surface' : dt < 8000 ? 'swim' : dt < 10000 ? 'dive' : 'fluke';
  const lift =
    phase === 'surface'
      ? smooth(dt / 2000)
      : phase === 'swim'
        ? 0.9 + 0.1 * Math.sin(((dt - 2000) / 6000) * Math.PI * 2)
        : phase === 'dive'
          ? 0.9 * smooth(1 - (dt - 8000) / 2000)
          : 0;
  const fu = (dt - 10000) / 2000; // 0…1 in der Fluke-Phase
  const sprayU = (dt - 1000) / 1000; // Fontäne bei ca. 1,5 s, nur beim Auftauchen
  return {
    x,
    y,
    heading: ang,
    phase,
    lift,
    spout: phase === 'surface' && sprayU >= 0 ? sprayU : -1,
    fluke:
      phase === 'fluke'
        ? smooth(Math.min(1, fu / 0.4)) * (fu < 0.7 ? 1 : 1 - smooth((fu - 0.7) / 0.3))
        : -1,
    fade: phase === 'fluke' ? Math.min(1, (1 - fu) / 0.25) : 1,
    swell: phase === 'swim' ? Math.sin(((dt - 2000) / 6000) * Math.PI * 4) : 0,
    curl: phase === 'dive' ? smooth((dt - 8000) / 2000) : 0,
  };
}

/** Vogelschwarm am Anker `a`: Figur-Acht-Schleife (Radius 1,5 bis 2 Kacheln, Periode 20 bis 35 s), Vögel mit Versatz. */
export function flockPose(
  a: Anchor,
  seed: number,
  timeMs: number,
  reduce = false,
): FlockPose & { z: number; x: number; y: number } {
  const t = clampTime(timeMs);
  const hh = (salt: number): number => hash2(seed + 73 + salt, a.tx, a.ty);
  const R = flockRadius(seed, a.tx, a.ty),
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
  const out: WildlifeHit[] = [];
  for (const a of fishAnchors(world, reduce)) {
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
    for (const a of flockAnchors(world, phase, reduce)) {
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

/** Rücken-Profil: Höhe 0…1 bei `u` ∈ [−1, 1] (Kopf bei +1): gewölbter Buckel ohne Finne. */
const backProfile = (u: number): number => Math.pow(Math.max(0, 1 - u * u), u > 0 ? 0.7 : 1);
/** Rückenfinne: Dreieck bei `FIN_U` (leicht hinter der Mitte), Halbbreite `FIN_HALF`, Höhe 0,12 · ISO_H. */
const FIN_U = -0.35;
const FIN_HALF = 0.1;
const FIN_H = 0.12 * ISO_H;
const finProfile = (u: number): number => Math.max(0, 1 - Math.abs(u - FIN_U) / FIN_HALF);
const WHALE_LEN = 1.8; // Kacheln
const WHALE_HUMP = 0.42 * ISO_H;
const FLUKE_W = 0.6 * ISO_W;
const FLUKE_H = 0.75 * ISO_H;
export const WHALE_UNDER = mixHex(PALETTE.roofSlate, WHALE_DARK, 0.65);

/**
 * Wal im Profil (Bildraum): gewölbter Rücken über der Wasserlinie, nur nach links oder rechts gewendet
 * (`heading` im Bildraum), mit Glanz, dunklerer Unterseite, Schaumrand (Bugwelle, Kielwasser), Fontäne beim
 * Auftauchen und senkrecht aufsteigender, gefüllter V-Fluke. Kein Ring, keine geschlossene Umrandung.
 */
function drawWhale(ctx: CanvasRenderingContext2D, cam: Camera, p: WhalePose): void {
  const z = cam.zoom;
  const q = project(p.x, p.y);
  const b = worldToScreen(cam, q);
  const f = Math.cos(p.heading) - Math.sin(p.heading) >= 0 ? 1 : -1; // Blickrichtung im Bild
  const L = WHALE_LEN * (ISO_W / 2) * z,
    H = WHALE_HUMP * z;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (p.lift > 0.02) {
    const N = 14;
    const top = (u: number): number =>
      b.y -
      (H * backProfile(u) + FIN_H * z * finProfile(u)) * p.lift +
      H * 0.12 * p.swell * (1 - u * u) + // flacher Wellenbogen beim Schwimmen
      H * 0.85 * p.curl * Math.max(0, u); // Kopf sinkt beim Abtauchen zuerst
    const xs = (u: number): number => b.x + f * u * (L / 2);
    const water = b.y;
    const clampY = (y: number): number => Math.min(water, y);
    const outline: { x: number; y: number }[] = [];
    const us = Array.from({ length: N + 1 }, (_, i) => -1 + (2 * i) / N);
    us.push(FIN_U - FIN_HALF, FIN_U, FIN_U + FIN_HALF); // Finne mit eigenen Stützpunkten
    us.sort((a, b) => a - b);
    for (const u of us) outline.push({ x: xs(u), y: clampY(top(u)) });
    // Körper
    ctx.fillStyle = WHALE_COLOR;
    ctx.beginPath();
    outline.forEach((o, i) => (i === 0 ? ctx.moveTo(o.x, o.y) : ctx.lineTo(o.x, o.y)));
    ctx.lineTo(xs(1), water);
    ctx.lineTo(xs(-1), water);
    ctx.closePath();
    ctx.fill();
    // dunklere Unterseite an der Wasserlinie
    ctx.fillStyle = WHALE_UNDER;
    ctx.beginPath();
    outline.forEach((o, i) => {
      const y = water - (water - o.y) * 0.25;
      if (i === 0) ctx.moveTo(o.x, y);
      else ctx.lineTo(o.x, y);
    });
    ctx.lineTo(xs(1), water);
    ctx.lineTo(xs(-1), water);
    ctx.closePath();
    ctx.fill();
    // schmaler Glanz auf der Oberkante
    ctx.strokeStyle = WHALE_GLOSS;
    ctx.lineWidth = Math.max(1, 1.2 * z);
    ctx.beginPath();
    for (let i = 3; i < outline.length - 3; i++) {
      const o = outline[i]!;
      if (i === 3) ctx.moveTo(o.x, o.y - 0.5 * z);
      else ctx.lineTo(o.x, o.y - 0.5 * z);
    }
    ctx.stroke();
    // heller Wasserrand: Schaumbogen entlang der Wasserlinie, Bugwelle vorn, Kielwasser hinten
    const foamA = Number((0.5 * Math.min(1, p.lift * 1.5)).toFixed(3));
    ctx.strokeStyle = rgbaOf(SPLASH_RGB, foamA);
    ctx.lineWidth = Math.max(0.75, z);
    ctx.beginPath();
    ctx.moveTo(xs(-1.05), water + 0.5 * z);
    ctx.quadraticCurveTo(b.x, water + 2.5 * z, xs(1.05), water + 0.5 * z);
    ctx.moveTo(xs(1.05), water + 0.5 * z);
    ctx.quadraticCurveTo(xs(1.3), water + 2 * z, xs(1.55), water + 5 * z);
    ctx.moveTo(xs(-1.05), water + 0.5 * z);
    ctx.quadraticCurveTo(xs(-1.5), water + 3 * z, xs(-2.1), water + 6 * z);
    ctx.moveTo(xs(-1.05), water + 0.5 * z);
    ctx.quadraticCurveTo(xs(-1.6), water - 0.5 * z, xs(-2.2), water + 1 * z);
    ctx.stroke();
    if (p.spout >= 0) {
      // weiche Säule aus kleinen gefüllten Kreisen, nach oben schwächer
      const base = { x: xs(0.45), y: clampY(top(0.45)) };
      const col = Math.sin(p.spout * Math.PI);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rgbaOf(SPLASH_RGB, Number((0.7 * col * (1 - i / 5)).toFixed(3)));
        ctx.beginPath();
        ctx.arc(
          base.x,
          base.y - (0.1 + 0.16 * i) * col * ISO_H * z,
          (2.4 - 0.3 * i) * z,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  if (p.fluke > 0) {
    // senkrecht aufsteigende Schwanzflosse: gefüllt, V-förmig mit Kerbe, Spitzen oben aussen
    const h = FLUKE_H * z * p.fluke,
      W = FLUKE_W * z,
      s = 0.05;
    const pts: [number, number][] = [
      [-s, 0],
      [-s, 0.4],
      [-0.5, 1],
      [-0.2, 0.72],
      [0, 0.62],
      [0.2, 0.72],
      [0.5, 1],
      [s, 0.4],
      [s, 0],
    ];
    ctx.globalAlpha = Math.max(0, Math.min(1, p.fade));
    ctx.fillStyle = WHALE_COLOR;
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      const x = b.x + px * W;
      const y = b.y - py * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgbaOf(SPLASH_RGB, Number((0.5 * p.fade).toFixed(3)));
    ctx.lineWidth = Math.max(0.75, z);
    ctx.beginPath();
    ctx.moveTo(b.x - 0.16 * W, b.y + 1.5 * z);
    ctx.quadraticCurveTo(b.x, b.y + 3.5 * z, b.x + 0.16 * W, b.y + 1.5 * z);
    ctx.stroke();
  }
  ctx.restore();
}

/** Wasserleben (Fische, Wal) aus `wildlifeAt`-Treffern; Fische gebündelt je Art (Schimmer, Ringe, Sprünge). */
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
        ctx.moveTo(c.x - 0.15 * ISO_W * z, c.y - 0.075 * ISO_H * z);
        ctx.lineTo(c.x + 0.15 * ISO_W * z, c.y + 0.075 * ISO_H * z);
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
    // springende Fische: gefüllter silbriger Körper (spitze Ellipse, 0,22 · ISO_H lang) mit dunklem Saum
    const body: Pt2[][] = [];
    for (const f of fish) {
      const j = (f.pose as FishPose).jump;
      if (!j) continue;
      const c = scr(j, j.z);
      const tilt = (0.5 - j.t) * 1.2;
      const L = 0.22 * ISO_H * z;
      const pts: Pt2[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const u = Math.cos(a) * L * 0.5,
          v = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 1.4 * L * 0.2;
        pts.push({
          x: c.x + u * Math.cos(tilt) - v * Math.sin(tilt),
          y: c.y + u * Math.sin(tilt) + v * Math.cos(tilt),
        });
      }
      body.push(pts);
    }
    if (body.length > 0) {
      ctx.fillStyle = FISH_SILVER;
      ctx.strokeStyle = FISH_RIM;
      ctx.lineWidth = Math.max(0.75, 0.9 * z);
      ctx.beginPath();
      for (const pts of body) {
        pts.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }
  }
  for (const w of hits) if (w.kind === 'whale') drawWhale(ctx, cam, w.pose as WhalePose);
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
