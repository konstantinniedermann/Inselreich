import { describe, expect, it } from 'vitest';
import { TAX_LEVELS, TIERS, TIER_IDS } from '../../src/sim/defs/tiers';
import { taxChangeSet } from '../../src/sim/tax';
import { taxPct } from '../../src/sim/townhall';
import { createWorld } from '../../src/sim/world';
import type { Building, GoodId, TaxLevel, Tier, World } from '../../src/sim/types';
import { taxEffect } from '../../src/ui/guide';
import { taxButtonText } from '../../src/ui/hud';
import {
  lockedTierFor,
  taxButtonTitle,
  taxLockText,
  taxMixList,
  taxStatusLine,
  taxSummary,
  taxSummaryText,
  tierTaxPerMinute,
  tierTaxTooltip,
} from '../../src/ui/taxView';
import { setEdict } from '../../src/sim/edicts';
import { placeTownhall } from '../sim/helpers';

type Levels = Record<Tier, TaxLevel>;
const lv = (a: TaxLevel, b: TaxLevel, c: TaxLevel, d: TaxLevel): Levels => ({
  1: a,
  2: b,
  3: c,
  4: d,
});
const LEVELS = Object.keys(TAX_LEVELS) as TaxLevel[];

function hallWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  placeTownhall(w);
  return w;
}

let nextId = 7000;
/** Wohnhaus direkt eingesetzt (ohne Kacheln); `met` bestimmt, ob alle Bedürfnisse erfüllt sind. */
function addHouse(world: World, tier: Tier, inhabitants: number, met: boolean): Building {
  const def = TIERS[tier];
  const satisfied: Partial<Record<GoodId, boolean>> = {};
  for (const g of Object.keys(def.needs) as GoodId[]) satisfied[g] = met;
  const services: Record<string, boolean> = {};
  for (const s of def.services) services[s] = met;
  const id = nextId++;
  const b = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    house: { tier, inhabitants, demand: {}, satisfied, services, satisfiedSince: 0, supplied: met },
  } as Building;
  world.buildings[id] = b;
  return b;
}

const STATES: [string, Levels, 'low' | 'normal' | 'high' | 'mixed'][] = [
  ['alle normal', lv('normal', 'normal', 'normal', 'normal'), 'normal'],
  ['1-3 niedrig, 4 normal', lv('low', 'low', 'low', 'normal'), 'low'],
  ['alle hoch', lv('high', 'high', 'high', 'high'), 'high'],
  ['gemischt', lv('low', 'normal', 'normal', 'high'), 'mixed'],
];

describe('AK-T26 taxSummary', () => {
  it.each(STATES)('%s', (_n, levels, want) => {
    const w = hallWorld();
    w.taxLevels = { ...levels };
    expect(taxSummary(w)).toBe(want);
    expect(taxSummaryText(w)).toBe(want === 'mixed' ? 'gemischt' : TAX_LEVELS[want].name);
    expect(taxButtonText(w)).toBe(`Steuer ${taxSummaryText(w)}`);
    for (const l of LEVELS) expect(taxSummary(w) === l).toBe(taxChangeSet(w, l).length === 0);
  });
  it('gemischt: Knopftext «Steuer gemischt»', () => {
    const w = hallWorld();
    w.taxLevels = lv('low', 'normal', 'normal', 'high');
    expect(taxButtonText(w)).toBe('Steuer gemischt');
  });
});

describe('AK-T27 taxMixList', () => {
  it('Anfangsbuchstabe und Stufenname', () => {
    const w = hallWorld();
    w.taxLevels = lv('low', 'normal', 'normal', 'high');
    expect(taxMixList(w)).toBe('P niedrig · S normal · B normal · K hoch');
  });
});

describe('AK-T28 tierTaxTooltip (Anhang 01 C)', () => {
  const rows: [Tier, TaxLevel, string][] = [
    [1, 'low', '70 % · Aufstieg nach 15 s · 4 Einwohner'],
    [1, 'normal', '100 % · Aufstieg nach 30 s · 4 Einwohner'],
    [1, 'high', '130 % · kein Aufstieg · 3 Einwohner'],
    [2, 'low', '70 % · Aufstieg nach 15 s · 8 Einwohner'],
    [2, 'normal', '100 % · Aufstieg nach 30 s · 8 Einwohner'],
    [2, 'high', '130 % · kein Aufstieg · 6 Einwohner'],
    [3, 'low', '70 % · Aufstieg nach 15 s · 15 Einwohner'],
    [3, 'normal', '100 % · Aufstieg nach 30 s · 15 Einwohner'],
    [3, 'high', '130 % · kein Aufstieg · 11 Einwohner'],
    [4, 'low', 'Kaufleute steigen nicht auf'],
    [4, 'normal', '100 % · 20 Einwohner'],
    [4, 'high', '115 % · 15 Einwohner'],
  ];
  it.each(rows)('Stufe %i %s', (tier, level, want) => {
    expect(tierTaxTooltip(tier, level)).toBe(want);
  });
});

