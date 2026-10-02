import { describe, expect, it } from 'vitest';
import { balanceLabel, formatBalance, taxTooltip, trendArrow } from '../../src/ui/hud';
import { blurAfterClick } from '../../src/ui/dom';
import { goodsBalance } from '../../src/sim/queries';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { costLine } from '../../src/ui/dom';
import { refundText } from '../../src/ui/texts';
import { tooltipLines } from '../../src/ui/buildMenu';
import { createWorld } from '../../src/sim/world';
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
    expect(taxTooltip('low')).toBe(
      'niedrig: 70 % Steuer · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt',
    );
    expect(taxTooltip('high')).toBe(
      'hoch: 130 % Steuer · kein Aufstieg · Häuser nur zu 75 % belegt',
    );
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

describe('Bilanz bei Brandausfall (R115: Dauerleistung)', () => {
  it('goodsBalance bleibt bei Brandausfall nominal', () => {
    const w = createWorld(3);
    w.buildings[1] = {
      id: 1,
      defId: 'kontor',
      x: 10,
      y: 10,
      connected: true,
      progress: 0,
      state: 'ok',
    };
    w.buildings[2] = {
      id: 2,
      defId: 'distillery',
      x: 12,
      y: 10,
      connected: true,
      progress: 0,
      state: 'ok',
    };
    const nominal = goodsBalance(w).rum.produced;
    expect(nominal).toBeGreaterThan(0);
    w.buildings[2]!.outageUntil = w.tick + 100;
    expect(goodsBalance(w).rum.produced).toBe(nominal);
  });
});

describe('blurAfterClick (QA-UI-2)', () => {
  it('Maus gibt den Fokus ab, Tastatur behält ihn', () => {
    expect(blurAfterClick(1)).toBe(true);
    expect(blurAfterClick(0)).toBe(false);
  });
});

it('AK-UX-06 costLine: „{n} Geld · {n} Holz · …", Nullwerte ausser Geld entfallen', () => {
  expect(costLine(BUILDING_DEFS.chapel.cost)).toBe('300 Geld · 20 Holz · 5 Werkzeug · 10 Stein');
  expect(costLine({ money: 5, wood: 0, tools: 0, stone: 0 })).toBe('5 Geld');
});
it('AK-UX-06 kein Kürzel G/H/W/S; Kosten und Rückerstattung ohne „Geld 50"', () => {
  const tips = [
    ...BUILDING_IDS.flatMap((id) => tooltipLines({ kind: 'build', defId: id })),
    ...tooltipLines({ kind: 'road' }),
  ];
  for (const t of tips) expect(t).not.toMatch(/\b[GHWS] \d/);
  const costTexts = [
    ...BUILDING_IDS.flatMap((id) => [
      costLine(BUILDING_DEFS[id].cost),
      refundText(BUILDING_DEFS[id].cost, BUILDING_DEFS[id].cost),
    ]),
    ...tips.filter((t) => t.startsWith('Kosten:')),
  ];
  for (const t of costTexts) expect(t).not.toMatch(/(Geld|Holz|Werkzeug|Stein) \d/);
});
