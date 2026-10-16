// I-103 T04: Bilanzzeile im Schiff-Panel (reine Texte plus DOM-Abschnitt gegen das Fake-DOM, ADR-001).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHIP } from '../../src/sim/defs/sea';
import { UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { routeBalance } from '../../src/sim/routeBalance';
import type { Route, World } from '../../src/sim/types';
import { putBuilding } from '../sim/helpers';
import { foundKontor2Literal, seaWorld, shipLiteral } from '../sim/seaHelpers';
import {
  renderShipSection,
  routeBalanceText,
  shipBalanceLines,
  shipsKey,
  updateShipSection,
  type ShipActions,
} from '../../src/ui/ships';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';
import { FakeElement } from './fakeDom';

const goodsCalls = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/sim/flow', async (orig) => {
  const mod = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...mod,
    goodsBalance: ((...a: Parameters<typeof mod.goodsBalance>) => {
      goodsCalls.n++;
      return mod.goodsBalance(...a);
    }) as typeof mod.goodsBalance,
  };
});

/** FakeElement mit `querySelectorAll('.klasse')` und `scrollIntoView`, soweit `ships.ts` sie braucht. */
class El extends FakeElement {
  scrollIntoView(): void {}
  querySelectorAll<T = El>(sel: string): T[] {
    const cls = sel.slice(1);
    return this.descendants().filter((n) => n.className.split(' ').includes(cls)) as T[];
  }
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: (t: string) => new El(t) });
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

const route = (ab: Route['ab'][number]['good'][], ba: Route['ba'][number]['good'][]): Route => ({
  a: 0,
  b: 1,
  ab: ab.map((good) => ({ good, reserve: 0 })),
  ba: ba.map((good) => ({ good, reserve: 0 })),
});

/** Zwei Inseln, drei Fischer auf Insel 1 (Überschuss an Nahrung, Route `gain` trägt den Unterhalt). */
function world(): World {
  const w = seaWorld();
  foundKontor2Literal(w, 1);
  const k2 = w.buildings[w.islands[1]!.kontorId!]!;
  for (const dy of [0, 4, 8]) putBuilding(w, 1, 'fisher', k2.x + 4, k2.y + dy);
  return w;
}

const gain = route([], ['food']);
const loss = route([], []);

const noop = (): void => {};
const actions: ShipActions = {
  buy: noop,
  startRoute: noop,
  changeRoute: noop,
  clearRoute: noop,
  retire: noop,
  reject: noop,
};

