import { afterEach, describe, expect, it, vi } from 'vitest';
import { meetLevel } from '../sim/helpers';
import { FakeElement, fakeDocument } from './fakeDom';
import type { ContractEvent, Order } from '../../src/sim/types';
import type { StepReport } from '../../src/sim/tick';
import { islandName } from '../../src/sim/islands';
import { nextOrderTick, orderForPeriod, previewOrder } from '../../src/sim/orders';
import { CONTRACT_LOYAL_AFTER, GOODS } from '../../src/sim/defs/goods';
import { ORDER_FIRST_TICK } from '../../src/sim/defs/timing';
import {
  CONTRACT_CANCELLED,
  announceContract,
  contractAgreedMessage,
  contractNotice,
  contractWarn,
  deliverLabel,
  deliveredMessage,
  orderCardText,
  orderChange,
  orderMessage,
  orderMessageFor,
  orderVisible,
  renderOrder,
  runContractAction,
  updateOrder,
} from '../../src/ui/order';
import * as production from '../../src/ui/production';
import { seaWorld } from '../sim/seaHelpers';
import { farWorld, periodStart, stepAt } from '../sim/farHelpers';
import { acceptContract, acceptFarOrder } from '../../src/sim/orders';
import { farOrderText } from '../../src/ui/farOrder';
import { homeTravelTicks } from '../../src/ui/homeTravel';
import { diffSoundEvents, soundSnapshot } from '../../src/ui/soundEvents';
import { HOME, home, createWorld } from '../../src/sim/world';
import { sellPrice } from '../../src/sim/trade';
import { goodsBalance } from '../../src/sim/flow';
import { GOODS_BALANCE_TICKS, formatGameTime, perMinute } from '../../src/ui/time';
import type { BuildingDefId, GoodId, World } from '../../src/sim/types';

describe('orderCardText (Spec 10.7)', () => {
  it('zeigt den aktiven Auftrag mit Lagerstand', () => {
    const w = createWorld(1);
    w.tick = 1300;
    home(w).stock.wood = 12;
    w.order = { period: 0, good: 'wood', amount: 20, reward: 150, due: 2400 };
    expect(orderCardText(w)).toBe('Auftrag: 20 Holz · Prämie 150 · noch 1:50 · Lager 12/20');
  });

  it('zeigt ohne Auftrag die Wartezeit (AK-U3-06: Tick 1201 → 299)', () => {
    const w = createWorld(1);
    w.order = null;
    w.tick = 1201;
    expect(orderCardText(w)).toBe('Nächster Auftrag in 30 s');
  });
});

describe('orderChange (Ereigniserkennung)', () => {
  it('neue Periode = new, Verschwinden = expired, sonst nichts', () => {
    expect(orderChange(null, 0)).toBe('new');
    expect(orderChange(0, 1)).toBe('new');
    expect(orderChange(0, null)).toBe('expired');
    expect(orderChange(0, 0)).toBeNull();
    expect(orderChange(null, null)).toBeNull();
  });
});

const o: Order = { period: 1, good: 'wood', amount: 20, reward: 140, due: 1500 };

it('AK-UX-09 orderMessage und deliveredMessage nennen Gut und Menge', () => {
  expect(orderMessage(null, o)).toBe('Neuer Auftrag: 20 Holz · Prämie 140');
  expect(orderMessage(o, null)).toBe('Auftrag verfallen: 20 Holz');
  expect(orderMessage(o, { ...o })).toBeNull();
  expect(orderMessage(o, { ...o, period: 2, good: 'food', amount: 10, reward: 60 })).toBe(
    'Neuer Auftrag: 10 Nahrung · Prämie 60',
  );
  expect(deliveredMessage(o)).toBe('Auftrag geliefert: 20 Holz · +140 Geld');
});

