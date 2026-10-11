import { describe, expect, it } from 'vitest';
import { canPlace, siteRuleOk } from '../../src/sim/placement';
import { buildEntries } from '../../src/ui/buildMenu';
import { HOME } from '../../src/sim/world';
import { forceRect } from './helpers';
import { MONUMENT_AT, monumentWorld } from './monumentHelpers';

describe('AK-M13E2-03 Freischaltung', () => {
  const LOCK = 'Erst nach dem Kaufleute-Ziel';
  const { x, y } = MONUMENT_AT;

  it('nennt vor dem Kaufleute-Ziel den Sperrgrund, auch auf Wasser und belegtem Boden', () => {
    const w = monumentWorld();
    w.wonMerchants = false;
    expect(canPlace(w, 'monument', x, y)).toEqual({ ok: false, reason: LOCK });
    forceRect(w, x, y, 3, 3, 'water');
    expect(canPlace(w, 'monument', x, y)).toEqual({ ok: false, reason: LOCK });
    expect(canPlace(w, 'monument', 32, 31)).toEqual({ ok: false, reason: LOCK });
  });

  it('zeigt das Denkmal nur nach dem Ziel und nur auf der Heimatinsel', () => {
    const w = monumentWorld();
    const unlockedBefore = [...w.unlocked];
    w.wonMerchants = false;
    expect(buildEntries(w, 'public', HOME)).not.toContain('monument');
    w.wonMerchants = true;
    expect(canPlace(w, 'monument', x, y).ok).toBe(true);
    expect(buildEntries(w, 'public', HOME)).toContain('monument');
    expect(buildEntries(w, 'public', 1)).not.toContain('monument');
    expect(w.unlocked).toEqual(unlockedBefore);
  });

  it('Standortregel home: nur auf der Heimatinsel', () => {
    const w = monumentWorld();
    expect(siteRuleOk(w, 'monument', x, y, { kind: 'home' }, 1)).toEqual({
      ok: false,
      reason: 'Nur auf der Heimatinsel',
    });
    expect(siteRuleOk(w, 'monument', x, y, { kind: 'home' }, HOME).ok).toBe(true);
  });
});
