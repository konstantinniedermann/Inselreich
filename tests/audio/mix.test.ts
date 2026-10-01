import { describe, expect, it } from 'vitest';
import { BUS_DEFAULTS, DUCK, duckGain } from '../../src/audio/mix';

const s = [{ t0: 10, durS: 0.5 }];

describe('mix', () => {
  it('Konstanten', () => {
    expect(BUS_DEFAULTS).toEqual({ master: 0.4, music: 0.5, ambience: 0.7, effects: 1 });
    expect(DUCK).toEqual({ factor: 0.5, attackS: 0.05, holdS: 0.3, releaseS: 0.6 });
  });
  it('AK-A1-02 Faktor 0,5 ab t0 + 0,05 bis Figurende + 0,3, dann 1 nach weiteren 0,6 s', () => {
    expect(duckGain(9.99, s)).toBe(1);
    expect(duckGain(10.05, s)).toBeCloseTo(0.5, 9);
    expect(duckGain(10.8, s)).toBe(0.5);
    expect(duckGain(11.1, s)).toBeCloseTo(0.75, 9);
    expect(duckGain(11.4, s)).toBe(1);
  });
  it('AK-A1-02 Überlappung verlängert das Halten und vertieft nicht', () => {
    const two = [...s, { t0: 10.6, durS: 0.5 }];
    expect(duckGain(11.3, two)).toBe(0.5);
    for (let t = 9; t < 13; t += 0.01) expect(duckGain(t, two)).toBeGreaterThanOrEqual(DUCK.factor);
  });
  it('ohne Signale 1', () => {
    expect(duckGain(3, [])).toBe(1);
  });
});
