// Merchant-Controller (M8-B1, Spec 16.3 und 16.4). Kein Test: wird von balance-merchants.test.ts genutzt.
// Jeder Entscheid folgt nur aus der Welt (keine Modul- oder Closure-Zustände zwischen Durchläufen), damit ein
// geladener Stand genauso weiterläuft (AK-B1-04).
import { expect } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS, ROAD_COST } from '../../src/sim/defs/buildings';
import { TIERS, WIN_MERCHANTS } from '../../src/sim/defs/tiers';
import { canPlace } from '../../src/sim/placement';
import { merchants } from '../../src/sim/population'; // `citizens` nur für K1, gestrichen (S11)
import { reachableRoads } from '../../src/sim/roads';
import { step } from '../../src/sim/tick';
import { buy, buyPrice } from '../../src/sim/trade';
import type { Building, BuildingDefId, Cost, World } from '../../src/sim/types';
import { adjacentOf, buildingsOfType, center, idx } from '../../src/sim/world';
import { CONTROL_INTERVAL, control, type Layout } from './controller';

/** Grenze aus Spec 16.3: `wonMerchants` bis zu diesem Tick. */
export const MERCHANT_TICK_LIMIT = 12_000;
/**
 * Feste Reserve (R142, Spec 16.3 Phase 3): Geld, das nach jedem eigenen Kauf oder Bau bleibt. Deckt eine volle
 * Unterhaltsbuchung des Endausbaus (≈ 415 je 100 Ticks) ohne Steuer. Testhelfer-Regel, kein Spielwert.
 */
const RESERVE = 500;
/** Stein und Holz je Glashütte im Lager (zwei Zyklen; Verbrauch je 2 je 100 Ticks, Spec 5.2). */
const FEED_PER_WORKS = 4;
/** Kaufmannshäuser für das zweite Ziel: 60 / 20 = 3. */
const MERCHANT_HOUSES = Math.ceil(WIN_MERCHANTS / TIERS[4].maxInhabitants);

type Slot = readonly [number, number];
type Need = 'food' | 'cloth' | 'rum';
/** Bedarfsgut → Verarbeiter und Rohstoffbetrieb (wie im Bürger-Controller). */
const CHAINS: Record<Need, { producer: BuildingDefId; raw: BuildingDefId | null }> = {
  food: { producer: 'fisher', raw: null },
  cloth: { producer: 'weaver', raw: 'sheepfarm' },
  rum: { producer: 'distillery', raw: 'canefarm' },
};
const NEEDS: readonly Need[] = ['food', 'cloth', 'rum'];

export interface MerchantTrajectory {
  winTick: number | null;
  /** Erster Tick, an dem jedes Haus ein volles Bürgerhaus ist (Spec 16.3 Phase 2). */
  endStateTick: number | null;
  firstMerchantTick: number | null;
  wonMerchantsTick: number | null;
  minMoneyAfterWin: number | null;
  endMoney: number;
  buildings: Partial<Record<BuildingDefId, number>>;
}

export function newMerchantTrajectory(): MerchantTrajectory {
  return {
    winTick: null,
    endStateTick: null,
    firstMerchantTick: null,
    wonMerchantsTick: null,
    minMoneyAfterWin: null,
    endMoney: 0,
    buildings: {},
  };
}

const count = (w: World, defId: BuildingDefId): number => buildingsOfType(w, defId).length;
const houses = (w: World): Building[] => buildingsOfType(w, 'house');
const merchantHouses = (w: World): number => houses(w).filter((b) => b.house!.tier === 4).length;

/** Bürger-Endzustand: es gibt Häuser, und jedes ist ein Bürgerhaus mit voller Belegung. */
export function citizenEndState(w: World): boolean {
  const hs = houses(w);
  return (
    hs.length > 0 &&
    hs.every((b) => b.house!.tier === 3 && b.house!.inhabitants === TIERS[3].maxInhabitants)
  );
}

/** Erweiterungswege (Spec 16.3): Spalten kx+2 und kx+5, je ky−1 … ky−9 und ky+1 … ky+9. */
export function extensionRoads(w: World): Slot[] {
  const k = w.buildings[w.kontorId]!;
  const out: Slot[] = [];
  for (const dx of [2, 5])
    for (let dy = 1; dy <= 9; dy++) out.push([k.x + dx, k.y - dy], [k.x + dx, k.y + dy]);
  return out;
}

/** Merkmal „Erweiterung angelegt": Weg auf der ersten Erweiterungskachel. */
function hasExtension(w: World): boolean {
  const k = w.buildings[w.kontorId]!;
  return w.tiles[idx(w, k.x + 2, k.y - 1)]!.road;
}

