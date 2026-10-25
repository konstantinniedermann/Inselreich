// UI-HAEPPCHEN-G T01: «zu spät» an der Fern-Marke (I-155, AK-G1 bis G8).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decree } from '../../src/sim/council';
import { renderNoticeStack, updateNoticeStack } from '../../src/ui/hud';
import { FakeElement, fakeDocument } from './fakeDom';
import { mapLayout, tileToMap } from '../../src/render/seaMap';
import { acceptFarOrder } from '../../src/sim/orders';
import type { GoodId, Ship, World } from '../../src/sim/types';
import { farLate, farMark, farOfferDue, farOfferParts } from '../../src/ui/farOrder';
import { createLaneCache, homeTravelTicks, type Lanes } from '../../src/ui/homeTravel';
import { SEA_MAP_H, SEA_MAP_PAD, SEA_MAP_W, seaMapKey, seaMapTip } from '../../src/ui/seaMapView';
import { formatGameTime } from '../../src/ui/time';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from '../sim/farHelpers';

const layoutOf = (w: World) => mapLayout(w, SEA_MAP_W, SEA_MAP_H, SEA_MAP_PAD);

function orderWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, periodStart(1));
  acceptFarOrder(w);
  return w;
}
function target(w: World) {
  const o = w.order!;
  return { island: o.island!, amount: o.amount, good: o.good };
}
function ship(to: number | null, left: number, cargo: Partial<Record<GoodId, number>>): Ship {
  return { id: 90, port: 0, to, left, cargo, route: null, homing: false };
}
function landPoint(w: World, i: number) {
  const s = w.islands[i]!;
  const k = s.tiles.findIndex((t) => t.terrain !== 'water');
  return tileToMap(layoutOf(w), s.ox + (k % s.width) + 0.5, s.oy + Math.floor(k / s.width) + 0.5);
}

describe('AK-G1 Fahrzeit gegen Rest', () => {
  it('Weltfahrzeit: rest = T - 1 zu spät, rest = T nicht', () => {
    const w = orderWorld();
    const x = target(w);
    w.islands[x.island]!.stock[x.good] = 0;
    const t = homeTravelTicks(w, x.island)!;
    expect(farLate(w, x, t - 1)).toBe(true);
    expect(farLate(w, x, t)).toBe(false);
    expect(farLate(w, x, 0)).toBe(false);
  });
  it('injizierte Lanes d=25', () => {
    const w = orderWorld();
    const x = target(w);
    w.islands[x.island]!.stock[x.good] = 0;
    const lanes: Lanes = () => [{ a: 0, b: x.island, d: 25, points: [] }];
    const t = homeTravelTicks(w, x.island, lanes)!;
    expect(farLate(w, x, t - 1, lanes)).toBe(true);
    expect(farLate(w, x, t, lanes)).toBe(false);
  });
});

describe('AK-G2 Ware vor Ort oder unterwegs', () => {
  function setup() {
    const w = orderWorld();
    const x = target(w);
    const rest = homeTravelTicks(w, x.island)! - 1;
    w.islands[x.island]!.stock[x.good] = 0;
    w.ships = [];
    return { w, x, rest };
  }
  it('Lager', () => {
    const { w, x, rest } = setup();
    w.islands[x.island]!.stock[x.good] = x.amount;
    expect(farLate(w, x, rest)).toBe(false);
    w.islands[x.island]!.stock[x.good] = x.amount - 1;
    expect(farLate(w, x, rest)).toBe(true);
  });
  it('Schiff rechtzeitig und zu spät', () => {
    const { w, x, rest } = setup();
    w.ships = [ship(x.island, rest, { [x.good]: x.amount })];
    expect(farLate(w, x, rest)).toBe(false);
    w.ships = [ship(x.island, rest + 1, { [x.good]: x.amount })];
    expect(farLate(w, x, rest)).toBe(true);
  });
  it('anderes Ziel oder kein Ziel', () => {
    const { w, x, rest } = setup();
    w.ships = [ship(x.island + 1, 1, { [x.good]: x.amount })];
    expect(farLate(w, x, rest)).toBe(true);
    w.ships = [ship(null, 0, { [x.good]: x.amount })];
    expect(farLate(w, x, rest)).toBe(true);
  });
  it('Menge auf zwei Schiffen summiert sich', () => {
    const { w, x, rest } = setup();
    const a = Math.floor(x.amount / 2);
    w.ships = [ship(x.island, 1, { [x.good]: a }), ship(x.island, 2, { [x.good]: x.amount - a })];
    expect(farLate(w, x, rest)).toBe(false);
  });
});

describe('AK-G3 ohne Kontor gilt warn', () => {
  it('warn true, late false', () => {
    const w = orderWorld();
    dropKontor(w, islandOf(w, 'B'));
    const m = farMark(w)!;
    expect(m.warn).toBe(true);
    expect(m.late).toBe(false);
  });
});

describe('AK-G4 ohne Lane', () => {
  it('kein late, kein tip, kein Wurf', () => {
    const w = orderWorld();
    const none: Lanes = () => [];
    const x = target(w);
    expect(farLate(w, x, 5, none)).toBe(false);
    const m = farMark(w, none)!;
    expect(m.late).toBe(false);
    expect(m.tip).toBeNull();
  });
});

