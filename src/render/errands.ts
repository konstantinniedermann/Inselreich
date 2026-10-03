// errands.ts — Laufwege mit Herkunft und Ziel (H-R4, Programm G6): Sammler gehen zur Zielkachel und kommen mit
// Last zurück, Träger bringen die Ware über den Weggraph zum Kontor oder Markt. Reine Darstellung: liest Phase
// (`progress / cycle`), Zustand und Terrain, schreibt nie in die Welt; Caches nur je Weggraph/Welt mit Obergrenze.
// Die Mathematik ist rein (Test ohne DOM); `drawErrandLoad` ist der dünne Zeichner. Kurzdesign:
// docs/superpowers/specs/2026-10-03-h-r4-laufwege.md
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { TICK_MS } from '../sim/defs/timing';
import { hash2 } from '../sim/noise';
import type { Building, GoodId, SiteRule, Terrain, World } from '../sim/types';
import { adjacentOf, idx, inBounds, tilesInRadius } from '../sim/world';
import { worldToScreen, type Camera, type TileRange } from './camera';
import { project, type Pt } from './iso';
import { roadGraph, WALKER_H, WALKER_W, type RoadGraph } from './life';
import { cap } from './limits';
import { PALETTE } from './palette';

// --- Darstellungswerte (keine Spielwerte) ---
/** Obergrenze gleichzeitiger Laufweg-Figuren [normal, reduziert]; zählt gegen `CAPS.walkers` (Errands zuerst). */
export const MAX_ERRANDS = 16;
const MAX_ERRANDS_REDUCED = 6;
/** Figuren-Id im sortierten Durchgang: `ERRAND_ID_BASE + Betriebs-ID` (Spaziergänger haben Ids unter 40). */
export const ERRAND_ID_BASE = 1000;
/** Obergrenze des Pfad-Caches je Weggraph (Einträge); darüber wird er geleert. */
export const PLAN_CACHE_MAX = 512;
/** Betriebe bis so viele Kacheln ausserhalb des Bildes werden berechnet (Träger laufen ins Bild hinein). */
const RANGE_PAD = 6;
/** Phasen des Zyklus (0…1). */
const OUT_END = 0.3;
const WORK_END = 0.4;
const BACK_END = 0.7;
const CARRY_START_GATHERER = 0.75;
const CARRY_START = 0.7;
/** Ein- und Ausblenden in Anteilen des Zyklus (Simzeit; `FADE_MS` ist Echtzeit). */
const FADE_PHASE = 0.05;
/** Tickdauer (ms) unterhalb derer das Tempo als über 2x gilt (zwischen 2x = 50 und 4x = 25 ms). */
export const FAST_TICK_MS = TICK_MS * 0.375;
const THIN_SHARE = 0.5;

/** Spaziergänger-Anzahl nach Abzug der Laufwege: Summe bleibt höchstens `CAPS.walkers`. */
export const walkersLeft = (walkers: number, errands: number, reduce = false): number =>
  Math.max(0, Math.min(walkers, cap('walkers', reduce) - errands));

export const errandCap = (reduce = false): number => (reduce ? MAX_ERRANDS_REDUCED : MAX_ERRANDS);

/** Lastfarbe je Ware (Palette, keine Signalfarben). */
const LOAD_COLOR: Readonly<Record<GoodId, string>> = {
  wood: PALETTE.roofWood,
  tools: PALETTE.rock,
  stone: PALETTE.rockLight,
  food: PALETTE.waterShallow,
  wool: PALETTE.wallLime,
  cloth: PALETTE.roofSlate,
  cane: PALETTE.grassLight,
  rum: PALETTE.roofTerracotta,
  glass: PALETTE.waterMid,
};
const LOAD_OUTLINE = PALETTE.wallTimber;
const LOAD_MIN_PX = 2.5;

// --- Weg entlang eines Linienzugs ---

/** Punkt bei Anteil `f` (0…1) der Länge des Linienzugs; `null` bei leerem Pfad. */
export function pointAlong(path: readonly Pt[], f: number): Pt | null {
  if (path.length === 0) return null;
  const k = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
  if (path.length === 1 || k === 0) return { ...path[0]! };
  let total = 0;
  for (let i = 1; i < path.length; i++)
    total += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
  if (total === 0) return { ...path[0]! };
  let left = k * total;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!,
      b = path[i]!,
      len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len && len > 0)
      return { x: a.x + ((b.x - a.x) * left) / len, y: a.y + ((b.y - a.y) * left) / len };
    left -= len;
  }
  return { ...path[path.length - 1]! };
}

