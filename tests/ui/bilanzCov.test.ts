// PERF-BILANZ-COV: Bilanz mit und ohne Coverage identisch; Kopfzeile und Schiff-Abschnitt rechnen sparsam.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { buildCoverage } from '../../src/sim/coverage';
import { goodsBalance } from '../../src/sim/queries';
import { routeBalance } from '../../src/sim/routeBalance';
import type { Route, World } from '../../src/sim/types';
import { HOME } from '../../src/sim/world';
import { chipView, stockTooltip, updateStockChips } from '../../src/ui/hud';
import {
  renderShipSection,
  routeBalanceText,
  shipBalanceLines,
  type ShipActions,
} from '../../src/ui/ships';
import { houseFar, houseNearKontor, putBuilding } from '../sim/helpers';
import { foundKontor2Literal, seaWorld, shipLiteral } from '../sim/seaHelpers';
import { SCENARIOS } from '../sim/scenarios';
import { FakeElement, fakeDocument } from './fakeDom';
import { updateShipSection } from '../../src/ui/ships';

const calls = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/sim/flow', async (orig) => {
  const mod = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...mod,
    goodsBalance: ((...a: Parameters<typeof mod.goodsBalance>) => {
      calls.n++;
      return mod.goodsBalance(...a);
    }) as typeof mod.goodsBalance,
  };
});

class El extends FakeElement {
  scrollIntoView(): void {}
  querySelectorAll<T = El>(sel: string): T[] {
    const cls = sel.slice(1);
    return this.descendants().filter((n) => n.className.split(' ').includes(cls)) as T[];
  }
}

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: (t: string) => new El(t),
  });
  vi.stubGlobal(
    'Option',
    class extends El {
      constructor(text: string, value: string) {
        super('option');
        this.textContent = text;
        this.dataset.value = value;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

/** Welt mit Häusern (eines ausserhalb der Versorgung), Markt und Betrieben auf zwei Inseln. */
function mixedWorld(): World {
  const w = seaWorld();
  foundKontor2Literal(w, 1);
  houseNearKontor(w);
  houseFar(w);
  const k = w.buildings[w.islands[0]!.kontorId!]!;
  putBuilding(w, 0, 'market', k.x + 5, k.y + 5);
  putBuilding(w, 0, 'fisher', k.x + 9, k.y);
  const k2 = w.buildings[w.islands[1]!.kontorId!]!;
  for (const dy of [0, 4, 8]) putBuilding(w, 1, 'fisher', k2.x + 4, k2.y + dy);
  return w;
}

const gain: Route = { a: 0, b: 1, ab: [], ba: [{ good: 'food', reserve: 0 }] };
const noop = (): void => {};
const actions: ShipActions = {
  buy: noop,
  startRoute: noop,
  changeRoute: noop,
  clearRoute: noop,
  retire: noop,
  reject: noop,
};

describe('Bilanz mit und ohne Coverage identisch', () => {
  it('chipView und stockTooltip je Gut, Insel 0 und 1', () => {
    for (const w of [mixedWorld(), SCENARIOS['bilanz-nahrung']!()]) {
      for (let island = 0; island < w.islands.length; island++) {
        const cov = buildCoverage(w);
        const bal = goodsBalance(w, island, cov);
        expect(bal).toEqual(goodsBalance(w, island));
        for (const g of GOOD_IDS) {
          expect(chipView(w, g, island, bal)).toEqual(chipView(w, g, island));
          expect(stockTooltip(w, g, island, bal)).toBe(stockTooltip(w, g, island));
        }
      }
    }
  });
  it('routeBalanceText und shipBalanceLines mit cov gleich ohne cov', () => {
    const w = mixedWorld();
    const ship = shipLiteral(w, { route: gain });
    const cov = buildCoverage(w);
    expect(routeBalanceText(w, gain, new Map(), cov)).toEqual(routeBalanceText(w, gain));
    expect(routeBalance(w, gain, new Map(), cov)).toEqual(routeBalance(w, gain));
    expect(shipBalanceLines(w, 0, new Map(), cov).get(ship.id)).toEqual(
      shipBalanceLines(w, 0).get(ship.id),
    );
  });
});

describe('Kopfzeile rechnet die Bilanz einmal je Refresh', () => {
  it('updateStockChips: genau ein goodsBalance-Aufruf, Chips und Tooltips gesetzt', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = mixedWorld();
    const header = new FakeElement('div');
    for (const g of GOOD_IDS) {
      const chip = new FakeElement('button');
      chip.dataset.field = `stock-${g}`;
      header.appendChild(chip);
    }
    calls.n = 0;
    updateStockChips(header as unknown as HTMLElement, w, HOME, null);
    expect(calls.n).toBe(1);
    const wood = header.querySelector('[data-field="stock-wood"]')!;
    expect(wood.title).toBe(stockTooltip(w, 'wood', HOME));
  });
});

describe('Memo der Routen-Bilanz im Schiff-Abschnitt', () => {
  const panel = (): HTMLElement => new El('div') as unknown as HTMLElement;
  function setup(island = 0): { w: World; p: HTMLElement } {
    const w = mixedWorld();
    shipLiteral(w, { route: gain });
    const p = panel();
    renderShipSection(p, w, island, actions);
    return { w, p };
  }
  it('gleicher Tick ohne Änderung: kein zweiter Aufruf', () => {
    const { w, p } = setup();
    const n = calls.n;
    updateShipSection(p, w);
    updateShipSection(p, w);
    expect(calls.n).toBe(n);
  });
  it('neuer Tick rechnet neu', () => {
    const { w, p } = setup();
    const n = calls.n;
    w.tick += 1;
    updateShipSection(p, w);
    expect(calls.n).toBeGreaterThan(n);
  });
  it('Bau bei Pause (gleicher Tick) rechnet neu', () => {
    const { w, p } = setup();
    const n = calls.n;
    const k2 = w.buildings[w.islands[1]!.kontorId!]!;
    putBuilding(w, 1, 'fisher', k2.x + 8, k2.y);
    updateShipSection(p, w);
    expect(calls.n).toBeGreaterThan(n);
  });
  it('Abriss bei Pause (gleicher Tick) rechnet neu', () => {
    const { w, p } = setup();
    const n = calls.n;
    const fisher = Object.values(w.buildings).find((b) => b.defId === 'fisher' && b.island === 1)!;
    delete w.buildings[fisher.id];
    updateShipSection(p, w);
    expect(calls.n).toBeGreaterThan(n);
  });
  it('Inselwechsel: Abschnitt der anderen Insel hat eigenes Memo', () => {
    const w = mixedWorld();
    shipLiteral(w, { route: gain });
    const p0 = panel();
    renderShipSection(p0, w, 0, actions);
    const n = calls.n;
    const p1 = panel();
    renderShipSection(p1, w, 1, actions);
    expect(calls.n).toBeGreaterThan(n);
    const m = calls.n;
    updateShipSection(p0, w);
    updateShipSection(p1, w);
    expect(calls.n).toBe(m);
  });
});
