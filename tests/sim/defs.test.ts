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
} from '../../src/sim/defs/tiers';
import { EFF_MAX, EFF_WINDOW, UPGRADE_DEFICIT_WAIT_FACTOR } from '../../src/sim/defs/timing';
import { SERVICE_BUILDING, SERVICE_IDS } from '../../src/sim/population';

describe('defs', () => {
  it('has 8 goods with buy > sell', () => {
    expect(GOOD_IDS).toHaveLength(9);
    for (const id of GOOD_IDS) expect(GOODS[id].buy).toBeGreaterThan(GOODS[id].sell);
  });
  it('has 14 building defs whose goods exist', () => {
    expect(BUILDING_IDS).toHaveLength(17);
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
    expect(GOOD_IDS).toHaveLength(9);
    expect(GOOD_IDS[GOOD_IDS.length - 1]).toBe('glass');
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
