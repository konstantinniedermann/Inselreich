import { BUILDING_DEFS } from './defs/buildings';
import { GOODS, GOOD_IDS, SELL_FLOOR } from './defs/goods';
import { TAX_LEVELS } from './defs/tiers';
import { MAP_H, MAP_W } from './mapgen';
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

/** Auftrag: `null` oder ganzzahlige Felder mit einem Gut, das Auftragsdaten hat. */
function isValidOrder(o: unknown): boolean {
  if (o === null) return true;
  return (
    isObject(o) &&
    isInt(o.period) &&
    o.period >= 0 &&
    isInt(o.amount) &&
    o.amount >= 1 &&
    isInt(o.reward) &&
    o.reward >= 0 &&
    isInt(o.due) &&
    typeof o.good === 'string' &&
    Object.hasOwn(GOODS, o.good) &&
    GOODS[o.good as keyof typeof GOODS].order !== undefined
  );
}

/** Felder von Save v2: Steuerstufe, Sperre, Verkaufsanteile, Auftrag. */
function isValidV2Fields(raw: Record<string, unknown>): boolean {
  const { taxLevel, sellPct } = raw;
  if (typeof taxLevel !== 'string' || !Object.hasOwn(TAX_LEVELS, taxLevel)) return false;
  if (typeof raw.taxLockedUntil !== 'number') return false;
  if (
    !isObject(sellPct) ||
    !GOOD_IDS.every((g) => isInt(sellPct[g]) && sellPct[g] >= SELL_FLOOR && sellPct[g] <= 100)
  )
    return false;
  return isValidOrder(raw.order);
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
