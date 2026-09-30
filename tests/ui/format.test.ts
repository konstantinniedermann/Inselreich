import { describe, expect, it } from 'vitest';
import { balanceLabel, formatBalance, taxTooltip, trendArrow } from '../../src/ui/hud';
import { diagnosisText } from '../../src/ui/inspect';
import { actionSound } from '../../src/ui/soundEvents';
import { fail, ok } from '../../src/sim/types';

describe('Warenbilanz (AK-U3-01, AK-U3-07)', () => {
  it('trendArrow: Schwelle ±0.05', () => {
    expect(trendArrow(0.05)).toBe('↑');
    expect(trendArrow(-0.05)).toBe('↓');
    expect(trendArrow(0.049)).toBe('→');
    expect(trendArrow(-0.049)).toBe('→');
    expect(trendArrow(0)).toBe('→');
  });

  it('formatBalance: eine Nachkommastelle, typografisches Minus, ±0.0 im Rauschen', () => {
    expect(formatBalance(-5.5)).toBe('−5.5');
    expect(formatBalance(2.5)).toBe('+2.5');
    expect(formatBalance(0.01)).toBe('±0.0');
    expect(formatBalance(-0.01)).toBe('±0.0');
  });
});

describe('balanceLabel (AK-U3-01/07)', () => {
  it('Pfeil, Leerzeichen, Bilanz', () => {
    expect(balanceLabel(-5.5)).toBe('↓ −5.5');
    expect(balanceLabel(0.01)).toBe('→ ±0.0');
    expect(balanceLabel(2.5)).toBe('↑ +2.5');
  });
});

describe('taxTooltip (Spec 10.7)', () => {
  it('nennt Steuer, Wartezeit bzw. „kein Aufstieg" und Belegung', () => {
    expect(taxTooltip('low')).toBe('Steuer 70 % · Aufstieg nach 150 Ticks · Belegung 100 %');
    expect(taxTooltip('high')).toBe('Steuer 130 % · kein Aufstieg · Belegung 75 %');
  });
});

describe('diagnosisText (AK-U3-02)', () => {
  it('bildet jede Diagnose auf einen Text ab', () => {
    expect(diagnosisText({ kind: 'supply' })).toBe('nicht versorgt');
    expect(diagnosisText({ kind: 'good', good: 'wood' })).toBe('Holz fehlt');
    expect(diagnosisText({ kind: 'service', service: 'faith' })).toBe('Kapelle fehlt');
    expect(diagnosisText({ kind: 'service', service: 'school' })).toBe('Schule fehlt');
  });
});

describe('actionSound (Ton-Hooks)', () => {
  it('Erfolg gibt den Ton der Aktion, Fehler immer error', () => {
    expect(actionSound(ok, 'coin')).toBe('coin');
    expect(actionSound(ok, 'orderDone')).toBe('orderDone');
    expect(actionSound(ok, null)).toBeNull();
    expect(actionSound(fail('Nicht genug Ware'), 'coin')).toBe('error');
    expect(actionSound(fail('x'), null)).toBe('error');
  });
});