describe('M10 Auftragskarte nach Freischaltung', () => {
  const orderFixture = (w: ReturnType<typeof createWorld>): Order => ({
    period: 1,
    ...orderForPeriod(w.seed, 1, 1),
    due: 2100,
  });
  it('AK-U1-07 Auftragskarte vor U3 verborgen, ab U3 sichtbar; weder Meldung noch Ton order vor und beim Wechsel zu U3', () => {
    const prev = createWorld(3);
    prev.order = orderFixture(prev);
    expect(orderVisible(prev)).toBe(false);
    expect(orderMessageFor(null, false, prev)).toBeNull();
    const cur = structuredClone(prev);
    cur.unlocked = ['U0', 'U2', 'U3'];
    expect(orderVisible(cur)).toBe(true);
    expect(orderMessageFor(prev.order, orderVisible(prev), cur)).toBeNull();
    expect(diffSoundEvents(soundSnapshot(prev), soundSnapshot(cur))).not.toContain('order');
  });
});

describe('M12 E2 UI Bauen und Handeln: Liefern je Insel', () => {
  it('deliverLabel: Heimat wie bisher, Fremdinsel mit Namen', () => {
    const w = createWorld(3);
    expect(deliverLabel(w, 0)).toBe('Liefern');
    expect(deliverLabel(w, 2)).toBe('Liefern · Felsbucht');
  });
});

describe('I-047 Stammkunde: Kartentexte (AK-SK-28)', () => {
  const base = () => {
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = 750; // nächster Periodenbeginn 1500: Rest 750 = 1:15
    return w;
  };
  const withOffer = (island: number) => {
    const w = base();
    w.contractOffer = { good: 'rum', island };
    return w;
  };
  const withContract = (island: number) => {
    const w = base();
    w.contract = { good: 'rum', amount: 5, price: 27, island, deliveries: 0 };
    return w;
  };

  it('Angebot Heimat', () => {
    const w = withOffer(HOME);
    expect(orderCardText(w)).toBe(
      `Stammkunde: 5 Rum alle 1:30 zu 27 je Stück · Markt jetzt ≈ ${sellPrice(w, 'rum', 1)}` +
        ' · keine Erzeugung · Angebot noch 1:15',
    );
  });

  it('Angebot Fremdinsel nennt die Insel', () => {
    const w = withOffer(1);
    expect(orderCardText(w)).toBe(
      `Stammkunde: 5 Rum auf ${islandName(w, 1)} alle 1:30 zu 27 je Stück` +
        ` · Markt jetzt ≈ ${sellPrice(w, 'rum', 1)} · keine Erzeugung · Angebot noch 1:15`,
    );
  });

  it('Angebot: 45 s Rest', () => {
    const w = withOffer(HOME);
    w.tick = 1050;
    expect(orderCardText(w)).toMatch(/Angebot noch 45 s$/);
  });

  it('Vertrag Heimat zeigt Lager der Lieferinsel', () => {
    const w = withContract(HOME);
    home(w).stock.rum = 12;
    expect(orderCardText(w)).toBe(
      `Stammkunde: 5 Rum · nächste Lieferung 1:15 · Lager 12/5 · Treue 0/${CONTRACT_LOYAL_AFTER}`,
    );
  });

  it('Vertrag Fremdinsel: Lager der Lieferinsel, nicht der aktiven', () => {
    const w = withContract(1);
    home(w).stock.rum = 0;
    w.islands[1]!.stock.rum = 3;
    const t = orderCardText(w, HOME);
    expect(t).toContain(`auf ${islandName(w, 1)}`);
    expect(t).toContain('Lager 3/5');
  });

  it('ohne Vertrag und Angebot bleibt der Auftragstext', () => {
    const w = base();
    const g = previewOrder(w)!.good;
    expect(orderCardText(w)).toBe(
      `Nächster Auftrag in ${formatGameTime(nextOrderTick(w) - w.tick)} · voraussichtlich ${GOODS[g].name}`,
    );
  });

  it('contractWarn', () => {
    const w = withContract(HOME);
    home(w).stock.rum = 4;
    expect(contractWarn(w)).toBe(true);
    home(w).stock.rum = 5;
    expect(contractWarn(w)).toBe(false);
    w.islands[HOME]!.kontorId = null;
    expect(contractWarn(w)).toBe(true);
    expect(contractWarn(base())).toBe(false);
  });
});

/** Angebundener Betrieb ohne Kacheln auf `island`. */
function addProducer(w: World, defId: BuildingDefId, island: number): void {
  const id = w.nextBuildingId++;
  w.buildings[id] = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok', island };
}

