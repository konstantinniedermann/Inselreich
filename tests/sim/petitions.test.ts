import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
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
import {
  bellActive,
  needRate,
  overcrowdCap,
  petitionCycle,
  storageCap,
  voucherAt,
} from '../../src/sim/petitionEffect';
import { FEAST_KINDS } from '../../src/sim/defs/feast';
import { FEAST_DURATION } from '../../src/sim/defs/timing';
import { TAX_LEVELS } from '../../src/sim/defs/tiers';
import { feastBlockReason, holdFeast } from '../../src/sim/feast';
import { inChapelRadius } from '../../src/sim/feastEffect';
import { upgradeStatus } from '../../src/sim/population';
import { petitionRng } from '../../src/sim/petitionRng';
import { createRng } from '../../src/sim/rng';
import type { Building, GoodId, PetitionEffectEntry, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { demolish } from '../../src/sim/build';
import {
  answerPetition,
  PETITION_REASONS,
  petitionPreview,
  tickPetitions,
} from '../../src/sim/petitions';
import { step, type StepReport } from '../../src/sim/tick';
import {
  houseFar,
  houseNearKontor,
  placeService,
  putBuilding,
  setHouse,
  twoIslandWorld,
  village,
} from './helpers';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { WIN_SPICE_HOLD } from '../../src/sim/defs/tiers';
import { cycleOf } from '../../src/sim/levels';
import { goodsBalance } from '../../src/sim/flow';
import { addStock } from '../../src/sim/economy';
import { buy } from '../../src/sim/trade';
import { merchants } from '../../src/sim/population';
import { spiceMerchants } from '../../src/sim/goal3';
import { setRoute, tickShips } from '../../src/sim/ships';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';
import { spiceGoalScenario } from './scenariosSea';

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
  it('importiert nur defs, types, world und feastEffect', () => {
    const src = readFileSync('src/sim/petitionEffect.ts', 'utf8');
    const imports = [...src.matchAll(/from '(\.[^']*)'/g)].map((m) => m[1]!);
    expect(imports.length).toBeGreaterThan(0);
    for (const i of imports) expect(i).toMatch(/^\.\/(defs\/|types|world|feastEffect)/);
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

const OPTS = { unlockAll: true, crisisLevel: 'off', petitionsOn: true } as const;
const zeroStock = (w: World): void => {
  for (const g of GOOD_IDS) home(w).stock[g] = 0;
};
const run = (w: World, n: number): StepReport[] => {
  const out: StepReport[] = [];
  for (let i = 0; i < n; i++) out.push(step(w));
  return out;
};
const mark = (w: World, id: PetitionId, amount = 10, anchor?: number): number => {
  w.petitions.open.push({
    id,
    drawnAt: w.tick,
    amount,
    ...(anchor === undefined ? {} : { anchor }),
  });
  return w.tick;
};

describe('AK-BS-02 Start und Termine', () => {
  it('vor Ziel 1 bleibt next null; danach T + 1 + 600, erste Marke genau dort, zweiter Termin +6000', () => {
    const w = createWorld(3, OPTS);
    run(w, 2000);
    expect(w.petitions.next).toBeNull();
    w.won = true;
    run(w, 1);
    const first = w.tick + PETITION_FIRST;
    expect(w.petitions.next).toBe(first);
    run(w, PETITION_FIRST - 1);
    expect(w.petitions.open).toHaveLength(0);
    run(w, 1);
    expect(w.tick).toBe(first);
    expect(w.petitions.open).toHaveLength(1);
    expect(w.petitions.next).toBe(first + PETITION_PERIOD);
  });
  it('kein Kandidat: Termin fällt aus; beim zweiten Termin entsteht glaziers', () => {
    const { w, houses } = village(1, { unlockAll: true });
    w.petitions.on = true;
    w.won = true;
    w.wonSpice = true;
    zeroStock(w);
    run(w, 1);
    const first = w.petitions.next!;
    run(w, first - w.tick);
    expect(w.petitions.open).toHaveLength(0);
    expect(w.petitions.next).toBe(first + PETITION_PERIOD);
    run(w, PETITION_PERIOD - 1);
    zeroStock(w);
    home(w).stock.glass = 20;
    setHouse(houses[0]!, 4, 10);
    run(w, 1);
    expect(w.petitions.open.map((m) => m.id)).toEqual(['glaziers']);
    expect(w.petitions.open[0]!.amount).toBe(5);
  });
});

describe('AK-BS-06 Ware fehlt', () => {
  it('Rum 0: Antwort gesperrt, Welt unverändert', () => {
    const w = createWorld(3, OPTS);
    home(w).stock.rum = 0;
    const d = mark(w, 'tavern');
    const before = JSON.stringify(w);
    expect(answerPetition(w, d, 'yes')).toEqual({ ok: false, reason: 'Zu wenig Rum (0 / 10)' });
    expect(JSON.stringify(w)).toBe(before);
  });
  it('B4: Stein fehlt, Rum bleibt, danach Nein ok', () => {
    const { w } = village(1, { unlockAll: true });
    w.petitions.on = true;
    const chapel = placeService(w, 'chapel', 20, 20);
    home(w).stock.rum = 30;
    home(w).stock.stone = 4;
    const d = mark(w, 'bell', 0, chapel.id);
    expect(answerPetition(w, d, 'yes')).toEqual({ ok: false, reason: 'Zu wenig Stein (4 / 10)' });
    expect(home(w).stock.rum).toBe(30);
    expect(answerPetition(w, d, 'no').ok).toBe(true);
  });
  it('Lager fällt nach dem Ziehen: Ja gesperrt, nach 1200 Schritten gilt Nein', () => {
    const w = createWorld(3, OPTS);
    home(w).stock.rum = 0;
    const d = mark(w, 'tavern');
    expect(answerPetition(w, d, 'yes').ok).toBe(false);
    run(w, PETITION_ANSWER);
    expect(w.petitions.open[0]!.answer).toBe('no');
  });
});

describe('AK-BS-07 Kandidaten', () => {
  it('in 50 Seeds nie unbezahlbare oder unpassende Bitte; ohne Kandidat fällt der Termin aus', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed, OPTS);
      setHouse(houseNearKontor(w), 3, 20);
      zeroStock(w);
      w.won = true;
      w.petitions.next = 1;
      run(w, 1);
      const ids = w.petitions.open.map((m) => m.id);
      for (const bad of ['tavern', 'bell', 'feastDrink', 'spiceSeed', 'weavers'] as const)
        expect(ids, `${seed} ${bad}`).not.toContain(bad);
      const v = createWorld(seed, OPTS);
      setHouse(houseNearKontor(v), 3, 20);
      zeroStock(v);
      v.won = true;
      v.wonSpice = true;
      v.petitions.next = 1;
      run(v, 1);
      expect(v.petitions.open, `${seed}`).toHaveLength(0);
      expect(v.petitions.next).toBe(1 + PETITION_PERIOD);
    }
  });
});

