// taxView.ts — rein, DOM-frei: Texte und Zahlen zur Steuer je Stufe (Spec 7.1). Alles aus Defs und Sim-Abfragen.
import { GOODS } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS, TIER_IDS, TITHE_GOOD, TITHE_PCT } from '../sim/defs/tiers';
import { tierCap, taxBaseByTier } from '../sim/population';
import { canRiseTier, noRiseReason, taxChangeSet, taxLocked, taxTarget } from '../sim/tax';
import { EDICTS } from '../sim/defs/edicts';
import { activeEdict, edictTaxPoints, effectiveTaxPct } from '../sim/edicts';
import { taxPct, townhallActive, townhallReason } from '../sim/townhall';
import type { TaxLevel, Tier, TitheTier, World } from '../sim/types';
import { taxEffect } from './guide';
import { formatGameTime, taxUnitsPerMinute } from './time';

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

/** Zehnt-Teil des Stufen-Tooltips; `null`, wenn die Stufe keinen Zehnt kennt oder er aus ist. */
function titheTooltipPart(world: World, tier: Tier): string | null {
  if (!(tier in TITHE_GOOD)) return null;
  const t = tier as TitheTier;
  const pct = TITHE_PCT[t];
  if (pct <= 0 || !world.titheOn[t]) return null;
  if (!townhallActive(world)) return `Zehnt ruht: ${townhallReason(world)}`;
  const good = GOODS[TITHE_GOOD[t]].name;
  return pct >= 100
    ? `Zehnt: alles als ${good}, kein Geld`
    : `Zehnt: ${100 - pct} % Geld, ${pct} % als ${good}`;
}

export function tierTaxTooltip(world: World, tier: Tier, level: TaxLevel): string {
  if (taxTarget(level, tier) !== level) return noRiseReason(tier);
  const parts = [`${taxPct(level, tier)} %`];
  const tithe = titheTooltipPart(world, tier);
  if (tithe !== null) parts.push(tithe);
  if (canRiseTier(tier)) {
    const wait = TAX_LEVELS[level].upgradeWait;
    parts.push(wait === null ? 'kein Aufstieg' : `Aufstieg nach ${formatGameTime(wait)}`);
  }
  parts.push(`${tierCap(world, tier, level)} Einwohner`);
  return parts.join(' · ');
}

/** Steuer der Gruppe je Minute (600 Ticks), abgerundet; ohne wirksame Amtsstube mit «normal». */
export function tierTaxPerMinute(w: World, tier: Tier): number {
  const s = taxBaseByTier(w)[tier];
  return taxUnitsPerMinute(s * effectiveTaxPct(w, tier));
}

export function taxLockText(w: World, tier: Tier): string {
  return taxLocked(w, tier)
    ? `wieder änderbar in ${formatGameTime(w.taxLockedUntil[tier] - w.tick)}`
    : '';
}

export function taxStatusLine(w: World): string {
  if (!townhallActive(w)) return taxEffect('normal');
  const s = taxSummary(w);
  const base = s === 'mixed' ? `Steuer gemischt: ${taxMixList(w)}` : taxEffect(s);
  const pts = edictTaxPoints(w);
  return pts > 0 ? `${base} · Edikt −${pts} Punkte` : base;
}

export function taxButtonTitle(w: World): string {
  const s = taxSummary(w);
  const base = s === 'mixed' ? taxMixList(w) : taxEffect(s);
  const e = activeEdict(w);
  return e === null ? base : `${base} · Edikt: ${EDICTS[e].name}`;
}

/** Kleinste gesperrte Stufe in der Änderungsmenge von «alle Stufen». */
export const lockedTierFor = (w: World, level: TaxLevel): Tier | undefined =>
  taxChangeSet(w, level).find((t) => taxLocked(w, t));