describe('I-088 Angebotskarte: Marktpreis und Erzeugung (AK-HC-01 bis 04)', () => {
  const offerWorld = (good: GoodId, island = HOME): World => {
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = 750;
    w.contractOffer = { good, island };
    return w;
  };
  const marketN = (t: string): number => Number(/Markt jetzt ≈ (\d+)/.exec(t)![1]);

  it('AK-HC-01 nennt je Gut den Marktpreis aus sellPrice', () => {
    for (const good of ['wood', 'rum', 'food'] as const) {
      const w = offerWorld(good);
      const t = orderCardText(w);
      expect(t).toContain(`Markt jetzt ≈ ${sellPrice(w, good, 1)} · `);
      expect(marketN(t)).toBe(sellPrice(w, good, 1));
    }
    expect(marketN(orderCardText(offerWorld('wood')))).not.toBe(
      marketN(orderCardText(offerWorld('rum'))),
    );
  });

  it('AK-HC-02 Boom und gesenktes sellPct ändern N gegenüber der Grundwelt', () => {
    const base = marketN(orderCardText(offerWorld('wood')));
    const boom = offerWorld('wood');
    boom.crisis = { period: 1, kind: 'boom', from: 0, until: 9999, good: 'wood' };
    expect(marketN(orderCardText(boom))).toBe(sellPrice(boom, 'wood', 1));
    expect(marketN(orderCardText(boom))).toBeGreaterThan(base);
    const sat = offerWorld('wood');
    sat.sellPct.wood = 40;
    expect(marketN(orderCardText(sat))).toBe(sellPrice(sat, 'wood', 1));
    expect(marketN(orderCardText(sat))).toBeLessThan(base);
  });

  it('AK-HC-01 Fremdinsel: Marktpreis der Vertragsinsel inkl. Vorliebe (REL-21: Glas auf Weidenau → 26)', () => {
    const w = seaWorld();
    w.order = null;
    w.tick = 750;
    w.contractOffer = { good: 'glass', island: 3 }; // Weidenau (C) bevorzugt Glas
    expect(sellPrice(w, 'glass', 1, 3)).toBe(26);
    expect(sellPrice(w, 'glass', 1)).toBeLessThan(26);
    expect(marketN(orderCardText(w))).toBe(26);
    w.contractOffer = { good: 'glass', island: HOME };
    expect(marketN(orderCardText(w))).toBe(sellPrice(w, 'glass', 1));
  });

  it('AK-HC-03 Erzeugung der Lieferinsel: keine / x pro Minute', () => {
    const w = offerWorld('wood');
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
    addProducer(w, 'lumberjack', HOME);
    w.tick += 1; // Erzeugung wird je Tick zwischengespeichert
    const pm = perMinute(goodsBalance(w, HOME).wood.produced, GOODS_BALANCE_TICKS);
    expect(pm).toBeGreaterThan(0);
    expect(orderCardText(w)).toContain(` · Erzeugung ${pm} / min · Angebot noch 1:15`);
  });

  it('R622 Stilllegen ohne Tick ändert die Erzeugung (pausiertes Spiel)', () => {
    const w = offerWorld('wood');
    addProducer(w, 'lumberjack', HOME);
    const b = w.buildings[w.nextBuildingId - 1]!;
    w.tick += 1;
    const running = orderCardText(w);
    expect(running).toContain('Erzeugung ');
    b.paused = true;
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
    delete b.paused;
    expect(orderCardText(w)).toBe(running);
  });

  it('R622 Bau und Abriss ohne Tick ändern die Erzeugung', () => {
    const w = offerWorld('wood');
    w.tick += 1;
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
    addProducer(w, 'lumberjack', HOME);
    const id = w.nextBuildingId - 1;
    expect(orderCardText(w)).toContain('Erzeugung ');
    expect(orderCardText(w)).not.toContain('keine Erzeugung');
    delete w.buildings[id];
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
  });

  it('R622 Tausch bei gleicher Zahl stillgelegter Betriebe ändert die Erzeugung', () => {
    const w = offerWorld('wood');
    addProducer(w, 'lumberjack', HOME);
    const a = w.buildings[w.nextBuildingId - 1]!;
    addProducer(w, 'lumberjack', 1);
    const b = w.buildings[w.nextBuildingId - 1]!;
    b.paused = true; // Betrieb auf der Lieferinsel läuft
    w.tick += 1;
    expect(orderCardText(w)).toContain('Erzeugung ');
    expect(orderCardText(w)).not.toContain('keine Erzeugung');
    delete b.paused;
    a.paused = true; // Tausch: weiter genau ein Betrieb stillgelegt
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
  });

  it('AK-HC-03 Erzeuger auf anderer Insel, stillgelegt oder unangebunden zählt nicht', () => {
    const w = offerWorld('wood');
    addProducer(w, 'lumberjack', 1);
    addProducer(w, 'lumberjack', HOME);
    w.buildings[w.nextBuildingId - 1]!.paused = true;
    addProducer(w, 'lumberjack', HOME);
    w.buildings[w.nextBuildingId - 1]!.connected = false;
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
  });

  it('AK-HC-03/04 Fremdinsel: Erzeugung der Lieferinsel, Inselzusatz bleibt', () => {
    const w = offerWorld('wood', 1);
    addProducer(w, 'lumberjack', HOME);
    expect(orderCardText(w)).toContain(' · keine Erzeugung · ');
    addProducer(w, 'lumberjack', 1);
    w.tick += 1;
    const pm = perMinute(goodsBalance(w, 1).wood.produced, GOODS_BALANCE_TICKS);
    const t = orderCardText(w);
    expect(t).toContain(`auf ${islandName(w, 1)} alle 1:30`);
    expect(t).toContain(`Erzeugung ${pm} / min`);
  });

  it('R607-2 Marktpreis 0 zeigt «Markt jetzt ≈ 0»', () => {
    const w = offerWorld('wood');
    w.sellPct.wood = 0;
    expect(sellPrice(w, 'wood', 1)).toBe(0);
    expect(orderCardText(w)).toContain('Markt jetzt ≈ 0 · ');
  });

  it('AK-HC-05 orderCardText verändert die Welt nicht', () => {
    const w = offerWorld('wood');
    addProducer(w, 'lumberjack', HOME);
    const before = structuredClone(w);
    orderCardText(w);
    expect(w).toEqual(before);
  });
});

