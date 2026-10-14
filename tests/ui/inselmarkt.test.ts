import { afterEach, describe, expect, it, vi } from 'vitest';
import { PREFER_PCT } from '../../src/sim/defs/sea';
import { GOODS } from '../../src/sim/defs/goods';
import { createWorld, HOME } from '../../src/sim/world';
import { islandEffectTexts, marketTexts } from '../../src/ui/islandCard';
import { preferTag, renderTrade, sellTexts, updateTrade } from '../../src/ui/trade';
import type { TradeActions } from '../../src/ui/trade';
import { ISLANDS } from '../../src/sim/defs/sea';

// Inselindex in der Testwelt: 1 Möweninsel, 2 Felsbucht, 3 Weidenau.
const MOEWEN = 1;
const FELS = 2;
const WEIDENAU = 3;

describe('AK-IM-12 Markt-Zeile der Inselkarte', () => {
  const w = createWorld(3);
  it('Weidenau und Felsbucht enden mit der Markt-Zeile', () => {
    expect(islandEffectTexts(w, WEIDENAU).at(-1)).toBe('Markt: Glas +30 %');
    expect(islandEffectTexts(w, FELS).at(-1)).toBe('Markt: Rum +30 %');
  });
  it('Möweninsel zeigt genau die Markt-Zeile, Heimat nichts', () => {
    expect(islandEffectTexts(w, MOEWEN)).toEqual(['Markt: Stoff +30 %']);
    expect(islandEffectTexts(w, HOME)).toEqual([]);
  });
  it('Trait-Zeilen davor bleiben unverändert', () => {
    expect(islandEffectTexts(w, WEIDENAU)[0]).toBe('Fruchtbar: Zuckerrohrplantage, Schäferei ×2');
  });
  it('Prozent kommt aus PREFER_PCT', () => {
    expect(marketTexts(ISLANDS[0]!)).toEqual([`Markt: ${GOODS.cloth.name} +${PREFER_PCT - 100} %`]);
  });
});

describe('AK-IM-13 Verkaufspreis und Vorliebe-Marke', () => {
  const w = createWorld(3, { unlockAll: true });
  it('sellTexts nimmt die Insel des Dialogs', () => {
    const t = sellTexts(w, 'glass', 1, WEIDENAU);
    expect(t.price).toBe('26 Geld');
    expect(t.title).toBe('1 Glas verkaufen für 26 Geld');
    expect(sellTexts(w, 'glass', 1, HOME).price).toBe('20 Geld');
  });
  it('preferTag: nur am Vorliebe-Gut einer Fremdinsel, bei Boom «statt»', () => {
    const v = createWorld(3, { unlockAll: true });
    expect(preferTag(v, WEIDENAU, 'glass')).toBe('Vorliebe +30 %');
    expect(preferTag(v, WEIDENAU, 'cloth')).toBe('');
    expect(preferTag(v, HOME, 'glass')).toBe('');
    v.crisis = { period: 0, kind: 'boom', from: 0, until: 300, good: 'glass' };
    expect(preferTag(v, WEIDENAU, 'glass')).toBe('statt Vorliebe +30 %');
  });
});

interface Fake {
  tag: string;
  className: string;
  textContent: string;
  title: string;
  hidden: boolean;
  dataset: Record<string, string>;
  children: Fake[];
  [k: string]: unknown;
}
function fakeEl(tag: string): Fake {
  const el: Fake = {
    tag,
    className: '',
    textContent: '',
    title: '',
    hidden: false,
    dataset: {},
    children: [],
    classList: { toggle: () => {} },
    appendChild: (c: Fake) => void el.children.push(c),
    append: (...c: Fake[]) => void el.children.push(...c),
    replaceChildren: () => void (el.children = []),
    addEventListener: () => {},
    blur: () => {},
    querySelector: (sel: string) => {
      const m = /^\[data-field="(.+)"\]$/.exec(sel);
      return m ? (flat(el).find((e) => e.dataset.field === m[1]) ?? null) : null;
    },
    querySelectorAll: () => [],
  };
  return el;
}
const flat = (e: Fake): Fake[] => [e, ...e.children.flatMap(flat)];

describe('AK-IM-13 Handelsdialog: Feld prefer-<Gut>', () => {
  afterEach(() => vi.unstubAllGlobals());
  const noop: TradeActions = { back: () => {}, changed: () => {}, reserve: () => {} };
  const tag = (p: Fake): Fake | undefined =>
    flat(p).find((e) => e.dataset.field === 'prefer-glass');
  it('Weidenau zeigt die Marke, Heimat blendet sie aus, updateTrade zieht nach', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    const w = createWorld(3, { unlockAll: true });
    const p = fakeEl('div');
    renderTrade(p as unknown as HTMLElement, w, noop, WEIDENAU);
    expect(tag(p)!.hidden).toBe(false);
    expect(tag(p)!.textContent).toBe('Vorliebe +30 %');
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 300, good: 'glass' };
    updateTrade(p as unknown as HTMLElement, w, WEIDENAU);
    expect(tag(p)!.textContent).toBe('statt Vorliebe +30 %');
    const h = fakeEl('div');
    renderTrade(h as unknown as HTMLElement, w, noop, HOME);
    expect(tag(h)!.hidden).toBe(true);
  });
  it('AK-UA3-04 prefer-<Gut> hat badge--prefer, boom-<Gut> behält badge--boom', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    const w = createWorld(3, { unlockAll: true });
    const p = fakeEl('div');
    renderTrade(p as unknown as HTMLElement, w, noop, WEIDENAU);
    expect(tag(p)!.className).toBe('badge--prefer');
    const boom = flat(p).find((e) => e.dataset.field === 'boom-glass');
    expect(boom!.className).toBe('badge--boom');
  });
});
