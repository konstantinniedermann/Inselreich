import { petitionCycle } from './petitionEffect';
import { councilCycle } from './council';
import { BUILDING_DEFS, PAUSED_UPKEEP_PCT } from './defs/buildings';
import { harvestActive, harvestCycle } from './feastEffect';
import { LEVELS, type LevelDef } from './defs/levels';
import { ISLANDS, TRAIT_BUILDINGS, TRAIT_CYCLE_PCT, type IslandTrait } from './defs/sea';
import { EFF_MAX, EFF_WINDOW } from './defs/timing';
import type { Building, BuildingDefId, World } from './types';

const levelDef = (b: Building): LevelDef | undefined =>
  b.level === undefined ? undefined : LEVELS[b.defId]?.[b.level - 2];
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
/** Zyklus (Ticks) des stehenden Betriebs; `undefined` ohne Zyklus. Einziger Leseort (Spec 3.1, R1.8). */
export function cycleOf(world: World, b: Building): number | undefined {
  const base = BUILDING_DEFS[b.defId].cycle;
  if (base === undefined) return undefined;
  const c = effectiveCycle(world, b.island, b.defId, levelDef(b)?.cycle ?? base);
  const fest = harvestActive(world, b) ? harvestCycle(c) : c;
  return petitionCycle(world, b.island, b.defId, fest);
}
/** Unterhalt je 100 Ticks des stehenden Gebäudes. */
export const upkeepOf = (b: Building): number =>
  levelDef(b)?.upkeep ?? BUILDING_DEFS[b.defId].upkeep;
/** Unterhalt je 100 Ticks, wirksam: stillgelegt halb, aufgerundet (Spec S4). Einziger Leseort für die Summe. */
export const buildingUpkeep = (b: Building): number =>
  b.paused === true ? Math.ceil((upkeepOf(b) * PAUSED_UPKEEP_PCT) / 100) : upkeepOf(b);
/** Auslastung in Promille 0 … 1000; `null` ohne `produces` (Spec 3.5). */
export const utilization = (b: Building): number | null =>
  BUILDING_DEFS[b.defId].produces === undefined
    ? null
    : Math.floor((b.eff ?? EFF_WINDOW * EFF_MAX) / EFF_WINDOW);
