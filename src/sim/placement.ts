import { BUILDING_DEFS } from './defs/buildings';
import type { BuildingDefId, Result, SiteRule, Terrain, World } from './types';
import { fail, ok } from './types';
import { tierLock } from './population';
import { inSupplyRange } from './supply';
import { adjacentOf, center, inBounds, isLand, tileAt, tilesInRadius, type Pos } from './world';

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

function radiusReason(terrain: Terrain): string {
  return terrain === 'forest' ? 'Zu wenig Wald in der Nähe' : 'Zu wenig Weide in der Nähe';
}

function checkRule(
  world: World,
  rule: SiteRule,
  defId: BuildingDefId,
  x: number,
  y: number,
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
    case 'radius':
      return countTerrain(world, tilesInRadius(world, cx, cy, rule.radius), rule.terrain) >=
        rule.min
        ? ok
        : fail(radiusReason(rule.terrain));
    case 'supply': {
      const supplied = inSupplyRange(world, cx, cy);
      return supplied ? ok : fail('Ausserhalb der Versorgung');
    }
  }
}

export function canPlaceRoad(world: World, x: number, y: number): Result {
  return checkGround(world, x, y, 1, 1);
}

/** Bausperre (M8 4.3, Änderung S11): Sperrgrund der Stufe `unlockTier` oder null; ohne `unlockTier` sofort null. */
export function buildLock(world: World, defId: BuildingDefId): string | null {
  const tier = BUILDING_DEFS[defId].unlockTier;
  return tier === undefined ? null : tierLock(world, tier);
}

export function canPlace(world: World, defId: BuildingDefId, x: number, y: number): Result {
  const lock = buildLock(world, defId);
  if (lock !== null) return fail(lock); // zuerst: auch auf Wasser oder belegtem Boden gilt der Sperrgrund
  const def = BUILDING_DEFS[defId];
  const ground = checkGround(world, x, y, def.w, def.h);
  if (!ground.ok) return ground;
  for (const rule of def.site) {
    const res = checkRule(world, rule, defId, x, y);
    if (!res.ok) return res;
  }
  return ok;
}
