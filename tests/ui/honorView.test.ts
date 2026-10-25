import { describe, expect, it } from 'vitest';
import { HONORS, HONOR_IDS } from '../../src/sim/defs/honors';
import { CRISIS_LEVELS } from '../../src/sim/defs/crises';
import { isHonorKey, type BookData, type HonorEntry } from '../../src/ui/honorBook';
import { honorCount, honorHints, honorMessage, honorRows, menuLine } from '../../src/ui/honorView';
import { formatClock } from '../../src/ui/time';

const entry = (over: Partial<HonorEntry> = {}): HonorEntry => ({
  at: new Date(2026, 9, 5, 12, 0, 0).toISOString(),
  seed: 42,
  tick: 4500,
  crisis: 'normal',
  ...over,
});
const book = (earned: Record<string, HonorEntry> = {}): BookData => ({
  earned: new Map(Object.entries(earned)),
  run: null,
});
const none: ReadonlySet<string> = new Set();
const TEMPO = 'Tempo-Stücke zählen in dieser Partie nicht (Freischaltung unbekannt)';

describe('Ehrenbuch-Anzeige (I-186 T06)', () => {
  it('AK-EB-01 Muster: jedes Element von HONOR_IDS ist ein gültiger Schlüssel', () => {
    for (const id of HONOR_IDS) expect(isHonorKey(id)).toBe(true);
  });

  it('Zählung: unbekannte Kennung nicht, Sitzung ja', () => {
    const first = HONOR_IDS[0]!;
    const second = HONOR_IDS[1]!;
    const c = honorCount(book({ [first]: entry(), unbekannt: entry() }), new Set([second]));
    expect(c).toEqual({ have: 2, total: HONOR_IDS.length });
    expect(honorCount(book({ [first]: entry() }), new Set([first])).have).toBe(1);
  });

  it('menuLine: leeres Buch', () => {
    expect(menuLine(honorCount(book(), none))).toBe(
      `Ehrenbuch: 0 von ${HONOR_IDS.length} Meisterstücken`,
    );
    expect(menuLine({ have: 3, total: 9 })).toBe('Ehrenbuch: 3 von 9 Meisterstücken');
  });

  it('Zeilen in HONOR_IDS-Reihenfolge, erreicht und offen', () => {
    const id = HONOR_IDS[1]!;
    const rows = honorRows(book({ [id]: entry({ seed: 7, tick: 1234, crisis: 'mild' }) }), none);
    expect(rows.map((r) => r.id)).toEqual([...HONOR_IDS]);
    expect(rows[0]).toMatchObject({
      name: HONORS[HONOR_IDS[0]!].name,
      condition: HONORS[HONOR_IDS[0]!].condition,
      done: null,
      sessionOnly: false,
    });
    expect(rows[1]!.done).toEqual({
      date: '05.10.2026',
      map: 'Karte 7',
      crisis: CRISIS_LEVELS.mild.name,
      time: formatClock(1234),
    });
  });

  it('Stück nur aus der Sitzung: sessionOnly', () => {
    const id = HONOR_IDS[2]!;
    const rows = honorRows(book({ [id]: entry() }), new Set([id]));
    expect(rows[2]!.sessionOnly).toBe(true);
    expect(rows[2]!.done).not.toBeNull();
    expect(rows[3]!.sessionOnly).toBe(false);
  });

  it('Hinweise je Status', () => {
    const run = { seed: 5, unlockMode: 'stepwise' as const };
    expect(honorHints('ok', run, 5)).toEqual([]);
    expect(honorHints('damaged', run, 5)).toEqual(['Ehrenbuch war unlesbar und beginnt neu']);
    expect(honorHints('newer', run, 5)).toEqual([
      'Ehrenbuch aus neuerer Fassung, wird nicht verändert',
    ]);
    expect(honorHints('unavailable', run, 5)).toEqual(['Ehrenbuch wird nicht gespeichert']);
  });

  it('Tempo-Hinweis bei fehlender Marke und fremdem Seed, nicht bei passendem', () => {
    expect(honorHints('ok', null, 5)).toEqual([TEMPO]);
    expect(honorHints('ok', { seed: 6, unlockMode: 'all' }, 5)).toEqual([TEMPO]);
    expect(honorHints('ok', { seed: 5, unlockMode: 'all' }, 5)).toEqual([]);
    expect(honorHints('damaged', null, 5)).toHaveLength(2);
  });

  it('honorMessage: ein, mehrere, ungespeichert', () => {
    expect(honorMessage(['stormTrade'], true)).toBe(
      'Meisterstück: Sturmfest — ins Ehrenbuch eingetragen',
    );
    expect(honorMessage(['citizenTown', 'swiftFound'], true)).toBe(
      'Meisterstücke: Bürgerstadt, Flinke Gründung — ins Ehrenbuch eingetragen',
    );
    expect(honorMessage(['stormTrade'], false)).toBe(
      'Meisterstück: Sturmfest — ins Ehrenbuch eingetragen (nicht gespeichert)',
    );
  });
});
