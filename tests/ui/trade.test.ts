import { describe, expect, it } from 'vitest';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { home, createWorld } from '../../src/sim/world';
import { setEdict } from '../../src/sim/edicts';
import {
  boomGood,
  buyHeadNote,
  buyTitle,
  buyUnitText,
  tradeRows,
  tradeTitle,
} from '../../src/ui/trade';
import { placeTownhall } from '../sim/helpers';

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

describe('M12 E2 UI Bauen und Handeln: Handel je Insel', () => {
  it('tradeRows liest das Lager der Insel', () => {
    const w = createWorld(3);
    w.islands[2]!.stock.wool = 4;
    expect(tradeRows(w, 2).map((r) => r.good)).toContain('wool');
    expect(tradeRows(w, 0).map((r) => r.good)).not.toContain('wool');
  });
  it('tradeTitle: Heimat unverändert, Fremdinsel mit Namen', () => {
    const w = createWorld(3);
    expect(tradeTitle(w, 0)).toBe('Handel am Kontor');
    expect(tradeTitle(w, 2)).toBe('Handel · Felsbucht');
  });
});

describe('M13-E1 Kontor-Preise mit Edikt (AK-M13E1-31)', () => {
  it('AK-M13E1-31 Einheitspreis, Titel und Kopfzeile mit und ohne Handel', () => {
    const w = createWorld(3, { unlockAll: true });
    w.won = true;
    const th = placeTownhall(w);
    w.money = 1000;
    expect(buyUnitText(w, 'food')).toBe('8 Geld');
    expect(buyTitle(w, 'food', 10)).toBe('10 Nahrung kaufen für 80 Geld');
    expect(buyHeadNote(w)).toBe('');
    expect(setEdict(w, 'trade').ok).toBe(true);
    expect(buyUnitText(w, 'food')).toBe('7 Geld');
    expect(buyTitle(w, 'food', 10)).toBe('10 Nahrung kaufen für 64 Geld');
    expect(buyHeadNote(w)).toBe('Edikt Handel: −20 %');
    th.outageUntil = w.tick + 1000;
    expect(buyUnitText(w, 'food')).toBe('8 Geld');
    expect(buyTitle(w, 'food', 10)).toBe('10 Nahrung kaufen für 80 Geld');
    expect(buyHeadNote(w)).toBe('');
  });
});
