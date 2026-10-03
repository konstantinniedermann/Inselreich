import { describe, expect, it } from 'vitest';
import { beginCrisis, nextCrisisTick, rollCrisis, type CrisisRoll } from '../../src/sim/crises';
import { CRISIS_LEVELS, CRISIS_WEIGHTS } from '../../src/sim/defs/crises';
import {
  BOOM_DURATION,
  FIRE_OUTAGE,
  STORM_DURATION,
  STORM_WARNING,
} from '../../src/sim/defs/timing';
import { createRng } from '../../src/sim/rng';
import { step } from '../../src/sim/tick';
import type { CrisisKind, CrisisLevel } from '../../src/sim/types';
import { UPGRADE_WAIT } from '../../src/sim/population';
import { TIERS } from '../../src/sim/defs/tiers';
import { createWorld } from '../../src/sim/world';
import { houseNearKontor, placeService, prepareEast } from './helpers';

const SEQ_SEED3 = [
  'storm',
  'fire',
  'storm',
  'boom',
  'fire',
  'fire',
  'fire',
  'storm',
  'boom',
  'storm',
  'fire',
  'boom',
];

/** Art aus der eigenen Ableitung des Tests (Salt und erster Zug festgenagelt). */
function ownKind(seed: number, k: number): { kind: CrisisKind; r: () => number } {
  const r = createRng((seed ^ Math.imul(k + 1, 0x85ebca6b)) >>> 0);
  const u = Math.floor(r() * 100);
  return { kind: u < 50 ? 'fire' : u < 75 ? 'storm' : 'boom', r };
}

