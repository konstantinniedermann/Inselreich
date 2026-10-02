import { describe, expect, it } from 'vitest';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';
import { SCENARIOS } from '../sim/scenarios';
import { balanceText, speedTooltip, stockTooltip, tierPath, tierTooltip } from '../../src/ui/hud';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';

describe('Kopfzeile, reine Texte (AK-UX-07)', () => {
  it('AK-UX-07 tierTooltip und tierPath aus TIERS', () => {
    expect(tierTooltip(2)).toBe(
      'Siedler: Einwohner der Stufe 2 · brauchen Nahrung, Stoff, Kapelle',
    );
    expect(tierTooltip(1)).toBe('Pioniere: Einwohner der Stufe 1 · brauchen Nahrung');
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule)',
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
