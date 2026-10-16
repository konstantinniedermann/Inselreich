// UI-HAEPPCHEN-D T06: Reichweite von Gütern (AK-UR-01 bis 03).
import { describe, expect, it } from 'vitest';
import { reachView, secToTicks, TREND_EPS } from '../../src/ui/reach';
import { formatGameTime } from '../../src/ui/time';

// net = -100 bzw. +100 je 100 Ticks: ticks == Bestand bzw. Restplatz, exakt ganzzahlig.
const WARN_EMPTY = secToTicks(180);
const ALARM_EMPTY = secToTicks(60);
const WARN_FULL = secToTicks(60);

describe('AK-UR-01 leer', () => {
  it('Bestand 20, net -0,5: leer in 4000 Ticks', () => {
    const r = reachView(20, -0.5, 100);
    expect(r.kind).toBe('empty');
    expect(r.ticks).toBe(4000);
    expect(formatGameTime(r.ticks)).toBe(formatGameTime(4000));
    expect(r.level).toBe('ok');
  });
  it('Bestand 0, net < 0: leer, alarm', () => {
    expect(reachView(0, -1, 100)).toEqual({ kind: 'empty', ticks: 0, level: 'alarm' });
  });
});

describe('AK-UR-02 Schwellen', () => {
  it('leer: 60 s alarm, 60 s + 1 Tick warn', () => {
    expect(reachView(ALARM_EMPTY, -100, 5000).level).toBe('alarm');
    expect(reachView(ALARM_EMPTY + 1, -100, 5000).level).toBe('warn');
  });
  it('leer: 180 s warn, 180 s + 1 Tick ok', () => {
    expect(reachView(WARN_EMPTY, -100, 5000)).toEqual({
      kind: 'empty',
      ticks: WARN_EMPTY,
      level: 'warn',
    });
    expect(reachView(WARN_EMPTY + 1, -100, 5000).level).toBe('ok');
  });
  it('voll: 60 s warn, +1 Tick ok, nie alarm', () => {
    expect(reachView(5000 - WARN_FULL, 100, 5000)).toEqual({
      kind: 'full',
      ticks: WARN_FULL,
      level: 'warn',
    });
    expect(reachView(5000 - WARN_FULL - 1, 100, 5000).level).toBe('ok');
    expect(reachView(4999, 100, 5000).level).not.toBe('alarm');
  });
});

describe('AK-UR-03 kein Trend', () => {
  const none = { kind: null, ticks: 0, level: 'ok' };
  it('|net| < EPS: null', () => {
    expect(reachView(10, TREND_EPS / 2, 100)).toEqual(none);
    expect(reachView(10, -TREND_EPS / 2, 100)).toEqual(none);
  });
  it('Bestand = cap bei net > 0: null', () => {
    expect(reachView(100, 1, 100)).toEqual(none);
  });
  it('net > 0 nie empty, net < 0 nie full', () => {
    expect(reachView(0, 1, 100).kind).toBe('full');
    expect(reachView(100, -1, 100).kind).toBe('empty');
  });
  it('Bestand 0, net >= 0 und net im Rauschen: null bzw. full', () => {
    expect(reachView(0, 0, 100)).toEqual(none);
    expect(reachView(0, TREND_EPS / 2, 100)).toEqual(none);
  });
});