// --- Plan je Betrieb (gecacht je Weggraph) ---

export interface ErrandPlan {
  good: GoodId | null;
  /** Betrieb → Zielkachel (zwei Punkte); `null` ohne Sammelregel oder ohne Ziel. */
  gather: Pt[] | null;
  /** Betrieb → Kontor/Markt über Wegkacheln; `null` ohne Anbindung oder Wegverbindung. */
  carry: Pt[] | null;
}

type Target = { kind: 'coast' } | { kind: 'terrain'; terrain: Terrain; radius: number };
/** Sammelziel aus der Standortregel: Wald und Fels (Radius bzw. angrenzend) oder Küste; sonst keines. */
function targetOf(site: readonly SiteRule[]): Target | null {
  for (const r of site) {
    if (r.kind === 'coast') return { kind: 'coast' };
    if (
      (r.kind === 'radius' || r.kind === 'adjacent') &&
      (r.terrain === 'forest' || r.terrain === 'mountain')
    )
      return {
        kind: 'terrain',
        terrain: r.terrain,
        radius: (r.kind === 'radius' ? r.radius : 1) + 1,
      };
  }
  return null;
}

/** Rand des Gebäudes zum Punkt `toward` hin (Klemmen auf das Rechteck des Grundrisses). */
function edgePoint(b: Building, toward: Pt): Pt {
  const d = BUILDING_DEFS[b.defId];
  return {
    x: Math.min(b.x + d.w, Math.max(b.x, toward.x)),
    y: Math.min(b.y + d.h, Math.max(b.y, toward.y)),
  };
}

const walkable = (world: World, x: number, y: number): boolean => {
  const t = world.tiles[idx(world, x, y)];
  return !!t && t.terrain !== 'water' && t.buildingId === null;
};

function gatherPath(world: World, b: Building, target: Target): Pt[] | null {
  const d = BUILDING_DEFS[b.defId];
  const cx = b.x + d.w / 2,
    cy = b.y + d.h / 2;
  const R = target.kind === 'coast' ? 2.5 : target.radius;
  let best: { x: number; y: number; score: number } | null = null;
  for (const p of tilesInRadius(world, cx, cy, R)) {
    if (!walkable(world, p.x, p.y)) continue;
    if (target.kind === 'terrain') {
      if (world.tiles[idx(world, p.x, p.y)]!.terrain !== target.terrain) continue;
    } else {
      const wet = (x: number, y: number): boolean =>
        inBounds(world, x, y) && world.tiles[idx(world, x, y)]!.terrain === 'water';
      if (!(wet(p.x + 1, p.y) || wet(p.x - 1, p.y) || wet(p.x, p.y + 1) || wet(p.x, p.y - 1)))
        continue;
    }
    const score =
      Math.hypot(p.x + 0.5 - cx, p.y + 0.5 - cy) + hash2(world.seed + 93, p.x, p.y) * 0.4;
    if (!best || score < best.score) best = { x: p.x, y: p.y, score };
  }
  if (!best) return null;
  const to = { x: best.x + 0.5, y: best.y + 0.5 };
  return [edgePoint(b, to), to];
}

function carryPath(world: World, g: RoadGraph, b: Building): Pt[] | null {
  if (!b.connected) return null;
  const w = g.width;
  const goals = new Map<number, Building>(); // Wegkachel neben Kontor/angebundenem Markt → Gebäude
  for (const s of Object.values(world.buildings)) {
    if (!(s.defId === 'kontor' || (s.defId === 'market' && s.connected))) continue;
    const sd = BUILDING_DEFS[s.defId];
    for (const p of adjacentOf(world, s.x, s.y, sd.w, sd.h)) {
      const i = p.y * w + p.x;
      if (g.nbrs.has(i) && !goals.has(i)) goals.set(i, s);
    }
  }
  if (goals.size === 0) return null;
  const bd = BUILDING_DEFS[b.defId];
  const parent = new Map<number, number>();
  const queue: number[] = [];
  for (const p of adjacentOf(world, b.x, b.y, bd.w, bd.h)) {
    const i = p.y * w + p.x;
    if (g.nbrs.has(i) && !parent.has(i)) {
      parent.set(i, -1);
      queue.push(i);
    }
  }
  for (let q = 0; q < queue.length; q++) {
    const cur = queue[q]!;
    const goal = goals.get(cur);
    if (goal) {
      const tiles: number[] = [];
      for (let i = cur; i !== -1; i = parent.get(i)!) tiles.push(i);
      tiles.reverse();
      const pts = tiles.map((i) => ({ x: (i % w) + 0.5, y: Math.floor(i / w) + 0.5 }));
      return [edgePoint(b, pts[0]!), ...pts, edgePoint(goal, pts[pts.length - 1]!)];
    }
    for (const n of g.nbrs.get(cur) ?? [])
      if (!parent.has(n)) {
        parent.set(n, cur);
        queue.push(n);
      }
  }
  return null;
}

