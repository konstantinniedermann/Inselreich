import { BUILDING_DEFS } from './defs/buildings';
import type { BuildingDefId, Result, SiteRule, Terrain, World } from './types';
import { fail, ok } from './types';
import { inSupplyRange } from './supply';
import { buildLock } from './unlocks';
import {
  adjacentOf,
  center,
  footprint,
  inBounds,
  isLand,
  tileAt,
  tilesInRadius,
  type Pos,
} from './world';

// Karte -> Bauland -> frei, für ein w×h-Rechteck ab (x, y).
function checkGround(world: World, x: number, y: number, w: number, h: number): Result {
  const tiles: Pos[] = [];
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) tiles.push({ x: x + dx, y: y + dy });
  if (!tiles.every((p) => inBounds(world, p.x, p.y))) return fail('Ausserhalb der Karte');
  const tileList = tiles.map((p) => tileAt(world, p.x, p.y)!);
  if (!tileList.every((t) => isLand(t.terrain))) return fail('Kein Bauland');
  if (tileList.some((t) => t.buildingId !== null || t.road)) return fail('Bereits bebaut');
  return ok;
}

const countTerrain = (world: World, tiles: Pos[], terrain: Terrain): number =>
  tiles.filter((p) => tileAt(world, p.x, p.y)?.terrain === terrain).length;

function adjacentReason(terrain: Terrain): string {
  return terrain === 'water' ? 'Braucht Wasser angrenzend' : 'Braucht Gebirge angrenzend';
}

function radiusReason(terrain: Terrain, free: boolean): string {
  if (terrain === 'forest')
    return free ? 'Zu wenig freier Wald in der Nähe' : 'Zu wenig Wald in der Nähe';
  return free ? 'Zu wenig freie Weide in der Nähe' : 'Zu wenig Weide in der Nähe';
}

/** Zählt nur Kacheln des Geländes, die unbebaut, ohne Weg und ausserhalb des eigenen Grundrisses sind. */
function countFreeTerrain(world: World, tiles: Pos[], terrain: Terrain, own: Pos[]): number {
  return tiles.filter((p) => {
    const t = tileAt(world, p.x, p.y);
    if (t === undefined || t.terrain !== terrain || t.buildingId !== null || t.road) return false;
    return !own.some((o) => o.x === p.x && o.y === p.y);
  }).length;
}

/** Prüft eine Standortregel für `defId` mit Grundriss ab (x, y); ohne Wurf, Grund im Ergebnis. */
export function siteRuleOk(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  rule: SiteRule,
): Result {
  const def = BUILDING_DEFS[defId];
  const { cx, cy } = center(def, x, y);
  switch (rule.kind) {
    case 'coast':
      return countTerrain(world, adjacentOf(world, x, y, def.w, def.h), 'water') >= 1
        ? ok
        : fail(adjacentReason('water'));
    case 'adjacent':
      return countTerrain(world, adjacentOf(world, x, y, def.w, def.h), rule.terrain) >= rule.min
        ? ok
        : fail(adjacentReason(rule.terrain));
    case 'radius': {
      const tiles = tilesInRadius(world, cx, cy, rule.radius);
      const free = rule.free === true;
      const n = free
        ? countFreeTerrain(world, tiles, rule.terrain, footprint(def, x, y))
        : countTerrain(world, tiles, rule.terrain);
      return n >= rule.min ? ok : fail(radiusReason(rule.terrain, free));
    }
    case 'supply': {
      const supplied = inSupplyRange(world, cx, cy);
      return supplied ? ok : fail('Ausserhalb der Versorgung');
    }
  }
}

export function canPlaceRoad(world: World, x: number, y: number): Result {
  return checkGround(world, x, y, 1, 1);
}

export { buildLock } from './unlocks';

export function canPlace(world: World, defId: BuildingDefId, x: number, y: number): Result {
  const lock = buildLock(world, defId);
  if (lock !== null) return fail(lock); // zuerst: auch auf Wasser oder belegtem Boden gilt der Sperrgrund
  const def = BUILDING_DEFS[defId];
  const max = def.maxCount;
  if (
    max !== undefined &&
    Object.values(world.buildings).filter((b) => b.defId === defId).length >= max.n
  )
    return fail(max.reason);
  const ground = checkGround(world, x, y, def.w, def.h);
  if (!ground.ok) return ground;
  for (const rule of def.site) {
    const res = siteRuleOk(world, defId, x, y, rule);
    if (!res.ok) return res;
  }
  return ok;
}
