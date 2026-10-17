// Handel 2 T07: Texte, Lieferziel und Log-Einträge zum Fernangebot (AK-H2-28, 29, 33).
import { describe, expect, it } from 'vitest';
import { FAR_ORDER_DURATION } from '../../src/sim/defs/timing';
import { acceptFarOrder, deliverOrder, farAlternative, previewOrder } from '../../src/sim/orders';
import { GOODS } from '../../src/sim/defs/goods';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { HOME } from '../../src/sim/world';
import {
  deliverTarget,
  farAcceptTooltip,
  farAcceptedMessage,
  farDeliveredEntry,
  farLogEntries,
  farOfferLead,
  farOfferParts,
  farOfferText,
  farOrderText,
  farOrderWarn,
  farSnap,
} from '../../src/ui/farOrder';
import { orderCardText, orderMessage } from '../../src/ui/order';
import { formatGameTime } from '../../src/ui/time';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from '../sim/farHelpers';

const P = periodStart(1);

function load(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error('load');
  return r.world;
}

function offerWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, P);
  return w;
}

describe('AK-H2-28 Texte', () => {
  it('Fernangebot und Tooltip', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    expect(farOfferText(w)).toBe(
      `Fernangebot Felsbucht: 15 Rum · 450 · Frist ${formatGameTime(FAR_ORDER_DURATION)} · ≈ 39 s Fahrt · Lager 0/15`,
    );
    expect(farOfferText(w)).toBe(
      'Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · ≈ 39 s Fahrt · Lager 0/15',
    );
    w.islands[B]!.stock.rum = 7;
    w.islands[HOME]!.stock.rum = 99;
    expect(farOfferText(w)).toContain('Lager 7/15');
    expect(farAcceptTooltip(w)).toBe(
      'Ersetzt den Auftrag. Liefern nur am Kontor Felsbucht. Der nächste Auftrag entfällt.',
    );
  });

  it('Fernauftrag nach Annehmen', () => {
    const w = offerWorld();
    const far = islandOf(w, 'B');
    w.islands[far]!.stock.rum = 7;
    acceptFarOrder(w);
    const o = w.order!;
    const expected = `Fernauftrag Felsbucht: 15 Rum · 450 · noch ${formatGameTime(1700)} · Lager 7/15`;
    expect(orderCardText(w)).toBe(expected);
    expect(orderCardText(w, islandOf(w, 'A'))).toBe(expected);
    expect(farOrderText(w, o)).toBe(expected);
    expect(farOrderWarn(w)).toBe(false);
    expect(farAcceptedMessage(w, o)).toBe('Fernauftrag angenommen: 15 Rum nach Felsbucht');
    expect(farDeliveredEntry(o, 42)).toEqual({
      text: 'Fernauftrag geliefert: 15 Rum, +450',
      toast: 'info',
      tick: 42,
    });
    dropKontor(w, far);
    expect(farOrderWarn(w)).toBe(true);
  });

  it('ohne Angebot', () => {
    const w = farWorld(3, ['B']);
    stepAt(w, P);
    w.farOffer = null;
    const ref = farWorld(3, []);
    stepAt(ref, P);
    expect(farOfferText(w)).toBeNull();
    expect(farAcceptTooltip(w)).toBe('');
    expect(orderCardText(w)).toBe(orderCardText(ref));
  });

  it('Review Focus 3: Angebot ohne Kontor', () => {
    const w = offerWorld();
    dropKontor(w, islandOf(w, 'B'));
    expect(farOfferText(w)).toBe(
      'Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · ≈ 39 s Fahrt · Lager 0/15',
    );
    expect(farAcceptTooltip(w)).toContain('Liefern nur am Kontor Felsbucht');
  });
});

describe('AK-H2-29 Lieferziel', () => {
  it('Fernauftrag B, sonst aktive Insel', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    expect(deliverTarget(w, HOME)).toBe(HOME);
    expect(deliverTarget(w, B)).toBe(B);
    acceptFarOrder(w);
    expect(deliverTarget(w, HOME)).toBe(B);
    expect(deliverTarget(w, B)).toBe(B);
    w.order = null;
    expect(deliverTarget(w, HOME)).toBe(HOME);
  });

  it('früh geliefert: Wartezeit bis zur übernächsten Periode', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    w.islands[B]!.stock.rum = 15;
    acceptFarOrder(w);
    expect(deliverOrder(w, B)).toEqual({ ok: true });
    w.contractOffer = null; // das Stammkunde-Angebot nach der Lieferung ginge vor
    expect(orderCardText(w)).toBe(
      `Nächster Auftrag in ${formatGameTime(periodStart(3) - w.tick)} · voraussichtlich ${GOODS[previewOrder(w)!.good].name}`,
    );
  });
});

