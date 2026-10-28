import { distance } from './coverage';
import { BUILDING_DEFS } from './defs/buildings';
import { LEVELS, WORKFORCE_RADIUS, type LevelDef, type LevelSite } from './defs/levels';
import { isProtected } from './fireCover';
import { countTerrainAround } from './terrainCount';
import type { Building, Tier, World } from './types';
import { center } from './world';

/**
 * Laufende Stufe k als reine Abfrage (Spec R3–R5): liest die Welt, schreibt nichts. Ein `LevelContext` ist
 * nur eine je Aufruf gesammelte Sicht (Häuser im Raster, Wachen, Fischer) für Schleifen über viele Betriebe;
 * er lebt im Aufrufer, nie in Welt, Save oder Modul. Ergebnisse sind mit und ohne Kontext gleich.
 */

export interface WorkforceInfo {
  ok: boolean;
  tier: Tier;
  /** Aufgerundeter Abstand des nächsten passenden Hauses derselben Insel; `null` ohne ein solches. */
  nearest: number | null;
  /** Ein passendes Haus im Arbeitsweg steht nur auf einer anderen Insel. */
  otherIsland: boolean;
}

export interface SiteInfo {
  ok: boolean;
  kind: LevelSite['kind'];
  have: number;
  need: number;
}

/** Je Insel: Häuser im Raster (Zellkante = Arbeitsweg), Wachen und Fischer. */
export interface LevelContext {
  houses: Map<number, Map<string, Building[]>>;
  stations: Map<number, Building[]>;
  fishers: Map<number, Building[]>;
}

const cellOf = (v: number): number => Math.floor(v / WORKFORCE_RADIUS);
const cellKey = (cx: number, cy: number): string => `${cx},${cy}`;
const push = <K>(m: Map<K, Building[]>, key: K, b: Building): void => {
  const list = m.get(key);
  if (list === undefined) m.set(key, [b]);
  else list.push(b);
};

/** Sammelt Häuser, Wachen und Fischer einmal (Reihenfolge der Gebäude-IDs). */
export function buildLevelContext(world: World): LevelContext {
  const ctx: LevelContext = { houses: new Map(), stations: new Map(), fishers: new Map() };
  for (const b of Object.values(world.buildings)) {
    if (b.house !== undefined) {
      let cells = ctx.houses.get(b.island);
      if (cells === undefined) ctx.houses.set(b.island, (cells = new Map()));
      push(cells, cellKey(cellOf(b.x), cellOf(b.y)), b);
    }
    if (BUILDING_DEFS[b.defId].fireProtection === true) push(ctx.stations, b.island, b);
    if (b.defId === 'fisher') push(ctx.fishers, b.island, b);
  }
  return ctx;
}

/** Steht im Arbeitsweg ein Haus derselben Insel mit Bevölkerungsstufe ≥ `tier`? Nur Zellen in Reichweite. */
function crewNear(ctx: LevelContext, b: Building, tier: Tier): boolean {
  const cells = ctx.houses.get(b.island);
  if (cells === undefined) return false;
  const reach = WORKFORCE_RADIUS + 2; // Spielraum für die Mitte mehrkachliger Betriebe
  for (let cx = cellOf(b.x - reach); cx <= cellOf(b.x + reach); cx++)
    for (let cy = cellOf(b.y - reach); cy <= cellOf(b.y + reach); cy++)
      for (const h of cells.get(cellKey(cx, cy)) ?? [])
        if (h.house!.tier >= tier && distance(b, h) <= WORKFORCE_RADIUS) return true;
  return false;
}

const defOf = (b: Building, level: number): LevelDef | undefined => LEVELS[b.defId]?.[level - 2];

/** Fachkräfte der Stufe `level`: ein Wohnhaus derselben Insel mit genügender Bevölkerungsstufe im Arbeitsweg. */
export function workforceAt(world: World, b: Building, level: number): WorkforceInfo {
  const tier = defOf(b, level)?.workforceTier ?? 1;
  let nearest: number | null = null;
  let otherIsland = false;
  for (const h of Object.values(world.buildings)) {
    if (h.house === undefined || h.house.tier < tier) continue;
    const d = distance(b, h);
    if (h.island !== b.island) {
      otherIsland = otherIsland || d <= WORKFORCE_RADIUS;
    } else if (nearest === null || d < nearest) {
      nearest = d;
    }
  }
  const ok = nearest === null ? defOf(b, level) === undefined : nearest <= WORKFORCE_RADIUS;
  return { ok, tier, nearest: nearest === null ? null : Math.ceil(nearest), otherIsland };
}

function fisherSite(
  world: World,
  b: Building,
  site: LevelSite & { kind: 'fisherSpacing' },
  ctx?: LevelContext,
): SiteInfo {
  const have = (
    ctx === undefined ? Object.values(world.buildings) : (ctx.fishers.get(b.island) ?? [])
  ).filter(
    (o) =>
      o.defId === 'fisher' &&
      o.id !== b.id &&
      o.island === b.island &&
      distance(b, o) <= site.radius,
  ).length;
  return { ok: have <= site.maxOthers, kind: site.kind, have, need: site.maxOthers };
}

function terrainSite(
  world: World,
  b: Building,
  site: LevelSite & { kind: 'freeTerrain' | 'terrainNear' },
): SiteInfo {
  const isl = world.islands[b.island];
  const def = BUILDING_DEFS[b.defId];
  const { cx, cy } = center(def, b.x, b.y);
  const own = site.kind === 'freeTerrain' ? { x: b.x, y: b.y, w: def.w, h: def.h } : undefined;
  const have =
    isl === undefined ? 0 : countTerrainAround(isl, cx, cy, site.radius, site.terrain, own);
  return { ok: have >= site.min, kind: site.kind, have, need: site.min };
}

function stationSite(world: World, b: Building, ctx?: LevelContext): SiteInfo {
  if (world.crisisLevel === 'off') return { ok: true, kind: 'fireStation', have: 0, need: 0 };
  const have = isProtected(world, b, ctx && (ctx.stations.get(b.island) ?? [])) ? 1 : 0;
  return { ok: have >= 1, kind: 'fireStation', have, need: 1 };
}

/** Standortregel der Stufe `level`; `null` bei einer Stufe ohne Standortbedingung. */
export function siteAt(
  world: World,
  b: Building,
  level: number,
  ctx?: LevelContext,
): SiteInfo | null {
  const site = defOf(b, level)?.site;
  if (site === undefined) return null;
  switch (site.kind) {
    case 'fisherSpacing':
      return fisherSite(world, b, site, ctx);
    case 'fireStation':
      return stationSite(world, b, ctx);
    default:
      return terrainSite(world, b, site);
  }
}

/** Fachkräfte der Stufe `level` halten (mit Kontext über das Raster, sonst über `workforceAt`). */
const crewOk = (world: World, b: Building, level: number, ctx?: LevelContext): boolean =>
  defOf(b, level) === undefined ||
  (ctx === undefined
    ? workforceAt(world, b, level).ok
    : crewNear(ctx, b, defOf(b, level)?.workforceTier ?? 1));

/** Grösstes j ≤ gebaute Stufe, dessen Fachkräfte und Standort halten; Stufe 1 gilt immer. */
export function runningLevel(world: World, b: Building, ctx?: LevelContext): number {
  for (let j = b.level ?? 1; j > 1; j--) {
    if (crewOk(world, b, j, ctx) && (siteAt(world, b, j, ctx)?.ok ?? true)) return j;
  }
  return 1;
}