describe('UI-AUFRAEUM-4 T01 Erzeugungs-Cache (AK-1 bis AK-4)', () => {
  const offerWorld = (): World => {
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = 750;
    w.contractOffer = { good: 'wood', island: HOME };
    return w;
  };
  const last = (w: World) => w.buildings[w.nextBuildingId - 1]!;
  const running = (t: string): boolean =>
    t.includes('Erzeugung ') && !t.includes('keine Erzeugung');

  it('AK-1 Id-Kollision {1,4} gegen {2,3} gleicher Tick, gleiche Anzahl', () => {
    const w = offerWorld();
    addProducer(w, 'lumberjack', HOME); // a: zählt
    const a = last(w);
    addProducer(w, 'lumberjack', 1); // b: andere Insel
    const b = last(w);
    addProducer(w, 'lumberjack', 1); // c: andere Insel
    const c = last(w);
    addProducer(w, 'lumberjack', HOME); // d: zählt
    const d = last(w);
    expect(a.id + d.id).toBe(b.id + c.id);
    a.paused = true;
    d.paused = true;
    expect(running(orderCardText(w))).toBe(false);
    delete a.paused;
    delete d.paused;
    b.paused = true;
    c.paused = true;
    expect(running(orderCardText(w))).toBe(true);
  });

  it('AK-2 connected=false im selben Tick', () => {
    const w = offerWorld();
    addProducer(w, 'lumberjack', HOME);
    expect(running(orderCardText(w))).toBe(true);
    last(w).connected = false;
    expect(running(orderCardText(w))).toBe(false);
    last(w).connected = true;
    expect(running(orderCardText(w))).toBe(true);
  });

  it('AK-3 Abriss plus Neubau mit gleicher Gebäudezahl', () => {
    const w = offerWorld();
    addProducer(w, 'lumberjack', HOME);
    const id = w.nextBuildingId - 1;
    expect(running(orderCardText(w))).toBe(true);
    delete w.buildings[id];
    addProducer(w, 'lumberjack', 1);
    expect(running(orderCardText(w))).toBe(false);
  });

  it('AK-3 Ausbau in der Pause (b.level ändert den Zyklus, Zahl, Ids und Listen bleiben)', () => {
    const w = offerWorld();
    addProducer(w, 'lumberjack', HOME);
    const producer = last(w);
    producer.level = 2;
    meetLevel(w, producer); // Fachkräfte und Wald schon vor der Messung, damit der Ausbau in der Pause Stufe 2 erreicht
    delete producer.level;
    w.tick += 1;
    const perMin = (): number =>
      perMinute(goodsBalance(w, HOME).wood.produced, GOODS_BALANCE_TICKS);
    const base = perMin();
    expect(orderCardText(w)).toContain(`Erzeugung ${base} / min`);
    producer.level = 2;
    expect(perMin()).toBeGreaterThan(base);
    expect(orderCardText(w)).toContain(`Erzeugung ${perMin()} / min`);
  });

  it('AK-4 Cache liefert frischen Wert, ändert die Welt nicht, rechnet nicht doppelt', () => {
    const w = offerWorld();
    addProducer(w, 'lumberjack', HOME);
    w.tick += 1;
    const before = JSON.stringify(w);
    const pm = perMinute(goodsBalance(w, HOME).wood.produced, GOODS_BALANCE_TICKS);
    const spy = vi.spyOn(production, 'goodProductionPer100');
    try {
      const t1 = orderCardText(w);
      expect(t1).toContain(`Erzeugung ${pm} / min`);
      const calls = spy.mock.calls.length;
      expect(orderCardText(w)).toBe(t1);
      expect(spy.mock.calls.length).toBe(calls);
    } finally {
      spy.mockRestore();
    }
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('I-047 Stammkunde: Meldungen (AK-SK-28)', () => {
  const w = createWorld(3, { unlockAll: true });
  const broken = (
    reason: 'lock' | 'island' | 'kontor' | 'stock',
    island = HOME,
  ): ContractEvent => ({
    kind: 'broken',
    good: 'rum',
    reason,
    penalty: 135,
    island,
  });
  const delivered: ContractEvent = {
    kind: 'delivered',
    good: 'rum',
    amount: 5,
    pay: 135,
    island: HOME,
    loyal: false,
    becameLoyal: false,
  };

  it('geliefert', () => {
    expect(contractNotice(delivered, w)).toEqual({
      text: 'Stammkunde: 5 Rum geliefert, +135',
      kind: 'info',
      sound: 'orderDone',
    });
  });

  it('Bruch je Grund', () => {
    expect(contractNotice(broken('stock'), w)).toEqual({
      text: 'Stammkunde abgesprungen: zu wenig Rum. Strafe 135',
      kind: 'warn',
      sound: 'error',
    });
    expect(contractNotice(broken('kontor', 1), w)).toEqual({
      text: `Stammkunde abgesprungen: kein Kontor auf ${islandName(w, 1)}. Strafe 135`,
      kind: 'warn',
      sound: 'error',
    });
    for (const r of ['lock', 'island'] as const) {
      expect(contractNotice(broken(r), w)).toEqual({
        text: 'Stammkunde abgesprungen. Strafe 135',
        kind: 'warn',
        sound: 'error',
      });
    }
  });

  it('vereinbart und gekündigt', () => {
    const c = createWorld(3, { unlockAll: true });
    c.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    expect(contractAgreedMessage(c)).toBe('Stammkunde: 5 Rum alle 1:30 vereinbart');
    expect(CONTRACT_CANCELLED).toBe('Stammkunde gekündigt');
  });

  it('Klang-Spy: announceContract', () => {
    const out = { show: vi.fn(), play: vi.fn() };
    const rep = (contract: ContractEvent | null): StepReport => ({ lost: [], contract });
    announceContract([rep(null), rep(delivered)], out, w);
    expect(out.show).toHaveBeenCalledTimes(1);
    expect(out.show).toHaveBeenCalledWith('Stammkunde: 5 Rum geliefert, +135', 'info');
    expect(out.play).toHaveBeenCalledTimes(1);
    expect(out.play).toHaveBeenCalledWith('orderDone');

    const out2 = { show: vi.fn(), play: vi.fn() };
    announceContract([rep(broken('stock'))], out2, w);
    expect(out2.play).toHaveBeenCalledWith('error');
    expect(out2.show).toHaveBeenCalledWith(expect.stringContaining('abgesprungen'), 'warn');

    const out3 = { show: vi.fn(), play: vi.fn() };
    announceContract([rep(null)], out3, w);
    expect(out3.show).not.toHaveBeenCalled();
    expect(out3.play).not.toHaveBeenCalled();
  });
});

describe('I-047 Stammkunde: Knöpfe und Warnfarbe (AK-SK-28)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const setup = () => {
    vi.stubGlobal('document', fakeDocument);
    const actions = {
      deliver: vi.fn(),
      accept: vi.fn(),
      decline: vi.fn(),
      cancel: vi.fn(),
      toProducer: vi.fn(),
      acceptFar: vi.fn(),
    };
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = 750;
    const el = new FakeElement('span');
    renderOrder(el as unknown as HTMLElement, w, actions);
    const btn = (f: string) => el.querySelector(`[data-field="${f}"]`)!;
    const shown = () =>
      ['order-deliver', 'order-accept', 'order-decline', 'order-cancel'].filter(
        (f) => !btn(f).hidden,
      );
    const upd = () => updateOrder(el as unknown as HTMLElement, w);
    return { actions, w, el, btn, shown, upd };
  };

  it('Angebot: Annehmen und Ablehnen', () => {
    const { actions, w, btn, shown, upd } = setup();
    w.contractOffer = { good: 'rum', island: HOME };
    upd();
    expect(shown()).toEqual(['order-accept', 'order-decline']);
    expect(btn('order-accept').textContent).toBe('Annehmen');
    expect(btn('order-decline').textContent).toBe('Ablehnen');
    btn('order-accept').fire('click');
    btn('order-decline').fire('click');
    expect(actions.accept).toHaveBeenCalledTimes(1);
    expect(actions.decline).toHaveBeenCalledTimes(1);
  });

  it('Vertrag: nur Kündigen', () => {
    const { actions, w, btn, shown, upd } = setup();
    w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    upd();
    expect(shown()).toEqual(['order-cancel']);
    expect(btn('order-cancel').textContent).toBe('Kündigen');
    btn('order-cancel').fire('click');
    expect(actions.cancel).toHaveBeenCalledTimes(1);
  });

  it('Auftrag: nur Liefern; nichts: kein Knopf', () => {
    const { actions, w, btn, shown, upd } = setup();
    upd();
    expect(shown()).toEqual([]);
    w.order = { period: 1, good: 'wood', amount: 20, reward: 140, due: 1500 };
    upd();
    expect(shown()).toEqual(['order-deliver']);
    btn('order-deliver').fire('click');
    expect(actions.deliver).toHaveBeenCalledTimes(1);
  });

  it('Warnklasse folgt contractWarn', () => {
    const { w, el, upd } = setup();
    w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    home(w).stock.rum = 4;
    upd();
    expect(el.classList.contains('order-card--warn')).toBe(true);
    home(w).stock.rum = 5;
    upd();
    expect(el.classList.contains('order-card--warn')).toBe(false);
  });
});

describe('I-047 Stammkunde: Fehlerpfad (Spec B.4)', () => {
  const out = () => ({ showError: vi.fn(), show: vi.fn() });
  it.each(['Kein Angebot', 'Kein Vertrag', 'Anderer Grund'])(
    'fail zeigt den Grund als Fehler (%s), keine Erfolgsmeldung',
    (reason) => {
      const o = out();
      runContractAction({ ok: false, reason }, () => 'erfolg', o);
      expect(o.showError).toHaveBeenCalledWith(reason);
      expect(o.show).not.toHaveBeenCalled();
    },
  );
  it('ok: Meldung aus onOk, oder still bei null', () => {
    const o = out();
    runContractAction({ ok: true }, () => 'vereinbart', o);
    expect(o.show).toHaveBeenCalledWith('vereinbart');
    const o2 = out();
    runContractAction({ ok: true }, () => null, o2);
    expect(o2.show).not.toHaveBeenCalled();
    expect(o2.showError).not.toHaveBeenCalled();
  });
});

it('AK-HC-03 Erzeugung wird je Tick neu gelesen', () => {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contractOffer = { good: 'wood', island: HOME };
  expect(orderCardText(w)).toContain('keine Erzeugung');
  addProducer(w, 'lumberjack', HOME);
  w.tick += 1;
  expect(orderCardText(w)).toContain('Erzeugung ');
  expect(orderCardText(w)).not.toContain('keine Erzeugung');
});

describe('I-090 Knopf «Zum Erzeuger» (AK-HC-10)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const setup = () => {
    vi.stubGlobal('document', fakeDocument);
    const actions = {
      deliver: vi.fn(),
      accept: vi.fn(),
      decline: vi.fn(),
      cancel: vi.fn(),
      toProducer: vi.fn(),
      acceptFar: vi.fn(),
    };
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = 750;
    const el = new FakeElement('span');
    renderOrder(el as unknown as HTMLElement, w, actions);
    const btn = (f: string) => el.querySelector(`[data-field="${f}"]`)!;
    const upd = () => updateOrder(el as unknown as HTMLElement, w);
    return { actions, w, el, btn, upd };
  };

  it('nur bei Vertrag sichtbar, «Kündigen» bleibt letzter Knopf', () => {
    const { actions, w, el, btn, upd } = setup();
    expect(btn('order-producer').textContent).toBe('Zum Erzeuger');
    expect(btn('order-producer').hidden).toBe(true);
    w.contractOffer = { good: 'rum', island: HOME };
    upd();
    expect(btn('order-producer').hidden).toBe(true);
    w.contractOffer = null;
    w.order = { period: 1, good: 'wood', amount: 20, reward: 140, due: 1500 };
    upd();
    expect(btn('order-producer').hidden).toBe(true);
    w.order = null;
    w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    upd();
    expect(btn('order-producer').hidden).toBe(false);
    expect(btn('order-cancel').hidden).toBe(false);
    btn('order-producer').fire('click');
    expect(actions.toProducer).toHaveBeenCalledTimes(1);
    const fields = el.children
      .map((c) => (c as unknown as FakeElement).dataset?.field)
      .filter((f) => f !== undefined);
    expect(fields.at(-1)).toBe('order-cancel');
    expect(fields.indexOf('order-producer')).toBe(fields.indexOf('order-cancel') - 1);
    w.contract = null;
    upd();
    expect(btn('order-producer').hidden).toBe(true);
  });
});

