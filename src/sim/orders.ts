import { GOODS, GOOD_IDS, ORDER_PREMIUM } from './defs/goods';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from './defs/timing';
import { createRng } from './rng';
import type { GoodId, Result, Tier, World } from './types';
import { fail, ok } from './types';

/** Höchste Hausstufe aller Häuser; ohne Häuser 1 (auch Eingabe des Boom-Pools, M6). */
export function maxHouseTier(world: World): Tier {
  let max: Tier = 1;
  for (const b of Object.values(world.buildings)) {
    if (b.house !== undefined && b.house.tier > max) max = b.house.tier;
  }
  return max;
}

/** Stückprämie eines Auftragsguts. */
export function orderUnitReward(good: GoodId): number {
  return Math.floor(GOODS[good].buy * ORDER_PREMIUM);
}

/** Güterpool der Aufträge und Booms: Güter mit `order` bis `maxTier`, Reihenfolge GOOD_IDS. */
export function orderPool(maxTier: Tier): GoodId[] {
  return GOOD_IDS.filter((g) => {
    const o = GOODS[g].order;
    return o !== undefined && o.tier <= maxTier;
  });
}

/**
 * Auftrag der Periode `k`, rein aus Seed, Periode und Höchststufe abgeleitet (ADR-010):
 * eine neue RNG-Instanz je Periode, kein gespeicherter RNG-Zustand.
 */
export function orderForPeriod(
  seed: number,
  k: number,
  maxTier: Tier,
): { good: GoodId; amount: number; reward: number } {
  const pool = orderPool(maxTier);
  const r = createRng((seed ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0);
  const good = pool[Math.floor(r() * pool.length)]!;
  const def = GOODS[good].order!;
  const amount = def.min + Math.floor(r() * (def.max - def.min + 1));
  return { good, amount, reward: amount * orderUnitReward(good) };
}

/** Lässt einen abgelaufenen Auftrag verfallen und bietet zu Beginn einer Periode den nächsten an. Verändert kein Geld. */
export function tickOrders(world: World): void {
  const t = world.tick;
  if (world.order !== null && t > world.order.due) world.order = null;
  if (
    world.order === null &&
    t >= ORDER_FIRST_TICK &&
    (t - ORDER_FIRST_TICK) % ORDER_PERIOD === 0
  ) {
    const k = (t - ORDER_FIRST_TICK) / ORDER_PERIOD;
    world.order = {
      period: k,
      ...orderForPeriod(world.seed, k, maxHouseTier(world)),
      due: t + ORDER_DURATION,
    };
  }
}

/** Liefert den aktiven Auftrag ab (auch bei negativem Geld, es ist eine Einnahme); keine Teillieferung. */
export function deliverOrder(world: World): Result {
  const o = world.order;
  if (o === null) return fail('Kein Auftrag');
  if (world.stock[o.good] < o.amount) return fail('Nicht genug Ware');
  world.stock[o.good] -= o.amount;
  world.money += o.reward;
  world.order = null;
  return ok;
}

/** Tick, an dem der nächste Auftrag angeboten wird (strikt nach dem aktuellen Tick, ausser vor dem ersten). */
export function nextOrderTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1);
}
