import { describe, expect, it } from 'vitest';
import { shipTile } from '../../src/render/ship';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { adjacentOf, createWorld, tileAt } from '../../src/sim/world';
import type { Order } from '../../src/sim/types';

const order: Order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };

describe('Händlerschiff', () => {
  it('AK-A1-04 ohne Auftrag kein Schiff', () => {
    const world = createWorld(1);
    world.order = null;
    expect(shipTile(world)).toBeNull();
  });
  it('AK-A1-04 mit Auftrag liegt es auf der ersten Wasserkachel am Kontor', () => {
    const world = createWorld(1);
    world.order = order;
    const k = world.buildings[world.kontorId];
    if (!k) throw new Error('Kontor fehlt');
    const def = BUILDING_DEFS[k.defId];
    const expected = adjacentOf(world, k.x, k.y, def.w, def.h).find(
      (p) => tileAt(world, p.x, p.y)?.terrain === 'water',
    );
    expect(expected).toBeDefined();
    expect(shipTile(world)).toEqual(expected);
  });
});
