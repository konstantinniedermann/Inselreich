// E-032 / R270: Prüfschritt `make zeitreserve` erkennt Tests ohne CI-Reserve.
import { describe, expect, it } from 'vitest';
import {
  findViolations,
  formatViolation,
  CI_FACTOR_ON_CI,
  FAIL_DURATION_MS,
  findWarnings,
  WARN_DURATION_MS,
  suggestedTimeoutMs,
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