describe('I-103 T04 routeBalanceText', () => {
  it('AK-B7 Gewinn: Text aus routeBalance und perMinute, Netto abgerundet (B5b)', () => {
    const w = world();
    const b = routeBalance(w, gain)!;
    const goods = Math.floor(perMinute(b.goodsPer100, GOODS_BALANCE_TICKS));
    const net = Math.floor(perMinute(b.net100, GOODS_BALANCE_TICKS));
    expect(b.goodsPer100).toBeGreaterThan(0);
    const upkeep = perMinute(SHIP.upkeep, UPKEEP_INTERVAL);
    const r = routeBalanceText(w, gain)!;
    expect(r.text).toBe(
      `Warenwert ${signedNum(goods)} / min · Unterhalt ${upkeep} → ${signedNum(net)} · nominal`,
    );
    // unabhängig notiert: 22,24 je 100 Ticks = 133,4 / min; Netto 133,4 − 90 = 43,4 (abgerundet)
    expect(r.text).toBe('Warenwert +133 / min · Unterhalt 90 → +43 · nominal');
    expect(r.warn).toBe(false);
    expect(r.tip).toContain('Weitere Schiffe auf dieser Route teilen den Überschuss.');
  });

  it('AK-B5b Bruchteil wird abgerundet, nie aufgerundet', () => {
    const w = world();
    const b = routeBalance(w, gain)!;
    const raw = perMinute(b.goodsPer100, GOODS_BALANCE_TICKS);
    expect(raw % 1).not.toBe(0);
    expect(routeBalanceText(w, gain)!.text).toContain(`Warenwert +${Math.floor(raw)} /`);
  });

  it('AK-B7 Verlust: Minus und warn', () => {
    const w = world();
    const r = routeBalanceText(w, loss)!;
    expect(r.text).toBe('Warenwert ±0 / min · Unterhalt 90 → −90 · nominal');
    expect(r.warn).toBe(true);
  });

  it('AK-B7 Lane fehlt: null', () => {
    const w = world();
    expect(routeBalanceText(w, { ...gain, b: 99 })).toBeNull();
  });

  it('AK-B7 shipBalanceLines: ohne Route und bei Heimfahrt keine Zeile', () => {
    const w = world();
    const withRoute = shipLiteral(w, { route: gain });
    const free = shipLiteral(w);
    const homing = shipLiteral(w, { homing: true });
    const lines = shipBalanceLines(w, 0);
    expect([...lines.keys()]).toEqual([withRoute.id]);
    expect(lines.has(free.id)).toBe(false);
    expect(lines.has(homing.id)).toBe(false);
  });

  it('AK-B8 shipsKey ändert sich bei Routenwechsel; Zeile folgt der Bilanz, stabil bei Wiederholung', () => {
    const w = world();
    const ship = shipLiteral(w, { route: loss });
    const k0 = shipsKey(w, 0);
    const before = shipBalanceLines(w, 0).get(ship.id)!.text;
    expect(shipBalanceLines(w, 0).get(ship.id)!.text).toBe(before);
    ship.route = gain;
    expect(shipsKey(w, 0)).not.toBe(k0);
    const was = shipBalanceLines(w, 0).get(ship.id)!.text;
    expect(was).not.toBe(before);
    // Betrieb auf der Quellinsel kommt dazu: Zeile ändert sich
    const k2 = w.buildings[w.islands[1]!.kontorId!]!;
    putBuilding(w, 1, 'fisher', k2.x + 8, k2.y);
    expect(shipBalanceLines(w, 0).get(ship.id)!.text).not.toBe(was);
  });
});

describe('I-103 T04 Abschnitt (Fake-DOM)', () => {
  const panel = (): HTMLElement => new El('div') as unknown as HTMLElement;
  const line = (p: HTMLElement, id: number): FakeElement =>
    (p as unknown as El).querySelector(`[data-field="ship-balance-${id}"]`)!;

  it('Zeile nur bei Route, mit Text, Tooltip und negative-Umschalter', () => {
    const w = world();
    const routed = shipLiteral(w, { route: loss });
    const free = shipLiteral(w);
    const p = panel();
    renderShipSection(p, w, 0, actions);
    expect(line(p, free.id)).toBeNull();
    const el = line(p, routed.id);
    expect(el.textContent).toBe(routeBalanceText(w, loss)!.text);
    expect(el.title).toBe(routeBalanceText(w, loss)!.tip);
    expect(el.classList.contains('negative')).toBe(true);
  });

  it('Z4 Routenwechsel bei gleichem Tick zeigt die Bilanz der neuen Route', () => {
    const w = world();
    const ship = shipLiteral(w, { route: loss });
    const p = panel();
    renderShipSection(p, w, 0, actions);
    updateShipSection(p, w);
    ship.route = gain; // Pause: world.tick bleibt gleich, DOM wird über build() neu gebaut
    updateShipSection(p, w);
    expect(line(p, ship.id).textContent).toBe(routeBalanceText(w, gain)!.text);
    expect(line(p, ship.id).classList.contains('negative')).toBe(false);
  });

  it('Z3 gleicher Tick rechnet nicht neu, Tick-Wechsel schon', () => {
    const w = world();
    shipLiteral(w, { route: gain });
    const p = panel();
    renderShipSection(p, w, 0, actions);
    const n0 = goodsCalls.n;
    expect(n0).toBeGreaterThan(0);
    updateShipSection(p, w);
    updateShipSection(p, w);
    expect(goodsCalls.n).toBe(n0);
    w.tick += 1;
    updateShipSection(p, w);
    expect(goodsCalls.n).toBeGreaterThan(n0);
  });
});
