import { describe, expect, it } from 'vitest';
import { MONUMENT_STAGES } from '../../src/sim/defs/monument';
import { startMonumentStage } from '../../src/sim/monument';
import { friendlyReason } from '../../src/ui/hints';
import { monumentStageCost } from '../../src/ui/monumentView';
import { monumentWorld, placeMonument } from '../sim/monumentHelpers';

describe('Denkmal-Abschnittskosten: eine Quelle', () => {
  it('Fehlerpfad startMonumentStage bei zu wenig Geld: Meldung unverändert', () => {
    // app.ts erreicht den Pfad nur im Browser; hier derselbe Aufruf wie in app.ts.
    const w = monumentWorld();
    placeMonument(w);
    w.money = 10;
    const r = startMonumentStage(w);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const cost = { money: monumentStageCost(w.monument), wood: 0, tools: 0, stone: 0 };
    expect(friendlyReason(w, r.reason, { cost })).toBe('Zu wenig Geld: 4000 nötig, 10 vorhanden');
  });

  it('Wert gleich MONUMENT_STAGES[stage].money', () => {
    const w = monumentWorld();
    placeMonument(w);
    expect(monumentStageCost(w.monument)).toBe(MONUMENT_STAGES[w.monument!.stage]!.money);
  });

  it('0 ohne Denkmal oder nach dem letzten Abschnitt', () => {
    expect(monumentStageCost(null)).toBe(0);
    expect(monumentStageCost(undefined)).toBe(0);
    const w = monumentWorld();
    placeMonument(w);
    w.monument!.stage = MONUMENT_STAGES.length;
    expect(monumentStageCost(w.monument)).toBe(0);
  });
});
