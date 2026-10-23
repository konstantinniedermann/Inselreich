import { describe, expect, it } from 'vitest';
import { UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { cashReach } from '../../src/ui/cashReach';
import { TREND_EPS, secToTicks } from '../../src/ui/reach';
import { GOODS_BALANCE_TICKS, formatGameTime, perMinute, signedNum } from '../../src/ui/time';

/** Geld, bei dem die Reichweite bei Bilanz `-net` genau `sec` Sekunden beträgt. */
const moneyFor = (sec: number, net: number): number => (secToTicks(sec) * net) / UPKEEP_INTERVAL;

describe('cashReach', () => {
  it('Umrechnung der Lager-Reichweite passt zum Unterhaltstakt', () => {
    expect(GOODS_BALANCE_TICKS).toBe(UPKEEP_INTERVAL);
  });
  it('I1: keine Zeile bei Überschuss, Gleichstand und Rauschen', () => {
    expect(cashReach(500, 32, 20)).toBeNull();
    expect(cashReach(500, 20, 20)).toBeNull();
    expect(cashReach(500, 20, 20 + TREND_EPS / 2)).toBeNull();
  });
  it('I2: Rechnung, Rundung auf 10 s, Rate wie in der Bilanz', () => {
    const r = cashReach(500, 20, 32)!;
    const exactSec = (500 * UPKEEP_INTERVAL) / 12 / secToTicks(1);
    const rounded = Math.round(exactSec / 10) * 10;
    const rate = signedNum(perMinute(-12, UPKEEP_INTERVAL));
    expect(r.text).toBe(
      `Kasse leer in ≈ ${formatGameTime(secToTicks(rounded))} bei ${rate} / min (ohne Handel und Aufträge)`,
    );
  });
  it('I3: Rundung auf Vielfache von 10 s, Halbwerte nach oben, mindestens 10 s', () => {
    const at = (sec: number) => cashReach(moneyFor(sec, 12), 0, 12)!.text;
    expect(at(254)).toContain(formatGameTime(secToTicks(250)));
    expect(at(255)).toContain(formatGameTime(secToTicks(260)));
    expect(at(1)).toContain(formatGameTime(secToTicks(10)));
  });
  it('I4: Stufen 181 s, 180 s, 60 s', () => {
    expect(cashReach(moneyFor(181, 12), 0, 12)!.level).toBe('ok');
    expect(cashReach(moneyFor(180, 12), 0, 12)!.level).toBe('warn');
    expect(cashReach(moneyFor(60, 12), 0, 12)!.level).toBe('alarm');
  });
  it('I5: Geld 0 mit Minus: Kasse ist leer; Stufe alarm', () => {
    const r = cashReach(0, 0, 12)!;
    expect(r.text).toMatch(/^Kasse ist leer bei /);
    expect(r.level).toBe('alarm');
    expect(cashReach(-5, 0, 12)!.text).toMatch(/^Kasse ist leer/);
    expect(cashReach(-5, 12, 0)).toBeNull();
  });
});
