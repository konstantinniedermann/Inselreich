import { TAX_LEVELS } from './defs/tiers';
import { TAX_SWITCH_LOCK } from './defs/timing';
import { fail, ok } from './types';
import type { Result, TaxLevel, World } from './types';

/** Schaltet die Steuerstufe um; wirkt ab dem nächsten Tick. Kostet nichts, ist also auch bei negativem Geld erlaubt. */
export function setTaxLevel(world: World, level: string): Result {
  if (!Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (level === world.taxLevel) return fail('Stufe bereits aktiv');
  if (world.tick < world.taxLockedUntil) return fail('Sperrzeit');
  world.taxLevel = level as TaxLevel;
  world.taxLockedUntil = world.tick + TAX_SWITCH_LOCK;
  return ok;
}
