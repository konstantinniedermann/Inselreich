import { describe, expect, it } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';
import { SCENARIOS } from '../sim/scenarios';
import {
  balanceText,
  popChipHidden,
  speedTooltip,
  stockChipHidden,
  stockTooltip,
  tierPath,
  tierTooltip,
} from '../../src/ui/hud';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { createWorld } from '../../src/sim/world';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';

describe('Kopfzeile, reine Texte (AK-UX-07)', () => {
  it('AK-UX-07 tierTooltip und tierPath aus TIERS', () => {
    expect(tierTooltip(2)).toBe(
      'Siedler: Einwohner der Stufe 2 · brauchen Nahrung, Stoff, Kapelle',
    );
    expect(tierTooltip(1)).toBe('Pioniere: Einwohner der Stufe 1 · brauchen Nahrung');
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Badehaus)',
    );
  });
  it('AK-UX-07 balanceText je Minute', () => {
    expect(balanceText({ taxes: 8, upkeep: 15 })).toEqual({
      text: 'Bilanz −42 / min',
      title: 'Steuern +48 / min · Unterhalt −90 / min',
    });
    expect(balanceText({ taxes: 5, upkeep: 5 }).text).toBe('Bilanz ±0 / min');
  });
  it('AK-UX-07 stockTooltip mit Werten aus goodsBalance', () => {
    const w = SCENARIOS['bilanz-nahrung']!();
    const b = goodsBalance(w).wood;
    const pm = (x: number): number => perMinute(x, GOODS_BALANCE_TICKS);
    expect(stockTooltip(w, 'wood')).toBe(
      `Holz ${w.stock.wood} / ${STORAGE_CAP} · ${signedNum(pm(b.net))} / min ` +
        `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)`,
    );
  });
  it('AK-UX-07 speedTooltip', () => {
    expect(speedTooltip(4)).toBe('Spielzeit läuft 4× so schnell');
  });
});

describe('M8 Stufenpfad (AK-S1-18)', () => {
  it('AK-S1-18 tierPath endet mit den Kaufleuten, tierTooltip(4) nennt alle Bedarfe', () => {
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Badehaus)',
    );
    expect(tierTooltip(4)).toBe(
      'Kaufleute: Einwohner der Stufe 4 · brauchen Nahrung, Stoff, Rum, Glas, Kapelle, Schule, Badehaus',
    );
  });
});

describe('M8 U1 Kopfzeile', () => {
  it('Spec M8 14.1 Kaufleute-Chip verborgen bis zur Freischaltung, Stufen 1–3 nie (Vorprüfung zu AK-U1-04)', () => {
    const w = createWorld(3);
    expect(popChipHidden(w, 4)).toBe(true);
    for (const tier of [1, 2, 3] as const) expect(popChipHidden(w, tier)).toBe(false);
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    w.unlocked = deriveUnlocks(w);
    expect(popChipHidden(w, 4)).toBe(false);
  });

  it('Spec M8 14.1 Glas-Chip verborgen bis zur Freischaltung oder Glas > 0, andere Güter nie (Vorprüfung AK-U1-04, S11)', () => {
    const w = createWorld(3);
    expect(stockChipHidden(w, 'glass')).toBe(true);
    for (const g of GOOD_IDS.filter((x) => x !== 'glass'))
      expect(stockChipHidden(w, g), g).toBe(false);
    w.stock.glass = 1;
    expect(stockChipHidden(w, 'glass')).toBe(false);
    w.stock.glass = 0;
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    w.unlocked = deriveUnlocks(w);
    expect(stockChipHidden(w, 'glass')).toBe(false);
  });
});
