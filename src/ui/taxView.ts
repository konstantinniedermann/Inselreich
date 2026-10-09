// taxView.ts — rein, DOM-frei: Texte und Zahlen zur Steuer je Stufe (Spec 7.1). Alles aus Defs und Sim-Abfragen.
import { TAX_LEVELS, TIERS, TIER_IDS } from '../sim/defs/tiers';
import { tierCap, taxBaseByTier } from '../sim/population';
import { canRiseTier, noRiseReason, taxChangeSet, taxLocked, taxTarget } from '../sim/tax';
import { effectiveTaxLevel, taxPct, townhallActive } from '../sim/townhall';
import type { TaxLevel, Tier, World } from '../sim/types';
import { taxEffect } from './guide';
import { formatGameTime } from './time';

export type TaxSummary = TaxLevel | 'mixed';

/** P-2: L genau dann, wenn taxChangeSet(w, L) leer ist; sonst 'mixed'. Liest den gespeicherten Stand. */
export const taxSummary = (w: World): TaxSummary =>
  (Object.keys(TAX_LEVELS) as TaxLevel[]).find((l) => taxChangeSet(w, l).length === 0) ?? 'mixed';

export function taxSummaryText(w: World): string {
  const s = taxSummary(w);
  return s === 'mixed' ? 'gemischt' : TAX_LEVELS[s].name;
}

/** «P niedrig · S normal · B normal · K hoch» */
export function taxMixList(w: World): string {
  return TIER_IDS.map((t) => `${TIERS[t].name[0]} ${TAX_LEVELS[w.taxLevels[t]].name}`).join(' · ');
}

export function tierTaxTooltip(tier: Tier, level: TaxLevel): string {
  if (taxTarget(level, tier) !== level) return noRiseReason(tier);
  const parts = [`${taxPct(level, tier)} %`];
  if (canRiseTier(tier)) {
    const wait = TAX_LEVELS[level].upgradeWait;
    parts.push(wait === null ? 'kein Aufstieg' : `Aufstieg nach ${formatGameTime(wait)}`);
  }
  parts.push(`${tierCap(tier, level)} Einwohner`);
  return parts.join(' · ');
}

/** Steuer der Gruppe je Minute (600 Ticks), abgerundet; ohne wirksame Amtsstube mit «normal». */
export function tierTaxPerMinute(w: World, tier: Tier): number {
  const s = taxBaseByTier(w)[tier];
  return Math.floor((s * taxPct(effectiveTaxLevel(w, tier), tier) * 3) / 100);
}

export function taxLockText(w: World, tier: Tier): string {
  return taxLocked(w, tier)
    ? `wieder änderbar in ${formatGameTime(w.taxLockedUntil[tier] - w.tick)}`
    : '';
}

export function taxStatusLine(w: World): string {
  if (!townhallActive(w)) return taxEffect('normal');
  const s = taxSummary(w);
  return s === 'mixed' ? `Steuer gemischt: ${taxMixList(w)}` : taxEffect(s);
}

export function taxButtonTitle(w: World): string {
  const s = taxSummary(w);
  return s === 'mixed' ? taxMixList(w) : taxEffect(s);
}

/** Kleinste gesperrte Stufe in der Änderungsmenge von «alle Stufen». */
export const lockedTierFor = (w: World, level: TaxLevel): Tier | undefined =>
  taxChangeSet(w, level).find((t) => taxLocked(w, t));
