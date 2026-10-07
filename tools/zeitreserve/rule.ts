// tools/zeitreserve/rule.ts — CI-Reserve für Tests (E-032, R270), reine Logik ohne node:-Imports.

/** CI ist laut Erfahrung bis zu 4-mal langsamer als lokal (R270). */
export const CI_FACTOR = 4;

/** Erlaubter Anteil des Timeouts, den ein Test auf der CI belegen darf (R270: ≤ 50 %). */
export const MAX_TIMEOUT_SHARE = 0.5;

/** Kürzere Tests bleiben unbeachtet: Lastschwankungen sind dort grösser als die Aussage (E-032). */
export const MIN_DURATION_MS = 1000;

export interface TestTiming {
  /** Testdatei, relativ zum Repo. */
  file: string;
  /** Voller Testname. */
  name: string;
  /** Lokale Laufzeit in ms. */
  durationMs: number;
  /** Wirksames Timeout in ms (Vitest-Standard 5000, falls nicht gesetzt). */
  timeoutMs: number;
}

/** Schlüssel eines Tests für die Altlastenliste (`baseline.json`). */
export function testKey(t: Pick<TestTiming, 'file' | 'name'>): string {
  return `${t.file} :: ${t.name}`;
}

/**
 * Regel: Ein Test mit lokaler Laufzeit ≥ `MIN_DURATION_MS` braucht
 * `durationMs × CI_FACTOR ≤ MAX_TIMEOUT_SHARE × timeoutMs`, gleichbedeutend mit
 * `timeoutMs ≥ 8 × durationMs`. Sonst: eigenes Timeout (3. Argument von `it`/`test` oder
 * `{ timeout }`) oder Test aufteilen. `baseline` nennt bekannte Altlasten (Schlüssel aus
 * `testKey`); sie werden nicht gemeldet und nur durch Beheben kleiner, nie durch Ergänzen grösser.
 */
export function findViolations(
  timings: readonly TestTiming[],
  baseline: ReadonlySet<string> = new Set(),
): TestTiming[] {
  return timings
    .filter((t) => t.durationMs >= MIN_DURATION_MS)
    .filter((t) => t.durationMs * CI_FACTOR > MAX_TIMEOUT_SHARE * t.timeoutMs)
    .filter((t) => !baseline.has(testKey(t)))
    .sort((a, b) => b.durationMs / b.timeoutMs - a.durationMs / a.timeoutMs);
}

/** Kleinstes Timeout (ms), das die Regel für die gegebene Laufzeit erfüllt, auf 5 s aufgerundet. */
export function suggestedTimeoutMs(durationMs: number): number {
  const need = (durationMs * CI_FACTOR) / MAX_TIMEOUT_SHARE;
  return Math.ceil(need / 5000) * 5000;
}

/** Meldungszeile für einen Verstoss (Datei, Test, Messung, Vorschlag). */
export function formatViolation(t: TestTiming): string {
  return (
    `${t.file}: "${t.name}" lokal ${t.durationMs} ms × ${CI_FACTOR} > ${MAX_TIMEOUT_SHARE * 100} % ` +
    `von ${t.timeoutMs} ms Timeout (Vorschlag: Timeout ${suggestedTimeoutMs(t.durationMs)} ms oder Test aufteilen; R270)`
  );
}
