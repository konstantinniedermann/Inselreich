import { describe, expect, it } from 'vitest';
import { decree } from '../../src/sim/council';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import { COUNCIL, COUNCIL_NOTE } from '../../src/sim/defs/council';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import type { BuildingDefId, Tier, World } from '../../src/sim/types';
import {
  COUNCIL_KEY,
  councilBadge,
  councilBadgeActive,
  councilChronicleLine,
  councilDecided,
  councilDecidedEntries,
  councilCards,
  councilEscapeHandled,
  councilOpenNext,
  councilPreview,
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
    expect(c.open[0]!.cards.map((k) => ({ side: k.side, name: k.name, text: k.text }))).toEqual([
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

describe('I-139 Rat in Chronik und Log', () => {
  it('AK-J4: Chronik-Zeile in allen Zuständen', () => {
    const w = createWorld(1);
    expect(councilChronicleLine(w)).toBeNull();
    w.council[2] = 'open';
    expect(councilChronicleLine(w)).toBe('Rat: 1 Beschluss offen');
    w.council[3] = 'open';
    expect(councilChronicleLine(w)).toBe('Rat: 2 Beschlüsse offen');
    w.council[2] = 'A';
    w.council[3] = 'B';
    expect(councilChronicleLine(w)).toBe(`Rat: ${COUNCIL[2].A.name} · ${COUNCIL[3].B.name}`);
    w.council[4] = 'open';
    w.council[3] = 'open';
    expect(councilChronicleLine(w)).toBe(`Rat: ${COUNCIL[2].A.name} — 2 offen`);
    w.council[3] = 'B';
    expect(councilChronicleLine(w)).toBe(
      `Rat: ${COUNCIL[2].A.name} · ${COUNCIL[3].B.name} — 1 offen`,
    );
    w.council[4] = null;
    w.council[3] = null;
    expect(councilChronicleLine(w)).toBe(`Rat: ${COUNCIL[2].A.name}`);
  });

  it('AK-J5: gefasste Stufen, auch beim Mehrstufensprung', () => {
    const open = { 2: 'open', 3: 'open', 4: null } as const;
    expect(councilDecided({ ...open }, { ...open, 2: 'A' })).toEqual([2]);
    expect(councilDecided({ 2: null, 3: null, 4: null }, { ...open })).toEqual([]);
    expect(councilDecided({ ...open, 2: 'A' }, { ...open, 2: 'A' })).toEqual([]);
    expect(councilDecided(null, { ...open, 2: 'A' })).toEqual([]);
    expect(councilDecided({ ...open }, { 2: 'A', 3: 'B', 4: null })).toEqual([2, 3]);
  });

  it('AK-J6: Log-Einträge ohne Toast und Ziel, in Stufenfolge', () => {
    const prev = { 2: 'open', 3: 'open', 4: null } as const;
    const one = councilDecidedEntries({ ...prev }, { ...prev, 2: 'B' }, 42);
    expect(one).toEqual([{ text: 'Rat beschliesst: Glockenrecht', toast: null, tick: 42 }]);
    expect(one[0]?.target).toBeUndefined();
    const two = councilDecidedEntries({ ...prev }, { 2: 'A', 3: 'B', 4: null }, 7);
    expect(two.map((e) => e.text)).toEqual([
      `Rat beschliesst: ${COUNCIL[2].A.name}`,
      `Rat beschliesst: ${COUNCIL[3].B.name}`,
    ]);
    expect(two.every((e) => e.tick === 7 && e.toast === null)).toBe(true);
  });

  it('AK-J7: die drei Helfer verändern die Welt nicht', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    const prev = { ...w.council };
    decree(w, 2, 'A');
    const before = serialize(w);
    councilChronicleLine(w);
    councilDecided(prev, w.council);
    councilDecidedEntries(prev, w.council, w.tick);
    expect(serialize(w)).toBe(before);
  });
});

/** Gebäude direkt eintragen (nur Art, Insel und Stufe zählen für die Vorschau). */
function addB(w: World, defId: BuildingDefId, island: number, tier?: Tier): void {
  const id = w.nextBuildingId++;
  w.buildings[id] = {
    id,
    defId,
    x: id,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island,
    ...(tier !== undefined
      ? {
          house: {
            tier,
            inhabitants: 0,
            demand: {},
            satisfied: {},
            services: {},
            satisfiedSince: 0,
            supplied: false,
          },
        }
      : {}),
  };
}

describe('I-138 Wirkung vorab', () => {
  it('AK-J9: Webereien über alle Inseln, ohne: Wirkt noch nicht', () => {
    const w = createWorld(1);
    const name = BUILDING_DEFS.weaver.name;
    expect(councilPreview(w, 2, 'A')).toContain('Wirkt noch nicht');
    expect(councilPreview(w, 2, 'A')).toContain(name);
    addB(w, 'weaver', 0);
    addB(w, 'weaver', 1);
    addB(w, 'weaver', 1);
    const t = councilPreview(w, 2, 'A');
    expect(t).toContain('3');
    expect(t).toContain(name);
    expect(t).not.toContain('Wirkt noch nicht');
  });

  it('AK-J10: Kapellen', () => {
    const w = createWorld(1);
    const name = BUILDING_DEFS.chapel.name;
    expect(councilPreview(w, 2, 'B')).toContain('Wirkt noch nicht');
    addB(w, 'chapel', 0);
    addB(w, 'chapel', 0);
    const t = councilPreview(w, 2, 'B');
    expect(t).toContain('2');
    expect(t).toContain(name);
  });

  it('AK-J11: Häuser der Stufe mit Plätzen aus defs', () => {
    const w = createWorld(1);
    const lever = COUNCIL[3].B.lever;
    if (lever.kind !== 'maxInhabitants') throw new Error('Hebel');
    expect(councilPreview(w, 3, 'B')).toContain('Wirkt noch nicht');
    addB(w, 'house', 0, 3);
    addB(w, 'house', 0, 3);
    addB(w, 'house', 0, 2); // andere Stufe zählt nicht
    const m = 2 * (lever.value - TIERS[3].maxInhabitants);
    const t = councilPreview(w, 3, 'B');
    expect(t).toContain('2');
    expect(t).toContain(`+${m}`);
  });

  it('AK-J12: beide Karten jeder offenen Stufe haben eine Vorschau, gefasste keine Karte', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    w.council[3] = 'open';
    decree(w, 3, 'A');
    const v = councilCards(w);
    expect(v.open.map((o) => o.tier)).toEqual([2]);
    for (const c of v.open[0]!.cards) {
      expect(c.preview).toBe(councilPreview(w, 2, c.side));
      expect(c.preview.length).toBeGreaterThan(0);
    }
  });

  it('AK-J14: Vorschau verändert die Welt nicht', () => {
    const w = createWorld(1);
    w.council[2] = 'open';
    addB(w, 'weaver', 0);
    const before = serialize(w);
    councilPreview(w, 2, 'A');
    councilCards(w);
    expect(serialize(w)).toBe(before);
  });
});
