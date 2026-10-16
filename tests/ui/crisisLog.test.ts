import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { crisisView } from '../../src/sim/queries';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { createWorld } from '../../src/sim/world';
import { MAP_SIGNS, mapSigns } from '../../src/ui/guide';
import {
  crisisLogEntries,
  crisisLogVisible,
  eventLogVisible,
  isNotable,
  LOG_MAX,
  logLine,
  nextUnread,
  pushLog,
  unreadLabel,
  type LogEntry,
} from '../../src/ui/crisisLog';
import { SCENARIOS } from '../sim/scenarios';

/** Spielt `ticks` Schritte und sammelt die Einträge wie die Frame-Schleife (ein Vergleich je Tick). */
function run(w: World, ticks: number): LogEntry[] {
  const all: LogEntry[] = [];
  let prev = crisisView(w);
  for (let i = 0; i < ticks; i++) {
    step(w);
    const cur = crisisView(w);
    all.push(...crisisLogEntries(prev, cur, w, w.tick));
    prev = cur;
  }
  return all;
}

const texts = (es: LogEntry[]): string[] => es.map((e) => e.text);

describe('crisisLogEntries (M6-AK-U2-01)', () => {
  it('Brand: Eintrag mit Gebühr und Ausfall, Warn-Meldung; danach „wieder in Betrieb"', () => {
    const w = SCENARIOS['krise-brand']!();
    const fee = BUILDING_DEFS.distillery.cost.money;
    const es = run(w, 205);
    expect(es[0]).toMatchObject({
      text: `Brand: ${BUILDING_DEFS.distillery.name} brennt — Instandsetzung ${fee}, 20 s Ausfall`,
      toast: 'warn',
    });
    expect(es[1]).toMatchObject({
      text: `${BUILDING_DEFS.distillery.name} wieder in Betrieb`,
      toast: null,
    });
    expect(es[1]!.tick - es[0]!.tick).toBe(200);
    expect(es).toHaveLength(2);
  });

  it('Brand gelöscht: Eintrag mit Info-Meldung, kein „wieder in Betrieb"', () => {
    const w = SCENARIOS['krise-brand-geschuetzt']!();
    const es = run(w, 205);
    expect(texts(es)).toEqual([`Brand gelöscht: ${BUILDING_DEFS.distillery.name} (Feuerwache)`]);
    expect(es[0]!.toast).toBe('info');
  });

  it('Sturm: Warnung, Beginn, Ende', () => {
    const w = SCENARIOS['krise-sturm']!();
    const es = run(w, 201 + 300 + 5);
    expect(texts(es)).toEqual([
      'Sturmwarnung: Sturm in 21 s',
      'Sturm hat begonnen',
      'Sturm vorüber',
    ]);
    expect(es.map((e) => e.toast)).toEqual(['warn', null, null]);
  });

  it('Boom: Beginn mit Info-Meldung, Ende', () => {
    const w = SCENARIOS['krise-boom']!();
    const es = run(w, 305);
    expect(es).toHaveLength(2);
    expect(es[0]!.text).toMatch(/^Boom: .+ \+50 % für 30 s$/);
    expect(es[0]!.toast).toBe('info');
    expect(es[1]!.text).toBe('Boom vorbei');
  });

  it('Stufe aus: über 600 Ticks kein Eintrag', () => {
    expect(run(SCENARIOS['krise-aus']!(), 600)).toEqual([]);
  });

  it('gleicher Stand und geladener Stand als Basis erzeugen nichts', () => {
    const w = SCENARIOS['krise-brand']!();
    run(w, 50); // mitten im Brand
    const v = crisisView(w);
    expect(v.phase).toBe('active');
    expect(crisisLogEntries(v, v, w, w.tick)).toEqual([]);
  });

  it('abgerissenes Ziel: Ausfallende ohne Eintrag', () => {
    const w = SCENARIOS['krise-brand']!();
    run(w, 5);
    const id = crisisView(w);
    if (id.phase === 'none' || id.target === undefined) throw new Error('kein Ziel');
    delete w.buildings[id.target];
    const es = run(w, 205);
    expect(es).toEqual([]);
  });

  it('Brand ohne Schaden: Eintrag ohne Meldung', () => {
    const w = SCENARIOS['krise-brand']!();
    const none = { phase: 'none', next: 1 } as const;
    const miss = {
      phase: 'active',
      kind: 'fire',
      period: 1,
      from: 5,
      until: 205,
      remaining: 200,
      targetExists: false,
      outcome: 'miss',
    } as const;
    expect(crisisLogEntries(none, miss, w, 5)).toEqual([
      { text: 'Brand ohne Schaden', toast: null, tick: 5 },
    ]);
  });

  it('Zeile mit Tick', () => {
    expect(logLine({ text: 'Boom vorbei', toast: null, tick: 42 })).toBe('0:04 · Boom vorbei');
  });
});

