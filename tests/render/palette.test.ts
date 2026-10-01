import { describe, expect, it } from 'vitest';
import {
  PALETTE,
  SHADOW,
  SIGNAL_NAMES,
  SURFACE_NAMES,
  mixHex,
  rgbOf,
  rgbaOf,
} from '../../src/render/palette';
import { lightAt } from '../../src/render/daynight';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';

describe('Palette', () => {
  it('AK-R1-03 ΔE2000-Helfer trifft die Sharma-Referenzwerte', () => {
    expect(deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(2.0425, 4);
    expect(deltaE2000([50, -1.3802, -84.2814], [50, 0, -82.7485])).toBeCloseTo(1.0, 4);
    expect(deltaE2000([2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514])).toBeCloseTo(0.9082, 4);
  });

  it('AK-R1-03 jede Signalfarbe hat ΔE2000 ≥ 15 zu jeder Flächenfarbe (ungetönt)', () => {
    for (const s of SIGNAL_NAMES)
      for (const f of SURFACE_NAMES)
        expect(
          deltaE2000(hexToLab(PALETTE[s]), hexToLab(PALETTE[f])),
          `${s}/${f}`,
        ).toBeGreaterThanOrEqual(15);
  });

  it('AK-R1-03 Signalfarben untereinander und window gegen jede Signalfarbe ΔE2000 ≥ 15', () => {
    for (let i = 0; i < SIGNAL_NAMES.length; i++) {
      for (let j = i + 1; j < SIGNAL_NAMES.length; j++)
        expect(
          deltaE2000(hexToLab(PALETTE[SIGNAL_NAMES[i]!]), hexToLab(PALETTE[SIGNAL_NAMES[j]!])),
          `${SIGNAL_NAMES[i]}/${SIGNAL_NAMES[j]}`,
        ).toBeGreaterThanOrEqual(15);
      expect(
        deltaE2000(hexToLab(PALETTE.window), hexToLab(PALETTE[SIGNAL_NAMES[i]!])),
        `window/${SIGNAL_NAMES[i]}`,
      ).toBeGreaterThanOrEqual(15);
    }
  });

  it('AK-R1-03 Palette enthält genau die Werte aus Spec 4.2', () => {
    expect(PALETTE.signalRed).toBe('#ff3b5c');
    expect(PALETTE.signalYellow).toBe('#ffe000');
    expect(PALETTE.signalWarn).toBe('#ff6726');
    expect(PALETTE.signalOk).toBe('#2ee6a8');
    expect(PALETTE.window).toBe('#ffb65c');
    expect(PALETTE.roofTerracotta).toBe('#a65b3f');
    expect(PALETTE.waterDeep).toBe('#1f5a7a');
    expect(PALETTE.waterMid).toBe('#2f7f9a');
    expect(PALETTE.waterShallow).toBe('#4fb3b0');
    expect(PALETTE.foam).toBe('#f4f1e6');
    expect(PALETTE.sandDry).toBe('#e3cf98');
    expect(PALETTE.sandWet).toBe('#c9b27a');
    expect(PALETTE.grassLight).toBe('#8cbf5a');
    expect(PALETTE.grass).toBe('#6fa84a');
    expect(PALETTE.grassDark).toBe('#557f3a');
    expect(PALETTE.crown).toBe('#2f6b35');
    expect(PALETTE.crownLight).toBe('#4a8a44');
    expect(PALETTE.rock).toBe('#8f8676');
    expect(PALETTE.rockLight).toBe('#b8ad98');
    expect(PALETTE.rockDark).toBe('#5f584d');
    expect(PALETTE.earth).toBe('#a07a4f');
    expect(PALETTE.earthEdge).toBe('#7d5d3a');
    expect(PALETTE.roofThatch).toBe('#c9a24f');
    expect(PALETTE.roofTerracottaDark).toBe('#8a4a3a');
    expect(PALETTE.roofWood).toBe('#8a6a3f');
    expect(PALETTE.roofSlate).toBe('#4f6478');
    expect(PALETTE.roofTimber).toBe('#6b4a2b');
    expect(PALETTE.wallLime).toBe('#efe6d2');
    expect(PALETTE.wallTimber).toBe('#5a3d25');
    expect(PALETTE.wallStone).toBe('#b9ad97');
    expect(PALETTE.lightMorning).toBe('#ffd9a0');
    expect(PALETTE.lightEvening).toBe('#ff9f5a');
    expect(PALETTE.lightNight).toBe('#2a3a6a');
    expect(SHADOW).toBe('rgba(20,35,20,0.35)');
  });

  it('AK-R1-03 Helfer rgbOf, mixHex, rgbaOf', () => {
    expect(rgbOf('#102030')).toEqual([16, 32, 48]);
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('rgb(128,128,128)');
    expect(mixHex('#000000', '#ffffff', -1)).toBe('rgb(0,0,0)');
    expect(mixHex('#000000', '#ffffff', 9)).toBe('rgb(255,255,255)');
    expect(rgbaOf('#102030', 0.5)).toBe('rgba(16,32,48,0.5)');
  });

  it('AK-R1-03 getönt: unter maximaler Tönung (Abend, Nacht, Morgen) bleibt jede Flächenfarbe ΔE2000 ≥ 15 von jeder ungetönten Signalfarbe', () => {
    for (const tick of [2160, 2520, 2820, 4680]) {
      const { mul } = lightAt(tick);
      for (const f of SURFACE_NAMES) {
        const tinted = rgbOf(PALETTE[f]).map((c, i) => Math.round(c * mul[i]!)) as [
          number,
          number,
          number,
        ];
        for (const s of SIGNAL_NAMES)
          expect(
            deltaE2000(hexToLab(PALETTE[s]), rgbToLab(tinted)),
            `Tick ${tick} ${s}/${f}`,
          ).toBeGreaterThanOrEqual(15);
      }
    }
  });
});
