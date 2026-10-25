import { describe, expect, it } from 'vitest';
import { decree } from '../../src/sim/council';
import { COUNCIL, COUNCIL_NOTE } from '../../src/sim/defs/council';
import { createWorld } from '../../src/sim/world';
import {
  COUNCIL_KEY,
  councilBadge,
  councilBadgeActive,
  councilCards,
  councilEscapeHandled,
  councilOpenNext,
  councilOpened,
  councilToggleAllowed,
} from '../../src/ui/council';
import { hotkeyAction, hotkeyList } from '../../src/ui/hotkeys';

describe('AK-12 Kopfzeilen-Marke', () => {
  it('AK-12: neue Welt ohne Marke', () => {
    const w = createWorld(1);
    expect(councilBadge(w)).toBeNull();
    expect(councilBadgeActive(w)).toBe(false);
  });
  it('AK-12: offene Beschlüsse werden gezählt', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    expect(councilBadge(w)).toBe('Rat · 1');
    expect(councilBadgeActive(w)).toBe(true);
    w.council[3] = 'open';
    expect(councilBadge(w)).toBe('Rat · 2');
  });
  it('AK-12: nach dem Beschluss nur «Rat», nicht hervorgehoben', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    decree(w, 2, 'A');
    expect(councilBadge(w)).toBe('Rat');
    expect(councilBadgeActive(w)).toBe(false);
  });
});

describe('AK-13 Karten', () => {
  it('AK-13: offene Stufen aufsteigend, je zwei Karten mit Texten aus COUNCIL', () => {
    const w = createWorld(1);
    w.council[4] = 'open';
    w.council[2] = 'open';
    const c = councilCards(w);
    expect(c.open.map((g) => g.tier)).toEqual([2, 4]);
    expect(c.open[0]!.cards).toEqual([
      { side: 'A', name: COUNCIL[2].A.name, text: COUNCIL[2].A.text },
      { side: 'B', name: COUNCIL[2].B.name, text: COUNCIL[2].B.text },
    ]);
    expect(c.open[1]!.cards[1]!.text).toBe(COUNCIL[4].B.text);
    expect(c.note).toBe(COUNCIL_NOTE);
    expect(c.decided).toEqual([]);
  });
  it('AK-13: gefasste Beschlüsse als Liste', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    w.council[3] = 'open';
    decree(w, 2, 'A');
    const c = councilCards(w);
    expect(c.decided).toEqual([`Stufe 2: ${COUNCIL[2].A.name}`]);
    expect(c.open.map((g) => g.tier)).toEqual([3]);
  });
});

describe('councilOpened', () => {
  it('meldet null → open', () => {
    expect(councilOpened({ 2: null, 3: null, 4: null }, { 2: 'open', 3: null, 4: null })).toEqual([
      2,
    ]);
  });
  it('meldet open → A nicht', () => {
    expect(councilOpened({ 2: 'open', 3: null, 4: null }, { 2: 'A', 3: null, 4: null })).toEqual(
      [],
    );
  });
  it('prev null (Laden) → leer', () => {
    expect(councilOpened(null, { 2: 'open', 3: 'open', 4: null })).toEqual([]);
  });
});

describe('Hilfe-Taste', () => {
  it('AK-12: Umschalt + R erst nach dem ersten offenen Beschluss, nie doppelt', () => {
    const w = createWorld(1);
    expect(hotkeyList(w).some((h) => h.key === COUNCIL_KEY)).toBe(false);
    w.council[2] = 'open';
    const list = hotkeyList(w);
    expect(COUNCIL_KEY).toBe('Umschalt + R');
    expect(list.filter((h) => h.key === COUNCIL_KEY)).toEqual([
      { key: 'Umschalt + R', label: 'Rat öffnen' },
    ]);
    expect(new Set(list.map((h) => h.key)).size).toBe(list.length);
  });
});

describe('AK-14/15 Rats-Karte: Taste und Esc-Reihenfolge', () => {
  const noMods = { ctrl: false, meta: false, alt: false, shift: false };
  it('AK-15: Umschalt+R liefert die Rats-Aktion, R allein bleibt Weg', () => {
    expect(hotkeyAction('R', { ...noMods, shift: true }, false)).toEqual({ kind: 'council' });
    expect(hotkeyAction('r', noMods, false)).toEqual({ kind: 'tool', tool: { kind: 'road' } });
  });
  it('AK-15: in Eingabefeld und mit Strg keine Rats-Aktion', () => {
    expect(hotkeyAction('R', { ...noMods, shift: true }, true)).toBeNull();
    expect(hotkeyAction('R', { ...noMods, shift: true, ctrl: true }, false)).toBeNull();
  });
  it('AK-15: councilOpenNext schaltet um, Esc schliesst nur eine offene Karte', () => {
    expect(councilOpenNext(false, 'toggle')).toBe(true);
    expect(councilOpenNext(true, 'toggle')).toBe(false);
    expect(councilOpenNext(true, 'escape')).toBe(false);
    expect(councilOpenNext(false, 'escape')).toBe(false);
  });
  it('AK-15: Esc wird von der offenen Karte verbraucht, sonst weitergereicht', () => {
    expect(councilEscapeHandled(true)).toBe(true);
    expect(councilEscapeHandled(false)).toBe(false);
  });
});

describe('UI-BEIPACK-FERN Umschalt+R nur mit Marke (AK-BF8)', () => {
  it('BF8 Helfer: ohne Marke false, mit offenem oder gefasstem Beschluss true', () => {
    const w = createWorld(1);
    expect(councilToggleAllowed(w)).toBe(false);
    w.council[2] = 'open';
    expect(councilToggleAllowed(w)).toBe(true);
    decree(w, 2, 'A');
    expect(councilToggleAllowed(w)).toBe(true);
  });
  it('BF8 hotkeyAction bleibt rein und liefert weiter council', () => {
    const mods = { shift: true, ctrl: false, alt: false, meta: false };
    expect(hotkeyAction('R', mods, false)).toEqual({ kind: 'council' });
  });
});

describe('AK-SR-19 Rats-Karte mit drei Karten', () => {
  it('Stufe 4: Glasrecht, Hofrecht, Seerecht; Stufe 2 und 3 zwei Karten', () => {
    const w = createWorld(1);
    w.council[4] = 'open';
    const cards = councilCards(w).open[0]!.cards;
    expect(cards.map((c) => c.name)).toEqual(['Glasrecht', 'Hofrecht', 'Seerecht']);
    expect(cards.map((c) => c.text)).toEqual(
      (['A', 'B', 'C'] as const).map((s) => COUNCIL[4][s]!.text),
    );
    for (const t of [2, 3] as const) {
      const v = createWorld(1);
      v.council[t] = 'open';
      expect(councilCards(v).open[0]!.cards).toHaveLength(2);
    }
  });
  it('Stufe 3 und 4 offen; Beschluss C in der Liste; Hinweis', () => {
    const w = createWorld(1);
    w.council[3] = 'open';
    w.council[4] = 'open';
    const v = councilCards(w);
    expect(v.open.map((o) => o.tier)).toEqual([3, 4]);
    expect(v.open.map((o) => o.cards.length)).toEqual([2, 3]);
    decree(w, 4, 'C');
    const d = councilCards(w);
    expect(d.decided).toContain('Stufe 4: Seerecht');
    expect(d.note).toBe('Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen.');
  });
});
