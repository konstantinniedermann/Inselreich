/**
 * Gate-Ensemble: Statistik und Tabelle für die Messung des Balancing-Controllers über mehrere
 * Phasen. Rein, ohne `expect` und ohne `vitest`-Import, damit auch ein Skript sie nutzen kann.
 */

/** Versätze der Entscheidungs-Ticks im Kontrollintervall (alle kleiner als `CONTROL_INTERVAL`). */
export const PHASES = [0, 20, 40, 60, 80] as const;

export interface Summary {
  median: number;
  min: number;
  max: number;
  spread: number;
  n: number;
}

/** Grenze, beidseitig oder einseitig. */
export interface Limit {
  name: string;
  lo?: number;
  hi?: number;
}

export interface Row {
  limit: Limit;
  s: Summary;
  held: number;
  verdict: 'OK' | 'AUSREISSER' | 'GERISSEN' | 'OHNE GRENZE';
}

/** Median (gerade n: Mittel der zwei mittleren Werte), Min, Max, Spannweite; wirft bei leerer Eingabe. */
export function summarize(values: readonly number[]): Summary {
  if (values.length === 0) throw new Error('summarize: keine Werte (leere Eingabe)');
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = n >> 1;
  const at = (i: number): number => sorted[i] ?? NaN;
  const median = n % 2 === 1 ? at(mid) : (at(mid - 1) + at(mid)) / 2;
  const min = at(0);
  const max = at(n - 1);
  return { median, min, max, spread: max - min, n };
}

function within(limit: Limit, v: number): boolean {
  return (limit.lo === undefined || v >= limit.lo) && (limit.hi === undefined || v <= limit.hi);
}

/** OHNE GRENZE: weder lo noch hi (nur gemessen); OK: alle innerhalb; AUSREISSER: Median innerhalb, mindestens einer ausserhalb; GERISSEN: Median ausserhalb. */
export function judge(limit: Limit, values: readonly number[]): Row {
  const s = summarize(values);
  const held = values.filter((v) => within(limit, v)).length;
  if (limit.lo === undefined && limit.hi === undefined)
    return { limit, s, held, verdict: 'OHNE GRENZE' };
  const verdict = held === s.n ? 'OK' : within(limit, s.median) ? 'AUSREISSER' : 'GERISSEN';
  return { limit, s, held, verdict };
}

const HEADER =
  'Robustheit gegen Entscheidungszeitpunkte (Controller-Phase), nicht gegen Layout oder Seed';

function num(v: number): string {
  return String(Math.round(v * 10) / 10);
}

/** Tabelle als Text; Rundung nur hier (1 Nachkommastelle). */
export function formatTable(rows: readonly Row[]): string {
  const head = ['Grenze', 'Median', 'Min', 'Max', 'Spannweite', 'gehalten', 'Urteil'];
  const body = rows.map((r) => [
    r.limit.name,
    num(r.s.median),
    num(r.s.min),
    num(r.s.max),
    num(r.s.spread),
    r.verdict === 'OHNE GRENZE' ? '-' : `${r.held}/${r.s.n}`,
    r.verdict,
  ]);
  const cells = [head, ...body];
  const widths = head.map((_, i) => Math.max(...cells.map((c) => (c[i] ?? '').length)));
  const line = (c: string[]): string => c.map((x, i) => x.padEnd(widths[i] ?? 0)).join(' | ');
  return [HEADER, line(head), ...body.map(line)].join('\n');
}

/** Misst seriell je Phase; Reihenfolge der Ergebnisse = Reihenfolge der Phasen. */
export function runEnsemble<T>(
  measure: (phase: number) => T,
  phases: readonly number[] = PHASES,
): T[] {
  return phases.map((p) => measure(p));
}
