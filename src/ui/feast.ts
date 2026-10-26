import { BUILDING_DEFS } from '../sim/defs/buildings';
import { FEAST_KIND_IDS, FEAST_KINDS, type FeastKind } from '../sim/defs/feast';
import { GOODS } from '../sim/defs/goods';
import {
  feastActive,
  feastBlockReason,
  feastKindOf,
  feastState,
  harvestActive,
} from '../sim/feast';
import { goodUnlocked } from '../sim/unlocks';
import type { Building, GoodId, World } from '../sim/types';
import { formatClock } from './time';

export interface FeastButtonView {
  kind: FeastKind;
  /** Beschriftung: Name und Preis der Art. */
  label: string;
  /** Knopf sperren (Fest läuft, Abklingzeit oder Sperrgrund). */
  disabled: boolean;
  /** Sperrgrund (Text der Sim) als Tooltip, sonst leer. */
  title: string;
  /** Sichtbare Sperrgrund-Zeile, nur im Zustand «bereit», sonst `null` (P-4). */
  reason: string | null;
}

/** Preis einer Festart als Text, z. B. «10 Rum, 15 Stoff» (Schlüsselreihenfolge von `cost`). */
export function feastCostText(kind: FeastKind): string {
  return (Object.entries(FEAST_KINDS[kind].cost) as [GoodId, number][])
    .map(([good, n]) => `${n} ${GOODS[good].name}`)
    .join(', ');
}

/** Festknöpfe einer Kapelle; `null` für andere Gebäude und solange Rum nicht freigeschaltet ist (U4). */
export function feastButtons(world: World, b: Building): FeastButtonView[] | null {
  if (BUILDING_DEFS[b.defId].service !== 'faith') return null;
  if (!goodUnlocked(world, 'rum')) return null;
  const ready = feastState(world, b).phase === 'ready';
  return FEAST_KIND_IDS.map((kind) => {
    const block = feastBlockReason(world, b, kind);
    return {
      kind,
      label: `${FEAST_KINDS[kind].name} · ${feastCostText(kind)}`,
      disabled: block !== null,
      title: block ?? '',
      reason: ready ? block : null,
    };
  });
}

/** Zeile über den Knöpfen: laufende Art mit Restzeit bzw. Abklingzeit, sonst `null`. */
export function feastStatusLine(world: World, chapel: Building): string | null {
  const s = feastState(world, chapel);
  if (s.phase === 'active')
    return `${FEAST_KINDS[feastKindOf(chapel)].name} läuft noch ${formatClock(s.remaining)}`;
  if (s.phase === 'cooldown') return `Nächstes Fest in ${formatClock(s.remaining)}`;
  return null;
}

/** Betriebs-Zeile, solange ein Erntefest auf den Betrieb wirkt, sonst `null`. */
export function harvestLine(world: World, b: Building): string | null {
  return harvestActive(world, b) ? `Erntefest: Zyklus ${FEAST_KINDS.harvest.cyclePct} %` : null;
}

/** Zeile im Haus-Panel, solange ein Fest auf das Haus wirkt, sonst `null`. */
export function houseFeastLine(world: World, house: Building): string | null {
  return feastActive(world, house) ? 'Fest: schnellerer Aufstieg' : null;
}
