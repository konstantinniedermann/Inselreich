import { BUILDING_DEFS } from './defs/buildings';
import { CRISIS_LEVELS, CRISIS_SALT, CRISIS_WEIGHTS, FIRE_HIT_RADIUS } from './defs/crises';
import {
  BOOM_DURATION,
  CRISIS_FIRST_TICK,
  FIRE_OUTAGE,
  STORM_DURATION,
  STORM_WARNING,
} from './defs/timing';
import { maxHouseTier, orderPool } from './orders';
import { createRng } from './rng';
import type { Building, Crisis, CrisisKind, GoodId, Tier, World } from './types';
import { center, HOME } from './world';

/** Krisen (Spec M6 4, 10): Ziehung je Periode, Krisenschritt, Brandfolgen. Rein bis auf beginCrisis/tickCrises. */

export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface CrisisRoll {
  kind: CrisisKind;
  tile?: { x: number; y: number; island?: number };
  good?: GoodId;
}

/** Reihenfolge, in der CRISIS_WEIGHTS kumuliert werden (Spec 4.2). */
const KIND_ORDER: readonly CrisisKind[] = ['fire', 'storm', 'boom'];

function kindFor(u: number): CrisisKind {
  let acc = 0;
  for (const kind of KIND_ORDER) {
    acc += CRISIS_WEIGHTS[kind];
    if (u < acc) return kind;
  }
  return KIND_ORDER[KIND_ORDER.length - 1]!; // unerreichbar, solange die Gewichte 100 ergeben (AK-S1-10)
}

/**
 * Krise der Periode `k`, rein aus Seed, Periode, Höchststufe und Brand-Rechteck (ADR-010, zweite Konstante).
 * Feste Zug-Reihenfolge: r1 Art, bei Brand r2 x und r3 y (nur mit Rechteck), bei Boom r2 Gut.
 */
export function rollCrisis(
  seed: number,
  k: number,
  maxTier: Tier,
  rect: TileRect | null,
): CrisisRoll {
  const r = createRng((seed ^ Math.imul(k + 1, CRISIS_SALT)) >>> 0);
  const kind = kindFor(Math.floor(r() * 100));
  if (kind === 'fire') {
    if (rect === null) return { kind };
    const x = rect.x0 + Math.floor(r() * (rect.x1 - rect.x0 + 1));
    const y = rect.y0 + Math.floor(r() * (rect.y1 - rect.y0 + 1));
    return { kind, tile: { x, y } };
  }
  if (kind === 'boom') {
    const pool = orderPool(maxTier);
    return { kind, good: pool[Math.floor(r() * pool.length)]! };
  }
  return { kind };
}

/** Kleinstes Rechteck um die Grundflächen der brennbaren Gebäude auf `island`; `null` ohne solche. */
export function flammableRect(world: World, island: number = HOME): TileRect | null {
  let rect: TileRect | null = null;
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (def.flammable !== true || b.island !== island) continue;
    const x1 = b.x + def.w - 1;
    const y1 = b.y + def.h - 1;
    rect =
      rect === null
        ? { x0: b.x, y0: b.y, x1, y1 }
        : {
            x0: Math.min(rect.x0, b.x),
            y0: Math.min(rect.y0, b.y),
            x1: Math.max(rect.x1, x1),
            y1: Math.max(rect.y1, y1),
          };
  }
  return rect;
}

export interface FireRect {
  rect: TileRect;
  parts: { island: number; r: TileRect }[];
}

/**
 * Brand-Rechteck über alle Inseln mit brennbaren Gebäuden (Inselfolge): Teile übereinander gestapelt, Breite =
 * Maximum, Höhe = Summe, Ursprung = erster Teil. So bleibt es bei genau zwei Ziehungen (x, y) je Brand (P-5).
 */
export function fireRect(world: World): FireRect | null {
  const parts: FireRect['parts'] = [];
  for (let island = 0; island < world.islands.length; island++) {
    const r = flammableRect(world, island);
    if (r !== null) parts.push({ island, r });
  }
  const first = parts[0];
  if (first === undefined) return null;
  let width = 0;
  let height = 0;
  for (const { r } of parts) {
    width = Math.max(width, r.x1 - r.x0 + 1);
    height += r.y1 - r.y0 + 1;
  }
  return {
    rect: {
      x0: first.r.x0,
      y0: first.r.y0,
      x1: first.r.x0 + width - 1,
      y1: first.r.y0 + height - 1,
    },
    parts,
  };
}

/** Rechnet eine Kachel des Gesamtrechtecks auf Insel und Inselkachel zurück; `null` = Fehlschlag (neben dem Teil). */
export function fireTile(
  fire: FireRect,
  tile: { x: number; y: number },
): { x: number; y: number; island: number } | null {
  let dy = tile.y - fire.rect.y0;
  const dx = tile.x - fire.rect.x0;
  for (const { island, r } of fire.parts) {
    const h = r.y1 - r.y0 + 1;
    if (dy >= h) {
      dy -= h;
      continue;
    }
    return dx >= r.x1 - r.x0 + 1 ? null : { island, x: r.x0 + dx, y: r.y0 + dy };
  }
  return null;
}

