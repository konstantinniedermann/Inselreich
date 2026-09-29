import { idx } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';

/** Deterministisches Layout: 6 freie Grasskacheln ab der Ostkante des Kontors, Wald nördlich von Kachel 5. */
export function prepareEast(world: World, kontor: Building): void {
  for (let i = 0; i < 6; i++) {
    const t = world.tiles[idx(world, kontor.x + 2 + i, kontor.y)]!;
    t.terrain = 'grass';
    t.buildingId = null;
    t.road = false;
  }
  world.tiles[idx(world, kontor.x + 2 + 4, kontor.y - 1)]!.terrain = 'forest';
}
