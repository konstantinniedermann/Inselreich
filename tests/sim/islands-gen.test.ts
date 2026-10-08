import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import {
  ARCHIPEL_SPAN_MAX,
  ISLAND_GAP_MIN,
  ISLAND_RIM,
  ISLANDS,
  PLANTATION_SITE,
} from '../../src/sim/defs/sea';
import {
  clipInside,
  exitDist,
  generateForeignIslands,
  homeAnchor,
  seaLanes,
  seaLength,
  type LaneIsland,
  type PlacedIsland,
  type Pt,
  type Rect,
} from '../../src/sim/islands';
import { foundKontor2Literal } from './seaHelpers';
import { canPlace } from '../../src/sim/placement';
import { createWorld } from '../../src/sim/world';
import { generateMap, isLand, MAP_H, MAP_W, seaMask } from '../../src/sim/mapgen';

const SEEDS_200 = Array.from({ length: 200 }, (_, i) => i + 1);
// 8 Blöcke à 25 Seeds: je Block eigene CI-Zeitreserve (H-T5), zusammen alle 200 Seeds.
const SEED_BLOCKS = Array.from({ length: 8 }, (_, k) => SEEDS_200.slice(k * 25, k * 25 + 25));

function homeOf(seed: number): LaneIsland {
  const { terrain, kontor } = generateMap(seed);
  return {
    ox: 0,
    oy: 0,
    width: MAP_W,
    height: MAP_H,
    anchor: homeAnchor(terrain, MAP_W, MAP_H, kontor),
  };
}

const rectOf = (i: LaneIsland): Rect => ({
  x0: i.ox,
  y0: i.oy,
  x1: i.ox + i.width,
  y1: i.oy + i.height,
});
const key = (p: Pt): string => `${p.x},${p.y}`;
const footprint = (p: Pt, w: number, h: number): Pt[] => {
  const out: Pt[] = [];
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) out.push({ x: p.x + dx, y: p.y + dy });
  return out;
};

function checkTerrainGuarantees(isl: PlacedIsland, kind: 'A' | 'B'): void {
  const def = ISLANDS.find((d) => d.kind === kind)!;
  const { width: w, height: h, terrain } = isl;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? undefined : terrain[y * w + x];
  expect(isl.kind).toBe(kind);
  expect(w).toBe(def.size);
  expect(h).toBe(def.size);
  expect(terrain.length).toBe(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = at(x, y)!;
      if (t !== 'water') {
        expect(x >= ISLAND_RIM && x <= w - ISLAND_RIM - 1).toBe(true);
        expect(y >= ISLAND_RIM && y <= h - ISLAND_RIM - 1).toBe(true);
      }
      if (kind === 'A') expect(t).not.toBe('mountain');
    }
  expect(isl.plantationSites.length).toBe(def.plantations);
  expect(isl.quarrySites.length).toBe(def.quarries);

  const occupied = new Set<string>();
  const claim = (p: Pt, fw: number, fh: number): void => {
    for (const q of footprint(p, fw, fh)) {
      expect(isLand(at(q.x, q.y))).toBe(true);
      expect(occupied.has(key(q))).toBe(false);
      occupied.add(key(q));
    }
  };
  claim(isl.kontorSite, 2, 2);
  isl.plantationSites.forEach((p) => claim(p, 2, 2));
  isl.quarrySites.forEach((p) => claim(p, 1, 1));

  const kc = isl.kontorSite;
  const coast = [...footprint(kc, 2, 2)].some((q) =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => at(q.x + dx!, q.y + dy!) === 'water'),
  );
  expect(coast).toBe(true);

  const rule = PLANTATION_SITE.site[0];
  for (const p of isl.plantationSites) {
    let n = 0;
    for (let y = p.y + 1 - rule.radius - 1; y <= p.y + 1 + rule.radius + 1; y++)
      for (let x = p.x + 1 - rule.radius - 1; x <= p.x + 1 + rule.radius + 1; x++) {
        const dx = x + 0.5 - (p.x + 1);
        const dy = y + 0.5 - (p.y + 1);
        if (
          Math.sqrt(dx * dx + dy * dy) <= rule.radius &&
          at(x, y) === rule.terrain &&
          !occupied.has(key({ x, y }))
        )
          n++;
      }
    expect(n).toBeGreaterThanOrEqual(rule.min);
  }
  const qRule = BUILDING_DEFS.quarry.site[0]!;
  if (qRule.kind !== 'adjacent') throw new Error('quarry rule');
  for (const p of isl.quarrySites) {
    const n = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(([dx, dy]) => at(p.x + dx!, p.y + dy!) === qRule.terrain).length;
    expect(n).toBeGreaterThanOrEqual(qRule.min);
  }

  const sea = seaMask(terrain, w, h);
  const a = isl.anchor;
  expect(at(a.x, a.y)).toBe('water');
  expect(sea[a.y * w + a.x]).toBe(true);
  expect(
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => isLand(at(a.x + dx!, a.y + dy!))),
  ).toBe(true);
}