/** Wirkfenster einer Krise mit Periodenstart `start` (Spec 4.3); auch Grundlage der Save-Prüfung. */
export function crisisWindow(kind: CrisisKind, start: number): { from: number; until: number } {
  switch (kind) {
    case 'fire':
      return { from: start, until: start + FIRE_OUTAGE };
    case 'storm':
      return { from: start + STORM_WARNING + 1, until: start + STORM_WARNING + STORM_DURATION };
    case 'boom':
      return { from: start, until: start + BOOM_DURATION };
  }
}

/** Nächstes brennbares Gebäude auf der Insel der Kachel mit Chebyshev-Abstand ≤ FIRE_HIT_RADIUS zur Grundfläche; Gleichstand: kleinste Id. */
export function fireTarget(
  world: World,
  tile: { x: number; y: number; island?: number },
): Building | null {
  const island = tile.island ?? HOME;
  let best: Building | null = null;
  let bestD = Infinity;
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (def.flammable !== true || b.island !== island) continue;
    const dx = Math.max(b.x - tile.x, 0, tile.x - (b.x + def.w - 1));
    const dy = Math.max(b.y - tile.y, 0, tile.y - (b.y + def.h - 1));
    const d = Math.max(dx, dy);
    if (d > FIRE_HIT_RADIUS) continue;
    if (best === null || d < bestD || (d === bestD && b.id < best.id)) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

/** Geschützt: eine angebundene Wache (`fireProtection`) mit Mittenabstand ≤ ihrem `serviceRadius`. */
export function isProtected(world: World, b: Building): boolean {
  const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return Object.values(world.buildings).some((s) => {
    const def = BUILDING_DEFS[s.defId];
    if (def.fireProtection !== true || !s.connected || s.island !== b.island) return false;
    const sc = center(def, s.x, s.y);
    return Math.hypot(sc.cx - c.cx, sc.cy - c.cy) <= (def.serviceRadius ?? 0);
  });
}

/** Brandfolgen (Spec 5.2–5.4): löschen oder Gebühr (auch ins Minus), Fortschritt 0, Ausfall bis `until`. */
function ignite(
  world: World,
  crisis: Crisis,
  tile: { x: number; y: number; island: number },
): void {
  const target = fireTarget(world, tile);
  if (target === null) return;
  crisis.target = target.id;
  if (isProtected(world, target)) {
    crisis.outcome = 'extinguished';
    return;
  }
  crisis.outcome = 'burning';
  world.money -= BUILDING_DEFS[target.defId].cost.money;
  target.progress = 0;
  target.state = 'burning';
  target.outageUntil = crisis.until;
}

/**
 * Setzt die Krise der Periode `k` mit Start `T = world.tick`. Exportiert, damit Tests und Szenarien eine Krise
 * gezielt auslösen.
 */
export function beginCrisis(world: World, k: number, roll: CrisisRoll): void {
  const crisis: Crisis = { period: k, kind: roll.kind, ...crisisWindow(roll.kind, world.tick) };
  if (roll.kind === 'boom' && roll.good !== undefined) crisis.good = roll.good;
  if (roll.kind === 'fire') {
    crisis.outcome = 'miss';
    if (roll.tile)
      crisis.tile = { x: roll.tile.x, y: roll.tile.y, island: roll.tile.island ?? HOME };
  }
  world.crisis = crisis;
  if (roll.kind === 'fire' && crisis.tile) ignite(world, crisis, crisis.tile);
}

/** Krisenschritt nach den Aufträgen (Spec 10.1): Ausfälle beenden, Krise beenden, Periodenstart. Prüft `won` nicht. */
export function tickCrises(world: World): void {
  const t = world.tick;
  for (const b of Object.values(world.buildings)) {
    if (b.outageUntil !== undefined && b.outageUntil <= t) {
      delete b.outageUntil;
      b.state = b.paused ? 'paused' : b.connected ? 'ok' : 'notConnected';
    }
  }
  if (world.crisis !== null && t >= world.crisis.until) world.crisis = null;
  const period = CRISIS_LEVELS[world.crisisLevel].period;
  if (period === null || t < CRISIS_FIRST_TICK || (t - CRISIS_FIRST_TICK) % period !== 0) return;
  const k = (t - CRISIS_FIRST_TICK) / period;
  const fire = fireRect(world);
  const roll = rollCrisis(world.seed, k, maxHouseTier(world), fire?.rect ?? null);
  if (roll.kind === 'fire' && roll.tile !== undefined && fire !== null) {
    const hit = fireTile(fire, roll.tile);
    if (hit === null)
      delete roll.tile; // neben dem schmaleren Teil: Fehlschlag wie ohne Gebäude
    else roll.tile = hit;
  }
  beginCrisis(world, k, roll);
}

/** Tick des nächsten Periodenstarts strikt nach `tick` (vor dem ersten: CRISIS_FIRST_TICK); `null` bei `off`. */
export function nextCrisisTick(world: World): number | null {
  const period = CRISIS_LEVELS[world.crisisLevel].period;
  if (period === null) return null;
  const t = world.tick;
  if (t < CRISIS_FIRST_TICK) return CRISIS_FIRST_TICK;
  return CRISIS_FIRST_TICK + period * (Math.floor((t - CRISIS_FIRST_TICK) / period) + 1);
}