describe('AK-BS-08 Zwei offene Marken', () => {
  it('keine dritte, next + 6000, beide getrennt beantwortbar', () => {
    const w = createWorld(3, OPTS);
    home(w).stock.cloth = 50;
    w.won = true;
    const d1 = mark(w, 'weavers');
    w.tick += 1;
    const d2 = mark(w, 'returnees', 0);
    w.petitions.next = w.tick + 1;
    run(w, 1);
    expect(w.petitions.open).toHaveLength(2);
    expect(w.petitions.next).toBe(w.tick + PETITION_PERIOD);
    expect(answerPetition(w, d1, 'yes').ok).toBe(true);
    expect(answerPetition(w, d2, 'no').ok).toBe(true);
  });
});

describe('AK-BS-11 Anker', () => {
  it('vor der Antwort abgerissen: Ja gesperrt, Nein ok', () => {
    const { w } = village(1, { unlockAll: true });
    w.petitions.on = true;
    const chapel = placeService(w, 'chapel', 20, 20);
    home(w).stock.rum = 30;
    home(w).stock.stone = 30;
    const d = mark(w, 'bell', 0, chapel.id);
    expect(demolish(w, chapel.id).ok).toBe(true);
    expect(answerPetition(w, d, 'yes')).toEqual({
      ok: false,
      reason: 'Kapelle steht nicht mehr',
    });
    expect(answerPetition(w, d, 'no').ok).toBe(true);
  });
  it('nach Ja abgerissen: bei dueTick lapsed, keine Wirkung, keine Erstattung', () => {
    const { w } = village(1, { unlockAll: true });
    w.petitions.on = true;
    const chapel = placeService(w, 'chapel', 20, 20);
    home(w).stock.rum = 30;
    home(w).stock.stone = 30;
    const d = mark(w, 'bell', 0, chapel.id);
    expect(answerPetition(w, d, 'yes').ok).toBe(true);
    expect(home(w).stock.rum).toBe(20);
    demolish(w, chapel.id);
    const rum = home(w).stock.rum;
    const stone = home(w).stock.stone;
    const reports = run(w, w.petitions.open[0]!.dueTick! - w.tick);
    const kinds = reports.flatMap((r) => r.petitions.map((e) => e.kind));
    expect(kinds).toEqual(['lapsed']);
    expect(w.petitions.effects.filter((e) => e.answer === 'yes')).toEqual([]);
    expect(home(w).stock.rum).toBe(rum);
    expect(home(w).stock.stone).toBe(stone);
  });
  it('Ja mit stehendem Anker: Wirkung ab dueTick, Dank', () => {
    const { w } = village(1, { unlockAll: true });
    w.petitions.on = true;
    const chapel = placeService(w, 'chapel', 20, 20);
    home(w).stock.rum = 30;
    home(w).stock.stone = 30;
    const d = mark(w, 'bell', 0, chapel.id);
    answerPetition(w, d, 'yes');
    const reports = run(w, PETITIONS.bell.delay);
    expect(reports.flatMap((r) => r.petitions.map((e) => e.kind))).toEqual(['thanks']);
    expect(w.petitions.open).toHaveLength(0);
    expect(w.petitions.effects).toEqual([
      { id: 'bell', answer: 'yes', until: w.tick + PETITIONS.bell.duration, anchor: chapel.id },
    ]);
  });
});

