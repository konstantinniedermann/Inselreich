import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUY_CAP, GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { buyPrice, buyQuote } from '../../src/sim/trade';
import { HOME } from '../../src/sim/world';
import { home, createWorld } from '../../src/sim/world';
import { setEdict } from '../../src/sim/edicts';
import {
  boomGood,
  buyHeadNote,
  buyTitle,
  buyTitleText,
  sellPctText,
  tradeReasonCtx,
  buyUnitText,
  renderTrade,
  reserveTitle,
  tradeRows,
  tradeTitle,
  updateTrade,
  type TradeActions,
} from '../../src/ui/trade';
import { reserveHolds } from '../../src/sim/queries';
import type { Building, GoodId, World } from '../../src/sim/types';
import { placeTownhall } from '../sim/helpers';
import { FakeElement } from './fakeDom';

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

interface Fake {
  tag: string;
  className: string;
  textContent: string;
  title: string;
  hidden: boolean;
  dataset: Record<string, string>;
  children: Fake[];
  handlers: (() => void)[];
  [k: string]: unknown;
}
/** Minimaler DOM-Ersatz mit Kindern, data-Attributen und Klick-Handlern. */
function fakeEl(tag: string): Fake {
  const el: Fake = {
    tag,
    className: '',
    textContent: '',
    title: '',
    hidden: false,
    dataset: {},
    children: [],
    handlers: [],
    classList: { toggle: () => {} },
    appendChild: (c: Fake) => void el.children.push(c),
    append: (...c: Fake[]) => void el.children.push(...c),
    replaceChildren: () => void (el.children = []),
    addEventListener: (_t: string, h: () => void) => void el.handlers.push(h),
    blur: () => {},
    querySelector: (sel: string) => {
      const m = /^\[data-field="(.+)"\]$/.exec(sel);
      return m ? (flat(el).find((e) => e.dataset.field === m[1]) ?? null) : null;
    },
    querySelectorAll: (sel: string) =>
      sel === 'button[data-op]'
        ? flat(el).filter((e) => e.tag === 'button' && 'op' in e.dataset)
        : [],
  };
  return el;
}
const flat = (e: Fake): Fake[] => [e, ...e.children.flatMap(flat)];
const field = (root: Fake, name: string): Fake | undefined =>
  flat(root).find((e) => e.dataset.field === name);
const rbtn = (root: Fake, good: string, dir: 'minus' | 'plus'): Fake =>
  flat(root).find((e) => e.dataset.reserve === `${good}-${dir}`)!;

describe('AK-UT-09 Kopfzelle «Kaufen»', () => {
  afterEach(() => vi.unstubAllGlobals());
  const noop: TradeActions = { back: () => {}, changed: () => {}, reserve: () => {} };
  it('Titel im eigenen span, small danach; Notiz nur mit Edikt sichtbar', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    const w = createWorld(3, { unlockAll: true });
    w.won = true;
    placeTownhall(w);
    w.money = 1000;
    const panel = fakeEl('div');
    renderTrade(panel as unknown as HTMLElement, w, noop);
    const head = flat(panel).find(
      (e) => e.className === 'trade-head' && e.children.some((c) => c.tag === 'small'),
    )!;
    expect(head.textContent).toBe('');
    expect(head.children.map((c) => c.tag)).toEqual(['span', 'small']);
    expect(head.children[0]!.textContent).toBe('Kaufen');
    const note = field(panel, 'buy-note')!;
    expect(note).toBe(head.children[1]);
    updateTrade(panel as unknown as HTMLElement, w);
    expect(note.hidden).toBe(true);
    expect(setEdict(w, 'trade').ok).toBe(true);
    updateTrade(panel as unknown as HTMLElement, w);
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe('Edikt Handel: −20 %');
  });
  it('CSS: .trade-head small ist ein Block', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.trade-head small\s*\{[^}]*display:\s*block/);
  });
});

