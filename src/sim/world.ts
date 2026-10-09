import { BUILDING_DEFS } from './defs/buildings';
import { DEFAULT_WORLD_CRISIS_LEVEL } from './defs/crises';
import { GOOD_IDS, START_MONEY, START_STOCK } from './defs/goods';
import { DEFAULT_TAX_LEVEL, TIER_IDS } from './defs/tiers';
import { UNLOCK_IDS } from './defs/unlocks';
import { generateForeignIslands, homeAnchor } from './islands';
import { generateMap, MAP_H, MAP_W } from './mapgen';
import type {
  Building,
  BuildingDef,
  BuildingDefId,
  CrisisLevel,
  GoodId,
  Island,
  TaxLevel,
  Tier,
  Tile,
  World,
} from './types';

export type Pos = { x: number; y: number };

export { isLand } from './mapgen';

/** Inselindex der Heimat (Struktur, kein Spielwert). */
export const HOME = 0;
/** Die Heimat hat immer ein Kontor (Ladeprüfung v8); der Rückgabetyp trägt das, damit `kontorId` eine Zahl bleibt. */
export type HomeIsland = Island & { kontorId: number };
/** Kontor der Heimat oder Kontor II einer fernen Insel. */
export const isKontor = (defId: BuildingDefId): boolean =>
  defId === 'kontor' || defId === 'kontor2';
export const home = (w: World): HomeIsland => w.islands[HOME] as HomeIsland;
export const islandOf = (w: World, b: Building): Island => w.islands[b.island]!;

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

const emptyStock = (): Record<GoodId, number> =>
  Object.fromEntries(GOOD_IDS.map((g) => [g, 0])) as Record<GoodId, number>;

/** Fremdinseln A, B in `ISLANDS`-Reihenfolge: nur Gelände, kein Kontor, leeres Lager. */
function foreignIslands(seed: number, homeIsland: Island): Island[] {
  return generateForeignIslands(seed, homeIsland).map((p) => ({
    kind: p.kind,
    width: p.width,
    height: p.height,
    tiles: p.terrain.map((t): Tile => ({ terrain: t, buildingId: null, road: false })),
    kontorId: null,
    stock: emptyStock(),
    ox: p.ox,
    oy: p.oy,
    anchor: p.anchor,
  }));
}

export function createWorld(
  seed: number,
  opts: { crisisLevel?: CrisisLevel; unlockAll?: boolean } = {},
): World {
  const { terrain, kontor, seedUsed } = generateMap(seed);
  const tiles: Tile[] = terrain.map((t) => ({ terrain: t, buildingId: null, road: false }));
  const anchor = homeAnchor(terrain, MAP_W, MAP_H, kontor);
  const homeIsland: Island = {
    kind: 'home',
    width: MAP_W,
    height: MAP_H,
    tiles,
    kontorId: 1,
    stock: { ...START_STOCK },
    ox: 0,
    oy: 0,
    anchor,
  };
  const world: World = {
    version: 10,
    seed: seedUsed,
    islands: [homeIsland, ...foreignIslands(seedUsed, homeIsland)],
    tick: 0,
    buildings: {},
    nextBuildingId: 2,
    money: START_MONEY,
    stats: { taxes: 0, upkeep: 0 },
    won: false,
    wonMerchants: false,
    taxLevels: Object.fromEntries(TIER_IDS.map((t) => [t, DEFAULT_TAX_LEVEL])) as Record<
      Tier,
      TaxLevel
    >,
    taxLockedUntil: Object.fromEntries(TIER_IDS.map((t) => [t, 0])) as Record<Tier, number>,
    sellPct: Object.fromEntries(GOOD_IDS.map((g) => [g, 100])) as Record<GoodId, number>,
    order: null,
    crisisLevel: opts.crisisLevel ?? DEFAULT_WORLD_CRISIS_LEVEL,
    crisis: null,
    unlocked: opts.unlockAll === true ? [...UNLOCK_IDS] : ['U0'],
    goodLocks: [],
    upgradeStops: [],
    taxCarry: 0,
    upkeepCarry: 0,
    ships: [],
    nextShipId: 1,
    wonSpice: false,
  };
  world.buildings[1] = {
    id: 1,
    defId: 'kontor',
    x: kontor.x,
    y: kontor.y,
    connected: true,
    progress: 0,
    state: 'ok',
    island: HOME,
  };
  for (const p of footprint(BUILDING_DEFS.kontor, kontor.x, kontor.y)) {
    const tile = tileAt(home(world), p.x, p.y);
    if (tile) tile.buildingId = 1;
  }
  return world;
}
