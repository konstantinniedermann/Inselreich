import { beforeEach, describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis } from '../../src/sim/crises';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { START_STOCK } from '../../src/sim/defs/goods';
import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { createWorld, idx, home } from '../../src/sim/world';
import { forceRect, putBuilding } from './helpers';
import { foundKontor2Literal, seaWorld } from './seaHelpers';

const T = CRISIS_FIRST_TICK;
let w: World;
let ids: Record<'fisher' | 'lumberjack' | 'weaver' | 'quarry', number>;

/** Seed 3, normal: Fischer (Wasser westlich), Holzfäller (Wald), Weberei mit Wolle, Steinbruch am Berg; Tick T. */
beforeEach(() => {
  w = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  const [kx, ky] = [k.x, k.y];
  forceRect(w, kx + 2, ky - 3, 14, 7, 'grass');
  forceRect(w, kx + 8, ky - 3, 1, 3, 'water');
  forceRect(w, kx + 12, ky - 3, 1, 2, 'forest');
  home(w).tiles[idx(home(w), kx + 7, ky + 2)]!.terrain = 'mountain';
  w.money = 1_000_000;
  for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
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
  home(w).stock = { ...START_STOCK, wool: 50 };
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
    expect(home(w).stock).toEqual(home(twin).stock);
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
    const s0 = { ...home(w).stock };
    const t0 = { ...home(twin).stock };
    run(w, 300);
    run(twin, 300);
    expect(home(w).stock.food - s0.food).toBe(3);
    expect(home(twin).stock.food - t0.food).toBe(7);
    expect(b(w, 'fisher').progress).toBe(30);
    expect(home(w).stock.wood - s0.wood).toBe(5);
    expect(home(twin).stock.wood - t0.wood).toBe(10);
    expect([home(w).stock.cloth, home(w).stock.stone, home(w).stock.wool]).toEqual([
      home(twin).stock.cloth,
      home(twin).stock.stone,
      home(twin).stock.wool,
    ]);
    expect(b(w, 'weaver').progress).toBe(b(twin, 'weaver').progress);
    expect(b(w, 'quarry').progress).toBe(b(twin, 'quarry').progress);
  });

  it('AK-S3-01 (M11 S2) sturmanfällig genau fisher, lumberjack, sheepfarm, canefarm, cattlefarm', () => {
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].stormAffected === true).sort()).toEqual([
      'canefarm',
      'cattlefarm',
      'fisher',
      'lumberjack',
      'sheepfarm',
      'spicefarm', // M12 T02
    ]);
  });
});

describe('M12 E2 Sturm auf fernen Inseln (AK-E2-08)', () => {
  it('halbiert die Produktion eines sturmanfälligen Betriebs auf Insel 2', () => {
    const s = seaWorld();
    const k2 = foundKontor2Literal(s, 2);
    const f = putBuilding(s, 2, 'fisher', k2.x + 4, k2.y);
    const twin = JSON.parse(serialize(s)) as World;
    s.tick = twin.tick = T;
    beginCrisis(s, 0, { kind: 'storm' });
    for (let i = 0; i < 200; i++) {
      step(s);
      step(twin);
    }
    f.progress = 0;
    twin.buildings[f.id]!.progress = 0;
    const before = [s.islands[2]!.stock.food, twin.islands[2]!.stock.food];
    for (let i = 0; i < 300; i++) {
      step(s);
      step(twin);
    }
    expect(s.islands[2]!.stock.food - before[0]!).toBe(3);
    expect(twin.islands[2]!.stock.food - before[1]!).toBe(7);
  });
});