describe('I-102 Auftragskarte zeigt die Vorschau (AK-6, AK-7b)', () => {
  const unlocked = (tick: number) => {
    const w = createWorld(3, { unlockAll: true });
    w.order = null;
    w.tick = tick;
    return w;
  };

  it('AK-6a ohne Auftrag: Wartezeit und voraussichtliches Gut', () => {
    const w = unlocked(750);
    const g = previewOrder(w)!.good;
    expect(orderCardText(w)).toBe(
      `Nächster Auftrag in ${formatGameTime(nextOrderTick(w) - w.tick)} · voraussichtlich ${GOODS[g].name}`,
    );
  });

  it('AK-6b aktiver Normalauftrag endet mit «danach voraussichtlich Gut»', () => {
    const w = unlocked(1300);
    w.order = { period: 1, good: 'wood', amount: 20, reward: 150, due: 2400 };
    const g = previewOrder(w)!.good;
    expect(orderCardText(w)).toMatch(/ · Lager \d+\/20 · danach voraussichtlich /);
    expect(orderCardText(w).endsWith(` · danach voraussichtlich ${GOODS[g].name}`)).toBe(true);
  });

  it('AK-6c Fernauftrag, Vertrag und Angebot ohne Vorschau', () => {
    const far = unlocked(1300);
    far.order = { period: 1, good: 'wood', amount: 5, reward: 90, due: 2400, island: 1 };
    expect(orderCardText(far)).not.toContain('voraussichtlich');
    const con = unlocked(750);
    con.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    expect(orderCardText(con)).not.toContain('voraussichtlich');
    const off = unlocked(750);
    off.contractOffer = { good: 'rum', island: HOME };
    expect(orderCardText(off)).not.toContain('voraussichtlich');
  });

  it('AK-6d vor ORDER_FIRST_TICK ebenfalls mit Vorschau', () => {
    const w = unlocked(ORDER_FIRST_TICK - 100);
    const g = previewOrder(w)!.good;
    expect(orderCardText(w)).toBe(
      `Nächster Auftrag in ${formatGameTime(nextOrderTick(w) - w.tick)} · voraussichtlich ${GOODS[g].name}`,
    );
  });

  it('AK-7b gleiche Welt, gleicher Text; Welt unverändert', () => {
    const w = unlocked(750);
    const before = JSON.stringify(w);
    expect(orderCardText(w)).toBe(orderCardText(w));
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('UI-BEIPACK-FERN Auftragskarte Fernauftrag (AK-BF3, BF4)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const noop = () => undefined;
  const actions = {
    deliver: noop,
    accept: noop,
    decline: noop,
    cancel: noop,
    toProducer: noop,
    acceptFar: noop,
  };
  const textOf = (e: FakeElement): string =>
    e.children.length > 0 ? e.children.map(textOf).join('') : e.textContent;

  function setup() {
    vi.stubGlobal('document', fakeDocument);
    const w = farWorld(3, ['B']);
    stepAt(w, periodStart(1));
    acceptFarOrder(w);
    const el = new FakeElement('span');
    renderOrder(el as unknown as HTMLElement, w, actions);
    const text = el.querySelector('[data-field="order-text"]')!;
    return { w, el, text };
  }

  it('BF3 Lager-Span rot mit title, nach Auffüllen ohne beides; Text = farOrderText', () => {
    const { w, el, text } = setup();
    const stock = () => el.querySelector('[data-field="order-stock"]')!;
    expect(stock().classList.contains('far-stock--low')).toBe(true);
    expect(stock().title).toBe('Fehlt 15 Rum');
    w.islands[w.order!.island!]!.stock.rum = 7;
    updateOrder(el as unknown as HTMLElement, w);
    expect(stock().title).toBe('Fehlt 8 Rum');
    expect(textOf(text)).toBe(farOrderText(w, w.order!));
    w.islands[w.order!.island!]!.stock.rum = 15;
    updateOrder(el as unknown as HTMLElement, w);
    expect(stock().classList.contains('far-stock--low')).toBe(false);
    expect(stock().title).toBe('');
    expect(textOf(text)).toBe(farOrderText(w, w.order!));
  });

  it('BF3 «zu spät» als Anhang hinter dem Lager', () => {
    const { w, el, text } = setup();
    const o = w.order!;
    w.islands[o.island!]!.stock[o.good] = 0;
    w.ships = [];
    o.due = w.tick + homeTravelTicks(w, o.island!)! - 1;
    updateOrder(el as unknown as HTMLElement, w);
    expect(textOf(text).endsWith(' · zu spät')).toBe(true);
    expect(textOf(text)).toBe(farOrderText(w, o));
  });

  it('BF3 Heimatauftrag ohne order-stock, Klartext', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = createWorld(3, { unlockAll: true });
    w.tick = 750;
    const el = new FakeElement('span');
    renderOrder(el as unknown as HTMLElement, w, actions);
    expect(el.querySelector('[data-field="order-stock"]')).toBeNull();
    expect(el.querySelector('[data-field="order-text"]')!.textContent).toBe(orderCardText(w));
  });

  it('BF3 Stammkunde ohne order-stock', () => {
    const { w, el, text } = setup();
    w.order = null;
    w.contractOffer = { good: 'rum', island: HOME };
    acceptContract(w);
    updateOrder(el as unknown as HTMLElement, w);
    expect(el.querySelector('[data-field="order-stock"]')).toBeNull();
    expect(text.textContent).toBe(orderCardText(w));
  });

  it('BF4 Wechsel Fern- zu Heimatauftrag lässt keinen Span zurück', () => {
    const { w, el, text } = setup();
    expect(el.querySelector('[data-field="order-stock"]')).not.toBeNull();
    w.order = { ...w.order!, island: undefined } as never;
    updateOrder(el as unknown as HTMLElement, w);
    expect(el.querySelector('[data-field="order-stock"]')).toBeNull();
    expect(text.children.length).toBe(0);
    expect(text.textContent).toBe(orderCardText(w));
  });
});
