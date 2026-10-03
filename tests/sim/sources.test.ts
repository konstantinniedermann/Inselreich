import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld, tileAt, tilesInRadius } from '../../src/sim/world';
import { forceGrass, forceRect } from './helpers';

const fresh = (): World => {
  const w = createWorld(3, { unlockAll: true });
  w.money = 10_000;
  return w;
};

function hunterSite(w: World): { w: World; x: number; y: number } {
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y, 5, 1, 'grass');
  forceRect(w, k.x + 3, k.y - 4, 7, 7, 'grass');
  forceRect(w, k.x + 4, k.y - 3, 5, 2, 'forest');
  for (let i = 2; i <= 6; i++) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
  return { w, x: k.x + 6, y: k.y - 1 };
}

function farmSite(w: World): { w: World; x: number; y: number } {
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 3, k.y - 8, 8, 8, 'forest');
  forceRect(w, k.x + 2, k.y, 3, 1, 'grass');
  for (let i = 2; i <= 4; i++) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
  for (let j = 1; j <= 4; j++) expect(placeRoad(w, k.x + 4, k.y - j).ok).toBe(true);
  const [x, y] = [k.x + 5, k.y - 5];
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const)
    forceGrass(w, x + dx, y + dy);
  const own = new Set([`${x},${y}`, `${x + 1},${y}`, `${x},${y + 1}`, `${x + 1},${y + 1}`]);
  const sheep = [
    [x + 2, y + 1],
    [x + 3, y + 1],
    [x + 2, y + 2],
    [x + 3, y + 2],
  ];
  for (const [gx, gy] of sheep) forceGrass(w, gx!, gy!);
  const taken = new Set([...own, ...sheep.map(([a, b]) => `${a},${b}`)]);
  const rest = tilesInRadius(w, x + 1, y + 1, 3).filter((p) => {
    const t = tileAt(w, p.x, p.y)!;
    return !taken.has(`${p.x},${p.y}`) && !t.road;
  });
  for (const p of rest.slice(0, 12)) forceGrass(w, p.x, p.y);
  const free = tilesInRadius(w, x + 1, y + 1, 3).filter((p) => {
    const t = tileAt(w, p.x, p.y)!;
    return t.terrain === 'grass' && !t.road && !own.has(`${p.x},${p.y}`);
  });
  expect(free).toHaveLength(16);
  return { w, x, y };
}

const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) step(w);
};

describe('M11 Jagdhütte und Rinderfarm (Spec 3.3)', () => {
  it('AK-P2S2-03 Rinderfarm mit 16 freien Graskacheln; spätere Schäferei auf 4 davon sperrt eine zweite Farm, die stehende läuft', () => {
    const { w, x, y } = farmSite(fresh());
    const farm = placeBuilding(w, 'cattlefarm', x, y);
    expect(farm.ok).toBe(true);
    expect(placeBuilding(w, 'sheepfarm', x + 2, y + 1).ok).toBe(true);
    const twin = deserialize(serialize(w));
    if (!twin.ok) throw new Error(twin.reason);
    expect(demolish(twin.world, farm.id!).ok).toBe(true);
    expect(canPlace(twin.world, 'cattlefarm', x, y)).toEqual({
      ok: false,
      reason: 'Zu wenig freie Weide in der Nähe',
    });
    const food = w.stock.food;
    run(w, 20);
    expect([w.stock.food - food, w.buildings[farm.id!]!.state]).toEqual([1, 'ok']);
  });

  it('AK-P2S2-04 Ausstoss: Jagdhütte 1 je 50, Rinderfarm 1 je 20; Sturm: Rinderfarm 1 je 40, Jagdhütte 1 je 50', () => {
    const h = hunterSite(fresh());
    const f = farmSite(fresh());
    expect(placeBuilding(h.w, 'hunter', h.x, h.y).ok).toBe(true);
    expect(placeBuilding(f.w, 'cattlefarm', f.x, f.y).ok).toBe(true);
    for (const w of [h.w, f.w]) w.stock.food = 0;
    run(h.w, 100);
    run(f.w, 100);
    expect([h.w.stock.food, f.w.stock.food]).toEqual([2, 5]);
    for (const w of [h.w, f.w])
      w.crisis = { period: 0, kind: 'storm', from: w.tick + 1, until: w.tick + 1000 };
    run(h.w, 200);
    run(f.w, 200);
    expect([h.w.stock.food, f.w.stock.food]).toEqual([2 + 4, 5 + 5]);
  });
});
