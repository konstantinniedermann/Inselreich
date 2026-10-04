import type { CrisisView } from '../sim/queries';
import type { World } from '../sim/types';

/** Ortsbezug eines Log-Eintrags: Gebäude-ID und Kachel zum Entstehungszeitpunkt (kein Teil des Spielstands). */
export interface LogTarget {
  id: number;
  x: number;
  y: number;
}

/** Ziel aus Krisenansicht und Welt; `undefined`, wenn es keinen Ort gibt oder das Gebäude schon fehlt. */
export function logTargetFor(view: CrisisView, world: World): LogTarget | undefined {
  if (view.phase === 'none' || view.target === undefined) return undefined;
  const b = world.buildings[view.target];
  return b ? { id: b.id, x: b.x, y: b.y } : undefined;
}

/** Klick auf einen Eintrag: Kachel zum Zentrieren und ob dort noch dasselbe Gebäude steht. */
export function resolveLogClick(
  target: LogTarget,
  world: Pick<World, 'buildings'>,
): { tile: { x: number; y: number }; exists: boolean } {
  const b = world.buildings[target.id];
  const exists = b !== undefined && b.x === target.x && b.y === target.y;
  return { tile: { x: target.x, y: target.y }, exists };
}
