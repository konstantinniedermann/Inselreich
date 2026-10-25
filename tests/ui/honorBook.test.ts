import { describe, expect, it } from 'vitest';
import { TRIAL_IDS } from '../../src/sim/defs/trials';
import {
  HONOR_BOOK_DEFECT_KEY,
  HONOR_BOOK_KEY,
  isHonorKey,
  mergeBooks,
  openHonorBook,
  parseBook,
  serializeBook,
  type BookData,
  type BookStorage,
  type HonorEntry,
} from '../../src/ui/honorBook';

class Fake implements BookStorage {
  m = new Map<string, string>();
  sets = 0;
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.sets++;
    this.m.set(k, v);
  }
}
const e = (at: string, seed = 1, tick = 10): HonorEntry => ({ at, seed, tick, crisis: 'normal' });
const hit = (id: string) => ({ id, seed: 5, tick: 50, crisis: 'mild' as const });
const T1 = '2026-01-01T10:00:00.000Z';
const T2 = '2026-01-02T10:00:00.000Z';
const doc = (o: unknown) => JSON.stringify(o);
const book = (earned: Record<string, unknown>, extra: object = {}) =>
  doc({ v: 1, earned, run: null, ...extra });
const data = (entries: [string, HonorEntry][], run: BookData['run'] = null): BookData => ({
  earned: new Map(entries),
  run,
});

