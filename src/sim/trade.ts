import { BOOM_PCT } from './defs/crises';
import { GOODS, GOOD_IDS, SELL_DROP, SELL_FLOOR, STORAGE_CAP } from './defs/goods';
import { SELL_RECOVERY_INTERVAL } from './defs/timing';
import { addStock, takeStock } from './economy';
import { goodLock } from './unlocks';
import type { GoodId, Result, World } from './types';
import { fail, ok } from './types';
import { islandName } from './islands';
import { islandAt } from './placement';
import { HOME } from './world';

export function buyPrice(good: GoodId, n: number): number {
  return n * GOODS[good].buy;
}

/** Erlös für `n` Einheiten: Sättigung je Einheit, im Boom auf dieses Gut × BOOM_PCT %. Ohne Boom bitgleich zu M5. Rein. */
export function sellPrice(world: World, good: GoodId, n: number): number {
  const c = world.crisis;
  const m = c !== null && c.kind === 'boom' && c.good === good ? BOOM_PCT : 100;
  let acc = 0;
  let pct = world.sellPct[good];
  for (let i = 0; i < n; i++) {
    acc += GOODS[good].sell * pct * m;
    pct = Math.max(SELL_FLOOR, pct - SELL_DROP);
  }
  return Math.floor(acc / 10000);
}

/** Grund „Kein Kontor auf <Name>“ oder `null`: Handel läuft nur über ein Kontor der Insel. */
export function noKontorTrade(world: World, island: number): string | null {
  const isl = islandAt(world, island);
  return isl !== null && isl.kontorId === null
    ? `Kein Kontor auf ${islandName(world, island)}`
    : null;
}

export function buy(world: World, good: GoodId, n: number, island: number = HOME): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
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
  if (isl.stock[good] + n > STORAGE_CAP) {
    return fail('Lager voll');
  }

  // Genug Geld?
  const price = buyPrice(good, n);
  if (world.money < price) {
    return fail('Zu wenig Geld');
  }

  world.money -= price;
  // Rückgabe bewusst ignoriert: nach der Lagergrenzen-Prüfung wird immer die volle Menge eingelagert
  addStock(isl, good, n);
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
  world.money += sellPrice(world, good, n);
  world.sellPct[good] = Math.max(SELL_FLOOR, world.sellPct[good] - n * SELL_DROP);
  return ok;
}

/** Markt-Erholung: alle SELL_RECOVERY_INTERVAL Ticks +1 Prozentpunkt je Gut, höchstens 100. Verändert kein Geld. */
export function tickMarket(world: World): void {
  if (world.tick === 0 || world.tick % SELL_RECOVERY_INTERVAL !== 0) return;
  for (const g of GOOD_IDS) world.sellPct[g] = Math.min(100, world.sellPct[g] + 1);
}
