import { GOODS } from './defs/goods';
import { LEVELS } from './defs/levels';
import { checkAfford, pay, takeStock } from './economy';
import { fail, ok, type Result, type World } from './types';
import { functionLock } from './unlocks';

/** Ausbau eines Betriebs um eine Stufe (Spec 3.6). Wirft nie; bei fail bleibt die Welt unverändert. */
export function upgradeBuilding(world: World, id: number): Result {
  const b = world.buildings[id];
  if (b === undefined) return fail('Gebäude nicht gefunden');
  const levels = LEVELS[b.defId];
  if (levels === undefined) return fail('Kann nicht ausgebaut werden');
  const level = b.level ?? 1;
  if (level === 3) return fail('Höchste Stufe erreicht');
  const lock = functionLock(world, level === 1 ? 'upgrade2' : 'upgrade3');
  if (lock !== null) return fail(lock);
  if (b.outageUntil !== undefined) return fail('Gebäude brennt');
  const next = levels[level - 1]!; // Stufe 1 → Index 0 (Stufe 2)
  const afford = checkAfford(world, next.cost);
  if (!afford.ok) return afford;
  if (world.stock[next.fee.good] < next.fee.amount)
    return fail(`Zu wenig ${GOODS[next.fee.good].name}`);
  pay(world, next.cost);
  takeStock(world, next.fee.good, next.fee.amount);
  b.level = level === 1 ? 2 : 3; // progress, eff, state bleiben (Spec 3.6)
  return ok;
}
