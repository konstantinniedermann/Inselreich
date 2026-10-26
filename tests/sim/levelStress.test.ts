import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { BuildingDefId, World } from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { putBuilding } from './helpers';

const STRESS_TICKS = 50;
const SHOPS: BuildingDefId[] = ['fisher', 'hunter', 'lumberjack', 'weaver', 'distillery'];
/** Abriss eines Hauses (Fachkräfte-Wechsel) mitten im Lauf. */
const DEMOLISH_TICK = STRESS_TICKS / 2;
const SHOP_TARGET = 60;
const HOUSE_TARGET = 240;

/** Heimatinsel mit rund 300 Gebäuden: 60 Betriebe mit level 3, Häuser gemischter Stufen. */
function stressWorld(): World {
  const w = createWorld(11, { unlockAll: true });
  const isl = home(w);
  for (const t of isl.tiles) if (t.buildingId === null) t.terrain = 'grass';
  let shops = 0;
  let houses = 0;
  for (let y = 2; y < isl.height - 2; y += 2) {
    for (let x = 2; x < isl.width - 2; x += 2) {
      if (isl.tiles[idx(isl, x, y)]!.buildingId !== null) continue;
      if (shops < SHOP_TARGET && (x + y) % 3 === 0) {
        putBuilding(w, 0, SHOPS[shops % SHOPS.length]!, x, y).level = 3;
        shops++;
      } else if (houses < HOUSE_TARGET) {
        putBuilding(w, 0, 'house', x, y).house!.tier = ((houses % 3) + 1) as 1 | 2 | 3;
        houses++;
      }
    }
  }
  return w;
}

const run = (): { json: string; buildings: number } => {
  const w = stressWorld();
  for (let i = 0; i < STRESS_TICKS; i++) {
    if (i === DEMOLISH_TICK) demolish(w, Object.values(w.buildings).find((b) => b.house)!.id);
    step(w);
  }
  return { json: serialize(w), buildings: Object.keys(w.buildings).length };
};

describe('Stress: viele ausgebaute Betriebe (P-3 b)', () => {
  it('Szene hat rund 300 Gebäude, zwei Läufe gleiches serialize', () => {
    const a = run();
    expect(a.buildings).toBeGreaterThanOrEqual(250);
    expect(run().json).toBe(a.json);
  });
});
