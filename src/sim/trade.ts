import { BOOM_PCT } from './defs/crises';
import { FEAST_KINDS } from './defs/feast';
import { ISLANDS, PREFER_PCT } from './defs/sea';
import { BUY_CAP, BUY_RISE, GOODS, GOOD_IDS, SELL_DROP, SELL_FLOOR } from './defs/goods';
import { BUY_RECOVERY_INTERVAL, SELL_RECOVERY_INTERVAL } from './defs/timing';
import { addStock, takeStock } from './economy';
import { marketActive } from './feastEffect';
import { activeEdictDef } from './edicts';
import { goodLock } from './unlocks';
import type { GoodId, MonumentGood, Result, World } from './types';
import { fail, ok } from './types';
import { noKontorTrade } from './islands';
import { islandAt } from './placement';
import { trialBuyBlock } from './trial';
import { storageCap } from './petitionEffect';
import { HOME } from './world';

export { noKontorTrade } from './islands';

/** Ergebnis des Preiskerns: Gesamtpreis, gerundeter Mittelanteil und Anteil nach dem Kauf. */
export interface BuyQuote {
  price: number;
  meanPct: number;
  endPct: number;
}

/**
 * Reiner Preiskern (I-048 Z2): Der Anteil gilt vor jeder Einheit, danach steigt er um `rise` bis `cap`;
 * einmal aufrunden über die ganze Menge, mit Edikt-Faktor `edictPct`. Alles ganzzahlig, kein Welt-Zugriff.
 */
export function buyQuote(
  list: number,
  startPct: number,
  n: number,
  rise: number,
  cap: number,
  edictPct: number,
): BuyQuote {
  if (n < 1) return { price: 0, meanPct: startPct, endPct: startPct };
  let acc = 0;
  let sum = 0;
  let p = startPct;
  for (let i = 0; i < n; i++) {
    acc += list * p;
    sum += p;
    p = Math.min(cap, p + rise);
  }
  return {
    price: Math.floor((acc * edictPct + 9999) / 10000),
    meanPct: Math.round(sum / n),
    endPct: Math.min(cap, startPct + n * rise),
  };
}

/** Edikt-Faktor auf Kaufpreise in % (100 ohne wirkendes Edikt Handel); einzige Lesestelle. */
export function edictBuyPct(world: World): number {
  return activeEdictDef(world)?.buyFactorPct ?? 100;
}

/** Angebot für n Stück eines Guts aus dem Weltzustand (Kaufanteil, Edikt). Rein. */
export function buyQuoteFor(world: World, good: GoodId, n: number): BuyQuote {
  return buyQuote(GOODS[good].buy, world.buyPct[good], n, BUY_RISE, BUY_CAP, edictBuyPct(world));
}

/** Kaufpreis für n Stück zum gültigen Kaufanteil, mit Edikt über die Gesamtmenge aufgerundet. Rein. */
export function buyPrice(world: World, good: GoodId, n: number): number {
  return buyQuoteFor(world, good, n).price;
}

/** Ob die Fremdinsel `island` für `good` die Vorliebe-Zulage zahlt; unbekannte Insel und Heimat: nein. */
export function prefersGood(world: World, island: number, good: GoodId): boolean {
  const kind = world.islands[island]?.kind;
  if (kind === undefined || kind === 'home') return false;
  return ISLANDS.some((d) => d.kind === kind && d.prefers.includes(good));
}

/**
 * Erlös für `n` Einheiten auf `island`: Sättigung je Einheit (global), Faktor in %. Boom, Vorliebe und Markttag
 * stapeln nicht, es gilt der höchste. Ohne Boom und Vorliebe bitgleich zu M5. Rein.
 */
