import { describe, expect, it } from 'vitest';
import { TITHE_SWITCH_LOCK, UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { TIERS } from '../../src/sim/defs/tiers';
import { SERVICE_IDS, tickTaxes, totalTaxes } from '../../src/sim/population';
import { totalUpkeep } from '../../src/sim/economy';
import type { Building, GoodId, World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { balanceAfterBuild } from '../../src/ui/balancePreview';
import { cashReach } from '../../src/ui/cashReach';
import {
  TITHE_LOCK_NOTE,
  TITHE_OVERFLOW_NOTE,
  TITHE_TEXT,
  collectTitheLoss,
  newTitheLossState,
  titheConfirmLines,
  titheFlowText,
  titheLockText,
  titheTooltip,
} from '../../src/ui/titheView';
import { placeTownhall, setHouse, village } from '../sim/helpers';

function fulfil(b: Building, w: World): void {
  const h = b.house!;
  h.supplied = true;
  for (const g of Object.keys(home(w).stock) as GoodId[]) h.satisfied[g] = true;
  for (const s of SERVICE_IDS) h.services[s] = true;
}

/** `p` Pionier- und `s` Siedlerhäuser, voll belegt und erfüllt, mit Amtsstube. */
function town(p: number, s: number): { w: World; hall: Building } {
  const { w, houses } = village(p + s, { unlockAll: true });
  const hall = placeTownhall(w);
  houses.forEach((b, i) => {
    setHouse(b, i < p ? 1 : 2, TIERS[i < p ? 1 : 2].maxInhabitants);
    fulfil(b, w);
  });
  return { w, hall };
}

describe('Texte', () => {
  it('Tooltip = Spielertext + Überlaufhinweis', () => {
    expect(TITHE_TEXT[1]).toBe(
      'Zehnt der Pioniere: Ihre ganze Steuer kommt als Werkzeug ins Lager, nicht als Geld.',
    );
    expect(TITHE_TEXT[2]).toBe(
      'Zehnt der Siedler: Ein Zehntel ihrer Steuer kommt als Stein ins Lager.',
    );
    expect(TITHE_LOCK_NOTE).toBe('Nach dem Umschalten bleibt der Zehnt 3 Minuten, wie er ist.');
    expect(titheTooltip(1)).toBe(`${TITHE_TEXT[1]} ${TITHE_OVERFLOW_NOTE}`);
  });
});

describe('AK-ZE-09 Kassenzeile', () => {
  it('Pioniere: Minus', () => {
    const { w } = town(12, 0);
    w.stats.taxes = 96;
    w.stats.upkeep = 70;
    w.money = 3000;
    const lines = titheConfirmLines(w, 1);
    expect(lines[0]).toBe(TITHE_TEXT[1]);
    expect(lines[1]).toBe(TITHE_LOCK_NOTE);
    expect(lines[2]).toBe(`Nach dem Umschalten: ${cashReach(3000, 0, 70)!.text}`);
    expect(lines[2]).toContain('−420 / min');
    expect(lines[3]).toBe('Im Minus kannst du nicht bauen und nicht zukaufen.');
    expect(lines).toHaveLength(4);
  });
  it('Siedler: Plus', () => {
    const { w } = town(0, 15);
    w.stats.taxes = 840;
    w.stats.upkeep = 400;
    const lines = titheConfirmLines(w, 2);
    expect(lines.join('\n')).toContain('Kasse bleibt im Plus (+2136 / min).');
    expect(lines.join('\n')).not.toContain('Im Minus');
  });
  it('Kasse leer', () => {
    const { w } = town(12, 0);
    w.stats.taxes = 96;
    w.stats.upkeep = 70;
    w.money = -50;
    expect(titheConfirmLines(w, 1)[2]).toContain('Kasse ist leer bei');
  });
});

describe('AK-ZE-10 Auflagenzeile', () => {
  const LINE = 'Auflage läuft: kein Zukauf. Mit leerer Kasse kannst du auch nicht bauen.';
  it('nur mit Auflage', () => {
    const { w } = town(0, 15);
    w.stats.taxes = 840;
    w.stats.upkeep = 400;
    w.trial.active = 'selfSupply';
    expect(titheConfirmLines(w, 2)).toContain(LINE);
    w.trial.active = null;
    expect(titheConfirmLines(w, 2)).not.toContain(LINE);
  });
});

describe('AK-ZE-21 Verfall-Meldung', () => {
  it('summiert je Intervall', () => {
    const s = newTitheLossState();
    for (let t = 1; t < UPKEEP_INTERVAL; t++) {
      const r = t === 35 || t === 70 ? { titheLost: { tools: 1 } } : { titheLost: {} };
      expect(collectTitheLoss(s, r, t)).toEqual([]);
    }
    expect(collectTitheLoss(s, { titheLost: {} }, UPKEEP_INTERVAL)).toEqual([
      'Lager voll: 2 Werkzeug verfallen',
    ]);
    expect(s.sum).toEqual({ tools: 0, stone: 0 });
    expect(collectTitheLoss(s, { titheLost: {} }, 2 * UPKEEP_INTERVAL)).toEqual([]);
  });
  it('Werkzeug vor Stein', () => {
    const s = newTitheLossState();
    collectTitheLoss(s, { titheLost: { stone: 3 } }, 5);
    const out = collectTitheLoss(s, { titheLost: { tools: 1 } }, UPKEEP_INTERVAL);
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('Werkzeug');
    expect(out[1]).toContain('Stein');
  });
  it('neuer Zustand beginnt bei 0', () => {
    expect(newTitheLossState().sum).toEqual({ tools: 0, stone: 0 });
  });
});

describe('AK-ZE-23 Vorschau mit Geldanteil', () => {
  it('before = Geldsteuer − Unterhalt', () => {
    const { w } = town(12, 15);
    w.titheOn[1] = true;
    tickTaxes(w); // step() würde die Erfüllung neu bewerten; tickTaxes setzt stats.taxes
    expect(totalTaxes(w)).toBe(936);
    expect(w.stats.taxes).toBe(840);
    const p = balanceAfterBuild(w, 'fisher');
    expect(p.before).toBe(840 - totalUpkeep(w));
    const h = balanceAfterBuild(w, 'house');
    expect(h.after).toBeLessThanOrEqual(h.before);
    expect(h.afterMax!).toBeLessThanOrEqual(h.before);
  });
});

describe('Strom und Sperre', () => {
  it('Flow', () => {
    const { w, hall } = town(12, 0);
    expect(titheFlowText(w, 1)).toBe('');
    w.titheOn[1] = true;
    expect(titheFlowText(w, 1)).toBe('0 / min · 17,2 Werkzeug / min');
    hall.outageUntil = w.tick + 1000;
    expect(titheFlowText(w, 1)).toBe('Zehnt ruht: Amtsstube wirkt nicht');
  });
  it('Flow Stufe 2 (Stein)', () => {
    const { w } = town(0, 15);
    w.titheOn[2] = true;
    expect(titheFlowText(w, 2)).toMatch(/^[1-9]\d* \/ min · [1-9]\d*(,\d)? Stein \/ min$/);
  });
  it('Sperre', () => {
    const { w } = town(12, 0);
    w.titheLockedUntil[1] = w.tick + TITHE_SWITCH_LOCK;
    expect(titheLockText(w, 1)).toBe('wieder änderbar in 3:00');
    w.tick += TITHE_SWITCH_LOCK;
    expect(titheLockText(w, 1)).toBe('');
  });
});
