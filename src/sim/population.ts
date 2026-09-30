import { BUILDING_DEFS } from './defs/buildings';
import { TIERS } from './defs/tiers';
import { GOODS } from './defs/goods';
import { UPKEEP_INTERVAL, checkAfford, pay, takeStock } from './economy';
import type {
  Building,
  BuildingDefId,
  GoodId,
  HouseState,
  ServiceId,
  Tier,
  TierDef,
  World,
} from './types';
import { center } from './world';

/** Alle 50 Ticks wächst oder schrumpft ein Haus um einen Einwohner. */
export const GROWTH_INTERVAL = 50;
/** Ticks ununterbrochener Zufriedenheit, bevor ein Haus aufsteigen darf. */
export const UPGRADE_WAIT = 300;
/** Gebäude, das einen Dienst erbringt (für Namen in Gründen und Anzeige). */
export const SERVICE_BUILDING: Record<ServiceId, BuildingDefId> = {
  faith: 'chapel',
  school: 'school',
};
const SERVICE_IDS: ServiceId[] = ['faith', 'school'];
/** Toleranz für die Gleitkomma-Summe von 50 × 0.02. */
const EPSILON = 1e-9;

function distance(a: Building, b: Building): number {
  const ca = center(BUILDING_DEFS[a.defId], a.x, a.y);
  const cb = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return Math.hypot(ca.cx - cb.cx, ca.cy - cb.cy);
}

/** Versorgt: Kontor im Radius oder ein angebundener Markt im Radius (Mitte zu Mitte). */
export function isSupplied(world: World, house: Building): boolean {
  return Object.values(world.buildings).some((b) => {
    if (b.defId !== 'kontor' && b.defId !== 'market') return false;
    if (b.defId === 'market' && !b.connected) return false;
    return distance(house, b) <= (BUILDING_DEFS[b.defId].supplyRadius ?? 0);
  });
}

export function serviceAvailable(world: World, house: Building, service: ServiceId): boolean {
  return Object.values(world.buildings).some((b) => {
    const def = BUILDING_DEFS[b.defId];
    return def.service === service && b.connected && distance(house, b) <= (def.serviceRadius ?? 0);
  });
}

export function allNeedsMet(house: HouseState, tier: TierDef): boolean {
  const goods = Object.keys(tier.needs) as GoodId[];
  return (
    house.supplied &&
    goods.every((g) => house.satisfied[g] === true) &&
    tier.services.every((s) => house.services[s] === true)
  );
}

/**
 * Verbrauch je Tick. Der Bedarf wächst um inhabitants × rate / 100; bei ≥ 1 wird eine Einheit
 * entnommen und der Rest bleibt in `demand` (Restregel). Beispiel: 4 Einwohner mit Rate 0.5
 * bekommen die erste Einheit sofort (Startbedarf 1), die zweite bei Tick 50.
 * `satisfied` bleibt true, bis der nächste Entnahmeversuch scheitert; dazwischen ändert
 * sich der Wert nicht.
 */
function consume(world: World, house: HouseState, tier: TierDef): void {
  for (const [good, rate] of Object.entries(tier.needs) as [GoodId, number][]) {
    if (!house.supplied) {
      house.satisfied[good] = false;
      continue;
    }
    const demand = (house.demand[good] ?? 0) + (house.inhabitants * rate) / 100;
    if (demand >= 1 - EPSILON) {
      if (takeStock(world, good, 1)) {
        house.demand[good] = demand - 1;
        house.satisfied[good] = true;
      } else {
        house.demand[good] = Math.min(demand, 1);
        house.satisfied[good] = false;
      }
    } else {
      house.demand[good] = demand;
    }
  }
}

/** Neue Bedarfsgüter der Stufe `next` gegenüber der aktuellen Stufe. */
function newNeeds(current: TierDef, next: TierDef): GoodId[] {
  return (Object.keys(next.needs) as GoodId[]).filter((g) => !(g in current.needs));
}

