import { BUILDING_DEFS } from '../sim/defs/buildings';
import { FEAST_RUM } from '../sim/defs/timing';
import { feastActive, feastBlockReason, feastState } from '../sim/feast';
import { goodUnlocked } from '../sim/unlocks';
import type { Building, World } from '../sim/types';
import { formatClock } from './time';

export interface FeastView {
  /** Beschriftung des Knopfs. */
  label: string;
  /** Knopf sperren (Fest läuft, Abklingzeit oder Sperrgrund). */
  disabled: boolean;
  /** Sperrgrund im Zustand «bereit» (Text der Sim), sonst `null`. */
  reason: string | null;
}

/** Knopf „Fest feiern" einer Kapelle; `null` für andere Gebäude und solange Rum nicht freigeschaltet ist (U4). */
export function feastView(world: World, b: Building): FeastView | null {
  if (BUILDING_DEFS[b.defId].service !== 'faith') return null;
  if (!goodUnlocked(world, 'rum')) return null;
  const s = feastState(world, b);
  if (s.phase === 'active')
    return { label: `Fest läuft noch ${formatClock(s.remaining)}`, disabled: true, reason: null };
  if (s.phase === 'cooldown')
    return { label: `Nächstes Fest in ${formatClock(s.remaining)}`, disabled: true, reason: null };
  const reason = feastBlockReason(world, b);
  return { label: `Fest feiern (${FEAST_RUM} Rum)`, disabled: reason !== null, reason };
}

/** Zeile im Haus-Panel, solange ein Fest auf das Haus wirkt, sonst `null`. */
export function houseFeastLine(world: World, house: Building): string | null {
  return feastActive(world, house) ? 'Fest: schnellerer Aufstieg' : null;
}
