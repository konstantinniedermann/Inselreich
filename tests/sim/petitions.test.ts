import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GOOD_IDS, STORAGE_CAP } from '../../src/sim/defs/goods';
import {
  DEFAULT_NEW_GAME_PETITIONS_ON,
  DEFAULT_WORLD_PETITIONS_ON,
  FRUGAL_PCT,
  FRUGAL_TICKS,
  OVERCROWD_PCT,
  PETITIONS,
  PETITION_ANSWER,
  PETITION_FIRST,
  PETITION_IDS,
  PETITION_MAX_OPEN,
  PETITION_PERIOD,
  PETITION_SALT,
  type PetitionId,
} from '../../src/sim/defs/petitions';
import { needRate, overcrowdCap, petitionCycle, storageCap } from '../../src/sim/petitionEffect';
import { petitionRng } from '../../src/sim/petitionRng';
import { createRng } from '../../src/sim/rng';
import type { PetitionEffectEntry, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

describe('AK-BS-09 Wächter', () => {
  it('Zeitfenster passen in die Periode und in die 15 Minuten', () => {
    const maxDelay = Math.max(...PETITION_IDS.map((id) => PETITIONS[id].delay));
    expect(maxDelay + PETITION_ANSWER).toBeLessThanOrEqual(PETITION_PERIOD);
    expect(PETITION_FIRST + 6750).toBeLessThanOrEqual(9000);
  });
  it('Dauern positiv, Waren gültig, neun Bitten ohne Gilde', () => {
    for (const id of PETITION_IDS) {
      const d = PETITIONS[id];
      expect(d.duration, id).toBeGreaterThan(0);
      expect(GOOD_IDS, id).toContain(d.no);
      for (const c of d.cost) expect(GOOD_IDS, id).toContain(c.good);
    }
    expect(PETITION_IDS.length).toBe(9);
    expect(PETITION_IDS as readonly string[]).not.toContain('guild');
  });
});

describe('AK-BS-16 Defs gegen Tabelle (Spec 4.1, 4.2)', () => {
  it('Konstanten', () => {
    expect(DEFAULT_WORLD_PETITIONS_ON).toBe(false);
    expect(DEFAULT_NEW_GAME_PETITIONS_ON).toBe(true);
    expect(PETITION_FIRST).toBe(600);
    expect(PETITION_PERIOD).toBe(6000);
    expect(PETITION_ANSWER).toBe(1200);
    expect(PETITION_MAX_OPEN).toBe(2);
    expect(PETITION_SALT).toBe(0xc2b2ae35);
    expect(OVERCROWD_PCT).toBe(15);
    expect(FRUGAL_PCT).toBe(10);
    expect(FRUGAL_TICKS).toBe(1800);
  });
  const oc = (pct: number, tiers: number[]) => ({ kind: 'overcrowd', pct, tiers });
  const div = (good: string, d: number, min: number, max: number) => ({ good, div: d, min, max });
  const expected: Record<PetitionId, object> = {
    weavers: {
      delay: 4800,
      duration: 6000,
      reward: oc(15, [2, 3, 4]),
      cost: [div('cloth', 5, 10, 40)],
      no: 'cloth',
    },
    tavern: {
      delay: 4800,
      duration: 6000,
      reward: oc(15, [3]),
      cost: [div('rum', 5, 10, 40)],
      no: 'rum',
    },
    glaziers: {
      delay: 4800,
      duration: 6000,
      reward: oc(15, [4]),
      cost: [div('glass', 10, 5, 20)],
      no: 'glass',
    },
    bell: {
      delay: 600,
      duration: 1800,
      reward: { kind: 'upgradeWait' },
      cost: [
        { good: 'rum', fixed: 10 },
        { good: 'stone', fixed: 10 },
      ],
      no: 'rum',
    },
    feastDrink: {
      delay: 600,
      duration: 6000,
      reward: { kind: 'feastVoucher' },
      cost: [{ good: 'cane', fixed: 20 }],
      no: 'rum',
    },
    spiceSeed: {
      delay: 1200,
      duration: 6000,
      reward: { kind: 'cycle', pct: 80, building: 'spicefarm', homeOnly: false },
      cost: [{ good: 'spice', fixed: 10 }],
      no: 'spice',
    },
    woolMarket: {
      delay: 600,
      duration: 3000,
      reward: { kind: 'cycle', pct: 80, building: 'weaver', homeOnly: true },
      cost: [{ good: 'wool', fixed: 20 }],
      no: 'cloth',
    },
    returnees: { delay: 2400, duration: 6000, reward: oc(10, [1, 2, 3, 4]), cost: [], no: 'food' },
    granary: {
      delay: 600,
      duration: 6000,
      reward: { kind: 'storage', plus: 20, goods: ['cloth', 'rum', 'food'] },
      cost: [
        { good: 'wood', fixed: 20 },
        { good: 'stone', fixed: 10 },
      ],
      no: 'food',
    },
  };
  for (const id of PETITION_IDS) {
    it(`${id} entspricht der Tabelle`, () => {
      const d = PETITIONS[id];
      expect({
        delay: d.delay,
        duration: d.duration,
        reward: d.reward,
        cost: d.cost,
        no: d.no,
      }).toEqual(expected[id]);
      expect(d.noReason.length).toBeGreaterThan(0);
      expect(d.text.length).toBeGreaterThan(0);
      expect(d.thanks.length).toBeGreaterThan(0);
      expect(d.lament.length).toBeGreaterThan(0);
    });
  }
  it('Nein-Grund nennt die Ware bei B5, B7, B8, B9 (AK-BS-24)', () => {
    expect(PETITIONS.feastDrink.noReason).toContain('Rum');
    expect(PETITIONS.woolMarket.noReason).toContain('Stoff');
    expect(PETITIONS.returnees.noReason).toContain('Nahrung');
    expect(PETITIONS.granary.noReason).toContain('Nahrung');
  });
});

describe('AK-BS-01 createWorld', () => {
  it('Feld im Aus-Zustand, mit Option an', () => {
    expect(createWorld(3).petitions).toEqual({ on: false, next: null, open: [], effects: [] });
    expect(createWorld(3, { petitionsOn: true }).petitions.on).toBe(true);
  });
});

describe('Strom', () => {
  it('petitionRng ist deterministisch und folgt der Salzformel', () => {
    const a = petitionRng(3, 600);
    const b = createRng((3 ^ Math.imul(601, PETITION_SALT)) >>> 0);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(petitionRng(3, 600)()).not.toBe(petitionRng(3, 6600)());
  });
});

describe('Blatt petitionEffect', () => {
  it('importiert nur defs, types und world', () => {
    const src = readFileSync('src/sim/petitionEffect.ts', 'utf8');
    const imports = [...src.matchAll(/from '(\.[^']*)'/g)].map((m) => m[1]!);
    expect(imports.length).toBeGreaterThan(0);
    for (const i of imports) expect(i).toMatch(/^\.\/(defs\/|types|world)/);
  });
});

function withEffects(effects: PetitionEffectEntry[]): World {
  const w = createWorld(3);
  w.tick = 100;
  w.petitions.effects = effects;
  return w;
}
const yes = (id: PetitionId, until = 110): PetitionEffectEntry => ({ id, answer: 'yes', until });
const no = (id: PetitionId, until = 110): PetitionEffectEntry => ({ id, answer: 'no', until });

describe('Leseorte', () => {
  it('ohne Wirkungen liefern alle vier den Eingabewert', () => {
    const w = createWorld(3);
    expect(overcrowdCap(w, 0, 2, 8)).toBe(8);
    expect(overcrowdCap(w, 0, 4, 20)).toBe(20);
    expect(needRate(w, 0, 'food', 0.5)).toBe(0.5);
    expect(petitionCycle(w, 0, 'weaver', 40)).toBe(40);
    expect(storageCap(w, 0, 'cloth')).toBe(STORAGE_CAP);
  });
  it('overcrowdCap B1: Stufen 2 bis 4 plus 15 Prozent, Stufe 1 gefiltert, Insel 1 unverändert', () => {
    const w = withEffects([yes('weavers')]);
    expect(overcrowdCap(w, 0, 2, 8)).toBe(9);
    expect(overcrowdCap(w, 0, 3, 15)).toBe(17);
    expect(overcrowdCap(w, 0, 4, 20)).toBe(23);
    expect(overcrowdCap(w, 0, 1, 4)).toBe(4);
    expect(overcrowdCap(w, 1, 2, 8)).toBe(8);
  });
  it('overcrowdCap B8: alle Stufen plus 10 Prozent', () => {
    const w = withEffects([yes('returnees')]);
    expect(overcrowdCap(w, 0, 1, 4)).toBe(4);
    expect(overcrowdCap(w, 0, 4, 20)).toBe(22);
  });
  it('abgelaufene Wirkung (until <= tick) zählt nicht', () => {
    const w = withEffects([yes('weavers', 100)]);
    expect(overcrowdCap(w, 0, 2, 8)).toBe(8);
  });
  it('needRate: Nein senkt die Nein-Ware um 10 Prozent, andere Waren nicht', () => {
    const w = withEffects([no('weavers')]);
    expect(needRate(w, 0, 'cloth', 1)).toBeCloseTo(0.9);
    expect(needRate(w, 0, 'rum', 1)).toBe(1);
    expect(needRate(w, 1, 'cloth', 1)).toBe(1);
  });
  it('needRate: zwei Nein auf dieselbe Ware wirken nur einmal', () => {
    const w = withEffects([no('weavers'), no('woolMarket')]);
    expect(needRate(w, 0, 'cloth', 1)).toBeCloseTo(0.9);
  });
  it('petitionCycle: B6 auch auf Fremdinseln, B7 nur HOME, kleinster Prozentwert, mindestens 1', () => {
    const w = withEffects([yes('spiceSeed'), yes('woolMarket')]);
    expect(petitionCycle(w, 0, 'spicefarm', 50)).toBe(40);
    expect(petitionCycle(w, 1, 'spicefarm', 50)).toBe(40);
    expect(petitionCycle(w, 0, 'weaver', 50)).toBe(40);
    expect(petitionCycle(w, 1, 'weaver', 50)).toBe(50);
    expect(petitionCycle(w, 0, 'fisher', 50)).toBe(50);
    expect(petitionCycle(w, 0, 'weaver', 1)).toBe(1);
  });
  it('storageCap: B9 plus 20 für Stoff, Rum, Nahrung nur auf HOME', () => {
    const w = withEffects([yes('granary')]);
    expect(storageCap(w, 0, 'cloth')).toBe(STORAGE_CAP + 20);
    expect(storageCap(w, 0, 'food')).toBe(STORAGE_CAP + 20);
    expect(storageCap(w, 0, 'wood')).toBe(STORAGE_CAP);
    expect(storageCap(w, 1, 'cloth')).toBe(STORAGE_CAP);
  });
});