describe('M6 Krisenkern', () => {
  it('AK-S1-06 nextCrisisTick', () => {
    const at = (level: CrisisLevel, tick: number): number | null => {
      const w = createWorld(3, { crisisLevel: level, unlockAll: true });
      w.tick = tick;
      return nextCrisisTick(w);
    };
    expect(at('normal', 0)).toBe(2400);
    expect(at('normal', 2399)).toBe(2400);
    expect(at('normal', 2400)).toBe(3000);
    expect(at('mild', 2400)).toBe(3600);
    expect(at('off', 2400)).toBeNull();
  });

  it('AK-S1-07 rollCrisis ist rein, folgt Salt und Zug-Reihenfolge, feste Sollwerte für Seed 3', () => {
    expect(createWorld(3, { unlockAll: true }).seed).toBe(3);
    const rect = { x0: 10, y0: 20, x1: 13, y1: 21 };
    const counts: Record<CrisisKind, number> = { fire: 0, storm: 0, boom: 0 };
    for (let k = 0; k < 200; k++) {
      for (const tier of [1, 3] as const)
        expect(rollCrisis(3, k, tier, rect)).toEqual(rollCrisis(3, k, tier, rect));
      const kind = rollCrisis(3, k, 1, rect).kind;
      expect(kind, `k=${k}`).toBe(ownKind(3, k).kind);
      counts[kind] += 1;
    }
    expect(counts).toEqual({ fire: 94, storm: 47, boom: 59 });
    expect(Array.from({ length: 12 }, (_, k) => rollCrisis(3, k, 1, null).kind)).toEqual(SEQ_SEED3);
  });

  it('AK-S1-08 Zug-Reihenfolge: Kachel aus r2/r3, Boom-Gut aus r2, Pool nach Höchststufe', () => {
    const rect = { x0: 10, y0: 20, x1: 13, y1: 21 };
    const fire = ownKind(3, 1); // Seed 3, k = 1: Brand
    expect(fire.kind).toBe('fire');
    const x = 10 + Math.floor(fire.r() * 4);
    const y = 20 + Math.floor(fire.r() * 2);
    expect(rollCrisis(3, 1, 1, rect)).toEqual({ kind: 'fire', tile: { x, y } });
    expect(rollCrisis(3, 1, 1, null)).toEqual({ kind: 'fire' });
    const pools = {
      1: ['wood', 'food'],
      3: ['wood', 'stone', 'food', 'wool', 'cloth', 'cane', 'rum'],
    } as const;
    for (const tier of [1, 3] as const) {
      const boom = ownKind(3, 3); // Seed 3, k = 3: Boom
      expect(boom.kind).toBe('boom');
      const good = pools[tier][Math.floor(boom.r() * pools[tier].length)];
      expect(rollCrisis(3, 3, tier, rect)).toEqual({ kind: 'boom', good });
    }
  });

  it.each([
    ['normal', 600, 12],
    ['mild', 1200, 6],
    ['off', 0, 0],
  ] as const)('AK-S1-09 Stufe %s: Krisenzahl bis Tick 9000', (level, P, n) => {
    const w = createWorld(3, { crisisLevel: level, unlockAll: true });
    const seen: { period: number; kind: CrisisKind; tick: number }[] = [];
    while (w.tick < 9000) {
      step(w);
      const c = w.crisis;
      if (c && !seen.some((s) => s.period === c.period))
        seen.push({ period: c.period, kind: c.kind, tick: w.tick });
    }
    expect(seen.map((s) => s.period)).toEqual(Array.from({ length: n }, (_, k) => k));
    for (const s of seen) expect(s.tick).toBe(2400 + P * s.period);
    if (level === 'normal')
      expect(seen.map((s) => s.kind[0]).join(' ')).toBe('s f s b f f f s b s f b');
  });

  it.each([
    ['fire', { kind: 'fire' }, 2400, 2600],
    ['storm', { kind: 'storm' }, 2601, 2900],
    ['boom', { kind: 'boom', good: 'wood' }, 2400, 2700],
  ] as [string, CrisisRoll, number, number][])(
    'AK-S1-10 Zeitfenster %s',
    (_n, roll, from, until) => {
      const w = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
      w.tick = 2400;
      beginCrisis(w, 0, roll);
      expect(w.crisis).toMatchObject({ period: 0, kind: roll.kind, from, until });
      while (w.tick < until - 1) {
        step(w);
        expect(w.crisis, `tick ${w.tick}`).not.toBeNull();
      }
      step(w);
      expect(w.tick).toBe(until);
      expect(w.crisis).toBeNull();
    },
  );

  it('AK-S1-10 Invariante: längste Krise kürzer als kürzeste Periode, Gewichte ergeben 100', () => {
    const periods = Object.values(CRISIS_LEVELS)
      .map((l) => l.period)
      .filter((p): p is number => p !== null);
    const shortest = Math.min(...periods);
    expect(STORM_WARNING + STORM_DURATION).toBeLessThan(shortest);
    expect(FIRE_OUTAGE).toBeLessThan(shortest);
    expect(BOOM_DURATION).toBeLessThan(shortest);
    expect(CRISIS_WEIGHTS.fire + CRISIS_WEIGHTS.storm + CRISIS_WEIGHTS.boom).toBe(100);
  });

  it('RF-2 Boom-Pool nutzt die Höchststufe desselben Ticks', () => {
    const w = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
    // Siedlerhaus direkt einfügen (Stufe 2 → Pool mit Stein, Wolle, Stoff)
    const id = w.nextBuildingId++;
    w.buildings[id] = {
      id,
      defId: 'house',
      x: 0,
      y: 0,
      connected: false,
      progress: 0,
      state: 'ok',
      house: {
        tier: 2,
        inhabitants: 1,
        demand: {},
        satisfied: {},
        services: {},
        satisfiedSince: 0,
        supplied: false,
      },
    };
    w.tick = 4199; // k = 3 ist bei Seed 3 ein Boom
    step(w);
    expect(w.crisis).toMatchObject({
      kind: 'boom',
      period: 3,
      good: rollCrisis(3, 3, 2, null).good,
    });
  });

  it('RF-2 Aufstieg im Tick des Periodenstarts bestimmt den Boom-Pool', () => {
    const w = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
    prepareEast(w, w.buildings[w.kontorId]!);
    const house = houseNearKontor(w);
    placeService(w, 'chapel', house.x + 9, house.y);
    w.tick = 4199; // k = 3 ist bei Seed 3 ein Boom
    house.house!.inhabitants = TIERS[1].maxInhabitants;
    house.house!.satisfiedSince = w.tick - UPGRADE_WAIT;
    w.stock.cloth = 1;
    expect(house.house!.tier).toBe(1);
    step(w);
    expect(w.tick).toBe(4200);
    expect(house.house!.tier).toBe(2);
    const good = w.crisis?.good;
    expect(good).toBe(rollCrisis(3, 3, 2, null).good);
    expect(good).not.toBe(rollCrisis(3, 3, 1, null).good);
  });
});