describe('AK-BS-12 Pause und Frist', () => {
  it('ohne step bleibt die Welt gleich; 1199 offen, 1200 Nein mit Genügsamkeit und Klage', () => {
    const w = createWorld(3, OPTS);
    const d = mark(w, 'tavern');
    const before = JSON.stringify(w);
    expect(JSON.stringify(w)).toBe(before);
    run(w, PETITION_ANSWER - 1);
    expect(w.petitions.open[0]!.answer).toBeUndefined();
    const r = step(w);
    expect(r.petitions).toEqual([{ kind: 'timeout', id: 'tavern', drawnAt: d }]);
    expect(w.petitions.open[0]!.answer).toBe('no');
    expect(w.petitions.open[0]!.dueTick).toBe(w.tick + PETITIONS.tavern.delay);
    expect(w.petitions.effects).toEqual([
      { id: 'tavern', answer: 'no', until: w.tick + FRUGAL_TICKS },
    ]);
    const later = run(w, PETITIONS.tavern.delay).flatMap((x) => x.petitions);
    expect(later.map((e) => e.kind)).toEqual(['lament']);
    expect(w.petitions.open).toHaveLength(0);
  });
});

describe('Antwortgründe', () => {
  it('aus, unbekannt, doppelt, Unbekannte Antwort, Fristtick', () => {
    const off = createWorld(3);
    const d0 = mark(off, 'tavern');
    expect(answerPetition(off, d0, 'no')).toEqual({ ok: false, reason: PETITION_REASONS.off });
    expect(PETITION_REASONS.off).toBe('Bittschriften aus');
    const w = createWorld(3, OPTS);
    home(w).stock.rum = 50;
    const d = mark(w, 'tavern');
    expect(answerPetition(w, d + 1, 'yes')).toEqual({ ok: false, reason: 'Keine offene Bitte' });
    expect(answerPetition(w, d, 'maybe')).toEqual({ ok: false, reason: 'Unbekannte Antwort' });
    expect(answerPetition(w, d, 'yes').ok).toBe(true);
    expect(home(w).stock.rum).toBe(40);
    expect(answerPetition(w, d, 'yes')).toEqual({ ok: false, reason: 'Schon beantwortet' });
    expect(home(w).stock.rum).toBe(40);
    const f = createWorld(3, OPTS);
    const df = mark(f, 'tavern');
    run(f, PETITION_ANSWER);
    expect(answerPetition(f, df, 'yes')).toEqual({ ok: false, reason: 'Schon beantwortet' });
  });
  it('tickPetitions ist bei aus ein No-Op', () => {
    const w = createWorld(3);
    w.won = true;
    expect(tickPetitions(w)).toEqual([]);
    expect(w.petitions).toEqual({ on: false, next: null, open: [], effects: [] });
  });
});

