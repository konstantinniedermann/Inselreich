// Pipette (Spec TASTEN-KOMFORT 5.3): Gebäudetyp unter dem Zeiger als Bauwerkzeug. Rein, ohne DOM.
import type { Tool } from '../render/renderer';
import type { BuildingDefId, World } from '../sim/types';
import { tileAt } from '../sim/world';
import { lockedToolText } from './goal';

export const PIPETTE_KONTOR_TEXT = 'Kontor lässt sich nicht nachbauen';

/** Bauwerkzeug zu einem Gebäudetyp; `null` für beide Kontore. */
export function toolForBuilding(defId: BuildingDefId): Tool | null {
  return defId === 'kontor' || defId === 'kontor2' ? null : { kind: 'build', defId };
}

export type PipetteResult = { ok: true; tool: Tool } | { ok: false; reason: string };

/** Werkzeug oder Grund (Kontor-Text bzw. Sperrtext wie `lockedToolText`). */
export function pipetteResult(world: World, defId: BuildingDefId): PipetteResult {
  const tool = toolForBuilding(defId);
  if (tool === null) return { ok: false, reason: PIPETTE_KONTOR_TEXT };
  const lock = lockedToolText(world, tool);
  return lock === null ? { ok: true, tool } : { ok: false, reason: lock };
}

/** Gebäudetyp auf der Kachel (jede Kachel der Grundfläche), sonst `null`. */
export function buildingDefAt(
  world: World,
  island: number,
  x: number,
  y: number,
): BuildingDefId | null {
  const isl = world.islands[island];
  const tile = isl ? tileAt(isl, x, y) : undefined;
  if (!tile || tile.buildingId === null) return null;
  return world.buildings[tile.buildingId]?.defId ?? null;
}