/** Pläne je Weggraph: der Graph entsteht bei jeder Layoutänderung neu, damit verfällt der Cache von selbst. */
const plans = new WeakMap<RoadGraph, Map<number, ErrandPlan>>();
/** Anzahl Einträge des Pfad-Caches der Welt (Test der Obergrenze). */
export const planCacheSize = (world: World): number => plans.get(roadGraph(world))?.size ?? 0;

/** Sammel- und Trägerweg eines Betriebs; Breitensuche und Zielwahl nur bei Cache-Fehlgriff. */
export function errandPlan(world: World, b: Building, g: RoadGraph = roadGraph(world)): ErrandPlan {
  let c = plans.get(g);
  if (!c) plans.set(g, (c = new Map()));
  const hit = c.get(b.id);
  if (hit) return hit;
  const def = BUILDING_DEFS[b.defId];
  const target = def.produces ? targetOf(def.site) : null;
  const plan: ErrandPlan = {
    good: def.produces ?? null,
    gather: target ? gatherPath(world, b, target) : null,
    carry: def.produces ? carryPath(world, g, b) : null,
  };
  if (c.size >= PLAN_CACHE_MAX) c.clear();
  c.set(b.id, plan);
  return plan;
}

// --- Pose je Phase ---

export interface ErrandPose {
  /** `ERRAND_ID_BASE + Betriebs-ID`. */
  id: number;
  x: number;
  y: number;
  alpha: number;
  /** Ware auf dem Rücken (Lastpunkt) oder `null`. */
  load: GoodId | null;
}

const ramp = (v: number): number => Math.max(0, Math.min(1, v / FADE_PHASE));

/**
 * Figur eines Betriebs bei Zyklusphase `p` (0…1): Sammler hin (0–0,30), Arbeit (–0,40), zurück mit Last (–0,70);
 * Träger ab 0,75 (ohne Sammelweg ab 0,70) bis 1. `null` ausserhalb dieser Fenster, ohne Ware, ohne Zustand `ok`
 * oder ohne Anbindung. Bei Phase 0 und 1 ist `alpha` 0: die Figur steht nie sichtbar auf dem Betrieb.
 */
export function errandPose(
  world: World,
  b: Building,
  p: number,
  g: RoadGraph = roadGraph(world),
): ErrandPose | null {
  const def = BUILDING_DEFS[b.defId];
  if (!def.produces || def.cycle === undefined || b.state !== 'ok' || !b.connected) return null;
  if (!Number.isFinite(p)) return null;
  const k = Math.min(1, Math.max(0, p));
  const plan = errandPlan(world, b, g);
  const id = ERRAND_ID_BASE + b.id;
  const at = (path: Pt[], f: number, alpha: number, load: GoodId | null): ErrandPose | null => {
    const q = pointAlong(path, f);
    return q ? { id, x: q.x, y: q.y, alpha, load } : null;
  };
  if (plan.gather && k < BACK_END) {
    if (k < OUT_END) return at(plan.gather, k / OUT_END, ramp(k), null);
    if (k < WORK_END) return at(plan.gather, 1, 1, null);
    return at(
      plan.gather,
      1 - (k - WORK_END) / (BACK_END - WORK_END),
      ramp(BACK_END - k),
      plan.good,
    );
  }
  const start = plan.gather ? CARRY_START_GATHERER : CARRY_START;
  if (plan.carry && k >= start)
    return at(
      plan.carry,
      (k - start) / (1 - start),
      Math.min(ramp(k - start), ramp(1 - k)),
      plan.good,
    );
  return null;
}