describe('I-049 T05 Reserve-Zeile im Handelsdialog (AK-SB-16)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const setup = (): { w: World; panel: Fake; calls: [GoodId, number][] } => {
    vi.stubGlobal('document', { createElement: fakeEl });
    const w = createWorld(3, { unlockAll: true });
    const panel = fakeEl('div');
    const calls: [GoodId, number][] = [];
    const actions: TradeActions = {
      back: () => {},
      changed: () => {},
      reserve: (g, v) => {
        calls.push([g, v]);
        w.islands[0]!.reserve[g as 'wood' | 'stone'] = v as 0;
      },
    };
    renderTrade(panel as unknown as HTMLElement, w, actions);
    return { w, panel, calls };
  };
  const click = (b: Fake): void => b.handlers.forEach((h) => h());

  it('nur Holz und Stein haben Reserve, Start «Reserve 0»', () => {
    const { panel } = setup();
    expect(field(panel, 'reserve-wood')!.textContent).toBe('Reserve 0');
    expect(field(panel, 'reserve-stone')!.textContent).toBe('Reserve 0');
    expect(field(panel, 'reserve-tools')).toBeUndefined();
    expect(field(panel, 'reserve-food')).toBeUndefined();
    expect(rbtn(panel, 'tools', 'plus')).toBeUndefined();
  });

  it('+ dreimal 0 -> 20 -> 40 -> 60, weiteres + bleibt 60; - bei 0 bleibt 0', () => {
    const { w, panel, calls } = setup();
    for (let i = 0; i < 4; i++) {
      click(rbtn(panel, 'wood', 'plus'));
      updateTrade(panel as unknown as HTMLElement, w);
    }
    expect(calls.map((c) => c[1])).toEqual([20, 40, 60, 60]);
    expect(field(panel, 'reserve-wood')!.textContent).toBe('Reserve 60');
    const c2 = setup();
    click(rbtn(c2.panel, 'stone', 'minus'));
    expect(c2.calls).toEqual([['stone', 0]]);
    expect(field(c2.panel, 'reserve-stone')!.textContent).toBe('Reserve 0');
  });

  it('Tooltip wörtlich laut Spec R5', () => {
    expect(reserveTitle('wood', 20)).toBe(
      'Betriebe nehmen Holz nur, solange mehr als 20 im Lager liegen. Bauen, Handel und Schiffe sind frei.',
    );
    const { panel } = setup();
    expect(field(panel, 'reserve-box-stone')!.title).toBe(reserveTitle('stone', 0));
  });

  it('Zusatz «hält n Betrieb(e) an» nur bei Reserve > 0 und reserveHolds > 0, je Tick aktualisiert', () => {
    const { w, panel } = setup();
    const mk = (id: number): Building => ({
      id,
      defId: 'toolmaker',
      x: 0,
      y: 5,
      connected: true,
      progress: 0,
      state: 'waitingReserve',
      island: 0,
    });
    w.buildings[101] = mk(101);
    w.islands[0]!.stock.wood = 10;
    // Reserve 0: kein Zusatz, auch wenn Zustand gesetzt ist
    updateTrade(panel as unknown as HTMLElement, w);
    expect(field(panel, 'reserve-hold-wood')!.hidden).toBe(true);
    w.islands[0]!.reserve.wood = 20;
    expect(reserveHolds(w, 0, 'wood')).toBe(1);
    updateTrade(panel as unknown as HTMLElement, w);
    expect(field(panel, 'reserve-hold-wood')!.hidden).toBe(false);
    expect(field(panel, 'reserve-hold-wood')!.textContent).toBe('hält 1 Betrieb an');
    w.buildings[102] = mk(102);
    updateTrade(panel as unknown as HTMLElement, w);
    expect(field(panel, 'reserve-hold-wood')!.textContent).toBe('hält 2 Betriebe an');
    w.buildings[101]!.state = 'ok';
    w.buildings[102]!.state = 'ok';
    updateTrade(panel as unknown as HTMLElement, w);
    expect(field(panel, 'reserve-hold-wood')!.hidden).toBe(true);
  });
});