describe('EB-07 Lesen und Schreiben', () => {
  it('fehlender Schluessel: leer, ok', () => {
    const b = openHonorBook(() => new Fake());
    expect(b.status()).toBe('ok');
    expect(b.data().earned.size).toBe(0);
    expect(b.data().run).toBeNull();
    expect(parseBook(null).status).toBe('ok');
  });

  it.each([
    ['kaputtes JSON', '{nope'],
    ['earned null', doc({ v: 1, earned: null })],
    ['earned Array', doc({ v: 1, earned: [] })],
    ['earned Zahl', doc({ v: 1, earned: 3 })],
    ['kein Objekt', '42'],
    ['v fehlt', doc({ earned: {} })],
  ])('%s: leer, damaged', (_n, raw) => {
    const p = parseBook(raw);
    expect(p.status).toBe('damaged');
    expect(p.data.earned.size).toBe(0);
  });

  it('damaged: setRun legt Kopie ab und ersetzt Inhalt', () => {
    const f = new Fake();
    f.m.set(HONOR_BOOK_KEY, '{nope');
    const b = openHonorBook(() => f);
    expect(b.status()).toBe('damaged');
    b.setRun({ seed: 3, unlockMode: 'all' });
    expect(f.m.get(HONOR_BOOK_DEFECT_KEY)).toBe('{nope');
    const written = JSON.parse(f.m.get(HONOR_BOOK_KEY) as string);
    expect(written.v).toBe(1);
    expect(written.run).toEqual({ seed: 3, unlockMode: 'all' });
  });

  it('v 2: newer, schreibt nie, record liefert und merkt Sitzung', () => {
    const f = new Fake();
    f.m.set(HONOR_BOOK_KEY, book({ a: e(T1) }, { v: 2 }));
    const b = openHonorBook(() => f);
    expect(b.status()).toBe('newer');
    expect(b.data().earned.has('a')).toBe(true);
    expect(b.record([hit('b')], T2)).toEqual(['b']);
    b.setRun({ seed: 1, unlockMode: 'all' });
    expect(f.sets).toBe(0);
    expect(b.session().has('b')).toBe(true);
    expect(b.data().run).toEqual({ seed: 1, unlockMode: 'all' });
  });

  it.each([
    ['kein Objekt', 5],
    ['Seed negativ', { seed: -1, unlockMode: 'all' }],
    ['Seed Bruch', { seed: 1.5, unlockMode: 'all' }],
    ['Modus unbekannt', { seed: 1, unlockMode: 'x' }],
  ])('ungueltiges run (%s): null, Eintraege bleiben, ok', (_n, run) => {
    const p = parseBook(book({ a: e(T1) }, { run }));
    expect(p.status).toBe('ok');
    expect(p.data.run).toBeNull();
    expect(p.data.earned.has('a')).toBe(true);
  });

  it('gueltiges run wird gelesen', () => {
    const p = parseBook(book({}, { run: { seed: 0, unlockMode: 'stepwise' } }));
    expect(p.data.run).toEqual({ seed: 0, unlockMode: 'stepwise' });
  });

  it('Kennungen __proto__, constructor, a b verworfen, Object.prototype unveraendert', () => {
    const raw =
      '{"v":1,"earned":{"__proto__":{"at":"' +
      T1 +
      '","seed":1,"tick":1,"crisis":"off"},' +
      '"constructor":{"at":"' +
      T1 +
      '","seed":1,"tick":1,"crisis":"off"},' +
      '"a b":{"at":"' +
      T1 +
      '","seed":1,"tick":1,"crisis":"off"},' +
      '"ok":{"at":"' +
      T1 +
      '","seed":1,"tick":1,"crisis":"off"}},"run":null}';
    const before = Object.getOwnPropertyNames(Object.prototype).sort();
    const p = parseBook(raw);
    expect([...p.data.earned.keys()]).toEqual(['ok']);
    expect(Object.getOwnPropertyNames(Object.prototype).sort()).toEqual(before);
    expect(({} as Record<string, unknown>).at).toBeUndefined();
  });

  it('isHonorKey: Muster', () => {
    expect(isHonorKey('won')).toBe(true);
    expect(isHonorKey('trial:selfSupply')).toBe(true);
    expect(isHonorKey('prototype')).toBe(false);
    expect(isHonorKey('constructor')).toBe(false);
    expect(isHonorKey('__proto__')).toBe(false);
    expect(isHonorKey('A')).toBe(false);
    expect(isHonorKey('a:b:c')).toBe(false);
    expect(isHonorKey('a b')).toBe(false);
    expect(isHonorKey('')).toBe(false);
  });

  it('ungueltiger Einzeleintrag verworfen, Rest bleibt', () => {
    const p = parseBook(
      book({
        good: e(T1),
        badAt: { ...e(T1), at: 'gestern' },
        badSeed: { ...e(T1), seed: -2 },
        badTick: { ...e(T1), tick: 1.5 },
        badCrisis: { ...e(T1), crisis: 'hart' },
        badNull: null,
      }),
    );
    expect([...p.data.earned.keys()]).toEqual(['good']);
    expect(p.status).toBe('ok');
  });

  it('unbekannte gueltige Kennung bleibt nach record im JSON', () => {
    const f = new Fake();
    f.m.set(HONOR_BOOK_KEY, book({ zukunft: e(T1) }));
    const b = openHonorBook(() => f);
    expect(b.record([hit('neu')], T2)).toEqual(['neu']);
    const w = JSON.parse(f.m.get(HONOR_BOOK_KEY) as string);
    expect(Object.keys(w.earned).sort()).toEqual(['neu', 'zukunft']);
    expect(w.v).toBe(1);
  });

  it('serializeBook / parseBook Rundlauf', () => {
    const d = data([['a', e(T1)]], { seed: 2, unlockMode: 'stepwise' });
    const p = parseBook(serializeBook(d));
    expect(p.status).toBe('ok');
    expect(p.data.earned.get('a')).toEqual(e(T1));
    expect(p.data.run).toEqual({ seed: 2, unlockMode: 'stepwise' });
  });
});

describe('gesperrter Speicher', () => {
  it('storage null: unavailable, kein Wurf, record liefert', () => {
    const b = openHonorBook(() => null);
    expect(b.status()).toBe('unavailable');
    expect(b.record([hit('a'), hit('b')], T1)).toEqual(['a', 'b']);
    expect(b.session().has('a')).toBe(true);
    expect(() => b.setRun({ seed: 1, unlockMode: 'all' })).not.toThrow();
  });

  it('werfendes setItem: unavailable, kein Wurf', () => {
    const f = new Fake();
    f.setItem = () => {
      throw new Error('quota');
    };
    const b = openHonorBook(() => f);
    expect(b.record([hit('a')], T1)).toEqual(['a']);
    expect(b.status()).toBe('unavailable');
    expect(b.session().has('a')).toBe(true);
  });

  it('werfendes getItem: unavailable, kein Wurf', () => {
    const f = new Fake();
    f.getItem = () => {
      throw new Error('locked');
    };
    const b = openHonorBook(() => f);
    expect(b.status()).toBe('unavailable');
    expect(b.record([hit('a')], T1)).toEqual(['a']);
  });

  it('storage-Funktion wirft: unavailable', () => {
    const b = openHonorBook(() => {
      throw new Error('denied');
    });
    expect(b.status()).toBe('unavailable');
    expect(b.record([hit('a')], T1)).toEqual(['a']);
  });
});