describe('AK-BS-16 petitions.ts ohne Spielwerte', () => {
  const src = readFileSync('src/sim/petitions.ts', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  it('keine Zahlen, keine Waren-Literale, Import der Defs', () => {
    expect(src).not.toMatch(/\b(6000|4800|3000|2400|1800|1200)\b/);
    expect(src).not.toMatch(/0xc2b2ae35|3266489909/i);
    for (const g of GOOD_IDS) expect(src).not.toContain(`'${g}'`);
    expect(src).toMatch(/from '\.\/defs\/petitions'/);
  });
});

const FOREVER = 1_000_000;
const forever = (id: PetitionId, answer: 'yes' | 'no' = 'yes'): PetitionEffectEntry => ({
  id,
  answer,
  until: FOREVER,
});
/** Versorgtes Kaufmannshaus (Szenario Gewürzstadt mit einem Haus, Tick 0, alle Dienste in Reichweite). */
function merchantHouse(): { w: World; house: Building } {
  const w = spiceGoalScenario({ houses: 1 });
  w.tick = 0;
  const house = Object.values(w.buildings).find((x) => x.house !== undefined)!;
  house.house!.satisfiedSince = 0;
  return { w, house };
}
const feed = (w: World): void => {
  for (const g of GOOD_IDS) home(w).stock[g] = Math.max(home(w).stock[g], 60);
};
const runFed = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) {
    feed(w);
    step(w);
  }
};

describe('AK-BS-10 Stapeln und Frist', () => {
  it('zwei B1 überlappend: Stufe 4 wächst bis 23, nicht 26', () => {
    const { w, house } = merchantHouse();
    w.petitions.effects = [forever('weavers'), forever('weavers')];
    runFed(w, 600);
    expect(house.house!.inhabitants).toBe(23);
  });
  it('B1 und B8 zugleich: 15 Prozent, also 23', () => {
    const { w, house } = merchantHouse();
    w.petitions.effects = [forever('weavers'), forever('returnees')];
    runFed(w, 600);
    expect(house.house!.inhabitants).toBe(23);
  });
  it('Zuwachs: versorgt 20 auf 23 in 3 Wachstumstakten, unversorgt wächst nicht', () => {
    const { w, house } = merchantHouse();
    w.petitions.effects = [forever('weavers')];
    runFed(w, 150);
    expect(house.house!.inhabitants).toBe(23);
    const u = merchantHouse();
    u.w.petitions.effects = [forever('weavers')];
    for (let i = 0; i < 150; i++) {
      feed(u.w);
      u.w.islands[0]!.stock.cloth = 0;
      step(u.w);
    }
    expect(u.house.house!.inhabitants).toBeLessThanOrEqual(20);
  });
  it('zwei Taktlöhne B7: cycleOf = floor(c * 80 / 100), nicht mal 64', () => {
    const w = createWorld(3);
    const b = putBuilding(w, 0, 'weaver', 0, 0);
    const c = BUILDING_DEFS.weaver.cycle!;
    expect(cycleOf(w, b)).toBe(c);
    w.petitions.effects = [forever('woolMarket'), forever('woolMarket')];
    expect(cycleOf(w, b)).toBe(Math.floor((c * 80) / 100));
  });
  it('nach until gilt wieder cap, das Haus gibt je Wachstumstakt 1 ab', () => {
    const { w, house } = merchantHouse();
    setHouse(house, 4, 23);
    w.petitions.on = true;
    w.petitions.effects = [{ id: 'weavers', answer: 'yes', until: 10 }];
    runFed(w, 49);
    expect(house.house!.inhabitants).toBe(23);
    runFed(w, 1);
    expect(house.house!.inhabitants).toBe(22);
    runFed(w, 50);
    expect(house.house!.inhabitants).toBe(21);
  });
  it('B9 Ablauf: Stoff 117 wird auf 100 gekappt, Ereignis ended meldet 17 verdorben', () => {
    const w = createWorld(3, OPTS);
    for (const g of GOOD_IDS) home(w).stock[g] = 50;
    home(w).stock.cloth = 117;
    w.petitions.effects = [{ id: 'granary', answer: 'yes', until: 5 }];
    const events = run(w, 5).flatMap((r) => r.petitions);
    expect(events).toEqual([{ kind: 'ended', id: 'granary', drawnAt: 5, spoiled: { cloth: 17 } }]);
    expect(home(w).stock.cloth).toBe(100);
  });
});

