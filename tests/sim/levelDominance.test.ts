import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOODS } from '../../src/sim/defs/goods';
import { LEVELS } from '../../src/sim/defs/levels';
import type { BuildingDefId, Cost, GoodId } from '../../src/sim/types';

/** Wert in Geld: Geld plus Menge mal Einkaufspreis (Holz, Werkzeug, Stein, Ware). */
function wert(cost: Cost, extra?: { good: GoodId; amount: number }): number {
  return (
    cost.money +
    cost.wood * GOODS.wood.buy +
    cost.tools * GOODS.tools.buy +
    cost.stone * GOODS.stone.buy +
    (extra ? extra.amount * GOODS[extra.good].buy : 0)
  );
}

// Kontrolle gegen Rechnung (e2), nicht als Assertion: Fischer Stufe 2 M ca. +27, Glashütte Stufe 2 ca. +42 (+-1).
describe('AK-AL-49 Dominanz-Wächter Stufe 2/3: Ausbau schlägt Zweitbau', () => {
  const cases = Object.entries(LEVELS).flatMap(([id, lv]) =>
    lv!.map((_, i) => ({ id: id as BuildingDefId, stufe: i + 2 })),
  );
  it.each(cases)('$id Stufe $stufe: M > 0', ({ id, stufe }) => {
    const lv = LEVELS[id]!;
    const l = lv[stufe - 2]!;
    const c1 = BUILDING_DEFS[id].cycle!;
    const vor = stufe === 2 ? c1 : lv[0]!.cycle;
    const n = c1 / l.cycle - c1 / vor;
    const m = wert(l.cost, l.extra) - n * wert(BUILDING_DEFS[id].cost);
    expect(m, `${id} Stufe ${stufe}: M = ${m.toFixed(1)}`).toBeGreaterThan(0);
  });
});
