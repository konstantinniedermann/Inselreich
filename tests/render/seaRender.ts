// Gemeinsame Testhelfer der Fremdinsel-Render-Tests (M12 E2). Nur Tests.
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, World } from '../../src/sim/types';
import { footprint, tileAt } from '../../src/sim/world';

/** Holzfäller als Literal auf Insel `island`, auf einem freien 2 × 2-Grasfeld (Id, Kacheln, ohne Kosten). */
export function lumberjackLiteral(w: World, island: number): Building {
  const isl = w.islands[island]!;
  const def = BUILDING_DEFS.lumberjack;
  for (let y = 1; y < isl.height - 3; y++)
    for (let x = 1; x < isl.width - 3; x++) {
      const fp = footprint(def, x, y);
      if (
        !fp.every(
          (p) => tileAt(isl, p.x, p.y)!.terrain === 'grass' && !tileAt(isl, p.x, p.y)!.buildingId,
        )
      )
        continue;
      const id = w.nextBuildingId++;
      const b: Building = {
        id,
        defId: 'lumberjack',
        x,
        y,
        connected: false,
        progress: 0,
        state: 'ok',
        island,
      };
      w.buildings[id] = b;
      for (const p of fp) tileAt(isl, p.x, p.y)!.buildingId = id;
      return b;
    }
  throw new Error('kein freies Feld');
}
