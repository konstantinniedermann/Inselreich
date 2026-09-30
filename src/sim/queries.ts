import { BUILDING_DEFS } from './defs/buildings';
import { GOOD_IDS, STORAGE_CAP } from './defs/goods';
import { TIERS } from './defs/tiers';
import { refundCost } from './economy';
import { isSupplied, serviceAvailable } from './population';
import { supplyBuildings } from './supply';
import type { Building, BuildingDefId, Cost, GoodId, ServiceId, World } from './types';
import { center, idx, tilesInRadius, type Pos } from './world';

/** Reine Abfragen für UI und Renderer: lesen die Welt, verändern sie nie. */

export type Diagnosis =
  { kind: 'supply' } | { kind: 'good'; good: GoodId } | { kind: 'service'; service: ServiceId };
export type CoverageKind = 'supply' | ServiceId;

/** Standortradius der Rohstoffbetriebe mit Zone: Holzfäller (Wald), Schäferei und Zuckerrohr (Gras). */
function siteZone(defId: BuildingDefId): { terrain: 'forest' | 'grass'; radius: number } | null {
  for (const rule of BUILDING_DEFS[defId].site) {
    if (rule.kind === 'radius' && (rule.terrain === 'forest' || rule.terrain === 'grass'))
      return { terrain: rule.terrain, radius: rule.radius };
  }
  return null;
}

/** Erzeugung und Verbrauch je Gut über 100 Ticks (nominal, ungerundet). */
export function goodsBalance(
  world: World,
): Record<GoodId, { produced: number; consumed: number; net: number }> {
  const out = {} as Record<GoodId, { produced: number; consumed: number; net: number }>;
  for (const g of GOOD_IDS) out[g] = { produced: 0, consumed: 0, net: 0 };
  for (const b of Object.values(world.buildings)) {
    if (b.house) {
      if (!isSupplied(world, b)) continue;
      const needs = TIERS[b.house.tier].needs;
      for (const g of Object.keys(needs) as GoodId[])
        out[g].consumed += b.house.inhabitants * needs[g]!;
      continue;
    }
    if (!b.connected) continue;
    const def = BUILDING_DEFS[b.defId];
    if (def.cycle === undefined) continue;
    if (def.produces) out[def.produces].produced += 100 / def.cycle;
    if (def.consumes) out[def.consumes].consumed += 100 / def.cycle;
  }
  for (const g of GOOD_IDS) out[g].net = out[g].produced - out[g].consumed;
  return out;
}

/** Was dem Haus fehlt: Versorgung, sonst Güter (Reihenfolge GOOD_IDS), dann Dienste. Leer = alles erfüllt. */
export function houseDiagnosis(world: World, b: Building): Diagnosis[] {
  const house = b.house;
  if (!house) return [];
  if (!isSupplied(world, b)) return [{ kind: 'supply' }];
  const tier = TIERS[house.tier];
  const out: Diagnosis[] = [];
  for (const good of GOOD_IDS) {
    if (good in tier.needs && house.satisfied[good] !== true) out.push({ kind: 'good', good });
  }
  for (const service of tier.services) {
    if (!serviceAvailable(world, b, service)) out.push({ kind: 'service', service });
  }
  return out;
}

/** Quellen einer Abdeckungsart: Kontor und angebundene Märkte bzw. angebundene Dienstgebäude. */
function coverageSources(
  world: World,
  kind: CoverageKind,
): { cx: number; cy: number; radius: number }[] {
  const buildings =
    kind === 'supply'
      ? supplyBuildings(world)
      : Object.values(world.buildings).filter(
          (b) => b.connected && BUILDING_DEFS[b.defId].service === kind,
        );
  return buildings.map((b) => {
    const def = BUILDING_DEFS[b.defId];
    const c = center(def, b.x, b.y);
    return { ...c, radius: (kind === 'supply' ? def.supplyRadius : def.serviceRadius) ?? 0 };
  });
}

/** Wahr, wo ein 1×1-Haus versorgt wäre bzw. den Dienst hätte (Index y × width + x). */
export function coverageMask(world: World, kind: CoverageKind): boolean[] {
  const sources = coverageSources(world, kind);
  const mask = new Array<boolean>(world.width * world.height).fill(false);
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      mask[idx(world, x, y)] = sources.some(
        (s) => Math.hypot(x + 0.5 - s.cx, y + 0.5 - s.cy) <= s.radius,
      );
    }
  }
  return mask;
}

/** Kreis und hervorzuhebende Kacheln für die Platzierungsvorschau; `null` ohne Zone. */
export function placementZone(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
): { cx: number; cy: number; radius: number; tiles: Pos[] } | null {
  const def = BUILDING_DEFS[defId];
  const c = center(def, x, y);
  const circle = def.supplyRadius ?? def.serviceRadius;
  if (circle !== undefined) {
    return { ...c, radius: circle, tiles: tilesInRadius(world, c.cx, c.cy, circle) };
  }
  const zone = siteZone(defId);
  if (!zone) return null;
  const tiles = tilesInRadius(world, c.cx, c.cy, zone.radius).filter(
    (p) => world.tiles[idx(world, p.x, p.y)]!.terrain === zone.terrain,
  );
  return { ...c, radius: zone.radius, tiles };
}

/** Rückerstattung, wie `grantRefund` sie einlagert: Güter auf den freien Lagerplatz gekappt. */
export function effectiveRefund(world: World, cost: Cost): Cost {
  const r = refundCost(cost);
  const room = (g: GoodId): number => Math.max(0, STORAGE_CAP - world.stock[g]);
  return {
    money: r.money,
    wood: Math.min(r.wood, room('wood')),
    tools: Math.min(r.tools, room('tools')),
    stone: Math.min(r.stone, room('stone')),
  };
}

/** Cache-Schlüssel des Layouts: ändert sich bei Bau, Abriss, Weg und Anbindung, nicht durch `step()` allein. */
export function layoutKey(world: World): string {
  let roadSum = 0;
  for (let i = 0; i < world.tiles.length; i++) if (world.tiles[i]!.road) roadSum += i;
  let connectedSum = 0;
  let count = 0;
  for (const b of Object.values(world.buildings)) {
    count += 1;
    if (b.connected) connectedSum += b.id;
  }
  return `${world.nextBuildingId}|${count}|${roadSum}|${connectedSum}`;
}
