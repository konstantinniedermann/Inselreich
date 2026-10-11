// tools/zeitreserve/check.ts — CLI: node tools/zeitreserve/check.ts [report.json]  (E-032, R270)
// Mit --push (make zeitreserve-push, Pflicht vor dem Push, R338): kein Ergebnis (Exit 2), wenn die Messung einen
// anderen Commit als HEAD hat, die Last vor dem Lauf (loadStart) > 4 war oder das alte Format hat (R353, R394);
// die aktuelle Last zählt nicht (R438 V3).
// Liest den Bericht des Reporters (nach `npm test`) und schlägt bei fehlender CI-Reserve fehl.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { loadavg } from 'node:os';
import {
  CI_FACTOR,
  CI_FACTOR_ON_CI,
  FAIL_DURATION_MS,
  findViolations,
  findWarnings,
  formatRunnerViolation,
  formatViolation,
  LOAD_MAX,
  loadVerdict,
  markedFiles,
  mergeRetry,
  measurementProblem,
  type Measurement,
  parseMeasurement,
  runnerScale,
  scaleToRunner,
  type TestTiming,
  testKey,
} from './rule.ts';

const ON_CI = process.env.GITHUB_ACTIONS === 'true';
const FAKE_LOAD = process.env.ZEITRESERVE_FAKE_LOAD; // nur für Tests
const LOAD = FAKE_LOAD !== undefined ? Number(FAKE_LOAD) : (loadavg()[0] ?? 0);
const PUSH = process.argv.includes('--push');
const VERDICT = PUSH ? 'strict' : loadVerdict(LOAD, ON_CI);

/** Verstoss ausgeben: bei ruhiger Last (oder auf Actions) als Fehler, sonst als Warnung. */
function report(line: string): void {
  if (VERDICT === 'strict') console.error(line);
  else
    console.warn(
      `Warnung: bei Last ${LOAD.toFixed(1)} > ${LOAD_MAX} nicht belastbar, Lauf bei ruhiger Last wiederholen: ${line}`,
    );
}

function currentHead(): string {
  const fake = process.env.ZEITRESERVE_FAKE_HEAD; // nur für Tests
  if (fake !== undefined) return fake;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unbekannt';
  }
}

const BASELINE_PATH = new URL('./baseline.json', import.meta.url);

/** Wert hinter einem Flag (`--marked <datei>`), sonst undefined. */
function flagValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const VALUE_FLAGS = ['--marked', '--retry'];
const MARKED = flagValue('--marked');
const RETRY = flagValue('--retry');
const BAD_FLAG = VALUE_FLAGS.find(
  (f) => process.argv.includes(f) && (flagValue(f) ?? '--').startsWith('--'),
);

