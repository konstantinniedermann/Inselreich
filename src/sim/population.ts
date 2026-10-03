import { BUILDING_DEFS } from './defs/buildings';
import { TAX_CARRY_DIVISOR, TAX_LEVELS, TAX_UNIT, TIERS } from './defs/tiers';
import { GOODS } from './defs/goods';
import { GROWTH_INTERVAL } from './defs/timing';
import { checkAfford, pay, takeStock } from './economy';
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
import { inSupplyRange } from './supply';
import { effectiveTaxLevel, goodLockActive, upgradeStopActive } from './townhall';
import { center } from './world';

export { GROWTH_INTERVAL, UPGRADE_WAIT } from './defs/timing';

/** Gebäude, das einen Dienst erbringt (für Namen in Gründen und Anzeige). */
export const SERVICE_BUILDING: Record<ServiceId, BuildingDefId> = {
  faith: 'chapel',
  school: 'school',
  bath: 'bathhouse',
};
/** Alle Dienste in fester Reihenfolge; `tickPopulation` leitet je Haus jeden davon ab. */
export const SERVICE_IDS: readonly ServiceId[] = ['faith', 'school', 'bath'];
/** Toleranz für die Gleitkomma-Summe von 50 × 0.02. */
const EPSILON = 1e-9;

function distance(a: Building, b: Building): number {
  const ca = center(BUILDING_DEFS[a.defId], a.x, a.y);
  const cb = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return Math.hypot(ca.cx - cb.cx, ca.cy - cb.cy);
}

/** Versorgt: Kontor im Radius oder ein angebundener Markt im Radius (Mitte zu Mitte). */
export function isSupplied(world: World, house: Building): boolean {
  const c = center(BUILDING_DEFS[house.defId], house.x, house.y);
  return inSupplyRange(world, c.cx, c.cy);
}

/** Neues Haus: Bedarf 1 je Bedarfsgut der Stufe 1, damit die erste Entnahme sofort erfolgt. */
export function newHouseState(world: World): HouseState {
  const demand: Partial<Record<GoodId, number>> = {};
  for (const good of Object.keys(TIERS[1].needs) as GoodId[]) demand[good] = 1;
  return {
    tier: 1,
    inhabitants: 1,
    demand,
    satisfied: {},
    services: {},
    satisfiedSince: world.tick,
    supplied: false,
  };
}

