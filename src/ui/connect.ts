import { home } from '../sim/world';
import { ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { connectPath } from '../sim/connect';
import { checkAfford } from '../sim/economy';
import { needsConnection } from '../sim/roads';
import type { Building, Cost, World } from '../sim/types';
import type { Pos } from '../sim/world';
import { friendlyReason } from './hints';

export interface ConnectView {
  label: string;
  ok: boolean;
  reason: string | null;
  tiles: Pos[];
  /** Gesamtkosten des Wegs (für die Fehlermeldung der Aktion). */
  cost: Cost;
}

/**
 * Anzeige des Knopfs „Anbinden" im Info-Panel (reine Darstellung, keine Regel): Pfad und Kosten stammen aus
 * der Sim (`connectPath`, `checkAfford`). `null`, wenn der Bau keinen Weg braucht oder schon angebunden ist.
 */
export function connectView(world: World, b: Building): ConnectView | null {
  if (!needsConnection(b.defId) || b.connected) return null;
  const path = connectPath(world, b.id);
  if (!path.ok) {
    return {
      label: 'Anbinden',
      ok: false,
      reason: friendlyReason(world, path.reason, { island: b.island }),
      tiles: [],
      cost: { ...ROAD_COST_OBJ, money: 0 },
    };
  }
  const n = path.tiles.length;
  const cost = { ...ROAD_COST_OBJ, money: n * ROAD_COST };
  const label = `Anbinden (${n} ${n === 1 ? 'Weg' : 'Wege'} · ${cost.money} Geld)`;
  const afford = checkAfford(world, world.islands[b.island] ?? home(world), cost);
  return {
    label,
    ok: afford.ok,
    reason: afford.ok ? null : friendlyReason(world, afford.reason, { cost, island: b.island }),
    tiles: path.tiles,
    cost,
  };
}
