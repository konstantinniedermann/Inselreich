import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import type { BuildingDefId, CrisisLevel, UnlockId, World } from '../../src/sim/types';
import { entryOfBuilding } from '../../src/sim/unlocks';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

interface Timeline {
  unlock: Partial<Record<UnlockId, number>>;
  build: Partial<Record<BuildingDefId, number>>;
  winTick: number | null;
}

/** Controller-Lauf ohne Eingriff; protokolliert über den stop-Rückruf (immer false) nach jedem Schritt. */
function timeline(level: CrisisLevel, fireStation: boolean): Timeline {
  const w = createWorld(3, { crisisLevel: level });
  const tl: Timeline = { unlock: {}, build: {}, winTick: null };
  const record = (x: World, placedAt: number): boolean => {
    for (const id of x.unlocked) tl.unlock[id] ??= x.tick;
    for (const b of Object.values(x.buildings)) tl.build[b.defId] ??= placedAt;
    return false;
  };
  const { layout, t } = startColony(w);
  record(w, 0);
  // Gebäude aus control() bei Tick T sieht der Rückruf nach dem Schritt T+1: Bautick = tick − 1 (Spec 9.3)
  runColony(w, layout, t, { fireStation }, (x) => record(x, x.tick - 1));
  tl.winTick = t.winTick;
  if (import.meta.env.VITE_BALANCE_LOG) console.log(level, JSON.stringify(tl));
  return tl;
}

describe('M10 Freischalt-Ticks Seed 3 (Spec 9.3)', () => {
  const cases = [
    { level: 'off' as const, fire: false, u5: 3850, u6: 6050, school: 3700 },
    { level: 'normal' as const, fire: true, u5: 4750, u6: 7050, school: 4600 },
  ];
  for (const c of cases)
    it(`AK-B1-01 Krisen ${c.level}: Freischalt- und Bauticks exakt, kein Bau vor seiner Freischaltung`, () => {
      const tl = timeline(c.level, c.fire);
      expect(tl.unlock).toMatchObject({ U0: 0, U2: 150, U3: 350, U4: 550, U5: c.u5, U6: c.u6 });
      expect(tl.unlock.U1).toBeUndefined();
      expect(tl.winTick).toBe(c.u6);
      for (const id of ['chapel', 'sheepfarm', 'weaver'] as const) expect(tl.build[id]).toBe(200);
      for (const id of ['school', 'canefarm', 'distillery'] as const)
        expect(tl.build[id]).toBe(c.school);
      for (const id of BUILDING_IDS) {
        const e = entryOfBuilding(id);
        if (e === null || tl.build[id] === undefined) continue;
        expect(tl.build[id]!, id).toBeGreaterThanOrEqual(tl.unlock[e.id]!);
      }
    });
});
