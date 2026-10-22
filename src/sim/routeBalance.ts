import type { Coverage } from './coverage';
import { GOODS } from './defs/goods';
import { SHIP } from './defs/sea';
import { goodsBalance } from './flow';
import { laneTicks } from './islands';
import type { Route, RouteGood, World } from './types';

/** Einheit von `goodsBalance` (Ticks); Umrechnung Netto je 100 Ticks auf die Umlaufzeit. */
const FLOW_TICKS = 100;

type Balances = Map<number, ReturnType<typeof goodsBalance>>;

export interface RouteBalance {
  /** Umlaufzeit a→b→a in Ticks (laneTicks beider Richtungen). */
  cycleTicks: number;
  /** Warenwert (Σ q · GOODS[g].sell) je 100 Ticks, ungerundet. */
  goodsPer100: number;
  /** SHIP.upkeep je 100 Ticks (= UPKEEP_INTERVAL). */
  upkeepPer100: number;
  net100: number;
}

/** Bilanz der Quellinsel aus dem Memo des Aufrufers; füllt es bei Bedarf. */
function balanceOf(world: World, island: number, balances: Balances, cov?: Coverage) {
  let bal = balances.get(island);
  if (bal === undefined) {
    bal = goodsBalance(world, island, cov);
    balances.set(island, bal);
  }
  return bal;
}

/** Warenwert einer Richtung je Umlauf: Menge je Gut = min(Anteil an der Kapazität, Überschuss über den Umlauf). */
function directionValue(
  goods: readonly RouteGood[],
  bal: ReturnType<typeof goodsBalance>,
  cycleTicks: number,
): number {
  if (goods.length === 0) return 0;
  const share = Math.floor(SHIP.capacity / goods.length);
  let value = 0;
  for (const { good } of goods) {
    const surplus = Math.floor(Math.max(0, (bal[good].net * cycleTicks) / FLOW_TICKS));
    value += Math.min(share, surplus) * GOODS[good].sell;
  }
  return value;
}

/**
 * Nominale Untergrenze des Routen-Nutzens je 100 Ticks (nur Überschuss der Quellinsel, zum Verkaufspreis).
 * Lesend: schreibt nur in das übergebene Memo, nie in die Welt. Ohne Seeweg `null`.
 */
export function routeBalance(
  world: World,
  route: Route,
  balances: Balances = new Map(),
  cov?: Coverage,
): RouteBalance | null {
  const cycleTicks =
    laneTicks(world.islands, route.a, route.b) + laneTicks(world.islands, route.b, route.a);
  if (cycleTicks <= 0) return null;
  const value =
    directionValue(route.ab, balanceOf(world, route.a, balances, cov), cycleTicks) +
    directionValue(route.ba, balanceOf(world, route.b, balances, cov), cycleTicks);
  const goodsPer100 = (value * FLOW_TICKS) / cycleTicks;
  const upkeepPer100 = SHIP.upkeep;
  return { cycleTicks, goodsPer100, upkeepPer100, net100: goodsPer100 - upkeepPer100 };
}
