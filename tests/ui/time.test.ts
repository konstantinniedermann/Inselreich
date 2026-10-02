import { describe, expect, it } from 'vitest';
import { TICK_MS, UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { formatClock, formatGameTime, perMinute, signedNum } from '../../src/ui/time';

const ticksFor = (seconds: number): number => (seconds * 1000) / TICK_MS;

describe('formatGameTime (AK-UX-02)', () => {
  it('AK-UX-02 Dauern: Sekunden unter 60 s, sonst m:ss, aufgerundet, nie negativ', () => {
    expect(formatGameTime(0)).toBe('0 s');
    expect(formatGameTime(1)).toBe('1 s');
    expect(formatGameTime(40)).toBe(`${Math.ceil((40 * TICK_MS) / 1000)} s`);
    expect(formatGameTime(587)).toBe('59 s');
    expect(formatGameTime(ticksFor(60))).toBe('1:00');
    expect(formatGameTime(ticksFor(240))).toBe('4:00');
    expect(formatGameTime(ticksFor(3600))).toBe('60:00');
    expect(formatGameTime(-5)).toBe('0 s');
  });
  it('AK-UX-02 perMinute: Geld je UPKEEP_INTERVAL und Lager je 100 Ticks', () => {
    expect(perMinute(8, UPKEEP_INTERVAL)).toBe(48);
    expect(perMinute(100 / 30, 100)).toBeCloseTo(20, 5);
  });
  it('AK-UX-02 formatClock (P-2): Zeitpunkt immer m:ss, abgerundet', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(ticksFor(30))).toBe('0:30');
    expect(formatClock(ticksFor(270))).toBe('4:30');
    expect(formatClock(ticksFor(300))).toBe('5:00');
  });
  it('AK-UX-02 signedNum: Plus, typografisches Minus, ±0', () => {
    expect(signedNum(48)).toBe('+48');
    expect(signedNum(-42)).toBe('−42');
    expect(signedNum(0)).toBe('±0');
  });
});
