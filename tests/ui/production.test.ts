import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/flow';
import { cycleOf } from '../../src/sim/levels';
import type { BuildingDefId, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { goodProductionPer100 } from '../../src/ui/production';

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

function mixedWorld(seed: number): World {
  const w = createWorld(seed, { unlockAll: true });
  const n = w.islands.length;
  let i = 0;
  for (let island = 0; island < n; island++) {
    for (const d of PRODUCERS) {
      add(w, d.id, island);
      if (i++ % 3 === 0) add(w, d.id, island, { paused: true });
      if (i % 4 === 0) add(w, d.id, island, { connected: false });
    }
  }
  add(w, 'house', 0); // Häuser zählen nicht
  return w;
}

describe('goodProductionPer100 (I-088, R611)', () => {
  it.each([3, 7, 11])('gleich goodsBalance().produced, Welt %i, alle Inseln und Güter', (seed) => {
    const w = mixedWorld(seed);
    for (let island = 0; island < w.islands.length; island++) {
      const bal = goodsBalance(w, island);
      for (const g of GOOD_IDS) expect(goodProductionPer100(w, island, g)).toBe(bal[g].produced);
    }
  });

  it('deckt mindestens eine Trait-Insel mit verkürztem Zyklus ab', () => {
    const w = mixedWorld(3);
    const hit = w.islands.some((_, island) =>
      PRODUCERS.some((d) => {
        const b = add(w, d.id, island);
        const faster = cycleOf(w, b)! < d.cycle!;
        delete w.buildings[b.id];
        return faster;
      }),
    );
    expect(hit).toBe(true);
  });

  it('stillgelegt, unangebunden, fremde Insel und Häuser zählen nicht', () => {
    const w = createWorld(3, { unlockAll: true });
    add(w, 'lumberjack', 0, { paused: true });
    add(w, 'lumberjack', 0, { connected: false });
    add(w, 'lumberjack', 1);
    add(w, 'house', 0);
    expect(goodProductionPer100(w, 0, 'wood')).toBe(0);
    add(w, 'lumberjack', 0);
    expect(goodProductionPer100(w, 0, 'wood')).toBe(100 / BUILDING_DEFS.lumberjack.cycle!);
  });
});
