// production.ts — rein: Erzeugung eines Guts auf einer Insel, ohne die ganze Bilanz (I-088); nicht im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { producedRate } from '../sim/flow';
import type { GoodId, World } from '../sim/types';

/**
 * Erzeugung von `good` auf `island` je 100 Ticks. Zählregel `producedRate` wie `goodsBalance`
 * (gleiche Insel, kein Haus), aber ohne Versorgung der Häuser.
 */
export function goodProductionPer100(world: World, island: number, good: GoodId): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.island !== island || b.house) continue;
    if (BUILDING_DEFS[b.defId].produces !== good) continue;
    sum += producedRate(world, b);
  }
  return sum;
}
