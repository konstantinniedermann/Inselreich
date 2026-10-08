// E-032 / R270: Prüfschritt `make zeitreserve` erkennt Tests ohne CI-Reserve.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  findViolations,
  formatViolation,
  CI_FACTOR_ON_CI,
  FAIL_DURATION_MS,
  findWarnings,
  WARN_DURATION_MS,
  suggestedTimeoutMs,
  RUNNER_FACTOR,
  scaleToRunner,
  runnerScale,
  formatRunnerViolation,
  loadVerdict,
  LOAD_MAX,
  testKey,
} from '../../tools/zeitreserve/rule';
import type { TestTiming } from '../../tools/zeitreserve/rule';

const t = (durationMs: number, timeoutMs: number, name = 'x'): TestTiming => ({
  file: 'tests/a.test.ts',
  name,
  durationMs,
  timeoutMs,
});

describe('zeitreserve Regel', () => {
  it('meldet Gegenbeispiel: 2 s lokal bei Standard-Timeout 5 s', () => {
    expect(findViolations([t(2000, 5000)])).toHaveLength(1);
  });

  it('Grenze: timeout = 8 × Laufzeit ist erlaubt, knapp darunter nicht', () => {
    expect(findViolations([t(2000, 16000)])).toEqual([]);
    expect(findViolations([t(2000, 15999)])).toHaveLength(1);
  });

  it('eigenes Timeout mit Reserve besteht', () => {
    expect(findViolations([t(2000, 30000)])).toEqual([]);
  });

  it('kein Flackern: Laufzeiten unter der Fehlerschwelle sind nie ein Fehler, nur Warnung', () => {
    const noise = t(FAIL_DURATION_MS - 1, 5000);
    expect(findViolations([noise])).toEqual([]);
    expect(findWarnings([noise])).toEqual([noise]);
    expect(findWarnings([t(WARN_DURATION_MS - 1, 5000)])).toEqual([]);
    expect(findWarnings([t(FAIL_DURATION_MS, 5000)])).toEqual([]);
  });

  it('GitHub Actions: Faktor 1, Timeout ≥ 2 × Laufzeit genügt', () => {
    expect(findViolations([t(2400, 5000)], new Set(), CI_FACTOR_ON_CI)).toEqual([]);
    expect(findViolations([t(2600, 5000)], new Set(), CI_FACTOR_ON_CI)).toHaveLength(1);
    expect(findViolations([t(2400, 5000)])).toHaveLength(1); // lokal Faktor 4
    expect(findWarnings([t(1200, 2000)], new Set(), CI_FACTOR_ON_CI)).toHaveLength(1);
  });

  it('Altlasten aus der Baseline werden nicht gemeldet, neue schon', () => {
    const old = t(2000, 5000, 'alt');
    const neu = t(2000, 5000, 'neu');
    expect(findViolations([old, neu], new Set([testKey(old)]))).toEqual([neu]);
  });

  it('sortiert den schlimmsten Fall zuerst', () => {
    const a = t(2500, 5000, 'a');
    const b = t(4000, 5000, 'b');
    expect(findViolations([a, b]).map((v) => v.name)).toEqual(['b', 'a']);
  });

  it('schlägt Timeout vor, das die Regel erfüllt', () => {
    for (const d of [1000, 2398, 5102]) {
      expect(findViolations([t(d, suggestedTimeoutMs(d))])).toEqual([]);
    }
  });
});

describe('zeitreserve Meldung', () => {
  it('nennt Datei, Test, Messung und Vorschlag beim künstlichen Gegenbeispiel', () => {
    const bad = findViolations([t(2000, 5000, 'langsamer Test')]);
    expect(bad).toHaveLength(1);
    const msg = formatViolation(bad[0]!);
    expect(msg).toContain('tests/a.test.ts');
    expect(msg).toContain('langsamer Test');
    expect(msg).toContain('2000 ms');
    expect(msg).toContain('Timeout 20000 ms');
    expect(formatViolation(bad[0]!, CI_FACTOR_ON_CI)).toContain('Timeout 5000 ms');
  });
});