describe('Fremdinsel (Review Focus 1)', () => {
  it('Haus auf Insel 1 bleibt bei cap, Genügsamkeit und Lager gelten dort nicht', () => {
    const w = twoIslandWorld();
    const k = w.buildings[w.islands[1]!.kontorId!]!;
    const h = putBuilding(w, 1, 'house', k.x + 2, k.y);
    setHouse(h, 2, 9);
    w.petitions.effects = [forever('weavers'), forever('weavers', 'no'), forever('granary')];
    for (let i = 0; i < 60; i++) step(w);
    expect(h.house!.inhabitants).toBeLessThanOrEqual(8);
    expect(storageCap(w, 1, 'cloth')).toBe(STORAGE_CAP);
    expect(needRate(w, 1, 'cloth', 1)).toBe(1);
  });
  it('B6 (spicefarm, homeOnly false) wirkt auf Insel 1', () => {
    const w = createWorld(3);
    w.petitions.effects = [forever('spiceSeed')];
    const b = putBuilding(w, 0, 'spicefarm', 0, 0);
    b.island = 1;
    expect(cycleOf(w, b)).toBeLessThan(BUILDING_DEFS.spicefarm.cycle!);
  });
});

describe('Genügsamkeit (P-4)', () => {
  const consumed = (w: World): number => {
    home(w).stock.cloth = 100;
    let used = 0;
    for (let i = 0; i < 1800; i++) {
      feed(w);
      const before = home(w).stock.cloth;
      step(w);
      used += before - home(w).stock.cloth;
    }
    return used;
  };
  it('Nein auf Stoff: Verbrauch über 1800 T ist 90 Prozent der Referenz', () => {
    const ref = merchantHouse();
    const refUsed = consumed(ref.w);
    const t = merchantHouse();
    t.w.petitions.effects = [forever('weavers', 'no')];
    const used = consumed(t.w);
    expect(refUsed).toBeGreaterThan(50);
    expect(Math.abs(used - refUsed * 0.9)).toBeLessThanOrEqual(1);
  });
  it('goodsBalance zeigt 90 Prozent Verbrauch', () => {
    const ref = merchantHouse();
    const base = goodsBalance(ref.w).cloth.consumed;
    ref.w.petitions.effects = [forever('weavers', 'no')];
    expect(goodsBalance(ref.w).cloth.consumed).toBeCloseTo(base * 0.9);
  });
});

describe('Lager 120 (P-5)', () => {
  it('Produktion: mit B9 über 100 bis 120, ohne bei 100', () => {
    const make = (on: boolean): World => {
      const w = createWorld(3);
      w.petitions.effects = on ? [forever('granary')] : [];
      putBuilding(w, 0, 'weaver', 0, 0);
      home(w).stock.cloth = 100;
      home(w).stock.wool = 100;
      return w;
    };
    const a = make(true);
    for (let i = 0; i < 50 * 40; i++) {
      home(a).stock.wool = 100;
      step(a);
      home(a).stock.cloth = Math.max(home(a).stock.cloth, 0);
    }
    const b = make(false);
    for (let i = 0; i < 50 * 40; i++) {
      home(b).stock.wool = 100;
      step(b);
    }
    expect(home(b).stock.cloth).toBeLessThanOrEqual(100);
    expect(home(a).stock.cloth).toBeGreaterThan(100);
    expect(home(a).stock.cloth).toBeLessThanOrEqual(120);
  });
  it('addStock mit eigener Grenze, Vorgabe bleibt STORAGE_CAP', () => {
    const w = createWorld(3);
    home(w).stock.cloth = 95;
    expect(addStock(home(w), 'cloth', 50)).toBe(5);
    home(w).stock.cloth = 95;
    expect(addStock(home(w), 'cloth', 50, 120)).toBe(25);
  });
  it('Kauf: bei 110 mit B9 kein Lager voll, ohne schon', () => {
    const w = createWorld(3, { unlockAll: true });
    home(w).stock.cloth = 110;
    expect(buy(w, 'cloth', 5)).toEqual({ ok: false, reason: 'Lager voll' });
    w.petitions.effects = [forever('granary')];
    expect(buy(w, 'cloth', 5)).toEqual({ ok: true });
    expect(home(w).stock.cloth).toBe(115);
    expect(buy(w, 'cloth', 6)).toEqual({ ok: false, reason: 'Lager voll' });
  });
  it('Entladen bis 120 mit B9, sonst 100', () => {
    const unload = (on: boolean): number => {
      const w = seaWorld();
      foundKontor2Literal(w, 2);
      for (const g of GOOD_IDS) home(w).stock[g] = 0;
      home(w).stock.cloth = 100;
      if (on) w.petitions.effects = [forever('granary')];
      const s = shipLiteral(w, { cargo: { cloth: 30 } });
      setRoute(w, s.id, { a: 0, b: 2, ab: [{ good: 'tools', reserve: 0 }], ba: [] });
      tickShips(w);
      return home(w).stock.cloth;
    };
    expect(unload(false)).toBe(100);
    expect(unload(true)).toBe(120);
  });
});

