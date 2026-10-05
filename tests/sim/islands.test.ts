import { describe, expect, it } from 'vitest';
import { START_STOCK } from '../../src/sim/defs/goods';
import { createWorld, home, islandOf, tileAt } from '../../src/sim/world';

describe('M12 E0 Helfer', () => {
  it('PLAN-H1 home/islandOf liefern Raster, Lager und Kontor der Heimat', () => {
    const w = createWorld(3);
    expect(home(w).tiles.length).toBe(4096);
    expect(home(w).kontorId).toBe(1);
    expect(home(w).stock).toEqual(START_STOCK);
    expect(islandOf(w, w.buildings[1]!)).toBe(home(w));
    const k = w.buildings[1]!;
    expect(tileAt(home(w), k.x, k.y)!.buildingId).toBe(1);
  });
});
