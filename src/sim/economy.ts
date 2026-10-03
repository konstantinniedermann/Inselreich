import { STORAGE_CAP } from './defs/goods';
import { UPKEEP_INTERVAL } from './defs/timing';
import { upkeepOf } from './levels';
import type { Cost, GoodId, Result, World } from './types';
import { fail, ok } from './types';

export { UPKEEP_INTERVAL } from './defs/timing';

/** Lagert ein und liefert die tatsächlich eingelagerte Menge (Kappung bei STORAGE_CAP). */
export function addStock(world: World, good: GoodId, n: number): number {
  const accepted = Math.max(0, Math.min(n, STORAGE_CAP - world.stock[good]));
  world.stock[good] += accepted;
  return accepted;
}

/** Entnimmt n; bei zu wenig Bestand false und keine Änderung. */
export function takeStock(world: World, good: GoodId, n: number): boolean {
  if (n < 0 || world.stock[good] < n) return false;
  world.stock[good] -= n;
  return true;
}

export function checkAfford(world: World, cost: Cost): Result {
  if (world.money < 0) return fail('Kein Geld');
  if (world.money < cost.money) return fail('Zu wenig Geld');
  if (world.stock.wood < cost.wood) return fail('Zu wenig Holz');
  if (world.stock.tools < cost.tools) return fail('Zu wenig Werkzeug');
  if (world.stock.stone < cost.stone) return fail('Zu wenig Stein');
  return ok;
}

/** Zieht die Kosten ohne Prüfung ab; der Aufrufer prüft vorher checkAfford. */
export function pay(world: World, cost: Cost): void {
  world.money -= cost.money;
  world.stock.wood -= cost.wood;
  world.stock.tools -= cost.tools;
  world.stock.stone -= cost.stone;
}

export function refundCost(cost: Cost): Cost {
  return {
    money: Math.floor(cost.money / 2),
    wood: Math.floor(cost.wood / 2),
    tools: Math.floor(cost.tools / 2),
    stone: Math.floor(cost.stone / 2),
  };
}

export function grantRefund(world: World, cost: Cost): void {
  world.money += cost.money;
  addStock(world, 'wood', cost.wood);
  addStock(world, 'tools', cost.tools);
  addStock(world, 'stone', cost.stone);
}

/** Unterhalt als Nominalwert je 100 Ticks. */
export function totalUpkeep(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) sum += upkeepOf(b);
  return sum;
}

/** Bucht den Unterhalt je Schritt mit ganzzahligem Übertrag; `stats.upkeep` bleibt der Nominalwert. */
export function tickEconomy(world: World): void {
  world.stats.upkeep = totalUpkeep(world);
  world.upkeepCarry += world.stats.upkeep;
  const n = Math.floor(world.upkeepCarry / UPKEEP_INTERVAL);
  world.money -= n;
  world.upkeepCarry -= n * UPKEEP_INTERVAL;
}