describe('pushLog (M6-AK-U2-01)', () => {
  const e = (n: number): LogEntry => ({ text: `e${n}`, toast: null, tick: n });

  it('neuester oben, Reihenfolge innerhalb einer Gruppe: letzter zuerst', () => {
    expect(texts(pushLog([e(1)], [e(2), e(3)]))).toEqual(['e3', 'e2', 'e1']);
  });

  it('der Eintrag über LOG_MAX verdrängt den ältesten', () => {
    let buf: LogEntry[] = [];
    for (let i = 1; i <= LOG_MAX + 1; i++) buf = pushLog(buf, [e(i)]);
    expect(buf).toHaveLength(LOG_MAX);
    expect(buf[0]!.text).toBe(`e${LOG_MAX + 1}`);
    expect(buf[buf.length - 1]!.text).toBe('e2');
  });

  it('verändert den alten Puffer nicht', () => {
    const buf = [e(1)];
    pushLog(buf, [e(2)]);
    expect(buf).toHaveLength(1);
  });
});

describe('LOG_MAX 20 (AK-UD-06)', () => {
  const e = (n: number, toast: LogEntry['toast'] = null): LogEntry => ({
    text: `e${n}`,
    toast,
    tick: n,
  });

  it('Puffer hält höchstens 20 Einträge', () => {
    expect(LOG_MAX).toBe(20);
    let buf: LogEntry[] = [];
    for (let i = 1; i <= 25; i++) buf = pushLog(buf, [e(i)]);
    expect(buf).toHaveLength(LOG_MAX);
    expect(buf).toHaveLength(20);
  });

  it('12 stille Einträge verdrängen eine vorherige Krise nicht', () => {
    let buf = pushLog([], [e(0, 'warn')]);
    for (let i = 1; i <= 12; i++) buf = pushLog(buf, [e(i)]);
    expect(buf.some((x) => x.toast === 'warn')).toBe(true);
  });
});

describe('eventLogVisible (AK-UD-01)', () => {
  const entry: LogEntry = { text: 'x', toast: null, tick: 1 };
  it('Krisen an, ab erster Periode, leer: true', () => {
    expect(eventLogVisible({ crisisLevel: 'normal', tick: CRISIS_FIRST_TICK }, [])).toBe(true);
  });
  it('Krisen aus, leer: false', () => {
    expect(eventLogVisible({ crisisLevel: 'off', tick: 9000 }, [])).toBe(false);
  });
  it('Krisen aus, ein Eintrag: true', () => {
    expect(eventLogVisible({ crisisLevel: 'off', tick: 9000 }, [entry])).toBe(true);
  });
  it('Krisen an, vor erster Periode, leer: false', () => {
    expect(eventLogVisible({ crisisLevel: 'normal', tick: CRISIS_FIRST_TICK - 1 }, [])).toBe(false);
  });
});