/** Phase 3: nach dem Sieg und entweder im Bürger-Endzustand oder mit angelegter Erweiterung (bleibt nach dem ersten Aufstieg). */
export function merchantPhase(w: World): boolean {
  return w.won && (hasExtension(w) || citizenEndState(w));
}

/** Legt fehlende Erweiterungswege an; false, wenn das Geld (mit Reserve) nicht reicht. */
function ensureExtension(w: World): boolean {
  for (const [x, y] of extensionRoads(w)) {
    if (w.tiles[idx(w, x, y)]!.road) continue;
    if (w.money - ROAD_COST < RESERVE) return false;
    expect(placeRoad(w, x, y).ok, `Weg ${x},${y}`).toBe(true);
  }
  return true;
}

/**
 * Erster freier, angebundener Platz für `defId`: Zeilen ky−9 … ky+9, darin Spalten kx+1 … kx+19 (Spec 16.3),
 * mit `canPlace` und einer angrenzenden, vom Kontor erreichbaren Wegkachel; `accept` filtert zusätzlich.
 */
function freeSlot(
  w: World,
  defId: BuildingDefId,
  accept: (x: number, y: number) => boolean = () => true,
): Slot {
  const k = w.buildings[w.kontorId]!;
  const def = BUILDING_DEFS[defId];
  const roads = reachableRoads(w);
  for (let y = k.y - 9; y <= k.y + 9; y++)
    for (let x = k.x + 1; x <= k.x + 19; x++) {
      if (!canPlace(w, defId, x, y).ok || !accept(x, y)) continue;
      if (adjacentOf(w, x, y, def.w, def.h).some((p) => roads.has(idx(w, p.x, p.y)))) return [x, y];
    }
  throw new Error(`kein freier Erweiterungsplatz für ${defId}`);
}

/** Badehaus an (x, y) deckt mindestens MERCHANT_HOUSES Häuser (Mitte zu Mitte ≤ serviceRadius). */
function bathCovers(w: World, x: number, y: number): boolean {
  const def = BUILDING_DEFS.bathhouse;
  const c = center(def, x, y);
  const covered = houses(w).filter((h) => {
    const hc = center(BUILDING_DEFS.house, h.x, h.y);
    return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= def.serviceRadius!;
  });
  return covered.length >= MERCHANT_HOUSES;
}

/** Kauft fehlendes Holz, Werkzeug und Stein für `cost`; nur wenn danach `cost.money` + RESERVE bleiben. */
function buyFor(w: World, cost: Cost): boolean {
  const goods = ['wood', 'tools', 'stone'] as const;
  const missing = goods.map((g) => [g, Math.max(0, cost[g] - w.stock[g])] as const);
  const price = missing.reduce((sum, [g, n]) => sum + buyPrice(g, n), 0);
  if (w.money - price - cost.money < RESERVE) return false;
  for (const [g, n] of missing) if (n > 0) expect(buy(w, g, n).ok).toBe(true);
  return true;
}

/** Baut `defId` auf `slot`; false, wenn das Geld (noch) nicht reicht. */
function build(w: World, defId: BuildingDefId, slot: Slot): boolean {
  if (!buyFor(w, BUILDING_DEFS[defId].cost)) return false;
  const r = placeBuilding(w, defId, slot[0], slot[1]);
  expect(r.ok, `${defId} at ${slot[0]},${slot[1]}`).toBe(true);
  return true;
}

/** Hält je Glashütte FEED_PER_WORKS Stein und Holz im Lager; Stein wird zugekauft (Spec 16.3). */
function feedGlassworks(w: World): void {
  const want = FEED_PER_WORKS * count(w, 'glassworks');
  for (const g of ['stone', 'wood'] as const) {
    const n = want - w.stock[g];
    if (n > 0 && w.money - buyPrice(g, n) >= RESERVE) expect(buy(w, g, n).ok).toBe(true);
  }
}

/**
 * Verarbeiter für `good`, wenn `planned` Häuser Kaufleute sind: bestehende Kaufmannshäuser zählen mit Stufe 4,
 * dazu so viele Bürgerhäuser (aufsteigende Id), bis `planned` erreicht ist. Gleiche Formel wie
 * `producersNeeded` im Bürger-Controller; für `planned` = heutige Kaufmannshäuser ist das Ergebnis identisch.
 */
