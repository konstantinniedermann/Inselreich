// tools/zeitreserve/check.ts — CLI: node tools/zeitreserve/check.ts [report.json]  (E-032, R270)
// Liest den Bericht des Reporters (nach `npm test`) und schlägt bei fehlender CI-Reserve fehl.
import { existsSync, readFileSync } from 'node:fs';
import { MIN_DURATION_MS, findViolations, formatViolation } from './rule.ts';
import type { TestTiming } from './rule.ts';

const BASELINE_PATH = new URL('./baseline.json', import.meta.url);

function main(): number {
  const path = process.argv[2] ?? '.studio/zeitreserve.json';
  if (!existsSync(path)) {
    console.error(`zeitreserve: ${path} fehlt; zuerst die Tests laufen lassen (make test).`);
    return 1;
  }
  const timings = JSON.parse(readFileSync(path, 'utf8')) as TestTiming[];
  const baseline = new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as string[]);
  const bad = findViolations(timings, baseline);
  console.log(
    `zeitreserve: ${timings.length} Tests geprüft, ${bad.length} ohne CI-Reserve (ab ${MIN_DURATION_MS} ms, ohne Altlasten)`,
  );
  for (const t of bad) console.error(formatViolation(t));
  return bad.length === 0 ? 0 : 1;
}

process.exit(main());
