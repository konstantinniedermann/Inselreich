import { GOODS, GOOD_IDS, SELL_DROP, SELL_FLOOR, STORAGE_CAP } from './defs/goods';
import { SELL_RECOVERY_INTERVAL } from './defs/timing';
import { addStock, takeStock } from './economy';
import type { GoodId, Result, World } from './types';
import { fail, ok } from './types';

export function buyPrice(good: GoodId, n: number): number {
  return n * GOODS[good].buy;
}

/** Erlös für `n` Einheiten: jede Einheit zum aktuellen Verkaufsanteil, der je Einheit um SELL_DROP fällt. Rein. */
export function sellPrice(world: World, good: GoodId, n: number): number {
  let acc = 0;
  let pct = world.sellPct[good];
  for (let i = 0; i < n; i++) {
    acc += GOODS[good].sell * pct;
    pct = Math.max(SELL_FLOOR, pct - SELL_DROP);
  }
  return Math.floor(acc / 100);
}

export function buy(world: World, good: GoodId, n: number): Result {
  // Menge muss eine positive ganze Zahl sein
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Bei negativem Kontostand ist kein Kauf möglich
  if (world.money < 0) {
    return fail('Kein Geld');
  }

  // Lagergrenze prüfen
  if (world.stock[good] + n > STORAGE_CAP) {
    return fail('Lager voll');
  }

  // Genug Geld?
  const price = buyPrice(good, n);
  if (world.money < price) {
    return fail('Zu wenig Geld');
  }

  world.money -= price;
  // Rückgabe bewusst ignoriert: nach der Lagergrenzen-Prüfung wird immer die volle Menge eingelagert
  addStock(world, good, n);
  return ok;
}

export function sell(world: World, good: GoodId, n: number): Result {
  // Menge muss eine positive ganze Zahl sein
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Genug Ware im Lager?
  if (world.stock[good] < n) {
    return fail('Nicht genug Ware');
  }

  // Rückgabe bewusst ignoriert: nach der Bestandsprüfung ist die Entnahme immer erfolgreich
  takeStock(world, good, n);
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
