import { BUILDING_DEFS } from './defs/buildings';
import { DEFAULT_WORLD_CRISIS_LEVEL } from './defs/crises';
import { GOOD_IDS, START_MONEY, START_STOCK } from './defs/goods';
import { DEFAULT_TAX_LEVEL } from './defs/tiers';
import { UNLOCK_IDS } from './defs/unlocks';
import { generateMap, MAP_H, MAP_W } from './mapgen';
import type {
  Building,
  BuildingDef,
  BuildingDefId,
  CrisisLevel,
  GoodId,
  Island,
  Tile,
  World,
} from './types';

export type Pos = { x: number; y: number };

export { isLand } from './mapgen';

/** Inselindex der Heimat (Struktur, kein Spielwert). */
export const HOME = 0;
export const home = (w: World): Island => w;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- T03 wählt die Insel über b.island
export const islandOf = (w: World, _b: Building): Island => w;

export const idx = (isl: Island, x: number, y: number): number => y * isl.width + x;

export const inBounds = (isl: Island, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < isl.width && y < isl.height;

export const tileAt = (isl: Island, x: number, y: number): Tile | undefined =>
  inBounds(isl, x, y) ? isl.tiles[idx(isl, x, y)] : undefined;

export function footprint(def: BuildingDef, x: number, y: number): Pos[] {
  const out: Pos[] = [];
  for (let dy = 0; dy < def.h; dy++)
    for (let dx = 0; dx < def.w; dx++) out.push({ x: x + dx, y: y + dy });
  return out;
}

export function adjacentOf(isl: Island, x: number, y: number, w: number, h: number): Pos[] {
  const out: Pos[] = [];
  for (let dx = 0; dx < w; dx++) {
    out.push({ x: x + dx, y: y - 1 }, { x: x + dx, y: y + h });
  }
  for (let dy = 0; dy < h; dy++) {
    out.push({ x: x - 1, y: y + dy }, { x: x + w, y: y + dy });
  }
  return out.filter((p) => inBounds(isl, p.x, p.y));
}

export function tilesInRadius(isl: Island, cx: number, cy: number, r: number): Pos[] {
  const out: Pos[] = [];
  const x0 = Math.floor(cx - r);
  const x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r);
  const y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (inBounds(isl, x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) out.push({ x, y });
    }
  }
  return out;
}

export function center(def: BuildingDef, x: number, y: number): { cx: number; cy: number } {
  return { cx: x + def.w / 2, cy: y + def.h / 2 };
}

export function buildingsOfType(world: World, defId: BuildingDefId): Building[] {
  return Object.values(world.buildings).filter((b) => b.defId === defId);
}

export function createWorld(
  seed: number,
  opts: { crisisLevel?: CrisisLevel; unlockAll?: boolean } = {},
): World {
  const { terrain, kontor, seedUsed } = generateMap(seed);
  const tiles: Tile[] = terrain.map((t) => ({ terrain: t, buildingId: null, road: false }));
  const world: World = {
    version: 6,
    seed: seedUsed,
    width: MAP_W,
    height: MAP_H,
    tick: 0,
    tiles,
    buildings: {},
    nextBuildingId: 2,
    kontorId: 1,
    stock: { ...START_STOCK },
    money: START_MONEY,
    stats: { taxes: 0, upkeep: 0 },
    won: false,
    wonMerchants: false,
    taxLevel: DEFAULT_TAX_LEVEL,
    taxLockedUntil: 0,
    sellPct: Object.fromEntries(GOOD_IDS.map((g) => [g, 100])) as Record<GoodId, number>,
    order: null,
    crisisLevel: opts.crisisLevel ?? DEFAULT_WORLD_CRISIS_LEVEL,
    crisis: null,
    unlocked: opts.unlockAll === true ? [...UNLOCK_IDS] : ['U0'],
    goodLocks: [],
    upgradeStops: [],
    taxCarry: 0,
    upkeepCarry: 0,
  };
  world.buildings[1] = {
    id: 1,
    defId: 'kontor',
    x: kontor.x,
    y: kontor.y,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  for (const p of footprint(BUILDING_DEFS.kontor, kontor.x, kontor.y)) {
    const tile = tileAt(world, p.x, p.y);
    if (tile) tile.buildingId = 1;
  }
  return world;
}