function readMeasurement(path: string): Measurement | null {
  try {
    return parseMeasurement(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return null;
  }
}

/** AK-TB6-02: Markierungsliste nur für `push-check`; bei unbrauchbarer Messung alte Datei löschen. */
function writeMarked(m: Measurement | null, baseline: Set<string>): void {
  if (MARKED === undefined || RETRY !== undefined) return;
  const usable =
    m !== null && m.commit === currentHead() && m.loadStart !== undefined && m.timings.length > 0;
  if (!usable) {
    rmSync(MARKED, { force: true });
    return;
  }
  const scale = runnerScale(ON_CI);
  const factor = ON_CI ? CI_FACTOR_ON_CI : CI_FACTOR;
  writeFileSync(MARKED, JSON.stringify(markedFiles(m.timings, baseline, scale, factor)));
}

function main(): number {
  const path =
    process.argv
      .slice(2)
      .find((a, i, all) => !a.startsWith('--') && !VALUE_FLAGS.includes(all[i - 1] ?? '')) ??
    '.studio/zeitreserve.json';
  const baseline = new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as string[]);
  if (BAD_FLAG !== undefined) {
    console.error(`zeitreserve: ${BAD_FLAG} braucht einen Dateipfad als Wert.`);
    return 2;
  }
  if (RETRY !== undefined && !PUSH) {
    console.error('zeitreserve: --retry nur zusammen mit --push.');
    return 2;
  }
  if (!existsSync(path)) {
    console.error(`zeitreserve: ${path} fehlt; zuerst die Tests laufen lassen (make test).`);
    writeMarked(null, baseline);
    return PUSH ? 2 : 1;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    // Leer oder halb geschrieben (laufendes make check, keine Sperre mehr): nie Exit 0.
    console.error(
      `zeitreserve: ${path} nicht lesbar (leer oder halb geschrieben); make check abwarten.`,
    );
    writeMarked(null, baseline);
    return PUSH ? 2 : 1;
  }
  let measurement = parseMeasurement(raw);
  writeMarked(measurement, baseline);
  if (RETRY !== undefined) {
    const retry = existsSync(RETRY) ? readMeasurement(RETRY) : null;
    if (retry === null) {
      console.error(
        `zeitreserve-push: Nachmessung ${RETRY} fehlt oder ist nicht lesbar (kein Ergebnis).`,
      );
      return 2;
    }
    const merged = mergeRetry(
      measurement,
      retry,
      baseline,
      runnerScale(ON_CI),
      currentHead(),
      ON_CI ? CI_FACTOR_ON_CI : CI_FACTOR,
    );
    if ('problem' in merged) {
      console.error(`zeitreserve-push: nicht belastbar, ${merged.problem} (kein Ergebnis).`);
      return 2;
    }
    console.log(
      `zeitreserve-push: Nachmessung ${new Set(retry.timings.map((t) => t.file)).size} Dateien, loadStart ${retry.loadStart?.toFixed(1)}, Hauptmessung loadStart ${measurement.loadStart?.toFixed(1)}`,
    );
    measurement = merged.measurement;
  }
  const timings = measurement.timings;
  const problem = measurementProblem(measurement, currentHead());
  if (PUSH && problem !== null) {
    console.error(`zeitreserve-push: nicht belastbar, ${problem} (kein Ergebnis).`);
    return 2;
  }
  if (problem !== null)
    console.warn(`zeitreserve: Hinweis, für --push nicht belastbar: ${problem}`);
  if (timings.length === 0) {
    console.error(`zeitreserve: ${path} enthält keine Tests; Berichtslauf fehlerhaft.`);
    return 1;
  }
  const known = new Set(timings.map(testKey));
  for (const k of baseline)
    if (!known.has(k))
      console.warn(`zeitreserve: Altlast ohne Test, aus baseline.json streichen: ${k}`);
  const ls = measurement.loadStart;
  console.log(
    ls === undefined
      ? 'zeitreserve: loadStart unbekannt'
      : `zeitreserve: loadStart ${ls.toFixed(1)}${ls > 4 ? ' — für Push nicht belastbar, make check ruhig wiederholen' : ''}`,
  );
  if (!PUSH) console.log(`zeitreserve: Last (1 min): ${LOAD.toFixed(1)}`);
  const factor = process.env.GITHUB_ACTIONS === 'true' ? CI_FACTOR_ON_CI : CI_FACTOR;
  const bad = findViolations(timings, baseline, factor);
  console.log(
    `zeitreserve: ${timings.length} Tests geprüft (Faktor ${factor}), ${bad.length} ohne CI-Reserve (ab ${FAIL_DURATION_MS} ms, ohne Altlasten)`,
  );
  for (const t of findWarnings(timings, baseline, factor))
    console.warn(`Warnung: ${formatViolation(t, factor)}`);
  for (const t of bad) report(formatViolation(t, factor));
  const runnerBad = checkRunnerEstimate(timings, baseline);
  const localBad = VERDICT === 'strict' ? bad.length : 0;
  return localBad === 0 && runnerBad === 0 ? 0 : 1;
}

/** Zusatzmodus E-043: lokale Zeit × Runner-Faktor, dann Runner-Regel; auf Actions keine Hochrechnung. */
function checkRunnerEstimate(timings: TestTiming[], baseline: Set<string>): number {
  const scale = runnerScale(process.env.GITHUB_ACTIONS === 'true');
  const estimated = scaleToRunner(timings, scale);
  const bad = findViolations(estimated, baseline, CI_FACTOR_ON_CI);
  console.log(
    `zeitreserve (geschätzte Runner-Zeit, lokal × ${scale}): ${bad.length} ohne Reserve (ab ${FAIL_DURATION_MS} ms, ohne Altlasten)`,
  );
  for (const t of findWarnings(estimated, baseline, CI_FACTOR_ON_CI))
    console.warn(`Warnung: ${formatRunnerViolation(t, scale)}`);
  for (const t of bad) report(formatRunnerViolation(t, scale));
  return VERDICT === 'strict' ? bad.length : 0;
}

process.exit(main());
