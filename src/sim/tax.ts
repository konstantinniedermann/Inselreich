import { GOOD_IDS } from './defs/goods';
import { TAX_LEVELS, TIERS, TIER_IDS } from './defs/tiers';
import { TAX_SWITCH_LOCK } from './defs/timing';
import { townhallActive, townhallReason } from './townhall';
import { functionLock } from './unlocks';
import { fail, ok } from './types';
import type { GoodId, Tier, Result, TaxLevel, World } from './types';

/** Der Regler der Bevölkerungsstufe ist noch gesperrt. */
export function taxLocked(world: World, tier: Tier): boolean {
  return world.tick < world.taxLockedUntil[tier];
}

const asTier = (n: number): Tier | null => (n === 1 || n === 2 || n === 3 || n === 4 ? n : null);

/** Nur Stufen mit Aufstieg dürfen «niedrig» (Spec R4). */
export const canRiseTier = (tier: Tier): boolean => TIERS[tier].upgradeCost !== null;

/** Zielwert ziel(t) aus Spec R6.2: «niedrig» für nicht aufstiegsfähige Stufen wird «normal». */
export const taxTarget = (level: TaxLevel, tier: Tier): TaxLevel =>
  level === 'low' && !canRiseTier(tier) ? 'normal' : level;

/** Menge C aus Spec R6.2: Stufen, deren gespeicherter Regler vom Zielwert abweicht, aufsteigend; neues Array. */
export const taxChangeSet = (world: World, level: TaxLevel): Tier[] =>
  TIER_IDS.filter((t) => world.taxLevels[t] !== taxTarget(level, t));

/** Grund, warum eine Stufe nicht auf «niedrig» darf. */
export const noRiseReason = (tier: Tier): string => `${TIERS[tier].name} steigen nicht auf`;

const lockTier = (world: World, tier: Tier, level: TaxLevel): void => {
  world.taxLevels[tier] = level;
  world.taxLockedUntil[tier] = world.tick + TAX_SWITCH_LOCK;
};

/** Schaltet den Regler einer Bevölkerungsstufe um; wirkt ab dem nächsten Tick. Braucht eine wirksame Amtsstube (Spec R6.1). Kostet nichts. */
export function setTierTaxLevel(world: World, tier: number, level: string): Result {
  const t = asTier(tier);
  if (t === null || !Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (level === 'low' && !canRiseTier(t)) return fail(noRiseReason(t));
  if (!townhallActive(world)) return fail(townhallReason(world));
  if (world.taxLevels[t] === level) return fail('Stufe bereits aktiv');
  if (taxLocked(world, t)) return fail('Sperrzeit');
  lockTier(world, t, level as TaxLevel);
  return ok;
}

/** Schaltet alle abweichenden Regler auf `level` (Zielwert je Stufe); atomar, wirkt ab dem nächsten Tick (Spec R6.2). */
export function setTaxLevel(world: World, level: string): Result {
  if (!Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (!townhallActive(world)) return fail(townhallReason(world));
  const changes = taxChangeSet(world, level as TaxLevel);
  if (changes.length === 0) return fail('Stufe bereits aktiv');
  if (changes.some((t) => taxLocked(world, t))) return fail('Sperrzeit');
  for (const t of changes) lockTier(world, t, taxTarget(level as TaxLevel, t));
  return ok;
}

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
