// M14-E1 QA-B3: Der Bürger-Controller (Seed 3, Seed 963) besiedelt keine Fremdinsel (Spec 6.1, E7).
// Geprüft wird nur dieser Zustand, keine Wirtschaftskennzahl (R558/R560); controller.ts bleibt unverändert.
import { describe, expect, it } from 'vitest';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { startColony } from './controller';
import { newMerchantTrajectory, runMerchants } from './merchantsController';

const FOREIGN_FROM = 2;
const MIN_PLAYED_TICKS = 1000;
const FIRST_C_LANE_ISLAND = 3;

/**
 * Bot-Artefakt (R558/R560): Auf kleinen Heimat-Lagen (Seed 963) findet der Controller irgendwann keinen
 * Erweiterungsplatz mehr und bricht ab. Der Stand bis dahin zählt; jeder andere Fehler schlägt durch.
 */
const NO_SLOT = /^kein freier Erweiterungsplatz/;

function runController(seed: number): World {
  const w = createWorld(seed);
  const { layout } = startColony(w);
  try {
    runMerchants(w, layout, newMerchantTrajectory());
  } catch (e) {
    if (!(e instanceof Error) || !NO_SLOT.test(e.message)) throw e;
  }
  return w;
}

describe('M14-E1 Controller besiedelt Fremdinseln nie (QA-B3)', () => {
  it.each([3, 963])('Seed %i: Felsbucht und Weidenau ohne Kontor, Gebäude und Route', (seed) => {
    const w = runController(seed);
    expect(w.islands.length).toBe(4);
    expect(w.tick, 'der Controller hat gespielt').toBeGreaterThan(MIN_PLAYED_TICKS);
    expect(w.islands[FOREIGN_FROM]!.kontorId).toBeNull();
    expect(w.islands[FIRST_C_LANE_ISLAND]!.kontorId).toBeNull();
    expect(Object.values(w.buildings).filter((b) => b.island >= FOREIGN_FROM)).toEqual([]);
    const uses = (i: number): boolean =>
      w.ships.some((s) => s.route?.a === i || s.route?.b === i || s.to === i);
    expect(uses(FOREIGN_FROM) || uses(FIRST_C_LANE_ISLAND)).toBe(false);
  });
});
