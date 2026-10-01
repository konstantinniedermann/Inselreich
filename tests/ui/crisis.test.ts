import { describe, expect, it } from 'vitest';
import { BOOM_PCT } from '../../src/sim/defs/crises';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOODS } from '../../src/sim/defs/goods';
import { crisisView } from '../../src/sim/queries';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { crisisCardText, stormAffectedNames } from '../../src/ui/crisis';
import { SCENARIOS } from '../sim/scenarios';

function until(w: World, pred: () => boolean): void {
  for (let i = 0; i < 1000 && !pred(); i++) step(w);
  expect(pred()).toBe(true);
}
const card = (w: World) => crisisCardText(crisisView(w), w);

describe('crisisCardText (M6-AK-U2-02)', () => {
  it('Stufe aus: „Krisen: aus"', () => {
    expect(card(SCENARIOS['krise-aus']!())).toEqual({
      text: 'Krisen: aus',
      kind: null,
      level: null,
    });
  });

  it('keine Krise: Stufe und Ticks bis zur nächsten', () => {
    const w = SCENARIOS['krise-brand']!(); // Stufe normal, Tick vor der Periode
    const c = card(w);
    expect(c).toEqual({
      text: 'Krisen: normal · nächste Krise in 1 Ticks',
      kind: null,
      level: null,
    });
    w.crisisLevel = 'mild';
    expect(card(w).text).toMatch(/^Krisen: mild · nächste Krise in \d+ Ticks$/);
  });

  it('Brand, burning: Gebäude, Ausfall, Gebühr; Warnung', () => {
    const w = SCENARIOS['krise-brand']!();
    step(w);
    expect(card(w)).toEqual({
      text: `Brand: ${BUILDING_DEFS.distillery.name} · Ausfall noch 200 Ticks · Instandsetzung ${BUILDING_DEFS.distillery.cost.money}`,
      kind: 'fire',
      level: 'warn',
    });
  });

  it('Brand, abgerissenes Ziel', () => {
    const w = SCENARIOS['krise-brand']!();
    step(w);
    const v = crisisView(w);
    if (v.phase === 'none' || v.target === undefined) throw new Error('kein Ziel');
    delete w.buildings[v.target];
    const c = card(w);
    expect(c.text).toContain('Brand: abgerissenes Gebäude · Ausfall noch');
    expect(c.kind).toBe('fire');
  });

  it('Brand, extinguished: Hinweis ohne Hervorhebung', () => {
    const w = SCENARIOS['krise-brand-geschuetzt']!();
    step(w);
    expect(card(w)).toEqual({
      text: `Brand gelöscht: ${BUILDING_DEFS.distillery.name} (Feuerwache)`,
      kind: 'fire',
      level: null,
    });
  });

  it('Brand, miss: „Brand ohne Schaden"', () => {
    const w = SCENARIOS['krise-brand']!();
    const c = crisisCardText(
      {
        phase: 'active',
        kind: 'fire',
        period: 0,
        from: 1,
        until: 201,
        remaining: 200,
        targetExists: false,
        outcome: 'miss',
      },
      w,
    );
    expect(c).toEqual({ text: 'Brand ohne Schaden', kind: 'fire', level: null });
  });

  it('Sturm: Warnung mit Betriebsliste aus defs, dann aktiv', () => {
    const w = SCENARIOS['krise-sturm']!();
    step(w);
    const warn = card(w);
    expect(warn.kind).toBe('storm');
    expect(warn.level).toBe('warn');
    expect(warn.text).toBe(
      `Sturmwarnung: Sturm in 201 Ticks, dauert 300 Ticks · halbe Leistung: ${stormAffectedNames()}`,
    );
    for (const id of Object.keys(BUILDING_DEFS) as (keyof typeof BUILDING_DEFS)[]) {
      if (BUILDING_DEFS[id].stormAffected === true)
        expect(warn.text).toContain(BUILDING_DEFS[id].name);
    }
    until(w, () => crisisView(w).phase === 'active');
    expect(card(w)).toEqual({
      text: 'Sturm: noch 299 Ticks · Rohstoffbetriebe halbe Leistung',
      kind: 'storm',
      level: 'warn',
    });
  });

  it('Boom: Gut, Aufschlag aus defs, Hinweis', () => {
    const w = SCENARIOS['krise-boom']!();
    step(w);
    const v = crisisView(w);
    if (v.phase === 'none' || v.good === undefined) throw new Error('kein Boom');
    expect(card(w)).toEqual({
      text: `Boom: ${GOODS[v.good].name} +${BOOM_PCT - 100} % Verkaufspreis · noch 300 Ticks`,
      kind: 'boom',
      level: 'info',
    });
  });
});
