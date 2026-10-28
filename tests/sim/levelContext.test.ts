import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { buildingUpkeep, cycleOf } from '../../src/sim/levels';
import { buildLevelContext, runningLevel } from '../../src/sim/levelRules';
import { totalUpkeep } from '../../src/sim/economy';
import { SHIP } from '../../src/sim/defs/sea';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { BuildingDefId, World } from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { putBuilding } from './helpers';

const SHOPS: BuildingDefId[] = ['fisher', 'fisher', 'hunter', 'lumberjack', 'weaver', 'distillery'];

/** Szene mit Betrieben der Stufe 3, gemischten Häusern, Feuerwachen und Fischern dicht beieinander. */
function scene(): World {
  const w = createWorld(11, { unlockAll: true, crisisLevel: 'normal' });
  const isl = home(w);
  for (const t of isl.tiles) if (t.buildingId === null) t.terrain = 'grass';
  let n = 0;
  for (let y = 2; y < isl.height - 2; y += 2) {
    for (let x = 2; x < isl.width - 2; x += 2) {
      if (isl.tiles[idx(isl, x, y)]!.buildingId !== null) continue;
      n++;
      if (n % 4 === 0)
        putBuilding(w, 0, SHOPS[n % SHOPS.length]!, x, y).level = n % 8 === 0 ? 3 : 2;
      else if (n % 25 === 0) putBuilding(w, 0, 'firestation', x, y);
      else putBuilding(w, 0, 'house', x, y).house!.tier = ((n % 3) + 1) as 1 | 2 | 3;
    }
  }
  return w;
}

const snapshot = (w: World, withCtx: boolean): string => {
  const ctx = withCtx ? buildLevelContext(w) : undefined;
  return JSON.stringify(
    Object.values(w.buildings).map((b) => [
      b.id,
      runningLevel(w, b, ctx),
      cycleOf(w, b, ctx),
      buildingUpkeep(w, b, ctx),
    ]),
  );
};

describe('T04b Kontext sammelt Häuser, Wachen, Fischer einmal', () => {
  it('gleiche Ergebnisse mit und ohne Kontext je Betrieb, auch nach Abriss und Brand', () => {
    const w = scene();
    expect(snapshot(w, true)).toBe(snapshot(w, false));
    const ids = Object.values(w.buildings);
    const house = ids.find((b) => b.house !== undefined)!;
    const burning = ids.find((b) => b.level !== undefined)!;
    burning.outageUntil = w.tick + 50;
    expect(demolish(w, house.id).ok).toBe(true);
    expect(snapshot(w, true)).toBe(snapshot(w, false));
    for (let i = 0; i < 20; i++) {
      step(w);
      expect(snapshot(w, true)).toBe(snapshot(w, false));
    }
  });
  it('Kontext ändert die Welt nicht und totalUpkeep bleibt gleich', () => {
    const w = scene();
    const before = serialize(w);
    buildLevelContext(w);
    expect(serialize(w)).toBe(before);
    const sum = Object.values(w.buildings).reduce((s, b) => s + buildingUpkeep(w, b), 0);
    expect(sum).toBeGreaterThan(0);
    expect(totalUpkeep(w)).toBe(sum + w.ships.length * SHIP.upkeep);
  });
});
