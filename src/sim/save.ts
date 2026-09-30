import { BUILDING_DEFS } from './defs/buildings';
import { GOODS, GOOD_IDS, SELL_FLOOR } from './defs/goods';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from './defs/timing';
import { TAX_LEVELS } from './defs/tiers';
import { MAP_H, MAP_W } from './mapgen';
import { orderUnitReward } from './orders';
import { recomputeConnectivity } from './roads';
import type { World } from './types';

export const SAVE_VERSION = 2;

export type LoadResult = { ok: true; world: World } | { ok: false; reason: string };

export function serialize(world: World): string {
  return JSON.stringify(world);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isValidBuilding = (b: unknown): boolean =>
  isObject(b) &&
  typeof b.defId === 'string' &&
  Object.hasOwn(BUILDING_DEFS, b.defId) &&
  typeof b.x === 'number' &&
  typeof b.y === 'number';

const isInt = (v: unknown): v is number => Number.isInteger(v);

/**
 * Auftrag: `null` oder ein Auftrag, der zu den Takt-Konstanten und zum gespeicherten `tick` passt:
 * `due` ergibt sich aus der Periode, der Auftrag ist schon angeboten (`tick ≥ due − ORDER_DURATION`)
 * und noch nicht verfallen (`tick ≤ due`, `tickOrders` löscht erst bei `tick > due`); Menge im Bereich
 * des Guts, Prämie = Menge × Stückprämie.
 */
function isValidOrder(o: unknown, tick: unknown): boolean {
  if (o === null) return true;
  if (
    !isObject(o) ||
    !isInt(tick) ||
    !isInt(o.period) ||
    o.period < 0 ||
    !isInt(o.amount) ||
    !isInt(o.reward) ||
    !isInt(o.due) ||
    typeof o.good !== 'string' ||
    !Object.hasOwn(GOODS, o.good)
  )
    return false;
  const good = o.good as keyof typeof GOODS;
  const def = GOODS[good].order;
  if (def === undefined) return false;
  const offered = ORDER_FIRST_TICK + o.period * ORDER_PERIOD;
  return (
    o.due === offered + ORDER_DURATION &&
    tick >= offered &&
    tick <= o.due &&
    o.amount >= def.min &&
    o.amount <= def.max &&
    o.reward === o.amount * orderUnitReward(good)
  );
}

/** Felder von Save v2: Steuerstufe, Sperre, Verkaufsanteile, Auftrag. */
function isValidV2Fields(raw: Record<string, unknown>): boolean {
  const { taxLevel, sellPct } = raw;
  if (typeof taxLevel !== 'string' || !Object.hasOwn(TAX_LEVELS, taxLevel)) return false;
  if (!isInt(raw.taxLockedUntil) || raw.taxLockedUntil < 0) return false;
  if (
    !isObject(sellPct) ||
    !GOOD_IDS.every((g) => isInt(sellPct[g]) && sellPct[g] >= SELL_FLOOR && sellPct[g] <= 100)
  )
    return false;
  return isValidOrder(raw.order, raw.tick);
}

/** v1 → v2: neue Felder mit den Werten, die das bisherige Verhalten ergeben; Vorhandenes bleibt unberührt. */
export function migrateV1ToV2(raw: Record<string, unknown>): void {
  raw.version = 2;
  raw.taxLevel = 'normal';
  raw.taxLockedUntil = 0;
  raw.sellPct = Object.fromEntries(GOOD_IDS.map((g) => [g, 100]));
  raw.order = null;
}

/** Strukturprüfung der Felder, auf die das Spiel direkt zugreift. */
function isWellFormed(raw: Record<string, unknown>): boolean {
  const { width, height, tiles, buildings, kontorId, stock, stats } = raw;
  if (width !== MAP_W || height !== MAP_H) return false;
  if (!Array.isArray(tiles) || tiles.length !== MAP_W * MAP_H) return false;
  if (!tiles.every(isObject)) return false;
  if (typeof raw.money !== 'number') return false;
  if (typeof kontorId !== 'number' || !isObject(buildings) || !isObject(buildings[kontorId]))
    return false;
  if (!Object.values(buildings).every(isValidBuilding)) return false;
  if (!isObject(stock) || !GOOD_IDS.every((g) => typeof stock[g] === 'number')) return false;
  if (!isValidV2Fields(raw)) return false;
  if (!isObject(stats) || typeof stats.taxes !== 'number' || typeof stats.upkeep !== 'number')
    return false;
  return (
    typeof raw.won === 'boolean' &&
    typeof raw.tick === 'number' &&
    typeof raw.nextBuildingId === 'number'
  );
}

/** Liest einen Spielstand; wirft nie, sondern meldet den Grund. */
export function deserialize(json: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'Ungültiges Format' };
  }
  if (!isObject(raw)) return { ok: false, reason: 'Ungültiges Format' };
  if (raw.version === 1) migrateV1ToV2(raw);
  if (raw.version !== SAVE_VERSION) return { ok: false, reason: 'Unbekannte Version' };
  if (!isWellFormed(raw)) return { ok: false, reason: 'Beschädigter Spielstand' };
  const world = raw as unknown as World;
  try {
    // Persistiertes `connected` nicht übernehmen, sondern aus den Wegen neu ableiten
    recomputeConnectivity(world);
  } catch {
    return { ok: false, reason: 'Beschädigter Spielstand' };
  }
  return { ok: true, world };
}
