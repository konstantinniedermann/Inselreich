import { BOOM_PCT } from '../sim/defs/crises';
import { GOODS } from '../sim/defs/goods';
import { BOOM_DURATION, FIRE_OUTAGE, STORM_WARNING } from '../sim/defs/timing';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { CrisisView } from '../sim/queries';
import type { World } from '../sim/types';
import { repairFee, targetName } from './crisis';

/** Ereignis-Log (M6 13.4): Einträge aus dem Vergleich zweier `crisisView`-Stände; kein Teil des Spielstands. */

export interface LogEntry {
  /** Eintragstext ohne Zeitangabe (auch der Text der Meldung). */
  text: string;
  /** Meldung dazu: Warnung, Info oder keine. */
  toast: 'warn' | 'info' | null;
  /** Tick, zu dem der Eintrag entstand. */
  tick: number;
}

/** Höchstzahl der Einträge im Log. */
export const LOG_MAX = 10;

/** Anzeigezeile eines Eintrags. */
export function logLine(e: LogEntry): string {
  return `Tick ${e.tick} · ${e.text}`;
}

/**
 * Einträge für den Übergang `prev` → `cur` (Reihenfolge: Enden, dann Beginn). Gleicher Stand, auch der
 * geladene als Basis, ergibt nichts. `world` ist die aktuelle Welt (Gebäudenamen, Gebühr).
 */
export function crisisLogEntries(
  prev: CrisisView,
  cur: CrisisView,
  world: World,
  tick: number,
): LogEntry[] {
  const out: LogEntry[] = [];
  const add = (text: string, toast: LogEntry['toast']): void => {
    out.push({ text, toast, tick });
  };
  const samePeriod = prev.phase !== 'none' && cur.phase !== 'none' && prev.period === cur.period;

  if (prev.phase !== 'none' && !samePeriod) {
    if (prev.kind === 'fire') {
      // Nur ein Ausfall, dessen Gebäude noch steht, endet mit einem Eintrag
      if (prev.outcome === 'burning' && prev.target !== undefined) {
        const b = world.buildings[prev.target];
        if (b) add(`${BUILDING_DEFS[b.defId].name} wieder in Betrieb`, null);
      }
    } else if (prev.kind === 'storm') add('Sturm vorüber', null);
    else add('Boom vorbei', null);
  }

  if (cur.phase === 'none') return out;

  if (samePeriod) {
    if (prev.phase === 'warning' && cur.phase === 'active' && cur.kind === 'storm') {
      add('Sturm hat begonnen', null);
    }
    return out;
  }

  if (cur.kind === 'fire') {
    const name = targetName(cur, world);
    if (cur.outcome === 'burning') {
      const fee = repairFee(cur, world);
      const feeText = fee === null ? '' : ` — Instandsetzung ${fee}, ${FIRE_OUTAGE} Ticks Ausfall`;
      add(`Brand: ${name} brennt${feeText}`, 'warn');
    } else if (cur.outcome === 'extinguished') {
      add(`Brand gelöscht: ${name} (Feuerwache)`, 'info');
    } else add('Brand ohne Schaden', null);
  } else if (cur.kind === 'storm') {
    if (cur.phase === 'warning') add(`Sturmwarnung: Sturm in ${STORM_WARNING + 1} Ticks`, 'warn');
    else add('Sturm hat begonnen', null);
  } else {
    const good = cur.good === undefined ? '' : `${GOODS[cur.good].name} `;
    add(`Boom: ${good}+${BOOM_PCT - 100} % für ${BOOM_DURATION} Ticks`, 'info');
  }
  return out;
}

/** Fügt `entries` (älteste zuerst) vorn ein, neuester oben; hält höchstens `max`. Gibt einen neuen Puffer zurück. */
export function pushLog(
  buffer: readonly LogEntry[],
  entries: readonly LogEntry[],
  max = LOG_MAX,
): LogEntry[] {
  return [...[...entries].reverse(), ...buffer].slice(0, max);
}
