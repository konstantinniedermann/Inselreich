import { distance } from './coverage';
import { BUILDING_DEFS } from './defs/buildings';
import { LEVELS, WORKFORCE_RADIUS, type LevelDef, type LevelSite } from './defs/levels';
import { isProtected } from './fireCover';
import { countFreeTerrain, countTerrain } from './terrainCount';
import type { Building, Tier, World } from './types';
import { center, footprint, tilesInRadius } from './world';

/** Laufende Stufe k als reine Abfrage (Spec R3–R5): liest die Welt, schreibt nichts, kein Zwischenspeicher. */

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
): SiteInfo {
  const have = Object.values(world.buildings).filter(
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
  const have =
    isl === undefined
      ? 0
      : site.kind === 'freeTerrain'
        ? countFreeTerrain(
            isl,
            tilesInRadius(isl, cx, cy, site.radius),
            site.terrain,
            footprint(def, b.x, b.y),
          )
        : countTerrain(isl, tilesInRadius(isl, cx, cy, site.radius), site.terrain);
  return { ok: have >= site.min, kind: site.kind, have, need: site.min };
}

function stationSite(world: World, b: Building): SiteInfo {
  if (world.crisisLevel === 'off') return { ok: true, kind: 'fireStation', have: 0, need: 0 };
  const have = isProtected(world, b) ? 1 : 0;
  return { ok: have >= 1, kind: 'fireStation', have, need: 1 };
}

/** Standortregel der Stufe `level`; `null` bei einer Stufe ohne Standortbedingung. */
export function siteAt(world: World, b: Building, level: number): SiteInfo | null {
  const site = defOf(b, level)?.site;
  if (site === undefined) return null;
  switch (site.kind) {
    case 'fisherSpacing':
      return fisherSite(world, b, site);
    case 'fireStation':
      return stationSite(world, b);
    default:
      return terrainSite(world, b, site);
  }
}

/** Grösstes j ≤ gebaute Stufe, dessen Fachkräfte und Standort halten; Stufe 1 gilt immer. */
export function runningLevel(world: World, b: Building): number {
  for (let j = b.level ?? 1; j > 1; j--) {
    if (workforceAt(world, b, j).ok && (siteAt(world, b, j)?.ok ?? true)) return j;
  }
  return 1;
}
