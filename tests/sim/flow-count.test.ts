import { describe, expect, it, vi } from 'vitest';

const calls = { goodsBalance: 0 };
vi.mock('../../src/sim/flow', async (orig) => {
  const m = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...m,
    goodsBalance: (...args: Parameters<typeof m.goodsBalance>) => {
      calls.goodsBalance++;
      return m.goodsBalance(...args);
    },
  };
});

import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { goodsBalance, producedRate } from '../../src/sim/flow';
import { cycleOf } from '../../src/sim/levels';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { BuildingDefId, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { village } from './helpers';

describe('M11 Budget je Wachstumstakt (Review Focus 3)', () => {
  it('RF-3 tickPopulation rechnet goodsBalance genau einmal je Wachstumstakt, dazwischen nie', () => {
    const { w } = village(3, { unlockAll: true });
    for (let t = 1; t <= 200; t++) {
      const before = calls.goodsBalance;
      step(w);
      expect(calls.goodsBalance - before, `Tick ${t}`).toBe(t % 50 === 0 ? 1 : 0);
    }
  });
});

function add(
  w: World,
  defId: BuildingDefId,
  island: number,
  o: Partial<{ paused: true; connected: boolean }> = {},
) {
  const id = w.nextBuildingId++;
  w.buildings[id] = {
    id,
    defId,
    x: 0,
    y: 0,
    connected: o.connected ?? true,
    progress: 0,
    state: 'ok',
    island,
    ...(o.paused ? { paused: true as const } : {}),
  };
  return w.buildings[id]!;
}

const PRODUCERS = Object.values(BUILDING_DEFS).filter((d) => d.produces && d.cycle !== undefined);

/** Messwelt: Seed 3, je Insel jeder Erzeuger, dazu stillgelegte und nicht angebundene Betriebe, ein Haus. */
function snapshotWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  let i = 0;
  for (let island = 0; island < w.islands.length; island++) {
    for (const d of PRODUCERS) {
      add(w, d.id, island);
      if (i++ % 3 === 0) add(w, d.id, island, { paused: true });
      if (i % 4 === 0) add(w, d.id, island, { connected: false });
    }
  }
  add(w, 'house', 0);
  return w;
}

describe('producedRate (AK-UA3-15)', () => {
  it('0 für Haus, nicht angebundene und stillgelegte Betriebe, sonst 100 / Zyklus', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(producedRate(w, add(w, 'house', 0))).toBe(0);
    expect(producedRate(w, add(w, 'lumberjack', 0, { connected: false }))).toBe(0);
    expect(producedRate(w, add(w, 'lumberjack', 0, { paused: true }))).toBe(0);
    const b = add(w, 'lumberjack', 0);
    expect(producedRate(w, b)).toBe(100 / cycleOf(w, b)!);
  });

  it('0 für Gebäude ohne Zyklus', () => {
    const w = createWorld(3, { unlockAll: true });
    const noCycle = Object.values(BUILDING_DEFS).find(
      (d) => d.id !== 'house' && d.cycle === undefined,
    );
    expect(noCycle).toBeDefined();
    expect(producedRate(w, add(w, noCycle!.id, 0))).toBe(0);
  });
});

/** Vor dem Umbau erhoben (goodsBalance je Insel, Messwelt Seed 3). */
const BALANCE_BEFORE: string =
  '[{"wood":{"produced":3.3333333333333335,"consumed":3.25,"net":0.08333333333333348},"tools":{"produced":1.25,"consumed":0,"net":1.25},"stone":{"produced":1.6666666666666667,"consumed":2,"net":-0.33333333333333326},"food":{"produced":9.5,"consumed":0,"net":9.5},"wool":{"produced":2,"consumed":2,"net":0},"cloth":{"produced":2,"consumed":0,"net":2},"cane":{"produced":2,"consumed":2,"net":0},"rum":{"produced":2,"consumed":0,"net":2},"glass":{"produced":2,"consumed":0,"net":2},"spice":{"produced":2,"consumed":0,"net":2}},{"wood":{"produced":3.3333333333333335,"consumed":3.25,"net":0.08333333333333348},"tools":{"produced":1.25,"consumed":0,"net":1.25},"stone":{"produced":1.6666666666666667,"consumed":2,"net":-0.33333333333333326},"food":{"produced":9.5,"consumed":0,"net":9.5},"wool":{"produced":2,"consumed":2,"net":0},"cloth":{"produced":2,"consumed":0,"net":2},"cane":{"produced":2,"consumed":2,"net":0},"rum":{"produced":2,"consumed":0,"net":2},"glass":{"produced":2,"consumed":0,"net":2},"spice":{"produced":2,"consumed":0,"net":2}},{"wood":{"produced":3.3333333333333335,"consumed":5.25,"net":-1.9166666666666665},"tools":{"produced":1.25,"consumed":0,"net":1.25},"stone":{"produced":3.3333333333333335,"consumed":4,"net":-0.6666666666666665},"food":{"produced":9.5,"consumed":0,"net":9.5},"wool":{"produced":2,"consumed":2,"net":0},"cloth":{"produced":2,"consumed":0,"net":2},"cane":{"produced":2,"consumed":2,"net":0},"rum":{"produced":2,"consumed":0,"net":2},"glass":{"produced":4,"consumed":0,"net":4},"spice":{"produced":2,"consumed":0,"net":2}},{"wood":{"produced":3.3333333333333335,"consumed":3.25,"net":0.08333333333333348},"tools":{"produced":1.25,"consumed":0,"net":1.25},"stone":{"produced":1.6666666666666667,"consumed":2,"net":-0.33333333333333326},"food":{"produced":9.5,"consumed":0,"net":9.5},"wool":{"produced":4,"consumed":2,"net":2},"cloth":{"produced":2,"consumed":0,"net":2},"cane":{"produced":4,"consumed":2,"net":2},"rum":{"produced":2,"consumed":0,"net":2},"glass":{"produced":2,"consumed":0,"net":2},"spice":{"produced":2,"consumed":0,"net":2}}]';

describe('goodsBalance unverändert (AK-UA3-17)', () => {
  it('Messwelt liefert je Insel dieselben Werte wie vor dem Umbau', () => {
    const w = snapshotWorld();
    const all = w.islands.map((_, island) => goodsBalance(w, island));
    expect(JSON.stringify(all)).toBe(BALANCE_BEFORE);
  });
});

describe('Determinismus (AK-UA3-17b)', () => {
  const TICKS = 600;
  const run = (w: World, from: number, to: number): void => {
    for (let t = from; t < to; t++) step(w);
  };
  const fresh = (): World => village(8, { unlockAll: true }).w;
  const final = (w: World): string => JSON.stringify({ w, bal: goodsBalance(w) });

  it('gleicher Seed zweimal gleich, Save/Load nach Tick 300 ändert nichts', () => {
    const a = fresh();
    run(a, 0, TICKS);
    const b = fresh();
    run(b, 0, TICKS);
    expect(final(b)).toBe(final(a));
    const c = fresh();
    run(c, 0, 300);
    const loaded = deserialize(serialize(c));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    run(loaded.world, 300, TICKS);
    expect(final(loaded.world)).toBe(final(a));
    expect(GOOD_IDS.length).toBeGreaterThan(0);
  }, 20_000);
});