describe('zeitreserve geschätzte Runner-Zeit (E-043)', () => {
  const runnerCheck = (timings: TestTiming[], baseline = new Set<string>()) =>
    findViolations(scaleToRunner(timings, RUNNER_FACTOR), baseline, CI_FACTOR_ON_CI);

  it('skaliert die Laufzeit mit dem Runner-Faktor 3, ohne die Eingabe zu ändern', () => {
    const input = [t(600, 5000)];
    expect(RUNNER_FACTOR).toBe(3);
    expect(scaleToRunner(input, RUNNER_FACTOR)[0]!.durationMs).toBe(1800);
    expect(input[0]!.durationMs).toBe(600);
  });

  it('Grenzfall: 900 ms lokal (2700 ms Runner) bei 5000 ms Timeout ist Verstoss, 600 ms nicht', () => {
    expect(runnerCheck([t(900, 5000)])).toHaveLength(1);
    expect(runnerCheck([t(800, 5000)])).toEqual([]);
    expect(runnerCheck([t(600, 5000)])).toEqual([]);
  });

  it('Fehlerschwelle gilt für die geschätzte Zeit: 667 ms × 3 erreicht 2000 ms', () => {
    expect(runnerCheck([t(667, 3000)])).toHaveLength(1);
    expect(runnerCheck([t(600, 3000)])).toEqual([]);
  });

  it('respektiert die Baseline', () => {
    const old = t(900, 5000, 'alt');
    const neu = t(900, 5000, 'neu');
    expect(runnerCheck([old, neu], new Set([testKey(old)]))).toHaveLength(1);
  });

  it('auf GitHub Actions keine Hochrechnung (Faktor 1)', () => {
    expect(runnerScale(true)).toBe(1);
    expect(runnerScale(false)).toBe(RUNNER_FACTOR);
  });

  it('Meldung nennt geschätzte Runner-Zeit und gemessene lokale Zeit', () => {
    const [v] = runnerCheck([t(900, 5000, 'lahm')]);
    const msg = formatRunnerViolation(v!, RUNNER_FACTOR);
    expect(msg).toContain('geschätzte Runner-Zeit 2700 ms');
    expect(msg).toContain('900 ms lokal');
    expect(msg).toContain('lahm');
    expect(msg).toContain('Timeout 10000 ms');
  });
});

describe('zeitreserve Lastabhängigkeit', () => {
  it('bis LOAD_MAX gilt die Messung, darüber nur Warnung', () => {
    expect(LOAD_MAX).toBe(4);
    expect(loadVerdict(LOAD_MAX, false)).toBe('strict');
    expect(loadVerdict(LOAD_MAX + 0.1, false)).toBe('unreliable');
  });

  it('auf GitHub Actions gilt unabhängig von der Last hart', () => {
    expect(loadVerdict(20, true)).toBe('strict');
  });
});

const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;

describe('zeitreserve CLI bei Last (Push-Gate, R338)', () => {
  const check = new URL('../../tools/zeitreserve/check.ts', import.meta.url).pathname;
  const fixture = new URL('./zeitreserve-fixture.json', import.meta.url).pathname;
  const run = (load: string, ...flags: string[]) =>
    spawnSync('node', [check, fixture, ...flags], {
      encoding: 'utf8',
      env: { ...nodeEnv, GITHUB_ACTIONS: undefined, ZEITRESERVE_FAKE_LOAD: load },
    });

  it('lokal bei Last > 4 ohne --push: Verstoss nur Warnung, Exit 0', () => {
    const p = run('9');
    expect(p.status).toBe(0);
    expect(p.stderr).toContain('nicht belastbar');
  });

  it('--push bei Last > 4: kein Ergebnis, Exit 2 mit Meldung', () => {
    const p = run('9', '--push');
    expect(p.status).toBe(2);
    expect(p.stderr).toContain('nicht belastbar, Last 9.0 > 4, warten');
  });

  it('--push bei Last <= 4: harte Prüfung, Verstoss gibt Exit 1', () => {
    expect(run('2', '--push').status).toBe(1);
    expect(run('2').status).toBe(1);
  });
});
