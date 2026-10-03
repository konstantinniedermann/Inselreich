import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { MIN_MOUNTAIN_PATCH } from '../../src/sim/defs/map';
import type { Terrain } from '../../src/sim/types';
import {
  components,
  findKontorSite,
  generateMap,
  generateTerrain,
  meetsPostconditions,
  seaMask,
  MAP_H,
  MAP_W,
} from '../../src/sim/mapgen';
import {
  createWorld,
  tileAt,
  adjacentOf,
  isLand,
  footprint,
  tilesInRadius,
} from '../../src/sim/world';

const count = (t: string[], k: string) => t.filter((x) => x === k).length;

describe('generateMap', () => {
  it('is deterministic', () => {
    expect(generateMap(1)).toEqual(generateMap(1));
  });
  it('fulfils the postconditions for many seeds', () => {
    for (let s = 1; s <= 20; s++) {
      const m = generateMap(s);
      expect(m.terrain).toHaveLength(MAP_W * MAP_H);
      const land = m.terrain.filter(isLand).length;
      expect(land).toBeGreaterThanOrEqual(800);
      expect(count(m.terrain, 'forest')).toBeGreaterThanOrEqual(40);
      expect(count(m.terrain, 'mountain')).toBeGreaterThanOrEqual(MIN_MOUNTAIN_PATCH);
      expect(m.seedUsed).toBeGreaterThanOrEqual(s);
    }
  });
  it('retries with seed + i and round-trips the used seed', () => {
    let s = 1;
    while (s <= 200 && meetsPostconditions(generateTerrain(s, MAP_W, MAP_H), MAP_W, MAP_H)) s++;
    if (s > 200) {
      throw new Error('no seed in 1..200 fails the postconditions; retry path is untested');
    }
    const m = generateMap(s);
    expect(m.seedUsed).toBeGreaterThan(s);
    expect(createWorld(m.seedUsed).tiles).toEqual(createWorld(s).tiles);
  });
  it('round-trips the seed of a created world', () => {
    expect(createWorld(createWorld(5).seed).tiles).toEqual(createWorld(5).tiles);
  });
  it('keeps the border water', () => {
    const m = generateMap(5);
    for (let x = 0; x < MAP_W; x++) {
      expect(m.terrain[x]).toBe('water');
      expect(m.terrain[(MAP_H - 1) * MAP_W + x]).toBe('water');
    }
  });
});

describe('createWorld', () => {
  it('places the kontor on land next to water', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    expect(k.defId).toBe('kontor');
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const t = tileAt(w, k.x + dx, k.y + dy)!;
        expect(isLand(t.terrain)).toBe(true);
        expect(t.buildingId).toBe(k.id);
      }
    const waterAdj = adjacentOf(w, k.x, k.y, 2, 2).some(
      (p) => tileAt(w, p.x, p.y)!.terrain === 'water',
    );
    expect(waterAdj).toBe(true);
    expect(w.money).toBe(5000);
    expect(w.stock.wood).toBe(40);
    expect(w.seed).toBeGreaterThanOrEqual(3);
  });
});

describe('world helpers', () => {
  it('footprint of a 2x2 def returns 4 positions', () => {
    expect(footprint(BUILDING_DEFS.market, 5, 7)).toHaveLength(4);
  });
  it('adjacentOf a 2x2 returns the 8 edge neighbours, no corners, none inside', () => {
    const w = createWorld(3);
    const adj = adjacentOf(w, 10, 10, 2, 2);
    expect(adj).toHaveLength(8);
    for (const p of adj) {
      const inside = p.x >= 10 && p.x <= 11 && p.y >= 10 && p.y <= 11;
      const corner = (p.x === 9 || p.x === 12) && (p.y === 9 || p.y === 12);
      expect(inside).toBe(false);
      expect(corner).toBe(false);
    }
  });
  it('tilesInRadius stays in bounds and includes the centre tile', () => {
    const w = createWorld(3);
    const near = tilesInRadius(w, 0, 0, 3);
    expect(near.every((p) => p.x >= 0 && p.y >= 0 && p.x < w.width && p.y < w.height)).toBe(true);
    expect(near).toContainEqual({ x: 0, y: 0 });
  });
  it('tilesInRadius is symmetric around a tile centre', () => {
    const w = createWorld(3);
    const set = new Set(tilesInRadius(w, 10.5, 10.5, 2).map((p) => `${p.x - 10},${p.y - 10}`));
    expect(set.has('0,0')).toBe(true);
    for (const k of set) {
      const [dx, dy] = k.split(',').map(Number) as [number, number];
      expect(set.has(`${-dx},${-dy}`)).toBe(true);
      expect(set.has(`${-dx},${dy}`)).toBe(true);
    }
    expect(set.has('-2,0') && set.has('2,0')).toBe(true);
  });
});

