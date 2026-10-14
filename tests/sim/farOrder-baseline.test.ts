// Handel 2 T04: Baseline (R633 T2, AK-H2-24): der Controller-Lauf sieht nie Fernzustand.
import { expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

it('Controller-Lauf: nie Fernangebot, Sperre oder Fernauftrag (Baseline bitgleich)', () => {
  const w = createWorld(3);
  const { layout, t } = startColony(w);
  let steps = 0;
  runColony(w, layout, t, {}, (x) => {
    steps++;
    expect(x.farOffer).toBeNull();
    expect(x.farSkip).toBeNull();
    expect(x.order === null || !('island' in x.order)).toBe(true);
    return false;
  });
  expect(steps).toBeGreaterThan(1000);
}, 60_000);