export function serviceAvailable(world: World, house: Building, service: ServiceId): boolean {
  return Object.values(world.buildings).some((b) => {
    const def = BUILDING_DEFS[b.defId];
    return (
      def.service === service &&
      b.connected &&
      b.outageUntil === undefined &&
      distance(house, b) <= (def.serviceRadius ?? 0)
    );
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
    if (goodLockActive(world, house.tier, good)) {
      const locked = (house.demand[good] ?? 0) + (house.inhabitants * rate) / 100;
      house.demand[good] = Math.min(locked, 1); // wie leeres Lager (Spec 5.3)
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
  const lock = tierLock(world, next.tier);
  if (lock !== null) reasons.push(lock);
  if (upgradeStopActive(world, house.tier)) reasons.push('Aufstieg in der Amtsstube angehalten');
  if (house.inhabitants < current.maxInhabitants) reasons.push('Haus nicht voll belegt');
  const wait = TAX_LEVELS[effectiveTaxLevel(world)].upgradeWait;
  if (wait === null) reasons.push('Steuer zu hoch');
  else if (world.tick - house.satisfiedSince < wait)
    reasons.push(`Bedürfnisse noch nicht ${wait} Ticks erfüllt`);
  for (const s of next.services) {
    if (!serviceAvailable(world, b, s))
      reasons.push(`${BUILDING_DEFS[SERVICE_BUILDING[s]].name} fehlt in Reichweite`);
  }
  for (const g of newNeeds(current, next)) {
    if (goodLockActive(world, next.tier, g))
      reasons.push(`${GOODS[g].name} für ${next.name} gesperrt`);
    else if (world.stock[g] < 1) reasons.push(`Kein ${GOODS[g].name} im Lager`);
  }
  const afford = checkAfford(world, current.upgradeCost);
  if (!afford.ok) reasons.push(afford.reason);
  return { ok: reasons.length === 0, reasons };
}

/**
 * Steigt das Haus auf, wenn `upgradeStatus` ok meldet; zieht Kosten ab und entnimmt je neuem
 * Bedarfsgut genau eine Einheit. Sie gilt als ausgeliefert (`demand` 0, `satisfied` true): so
 * nehmen zwei Häuser nicht dieselbe Einheit, und das Haus zählt gleich im selben Tick als versorgt.
 */
export function tryUpgrade(world: World, b: Building): boolean {
  const house = b.house;
  if (!house || !upgradeStatus(world, b).ok) return false;
  const current = TIERS[house.tier];
  const next = TIERS[(house.tier + 1) as Tier];
  pay(world, current.upgradeCost!);
  house.tier = next.tier;
  for (const g of newNeeds(current, next)) {
    // Rückgabewert ignoriert: upgradeStatus hat ≥ 1 geprüft, und pay zieht die neuen Bedarfsgüter nicht ab.
    takeStock(world, g, 1);
    house.demand[g] = 0;
    house.satisfied[g] = true;
  }
  house.satisfiedSince = world.tick;
  return true;
}

/** Zielbelegung eines Hauses: Höchstbelegung × Belegungsanteil der Steuerstufe, mindestens 1. */
export function houseCap(world: World, house: HouseState): number {
  return Math.max(
    1,
    Math.floor(TIERS[house.tier].maxInhabitants * TAX_LEVELS[effectiveTaxLevel(world)].occupancy),
  );
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
      const cap = houseCap(world, house);
      if (house.inhabitants > cap) house.inhabitants -= 1;
      else if (met) house.inhabitants = Math.min(cap, house.inhabitants + 1);
      else house.inhabitants = Math.max(1, house.inhabitants - 1);
      tryUpgrade(world, b);
    }
  }
}

/** Steuereinheiten je Schritt (ganzzahlig): Einwohner × Steuersatz × (erfüllt ? TAX_UNIT : 1), dann × Steuerstufe in Prozent. */
export function taxUnits(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    const house = b.house;
    if (!house) continue;
    const tier = TIERS[house.tier];
    sum += house.inhabitants * tier.tax * (allNeedsMet(house, tier) ? TAX_UNIT : 1);
  }
  return sum * TAX_LEVELS[effectiveTaxLevel(world)].pct;
}

/** Steuern als Nominalwert je 100 Ticks (Anzeige). Erst summieren, dann einmal abrunden. */
export function totalTaxes(world: World): number {
  return Math.floor(taxUnits(world) / (TAX_UNIT * 100));
}

/** Aktualisiert die Steuerstatistik (Nominalwert je 100 Ticks) und bucht je Schritt mit ganzzahligem Übertrag. */
export function tickTaxes(world: World): void {
  const units = taxUnits(world);
  world.stats.taxes = Math.floor(units / (TAX_UNIT * 100));
  world.taxCarry += units;
  const n = Math.floor(world.taxCarry / TAX_CARRY_DIVISOR);
  world.money += n;
  world.taxCarry -= n * TAX_CARRY_DIVISOR;
}

/** Bürger und höher: Einwohner aller Häuser ab Stufe 3 (M8 4.2; ein Aufstieg 3 → 4 senkt die Zahl nie). */
export function citizens(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.house !== undefined && b.house.tier >= 3) sum += b.house.inhabitants;
  }
  return sum;
}

/** Kaufleute: Einwohner aller Häuser der Stufe 4. */
export function merchants(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.house?.tier === 4) sum += b.house.inhabitants;
  }
  return sum;
}

/**
 * Sperrgrund der Zielstufe `tier` oder `null` (frei). Stufen ohne Definition (z. B. 5) und Stufen ohne
 * `requiresWin` sind frei. Mit Hebel `unlockCitizens` = N ist die Stufe ab N Bürgern+ frei (live gelesen).
 */
export function tierLock(world: World, tier: number): string | null {
  if (tier !== 1 && tier !== 2 && tier !== 3 && tier !== 4) return null;
  const def = TIERS[tier];
  if (def.requiresWin !== true || world.won) return null;
  const n = def.unlockCitizens ?? null;
  if (n === null) return 'Erst nach dem Ziel';
  const c = citizens(world);
  return c >= n ? null : `Erst ab ${n} Bürgern (jetzt ${c})`;
}

/** Einwohner je Bevölkerungsstufe über alle Häuser. */
export function populationByTier(world: World): Record<Tier, number> {
  const sum: Record<Tier, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const b of Object.values(world.buildings)) {
    if (b.house) sum[b.house.tier] += b.house.inhabitants;
  }
  return sum;
}
