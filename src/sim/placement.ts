import { BUILDING_DEFS } from './defs/buildings';
import type { BuildingDefId, Island, Result, SiteRule, Terrain, World } from './types';
import { fail, ok } from './types';
import { ISLANDS } from './defs/sea';
import { inSupplyRange } from './supply';
import { buildLock } from './unlocks';
import {
  adjacentOf,
  center,
  footprint,
  HOME,
  inBounds,
  isLand,
  tileAt,
  tilesInRadius,
  type Pos,
} from './world';

/** Die Insel mit Index `island`, oder `null` bei ungültigem Index (kein Wurf). */
export function islandAt(world: World, island: number): Island | null {
  return Number.isInteger(island) ? (world.islands[island] ?? null) : null;
}

// Karte -> Bauland -> frei, für ein w×h-Rechteck ab (x, y).
function checkGround(isl: Island, x: number, y: number, w: number, h: number): Result {
  const tiles: Pos[] = [];
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) tiles.push({ x: x + dx, y: y + dy });
  if (!tiles.every((p) => inBounds(isl, p.x, p.y))) return fail('Ausserhalb der Karte');
  const tileList = tiles.map((p) => tileAt(isl, p.x, p.y)!);
  if (!tileList.every((t) => isLand(t.terrain))) return fail('Kein Bauland');
  if (tileList.some((t) => t.buildingId !== null || t.road)) return fail('Bereits bebaut');
  return ok;
}

const countTerrain = (isl: Island, tiles: Pos[], terrain: Terrain): number =>
  tiles.filter((p) => tileAt(isl, p.x, p.y)?.terrain === terrain).length;

function adjacentReason(terrain: Terrain): string {
  return terrain === 'water' ? 'Braucht Wasser angrenzend' : 'Braucht Gebirge angrenzend';
}

function radiusReason(terrain: Terrain, free: boolean): string {
  if (terrain === 'forest')
    return free ? 'Zu wenig freier Wald in der Nähe' : 'Zu wenig Wald in der Nähe';
  return free ? 'Zu wenig freie Weide in der Nähe' : 'Zu wenig Weide in der Nähe';
}

/** Zählt nur Kacheln des Geländes, die unbebaut, ohne Weg und ausserhalb des eigenen Grundrisses sind. */
function countFreeTerrain(isl: Island, tiles: Pos[], terrain: Terrain, own: Pos[]): number {
  return tiles.filter((p) => {
    const t = tileAt(isl, p.x, p.y);
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
  island: number = HOME,
): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const def = BUILDING_DEFS[defId];
  const { cx, cy } = center(def, x, y);
  switch (rule.kind) {
    case 'coast':
      return countTerrain(isl, adjacentOf(isl, x, y, def.w, def.h), 'water') >= 1
        ? ok
        : fail(adjacentReason('water'));
    case 'adjacent':
      return countTerrain(isl, adjacentOf(isl, x, y, def.w, def.h), rule.terrain) >= rule.min
        ? ok
        : fail(adjacentReason(rule.terrain));
    case 'radius': {
      const tiles = tilesInRadius(isl, cx, cy, rule.radius);
      const free = rule.free === true;
      const n = free
        ? countFreeTerrain(isl, tiles, rule.terrain, footprint(def, x, y))
        : countTerrain(isl, tiles, rule.terrain);
      return n >= rule.min ? ok : fail(radiusReason(rule.terrain, free));
    }
    case 'supply': {
      const supplied = inSupplyRange(world, island, cx, cy);
      return supplied ? ok : fail('Ausserhalb der Versorgung');
    }
    case 'islandTrait': {
      const def = ISLANDS.find((d) => d.kind === isl.kind);
      return island >= 1 && def?.traits.includes(rule.trait) === true
        ? ok
        : fail('Hier wächst kein Gewürz');
    }
    case 'foreignNoKontor':
      if (island === HOME) return fail('Nur auf einer fernen Insel');
      return isl.kontorId === null ? ok : fail('Auf dieser Insel steht schon ein Kontor');
  }
}

export function canPlaceRoad(world: World, x: number, y: number, island: number = HOME): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  return checkGround(isl, x, y, 1, 1);
}

export { buildLock } from './unlocks';

export function canPlace(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  island: number = HOME,
): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const lock = buildLock(world, defId);
  if (lock !== null) return fail(lock); // zuerst: auch auf Wasser oder belegtem Boden gilt der Sperrgrund
  const def = BUILDING_DEFS[defId];
  const max = def.maxCount;
  if (
    max !== undefined &&
    Object.values(world.buildings).filter((b) => b.defId === defId).length >= max.n
  )
    return fail(max.reason);
  const ground = checkGround(isl, x, y, def.w, def.h);
  if (!ground.ok) return ground;
  for (const rule of def.site) {
    const res = siteRuleOk(world, defId, x, y, rule, island);
    if (!res.ok) return res;
  }
  return ok;
}
