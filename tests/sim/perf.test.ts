import { describe, expect, it } from 'vitest';
import { buildCoverage } from '../../src/sim/coverage';
import { SERVICE_IDS, serviceAvailable } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import { perfBudget } from '../helpers/perfBudget';
import { denseScene, serviceAvailableNaive } from './helpers';

/**
 * Pin = min(6, aufrunden auf 0,5 (1,5 × lokales Mittel)). Messung: `npx vitest run tests/sim/perf.test.ts`
 * (Pin temporär 0, Meldung gelesen), Entwicklerrechner (macOS, Darwin 25.6), 2026-10-05: Mittel 1,59 / 1,55 /
 * 1,57 ms je Schritt → 1,5 × 1,59 = 2,39 → 2,5. Vorher (naiv): 18,61 ms. AK-E0-15b: naiv 1606–1659 ms,
 * Index 131–135 ms, Verhältnis ≈ 12,3.
 */
const PERF_PIN = 2.5;
const STEPS = 1000;
const ROUNDS = 100;
const RUNS = 3;
const MIN_RATIO = 5;

describe('M12 E0 Last', () => {
  it('AK-E0-15a D1: Mittel je Schritt innerhalb des Pins', () => {
    const w = denseScene();
    const t0 = performance.now();
    for (let i = 0; i < STEPS; i++) step(w);
    const mean = (performance.now() - t0) / STEPS;
    // CI-Faktor 4 statt 1,5: der Runner liegt laut H-T3 bei ca. 4x lokal (wie terrain.test.ts, H-R9 B4).
    // Lokal gilt der Pin streng (2,5 ms), im CI 10 ms; der naive Code (18,6 ms) bleibt auch dort rot.
    const budget = perfBudget(PERF_PIN, undefined, 4);
    expect(mean, `Mittel ${mean.toFixed(2)} ms/Schritt`).toBeLessThanOrEqual(budget);
  }, 120_000);

  it('AK-E0-15b D1: Abdeckung per buildCoverage mindestens 5 mal schneller als naiv', () => {
    const w = denseScene();
    const houses = Object.values(w.buildings).filter((b) => b.house);
    const best = (run: () => void): number => {
      let m = Infinity;
      for (let r = 0; r < RUNS; r++) {
        const t0 = performance.now();
        run();
        m = Math.min(m, performance.now() - t0);
      }
      return m;
    };
    let sink = 0;
    const naive = best(() => {
      for (let r = 0; r < ROUNDS; r++)
        for (const h of houses)
          for (const s of SERVICE_IDS) sink += serviceAvailableNaive(w, h, s) ? 1 : 0;
    });
    const index = best(() => {
      for (let r = 0; r < ROUNDS; r++) {
        const cov = buildCoverage(w);
        for (const h of houses)
          for (const s of SERVICE_IDS) sink += serviceAvailable(w, h, s, cov) ? 1 : 0;
      }
    });
    expect(sink).toBeGreaterThan(0);
    expect(
      naive / index,
      `naiv ${naive.toFixed(0)} ms, Index ${index.toFixed(0)} ms`,
    ).toBeGreaterThanOrEqual(MIN_RATIO);
  }, 120_000);
});
