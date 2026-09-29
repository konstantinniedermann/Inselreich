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
  // Check if n is a valid amount (positive integer)
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Check if world has negative money
  if (world.money < 0) {
    return fail('Kein Geld');
  }

  // Check if storage would be exceeded
  if (world.stock[good] + n > STORAGE_CAP) {
    return fail('Lager voll');
  }

  // Check if there's enough money
  const price = buyPrice(good, n);
  if (world.money < price) {
    return fail('Zu wenig Geld');
  }

  // All checks passed, execute transaction
  world.money -= price;
  addStock(world, good, n);
  return ok;
}

export function sell(world: World, good: GoodId, n: number): Result {
  // Check if n is a valid amount (positive integer)
  if (!Number.isInteger(n) || n < 1) {
    return fail('Ungültige Menge');
  }

  // Check if there's enough stock
  if (world.stock[good] < n) {
    return fail('Nicht genug Ware');
  }

  // All checks passed, execute transaction
  takeStock(world, good, n);
  world.money += sellPrice(good, n);
  return ok;
}
