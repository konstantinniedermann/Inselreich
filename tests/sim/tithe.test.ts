// I-223: Zehnt (T01: nur Defs).
import { describe, expect, it } from 'vitest';
import {
  TAX_CARRY_DIVISOR,
  TITHE_CARRY_DIVISOR,
  TITHE_GOOD,
  TITHE_PCT,
  TITHE_UNITS_PER_100,
} from '../../src/sim/defs/tiers';
import { TITHE_SWITCH_LOCK } from '../../src/sim/defs/timing';

describe('AK-ZE-14 Defs', () => {
  it('Güter, Prozente, Einheiten', () => {
    expect(TITHE_GOOD).toEqual({ 1: 'tools', 2: 'stone' });
    expect(TITHE_PCT).toEqual({ 1: 100, 2: 10 });
    expect(TITHE_UNITS_PER_100).toEqual({ tools: 3, stone: 8 });
  });
  it('Übertragsteiler und Sperre', () => {
    expect(TITHE_CARRY_DIVISOR).toBe(TAX_CARRY_DIVISOR * 100);
    expect(TITHE_CARRY_DIVISOR).toBe(2_000_000);
    expect(TITHE_SWITCH_LOCK).toBe(1800);
  });
});
