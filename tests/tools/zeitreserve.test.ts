// E-032 / R270: Prüfschritt `make zeitreserve` erkennt Tests ohne CI-Reserve.
import { describe, expect, it } from 'vitest';
import {
  findViolations,
  formatViolation,
  MIN_DURATION_MS,
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
    expect(findViolations([t(1000, 8000)])).toEqual([]);
    expect(findViolations([t(1000, 7999)])).toHaveLength(1);
  });

  it('eigenes Timeout mit Reserve besteht', () => {
    expect(findViolations([t(2000, 30000)])).toEqual([]);
  });

  it('Tests unter der Mindestlaufzeit bleiben unbeachtet', () => {
    expect(findViolations([t(MIN_DURATION_MS - 1, 5000)])).toEqual([]);
  });

  it('Altlasten aus der Baseline werden nicht gemeldet, neue schon', () => {
    const old = t(2000, 5000, 'alt');
    const neu = t(2000, 5000, 'neu');
    expect(findViolations([old, neu], new Set([testKey(old)]))).toEqual([neu]);
  });

  it('sortiert den schlimmsten Fall zuerst', () => {
    const a = t(1500, 5000, 'a');
    const b = t(3000, 5000, 'b');
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
  });
});
