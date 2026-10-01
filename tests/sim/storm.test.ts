import { beforeEach, describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis } from '../../src/sim/crises';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { START_STOCK } from '../../src/sim/defs/goods';
import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { createWorld, idx } from '../../src/sim/world';
import { forceRect } from './helpers';

const T = CRISIS_FIRST_TICK;
let w: World;
let ids: Record<'fisher' | 'lumberjack' | 'weaver' | 'quarry', number>;

/** Seed 3, normal: Fischer (Wasser westlich), Holzfäller (Wald), Weberei mit Wolle, Steinbruch am Berg; Tick T. */
beforeEach(() => {
  w = createWorld(3, { crisisLevel: 'normal' });
  const k = w.buildings[w.kontorId]!;
  const [kx, ky] = [k.x, k.y];
  forceRect(w, kx + 2, ky - 3, 14, 7, 'grass');
  forceRect(w, kx + 8, ky - 3, 1, 3, 'water');
  forceRect(w, kx + 12, ky - 3, 1, 2, 'forest');
  w.tiles[idx(w, kx + 7, ky + 2)]!.terrain = 'mountain';
  w.money = 1_000_000;
  for (const g of Object.keys(w.stock) as GoodId[]) w.stock[g] = 100;
  for (let x = kx + 2; x <= kx + 13; x++) expect(placeRoad(w, x, ky).ok).toBe(true);
  const put = (defId: BuildingDefId, x: number, y: number): number => {
    const r = placeBuilding(w, defId, x, y);
    expect(r.ok, defId).toBe(true);
    return r.id!;
  };
  ids = {
    fisher: put('fisher', kx + 9, ky - 1),
    lumberjack: put('lumberjack', kx + 12, ky - 1),
    weaver: put('weaver', kx + 3, ky + 1),
    quarry: put('quarry', kx + 7, ky + 1),
  };
  w.stock = { ...START_STOCK, wool: 50 };
  w.money = 10_000;
  w.tick = T;
});

const clone = (x: World): World => JSON.parse(serialize(x)) as World;
const run = (x: World, n: number): void => {
  for (let i = 0; i < n; i++) step(x);
};
const b = (x: World, key: keyof typeof ids): Building => x.buildings[ids[key]]!;

describe('M6 Sturm', () => {
  it('AK-S3-02 Vorwarnung wirkungslos (Schritte T+1 … T+200)', () => {
    const twin = clone(w);
    beginCrisis(w, 0, { kind: 'storm' });
    run(w, 200);
    run(twin, 200);
    expect(w.stock).toEqual(twin.stock);
    for (const key of Object.keys(ids) as (keyof typeof ids)[])
      expect(b(w, key).progress, key).toBe(b(twin, key).progress);
  });

  it('AK-S3-01 halbe Leistung der sturmanfälligen Betriebe über 300 Schritte', () => {
    const twin = clone(w);
    beginCrisis(w, 0, { kind: 'storm' });
    run(w, 200);
    run(twin, 200);
    for (const x of [w, twin]) {
      b(x, 'fisher').progress = 0;
      b(x, 'lumberjack').progress = 0;
    }
    const s0 = { ...w.stock };
    const t0 = { ...twin.stock };
    run(w, 300);
    run(twin, 300);
    expect(w.stock.food - s0.food).toBe(3);
    expect(twin.stock.food - t0.food).toBe(7);
    expect(b(w, 'fisher').progress).toBe(30);
    expect(w.stock.wood - s0.wood).toBe(5);
    expect(twin.stock.wood - t0.wood).toBe(10);
    expect([w.stock.cloth, w.stock.stone, w.stock.wool]).toEqual([
      twin.stock.cloth,
      twin.stock.stone,
      twin.stock.wool,
    ]);
    expect(b(w, 'weaver').progress).toBe(b(twin, 'weaver').progress);
    expect(b(w, 'quarry').progress).toBe(b(twin, 'quarry').progress);
  });

  it('AK-S3-01 sturmanfällig genau fisher, lumberjack, sheepfarm, canefarm', () => {
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].stormAffected === true).sort()).toEqual([
      'canefarm',
      'fisher',
      'lumberjack',
      'sheepfarm',
    ]);
  });
});