export function sellPrice(world: World, good: GoodId, n: number, island: number = HOME): number {
  const c = world.crisis;
  const boom = c !== null && c.kind === 'boom' && c.good === good ? BOOM_PCT : 100;
  const prefer = prefersGood(world, island, good) ? PREFER_PCT : 100;
  const market = marketActive(world, island) ? FEAST_KINDS.market.sellPct : 100;
  const m = Math.max(boom, prefer, market);
  let acc = 0;
  let pct = world.sellPct[good];
  for (let i = 0; i < n; i++) {
    acc += GOODS[good].sell * pct * m;
    pct = Math.max(SELL_FLOOR, pct - SELL_DROP);
  }
  return Math.floor(acc / 10000);
}

export function buy(world: World, good: GoodId, n: number, island: number = HOME): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const trial = trialBuyBlock(world);
  if (trial !== null) return fail(trial);
  const noKontor = noKontorTrade(world, island);
  if (noKontor !== null) return fail(noKontor);
  const lock = goodLock(world, good);
  if (lock !== null) return fail(lock);

  // Menge muss eine positive ganze Zahl sein
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Bei negativem Kontostand ist kein Kauf möglich
  if (world.money < 0) {
    return fail('Kein Geld');
  }

  // Lagergrenze prüfen
  const cap = storageCap(world, island, good);
  if (isl.stock[good] + n > cap) {
    return fail('Lager voll');
  }

  // Genug Geld?
  const q = buyQuoteFor(world, good, n);
  if (world.money < q.price) {
    return fail('Zu wenig Geld');
  }

  world.money -= q.price;
  world.buyPct[good] = q.endPct;
  // Rückgabe bewusst ignoriert: nach der Lagergrenzen-Prüfung wird immer die volle Menge eingelagert
  addStock(isl, good, n, cap);
  return ok;
}

export function sell(world: World, good: GoodId, n: number, island: number = HOME): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const noKontor = noKontorTrade(world, island);
  if (noKontor !== null) return fail(noKontor);
  // Menge muss eine positive ganze Zahl sein
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Genug Ware im Lager?
  if (isl.stock[good] < n) {
    return fail('Nicht genug Ware');
  }

  // Rückgabe bewusst ignoriert: nach der Bestandsprüfung ist die Entnahme immer erfolgreich
  takeStock(isl, good, n);
  // Preis vor dem Absenken des Verkaufsanteils berechnen
  world.money += sellPrice(world, good, n, island);
  world.sellPct[good] = Math.max(SELL_FLOOR, world.sellPct[good] - n * SELL_DROP);
  return ok;
}

/**
 * Markt-Erholung mit getrennten Intervallen: Verkaufsanteil +1 alle SELL_RECOVERY_INTERVAL Ticks (höchstens 100),
 * Kaufanteil −1 alle BUY_RECOVERY_INTERVAL Ticks (mindestens 100). Bei Tick 0 keine. Verändert kein Geld.
 */
export function tickMarket(world: World): void {
  if (world.tick === 0) return;
  if (world.tick % SELL_RECOVERY_INTERVAL === 0)
    for (const g of GOOD_IDS) world.sellPct[g] = Math.min(100, world.sellPct[g] + 1);
  if (world.tick % BUY_RECOVERY_INTERVAL === 0)
    for (const g of GOOD_IDS) world.buyPct[g] = Math.max(100, world.buyPct[g] - 1);
}

/** R7.1: `null` = Zukauf für das Denkmal möglich; sonst der Grund (Auflage, Kontor der Heimat, Gut freigeschaltet). */
export function monumentBuyBlock(world: World, good: MonumentGood): string | null {
  return trialBuyBlock(world) ?? noKontorTrade(world, HOME) ?? goodLock(world, good);
}

/**
 * R7.3: einziger Zukaufweg des Denkmals. Zahlt `buyPrice(w, g, 1)` und liefert 1; sonst 0 ohne Änderung.
 * Kein Lagerzugang, `sellPct` unberührt. Einhängepunkt I-048 (Kaufanteil zahlen, nicht heben, R489).
 */
export function buyMonumentUnit(world: World, good: MonumentGood): 0 | 1 {
  if (monumentBuyBlock(world, good) !== null) return 0;
  const price = buyPrice(world, good, 1);
  if (world.money < price) return 0;
  world.money -= price;
  return 1;
}