function checkLayout(home: LaneIsland, isles: PlacedIsland[]): void {
  const all = [home, ...isles];
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]!;
      const b = all[j]!;
      const gx = Math.max(a.ox - (b.ox + b.width), b.ox - (a.ox + a.width));
      const gy = Math.max(a.oy - (b.oy + b.height), b.oy - (a.oy + a.height));
      expect(Math.max(gx, gy)).toBeGreaterThanOrEqual(ISLAND_GAP_MIN);
    }
  const lanes = seaLanes(all);
  expect(lanes.length).toBe(3);
  isles.forEach((isl, k) => {
    const def = ISLANDS[k]!;
    const lane = lanes.find((l) => l.a === 0 && l.b === k + 1)!;
    expect(lane.d).toBeGreaterThanOrEqual(def.dMin);
    expect(lane.d).toBeLessThanOrEqual(def.dMax);
  });
  for (const lane of lanes)
    all.forEach((isl, k) => {
      if (k === lane.a || k === lane.b) return;
      expect(clipInside(lane.points[0]!, lane.points[1]!, rectOf(isl))).toBeLessThan(1e-9);
    });
  const x0 = Math.min(...all.map((i) => i.ox));
  const y0 = Math.min(...all.map((i) => i.oy));
  const x1 = Math.max(...all.map((i) => i.ox + i.width));
  const y1 = Math.max(...all.map((i) => i.oy + i.height));
  expect(x1 - x0 + (y1 - y0)).toBeLessThanOrEqual(ARCHIPEL_SPAN_MAX);
}

describe('M12 E1 Generator', () => {
  it.each(SEED_BLOCKS)(
    'AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Block ab %i)',
    (...seeds) => {
      for (const seed of seeds) {
        const isles = generateForeignIslands(seed, homeOf(seed));
        expect(isles.map((i) => i.kind)).toEqual(['A', 'B']);
        checkTerrainGuarantees(isles[0]!, 'A');
        checkTerrainGuarantees(isles[1]!, 'B');
      }
    },
  );

  // Timeout: lokal ≤ 0,9 s (seriell, Last eher höher), CI bis ~4×, R270/R318
  it('AK-E1-02: Lage, Lücken, Seewege und Rahmen für Seeds 1…200', () => {
    for (const seed of SEEDS_200) {
      const home = homeOf(seed);
      checkLayout(home, generateForeignIslands(seed, home));
    }
  }, 15_000);

  it('AK-E1-04: Ersatzform erfüllt alle Garantien und ist deterministisch', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const home = homeOf(seed);
      const a = generateForeignIslands(seed, home, { failShapes: true });
      checkTerrainGuarantees(a[0]!, 'A');
      checkTerrainGuarantees(a[1]!, 'B');
      checkLayout(home, a);
      expect(generateForeignIslands(seed, home, { failShapes: true })).toEqual(a);
    }
  });

  it('ist deterministisch', () => {
    const home = homeOf(7);
    expect(generateForeignIslands(7, home)).toEqual(generateForeignIslands(7, home));
  });

  it('D-139: d zählt nur die Strecke ausserhalb der Inselrechtecke', () => {
    for (const seed of SEEDS_200) {
      const home = homeOf(seed);
      const isles = generateForeignIslands(seed, home);
      const all = [home, ...isles];
      for (const lane of seaLanes(all)) {
        const [p, q] = lane.points as [Pt, Pt];
        const len = Math.sqrt((q.x - p.x) ** 2 + (q.y - p.y) ** 2);
        const u = { x: (q.x - p.x) / len, y: (q.y - p.y) / len };
        const exitA = exitDist(p, u, rectOf(all[lane.a]!));
        const exitB = exitDist(q, { x: -u.x, y: -u.y }, rectOf(all[lane.b]!));
        const sea = seaLength(
          lane.points,
          all.map((i) => rectOf(i)),
        );
        expect(Math.abs(sea - (len - exitA - exitB))).toBeLessThan(1e-9);
        expect(lane.d).toBe(Math.ceil(sea));
      }
    }
  });

  it('clipInside: ganz innen 1, ganz aussen 0, halb 0,5', () => {
    const r: Rect = { x0: 0, y0: 0, x1: 10, y1: 10 };
    expect(clipInside({ x: 2, y: 2 }, { x: 8, y: 8 }, r)).toBeCloseTo(1, 12);
    expect(clipInside({ x: 20, y: 20 }, { x: 30, y: 20 }, r)).toBe(0);
    expect(clipInside({ x: 5, y: 5 }, { x: 15, y: 5 }, r)).toBeCloseTo(0.5, 12);
  });

  it('B6: islands.ts nutzt kein Math.hypot', () => {
    expect(readFileSync('src/sim/islands.ts', 'utf8')).not.toContain('Math.hypot');
  });
});

describe('M12 E1 AK-E1-01 Kreuzprobe canPlace', () => {
  it.each(SEED_BLOCKS)(
    'Seeds 1…200: jeder quarrySites-Platz von B ist mit canPlace belegbar (Block ab %i)',
    (...seeds) => {
      for (const seed of seeds) {
        const w = createWorld(seed, { unlockAll: true });
        const b = generateForeignIslands(w.seed, homeOf(w.seed)).find((i) => i.kind === 'B')!;
        expect(b.quarrySites.length).toBeGreaterThan(0);
        foundKontor2Literal(w, 2);
        for (const p of b.quarrySites) {
          const r = canPlace(w, 'quarry', p.x, p.y, 2);
          expect(r.ok, `Seed ${seed} (${p.x},${p.y})`).toBe(true);
        }
      }
    },
  );
});
