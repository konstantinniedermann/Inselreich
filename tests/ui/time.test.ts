import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TAX_LEVELS } from '../../src/sim/defs/tiers';
import { TICK_MS, UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { crisisView } from '../../src/sim/queries';
import { step } from '../../src/sim/tick';
import type { TaxLevel } from '../../src/sim/types';
import { tooltipLines } from '../../src/ui/buildMenu';
import { crisisCardText } from '../../src/ui/crisis';
import { logLine } from '../../src/ui/crisisLog';
import { nextStep, taxEffect } from '../../src/ui/guide';
import { orderCardText } from '../../src/ui/order';
import { burningText, producesText } from '../../src/ui/texts';
import { formatClock, formatGameTime, perMinute, signedNum } from '../../src/ui/time';
import { SCENARIOS } from '../sim/scenarios';

const ticksFor = (seconds: number): number => (seconds * 1000) / TICK_MS;

describe('formatGameTime (AK-UX-02)', () => {
  it('AK-UX-02 Dauern: Sekunden unter 60 s, sonst m:ss, aufgerundet, nie negativ', () => {
    expect(formatGameTime(0)).toBe('0 s');
    expect(formatGameTime(1)).toBe('1 s');
    expect(formatGameTime(40)).toBe(`${Math.ceil((40 * TICK_MS) / 1000)} s`);
    expect(formatGameTime(587)).toBe('59 s');
    expect(formatGameTime(ticksFor(60))).toBe('1:00');
    expect(formatGameTime(ticksFor(240))).toBe('4:00');
    expect(formatGameTime(ticksFor(3600))).toBe('60:00');
    expect(formatGameTime(-5)).toBe('0 s');
  });
  it('AK-UX-02 perMinute: Geld je UPKEEP_INTERVAL und Lager je 100 Ticks', () => {
    expect(perMinute(8, UPKEEP_INTERVAL)).toBe(48);
    expect(perMinute(100 / 30, 100)).toBeCloseTo(20, 5);
  });
  it('AK-UX-02 formatClock (P-2): Zeitpunkt immer m:ss, abgerundet', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(ticksFor(30))).toBe('0:30');
    expect(formatClock(ticksFor(270))).toBe('4:30');
    expect(formatClock(ticksFor(300))).toBe('5:00');
  });
  it('AK-UX-02 signedNum: Plus, typografisches Minus, ±0', () => {
    expect(signedNum(48)).toBe('+48');
    expect(signedNum(-42)).toBe('−42');
    expect(signedNum(0)).toBe('±0');
  });
});

it('AK-UX-13 kein Text enthält „Tick" (alle Szenarien, Tick +0 und +300)', () => {
  const texts: string[] = [];
  for (const tool of [{ kind: 'select' }, { kind: 'road' }, { kind: 'demolish' }] as const)
    texts.push(...tooltipLines(tool));
  for (const id of BUILDING_IDS) texts.push(...tooltipLines({ kind: 'build', defId: id }));
  for (const lvl of Object.keys(TAX_LEVELS) as TaxLevel[]) texts.push(taxEffect(lvl));
  for (const build of Object.values(SCENARIOS)) {
    const w = build();
    for (let i = 0; i <= 300; i++) {
      if (i === 0 || i === 300) {
        texts.push(crisisCardText(crisisView(w), w).text, orderCardText(w), nextStep(w));
        texts.push(logLine({ tick: w.tick, text: 'x', toast: null }));
        for (const b of Object.values(w.buildings)) {
          const def = BUILDING_DEFS[b.defId];
          if (def.produces) texts.push(producesText(def, false));
          texts.push(burningText(b, w.tick));
        }
      }
      step(w);
    }
  }
  for (const t of texts) expect(t, t).not.toMatch(/Tick/);
});
