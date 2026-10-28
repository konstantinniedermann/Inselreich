import { petitionCycle } from './petitionEffect';
import { councilCycle } from './council';
import { BUILDING_DEFS, PAUSED_UPKEEP_PCT, THROTTLED_UPKEEP_PCT } from './defs/buildings';
import { harvestActive, harvestCycle } from './feastEffect';
import { LEVELS, type LevelDef } from './defs/levels';
import { ISLANDS, TRAIT_BUILDINGS, TRAIT_CYCLE_PCT, type IslandTrait } from './defs/sea';
import { EFF_MAX, EFF_WINDOW } from './defs/timing';
import { runningLevel, type LevelContext } from './levelRules';
import type { Building, BuildingDefId, World } from './types';

const levelDefAt = (b: Building, level: number): LevelDef | undefined =>
  LEVELS[b.defId]?.[level - 2];
/** Laufende Stufe k; Betriebe ohne Ausbau laufen immer auf Stufe 1 (keine Abfrage). */
const kOf = (world: World, b: Building, ctx?: LevelContext): number =>
  b.level === undefined ? 1 : runningLevel(world, b, ctx);
/** Grundzyklus der Stufe `k` (Stufe 1: Def). */
const levelCycle = (b: Building, k: number): number | undefined =>
  levelDefAt(b, k)?.cycle ?? BUILDING_DEFS[b.defId].cycle;
/** Unterhalt u(k) je 100 Ticks der Stufe `k` (Stufe 1: Def). */
const levelUpkeep = (b: Building, k: number): number =>
  levelDefAt(b, k)?.upkeep ?? BUILDING_DEFS[b.defId].upkeep;
/** Trait der Insel, der den Zyklus von `defId` verkürzt (erster in Def-Reihenfolge); Heimat nie (Spec R1.2, R1.6). */
export function traitOf(
  world: World,
  island: number,
  defId: BuildingDefId,
): IslandTrait | undefined {
  const kind = world.islands[island]?.kind;
  if (kind === undefined || kind === 'home') return undefined;
  return ISLANDS.find((d) => d.kind === kind)?.traits.find((t) =>
    TRAIT_BUILDINGS[t]?.includes(defId),
  );
}
/** Zyklus auf `island` nach Inselvorteil: abgerundet, mindestens 1 (Spec R1.4). Einzige Stelle des Faktors. */
export const islandCycle = (
  world: World,
  island: number,
  defId: BuildingDefId,
  cycle: number,
): number =>
  traitOf(world, island, defId) === undefined
    ? cycle
    : Math.max(1, Math.floor((cycle * TRAIT_CYCLE_PCT) / 100));
/** Zyklus nach Ratsbeschluss und Inselvorteil. Einziger Leseort (R706 a). */
export const effectiveCycle = (
  world: World,
  island: number,
  defId: BuildingDefId,
  cycle: number,
): number => islandCycle(world, island, defId, councilCycle(world, defId, cycle));
/** Zyklus (Ticks) des Betriebs auf laufender Stufe k; `undefined` ohne Zyklus. Einziger Leseort (Spec 3.1, R1.8). */
export function cycleOf(world: World, b: Building, ctx?: LevelContext): number | undefined {
  if (BUILDING_DEFS[b.defId].cycle === undefined) return undefined;
  const c = effectiveCycle(world, b.island, b.defId, levelCycle(b, kOf(world, b, ctx))!);
  const fest = harvestActive(world, b) ? harvestCycle(c) : c;
  return Math.min(fest, petitionCycle(world, b.island, b.defId, c));
}
/** Unterhalt u(g) je 100 Ticks der gebauten Stufe. */
export const upkeepOf = (b: Building): number => levelUpkeep(b, b.level ?? 1);
/** Unterhalt je 100 Ticks, wirksam: stillgelegt halb von u(g), aufgerundet (Spec S4); gedrosselt (k < g) u(k) + Anteil der Differenz (R6). Einziger Leseort für die Summe. */
export function buildingUpkeep(world: World, b: Building, ctx?: LevelContext): number {
  const g = upkeepOf(b);
  if (b.paused === true) return Math.ceil((g * PAUSED_UPKEEP_PCT) / 100);
  const k = kOf(world, b, ctx);
  if (k >= (b.level ?? 1)) return g;
  const low = levelUpkeep(b, k);
  return low + Math.ceil(((g - low) * THROTTLED_UPKEEP_PCT) / 100);
}
/** Auslastung in Promille 0 … 1000; `null` ohne `produces` (Spec 3.5). */
export const utilization = (b: Building): number | null =>
  BUILDING_DEFS[b.defId].produces === undefined
    ? null
    : Math.floor((b.eff ?? EFF_WINDOW * EFF_MAX) / EFF_WINDOW);
