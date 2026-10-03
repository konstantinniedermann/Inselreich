import { GOOD_IDS } from './defs/goods';
import { TAX_LEVELS, TIERS } from './defs/tiers';
import { TAX_SWITCH_LOCK } from './defs/timing';
import { townhallActive, townhallReason } from './townhall';
import { functionLock } from './unlocks';
import { fail, ok } from './types';
import type { GoodId, Tier, Result, TaxLevel, World } from './types';

/** Schaltet die Steuerstufe um; wirkt ab dem nächsten Tick. Braucht eine wirksame Amtsstube (Spec 5.2). Kostet nichts. */
export function setTaxLevel(world: World, level: string): Result {
  if (!Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (!townhallActive(world)) return fail(townhallReason(world));
  if (level === world.taxLevel) return fail('Stufe bereits aktiv');
  if (world.tick < world.taxLockedUntil) return fail('Sperrzeit');
  world.taxLevel = level as TaxLevel;
  world.taxLockedUntil = world.tick + TAX_SWITCH_LOCK;
  return ok;
}

const asTier = (n: number): Tier | null => (n === 1 || n === 2 || n === 3 || n === 4 ? n : null);

export function setGoodLock(world: World, tier: number, good: string, locked: boolean): Result {
  const lock = functionLock(world, 'goodLocks');
  if (lock !== null) return fail(lock);
  if (!townhallActive(world)) return fail(townhallReason(world));
  const t = asTier(tier);
  if (t === null || !GOOD_IDS.includes(good as GoodId) || !Object.hasOwn(TIERS[t].needs, good))
    return fail('Ungültige Sperre');
  const rest = world.goodLocks.filter((l) => !(l.tier === t && l.good === good));
  world.goodLocks = (locked ? [...rest, { tier: t, good: good as GoodId }] : rest).sort(
    (a, b) => a.tier - b.tier || GOOD_IDS.indexOf(a.good) - GOOD_IDS.indexOf(b.good),
  );
  return ok;
}

export function setUpgradeStop(world: World, tier: number, stopped: boolean): Result {
  if (!townhallActive(world)) return fail(townhallReason(world));
  const t = asTier(tier);
  if (t === null || TIERS[t].upgradeCost === null) return fail('Ungültige Stufe');
  const rest = world.upgradeStops.filter((s) => s !== t);
  world.upgradeStops = (stopped ? [...rest, t] : rest).sort((a, b) => a - b);
  return ok;
}
