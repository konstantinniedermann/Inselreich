// tools/zeitreserve/rule.ts — CI-Reserve für Tests (E-032, R270), reine Logik ohne node:-Imports.

/** CI ist laut Erfahrung bis zu 4-mal langsamer als lokal (R270). */
export const CI_FACTOR = 4;

/** Beobachteter Faktor Runner-Zeit zu lokaler Zeit (E-043); nur für den Zusatzmodus. */
export const RUNNER_FACTOR = 3;

/** Erlaubter Anteil des Timeouts, den ein Test auf der CI belegen darf (R270: ≤ 50 %). */
export const MAX_TIMEOUT_SHARE = 0.5;

/** Auf GitHub Actions ist die gemessene Zeit schon CI-Zeit: kein Aufschlag mehr. */
export const CI_FACTOR_ON_CI = 1;

/** Ab dieser Laufzeit ist ein Verstoss ein Fehler; Lastrauschen lokal liegt darunter (E-032). */
export const FAIL_DURATION_MS = 2000;

/** Zwischen dieser und `FAIL_DURATION_MS` gibt es nur eine Warnung. */
export const WARN_DURATION_MS = 1000;

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
 * Regel: `durationMs × factor ≤ MAX_TIMEOUT_SHARE × timeoutMs`; lokal `factor = CI_FACTOR`
 * (Timeout ≥ 8 × Laufzeit), auf GitHub Actions `CI_FACTOR_ON_CI` (Timeout ≥ 2 × Laufzeit).
 * Fehler erst ab `FAIL_DURATION_MS`, darunter ab `WARN_DURATION_MS` nur Warnung (`findWarnings`).
 * Abhilfe: eigenes Timeout (3. Argument von `it`/`test` oder `{ timeout }`) oder Test aufteilen.
 * `baseline` nennt bekannte Altlasten (Schlüssel aus `testKey`); sie werden nicht gemeldet und nur
 * durch Beheben kleiner, nie durch Ergänzen grösser.
 */
function lacksReserve(t: TestTiming, factor: number): boolean {
  return t.durationMs * factor > MAX_TIMEOUT_SHARE * t.timeoutMs;
}

function worstFirst(a: TestTiming, b: TestTiming): number {
  return b.durationMs / b.timeoutMs - a.durationMs / a.timeoutMs;
}

export function findViolations(
  timings: readonly TestTiming[],
  baseline: ReadonlySet<string> = new Set(),
  factor: number = CI_FACTOR,
): TestTiming[] {
  return timings
    .filter((t) => t.durationMs >= FAIL_DURATION_MS && lacksReserve(t, factor))
    .filter((t) => !baseline.has(testKey(t)))
    .sort(worstFirst);
}

/** Grenzfälle zwischen `WARN_DURATION_MS` und `FAIL_DURATION_MS`: nur Hinweis, kein Fehler. */
export function findWarnings(
  timings: readonly TestTiming[],
  baseline: ReadonlySet<string> = new Set(),
  factor: number = CI_FACTOR,
): TestTiming[] {
  return timings
    .filter(
      (t) =>
        t.durationMs >= WARN_DURATION_MS &&
        t.durationMs < FAIL_DURATION_MS &&
        lacksReserve(t, factor),
    )
    .filter((t) => !baseline.has(testKey(t)))
    .sort(worstFirst);
}

/** Kleinstes Timeout (ms), das die Regel für die gegebene Laufzeit erfüllt, auf 5 s aufgerundet. */
export function suggestedTimeoutMs(durationMs: number, factor: number = CI_FACTOR): number {
  const need = (durationMs * factor) / MAX_TIMEOUT_SHARE;
  return Math.ceil(need / 5000) * 5000;
}

/** Meldungszeile für einen Verstoss (Datei, Test, Messung, Vorschlag). */
export function formatViolation(t: TestTiming, factor: number = CI_FACTOR): string {
  return (
    `${t.file}: "${t.name}" ${t.durationMs} ms × ${factor} > ${MAX_TIMEOUT_SHARE * 100} % ` +
    `von ${t.timeoutMs} ms Timeout (Vorschlag: Timeout ${suggestedTimeoutMs(t.durationMs, factor)} ms oder Test aufteilen; R270)`
  );
}

/** Hochrechnungsfaktor des Runner-Modus: auf GitHub Actions 1 (gemessene Zeit ist schon Runner-Zeit). */
export function runnerScale(onGithubActions: boolean): number {
  return onGithubActions ? CI_FACTOR_ON_CI : RUNNER_FACTOR;
}

/** Geschätzte Runner-Zeit: Laufzeiten × `factor`; Eingabe bleibt unverändert. Danach `CI_FACTOR_ON_CI` anwenden. */
export function scaleToRunner(timings: readonly TestTiming[], factor: number): TestTiming[] {
  return timings.map((t) => ({ ...t, durationMs: Math.round(t.durationMs * factor) }));
}

/** Meldungszeile des Runner-Modus; `t.durationMs` ist die geschätzte Runner-Zeit. */
export function formatRunnerViolation(t: TestTiming, factor: number): string {
  const local = Math.round(t.durationMs / factor);
  return (
    `${t.file}: "${t.name}" geschätzte Runner-Zeit ${t.durationMs} ms (${local} ms lokal × ${factor}) > ` +
    `${MAX_TIMEOUT_SHARE * 100} % von ${t.timeoutMs} ms Timeout ` +
    `(Vorschlag: Timeout ${suggestedTimeoutMs(t.durationMs, CI_FACTOR_ON_CI)} ms oder Test aufteilen; E-043)`
  );
}

/** Ab diesem 1-min-Load (lokal) sind Messungen nicht belastbar (einzige Definition; lastgate.mjs importiert sie). */
export const LOAD_MAX = 4;

/** `strict`: Verstösse lassen den Lauf scheitern; `unreliable`: nur Warnung, Lauf bei ruhiger Last wiederholen. */
export function loadVerdict(load: number, onGithubActions: boolean): 'strict' | 'unreliable' {
  return onGithubActions || load <= LOAD_MAX ? 'strict' : 'unreliable';
}