function producersFor(w: World, good: Need, planned: number): number {
  let extra = planned - merchantHouses(w);
  let demand = 0;
  for (const b of houses(w)) {
    let tier = b.house!.tier;
    if (tier === 3 && extra > 0) {
      tier = 4;
      extra -= 1;
    }
    demand += TIERS[tier].maxInhabitants * (TIERS[tier].needs[good] ?? 0);
  }
  const output = 100 / BUILDING_DEFS[CHAINS[good].producer].cycle!;
  return Math.ceil(demand / output);
}

/** Decken die Ketten den Bedarf für `planned` Kaufmannshäuser? */
function chainsCover(w: World, planned: number): boolean {
  return NEEDS.every((g) => count(w, CHAINS[g].producer) >= producersFor(w, g, planned));
}

/** Baut Ketten paarweise aus (Rohstoff vor Verarbeiter, wie `buildChain`); false, wenn das Geld fehlt. */
function buildChains(w: World, planned: number): boolean {
  for (const good of NEEDS) {
    const { producer, raw } = CHAINS[good];
    while (count(w, producer) < producersFor(w, good, planned)) {
      if (raw && count(w, raw) <= count(w, producer) && !build(w, raw, freeSlot(w, raw)))
        return false;
      if (!build(w, producer, freeSlot(w, producer))) return false;
    }
  }
  return true;
}

/** Material und notfalls 1 Glas als Auslöser für den nächsten Aufstieg 3 → 4 (Spec 16.3, 8.3); kein Verkauf. */
function prepareUpgrade(w: World): void {
  // W-T6-1: Die Glashütte verbraucht Stein vor der Aufstiegsprüfung (Tick % GROWTH_INTERVAL), also mitkaufen.
  const base = TIERS[3].upgradeCost!;
  const cost = { ...base, stone: base.stone + count(w, 'glassworks') };
  if (!buyFor(w, cost)) return;
  if (w.stock.glass < 1 && w.money - buyPrice('glass', 1) - cost.money >= RESERVE)
    expect(buy(w, 'glass', 1).ok).toBe(true);
}

/** Ein Durchlauf in Phase 3 (Spec 16.3): Wege, Lager, Badehaus, je Haus Glashütte, Mehrkette, Aufstieg. */
function merchantControl(w: World, layout: Layout): void {
  // Bürger-Controller nur, wenn er keine Kette mehr bauen müsste: dann verkauft er nur Überschuss
  if (chainsCover(w, merchantHouses(w))) control(w, layout, {});
  if (!ensureExtension(w)) return;
  feedGlassworks(w);
  if (
    count(w, 'bathhouse') === 0 &&
    !build(
      w,
      'bathhouse',
      freeSlot(w, 'bathhouse', (x, y) => bathCovers(w, x, y)),
    )
  )
    return;
  const ready = merchantHouses(w);
  const built = count(w, 'glassworks');
  if (
    built < MERCHANT_HOUSES &&
    built <= ready &&
    !build(w, 'glassworks', freeSlot(w, 'glassworks'))
  )
    return;
  const works = count(w, 'glassworks');
  if (!buildChains(w, Math.max(ready, works))) return;
  if (ready < works) prepareUpgrade(w);
}

function record(t: MerchantTrajectory, w: World): void {
  if (t.winTick === null && w.won) t.winTick = w.tick;
  if (t.endStateTick === null && w.won && citizenEndState(w)) t.endStateTick = w.tick;
  if (t.firstMerchantTick === null && merchants(w) > 0) t.firstMerchantTick = w.tick;
  if (t.wonMerchantsTick === null && w.wonMerchants) t.wonMerchantsTick = w.tick;
  if (w.won)
    t.minMoneyAfterWin =
      t.minMoneyAfterWin === null ? w.money : Math.min(t.minMoneyAfterWin, w.money);
}

/**
 * Schleife bis `wonMerchants` oder MERCHANT_TICK_LIMIT. Vor Phase 3 genau wie `runColony` (control, dann step);
 * hält nach dem ersten Schritt mit stop(w) === true (Rückgabe true).
 * Laufdaten: `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-merchants.test.ts --silent=false`.
 */
export function runMerchants(
  w: World,
  layout: Layout,
  t: MerchantTrajectory,
  stop?: (w: World) => boolean,
): boolean {
  while (w.tick < MERCHANT_TICK_LIMIT && !w.wonMerchants) {
    if (w.tick % CONTROL_INTERVAL === 0) {
      if (merchantPhase(w)) merchantControl(w, layout);
      else control(w, layout, {});
    }
    step(w);
    record(t, w);
    if (stop?.(w)) return true;
  }
  t.endMoney = w.money;
  t.buildings = {};
  for (const b of Object.values(w.buildings))
    t.buildings[b.defId] = (t.buildings[b.defId] ?? 0) + 1;
  return false;
}
