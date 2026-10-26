// homeTravel.ts — Fahrzeit Heimat–Insel (I-136), geteilt von Inselkarte und Fernkarte. DOM-frei, liest nur die Welt.
import { HOME } from '../sim/world';
import { seaLanes, travelTicksOf, type Lane } from '../sim/islands';
import type { World } from '../sim/types';

/** Lane-Provider; injizierbar, damit Tests die Berechnungen zählen können. */
export type Lanes = (world: World) => Lane[];

/** Cache je Welt-Objekt: `compute` läuft je Welt einmal. */
export function createLaneCache(compute: Lanes = (w) => seaLanes(w.islands)): Lanes {
  const cache = new WeakMap<World, Lane[]>();
  return (world) => {
    let all = cache.get(world);
    if (!all) cache.set(world, (all = compute(world)));
    return all;
  };
}

/** Standard-Cache der UI. */
export const laneCache: Lanes = createLaneCache();

/** Seeweg (Lane) Heimat–`island`, mit Länge `d` in Kacheln; `null` für Heimat, fehlende Insel oder fehlende Lane. */
export function homeLane(world: World, island: number, lanes: Lanes = laneCache): Lane | null {
  if (island === HOME || world.islands[island] === undefined) return null;
  return lanes(world).find((l) => l.a === HOME && l.b === island) ?? null;
}

/** Einzelfahrt-Dauer Heimat–`island` in Ticks; `null` ohne Lane. */
export function homeTravelTicks(
  world: World,
  island: number,
  lanes: Lanes = laneCache,
): number | null {
  const lane = homeLane(world, island, lanes);
  return lane === null ? null : travelTicksOf(world, lane.d);
}
