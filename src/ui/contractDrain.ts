import { ORDER_PERIOD } from '../sim/defs/timing';
import type { GoodId, World } from '../sim/types';
import { GOODS_BALANCE_TICKS } from './time';

/** Lieferrate des Stammkunden je Bilanzfenster (100 Ticks) für Gut und Insel; sonst 0 (I-123). */
export function contractDrain(world: World, good: GoodId, island: number): number {
  const c = world.contract;
  if (c === null || c.good !== good || c.island !== island) return 0;
  return (c.amount * GOODS_BALANCE_TICKS) / ORDER_PERIOD;
}
