import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { BuildingDefId, World } from '../sim/types';

/**
 * Bestandszeile des Bau-Tooltips (I-167): wie viele Gebäude der Art auf der Kamera-Insel stehen.
 * `null` für Gebäude, die es nur einmal je Insel gibt (Kontor, Kontor II, `maxCount.n === 1`).
 */
export function standLine(world: World, defId: BuildingDefId, island: number): string | null {
  if (defId === 'kontor' || defId === 'kontor2') return null;
  if (BUILDING_DEFS[defId].maxCount?.n === 1) return null;
  let n = 0;
  let still = 0;
  let all = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.defId !== defId) continue;
    all += 1;
    if (b.island !== island) continue;
    n += 1;
    if (b.paused === true) still += 1;
  }
  if (all === 0) return 'Steht: noch keins';
  let text = `Steht: ${n}`;
  if (still > 0) text += ` (${still} still)`;
  if (all > n) text += ` · alle Inseln: ${all}`;
  return text;
}
