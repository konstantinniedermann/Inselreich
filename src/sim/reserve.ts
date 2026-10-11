import { RESERVE_GOODS, RESERVE_STEPS, type ReserveGood, type ReserveStep } from './defs/reserve';
import { islandAt } from './placement';
import { noKontorTrade } from './trade';
import type { GoodId, Island, Result, World } from './types';
import { fail, ok } from './types';

const isReserveGood = (g: unknown): g is ReserveGood => RESERVE_GOODS.includes(g as ReserveGood);

const isReserveStep = (v: unknown): v is ReserveStep => RESERVE_STEPS.includes(v as ReserveStep);

/** Sperrbestand der Insel für ein Gut: nur Holz/Stein, nur mit Kontor auf der Insel (R511 B1), sonst 0. */
export function reserveOf(island: Island, good: GoodId): number {
  if (island.kontorId === null || !isReserveGood(good)) return 0;
  return island.reserve[good];
}

/** Setzt den Sperrbestand einer Insel; wirft nie, bei `ok: false` bleibt die Welt unverändert (AK-SB-09). */
export function setReserve(world: World, island: number, good: unknown, value: unknown): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  if (!isReserveGood(good)) return fail('Ungültiges Gut');
  if (!isReserveStep(value)) return fail('Ungültiger Wert');
  const noKontor = noKontorTrade(world, island);
  if (noKontor !== null) return fail(noKontor);
  isl.reserve[good] = value;
  return ok;
}
