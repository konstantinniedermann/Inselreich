import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST } from '../../src/sim/defs/buildings';
import { GOODS, GOOD_IDS, START_STOCK } from '../../src/sim/defs/goods';
import {
  TAX_CARRY_DIVISOR,
  TAX_UNIT,
  TIERS,
  UNSATISFIED_TAX_FACTOR,
  WIN_CITIZENS,
  WIN_MERCHANTS,
  WIN_SPICE_HOLD,
  WIN_SPICE_MERCHANTS,
} from '../../src/sim/defs/tiers';
import { EFF_MAX, EFF_WINDOW, UPGRADE_DEFICIT_WAIT_FACTOR } from '../../src/sim/defs/timing';
import { LEVELS } from '../../src/sim/defs/levels';
import { SERVICE_BUILDING, SERVICE_IDS } from '../../src/sim/population';
import { sellPrice } from '../../src/sim/trade';
import type { GoodId } from '../../src/sim/types';
import { ROUTE_GOODS_PER_DIRECTION, ROUTE_RESERVE, SHIP, SHIP_MAX } from '../../src/sim/defs/sea';
import { createWorld } from '../../src/sim/world';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('defs', () => {
  // Bewusst geändert (M12 Seefahrt T01, R226 F-03): 9 → 10 Güter, Gewürz ist das zehnte.
  it('has 10 goods with buy > sell', () => {
    expect(GOOD_IDS).toHaveLength(10);
    for (const id of GOOD_IDS) expect(GOODS[id].buy).toBeGreaterThan(GOODS[id].sell);
  });
  it('has 14 building defs whose goods exist (M11 S2)', () => {
    expect(BUILDING_IDS).toHaveLength(21); // bewusst, M12 T02: kontor2, spicefarm
    for (const id of BUILDING_IDS) {
      const d = BUILDING_DEFS[id];
      expect(d.id).toBe(id);
      if (d.produces) expect(GOODS[d.produces]).toBeDefined();
      for (const g of d.consumes ?? []) expect(GOODS[g]).toBeDefined();
      if (d.produces) expect(d.cycle).toBeGreaterThan(0);
    }
    expect(ROAD_COST).toBe(5);
  });
  it('matches the spec values for a few buildings', () => {
    expect(BUILDING_DEFS.fisher).toMatchObject({
      w: 1,
      h: 1,
      cycle: 40,
      produces: 'food',
      upkeep: 5,
    });
    expect(BUILDING_DEFS.distillery).toMatchObject({
      consumes: ['cane'],
      produces: 'rum',
      cost: { money: 250, wood: 15, tools: 4, stone: 5 },
    });
    expect(BUILDING_DEFS.toolmaker).toMatchObject({
      name: 'Werkzeugmacher',
      w: 2,
      h: 2,
      cost: { money: 200, wood: 15, tools: 3, stone: 0 },
      upkeep: 25,
      category: 'production',
      consumes: ['wood'],
      produces: 'tools',
      cycle: 80,
      site: [],
    });
    expect(BUILDING_DEFS.chapel).toMatchObject({ service: 'faith', serviceRadius: 10 });
    expect(BUILDING_DEFS.market.supplyRadius).toBe(8);
    expect(BUILDING_DEFS.kontor.supplyRadius).toBe(8);
  });
  it('tiers escalate', () => {
    expect(TIERS[1]).toMatchObject({
      maxInhabitants: 4,
      tax: 2,
      needs: { food: 0.5 },
      services: [],
    });
    expect(TIERS[2]).toMatchObject({
      maxInhabitants: 8,
      tax: 7,
      needs: { food: 0.5, cloth: 0.2 },
      services: ['faith'],
    });
    expect(TIERS[3]).toMatchObject({
      maxInhabitants: 15,
      tax: 14,
      needs: { food: 0.5, cloth: 0.2, rum: 0.2 },
      services: ['faith', 'school'],
      upgradeCost: { money: 600, wood: 15, tools: 8, stone: 10 },
    });
    expect(TIERS[2].upgradeCost).toEqual({ money: 300, wood: 10, tools: 5, stone: 5 });
  });
});

