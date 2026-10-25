import { describe, expect, it } from 'vitest';
import { FEAST_KIND_IDS, type FeastKind } from '../../src/sim/defs/feast';
import {
  FEAST_RUNS,
  FEAST_SEEDS,
  feastScene,
  inRadius,
  runFeast,
  type FeastLage,
  type FeastRun,
  type RunLog,
} from './feastWorlds';

type Runs = Record<FeastRun, RunLog>;

const cache = new Map<string, Runs>();

/** Alle vier Läufe einer Lage und eines Seeds, je einmal gerechnet. */
function runsOf(lage: FeastLage, seed: number): Runs {
  const key = `${lage}/${seed}`;
  let runs = cache.get(key);
  if (runs === undefined) {
    runs = Object.fromEntries(FEAST_RUNS.map((r) => [r, runFeast(lage, seed, r)])) as Runs;
    cache.set(key, runs);
  }
  return runs;
}

/** Nettowert einer Art gegen den Lauf ohne Fest (Festpreis enthalten). */
const net = (lage: FeastLage, seed: number, kind: FeastKind): number => {
  const runs = runsOf(lage, seed);
  return runs[kind].value - runs.none.value;
};

/** Art mit dem höchsten Nettowert (Reihenfolge von `FEAST_KIND_IDS` bei Gleichstand). */
const best = (lage: FeastLage, seed: number): FeastKind =>
  FEAST_KIND_IDS.reduce((a, b) => (net(lage, seed, b) > net(lage, seed, a) ? b : a));

const LAGEN: FeastLage[] = ['A', 'B', 'C', 'C2'];

describe.each(LAGEN)('AK-FE1 Lage %s', (lage) => {
  describe.each(FEAST_SEEDS)('Seed %i', (seed) => {
    it('Vorbedingungen: Fest und Verkauf gelingen, Häuser und Betriebe im Radius, kein Zwischenfall', () => {
      const scene = feastScene(lage, seed);
      expect(inRadius(scene, scene.houses)).toBe(true);
      expect(inRadius(scene, scene.producers)).toBe(true);
      expect(scene.producers.length).toBeGreaterThan(0);
      for (const run of FEAST_RUNS) {
        const log = runsOf(lage, seed)[run];
        expect(log.holdOk, `${run} holdFeast`).toBe(true);
        expect(log.sellOk, `${run} sell`).toBe(true);
        expect(log.incident, `${run} Zwischenfall`).toBe(false);
      }
    });

    if (lage === 'A')
      it('Vorbedingung A: ohne Fest steigen alle (mindestens 5) Häuser im Fenster auf', () => {
        const scene = feastScene(lage, seed);
        expect(scene.houses.length).toBeGreaterThanOrEqual(5);
        expect(runsOf(lage, seed).none.housesRisen).toBe(scene.houses.length);
      });
    if (lage === 'B')
      it('Vorbedingung B: im Ernte-Lauf erreicht kein Fertiggut die Lagergrenze', () => {
        expect(runsOf(lage, seed).harvest.capHit).toEqual([]);
      });
    if (lage === 'C')
      it('Vorbedingung C: im Ernte-Lauf fertigt kein Betrieb eine Einheit', () => {
        expect(runsOf(lage, seed).harvest.workshopUnits).toBe(0);
      });
    if (lage !== 'A')
      it('Vorbedingung: im Lauf ohne Fest fällt kein Hausbedarfsgut auf 0', () => {
        expect(runsOf(lage, seed).none.zeroHit).toEqual([]);
      });

    const expected: Partial<Record<FeastLage, FeastKind>> = {
      A: 'ascension',
      B: 'harvest',
      C: 'market',
    };
    if (expected[lage] !== undefined)
      it(`Rangfolge: beste Art ist ${expected[lage]}`, () => {
        expect(best(lage, seed)).toBe(expected[lage]);
      });
    if (lage === 'C2')
      it('C2-Band: Ernte schlägt Markttag, aber um höchstens 800', () => {
        const gap = net('C2', seed, 'harvest') - net('C2', seed, 'market');
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThanOrEqual(800);
      });
  });
});

describe.each(FEAST_SEEDS)('AK-FE1 Nicht-Dominanz, Seed %i', (seed) => {
  it('jede Art ist in genau einer der Lagen A, B, C beste', () => {
    const winners = new Set((['A', 'B', 'C'] as const).map((l) => best(l, seed)));
    expect(winners.size).toBe(FEAST_KIND_IDS.length);
  });
});
