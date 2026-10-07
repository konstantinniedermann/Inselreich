// tools/zeitreserve/check.ts — CLI: node tools/zeitreserve/check.ts [report.json]  (E-032, R270)
// Liest den Bericht des Reporters (nach `npm test`) und schlägt bei fehlender CI-Reserve fehl.
import { existsSync, readFileSync } from 'node:fs';
import {
  CI_FACTOR,
  CI_FACTOR_ON_CI,
  FAIL_DURATION_MS,
  findViolations,
  findWarnings,
  formatViolation,
  testKey,
} from './rule.ts';
import type { TestTiming } from './rule.ts';

const BASELINE_PATH = new URL('./baseline.json', import.meta.url);

function main(): number {
  const path = process.argv[2] ?? '.studio/zeitreserve.json';
  if (!existsSync(path)) {
    console.error(`zeitreserve: ${path} fehlt; zuerst die Tests laufen lassen (make test).`);
    return 1;
  }
  const timings = JSON.parse(readFileSync(path, 'utf8')) as TestTiming[];
  if (timings.length === 0) {
    console.error(`zeitreserve: ${path} enthält keine Tests; Berichtslauf fehlerhaft.`);
    return 1;
  }
  const baseline = new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as string[]);
  const known = new Set(timings.map(testKey));
  for (const k of baseline)
    if (!known.has(k))
      console.warn(`zeitreserve: Altlast ohne Test, aus baseline.json streichen: ${k}`);
  const factor = process.env.GITHUB_ACTIONS === 'true' ? CI_FACTOR_ON_CI : CI_FACTOR;
  const bad = findViolations(timings, baseline, factor);
  console.log(
    `zeitreserve: ${timings.length} Tests geprüft (Faktor ${factor}), ${bad.length} ohne CI-Reserve (ab ${FAIL_DURATION_MS} ms, ohne Altlasten)`,
  );
  for (const t of findWarnings(timings, baseline, factor))
    console.warn(`Warnung: ${formatViolation(t, factor)}`);
  for (const t of bad) console.error(formatViolation(t, factor));
  return bad.length === 0 ? 0 : 1;
}

process.exit(main());
