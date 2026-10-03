import { BUILDING_DEFS } from './defs/buildings';
import { GOOD_IDS, STORAGE_CAP } from './defs/goods';
import { TIERS, WIN_CITIZENS, WIN_MERCHANTS } from './defs/tiers';
import { isProtected, nextCrisisTick } from './crises';
import { refundCost } from './economy';
import { cycleOf } from './levels';
import { citizens, isSupplied, merchants, serviceAvailable } from './population';
import { supplyBuildings } from './supply';
import type {
  Building,
  BuildingDefId,
  Cost,
  CrisisKind,
  FireOutcome,
  GoodId,
  ServiceId,
  Terrain,
  World,
} from './types';
import { center, idx, tilesInRadius, type Pos } from './world';

/** Reine Abfragen für UI und Renderer: lesen die Welt, verändern sie nie. */

export type Diagnosis =
  { kind: 'supply' } | { kind: 'good'; good: GoodId } | { kind: 'service'; service: ServiceId };
export type CoverageKind = 'supply' | ServiceId | 'fire';
export type CrisisView =
  | { phase: 'none'; next: number | null }
  | {
      phase: 'warning' | 'active';
      kind: CrisisKind;
      period: number;
      from: number;
      until: number;
      remaining: number;
      good?: GoodId;
      target?: number;
      targetExists: boolean;
      outcome?: FireOutcome;
      tile?: { x: number; y: number };
    };

/** Zielanzeige (M8 12): Bürger-Ziel mit Ausblick, dann Kaufleute-Ziel, dann erreicht. Eine Quelle für HUD und Banner. */
export type GoalView =
  | {
      phase: 'citizens';
      current: number;
      target: number;
      next: { tierName: string; target: number; unlockCitizens: number | null };
    }
  | { phase: 'merchants'; current: number; target: number }
  | { phase: 'done'; current: number; target: number };

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
    const cycle = cycleOf(b);
    if (cycle === undefined) continue;
    if (def.produces) out[def.produces].produced += 100 / cycle;
    for (const g of def.consumes ?? []) out[g].consumed += 100 / cycle;
  }
  for (const g of GOOD_IDS) out[g].net = out[g].produced - out[g].consumed;
  return out;
}

/** Güter aus `consumes` mit Bestand < 1, Reihenfolge wie `consumes`; leer ohne `consumes` (M8 12). */
export function missingInputs(world: World, b: Building): GoodId[] {
  return (BUILDING_DEFS[b.defId].consumes ?? []).filter((g) => world.stock[g] < 1);
}

export function goalView(world: World): GoalView {
  if (world.wonMerchants)
    return { phase: 'done', current: merchants(world), target: WIN_MERCHANTS };
  if (world.won) return { phase: 'merchants', current: merchants(world), target: WIN_MERCHANTS };
  return {
    phase: 'citizens',
    current: citizens(world),
    target: WIN_CITIZENS,
    next: {
      tierName: TIERS[4].name,
      target: WIN_MERCHANTS,
      unlockCitizens: TIERS[4].unlockCitizens ?? null,
    },
  };
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
          (b) =>
            b.connected &&
            (kind === 'fire'
              ? BUILDING_DEFS[b.defId].fireProtection === true
              : BUILDING_DEFS[b.defId].service === kind && b.outageUntil === undefined),
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

/** Kodierung der Geländeart im Layout-Schlüssel (kein Spielwert). */
const TERRAIN_CODE: Record<Terrain, number> = {
  water: 0,
  sand: 1,
  grass: 2,
  forest: 3,
  mountain: 4,
};

/** Cache-Schlüssel des Layouts: ändert sich bei Bau, Abriss, Weg, Anbindung und Geländewechsel, nicht durch `step()` allein. */
export function layoutKey(world: World): string {
  const h = new LayoutHash();
  h.add(world.nextBuildingId);
  for (const t of world.tiles) h.add(TERRAIN_CODE[t.terrain] * 2 + (t.road ? 1 : 0));
  h.add(-1);
  for (const b of Object.values(world.buildings)) {
    h.add(b.id);
    h.add(b.x);
    h.add(b.y);
    h.add((b.connected ? 1 : 0) | (b.outageUntil !== undefined ? 2 : 0));
    for (let i = 0; i < b.defId.length; i++) h.add(b.defId.charCodeAt(i));
    h.add(-1);
  }
  return h.digest();
}

/** Zwei unabhängige FNV-1a-Bahnen (je 32 Bit) über eine Zahlenfolge; reihenfolgeabhängig, ohne Zufall. */
class LayoutHash {
  private a = 0x811c9dc5;
  private b = 0x01000193 ^ 0x9e3779b9;

  add(n: number): void {
    const v = (n + 1) >>> 0;
    this.a = Math.imul(this.a ^ v, 0x01000193) >>> 0;
    this.b = Math.imul((this.b ^ v) + 0x7f4a7c15, 0x85ebca6b) >>> 0;
    this.b ^= this.b >>> 13;
  }

  digest(): string {
    return `${this.a.toString(36)}.${this.b.toString(36)}`;
  }
}

/** Eine Sicht auf die laufende Krise für Karte, Log, crisisFx und Klang (Spec 11). Phase aus `from` abgeleitet. */
export function crisisView(world: World): CrisisView {
  const c = world.crisis;
  if (c === null) return { phase: 'none', next: nextCrisisTick(world) };
  const warning = world.tick < c.from;
  const view: CrisisView = {
    phase: warning ? 'warning' : 'active',
    kind: c.kind,
    period: c.period,
    from: c.from,
    until: c.until,
    remaining: warning ? c.from - world.tick : c.until - world.tick,
    targetExists: c.target !== undefined && world.buildings[c.target] !== undefined,
  };
  if (c.good !== undefined) view.good = c.good;
  if (c.target !== undefined) view.target = c.target;
  if (c.outcome !== undefined) view.outcome = c.outcome;
  if (c.tile !== undefined) view.tile = { x: c.tile.x, y: c.tile.y };
  return view;
}

/** Brennbare Gebäude ohne Schutz, aufsteigend nach Id (Tooltip, Info-Panel). */
export function unprotectedFlammables(world: World): Building[] {
  return Object.values(world.buildings)
    .filter((b) => BUILDING_DEFS[b.defId].flammable === true && !isProtected(world, b))
    .sort((a, b) => a.id - b.id);
}
