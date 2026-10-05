import { BUILDING_DEFS } from './defs/buildings';
import { GOOD_IDS } from './defs/goods';
import { TIERS } from './defs/tiers';
import type { Coverage } from './coverage';
import { cycleOf } from './levels';
import { inSupplyRange } from './supply';
import type { Building, GoodId, HouseState, Tier, World } from './types';
import { center, HOME } from './world';

/** Netto je Gut über 100 Ticks; fehlt ein Gut, zählt 0 (Spec 3.2). */
export type Budget = Partial<Record<GoodId, number>>;
/** Toleranz für Gleitkomma-Raten (z. B. 8 × 0,2); kein Spielwert. */
const DEFICIT_EPSILON = 1e-9;

/** Erzeugung und Verbrauch je Gut über 100 Ticks (nominal, ungerundet; Lager und Brand zählen nicht). */
export function goodsBalance(
  world: World,
  cov?: Coverage,
): Record<GoodId, { produced: number; consumed: number; net: number }> {
  const out = {} as Record<GoodId, { produced: number; consumed: number; net: number }>;
  for (const g of GOOD_IDS) out[g] = { produced: 0, consumed: 0, net: 0 };
  for (const b of Object.values(world.buildings)) {
    if (b.island !== HOME) continue; // Bilanz nur Heimat (P-15)
    if (b.house) {
      const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
      if (!inSupplyRange(world, HOME, c.cx, c.cy, cov?.supply[HOME])) continue;
      const needs = TIERS[b.house.tier].needs;
      for (const g of Object.keys(needs) as GoodId[])
        out[g].consumed += b.house.inhabitants * needs[g]!;
      continue;
    }
    if (!b.connected) continue;
    const def = BUILDING_DEFS[b.defId];
    const cycle = cycleOf(b);
    if (cycle === undefined) continue;
    if (def.produces) out[def.produces].produced += 100 / cycle;
    for (const g of def.consumes ?? []) out[g].consumed += 100 / cycle;
  }
  for (const g of GOOD_IDS) out[g].net = out[g].produced - out[g].consumed;
  return out;
}

/** Netto-Bilanz als Budget (reine Umformung, ruft goodsBalance nicht selbst). */
export const budgetFrom = (bal: ReturnType<typeof goodsBalance>): Budget =>
  Object.fromEntries(GOOD_IDS.map((g) => [g, bal[g].net]));

/** Δ je Gut der Zielstufe: maxEW(Ziel) × Rate Ziel − EW × Rate jetzt; {} ohne Zielstufe. */
export function upgradeDelta(house: HouseState): Budget {
  const cur = TIERS[house.tier];
  if (cur.upgradeCost === null) return {};
  const next = TIERS[(house.tier + 1) as Tier];
  const d: Budget = {};
  for (const g of Object.keys(next.needs) as GoodId[])
    d[g] = next.maxInhabitants * next.needs[g]! - house.inhabitants * (cur.needs[g] ?? 0);
  return d;
}

/** Erstes Gut (GOOD_IDS-Reihenfolge) mit budget − Δ < −1e-9, sonst null. */
export function deficitGood(budget: Budget, house: HouseState): GoodId | null {
  const delta = upgradeDelta(house);
  for (const g of GOOD_IDS) {
    const d = delta[g];
    if (d !== undefined && (budget[g] ?? 0) - d < -DEFICIT_EPSILON) return g;
  }
  return null;
}

/** Für die UI: { good, net = goodsBalance.net − Δ } des ersten Defizitguts, sonst null; null ohne Haus. */
export function upgradeDeficit(world: World, b: Building): { good: GoodId; net: number } | null {
  const house = b.house;
  if (!house) return null;
  const budget = budgetFrom(goodsBalance(world));
  const good = deficitGood(budget, house);
  if (good === null) return null;
  return { good, net: (budget[good] ?? 0) - (upgradeDelta(house)[good] ?? 0) };
}
