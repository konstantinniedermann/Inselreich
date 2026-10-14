import { describe, expect, it } from 'vitest';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../../src/sim/defs/goods';
import {
  ISLANDS,
  ROUTE_GOODS_PER_DIRECTION,
  SHIP,
  SHIP_TICKS_PER_SEA_TILE,
} from '../../src/sim/defs/sea';
import { FAR_ORDER_DURATION, ORDER_DURATION, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { orderUnitReward } from '../../src/sim/orders';
import { laneTicks } from '../../src/sim/islands';
import { createWorld } from '../../src/sim/world';

const FAR_GOODS = GOOD_IDS.filter((g) => GOODS[g].order?.far !== undefined);

describe('Handel 2 Defs (AK-H2-25)', () => {
  it('Werte wörtlich: Frist 1700, Stoff 20, Rum 15, Glas 12, sonst kein order.far', () => {
    expect(FAR_ORDER_DURATION).toBe(1700);
    expect(FAR_GOODS).toEqual(['cloth', 'rum', 'glass']);
    expect([GOODS.cloth.order!.far, GOODS.rum.order!.far, GOODS.glass.order!.far]).toEqual([
      20, 15, 12,
    ]);
  });
  it.each(FAR_GOODS)('Invarianten je Fern-Gut %s (Spec §6)', (g) => {
    const far = GOODS[g].order!.far!;
    expect(orderUnitReward(g)).toBeLessThan(0.8 * GOODS[g].buy);
    expect(far * orderUnitReward(g)).toBeGreaterThanOrEqual(440);
    expect(far * orderUnitReward(g)).toBeLessThanOrEqual(450);
    expect(Number.isInteger(far) && far >= 1).toBe(true);
    expect(far).toBeLessThanOrEqual(Math.floor(SHIP.capacity / ROUTE_GOODS_PER_DIRECTION));
    expect(far).toBeLessThanOrEqual(STORAGE_CAP);
  });
  it('jedes prefers-Gut hat order.far; Frist-Invariante', () => {
    for (const d of ISLANDS) for (const g of d.prefers) expect(GOODS[g].order?.far).toBeDefined();
    const dMax = Math.max(...ISLANDS.map((d) => d.dMax));
    expect(ORDER_DURATION + 2 * SHIP_TICKS_PER_SEA_TILE * dMax).toBeLessThanOrEqual(
      FAR_ORDER_DURATION,
    );
    expect(FAR_ORDER_DURATION).toBeLessThanOrEqual(2 * ORDER_PERIOD - 1);
  });
});

/** Gemessen in T01, wiederverwendet in T06 AK-H2-27. Reihenfolge Möweninsel (A), Felsbucht (B), Weidenau (C). */
const SEED3_LANES = { A: 260, B: 390, C: 310 };

describe('Seed 3 Seewege (AK-H2-27 Pin, A1)', () => {
  it('dMin ≤ d ≤ dMax je Fremdinsel und laneTicks gepinnt', () => {
    const w = createWorld(3);
    for (const kind of ['A', 'B', 'C'] as const) {
      const i = w.islands.findIndex((x) => x.kind === kind);
      const def = ISLANDS.find((d) => d.kind === kind)!;
      const lt = laneTicks(w.islands, 0, i);
      const d = lt / SHIP_TICKS_PER_SEA_TILE;
      expect(d).toBeGreaterThanOrEqual(def.dMin);
      expect(d).toBeLessThanOrEqual(def.dMax);
      expect(lt).toBe(SEED3_LANES[kind]);
    }
  });
});
