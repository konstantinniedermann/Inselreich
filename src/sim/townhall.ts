import { FUNCTION_ENTRY } from './defs/unlocks';
import { TAX_LEVELS } from './defs/tiers';
import type { Building, GoodId, TaxLevel, Tier, World } from './types';

const townhalls = (w: World): Building[] =>
  Object.values(w.buildings).filter((b) => b.defId === 'townhall');

/** Spec 5.1: eine Amtsstube steht, ist angebunden und ohne Ausfall (wie serviceAvailable, ohne Radius). */
export function townhallActive(w: World): boolean {
  return townhalls(w).some((b) => b.connected && b.outageUntil === undefined);
}
/** Grund für alle Amtsstuben-Aktionen ohne Wirkung (Spec 5.1). */
export function townhallReason(w: World): 'Braucht eine Amtsstube' | 'Amtsstube wirkt nicht' {
  return townhalls(w).length === 0 ? 'Braucht eine Amtsstube' : 'Amtsstube wirkt nicht';
}
/** Spec 5.2: gespeicherte Stufe der Bevölkerungsstufe nur mit aktiver Amtsstube, sonst „normal". */
export function effectiveTaxLevel(w: World, tier: Tier): TaxLevel {
  return townhallActive(w) ? w.taxLevels[tier] : 'normal';
}
/** Steuersatz in % der Grundsteuer für eine Bevölkerungsstufe: `pctByTier` vor `pct`. */
export function taxPct(level: TaxLevel, tier: Tier): number {
  return TAX_LEVELS[level].pctByTier?.[tier] ?? TAX_LEVELS[level].pct;
}
/** Spec 5.3: wirkt nur mit freier Ausgabesperre (U5) und aktiver Amtsstube; leer → sofort false (bitgleich). */
export function goodLockActive(w: World, tier: Tier, good: GoodId): boolean {
  return (
    w.goodLocks.some((l) => l.tier === tier && l.good === good) &&
    w.unlocked.includes(FUNCTION_ENTRY.goodLocks) &&
    townhallActive(w)
  );
}
/** Spec 5.4: wirkt nur mit aktiver Amtsstube; leer → sofort false. */
export function upgradeStopActive(w: World, tier: Tier): boolean {
  return w.upgradeStops.includes(tier) && townhallActive(w);
}