// --- Takt: Tickbruchteil und Tempo aus der Renderzeit ---

interface Clock {
  tick: number;
  at: number;
  tickMs: number;
}
const clocks = new WeakMap<World, Clock>();
export interface TickClock {
  /** Anteil (0…1) des laufenden Ticks; steht in der Pause bei 1. */
  frac: number;
  /** Tempo über 2x: die Figuren werden ausgedünnt. */
  fast: boolean;
}

/**
 * Der Renderer kennt Tempo und Tickbruchteil nicht: Aus dem Zeitpunkt der Tickwechsel (geglättet) folgt die
 * Tickdauer. So laufen Figuren flüssig statt in Tick-Sprüngen; ein Eintrag je Welt.
 */
export function tickClock(world: World, timeMs: number): TickClock {
  const t = Number.isFinite(timeMs) ? timeMs : 0;
  let c = clocks.get(world);
  if (!c || t < c.at) clocks.set(world, (c = { tick: world.tick, at: t, tickMs: TICK_MS }));
  else if (world.tick !== c.tick) {
    const dn = world.tick - c.tick,
      dt = t - c.at;
    if (dn > 0 && dt > 0) c.tickMs = 0.5 * c.tickMs + 0.5 * Math.min(1000, Math.max(5, dt / dn));
    c.tick = world.tick;
    c.at = t;
  }
  return { frac: Math.min(1, Math.max(0, (t - c.at) / c.tickMs)), fast: c.tickMs < FAST_TICK_MS };
}

/**
 * Figuren aller Betriebe im (erweiterten) Bildbereich, in Betriebs-Reihenfolge, höchstens `errandCap`; nur
 * sichtbare (alpha > 0). Bei Tempo über 2x nur eine feste Teilmenge (`hash2(seed + 95, id)`).
 */
export function errandsFrom(
  world: World,
  range: TileRange,
  clock: TickClock,
  reduce = false,
): ErrandPose[] {
  const out: ErrandPose[] = [];
  const limit = errandCap(reduce);
  const cands: { b: Building; key: number }[] = [];
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (!def.produces || def.cycle === undefined || b.state !== 'ok' || !b.connected) continue;
    if (
      b.x < range.x0 - RANGE_PAD ||
      b.x > range.x1 + RANGE_PAD ||
      b.y < range.y0 - RANGE_PAD ||
      b.y > range.y1 + RANGE_PAD
    )
      continue;
    const key = hash2(world.seed + 95, b.id, 0);
    if (clock.fast && key >= THIN_SHARE) continue;
    cands.push({ b, key });
  }
  if (cands.length === 0) return out;
  // Feste Mischung nach Schlüssel (nicht nach ID): über dem Limit gewinnt keine Gruppe von Betrieben dauerhaft
  cands.sort((p, q) => p.key - q.key || p.b.id - q.b.id);
  const g = roadGraph(world); // einmal je Frame: `layoutKey` läuft über alle Kacheln
  for (const { b } of cands) {
    if (out.length >= limit) break;
    const p = Math.min(0.99999, (b.progress + clock.frac) / BUILDING_DEFS[b.defId].cycle!);
    const pose = errandPose(world, b, p, g);
    if (pose && pose.alpha > 0.01) out.push(pose);
  }
  return out;
}

/** Lastpunkt auf dem Rücken der Figur (Bildraum): Palettenfarbe der Ware, dunkle Kontur, mindestens 2,5 px. */
export function drawErrandLoad(ctx: CanvasRenderingContext2D, cam: Camera, pose: ErrandPose): void {
  if (pose.load === null || pose.alpha <= 0.01) return;
  const base = worldToScreen(cam, project(pose.x, pose.y));
  const z = cam.zoom;
  const r = Math.max(LOAD_MIN_PX, 0.14 * WALKER_H * z);
  ctx.save();
  ctx.globalAlpha = Math.min(1, pose.alpha);
  ctx.beginPath();
  ctx.arc(base.x + 0.55 * WALKER_W * z, base.y - 0.55 * WALKER_H * z, r, 0, Math.PI * 2);
  ctx.fillStyle = LOAD_COLOR[pose.load];
  ctx.fill();
  ctx.strokeStyle = LOAD_OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
