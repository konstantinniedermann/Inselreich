import { GOOD_IDS } from './defs/goods';
import { MAP_H, MAP_W } from './mapgen';
import { recomputeConnectivity } from './roads';
import type { World } from './types';

export const SAVE_VERSION = 1;

export type LoadResult = { ok: true; world: World } | { ok: false; reason: string };

export function serialize(world: World): string {
  return JSON.stringify(world);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Strukturprüfung der Felder, auf die das Spiel direkt zugreift. */
function isWellFormed(raw: Record<string, unknown>): boolean {
  const { width, height, tiles, buildings, kontorId, stock, stats } = raw;
  if (width !== MAP_W || height !== MAP_H) return false;
  if (!Array.isArray(tiles) || tiles.length !== MAP_W * MAP_H) return false;
  if (typeof raw.money !== 'number') return false;
  if (typeof kontorId !== 'number' || !isObject(buildings) || !isObject(buildings[kontorId]))
    return false;
  if (!isObject(stock) || !GOOD_IDS.every((g) => typeof stock[g] === 'number')) return false;
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
