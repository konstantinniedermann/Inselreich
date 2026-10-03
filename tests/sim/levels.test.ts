import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { cycleOf, upkeepOf, utilization } from '../../src/sim/levels';
import type { Building, BuildingDefId } from '../../src/sim/types';

const at = (defId: BuildingDefId, extra: Partial<Building> = {}): Building =>
  ({ id: 1, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok', ...extra }) as Building;

describe('M11 Naht cycleOf/upkeepOf (Spec 3.1, Anhang 01 C)', () => {
  it('AK-P1-13 ohne level liefern cycleOf/upkeepOf def.cycle/def.upkeep für jedes Gebäude (Fischer 40/5)', () => {
    for (const id of BUILDING_IDS) {
      expect(cycleOf(at(id)), id).toBe(BUILDING_DEFS[id].cycle); // undefined ohne Zyklus
      expect(upkeepOf(at(id)), id).toBe(BUILDING_DEFS[id].upkeep);
      expect(utilization(at(id)), id).toBe(BUILDING_DEFS[id].produces ? 1000 : null);
    }
    expect([cycleOf(at('fisher')), upkeepOf(at('fisher'))]).toEqual([40, 5]);
    expect([0, 94208, 256000].map((eff) => utilization(at('fisher', { eff })))).toEqual([
      0, 368, 1000,
    ]);
  });
});