describe('AK-BS-11 Haus', () => {
  it('überbelegtes Haus abgerissen: übrige Häuser unverändert, kein Wurf', () => {
    const { w, houses } = village(2, { unlockAll: true });
    setHouse(houses[0]!, 2, 9);
    setHouse(houses[1]!, 2, 8);
    w.petitions.effects = [forever('weavers')];
    expect(() => demolish(w, houses[0]!.id)).not.toThrow();
    expect(w.buildings[houses[0]!.id]).toBeUndefined();
    expect(() => run(w, 60)).not.toThrow();
    expect(houses[1]!.house!.inhabitants).toBeLessThanOrEqual(9);
  });
});

describe('AK-BS-14 Siegziele', () => {
  it('Stufe 4 mit 23 zählt 23 in merchants und spiceMerchants', () => {
    const w = spiceGoalScenario({ houses: 1 });
    const h = Object.values(w.buildings).find((b) => b.house)!;
    h.house!.inhabitants = 23;
    w.petitions.effects = [forever('weavers')];
    for (let i = 0; i < WIN_SPICE_HOLD; i++) {
      feed(w);
      step(w);
    }
    expect(merchants(w)).toBe(23);
    expect(spiceMerchants(w)).toBe(23);
  });
  it('3 x 23 + 11 = 80: wonSpice nach 600 T Haltezeit', () => {
    const w = spiceGoalScenario({ houses: 4 });
    const hs = Object.values(w.buildings).filter((b) => b.house);
    [23, 23, 23, 11].forEach((n, i) => (hs[i]!.house!.inhabitants = n));
    w.petitions.effects = [forever('weavers')];
    for (let i = 0; i < WIN_SPICE_HOLD + 1; i++) {
      if (w.tick % 100 === 0)
        for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
      step(w);
    }
    expect(w.wonSpice).toBe(true);
  });
});

describe('AK-BS-18 Kartenvorschau', () => {
  /** P1: 4 Häuser Stufe 3 mit 13, 13, 12, 12 Einwohnern, fünf Webereien (Stoff-Netto 0), Stoff 31, Marke B1 mit 10. */
  function previewWorld(): World {
    const { w, houses } = village(4);
    [13, 13, 12, 12].forEach((n, i) => setHouse(houses[i]!, 3, n));
    const k = w.buildings[home(w).kontorId]!;
    for (let i = 0; i < 5; i++) putBuilding(w, 0, 'weaver', k.x + 2 + 2 * i, k.y + 4);
    home(w).stock.cloth = 31;
    w.tick = 100;
    w.petitions.open.push({ id: 'weavers', drawnAt: 50, amount: 10 });
    return w;
  }
  it('Kosten, Zusatzplätze, Reserve, Reichweite, Spareffekt', () => {
    const w = previewWorld();
    expect(goodsBalance(w).cloth.net).toBeCloseTo(0, 9);
    const before = JSON.stringify(w);
    const pv = petitionPreview(w, 50)!;
    expect(JSON.stringify(w)).toBe(before);
    expect(pv.cost.cloth).toBe(10);
    expect(pv.left).toBe(50 + PETITION_ANSWER - 100);
    expect(pv.extraPlaces).toBe(8);
    const line = (g: GoodId) => pv.reserve.find((r) => r.good === g)!;
    expect(line('cloth').extra).toBeCloseTo(1.6, 6);
    expect(line('food').extra).toBeCloseTo(4.0, 6);
    expect(line('rum').extra).toBeCloseTo(1.6, 6);
    expect(line('cloth').gap).toBeCloseTo(1.6, 6);
    expect(Math.abs(line('cloth').reach! - 1938)).toBeLessThanOrEqual(1);
    expect(pv.noGood).toBe('cloth');
    expect(pv.noSaving).toBeCloseTo(18, 6);
    expect(pv.yesBlock).toBeNull();
    expect(pv.spiceRoute).toBeNull();
  });
  it('kein Engpass: reach null', () => {
    const w = previewWorld();
    home(w).stock.food = 50;
    const k = w.buildings[home(w).kontorId]!;
    for (let i = 0; i < 4; i++) putBuilding(w, 0, 'weaver', k.x + 2 + 2 * i, k.y + 7);
    const pv = petitionPreview(w, 50)!;
    const cloth = pv.reserve.find((r) => r.good === 'cloth')!;
    expect(cloth.gap).toBe(0);
    expect(cloth.reach).toBeNull();
  });
  it('Stoff 5: yesBlock wie answerPetition', () => {
    const w = previewWorld();
    home(w).stock.cloth = 5;
    w.petitions.on = true;
    const pv = petitionPreview(w, 50)!;
    expect(pv.yesBlock).toBe('Zu wenig Stoff (5 / 10)');
    const r = answerPetition(w, 50, 'yes');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe(pv.yesBlock);
  });
  it('ohne offene Marke null', () => {
    expect(petitionPreview(previewWorld(), 51)).toBeNull();
  });
  it('B9: stocks genau Stoff, Rum, Nahrung; nearFull', () => {
    const w = previewWorld();
    w.petitions.open = [{ id: 'granary', drawnAt: 50, amount: 0 }];
    home(w).stock.food = 95;
    const pv = petitionPreview(w, 50)!;
    expect(Object.keys(pv.stocks!).sort()).toEqual(['cloth', 'food', 'rum']);
    expect(pv.nearFull).toBe(true);
    expect(pv.reserve).toEqual([]);
  });
  it('B6: Gewürzroute; B1: keine', () => {
    const w = previewWorld();
    const k = w.buildings[home(w).kontorId]!;
    const farm = putBuilding(w, 0, 'spicefarm', k.x + 2, k.y + 10);
    w.petitions.open = [{ id: 'spiceSeed', drawnAt: 50, amount: 0, anchor: farm.id }];
    const pv = petitionPreview(w, 50)!;
    expect(pv.spiceRoute).not.toBeNull();
    expect(pv.spiceRoute!.ships).toBe(0);
    expect(pv.producers!.count).toBe(1);
  });
  it('B6 mit Plantage auf Insel 1: Fremdbestand der Plantageninsel', () => {
    const w = twoIslandWorld();
    const k = w.buildings[w.islands[1]!.kontorId!]!;
    const farm = putBuilding(w, 1, 'spicefarm', k.x + 2, k.y);
    w.islands[1]!.stock.spice = 7;
    w.petitions.open = [{ id: 'spiceSeed', drawnAt: 0, amount: 0, anchor: farm.id }];
    const pv = petitionPreview(w, 0)!;
    expect(pv.spiceRoute).toEqual({ foreignStock: 7, ships: 0 });
    expect(pv.producers!.input!.stock).toBe(7);
  });
});

