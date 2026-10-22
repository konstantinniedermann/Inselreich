import { describe, it } from 'vitest';
import { growthBrakes } from '../../src/ui/growthBrake';
import { denseScene } from '../sim/helpers';

/** Vorab-Messung (AK-I27): keine Zeit-Assertion, nur Ausgabe. */
describe('growthBrakes Messung', () => {
  it('Median aus 20 Läufen bei 484 Häusern', () => {
    const w = denseScene();
    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      growthBrakes(w, 0);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    console.log(`growthBrakes Median ${times[10]!.toFixed(3)} ms (484 Häuser)`);
  });
});