describe('M8 defs', () => {
  it('AK-S1-01 Stufe 4, Hebel, Glas, Badehaus und Dienst bath laut Spec 4.5', () => {
    expect(TIERS[3].upgradeCost).toEqual({ money: 600, wood: 15, tools: 8, stone: 10 });
    expect(TIERS[4]).toEqual({
      tier: 4,
      name: 'Kaufleute',
      maxInhabitants: 20,
      needs: { food: 0.5, cloth: 0.2, rum: 0.2, glass: 0.1 },
      services: ['faith', 'school', 'bath'],
      tax: 20,
      upgradeCost: null,
      requiresWin: true,
      unlockCitizens: null,
    });
    for (const t of [1, 2, 3] as const) expect(TIERS[t].requiresWin).toBeUndefined();
    expect(WIN_MERCHANTS).toBe(60);
    const lever = TIERS[4].unlockCitizens ?? null;
    expect(
      lever === null || (Number.isInteger(lever) && lever >= 1 && lever <= WIN_CITIZENS - 1),
    ).toBe(true);
    expect(GOODS.glass).toEqual({
      id: 'glass',
      name: 'Glas',
      buy: 50,
      sell: 20,
      order: { tier: 4, min: 4, max: 8 },
    });
    // Bewusst geändert (R226 F-03): Glas war das letzte Gut, jetzt steht Gewürz am Ende.
    expect(GOOD_IDS).toHaveLength(10);
    expect(GOOD_IDS[8]).toBe('glass');
    expect(GOOD_IDS[GOOD_IDS.length - 1]).toBe('spice');
    expect(START_STOCK.glass).toBe(0);
    const bath = BUILDING_DEFS.bathhouse;
    expect(bath).toMatchObject({
      name: 'Badehaus',
      w: 2,
      h: 2,
      cost: { money: 500, wood: 30, tools: 10, stone: 20 },
      upkeep: 30,
      category: 'public',
      service: 'bath',
      serviceRadius: 10,
      site: [],
      flammable: true,
    });
    expect(bath.stormAffected).toBeUndefined();
    expect(SERVICE_BUILDING.bath).toBe('bathhouse');
    expect(SERVICE_IDS).toEqual(['faith', 'school', 'bath']);
  });
});

describe('M11 Werte P1 (Anhang 01 A.1, A.2)', () => {
  it('AK-P1-01 TAX_UNIT 2, UNSATISFIED_TAX_FACTOR 0,5, TAX_CARRY_DIVISOR 20 000, Faktor 2, EFF 256/1000', () => {
    expect([TAX_UNIT, UNSATISFIED_TAX_FACTOR, TAX_CARRY_DIVISOR]).toEqual([2, 0.5, 20000]);
    expect([UPGRADE_DEFICIT_WAIT_FACTOR, EFF_WINDOW, EFF_MAX]).toEqual([2, 256, 1000]);
  });
});

describe('M11 Jagdhütte und Rinderfarm (Spec 3.3)', () => {
  it('AK-P2S2-01 Felder wie Spec 3.3, Reihenfolge nach fisher, Geld je Einwohner, Nahrungspreis', () => {
    expect(BUILDING_DEFS.hunter).toEqual({
      id: 'hunter',
      name: 'Jagdhütte',
      w: 1,
      h: 1,
      cost: { money: 50, wood: 2, tools: 1, stone: 0 },
      upkeep: 5,
      category: 'production',
      flammable: true,
      produces: 'food',
      cycle: 50,
      site: [{ kind: 'radius', terrain: 'forest', radius: 3, min: 10, free: true }],
    });
    expect(BUILDING_DEFS.cattlefarm).toEqual({
      id: 'cattlefarm',
      name: 'Rinderfarm',
      w: 2,
      h: 2,
      cost: { money: 250, wood: 15, tools: 3, stone: 0 },
      upkeep: 10,
      category: 'production',
      flammable: true,
      stormAffected: true,
      produces: 'food',
      cycle: 20,
      site: [{ kind: 'radius', terrain: 'grass', radius: 3, min: 16, free: true }],
    });
    expect(BUILDING_IDS.slice(3, 6)).toEqual(['fisher', 'hunter', 'cattlefarm']);
    const perEw = (id: 'fisher' | 'hunter' | 'cattlefarm') => {
      const d = BUILDING_DEFS[id];
      const ew = 100 / d.cycle! / 0.5; // Einwohner je Bau (Anhang 01 A.3)
      return d.cost.money / ew + (d.upkeep * 60) / ew;
    };
    const v = [perEw('fisher'), perEw('hunter'), perEw('cattlefarm')];
    expect(v).toEqual([80, 87.5, 85]);
    expect(Math.max(...v)).toBeLessThanOrEqual(1.1 * Math.min(...v));
    // Unterhalt je Nahrung: 2,0 / 2,5 / 2,0 (Spec-Widerspruch zu "sell <", siehe Risiken T04b): Werte pinnen
    const per = (id: 'fisher' | 'hunter' | 'cattlefarm') =>
      BUILDING_DEFS[id].upkeep / (100 / BUILDING_DEFS[id].cycle!);
    expect([per('fisher'), per('hunter'), per('cattlefarm')]).toEqual([2, 2.5, 2]);
    expect(GOODS.food.sell).toBe(3);
    // Grenzgewinn je Nahrung: Verkaufspreis minus Unterhalt je Einheit > 0, je Quelle
    for (const id of ['fisher', 'hunter', 'cattlefarm'] as const)
      expect(GOODS.food.sell - per(id), id).toBeGreaterThan(0);
    // Sättigung: 100 Einheiten bringen weniger als der Listenpreis (3 x 100 = 300 ohne Sättigung)
    const w = createWorld(1);
    expect(sellPrice(w, 'food', 100)).toBe(164);
    expect(sellPrice(w, 'food', 100)).toBeLessThan(200);
  });
});