describe('AK-G5 Text, AK-G7 Tooltip', () => {
  function lateWorld(): World {
    const w = orderWorld();
    const x = target(w);
    w.islands[x.island]!.stock[x.good] = 0;
    w.ships = [];
    w.order!.due = w.tick + homeTravelTicks(w, x.island)! - 1;
    return w;
  }
  it('Auftrag: Text endet auf zu spät', () => {
    const w = lateWorld();
    const m = farMark(w)!;
    expect(m.late).toBe(true);
    expect(m.text).toBe(`15 Rum · ${formatGameTime(w.order!.due - w.tick)} · zu spät`);
  });
  it('Angebot: Text endet auf zu spät', () => {
    const w = farWorld(3, ['B']);
    stepAt(w, periodStart(1));
    const f = w.farOffer!;
    w.islands[f.island]!.stock[f.good] = 0;
    w.tick = farOfferDue(w)! - (homeTravelTicks(w, f.island)! - 1);
    const m = farMark(w)!;
    expect(m.kind).toBe('offer');
    expect(m.text).toBe(`15 Rum · ${formatGameTime(farOfferDue(w)! - w.tick)} · zu spät`);
  });
  it('nicht zu spät: Text unverändert', () => {
    const w = orderWorld();
    expect(farMark(w)!.text).toBe(`15 Rum · ${formatGameTime(w.order!.due - w.tick)}`);
  });
  it('Tooltip: Fahrzeit einmal, bei late mit Zusatz', () => {
    const w = lateWorld();
    const x = target(w);
    const l = layoutOf(w);
    const p = landPoint(w, x.island);
    const t = homeTravelTicks(w, x.island)!;
    const frag = `Fahrzeit ≈ ${formatGameTime(t)}, Rest ${formatGameTime(w.order!.due - w.tick)}`;
    const tip = seaMapTip(w, l, p.x, p.y)!;
    expect(tip.split(frag)).toHaveLength(2);
    expect(tip.endsWith(`${frag} · zu spät für Ware aus der Heimat`)).toBe(true);
    w.order!.due = w.tick + t + 100;
    w.islands[x.island]!.stock[x.good] = x.amount;
    const ok = seaMapTip(w, l, p.x, p.y)!;
    expect(ok.endsWith(frag.replace(/Rest .*/, `Rest ${formatGameTime(t + 100)}`))).toBe(true);
    expect(ok).not.toContain('zu spät');
  });
  it('Key unterscheidet late', () => {
    const w = orderWorld();
    const x = target(w);
    const l = layoutOf(w);
    w.islands[x.island]!.stock[x.good] = 0;
    const t = homeTravelTicks(w, x.island)!;
    w.order!.due = w.tick + t;
    const a = seaMapKey(w, l);
    w.order!.due = w.tick + t - 1;
    expect(a.endsWith(':00')).toBe(true);
    expect(seaMapKey(w, l).endsWith(' · zu spät:01')).toBe(true);
  });
});

describe('AK-G8 Lane-Cache', () => {
  it('farMark rechnet die Lanes je Welt einmal', () => {
    const w = orderWorld();
    let count = 0;
    const lanes = createLaneCache(() => {
      count += 1;
      return [{ a: 0, b: w.order!.island!, d: 25, points: [] }];
    });
    farMark(w, lanes);
    farMark(w, lanes);
    expect(count).toBe(1);
  });
});

describe('AK-SR-18 Fernauftrag mit Seerecht (P-6)', () => {
  it('zu spät nur ohne Seerecht; Tip und Fernangebot mit Ratswert', () => {
    const w = orderWorld();
    const x = target(w);
    w.islands[x.island]!.stock[x.good] = 0;
    w.order!.due = w.tick + 260;
    const lanes: Lanes = () => [{ a: 0, b: x.island, d: 30, points: [] }];
    expect(farLate(w, x, 260, lanes)).toBe(true);
    expect(farMark(w, lanes)!.text.endsWith(' · zu spät')).toBe(true);
    w.council[4] = 'C';
    expect(farLate(w, x, 260, lanes)).toBe(false);
    const m = farMark(w, lanes)!;
    expect(m.text).not.toContain('zu spät');
    expect(m.tip!.startsWith(`Fahrzeit ≈ ${formatGameTime(240)}`)).toBe(true);
  });
  it('Fernangebot zeigt die Ratsfahrzeit', () => {
    const w = farWorld(3, ['B']);
    stepAt(w, periodStart(1));
    expect(w.farOffer).not.toBeNull();
    const i = w.farOffer!.island;
    const lanes: Lanes = () => [{ a: 0, b: i, d: 30, points: [] }];
    w.council[4] = 'C';
    expect(farOfferParts(w, 0, lanes)!.travel).toBe(`≈ ${formatGameTime(240)} Fahrt`);
  });
});

describe('AK-SR-18 Fernkarte baut den Fahrzeit-Text ohne Tick neu (Review Focus 1)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('nach decree(4, C) zeigt updateNoticeStack die Ratsfahrzeit', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = farWorld(4, ['B']);
    stepAt(w, periodStart(1));
    const noop = () => {};
    const actions = {
      deliver: noop,
      accept: noop,
      decline: noop,
      toProducer: noop,
      cancel: noop,
      acceptFar: noop,
    };
    const stack = renderNoticeStack(
      new FakeElement('div') as unknown as HTMLElement,
      w,
      actions,
    ) as unknown as FakeElement;
    const lead = () => stack.querySelector('[data-field="far-lead"]')!.textContent;
    const before = farOfferParts(w)!.travel!;
    expect(lead()).toContain(before);
    expect(decree(w, 4, 'C').ok).toBe(true);
    updateNoticeStack(stack as unknown as HTMLElement, w);
    const after = farOfferParts(w)!.travel!;
    expect(after).not.toBe(before);
    expect(lead()).toContain(after);
    expect(lead()).not.toContain(before);
  });
});
