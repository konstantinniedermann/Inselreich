// tools/zeitreserve/check.ts — CLI: node tools/zeitreserve/check.ts [report.json]  (E-032, R270)
// Mit --push (make zeitreserve-push, Pflicht vor dem Push, R338): kein Ergebnis (Exit 2), wenn die Messung einen
// anderen Commit als HEAD hat, die Last vor dem Lauf (loadStart) > 4 war oder das alte Format hat (R353, R394);
// die aktuelle Last zählt nicht (R438 V3).
// Liest den Bericht des Reporters (nach `npm test`) und schlägt bei fehlender CI-Reserve fehl.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  measurementProblem,
  parseMeasurement,
  runnerScale,
  scaleToRunner,
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

function main(): number {
  const path = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '.studio/zeitreserve.json';
  if (!existsSync(path)) {
    console.error(`zeitreserve: ${path} fehlt; zuerst die Tests laufen lassen (make test).`);
    return 1;
  }
  const measurement = parseMeasurement(JSON.parse(readFileSync(path, 'utf8')));
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
  const baseline = new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as string[]);
  const known = new Set(timings.map(testKey));
  for (const k of baseline)
    if (!known.has(k))
      console.warn(`zeitreserve: Altlast ohne Test, aus baseline.json streichen: ${k}`);
  if (PUSH)
    console.log(`zeitreserve: Last vor dem Lauf (Messung): ${measurement.loadStart?.toFixed(1)}`);
  else console.log(`zeitreserve: Last (1 min): ${LOAD.toFixed(1)}`);
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
