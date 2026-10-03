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
  LOG_MAX,
  logLine,
  pushLog,
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

  it('der elfte Eintrag verdrängt den ältesten', () => {
    let buf: LogEntry[] = [];
    for (let i = 1; i <= 11; i++) buf = pushLog(buf, [e(i)]);
    expect(buf).toHaveLength(LOG_MAX);
    expect(buf[0]!.text).toBe('e11');
    expect(buf[buf.length - 1]!.text).toBe('e2');
  });

  it('verändert den alten Puffer nicht', () => {
    const buf = [e(1)];
    pushLog(buf, [e(2)]);
    expect(buf).toHaveLength(1);
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
