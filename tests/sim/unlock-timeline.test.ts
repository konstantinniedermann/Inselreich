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
  // M11 R185/R187, gemessen auf 7363cb0 mit
  // `VITE_BALANCE_LOG=1 npx vitest run tests/sim/unlock-timeline.test.ts --silent=false`;
  // vorher off 3850/6050/3700, normal 4750/7050/4600. Schul-Bauticks: Neupin mit Beleg.
  const cases = [
    { level: 'off' as const, fire: false, u5: 4150, u6: 6750, school: 4000 },
    { level: 'normal' as const, fire: true, u5: 5150, u6: 7850, school: 5000 },
  ];
  for (const c of cases)
    it(`AK-B1-01 Krisen ${c.level}: Freischalt- und Bauticks exakt, kein Bau vor seiner Freischaltung (M11 S10)`, () => {
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

describe('M11 Freischalt-Ticks (M-11)', () => {
  it('AK-BAS-03 off 150/350/550/4150/6750; normal …/5150/7850; mild …/4250/7850', () => {
    const early = { U2: 150, U3: 350, U4: 550 };
    expect(timeline('off', false).unlock).toMatchObject({ ...early, U5: 4150, U6: 6750 });
    expect(timeline('normal', true).unlock).toMatchObject({ ...early, U5: 5150, U6: 7850 });
    expect(timeline('mild', false).unlock).toMatchObject({ ...early, U5: 4250, U6: 7850 });
  });
});
