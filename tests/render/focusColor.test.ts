import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../src/render/palette';
import { deltaE2000, hexToLab } from './deltaE';

/** Mindestdistanz der Fokus-Kontur zu jeder Palettenfarbe (Wasser, Land, Hüllen, Sprites). */
const MIN_DE = 15;

describe('Gut-Fokus Farbe: Abgrenzung (R462 B3)', () => {
  it(`signalFocus: ΔE2000 ≥ ${MIN_DE} zu jeder Nicht-Signalfarbe der Palette`, () => {
    const others = Object.entries(PALETTE).filter(
      ([k, v]) => !k.startsWith('signal') && /^#[0-9a-f]{6}$/i.test(v),
    );
    expect(others.length).toBeGreaterThan(20);
    for (const [name, hex] of others)
      expect(
        deltaE2000(hexToLab(PALETTE.signalFocus), hexToLab(hex)),
        `signalFocus/${name}`,
      ).toBeGreaterThanOrEqual(MIN_DE);
  });

  it('signalFocus: ΔE2000 ≥ 15 zu den anderen Signalfarben', () => {
    for (const n of ['signalRed', 'signalYellow', 'signalWarn', 'signalOk'] as const)
      expect(
        deltaE2000(hexToLab(PALETTE.signalFocus), hexToLab(PALETTE[n])),
        n,
      ).toBeGreaterThanOrEqual(MIN_DE);
  });
});