describe('I-048 Kaufanteil', () => {
  it('AK-3 Handelsfenster rendert kein buy-pct-Feld', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    const w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    const panel = fakeEl('div');
    renderTrade(panel as unknown as HTMLElement, w, {
      back: () => {},
      changed: () => {},
      reserve: () => {},
    });
    expect(flat(panel).filter((e) => (e.dataset.field ?? '').startsWith('buy-pct-'))).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('AK-ZK-32 sellPctText statt «Preis … %»', () => {
    const w = createWorld(3);
    w.sellPct.wood = 80;
    expect(sellPctText(w, 'wood')).toBe('Verkauf 80 %');
    w.sellPct.wood = 100;
    expect(sellPctText(w, 'wood')).toBe('Verkauf 100 %');
    expect(readFileSync('src/ui/trade.ts', 'utf8')).not.toContain('`Preis ${');
  });

  it('AK-ZK-21 Titel wortgleich bei rise 0, ohne Mittel-Zusatz', () => {
    for (const g of GOOD_IDS)
      for (const n of [1, 10])
        for (const edictPct of [100, 80]) {
          const buy = GOODS[g].buy;
          const p = edictPct === 100 ? n * buy : Math.floor((n * buy * 80 + 99) / 100);
          const name = GOODS[g].name;
          expect(buyTitleText(name, n, buyQuote(buy, 100, n, 0, BUY_CAP, edictPct))).toBe(
            `${n} ${name} kaufen für ${p} Geld`,
          );
        }
  });

  it('buyTitleText: Mittel-Zusatz nur über 100 %', () => {
    expect(buyTitleText('Werkzeug', 10, { price: 436, meanPct: 109 })).toBe(
      '10 Werkzeug kaufen für 436 Geld · im Mittel 109 %',
    );
    expect(buyTitleText('Werkzeug', 10, { price: 400, meanPct: 100 })).toBe(
      '10 Werkzeug kaufen für 400 Geld',
    );
  });

  it('tradeReasonCtx: Kauf mit buyPrice bei Anteil 120, Verkauf mit Menge', () => {
    const w = createWorld(3);
    w.buyPct.tools = 120;
    expect(tradeReasonCtx(w, 'buy', 'tools', 10, HOME).cost?.money).toBe(buyPrice(w, 'tools', 10));
    expect(tradeReasonCtx(w, 'sell', 'wood', 5, HOME)).toEqual({
      good: 'wood',
      amount: 5,
      island: HOME,
    });
  });
});

describe('AK-19 Kauf-Knopf bei aktiver Auflage (I-132)', () => {
  const buttons = (): FakeElement[] =>
    (['buy', 'sell'] as const).map((op) => {
      const b = new FakeElement('button');
      b.dataset.op = op;
      b.dataset.good = 'wood';
      b.dataset.n = '1';
      b.querySelector = () => null; // kein <small> im Fake
      return b;
    });
  const panelOf = (btns: FakeElement[]): HTMLElement =>
    ({
      querySelector: () => null,
      querySelectorAll: () => btns,
    }) as unknown as HTMLElement;

  it('mit Auflage: jeder Kauf-Knopf blass mit Grund; Verkauf unberührt', () => {
    const w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    w.money = 100000;
    const [buyBtn, sellBtn] = buttons();
    updateTrade(panelOf([buyBtn!, sellBtn!]), w);
    expect(buyBtn!.classList.contains('unaffordable')).toBe(false);
    expect(buyBtn!.title).not.toBe('Auflage Eigenversorgung: kein Zukauf');
    w.trial = { active: 'selfSupply', ticks: 1, e0: 10, passed: [] };
    updateTrade(panelOf([buyBtn!, sellBtn!]), w);
    expect(buyBtn!.classList.contains('unaffordable')).toBe(true);
    expect(buyBtn!.title).toBe('Auflage Eigenversorgung: kein Zukauf');
    expect(sellBtn!.title).not.toBe('Auflage Eigenversorgung: kein Zukauf');
  });
});
