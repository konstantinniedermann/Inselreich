// Ehrenbuch-Anzeige (I-186, Spec §2.3, §2.4, §3, §4): reine Texte und Zeilen, kein DOM, keine Regeln.
import { CRISIS_LEVELS } from '../sim/defs/crises';
import { HONORS, HONOR_IDS, type HonorId } from '../sim/defs/honors';
import type { BookData, BookStatus, RunMark } from './honorBook';
import { formatClock } from './time';

export interface HonorCount {
  have: number;
  total: number;
}
export interface HonorRow {
  id: HonorId;
  name: string;
  condition: string;
  done: null | { date: string; map: string; crisis: string; time: string };
  /** In dieser Sitzung erreicht, aber nicht ins Gerät geschrieben. */
  sessionOnly: boolean;
}
/** Menü-Zusammenfassung: Zeile und Status-Hinweis (ohne Tempo-Hinweis). */
export type HonorSummary = { line: string; note: string | null };

export function honorCount(data: BookData, session: ReadonlySet<string>): HonorCount {
  const have = HONOR_IDS.filter((id) => data.earned.has(id) || session.has(id)).length;
  return { have, total: HONOR_IDS.length };
}

export function menuLine(c: HonorCount): string {
  return `Ehrenbuch: ${c.have} von ${c.total} Meisterstücken`;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Lokales Datum `TT.MM.JJJJ`. */
function localDate(at: string): string {
  const d = new Date(at);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function honorRows(data: BookData, session: ReadonlySet<string>): HonorRow[] {
  return HONOR_IDS.map((id) => {
    const e = data.earned.get(id);
    return {
      id,
      name: HONORS[id].name,
      condition: HONORS[id].condition,
      done: e
        ? {
            date: localDate(e.at),
            map: `Karte ${e.seed}`,
            crisis: CRISIS_LEVELS[e.crisis].name,
            time: formatClock(e.tick),
          }
        : null,
      sessionOnly: session.has(id),
    };
  });
}

export function honorHints(status: BookStatus, run: RunMark | null, worldSeed: number): string[] {
  const out: string[] = [];
  if (status === 'damaged') out.push('Ehrenbuch war unlesbar und beginnt neu');
  else if (status === 'newer') out.push('Ehrenbuch aus neuerer Fassung, wird nicht verändert');
  else if (status === 'unavailable') out.push('Ehrenbuch wird nicht gespeichert');
  if (run === null || run.seed !== worldSeed)
    out.push('Tempo-Stücke zählen in dieser Partie nicht (Freischaltung unbekannt)');
  return out;
}

export function honorMessage(ids: string[], saved: boolean): string {
  const names = ids.map((id) => HONORS[id as HonorId]?.name ?? id).join(', ');
  const head = ids.length === 1 ? 'Meisterstück' : 'Meisterstücke';
  return `${head}: ${names} — ins Ehrenbuch eingetragen${saved ? '' : ' (nicht gespeichert)'}`;
}
