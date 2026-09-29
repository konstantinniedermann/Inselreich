import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST } from '../../src/sim/defs/buildings';
import { GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { TIERS } from '../../src/sim/defs/tiers';

describe('defs', () => {
  it('has 8 goods with buy > sell', () => {
    expect(GOOD_IDS).toHaveLength(8);
    for (const id of GOOD_IDS) expect(GOODS[id].buy).toBeGreaterThan(GOODS[id].sell);
  });
  it('has 12 building defs whose goods exist', () => {
    expect(BUILDING_IDS).toHaveLength(12);
    for (const id of BUILDING_IDS) {
      const d = BUILDING_DEFS[id];
      expect(d.id).toBe(id);
      if (d.produces) expect(GOODS[d.produces]).toBeDefined();
      if (d.consumes) expect(GOODS[d.consumes]).toBeDefined();
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
      consumes: 'cane',
      produces: 'rum',
      cost: { money: 250, wood: 15, tools: 4, stone: 5 },
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
    expect(TIERS[2]).toMatchObject({ maxInhabitants: 8, tax: 3, services: ['faith'] });
    expect(TIERS[3]).toMatchObject({
      maxInhabitants: 15,
      tax: 5,
      services: ['faith', 'school'],
      upgradeCost: null,
    });
    expect(TIERS[2].upgradeCost).toEqual({ money: 300, wood: 10, tools: 5, stone: 5 });
  });
});