describe('AK-T29 taxEffect (U-1)', () => {
  it('hoch mit Kaufleute-Zusatz', () => {
    expect(taxEffect('high')).toBe(
      'hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt',
    );
  });
  it('niedrig mit Kaufleute-normal-Zusatz (QA-c)', () => {
    expect(taxEffect('low')).toBe(
      'niedrig: 70 % Steuer (Kaufleute normal) · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt',
    );
  });
  it('normal unverändert', () => {
    expect(taxEffect('normal')).toBe(
      'normal: 100 % Steuer · Aufstieg nach 30 s Zufriedenheit · Häuser voll belegt',
    );
  });
});

describe('AK-T30 tierTaxPerMinute (Anhang 01 A, QA-e)', () => {
  const build = (): World => {
    const w = hallWorld();
    w.taxLevels = lv('low', 'normal', 'high', 'high');
    addHouse(w, 1, 4, true);
    addHouse(w, 2, 8, true);
    addHouse(w, 2, 8, false);
    addHouse(w, 3, 11, true);
    addHouse(w, 4, 15, true);
    return w;
  };
  it('aktive Amtsstube: Regler gelten', () => {
    const w = build();
    expect(TIER_IDS.map((t) => tierTaxPerMinute(w, t))).toEqual([33, 504, 1201, 2277]);
  });
  it('Amtsstube ohne Wirkung: wirksamer Wert «normal», Regler bleiben', () => {
    const w = build();
    const hall = Object.values(w.buildings).find((b) => b.defId === 'townhall')!;
    hall.outageUntil = w.tick + 100;
    expect(TIER_IDS.map((t) => tierTaxPerMinute(w, t))).toEqual([48, 504, 924, 1980]);
    expect(w.taxLevels).toEqual(lv('low', 'normal', 'high', 'high'));
  });
  it('Satz kommt aus taxPct', () => {
    expect(taxPct('high', 4)).toBe(115);
  });
});

describe('AK-T31 taxLockText und lockedTierFor', () => {
  it('Rest 200 Ticks → 20 s, ohne Sperre leer', () => {
    const w = hallWorld();
    w.taxLockedUntil[2] = w.tick + 200;
    expect(taxLockText(w, 2)).toBe('wieder änderbar in 20 s');
    expect(taxLockText(w, 1)).toBe('');
  });
  it('lockedTierFor: kleinste gesperrte Stufe in der Änderungsmenge', () => {
    const w = hallWorld();
    w.taxLockedUntil[1] = w.tick + 100;
    w.taxLockedUntil[3] = w.tick + 100;
    expect(lockedTierFor(w, 'high')).toBe(1);
    w.taxLevels[1] = 'high'; // Pioniere schon hoch: nicht in der Menge, obwohl gesperrt
    expect(lockedTierFor(w, 'high')).toBe(3);
    expect(lockedTierFor(w, 'normal')).toBe(1);
  });
  it('ohne Sperre undefined', () => {
    expect(lockedTierFor(hallWorld(), 'high')).toBeUndefined();
  });
});

describe('Statuszeile und Knopf-Tooltip (U-4, U-7)', () => {
  it('einheitlicher Stand: taxEffect(L)', () => {
    const w = hallWorld();
    w.taxLevels = lv('high', 'high', 'high', 'high');
    expect(taxStatusLine(w)).toBe(taxEffect('high'));
    expect(taxButtonTitle(w)).toBe(taxEffect('high'));
  });
  it('gemischt: Liste', () => {
    const w = hallWorld();
    w.taxLevels = lv('low', 'high', 'normal', 'normal');
    expect(taxStatusLine(w)).toBe('Steuer gemischt: P niedrig · S hoch · B normal · K normal');
    expect(taxButtonTitle(w)).toBe('P niedrig · S hoch · B normal · K normal');
  });
  it('ohne aktive Amtsstube: normal', () => {
    const w = createWorld(3);
    w.taxLevels = lv('low', 'high', 'normal', 'normal');
    expect(taxStatusLine(w)).toBe(taxEffect('normal'));
  });
});

describe('M13-E1 Steueranzeige mit Edikt (AK-M13E1-32)', () => {
  const edictHall = (id?: 'saving' | 'trade' | 'welfare'): World => {
    const w = hallWorld();
    w.won = true;
    w.money = 1000;
    for (let i = 0; i < 4; i++) addHouse(w, 4, 20, true);
    if (id) expect(setEdict(w, id).ok).toBe(true);
    return w;
  };
  it('AK-M13E1-32 taxButtonTitle mit Zusatz nur bei wirkendem Edikt', () => {
    const w = edictHall();
    expect(taxButtonTitle(w)).toBe(taxEffect('normal'));
    expect(taxButtonTitle(edictHall('saving'))).toBe(`${taxEffect('normal')} · Edikt: Sparen`);
  });
  it('AK-M13E1-32 tierTaxPerMinute mit Sparen 9820, ohne 10560', () => {
    expect(tierTaxPerMinute(edictHall(), 4)).toBe(10560);
    expect(tierTaxPerMinute(edictHall('saving'), 4)).toBe(9820);
  });
  it('AK-M13E1-32 taxStatusLine mit Punkten', () => {
    expect(taxStatusLine(edictHall('saving'))).toBe(`${taxEffect('normal')} · Edikt −7 Punkte`);
    expect(taxStatusLine(edictHall('welfare'))).toBe(`${taxEffect('normal')} · Edikt −5 Punkte`);
    expect(taxStatusLine(edictHall('trade'))).toBe(taxEffect('normal'));
  });
});
