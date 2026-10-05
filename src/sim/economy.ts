import { SHIP } from './defs/sea';
import { STORAGE_CAP } from './defs/goods';
import { UPKEEP_INTERVAL } from './defs/timing';
import { upkeepOf } from './levels';
import type { Cost, GoodId, Island, Result, World } from './types';
import { fail, ok } from './types';

export { UPKEEP_INTERVAL } from './defs/timing';

/** Lagert ein und liefert die tatsächlich eingelagerte Menge (Kappung bei STORAGE_CAP). */
export function addStock(isl: Island, good: GoodId, n: number): number {
  const accepted = Math.max(0, Math.min(n, STORAGE_CAP - isl.stock[good]));
  isl.stock[good] += accepted;
  return accepted;
}

/** Entnimmt n; bei zu wenig Bestand false und keine Änderung. */
export function takeStock(isl: Island, good: GoodId, n: number): boolean {
  if (n < 0 || isl.stock[good] < n) return false;
  isl.stock[good] -= n;
  return true;
}

/** Prüft Geld und Lager; `where` (z. B. „in der Heimat“) wird an die Warengründe gehängt. */
export function checkAfford(world: World, isl: Island, cost: Cost, where?: string): Result {
  const at = where === undefined ? '' : ` ${where}`;
  if (world.money < 0) return fail('Kein Geld');
  if (world.money < cost.money) return fail('Zu wenig Geld');
  if (isl.stock.wood < cost.wood) return fail(`Zu wenig Holz${at}`);
  if (isl.stock.tools < cost.tools) return fail(`Zu wenig Werkzeug${at}`);
  if (isl.stock.stone < cost.stone) return fail(`Zu wenig Stein${at}`);
  return ok;
}

/** Zieht die Kosten ohne Prüfung ab; der Aufrufer prüft vorher checkAfford. */
export function pay(world: World, isl: Island, cost: Cost): void {
  world.money -= cost.money;
  isl.stock.wood -= cost.wood;
  isl.stock.tools -= cost.tools;
  isl.stock.stone -= cost.stone;
}

export function refundCost(cost: Cost): Cost {
  return {
    money: Math.floor(cost.money / 2),
    wood: Math.floor(cost.wood / 2),
    tools: Math.floor(cost.tools / 2),
    stone: Math.floor(cost.stone / 2),
  };
}

export function grantRefund(world: World, isl: Island, cost: Cost): void {
  world.money += cost.money;
  addStock(isl, 'wood', cost.wood);
  addStock(isl, 'tools', cost.tools);
  addStock(isl, 'stone', cost.stone);
}

/** Unterhalt als Nominalwert je 100 Ticks. */
export function totalUpkeep(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) sum += upkeepOf(b);
  return sum + world.ships.length * SHIP.upkeep;
}

/** Bucht den Unterhalt je Schritt mit ganzzahligem Übertrag; `stats.upkeep` bleibt der Nominalwert. */
export function tickEconomy(world: World): void {
  world.stats.upkeep = totalUpkeep(world);
  world.upkeepCarry += world.stats.upkeep;
  const n = Math.floor(world.upkeepCarry / UPKEEP_INTERVAL);
  world.money -= n;
  world.upkeepCarry -= n * UPKEEP_INTERVAL;
}