describe('AK-H2-33 Log', () => {
  it('(a) Fernauftrag verfällt', () => {
    const w = offerWorld();
    acceptFarOrder(w);
    const due = w.order!.due;
    w.tick = due - 1;
    const prev = farSnap(w);
    stepAt(w, due + 1);
    const e = farLogEntries(prev, w);
    expect(e).toEqual([
      { text: 'Fernauftrag verfallen: 15 Rum nach Felsbucht', toast: 'info', tick: due + 1 },
    ]);
  });

  it('(b) Lieferung erzeugt nur den Liefer-Eintrag', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    w.islands[B]!.stock.rum = 15;
    acceptFarOrder(w);
    const o = { ...w.order! };
    expect(deliverOrder(w, B)).toEqual({ ok: true });
    expect(farLogEntries(farSnap(w), w)).toEqual([]);
    expect(farDeliveredEntry(o, w.tick)).toEqual({
      text: 'Fernauftrag geliefert: 15 Rum, +450',
      toast: 'info',
      tick: w.tick,
    });
  });

  it('(c) Angebot verfällt; Annehmen und Zufallslieferung nicht', () => {
    const w = offerWorld();
    const prev = farSnap(w);
    stepAt(w, P + 601);
    expect(farLogEntries(prev, w)).toEqual([
      { text: 'Fernangebot verfallen: 15 Rum nach Felsbucht', toast: null, tick: P + 601 },
    ]);
    const w2 = offerWorld();
    w2.islands[0]!.stock.rum = 99;
    const p2 = farSnap(w2);
    acceptFarOrder(w2);
    expect(farLogEntries(p2, w2)).toEqual([]);
    const w3 = offerWorld();
    w3.islands[0]!.stock[w3.order!.good] = 999;
    const p3 = farSnap(w3);
    expect(deliverOrder(w3, HOME)).toEqual({ ok: true });
    expect(farLogEntries(p3, w3)).toEqual([]);
  });

  it('(d) Zufallsauftrag verfällt ohne Angebot', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    const prev = farSnap(w);
    stepAt(w, P + 601);
    expect(farLogEntries(prev, w)).toEqual([]);
    expect(orderMessage(prev.order, w.order)).toMatch(/^Auftrag verfallen: /);
  });

  it('(e) Helfer verändern die Welt nicht', () => {
    const a = offerWorld();
    const b = load(a);
    const prev = farSnap(a);
    farOfferText(a);
    farLogEntries(prev, a);
    const ra = stepAt(a, P + 601);
    const rb = stepAt(b, P + 601);
    expect(ra).toEqual(rb);
    expect(serialize(a)).toBe(serialize(b));
  });

  it('Review Focus 1: genau ein Eintrag über mehrere Schritte', () => {
    const w = offerWorld();
    acceptFarOrder(w);
    const due = w.order!.due;
    w.tick = due - 5;
    const prev = farSnap(w);
    for (let i = 0; i < 20; i++) step(w);
    expect(farLogEntries(prev, w)).toHaveLength(1);
    expect(orderMessage(prev.order, null)).toBeNull();
  });

  it('Review Focus 2: geladene Welt erzeugt nichts', () => {
    const w = offerWorld();
    // Snapshot aus der Welt vor dem Speichern, geprüft gegen die geladene Welt.
    expect(farLogEntries(farSnap(w), load(w))).toEqual([]);
    acceptFarOrder(w);
    const prev = farSnap(w);
    const loaded = load(w);
    expect(farLogEntries(prev, loaded)).toEqual([]);
    // Kontrolle: die Prüfung misst etwas, wenn der Auftrag in der geladenen Welt fehlt und die Frist um ist.
    loaded.order = null;
    loaded.tick = w.order!.due + 1;
    expect(farLogEntries(prev, loaded)).not.toEqual([]);
  });
});

describe('Log-Zähler bei Fernlieferung (T-16, Anhang 02 T.2)', () => {
  it('farDeliveredEntry zählt als «neu» (nextUnread), zugeklappt +1, aufgeklappt unverändert', async () => {
    const { nextUnread } = await import('../../src/ui/crisisLog');
    const e = farDeliveredEntry(
      { period: 0, good: 'rum', amount: 15, reward: 450, due: 1700, island: 1 },
      100,
    );
    expect(nextUnread(0, [e], false)).toBe(1);
    expect(nextUnread(3, [e], true)).toBe(3);
  });
});