// Unabhängiger Flood-Fill im Test: Meer = vom Kartenrand aus erreichbares Wasser.
function referenceSea(terrain: Terrain[], w: number, h: number): Set<number> {
  const sea = new Set<number>();
  const queue: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && terrain[y * w + x] === 'water') {
        sea.add(y * w + x);
        queue.push(y * w + x);
      }
  while (queue.length > 0) {
    const i = queue.shift()!;
    const x = i % w;
    const y = Math.floor(i / w);
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (terrain[j] === 'water' && !sea.has(j)) {
        sea.add(j);
        queue.push(j);
      }
    }
  }
  return sea;
}

function mountainSizes(terrain: Terrain[], w: number, h: number): number[] {
  const seen = new Set<number>();
  const sizes: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (terrain[start] !== 'mountain' || seen.has(start)) continue;
    let n = 0;
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const i = stack.pop()!;
      n++;
      const x = i % w;
      const y = Math.floor(i / w);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ] as const) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (terrain[j] === 'mountain' && !seen.has(j)) {
          seen.add(j);
          stack.push(j);
        }
      }
    }
    sizes.push(n);
  }
  return sizes;
}

describe('kontor at the sea', () => {
  it('has sea (not an inland lake) next to the kontor for seeds 0..199', () => {
    for (let s = 0; s < 200; s++) {
      const m = generateMap(s);
      const sea = referenceSea(m.terrain, MAP_W, MAP_H);
      const { x, y } = m.kontor;
      const rim = [
        [x, y - 1],
        [x + 1, y - 1],
        [x, y + 2],
        [x + 1, y + 2],
        [x - 1, y],
        [x - 1, y + 1],
        [x + 2, y],
        [x + 2, y + 1],
      ];
      expect(
        rim.some(([rx, ry]) => sea.has(ry! * MAP_W + rx!)),
        `seed ${s}`,
      ).toBe(true);
    }
  });
  it('prefers the coast over a nearer inland lake', () => {
    const w = 12;
    const h = 12;
    const t: Terrain[] = new Array<Terrain>(w * h).fill('water');
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) t[y * w + x] = 'grass';
    t[5 * w + 5] = 'water'; // Binnensee nahe der Mitte
    const k = findKontorSite(t, w, h)!;
    const sea = referenceSea(t, w, h);
    const rim = [
      [k.x, k.y - 1],
      [k.x + 1, k.y - 1],
      [k.x, k.y + 2],
      [k.x + 1, k.y + 2],
      [k.x - 1, k.y],
      [k.x - 1, k.y + 1],
      [k.x + 2, k.y],
      [k.x + 2, k.y + 1],
    ];
    expect(rim.some(([rx, ry]) => sea.has(ry! * w + rx!))).toBe(true);
  });
});

describe('mountain patches', () => {
  it('has no patch below the minimum, one large patch and a quarry site for seeds 0..199', () => {
    for (let s = 0; s < 200; s++) {
      const m = generateMap(s);
      const sizes = mountainSizes(m.terrain, MAP_W, MAP_H);
      expect(Math.min(...sizes, Infinity), `seed ${s}`).toBeGreaterThanOrEqual(MIN_MOUNTAIN_PATCH);
      expect(sizes.length, `seed ${s}`).toBeGreaterThan(0);
      const quarry = m.terrain.some(
        (tt, i) =>
          isLand(tt) &&
          [
            i % MAP_W > 0 ? i - 1 : -1,
            i % MAP_W < MAP_W - 1 ? i + 1 : -1,
            i - MAP_W,
            i + MAP_W,
          ].some((j) => m.terrain[j] === 'mountain'),
      );
      expect(quarry, `seed ${s}`).toBe(true);
    }
  });
});

describe('components and seaMask', () => {
  const W = 5;
  const H = 4;
  const rows = ['wwwww', 'wgwgw', 'wwwgw', 'wwwww'];
  const map: Terrain[] = rows
    .join('')
    .split('')
    .map((c) => (c === 'w' ? 'water' : 'grass'));
  it('labels 4-connected components in row-scan order, -1 outside the predicate', () => {
    const { id, sizes } = components(map, W, H, (t) => t === 'grass');
    expect(sizes).toEqual([1, 2]);
    expect(id[0]).toBe(-1);
    expect(id[1 * W + 1]).toBe(0);
    expect(id[1 * W + 3]).toBe(1);
    expect(id[2 * W + 3]).toBe(1);
  });
  it('marks only border-connected water as sea', () => {
    const m: Terrain[] = new Array<Terrain>(25).fill('water');
    const g = (x: number, y: number) => (m[y * 5 + x] = 'grass');
    // Ring um einen Binnensee bei (2,2)
    for (const [x, y] of [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ] as const)
      g(x, y);
    const sea = seaMask(m, 5, 5);
    expect(sea[0]).toBeTruthy();
    expect(sea[2 * 5 + 2]).toBeFalsy();
    expect(sea[1 * 5 + 1]).toBeFalsy();
  });
});
