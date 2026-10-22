import {
  CONTRACT_LOYAL_AFTER,
  CONTRACT_MIN_TIER,
  CONTRACT_PENALTY_PCT,
  CONTRACT_PREMIUM,
  CONTRACT_WARN_TICKS,
  GOODS,
  GOOD_IDS,
  ORDER_PREMIUM,
} from './defs/goods';
import { ISLANDS } from './defs/sea';
import { FAR_ORDER_DURATION, ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from './defs/timing';
import { islandName } from './islands';
import { islandAt } from './placement';
import { createRng } from './rng';
import { functionLock } from './unlocks';
import type {
  Contract,
  ContractBreakReason,
  ContractEvent,
  FarOffer,
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

/** Vorliebe-Gut der Fremdinsel mit `order.far` (erstes in `prefers`); Heimat oder ohne → `null` (R1). */
export function farGood(world: World, island: number): GoodId | null {
  const isl = world.islands[island];
  if (island === HOME || isl === undefined) return null;
  const def = ISLANDS.find((d) => d.kind === isl.kind);
  return def?.prefers.find((g) => GOODS[g].order?.far !== undefined) ?? null;
}

/** Wählbare Fremdinseln in Indexfolge: Kontor, Gut mit `order.far`, Stufe erreicht (R1). */
export function farEligible(world: World): number[] {
  const max = maxHouseTier(world);
  const out: number[] = [];
  for (let i = 1; i < world.islands.length; i++) {
    if (world.islands[i]!.kontorId === null) continue;
    const g = farGood(world, i);
    if (g !== null && GOODS[g].order!.tier <= max) out.push(i);
  }
  return out;
}

/** Fernangebot für eine wählbare Fremdinsel: Vorliebe-Gut, Fernmenge und Prämie nach Formel. */
function farOfferFor(world: World, island: number): FarOffer {
  const good = farGood(world, island)!;
  const amount = GOODS[good].order!.far!;
  return { island, good, amount, reward: amount * orderUnitReward(good) };
}

/** Fernangebot der Periode `k` nach R2/R3: Rotation ohne Zufall; nicht bei Vertrag oder Sperre. */
function offerFarOrder(world: World, k: number): void {
  if (world.contract !== null || functionLock(world, 'orders') !== null) return;
  const e = farEligible(world);
  if (e.length === 0) return;
  world.farOffer = farOfferFor(world, e[k % e.length]!);
}

/**
 * Zweites Fernangebot zur Wahl (I-114): die nächste wählbare Insel der Rotation, `e[(period + 1) % n]`.
 * Reine Lesefunktion ohne RNG; `null` ohne Erstangebot, Auftrag, bei Vertrag oder Sperre, bei weniger als zwei wählbaren Inseln
 * oder wenn die Rotation wieder auf die Insel des Erstangebots fällt.
 */
export function farAlternative(world: World): FarOffer | null {
  if (world.farOffer === null || world.order === null || world.contract !== null) return null;
  if (functionLock(world, 'orders') !== null) return null;
  const e = farEligible(world);
  if (e.length < 2) return null;
  const island = e[(world.order.period + 1) % e.length]!;
  return island === world.farOffer.island ? null : farOfferFor(world, island);
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

/** Vertrag am Periodenbeginn abrechnen (R6/R7): liefern, verzeihen (Kulanz, R-T3) oder brechen, zählt Lieferungen (I-091 R-T1). Liest nur Lager und Geld. */
function settleContract(world: World, c: Contract): ContractEvent {
  const reason = breakReason(world, c);
  if (reason === null) {
    const pay = c.amount * c.price;
    islandAt(world, c.island)!.stock[c.good] -= c.amount;
    world.money += pay;
    const before = c.deliveries;
    c.deliveries = Math.min(before + 1, CONTRACT_LOYAL_AFTER);
    return {
      kind: 'delivered',
      good: c.good,
      amount: c.amount,
      pay,
      island: c.island,
      loyal: c.deliveries >= CONTRACT_LOYAL_AFTER,
      becameLoyal: before < CONTRACT_LOYAL_AFTER && c.deliveries >= CONTRACT_LOYAL_AFTER,
    };
  }
  if ((reason === 'stock' || reason === 'kontor') && c.deliveries >= CONTRACT_LOYAL_AFTER) {
    c.deliveries = 0;
    return { kind: 'excused', good: c.good, reason, island: c.island };
  }
  const penalty = contractPenalty(c);
  world.money -= penalty;
  world.contract = null;
  return { kind: 'broken', good: c.good, reason, penalty, island: c.island };
}

/**
 * Lässt einen abgelaufenen Auftrag samt Fernangebot verfallen; am Periodenbeginn verfällt das Angebot, ein
 * Vertrag wird abgerechnet (Lieferung oder Kulanz: weder Zufalls- noch Fernangebot); sonst werden Zufallsauftrag und
 * Fernangebot angeboten, ausser eine Fernsperre (`farSkip`) gilt für diese Periode (sie wird verbraucht).
 */
export function tickOrders(world: World): ContractEvent | null {
  const t = world.tick;
  if (world.order !== null && t > world.order.due) {
    world.order = null;
    world.farOffer = null;
  }
  if (t < ORDER_FIRST_TICK || (t - ORDER_FIRST_TICK) % ORDER_PERIOD !== 0) return null;
  const k = (t - ORDER_FIRST_TICK) / ORDER_PERIOD;
  world.contractOffer = null;
  const skip = world.farSkip === k;
  if (world.farSkip !== null) world.farSkip = null;
  const ev = world.contract === null ? null : settleContract(world, world.contract);
  if (ev?.kind === 'delivered' || ev?.kind === 'excused') return ev;
  if (world.order === null && !skip) {
    offerRandomOrder(world, k);
    offerFarOrder(world, k);
  }
  return ev;
}

/**
 * Nimmt das Fernangebot an (R5): ersetzt den Zufallsauftrag der Periode durch den Fernauftrag mit langer Frist und
 * sperrt die Folgeperiode. `pick` 1 wählt die Zweitkarte (`farAlternative`), 0 das Erstangebot.
 * Prüfreihenfolge Sperre, Angebot, Vertrag, Zweitangebot, Kontor, Auftrag (Guard, Plan T4); kostet nichts.
 */
export function acceptFarOrder(world: World, pick: 0 | 1 = 0): Result {
  const lock = functionLock(world, 'orders');
  if (lock !== null) return fail(lock);
  if (world.farOffer === null) return fail('Kein Fernangebot');
  if (world.contract !== null) return fail('Vertrag läuft');
  const offer = pick === 1 ? farAlternative(world) : world.farOffer;
  if (offer === null) return fail('Kein zweites Angebot');
  const noKontor = noKontorTrade(world, offer.island);
  if (noKontor !== null) return fail(noKontor);
  const o = world.order;
  if (o === null) return fail('Kein Auftrag');
  world.order = {
    period: o.period,
    good: offer.good,
    amount: offer.amount,
    reward: offer.reward,
    due: ORDER_FIRST_TICK + o.period * ORDER_PERIOD + FAR_ORDER_DURATION,
    island: offer.island,
  };
  world.farOffer = null;
  world.farSkip = o.period + 1;
  return ok;
}

/** Liefert den aktiven Auftrag aus dem Lager der Insel ab (auch bei negativem Geld, es ist eine Einnahme); keine Teillieferung.
 * Ein Fernauftrag (R6) wird nur auf seiner Insel geliefert; jede Lieferung räumt das Fernangebot. */
export function deliverOrder(world: World, island: number = HOME): Result {
  const lock = functionLock(world, 'orders');
  if (lock !== null) return fail(lock);
  const o = world.order;
  if (o === null) return fail('Kein Auftrag');
  if (o.island !== undefined && island !== o.island)
    return fail(`Nur auf ${islandName(world, o.island)}`);
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
  world.farOffer = null;
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
    deliveries: 0,
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

/** Tick des nächsten Auftragsangebots; überspringt die nach einem Fernauftrag gesperrte Periode (R11). */
export function nextOrderTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  const k = Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (k === world.farSkip ? k + 1 : k);
}

/** Stückpreis eines Liefervertrags (I-047). */
export function contractUnitPrice(good: GoodId): number {
  return Math.floor(GOODS[good].buy * CONTRACT_PREMIUM);
}

/** Strafe bei Vertragsbruch, aus den beim Annehmen festgeschriebenen Werten. */
export function contractPenalty(c: Contract): number {
  return Math.ceil((c.amount * c.price * CONTRACT_PENALTY_PCT) / 100);
}

/** Vorschau des nächsten Zufallsauftrags (nur Gut); reine Lesefunktion, kein RNG-Vorziehen (ADR-010). */
export function previewOrder(world: World): { tick: number; good: GoodId } | null {
  if (world.contract !== null || world.contractOffer !== null) return null;
  if (functionLock(world, 'orders') !== null) return null;
  const tick = nextOrderTick(world);
  const k = (tick - ORDER_FIRST_TICK) / ORDER_PERIOD;
  return { tick, good: orderForPeriod(world.seed, k, maxHouseTier(world)).good };
}

/** Nächster Periodenbeginn strikt nach `tick` (ohne `farSkip`: der Vertrag wird jede Periode abgerechnet). */
export function nextSettleTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1);
}

export interface ContractWarning {
  good: GoodId;
  island: number;
  amount: number;
  stock: number;
  missing: number;
  reason: 'stock' | 'kontor';
  restTicks: number;
  outcome: 'excuse' | 'break';
  penalty: number; // penalty 0 bei 'excuse'
}

/** Vorwarnung (I-122): reine Lesefunktion, kein RNG, schreibt nie. `null` ausserhalb des Fensters oder wenn der Spieler nichts tun kann. */
export function contractWarning(world: World): ContractWarning | null {
  const c = world.contract;
  if (c === null) return null;
  const restTicks = nextSettleTick(world) - world.tick;
  if (restTicks > CONTRACT_WARN_TICKS) return null;
  const reason = breakReason(world, c);
  if (reason !== 'stock' && reason !== 'kontor') return null; // null = liefert, 'lock'/'island' = nicht behebbar
  const stock = world.islands[c.island]!.stock[c.good];
  const excuse = c.deliveries >= CONTRACT_LOYAL_AFTER;
  return {
    good: c.good,
    island: c.island,
    amount: c.amount,
    stock,
    missing: Math.max(0, c.amount - stock),
    reason,
    restTicks,
    outcome: excuse ? 'excuse' : 'break',
    penalty: excuse ? 0 : contractPenalty(c),
  };
}
