// islandJump.ts — rein: Sprungziele und Inselliste für Tasten 0/9 und den Knopf „Inseln" (M12 E2).
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { islandName } from '../sim/islands';
import type { World } from '../sim/types';
import { center, HOME } from '../sim/world';

/** Nächste Insel reihum. */
export const nextIsland = (current: number, count: number): number =>
  count <= 0 ? 0 : (current + 1) % count;

/** Bildmitte beim Sprung (Archipel-Kacheln): Kontor-Mitte der Insel, sonst Mitte des Inselrechtecks. */
export function jumpTarget(world: World, i: number): { x: number; y: number } {
  const isl = world.islands[i];
  if (!isl) return { x: 0, y: 0 };
  const k = isl.kontorId === null ? undefined : world.buildings[isl.kontorId];
  if (k) {
    const c = center(BUILDING_DEFS[k.defId], k.x, k.y);
    return { x: isl.ox + c.cx, y: isl.oy + c.cy };
  }
  return { x: isl.ox + isl.width / 2, y: isl.oy + isl.height / 2 };
}

/** Einträge der Inselliste: „Heimat", „Möweninsel · Kontor" (mit Kontor), „Felsbucht". */
export function islandList(world: World): { index: number; label: string }[] {
  return world.islands.map((isl, index) => ({
    index,
    label:
      index === HOME
        ? islandName(world, index)
        : isl.kontorId === null
          ? islandName(world, index)
          : `${islandName(world, index)} · Kontor`,
  }));
}
