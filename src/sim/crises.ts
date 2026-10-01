import { BUILDING_DEFS } from './defs/buildings';
import { CRISIS_LEVELS, CRISIS_SALT, CRISIS_WEIGHTS } from './defs/crises';
import {
  BOOM_DURATION,
  CRISIS_FIRST_TICK,
  FIRE_OUTAGE,
  STORM_DURATION,
  STORM_WARNING,
} from './defs/timing';
import { maxHouseTier, orderPool } from './orders';
import { createRng } from './rng';
import type { Crisis, CrisisKind, GoodId, Tier, World } from './types';

/** Krisen (Spec M6 4, 10): Ziehung je Periode, Krisenschritt, Brandfolgen. Rein bis auf beginCrisis/tickCrises. */

export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface CrisisRoll {
  kind: CrisisKind;
  tile?: { x: number; y: number };
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

/** Kleinstes Rechteck um die Grundflächen aller brennbaren Gebäude (Grenzen inklusive); `null` ohne solche. */
export function flammableRect(world: World): TileRect | null {
  let rect: TileRect | null = null;
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (def.flammable !== true) continue;
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

/**
 * Setzt die Krise der Periode `k` mit Start `T = world.tick`. Exportiert, damit Tests und Szenarien eine Krise
 * gezielt auslösen. S1: ein Brand endet immer mit `outcome 'miss'` (Brandfolgen kommen mit S2).
 */
export function beginCrisis(world: World, k: number, roll: CrisisRoll): void {
  const crisis: Crisis = { period: k, kind: roll.kind, ...crisisWindow(roll.kind, world.tick) };
  if (roll.kind === 'boom' && roll.good !== undefined) crisis.good = roll.good;
  if (roll.kind === 'fire') {
    crisis.outcome = 'miss';
    if (roll.tile) crisis.tile = { x: roll.tile.x, y: roll.tile.y };
  }
  world.crisis = crisis;
}

/** Krisenschritt nach den Aufträgen (Spec 10.1): Ausfälle beenden, Krise beenden, Periodenstart. Prüft `won` nicht. */
export function tickCrises(world: World): void {
  const t = world.tick;
  for (const b of Object.values(world.buildings)) {
    if (b.outageUntil !== undefined && b.outageUntil <= t) {
      delete b.outageUntil;
      b.state = b.connected ? 'ok' : 'notConnected';
    }
  }
  if (world.crisis !== null && t >= world.crisis.until) world.crisis = null;
  const period = CRISIS_LEVELS[world.crisisLevel].period;
  if (period === null || t < CRISIS_FIRST_TICK || (t - CRISIS_FIRST_TICK) % period !== 0) return;
  const k = (t - CRISIS_FIRST_TICK) / period;
  beginCrisis(world, k, rollCrisis(world.seed, k, maxHouseTier(world), flammableRect(world)));
}

/** Tick des nächsten Periodenstarts strikt nach `tick` (vor dem ersten: CRISIS_FIRST_TICK); `null` bei `off`. */
export function nextCrisisTick(world: World): number | null {
  const period = CRISIS_LEVELS[world.crisisLevel].period;
  if (period === null) return null;
  const t = world.tick;
  if (t < CRISIS_FIRST_TICK) return CRISIS_FIRST_TICK;
  return CRISIS_FIRST_TICK + period * (Math.floor((t - CRISIS_FIRST_TICK) / period) + 1);
}
