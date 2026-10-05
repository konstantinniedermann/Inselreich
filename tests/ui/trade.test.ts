import { describe, expect, it } from 'vitest';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { home, createWorld } from '../../src/sim/world';
import { boomGood, tradeRows } from '../../src/ui/trade';

describe('boomGood (Marke nur am Boom-Gut)', () => {
  it('trifft genau das Boom-Gut, nach dem Boom keines', () => {
    const w = createWorld(3);
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 300, good: 'wood' };
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual(['wood']);
    w.crisis = { period: 0, kind: 'storm', from: 0, until: 300 };
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual([]);
    w.crisis = null;
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual([]);
  });
});

describe('M10 Handelszeilen nach Freischaltung', () => {
  it('AK-U1-06 Handelszeilen: neue Welt Holz, Werkzeug, Stein, Nahrung; Wolle 3 ohne U2: verkaufbar, nicht kaufbar', () => {
    const w = createWorld(3);
    expect(tradeRows(w).map((r) => r.good)).toEqual(['wood', 'tools', 'stone', 'food']);
    home(w).stock.wool = 3;
    expect(tradeRows(w).find((r) => r.good === 'wool')).toEqual({ good: 'wool', canBuy: false });
  });
});
