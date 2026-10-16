import { describe, expect, it } from 'vitest';
import { UPKEEP_INTERVAL } from '../../src/sim/economy';
import { perMinute, signedNum } from '../../src/ui/time';
import { SHORT_FROM, flowLabel, flowText, flowTitle } from '../../src/ui/balanceFlow';

/** Stats, deren Minutenwert genau `pm` ergibt (Rechnung über perMinute, kein Literal-Faktor). */
const perMin1 = perMinute(1, UPKEEP_INTERVAL);
const stat = (pm: number): number => pm / perMin1;

describe('I-108 flowText', () => {
  it('AK-1 +540 / −780 mit U+2212', () => {
    const t = flowText({ taxes: stat(540), upkeep: stat(780) });
    expect(t).toBe('+540 / −780');
    expect(t).toContain('−');
  });
  it('AK-2 Nullen, nie NaN oder -0', () => {
    expect(flowText({ taxes: stat(540), upkeep: 0 })).toBe('+540 / −0');
    expect(flowText({ taxes: 0, upkeep: stat(780) })).toBe('+0 / −780');
    expect(flowText({ taxes: 0, upkeep: 0 })).toBe('+0 / −0');
    // echte -0 und NaN: ASCII-Minus, «−-» und NaN dürfen nie vorkommen
    for (const s of [
      { taxes: 0, upkeep: 0 },
      { taxes: -0, upkeep: -0 },
      { taxes: -0.3, upkeep: -0.3 },
      { taxes: NaN, upkeep: NaN },
    ]) {
      expect(flowText(s)).toBe('+0 / \u22120');
      expect(flowText(s)).not.toMatch(/NaN|-|\u2212-/);
    }
  });
  it('AK-3 Kurzform ab SHORT_FROM, abgeschnitten', () => {
    expect(SHORT_FROM).toBe(10000);
    const t = (pm: number) => flowText({ taxes: stat(pm), upkeep: 0 }).split(' / ')[0];
    expect(t(9999)).toBe('+9999');
    expect(t(10000)).toBe('+10,0k');
    expect(t(12345)).toBe('+12,3k');
    expect(t(12399)).toBe('+12,3k');
    const big = flowText({ taxes: stat(999999), upkeep: stat(999999) });
    expect(big).toBe('+999,9k / −999,9k');
    // Plan nennt 15 Zeichen; bei 2 x 6 Zeichen plus «+», « / », «\u2212» sind es 17 (Bericht)
    for (const p of big.split(' / '))
      expect(p.replace(/^[+\u2212]/, '').length).toBeLessThanOrEqual(6);
    expect(big.length).toBeLessThanOrEqual(17);
  });
  it('AK-7 gleicher Eingang, gleicher Text', () => {
    const s = { taxes: 90, upkeep: 130 };
    expect(flowText(s)).toBe(flowText({ ...s }));
  });
});

describe('I-108 flowLabel und flowTitle', () => {
  it('AK-5 Klartext von Hand notiert (taxes 90, upkeep 130 = 540 / 780 je Minute)', () => {
    expect(flowLabel({ taxes: 90, upkeep: 130 })).toBe(
      'Bilanz −240 / min · Steuern +540 / min · Unterhalt −780 / min',
    );
    expect(flowLabel({ taxes: 130, upkeep: 90 })).toBe(
      'Bilanz +240 / min · Steuern +780 / min · Unterhalt −540 / min',
    );
  });
  it('AK-4 Titel beginnt mit Bilanz, nennt volle Zahlen', () => {
    const s = { taxes: 90, upkeep: 130 };
    const t = flowTitle(s);
    expect(t.startsWith(`Bilanz ${signedNum(-240)} / min`)).toBe(true);
    expect(t).toContain('Steuern +540 / min');
    expect(t).toContain('Unterhalt −780 / min');
  });
});
