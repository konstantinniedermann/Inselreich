import {
  CONTRACT_MIN_TIER,
  CONTRACT_PENALTY_PCT,
  CONTRACT_PREMIUM,
  GOODS,
  GOOD_IDS,
  ORDER_PREMIUM,
} from './defs/goods';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from './defs/timing';
import { islandName } from './islands';
import { islandAt } from './placement';
import { createRng } from './rng';
import { functionLock } from './unlocks';
import type {
  Contract,
  ContractBreakReason,
  ContractEvent,
  GoodId,
  Result,
  Tier,
  World,
} from './types';
import { fail, ok } from './types';
import { noKontorTrade } from './trade';
import { HOME } from './world';

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

/** Zufallsauftrag der Periode `k` anbieten, rein aus Seed, Periode und Höchststufe (ADR-010). */
function offerRandomOrder(world: World, k: number): void {
  world.order = {
    period: k,
    ...orderForPeriod(world.seed, k, maxHouseTier(world)),
    due: world.tick + ORDER_DURATION,
  };
}

/** Erste zutreffende Bruchbedingung des laufenden Vertrags (R6), sonst `null`. */
function breakReason(world: World, c: Contract): ContractBreakReason | null {
  if (functionLock(world, 'orders') !== null) return 'lock';
  const isl = islandAt(world, c.island);
  if (isl === null) return 'island';
  if (noKontorTrade(world, c.island) !== null) return 'kontor';
  if (isl.stock[c.good] < c.amount) return 'stock';
  return null;
}

/** Vertrag am Periodenbeginn abrechnen (R6/R7): liefern oder brechen. Liest nur Lager und Geld. */
function settleContract(world: World, c: Contract): ContractEvent {
  const reason = breakReason(world, c);
  if (reason === null) {
    const pay = c.amount * c.price;
    islandAt(world, c.island)!.stock[c.good] -= c.amount;
    world.money += pay;
    return { kind: 'delivered', good: c.good, amount: c.amount, pay, island: c.island };
  }
  const penalty = contractPenalty(c);
  world.money -= penalty;
  world.contract = null;
  return { kind: 'broken', good: c.good, reason, penalty, island: c.island };
}

/**
 * Lässt einen abgelaufenen Auftrag verfallen; am Periodenbeginn verfällt das Angebot, ein Vertrag wird
 * abgerechnet (Lieferung: kein Zufallsauftrag) und sonst der Zufallsauftrag angeboten.
 */
export function tickOrders(world: World): ContractEvent | null {
  const t = world.tick;
  if (world.order !== null && t > world.order.due) world.order = null;
  if (t < ORDER_FIRST_TICK || (t - ORDER_FIRST_TICK) % ORDER_PERIOD !== 0) return null;
  world.contractOffer = null;
  const ev = world.contract === null ? null : settleContract(world, world.contract);
  if (ev?.kind === 'delivered') return ev;
  if (world.order === null) offerRandomOrder(world, (t - ORDER_FIRST_TICK) / ORDER_PERIOD);
  return ev;
}

/** Liefert den aktiven Auftrag aus dem Lager der Insel ab (auch bei negativem Geld, es ist eine Einnahme); keine Teillieferung. */
export function deliverOrder(world: World, island: number = HOME): Result {
  const lock = functionLock(world, 'orders');
  if (lock !== null) return fail(lock);
  const o = world.order;
  if (o === null) return fail('Kein Auftrag');
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const noKontor = noKontorTrade(world, island);
  if (noKontor !== null) return fail(noKontor);
  if (isl.stock[o.good] < o.amount)
    return fail(
      island === HOME ? 'Nicht genug Ware' : `Nicht genug Ware auf ${islandName(world, island)}`,
    );
  isl.stock[o.good] -= o.amount;
  world.money += o.reward;
  world.order = null;
  if (world.contract === null && maxHouseTier(world) >= CONTRACT_MIN_TIER)
    world.contractOffer = { good: o.good, island };
  return ok;
}

/** Nimmt das Angebot an: Menge und Preis werden festgeschrieben (R3). */
export function acceptContract(world: World): Result {
  const lock = functionLock(world, 'orders');
  if (lock !== null) return fail(lock);
  const offer = world.contractOffer;
  if (offer === null) return fail('Kein Angebot');
  const noKontor = noKontorTrade(world, offer.island);
  if (noKontor !== null) return fail(noKontor);
  world.contract = {
    good: offer.good,
    amount: GOODS[offer.good].order!.contract,
    price: contractUnitPrice(offer.good),
    island: offer.island,
  };
  world.contractOffer = null;
  return ok;
}

/** Lehnt das Angebot ab (R4). */
export function declineContract(world: World): Result {
  if (world.contractOffer === null) return fail('Kein Angebot');
  world.contractOffer = null;
  return ok;
}

/** Kündigt den Vertrag kostenlos, auch bei gesperrter Funktion (R5). */
export function cancelContract(world: World): Result {
  if (world.contract === null) return fail('Kein Vertrag');
  world.contract = null;
  return ok;
}

/** Tick, an dem der nächste Auftrag angeboten wird (strikt nach dem aktuellen Tick, ausser vor dem ersten). */
export function nextOrderTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1);
}

/** Stückpreis eines Liefervertrags (I-047). */
export function contractUnitPrice(good: GoodId): number {
  return Math.floor(GOODS[good].buy * CONTRACT_PREMIUM);
}

/** Strafe bei Vertragsbruch, aus den beim Annehmen festgeschriebenen Werten. */
export function contractPenalty(c: Contract): number {
  return Math.ceil((c.amount * c.price * CONTRACT_PENALTY_PCT) / 100);
}
