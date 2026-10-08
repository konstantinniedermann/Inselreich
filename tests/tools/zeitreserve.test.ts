// E-032 / R270: Prüfschritt `make zeitreserve` erkennt Tests ohne CI-Reserve.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  parseMeasurement,
  measurementProblem,
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
      env: {
        ...nodeEnv,
        GITHUB_ACTIONS: undefined,
        ZEITRESERVE_FAKE_LOAD: load,
        ZEITRESERVE_FAKE_HEAD: 'abc',
      },
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

describe('zeitreserve Messung mit Metadaten (R353 P1)', () => {
  const timings = [t(3000, 5000)];
  const meta = { commit: 'abc', loadStart: 1, loadEnd: 2, loadMax: 2, timings };

  it('liest das neue Format samt Metadaten', () => {
    expect(parseMeasurement(meta)).toEqual(meta);
  });

  it('altes Array-Format: Zeiten da, Metadaten fehlen', () => {
    expect(parseMeasurement(timings)).toEqual({ timings });
  });

  it('belastbar bei gleichem Commit und Last <= LOAD_MAX', () => {
    expect(measurementProblem(meta, 'abc')).toBeNull();
    expect(measurementProblem({ ...meta, loadMax: LOAD_MAX }, 'abc')).toBeNull();
  });

  it('alter Commit ist nicht belastbar und nennt beide Commits', () => {
    expect(measurementProblem(meta, 'def')).toMatch(/Commit abc.*HEAD ist def/);
  });

  it('zu hohe Last während der Messung ist nicht belastbar', () => {
    expect(measurementProblem({ ...meta, loadMax: 6.5 }, 'abc')).toMatch(/Last 6\.5 > 4/);
  });

  it('altes Format ist nicht belastbar, ohne Absturz', () => {
    expect(measurementProblem({ timings }, 'abc')).toMatch(/alten Format/);
  });
});

describe('zeitreserve CLI --push mit Metadaten (R353 P1)', () => {
  const check = new URL('../../tools/zeitreserve/check.ts', import.meta.url).pathname;
  const dir = mkdtempSync(join(tmpdir(), 'zr-'));
  const ok = [{ file: 'a', name: 'x', durationMs: 10, timeoutMs: 5000 }];
  const file = (name: string, content: unknown) => {
    const p = join(dir, name);
    writeFileSync(p, JSON.stringify(content));
    return p;
  };
  const run = (path: string, ...flags: string[]) =>
    spawnSync('node', [check, path, ...flags], {
      encoding: 'utf8',
      env: {
        ...nodeEnv,
        GITHUB_ACTIONS: undefined,
        ZEITRESERVE_FAKE_LOAD: '1',
        ZEITRESERVE_FAKE_HEAD: 'abc',
      },
    });
  const meta = { commit: 'abc', loadStart: 1, loadEnd: 1, loadMax: 1, timings: ok };

  it('passende Messung: Exit 0', () => {
    expect(run(file('ok.json', meta), '--push').status).toBe(0);
  });

  it('alter Commit: Exit 2 nicht belastbar', () => {
    const p = run(file('old.json', { ...meta, commit: 'zzz' }), '--push');
    expect(p.status).toBe(2);
    expect(p.stderr).toContain('nicht belastbar');
  });

  it('hohe Last während der Messung: Exit 2', () => {
    const p = run(file('load.json', { ...meta, loadMax: 9 }), '--push');
    expect(p.status).toBe(2);
    expect(p.stderr).toContain('Last 9');
  });

  it('Array-Format: Exit 2 statt Absturz', () => {
    const p = run(file('arr.json', ok), '--push');
    expect(p.status).toBe(2);
    expect(p.stderr).toContain('alten Format');
  });

  it('lockerer Modus liest beide Formate wie bisher', () => {
    expect(run(file('ok2.json', meta)).status).toBe(0);
    expect(run(file('arr2.json', ok)).status).toBe(0);
  });
});
