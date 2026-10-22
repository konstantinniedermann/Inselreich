import { describe, expect, it } from 'vitest';
import { buildCoverage } from '../../src/sim/coverage';
import { SERVICE_IDS, serviceAvailable } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import { perfBudget } from '../helpers/perfBudget';
import { denseScene, serviceAvailableNaive } from './helpers';

/**
 * Pin = min(6, aufrunden auf 0,5 (1,5 × lokales Mittel)). Ursprung: `npx vitest run tests/sim/perf.test.ts`
 * (Pin temporär 0), Entwicklerrechner (macOS, Darwin 25.6), 2026-10-05: Mittel 1,59 / 1,55 / 1,57 ms je
 * Schritt → 1,5 × 1,59 = 2,39 → 2,5. Vorher (naiv): 18,61 ms. AK-E0-15b: naiv 1606–1659 ms, Index 131–135 ms,
 * Verhältnis ≈ 12,3.
 *
 * AK-E0-15a Regel (TOOL-PUSHSPERRE T04, R845, 2026-10-22): best-of-3, der kleinste Mittelwert aus RUNS Läufen
 * zu je STEPS Schritten zählt (Last wirkt additiv und trifft selten alle Läufe; eine echte Regression hebt alle an).
 * Messung 2026-10-22 (10 Messungen je Lage à 3 × 1000 Schritte, ms/Schritt, min–max über die 10 Messungen;
 * Lage «ruhig» = Last 1 min 2,2–4,4, mehr war auf dem Rechner nicht zu haben; «belastet» = 3 × `yes`, Last 5,1–6,5):
 *   Regel          ruhig        belastet
 *   erster Lauf    2,23–2,35    2,27–2,50   (alte Regel)
 *   Mittel von 3   2,20–2,31    2,25–2,47
 *   Median von 3   2,19–2,30    2,27–2,48
 *   best-of-3      2,14–2,26    2,21–2,44   (gewählt)
 * Über dem Pin 2,5: in keiner Reihe mehr als 0 von 10. Die Maschine liegt heute bei ca. 2,3 ms (Stand 10-05:
 * 1,6 ms), die Reserve zum Pin ist klein. Unter Last 5–6 wirkt sich die Last kaum aus (10 Kerne, `yes` belegt
 * freie Kerne); die Flakes bei Last ≥ 8 sind damit nicht nachgestellt (Testsperre bricht dort ab). Naiver Code
 * (11-fach, ≈ 25 ms) bleibt rot (temporär gezeigt).
 */
const PERF_PIN = 2.5;
const STEPS = 1000;
const ROUNDS = 100;
const RUNS = 3;
const MIN_RATIO = 5;

describe('M12 E0 Last', () => {
  it('AK-E0-15a D1: Mittel je Schritt (best-of-3) innerhalb des Pins', () => {
    let mean = Infinity;
    for (let r = 0; r < RUNS; r++) {
      const w = denseScene();
      const t0 = performance.now();
      for (let i = 0; i < STEPS; i++) step(w);
      mean = Math.min(mean, (performance.now() - t0) / STEPS);
    }
    // CI-Faktor 4 statt 1,5: der Runner liegt laut H-T3 bei ca. 4x lokal (wie terrain.test.ts, H-R9 B4).
    // Lokal gilt der Pin streng (2,5 ms), im CI 10 ms; der naive Code (18,6 ms) bleibt auch dort rot.
    const budget = perfBudget(PERF_PIN, undefined, 4);
    expect(mean, `Mittel (best-of-3) ${mean.toFixed(2)} ms/Schritt`).toBeLessThanOrEqual(budget);
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
