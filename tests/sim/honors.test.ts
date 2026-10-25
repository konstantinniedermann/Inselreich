import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HONORS,
  HONOR_IDS,
  HONOR_SWIFT_CITIZEN_TICK,
  HONOR_SWIFT_MERCHANT_TICK,
  type HonorId,
} from '../../src/sim/defs/honors';
import { TRIAL_IDS } from '../../src/sim/defs/trials';
import { honorMarks, newHonors, type HonorRun } from '../../src/sim/honors';
import type { CrisisLevel, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

const S = 3;
const RUN: HonorRun = { seed: S, unlockMode: 'stepwise' };

function world(level: CrisisLevel = 'normal'): World {
  const w = createWorld(S, { crisisLevel: level });
  w.tick = 100;
  return w;
}

/** Wendet `change` an und liefert die neuen Stücke gegenüber dem Stand davor. */
function after(w: World, change: (w: World) => void, run: HonorRun | null = RUN): HonorId[] {
  const prev = honorMarks(w);
  change(w);
  return newHonors(prev, w, run);
}

const FIXED: HonorId[] = [
  'citizenTown',
  'swiftFound',
  'swiftTrade',
  'stormTrade',
  'spiceTown',
  'realm',
  'monument',
  'stormTrial',
];

describe('AK-EB-01 Defs', () => {
  it('HONOR_IDS: 8 feste plus je Auflage', () => {
    expect(HONOR_IDS).toEqual([...FIXED, 'trial:selfSupply']);
    expect(HONOR_IDS).toHaveLength(8 + TRIAL_IDS.length);
    for (const id of HONOR_IDS) {
      expect(HONORS[id].name.length).toBeGreaterThan(0);
      expect(HONORS[id].condition.length).toBeGreaterThan(0);
    }
  });
  it('N9: keine Schwellen-Literale im Prüfcode', () => {
    const src = readFileSync('src/sim/honors.ts', 'utf8');
    for (const lit of ['9000', '9_000', '18000', '18_000']) expect(src).not.toContain(lit);
    expect(HONOR_SWIFT_CITIZEN_TICK).toBe(9000);
    expect(HONOR_SWIFT_MERCHANT_TICK).toBe(18000);
  });
});

describe('AK-EB-02 Auslöser je Stück', () => {
  const cases: [HonorId, (w: World) => void][] = [
    ['citizenTown', (w) => (w.won = true)],
    ['swiftFound', (w) => (w.won = true)],
    ['swiftTrade', (w) => (w.wonMerchants = true)],
    ['stormTrade', (w) => (w.wonMerchants = true)],
    ['spiceTown', (w) => (w.wonSpice = true)],
    [
      'realm',
      (w) => {
        w.islands.forEach((i) => (i.kontorId = 1));
      },
    ],
    ['monument', (w) => (w.monumentDone = true)],
    ['stormTrial', (w) => w.trial.passed.push({ id: 'selfSupply', tick: 5 })],
    ['trial:selfSupply', (w) => w.trial.passed.push({ id: 'selfSupply', tick: 5 })],
  ];
  for (const [id, set] of cases) {
    it(`${id}: nein→ja liefert das Stück`, () => {
      const w = world();
      if (id === 'realm') w.islands.forEach((i, k) => (i.kontorId = k === 0 ? 1 : null));
      expect(after(w, set)).toContain(id);
    });
    it(`${id}: ja→ja liefert es nicht`, () => {
      const w = world();
      set(w);
      expect(after(w, () => undefined)).not.toContain(id);
    });
    it(`${id}: nein→nein liefert es nicht`, () => {
      const w = world();
      if (id === 'realm') w.islands.forEach((i, k) => (i.kontorId = k === 0 ? 1 : null));
      expect(after(w, () => undefined)).not.toContain(id);
    });
  }
  it('realm: erst wenn alle Inseln ein Kontor haben', () => {
    const w = world();
    w.islands.forEach((i) => (i.kontorId = null));
    expect(after(w, (x) => (x.islands[0]!.kontorId = 1))).not.toContain('realm');
  });
});

describe('AK-EB-03 Tempo-Grenzen (Tick nach dem step)', () => {
  it('swiftFound an der Grenze', () => {
    const a = after(world(), (w) => {
      w.won = true;
      w.tick = HONOR_SWIFT_CITIZEN_TICK;
    });
    expect(a).toContain('citizenTown');
    expect(a).toContain('swiftFound');
    const b = after(world(), (w) => {
      w.won = true;
      w.tick = HONOR_SWIFT_CITIZEN_TICK + 1;
    });
    expect(b).toContain('citizenTown');
    expect(b).not.toContain('swiftFound');
  });
  it('swiftTrade an der Grenze', () => {
    const a = after(world(), (w) => {
      w.wonMerchants = true;
      w.tick = HONOR_SWIFT_MERCHANT_TICK;
    });
    expect(a).toContain('swiftTrade');
    const b = after(world(), (w) => {
      w.wonMerchants = true;
      w.tick = HONOR_SWIFT_MERCHANT_TICK + 1;
    });
    expect(b).not.toContain('swiftTrade');
  });
});

describe('AK-EB-04 Rahmen', () => {
  const both = (w: World): void => {
    w.won = true;
    w.wonMerchants = true;
  };
  it('Tempo-Stücke fehlen ohne stufenweisen Lauf gleicher Seed', () => {
    const base = after(world(), both);
    expect(base).toEqual(['citizenTown', 'swiftFound', 'swiftTrade', 'stormTrade']);
    const rest = ['citizenTown', 'stormTrade'];
    expect(after(world(), both, { seed: S, unlockMode: 'all' })).toEqual(rest);
    expect(after(world(), both, null)).toEqual(rest);
    expect(after(world(), both, { seed: S + 1, unlockMode: 'stepwise' })).toEqual(rest);
  });
  it('Sturm-Stücke fehlen bei off und mild', () => {
    for (const level of ['off', 'mild'] as const) {
      const w = world(level);
      const got = after(w, (x) => {
        both(x);
        x.trial.passed.push({ id: 'selfSupply', tick: 5 });
      });
      expect(got).not.toContain('stormTrade');
      expect(got).not.toContain('stormTrial');
      expect(got).toContain('trial:selfSupply');
    }
  });
  it('RL-1: unlockAll-Welt mit stufenweisem Lauf ergibt swiftFound (dokumentiertes Verhalten, Spec RL-1)', () => {
    const w = createWorld(S, { unlockAll: true });
    w.tick = 100;
    expect(after(w, (x) => (x.won = true))).toContain('swiftFound');
  });
  it('mehrere Stücke in HONOR_IDS-Reihenfolge', () => {
    const got = after(world(), (w) => {
      w.trial.passed.push({ id: 'selfSupply', tick: 5 });
      w.monumentDone = true;
      w.wonSpice = true;
      w.won = true;
    });
    expect(got).toEqual(HONOR_IDS.filter((id) => got.includes(id)));
    expect(got.length).toBeGreaterThanOrEqual(5);
  });
});
