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
import { createWorld, home } from '../../src/sim/world';
import { demolish } from '../../src/sim/build';
import { answerPetition, PETITION_REASONS, tickPetitions } from '../../src/sim/petitions';
import { step, type StepReport } from '../../src/sim/tick';
import { houseNearKontor, placeService, setHouse, village } from './helpers';

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
