// islandTools.ts — rein: Zielinsel und Bauleisten-Grund der Werkzeuge im Archipel (M12 E2). Keine Regeln: die
// Gründe kommen aus der Sim (`noKontorReason`, `affordBuild`), hier wird nur die Insel unter dem Zeiger gewählt.
import { islandCam, islandView, pickArchipel } from '../render/archipel';
import type { Camera } from '../render/camera';
import type { Tool } from '../render/renderer';
import { affordBuild, noKontorReason } from '../sim/placement';
import { BUILDING_DEFS, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import { ok, type Cost, type Result, type World } from '../sim/types';
import { HOME } from '../sim/world';
import { targetTile } from './target';

/** Kachel einer Insel in Inselkoordinaten. */
export interface IslandTile {
  island: number;
  x: number;
  y: number;
}

/** Ziel eines Klicks aus einem Pick: Insel und inselinterne Kachel; Meer (kein Pick) ergibt `null`. */
export function toolTarget(pick: IslandTile | null): IslandTile | null {
  return pick === null ? null : { island: pick.island, x: pick.x, y: pick.y };
}

/**
 * Zielkachel samt Insel unter dem Bildpunkt. Die Heimat gilt wie bisher (inkl. Gebäudehüllen über dem Rand);
 * sonst entscheidet `pickArchipel`, und die Kachel wird in der Ansicht dieser Insel bestimmt.
 */
export function pickTarget(
  world: World,
  cam: Camera,
  tool: Tool,
  sx: number,
  sy: number,
): IslandTile | null {
  const h = targetTile(world, cam, tool, sx, sy);
  if (h) return { island: HOME, x: h.x, y: h.y };
  const hit = pickArchipel(cam, sx, sy, world.islands);
  if (!hit || hit.island === HOME) return toolTarget(null);
  const t = targetTile(
    islandView(world, hit.island),
    islandCam(cam, world.islands[hit.island]!),
    tool,
    sx,
    sy,
  );
  return t ? toolTarget({ island: hit.island, x: t.x, y: t.y }) : null;
}

/** Bau-, Weg- und Forstwerkzeuge brauchen auf einer Fremdinsel ein Kontor; sonst `null` (Grund aus der Sim). */
export function toolBlockReason(world: World, tool: Tool, island: number): string | null {
  if (tool.kind === 'build') return tool.defId === 'kontor2' ? null : noKontorReason(world, island);
  if (tool.kind === 'road' || tool.kind === 'clearForest' || tool.kind === 'plantForest')
    return noKontorReason(world, island);
  return null;
}

/** Kosten eines Werkzeugs aus den Defs; Auswahl und Abriss kosten nichts. */
export function toolCost(tool: Tool): Cost | null {
  if (tool.kind === 'build') return BUILDING_DEFS[tool.defId].cost;
  if (tool.kind === 'road') return ROAD_COST_OBJ;
  if (tool.kind === 'clearForest') return CLEAR_FOREST_COST;
  if (tool.kind === 'plantForest') return PLANT_FOREST_COST;
  return null;
}

/** Kosten werden ab `kontor2` aus der Heimat bezahlt („aus der Heimat“), alles andere aus dem Insellager. */
export function paidFromHome(tool: Tool): boolean {
  return tool.kind === 'build' && tool.defId === 'kontor2';
}

/** Leistbarkeit eines Werkzeugs auf der Insel (Grund aus der Sim, bei Fremdinseln mit Ortsnamen). */
export function toolAfford(world: World, tool: Tool, island: number): Result {
  const cost = toolCost(tool);
  return cost === null ? ok : affordBuild(world, island, cost, paidFromHome(tool));
}