describe('M11 Ausbau-Werte (Spec 3.6)', () => {
  // Die übrigen neun Einträge prüft der Vorstufen-Test in upgrade.test.ts wörtlich.
  it('AK-P3-01 LEVELS hat genau die 11 Betriebe mit produces, Werte Anhang 01 A.4, ganzzahlig, Stufe 3 schneller', () => {
    const producers = BUILDING_IDS.filter((id) => BUILDING_DEFS[id].produces !== undefined).sort();
    expect(producers).toHaveLength(11);
    expect(Object.keys(LEVELS).sort()).toEqual(producers);
    const T = (
      c: number,
      u: number,
      m: number,
      h: number,
      w: number,
      s: number,
      g: GoodId,
      a: number,
    ) => ({
      cycle: c,
      upkeep: u,
      cost: { money: m, wood: h, tools: w, stone: s },
      fee: { good: g, amount: a },
    });
    expect(LEVELS.hunter).toEqual([
      T(30, 7, 25, 1, 1, 0, 'cloth', 2),
      T(20, 9, 38, 2, 1, 0, 'rum', 2),
    ]);
    expect(LEVELS.cattlefarm).toEqual([
      T(12, 13, 125, 8, 2, 0, 'cloth', 3),
      T(8, 17, 188, 12, 3, 0, 'rum', 3),
    ]);
    for (const id of producers) {
      const [s2, s3] = LEVELS[id]!;
      for (const n of [
        s2.cycle,
        s2.upkeep,
        s3.cycle,
        s3.upkeep,
        ...Object.values(s2.cost),
        ...Object.values(s3.cost),
      ])
        expect(Number.isInteger(n), id).toBe(true);
      expect(s3.cycle, id).toBeLessThan(s2.cycle);
      expect([s2.fee.good, s3.fee.good], id).toEqual(['cloth', 'rum']);
    }
  });
});

describe('AK-E3-01 Gewürz (M12 Seefahrt T01)', () => {
  it('erste neun Güter unverändert, Gewürz am Ende', () => {
    expect(GOOD_IDS.slice(0, 9)).toEqual([
      'wood',
      'tools',
      'stone',
      'food',
      'wool',
      'cloth',
      'cane',
      'rum',
      'glass',
    ]);
    expect(GOOD_IDS[9]).toBe('spice');
  });
  it('GOODS.spice 40/12 ohne order, Startbestand 0', () => {
    expect(GOODS.spice).toEqual({ id: 'spice', name: 'Gewürz', buy: 40, sell: 12 });
    expect(START_STOCK.spice).toBe(0);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('M12 Seefahrt Werte (T02)', () => {
  it('AK-E3-01 spicefarm: Kosten, Takt, Unterhalt, Eigenschaften', () => {
    expect(BUILDING_DEFS.spicefarm).toMatchObject({
      name: 'Gewürzplantage',
      w: 2,
      h: 2,
      cost: { money: 200, wood: 12, tools: 3, stone: 0 },
      cycle: 50,
      upkeep: 15,
      produces: 'spice',
      flammable: true,
      stormAffected: true,
      site: [
        { kind: 'radius', terrain: 'grass', radius: 2, min: 4 },
        { kind: 'islandTrait', trait: 'spice' },
      ],
    });
  });
  it('AK-E2-09 kontor2: Kosten, Unterhalt, Versorgungsradius, Platzregeln', () => {
    expect(BUILDING_DEFS.kontor2).toMatchObject({
      name: 'Kontor',
      w: 2,
      h: 2,
      cost: { money: 800, wood: 20, tools: 8, stone: 10 },
      upkeep: 10,
      supplyRadius: 8,
      site: [...BUILDING_DEFS.kontor.site, { kind: 'foreignNoKontor' }],
    });
  });
  it('AK-E2-09 Schiff und Routen', () => {
    expect(SHIP).toEqual({
      cost: { money: 1200, wood: 25, tools: 10, stone: 0 },
      upkeep: 15,
      capacity: 50,
    });
    expect(SHIP_MAX).toBe(4);
    expect(ROUTE_GOODS_PER_DIRECTION).toBe(2);
    expect(ROUTE_RESERVE).toEqual({ default: 10, step: 10, max: 90 });
  });
  it('AK-Z3-01 Gewürzstadt-Ziel steht in den Defs', () => {
    expect(WIN_SPICE_MERCHANTS).toBe(80);
    expect(WIN_SPICE_HOLD).toBe(600);
  });
  it('AK-Z3-01 kein Literal 80 oder 600 ausserhalb der Defs in Dateien zum Gewürzziel', () => {
    const files = [...sourceFiles('src/sim'), ...sourceFiles('src/ui')].filter(
      (f) => !f.includes('/defs/'),
    );
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (!/wonSpice|WIN_SPICE/.test(text)) continue;
      expect(/\b(80|600)\b/.test(text), f).toBe(false);
    }
  });
});
