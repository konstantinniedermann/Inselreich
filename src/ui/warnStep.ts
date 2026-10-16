import { contractWarning } from '../sim/orders';
import type { World } from '../sim/types';
import { shouldWarnNow, warnPeriod } from './order';

/** Ein Schleifenschritt der Vorwarnung (I-122): meldet je Periode höchstens einmal. Nur nach Sim-Ticks aufrufen. */
export function warnStep(
  prev: number | null,
  world: World,
): { fire: boolean; warnedPeriod: number | null } {
  const period = warnPeriod(world);
  if (shouldWarnNow(prev, contractWarning(world), period))
    return { fire: true, warnedPeriod: period };
  return { fire: false, warnedPeriod: prev };
}