// I-136 T02: Fernkarte mit Fahrzeit und Lager-Teil (AK-F3, AK-F4, AK-F5).
describe('I-136 Fernangebot-Teile', () => {
  // Handrechnung (Seed 3, Felsbucht = Insel B, Rechteck x -74..-38, y 40..76; Heimat x 0..64, y 0..64):
  //   Prämie: Rum buy 40 (defs/goods.ts) x ORDER_PREMIUM 0,75 = 30 je Stück, floor; x 15 = 450.
  //   Seeweg d: Anker Heimat (31,5; 32,5) zu B (-49,5; 46,5), dx 81, dy 14; nur der Teil ausserhalb
  //   der Rechtecke zählt: Heimat-Rand x = 0 bis B-Rand x = -38, dx 38, dy 6,6 -> 38,6 -> ceil d = 39.
  //   Fahrzeit = SHIP_TICKS_PER_SEA_TILE 10 x 39 = 390 Ticks = 39 s; Frist FAR_ORDER_DURATION 1700 = 2:50.
  const GOLDEN = 'Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · ≈ 39 s Fahrt · Lager 0/15';

  it('AK-F4 Golden-String und Teile', () => {
    const w = offerWorld();
    expect(farOfferText(w)).toBe(GOLDEN);
    const p = farOfferParts(w)!;
    expect(p.head).toBe('Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50');
    expect(p.travel).toBe('≈ 39 s Fahrt');
    expect(p.stock).toBe('Lager 0/15');
    expect(farOfferLead(p) + p.stock).toBe(GOLDEN);
  });

  it('AK-F4 ohne Lane: Vorgänger-Form ohne Fahrt', () => {
    const w = offerWorld();
    const p = farOfferParts(w, 0, () => [])!;
    expect(p.travel).toBeNull();
    expect(farOfferText(w, 0, () => [])).toBe(
      'Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · Lager 0/15',
    );
  });

  it('AK-F3 Reihenfolge Frist, Fahrt, Lager; Zweitkarte mit eigener Fahrzeit', () => {
    const w = farWorld(4, ['A', 'B']);
    stepAt(w, P);
    const t0 = farOfferText(w, 0)!;
    const t1 = farOfferText(w, 1)!;
    for (const t of [t0, t1]) {
      expect(t.split('Fahrt')).toHaveLength(2);
      expect(t.indexOf('Frist')).toBeLessThan(t.indexOf('Fahrt'));
      expect(t.indexOf('Fahrt')).toBeLessThan(t.indexOf('Lager'));
    }
    // d: A = 26, B = 39 (Seed 3), also 26 s und 39 s
    const fahrt = (n: number) => (n === islandOf(w, 'A') ? '≈ 26 s Fahrt' : '≈ 39 s Fahrt');
    expect(t0).toContain(fahrt(w.farOffer!.island));
    expect(t1).toContain(fahrt(farAlternative(w)!.island));
    expect(t0).not.toBe(t1);
    expect(t0.match(/≈ \d+ s Fahrt/)![0]).not.toBe(t1.match(/≈ \d+ s Fahrt/)![0]);
  });

  it('AK-F5 short nach Fern-Lager', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    w.islands[HOME]!.stock.rum = 99;
    w.islands[B]!.stock.rum = 3;
    expect(farOfferParts(w)!.short).toBe(true);
    w.islands[B]!.stock.rum = 12;
    expect(farOfferParts(w)!.short).toBe(true);
    w.islands[B]!.stock.rum = 15;
    expect(farOfferParts(w)!.short).toBe(false);
    w.islands[B]!.stock.rum = 20;
    expect(farOfferParts(w)!.short).toBe(false);
  });

  it('tip nennt die Fehlmenge, sonst leer', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    w.islands[B]!.stock.rum = 6;
    expect(farOfferParts(w)!.tip).toBe('Fehlt 9 Rum');
    w.islands[B]!.stock.rum = 15;
    expect(farOfferParts(w)!.tip).toBe('');
  });

  it('Randfälle: ohne Kontor, nur ein Angebot, ohne Schiff', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    dropKontor(w, B);
    const p = farOfferParts(w)!;
    expect(p.stock).toBe('Lager 0/15');
    expect(p.short).toBe(true);
    expect(farOfferParts(w, 1)).toBeNull();
    expect(farOfferParts(w, 0)!.travel).toBe('≈ 39 s Fahrt');
    w.ships = [];
    expect(farOfferParts(w)!.travel).not.toBeNull();
  });

  it('ohne Angebot: null', () => {
    expect(farOfferParts(farWorld(3, ['B']))).toBeNull();
  });
});
