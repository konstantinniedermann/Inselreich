import { BUILDING_DEFS } from './defs/buildings';
import { TIERS } from './defs/tiers';
import { takeStock } from './economy';
import type { Building, GoodId, HouseState, ServiceId, TierDef, World } from './types';
import { center } from './world';

/** Alle 50 Ticks wächst oder schrumpft ein Haus um einen Einwohner. */
export const GROWTH_INTERVAL = 50;
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
      // Aufstieg (Task 2): hier nach dem Wachstum prüfen.
    }
  }
}
