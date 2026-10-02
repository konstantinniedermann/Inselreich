import { BUILDING_DEFS } from '../sim/defs/buildings';
import { BOOM_PCT, CRISIS_LEVELS } from '../sim/defs/crises';
import { GOODS } from '../sim/defs/goods';
import { STORM_DURATION } from '../sim/defs/timing';
import type { CrisisView } from '../sim/queries';
import type { BuildingDefId, CrisisKind, World } from '../sim/types';
import { formatGameTime } from './time';

/** Krisenkarte (M6 13.3): reine Textfunktion über `crisisView` und Welt; alle Werte aus `defs`. */

export interface CrisisCard {
  text: string;
  /** Art der laufenden Krise (für `data-kind`); `null` ohne Krise. */
  kind: CrisisKind | null;
  /** Hervorhebung: Warnung (Brand, Sturm), Hinweis (Boom) oder keine. */
  level: 'warn' | 'info' | null;
}

/** Name des Brandziels; ist es abgerissen, steht „abgerissenes Gebäude". */
export function targetName(view: CrisisView, world: World): string {
  if (view.phase === 'none' || view.target === undefined) return 'abgerissenes Gebäude';
  const b = world.buildings[view.target];
  return b ? BUILDING_DEFS[b.defId].name : 'abgerissenes Gebäude';
}

/** Instandsetzungsgebühr des Brandziels (Baukosten in Geld); `null`, wenn das Ziel nicht mehr steht. */
export function repairFee(view: CrisisView, world: World): number | null {
  if (view.phase === 'none' || view.target === undefined) return null;
  const b = world.buildings[view.target];
  return b ? BUILDING_DEFS[b.defId].cost.money : null;
}

/** Namen der sturmanfälligen Betriebe in Definitionsreihenfolge, z. B. „Fischerhütte, Holzfäller". */
export function stormAffectedNames(): string {
  return (Object.keys(BUILDING_DEFS) as BuildingDefId[])
    .filter((id) => BUILDING_DEFS[id].stormAffected === true)
    .map((id) => BUILDING_DEFS[id].name)
    .join(', ');
}

export function crisisCardText(view: CrisisView, world: World): CrisisCard {
  if (view.phase === 'none') {
    if (view.next === null) return { text: 'Krisen: aus', kind: null, level: null };
    return {
      text: `Krisen: ${CRISIS_LEVELS[world.crisisLevel].name} · nächste Krise in ${formatGameTime(view.next - world.tick)}`,
      kind: null,
      level: null,
    };
  }
  switch (view.kind) {
    case 'fire': {
      const name = targetName(view, world);
      if (view.outcome === 'burning') {
        const fee = repairFee(view, world);
        const feeText = fee === null ? '' : ` · Instandsetzung ${fee}`;
        return {
          text: `Brand: ${name} · Ausfall noch ${formatGameTime(view.remaining)}${feeText}`,
          kind: 'fire',
          level: 'warn',
        };
      }
      if (view.outcome === 'extinguished') {
        return { text: `Brand gelöscht: ${name} (Feuerwache)`, kind: 'fire', level: null };
      }
      return { text: 'Brand ohne Schaden', kind: 'fire', level: null };
    }
    case 'storm':
      return {
        text:
          view.phase === 'warning'
            ? `Sturmwarnung: Sturm in ${formatGameTime(view.remaining)}, dauert ${formatGameTime(STORM_DURATION)} · halbe Leistung: ${stormAffectedNames()}`
            : `Sturm: noch ${formatGameTime(view.remaining)} · Rohstoffbetriebe halbe Leistung`,
        kind: 'storm',
        level: 'warn',
      };
    case 'boom': {
      const good = view.good === undefined ? '' : `${GOODS[view.good].name} `;
      return {
        text: `Boom: ${good}+${BOOM_PCT - 100} % Verkaufspreis · noch ${formatGameTime(view.remaining)}`,
        kind: 'boom',
        level: 'info',
      };
    }
  }
}
