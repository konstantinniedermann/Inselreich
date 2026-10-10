import { BUILDING_DEFS, PAUSED_UPKEEP_PCT } from './defs/buildings';
import { LEVELS, type LevelDef } from './defs/levels';
import { EFF_MAX, EFF_WINDOW } from './defs/timing';
import type { Building } from './types';

const levelDef = (b: Building): LevelDef | undefined =>
  b.level === undefined ? undefined : LEVELS[b.defId]?.[b.level - 2];
/** Zyklus (Ticks) des stehenden Betriebs; `undefined` ohne Zyklus. Einziger Leseort (Spec 3.1). */
export const cycleOf = (b: Building): number | undefined =>
  BUILDING_DEFS[b.defId].cycle === undefined
    ? undefined
    : (levelDef(b)?.cycle ?? BUILDING_DEFS[b.defId].cycle);
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