describe('T11 B4/B5 mit dem Fest (I-201)', () => {
  const NO_DEFICIT = { food: 99, cloth: 99, rum: 99, glass: 99, wood: 99, tools: 99, stone: 99 };
  let fw: World;
  let fhouse: Building;
  let fchapel: Building;
  const bell = (w0: World, anchor: number, until = w0.tick + PETITIONS.bell.duration): void => {
    w0.petitions.effects.push({ id: 'bell', answer: 'yes', until, anchor });
  };
  const voucher = (w0: World, anchor: number): void => {
    w0.petitions.effects.push({
      id: 'feastDrink',
      answer: 'yes',
      until: w0.tick + PETITIONS.feastDrink.duration,
      anchor,
    });
  };
  const waitReason = (b: Building): string | undefined =>
    upgradeStatus(fw, b, NO_DEFICIT).reasons.find((r) => r.startsWith('Bedürfnisse'));
  const waited = (b: Building, n: number): void => {
    b.house!.satisfiedSince = fw.tick - n;
  };
  const reasonOf = (r: ReturnType<typeof holdFeast>): string => (r.ok ? '' : r.reason);

  beforeEach(() => {
    fw = createWorld(3, { unlockAll: true });
    fhouse = houseNearKontor(fw);
    fchapel = placeService(fw, 'chapel', fhouse.x + 5, fhouse.y);
    fw.tick = 1000;
    home(fw).stock.rum = 30;
  });

  it('B4: Haus im Radius steigt nach 150 T auf, Normalzeit sonst, nach duration wieder Normalzeit', () => {
    waited(fhouse, TAX_LEVELS.low.upgradeWait!);
    expect(waitReason(fhouse)).toBeDefined();
    bell(fw, fchapel.id);
    expect(waitReason(fhouse)).toBeUndefined();
    const far = houseFar(fw);
    waited(far, TAX_LEVELS.low.upgradeWait!);
    expect(inChapelRadius(fw, fchapel, far)).toBe(false);
    expect(waitReason(far)).toBeDefined();
    fw.tick += PETITIONS.bell.duration;
    waited(fhouse, TAX_LEVELS.low.upgradeWait!);
    expect(waitReason(fhouse)).toBeDefined();
  });

  it('AK-BS-11 Brand: bellActive pausiert, danach wieder true, until unverändert', () => {
    bell(fw, fchapel.id);
    const until = fw.petitions.effects[0]!.until;
    expect(bellActive(fw, fhouse)).toBe(true);
    fchapel.outageUntil = fw.tick + 100;
    fchapel.state = 'burning';
    expect(bellActive(fw, fhouse)).toBe(false);
    delete fchapel.outageUntil;
    fchapel.state = 'ok';
    expect(bellActive(fw, fhouse)).toBe(true);
    expect(fw.petitions.effects[0]!.until).toBe(until);
  });

  it('B5: Fest in der Abklingzeit ok ohne Rum, danach Wirkung weg und Abklingzeit sperrt', () => {
    holdFeast(fw, fchapel.id);
    fw.tick += FEAST_DURATION + 10;
    expect(reasonOf(holdFeast(fw, fchapel.id))).toBe('Abklingzeit');
    voucher(fw, fchapel.id);
    expect(voucherAt(fw, fchapel.id)).toBe(true);
    const rum = home(fw).stock.rum;
    expect(holdFeast(fw, fchapel.id, 'ascension')).toEqual({ ok: true });
    expect(home(fw).stock.rum).toBe(rum);
    expect(voucherAt(fw, fchapel.id)).toBe(false);
    fw.tick += FEAST_DURATION + 10;
    expect(reasonOf(holdFeast(fw, fchapel.id))).toBe('Abklingzeit');
  });

  it('B5: feastBlockReason spiegelt den Gutschein', () => {
    holdFeast(fw, fchapel.id);
    fw.tick += FEAST_DURATION + 10;
    expect(feastBlockReason(fw, fchapel)).toBe('Abklingzeit');
    voucher(fw, fchapel.id);
    expect(feastBlockReason(fw, fchapel)).toBeNull();
  });

  it('B5: Erntefest spart nur den Rum, Stoff wird abgebucht', () => {
    putBuilding(fw, 0, 'weaver', fchapel.x + 2, fchapel.y + 3);
    home(fw).stock.cloth = 40;
    holdFeast(fw, fchapel.id);
    fw.tick += FEAST_DURATION + 10;
    voucher(fw, fchapel.id);
    const rum = home(fw).stock.rum;
    expect(holdFeast(fw, fchapel.id, 'harvest')).toEqual({ ok: true });
    expect(home(fw).stock.rum).toBe(rum);
    expect(home(fw).stock.cloth).toBe(40 - FEAST_KINDS.harvest.cost.cloth);
  });

  it('B5: Inselsperre der Art gilt weiter, der Gutschein bleibt', () => {
    putBuilding(fw, 0, 'weaver', fchapel.x + 2, fchapel.y + 3);
    home(fw).stock.cloth = 40;
    const other = placeService(fw, 'chapel', fchapel.x + 3, fchapel.y);
    other.feastAt = fw.tick - 10;
    other.feastKind = 'harvest';
    voucher(fw, fchapel.id);
    const r = holdFeast(fw, fchapel.id, 'harvest');
    expect(r.ok).toBe(false);
    expect(voucherAt(fw, fchapel.id)).toBe(true);
  });

  it('AK-BS-10 Erntefest und Taktlohn: kleinerer Zyklus, nicht beide nacheinander', () => {
    const b = putBuilding(fw, 0, 'weaver', fchapel.x + 2, fchapel.y + 3);
    home(fw).stock.cloth = 40;
    expect(holdFeast(fw, fchapel.id, 'harvest')).toEqual({ ok: true });
    const c = BUILDING_DEFS.weaver.cycle!;
    expect(cycleOf(fw, b)).toBe(Math.floor((c * FEAST_KINDS.harvest.cyclePct) / 100));
    fw.petitions.effects = [forever('woolMarket')];
    expect(cycleOf(fw, b)).toBe(Math.floor((c * FEAST_KINDS.harvest.cyclePct) / 100));
  });

  it('Bitgleich: ohne Wirkung bleiben bellActive, voucherAt und Sperren unverändert', () => {
    expect(bellActive(fw, fhouse)).toBe(false);
    expect(voucherAt(fw, fchapel.id)).toBe(false);
    expect(holdFeast(fw, fchapel.id)).toEqual({ ok: true });
    expect(feastBlockReason(fw, fchapel)).toBe('Fest läuft');
  });
});