describe('M10 Krisen-Log ab erster Periode (Spec 11.10, Kann K4)', () => {
  it('AK-U2-11 normal: bei 2399 verborgen, bei 2400 sichtbar; off nie', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    w.tick = CRISIS_FIRST_TICK - 1;
    expect(crisisLogVisible(w)).toBe(false);
    expect(mapSigns(w).length).toBe(MAP_SIGNS.length - 1);
    expect(mapSigns(w).some((s) => s.renderer.includes('DIM_FIRE'))).toBe(false);
    w.tick = CRISIS_FIRST_TICK;
    expect(crisisLogVisible(w)).toBe(true);
    expect(mapSigns(w)).toEqual(MAP_SIGNS);
    const off = createWorld(3, { crisisLevel: 'off' });
    off.tick = 9000;
    expect(crisisLogVisible(off)).toBe(false);
  });
});

describe('Neu-Zähler (I-100)', () => {
  const entry = (text: string, toast: LogEntry['toast'], tag?: 'monument-done'): LogEntry =>
    tag ? { text, toast, tick: 1, tag } : { text, toast, tick: 1 };
  const brand = entry('Brand: Brennerei brennt', 'warn');
  const warnung = entry('Sturmwarnung: Sturm in 21 s', 'warn');
  const still = entry('Sturm vorüber', null);

  it('AK-1 isNotable: Meldungen und Banner zählen', () => {
    const brandRun = run(SCENARIOS['krise-brand']!(), 205);
    expect(isNotable(brandRun[0]!)).toBe(true);
    const geloescht = run(SCENARIOS['krise-brand-geschuetzt']!(), 205);
    expect(isNotable(geloescht[0]!)).toBe(true);
    const sturm = run(SCENARIOS['krise-sturm']!(), 201 + 300 + 5);
    expect(isNotable(sturm[0]!)).toBe(true);
    const boom = run(SCENARIOS['krise-boom']!(), 305);
    expect(isNotable(boom[0]!)).toBe(true);
    expect(isNotable(entry('Denkmal fertig', null, 'monument-done'))).toBe(true);
  });

  it('AK-1 isNotable: stille Einträge zählen nicht', () => {
    const brandRun = run(SCENARIOS['krise-brand']!(), 205);
    expect(isNotable(brandRun[brandRun.length - 1]!)).toBe(false);
    expect(brandRun[brandRun.length - 1]!.text).toMatch(/wieder in Betrieb$/);
    const sturm = run(SCENARIOS['krise-sturm']!(), 201 + 300 + 5);
    expect(isNotable(sturm[1]!)).toBe(false);
    expect(isNotable(sturm[2]!)).toBe(false);
    expect(isNotable(entry('Brand ohne Schaden', null))).toBe(false);
  });

  it('AK-2 nextUnread: eingeklappt zählt jeden auffälligen Eintrag', () => {
    expect(nextUnread(0, [brand, warnung], false)).toBe(2);
    expect(nextUnread(3, [brand, still, warnung], false)).toBe(5);
  });

  it('AK-2 nextUnread: aufgeklappt bleibt der Wert, stille Einträge ändern ihn nie', () => {
    expect(nextUnread(0, [brand, warnung], true)).toBe(0);
    expect(nextUnread(5, [brand], true)).toBe(5);
    expect(nextUnread(4, [still], false)).toBe(4);
    expect(nextUnread(0, [], false)).toBe(0);
  });

  it('AK-3 krise-brand: eingeklappt ergibt der Brandeintrag genau 1', () => {
    const w = SCENARIOS['krise-brand']!();
    let unread = 0;
    let prev = crisisView(w);
    for (let i = 0; i < 205; i++) {
      step(w);
      const cur = crisisView(w);
      unread = nextUnread(unread, crisisLogEntries(prev, cur, w, w.tick), false);
      prev = cur;
    }
    expect(unread).toBe(1);
  });

  it('AK-4 unreadLabel: Text und Deckel', () => {
    expect(unreadLabel(0)).toBe('');
    expect(unreadLabel(3)).toBe(' (3 neu)');
    expect(unreadLabel(9)).toBe(' (9 neu)');
    expect(unreadLabel(10)).toBe(' (9+ neu)');
    expect(unreadLabel(25)).toBe(' (9+ neu)');
  });
});
