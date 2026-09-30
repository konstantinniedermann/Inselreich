import { GOODS, STORAGE_CAP } from './defs/goods';
import { addStock, takeStock } from './economy';
import type { GoodId, Result, World } from './types';
import { fail, ok } from './types';

export function buyPrice(good: GoodId, n: number): number {
  return n * GOODS[good].buy;
}

export function sellPrice(good: GoodId, n: number): number {
  return n * GOODS[good].sell;
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
  world.money += sellPrice(good, n);
  return ok;
}
