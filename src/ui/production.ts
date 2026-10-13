// production.ts — rein: Erzeugung eines Guts auf einer Insel, ohne die ganze Bilanz (I-088); nicht im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { cycleOf } from '../sim/levels';
import type { GoodId, World } from '../sim/types';

/**
 * Erzeugung von `good` auf `island` je 100 Ticks. Zählregel wie der Produktionsanteil von `goodsBalance`
 * (gleiche Insel, kein Haus, angebunden, nicht stillgelegt, Zyklus über `cycleOf`), aber ohne Versorgung der Häuser.
 */
export function goodProductionPer100(world: World, island: number, good: GoodId): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.island !== island || b.house) continue;
    if (!b.connected || b.paused === true) continue;
    if (BUILDING_DEFS[b.defId].produces !== good) continue;
    const cycle = cycleOf(world, b);
    if (cycle === undefined) continue;
    sum += 100 / cycle;
  }
  return sum;
}