describe('EB-08 Einmaligkeit und Zusammenfuehren', () => {
  it('zweites record derselben Kennung aendert at nicht', () => {
    const f = new Fake();
    const b = openHonorBook(() => f);
    expect(b.record([hit('a')], T1)).toEqual(['a']);
    expect(b.record([hit('a')], T2)).toEqual([]);
    expect(b.data().earned.get('a')?.at).toBe(T1);
    expect(JSON.parse(f.m.get(HONOR_BOOK_KEY) as string).earned.a.at).toBe(T1);
  });

  it('mergeBooks: Vereinigung, kleineres at, Gleichstand Speicher', () => {
    const stored = data([
      ['a', e(T2, 1)],
      ['s', e(T1, 1)],
      ['g', e(T1, 111)],
    ]);
    const mine = data([
      ['a', e(T1, 2)],
      ['m', e(T1, 2)],
      ['g', e(T1, 222)],
    ]);
    const r = mergeBooks(stored, mine, false);
    expect([...r.earned.keys()].sort()).toEqual(['a', 'g', 'm', 's']);
    expect(r.earned.get('a')?.at).toBe(T1);
    expect(r.earned.get('a')?.seed).toBe(2);
    expect(r.earned.get('g')?.seed).toBe(111);
  });

  it('mergeBooks: run aus Speicher, ausser neue Insel', () => {
    const sr = { seed: 1, unlockMode: 'all' as const };
    const mr = { seed: 2, unlockMode: 'stepwise' as const };
    expect(mergeBooks(data([], sr), data([], mr), false).run).toEqual(sr);
    expect(mergeBooks(data([], sr), data([], mr), true).run).toEqual(mr);
    expect(mergeBooks(data([], null), data([], mr), false).run).toBeNull();
  });

  it('setRun ersetzt run (Neue Insel) und behaelt Eintraege', () => {
    const f = new Fake();
    f.m.set(HONOR_BOOK_KEY, book({ a: e(T1) }, { run: { seed: 1, unlockMode: 'all' } }));
    const b = openHonorBook(() => f);
    b.setRun({ seed: 9, unlockMode: 'stepwise' });
    const w = JSON.parse(f.m.get(HONOR_BOOK_KEY) as string);
    expect(w.run).toEqual({ seed: 9, unlockMode: 'stepwise' });
    expect(Object.keys(w.earned)).toEqual(['a']);
    expect(b.data().run).toEqual({ seed: 9, unlockMode: 'stepwise' });
  });

  it('zwei Fenster: Fremdschreiben dazwischen, beide Kennungen bleiben', () => {
    const f = new Fake();
    const b = openHonorBook(() => f);
    b.record([hit('a')], T1);
    // Fenster A schreibt dazwischen
    f.m.set(
      HONOR_BOOK_KEY,
      book({ a: e(T1), fremd: e(T2) }, { run: { seed: 4, unlockMode: 'all' } }),
    );
    expect(b.record([hit('b')], T2)).toEqual(['b']);
    const w = JSON.parse(f.m.get(HONOR_BOOK_KEY) as string);
    expect(Object.keys(w.earned).sort()).toEqual(['a', 'b', 'fremd']);
    expect(w.run).toEqual({ seed: 4, unlockMode: 'all' });
  });

  it('record ohne Treffer schreibt nichts', () => {
    const f = new Fake();
    const b = openHonorBook(() => f);
    expect(b.record([], T1)).toEqual([]);
    expect(f.sets).toBe(0);
  });

  it('record: Kennung im Speicher fremd erworben gilt als vorhanden', () => {
    const f = new Fake();
    const b = openHonorBook(() => f);
    f.m.set(HONOR_BOOK_KEY, book({ a: e(T1) }));
    expect(b.record([hit('a')], T2)).toEqual([]);
    expect(JSON.parse(f.m.get(HONOR_BOOK_KEY) as string).earned.a.at).toBe(T1);
  });
});

describe('Muster (P-6)', () => {
  it.each([...TRIAL_IDS])('isHonorKey(trial:%s)', (id) => {
    expect(isHonorKey(`trial:${id}`)).toBe(true);
  });
});