/** Prüft alle Aufstiegsbedingungen und nennt jede unerfüllte als deutschen Grund. */
export function upgradeStatus(world: World, b: Building): { ok: boolean; reasons: string[] } {
  const house = b.house;
  if (!house) return { ok: false, reasons: ['Kein Wohnhaus'] };
  const current = TIERS[house.tier];
  if (current.upgradeCost === null) return { ok: false, reasons: ['Höchste Stufe erreicht'] };
  const next = TIERS[(house.tier + 1) as Tier];
  const reasons: string[] = [];
  if (house.inhabitants < current.maxInhabitants) reasons.push('Haus nicht voll belegt');
  if (world.tick - house.satisfiedSince < UPGRADE_WAIT)
    reasons.push(`Bedürfnisse noch nicht ${UPGRADE_WAIT} Ticks erfüllt`);
  for (const s of next.services) {
    if (!serviceAvailable(world, b, s))
      reasons.push(`${BUILDING_DEFS[SERVICE_BUILDING[s]].name} fehlt in Reichweite`);
  }
  for (const g of newNeeds(current, next)) {
    if (world.stock[g] < 1) reasons.push(`Kein ${GOODS[g].name} im Lager`);
  }
  const afford = checkAfford(world, current.upgradeCost);
  if (!afford.ok) reasons.push(afford.reason);
  return { ok: reasons.length === 0, reasons };
}

/** Steigt das Haus auf, wenn `upgradeStatus` ok meldet; zieht Kosten ab und setzt neuen Bedarf. */
export function tryUpgrade(world: World, b: Building): boolean {
  const house = b.house;
  if (!house || !upgradeStatus(world, b).ok) return false;
  const current = TIERS[house.tier];
  const next = TIERS[(house.tier + 1) as Tier];
  pay(world, current.upgradeCost!);
  house.tier = next.tier;
  for (const g of newNeeds(current, next)) house.demand[g] = 1;
  house.satisfiedSince = world.tick;
  return true;
}

export function tickPopulation(world: World): void {
  for (const b of Object.values(world.buildings)) {
    const house = b.house;
    if (!house) continue;
    const tier = TIERS[house.tier];
    house.supplied = isSupplied(world, b);
    for (const s of SERVICE_IDS) house.services[s] = serviceAvailable(world, b, s);
    consume(world, house, tier);
    const met = allNeedsMet(house, tier);
    if (!met) house.satisfiedSince = world.tick;
    if (world.tick % GROWTH_INTERVAL === 0 && world.tick > 0) {
      if (met) house.inhabitants = Math.min(tier.maxInhabitants, house.inhabitants + 1);
      else house.inhabitants = Math.max(1, house.inhabitants - 1);
      tryUpgrade(world, b);
    }
  }
}

/** Steuern je Buchungstakt: Einwohner × Steuersatz, halbiert bei unerfüllten Bedürfnissen. Erst summieren, dann einmal abrunden. */
export function totalTaxes(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    const house = b.house;
    if (!house) continue;
    const tier = TIERS[house.tier];
    sum += house.inhabitants * tier.tax * (allNeedsMet(house, tier) ? 1 : 0.5);
  }
  return Math.floor(sum);
}

/** Aktualisiert die Steuerstatistik und bucht sie im selben Takt wie den Unterhalt. */
export function tickTaxes(world: World): void {
  world.stats.taxes = totalTaxes(world);
  if (world.tick > 0 && world.tick % UPKEEP_INTERVAL === 0) world.money += world.stats.taxes;
}

/** Bürger: Einwohner aller Häuser der Stufe 3. */
export function citizens(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.house?.tier === 3) sum += b.house.inhabitants;
  }
  return sum;
}

/** Einwohner je Bevölkerungsstufe über alle Häuser. */
export function populationByTier(world: World): Record<Tier, number> {
  const sum: Record<Tier, number> = { 1: 0, 2: 0, 3: 0 };
  for (const b of Object.values(world.buildings)) {
    if (b.house) sum[b.house.tier] += b.house.inhabitants;
  }
  return sum;
}
