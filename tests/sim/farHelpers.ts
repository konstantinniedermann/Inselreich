// Handel 2: gemeinsame Testhelfer der Fernauftrags-Tests (T04 bis T06).
import { demolish } from '../../src/sim/build';
import type { IslandKind } from '../../src/sim/defs/sea';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { step } from '../../src/sim/tick';
import type { StepReport } from '../../src/sim/tick';
import type { Tier, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { houseNearKontor, setHouse } from './helpers';
import { foundKontor2Literal } from './seaHelpers';

/** Tick des Beginns der Periode `k`. */
export const periodStart = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;

/** Index der ersten Fremdinsel der Art `kind`. */
export function islandOf(w: World, kind: IslandKind): number {
  const i = w.islands.findIndex((x) => x.kind === kind);
  if (i < 1) throw new Error(`islandOf: ${kind} fehlt`);
  return i;
}

/** Seed-Welt, alles freigeschaltet, ein Haus der Stufe `tier`, Fremdkontore auf `kinds`. */
export function farWorld(tier: Tier, kinds: readonly IslandKind[], seed = 3): World {
  const w = createWorld(seed, { unlockAll: true });
  setHouse(houseNearKontor(w), tier, 1);
  for (const k of kinds) foundKontor2Literal(w, islandOf(w, k));
  return w;
}

/** Uhr so stellen, dass der nächste Schritt auf Tick `t` fällt, und ihn ausführen. */
export function stepAt(w: World, t: number): StepReport {
  w.tick = t - 1;
  return step(w);
}

/** Fremdkontor abreissen (`demolish`, Erwartung ok). */
export function dropKontor(w: World, i: number): void {
  const id = w.islands[i]!.kontorId;
  if (id === null) throw new Error(`dropKontor: Insel ${i} ohne Kontor`);
  const r = demolish(w, id);
  if (!r.ok) throw new Error(`dropKontor: ${r.reason}`);
}
