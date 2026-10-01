import { describe, expect, it } from 'vitest';
import { shipShadow, shipTile } from '../../src/render/ship';
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
  it('AK-ISO-11 createWorld(1): Schiff auf dem Wasserfeld am Kontor mit dem grössten x + y', () => {
    const world = createWorld(1);
    world.order = order;
    const k = world.buildings[world.kontorId];
    if (!k) throw new Error('Kontor fehlt');
    const def = BUILDING_DEFS[k.defId];
    const water = adjacentOf(world, k.x, k.y, def.w, def.h).filter(
      (p) => tileAt(world, p.x, p.y)?.terrain === 'water',
    );
    expect(water.length).toBeGreaterThan(0);
    const best = Math.max(...water.map((p) => p.x + p.y));
    const ties = water.filter((p) => p.x + p.y === best);
    const expected = ties.reduce((a, b) => (b.x < a.x ? b : a));
    expect(shipTile(world)).toEqual(expected);
  });
  it('AK-ISO-11 Gleichstand (kx + 2, ky + 1) und (kx + 1, ky + 2) → (kx + 1, ky + 2), deterministisch', () => {
    const world = createWorld(1);
    world.order = order;
    const k = world.buildings[world.kontorId]!;
    for (const t of world.tiles) t.terrain = 'grass';
    for (const [x, y] of [
      [k.x + 2, k.y + 1],
      [k.x + 1, k.y + 2],
    ] as const)
      world.tiles[y * world.width + x]!.terrain = 'water';
    expect(shipTile(world)).toEqual({ x: k.x + 1, y: k.y + 2 });
    expect(shipTile(world)).toEqual({ x: k.x + 1, y: k.y + 2 });
  });

  it('ISO §5 shipShadow: konvexes Polygon im Kachelraum um die Kachel, nach (+3, +1) versetzt, gleiche Orientierung wie die Baumschatten', () => {
    const poly = shipShadow({ x: 12, y: 9 });
    expect(poly.length).toBeGreaterThanOrEqual(6);
    const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length,
      cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    expect(cx).toBeGreaterThan(12.5);
    expect(cy).toBeGreaterThan(9.5);
    expect((cx - 12.5) / (cy - 9.5)).toBeCloseTo(3, 5);
    const area =
      poly.reduce(
        (s, p, i) =>
          s + (p.x * poly[(i + 1) % poly.length]!.y - poly[(i + 1) % poly.length]!.x * p.y),
        0,
      ) / 2;
    expect(area).toBeGreaterThan(0);
    for (const p of poly) expect(Math.hypot(p.x - 12.5, p.y - 9.5)).toBeLessThan(1);
  });
});
