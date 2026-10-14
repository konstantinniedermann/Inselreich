// Handel 2 T07: Texte, Lieferziel und Log-Einträge zum Fernangebot (AK-H2-28, 29, 33).
import { describe, expect, it } from 'vitest';
import { FAR_ORDER_DURATION } from '../../src/sim/defs/timing';
import { acceptFarOrder, deliverOrder } from '../../src/sim/orders';
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
      `Fernangebot Felsbucht: 15 Rum · 450 · Frist ${formatGameTime(FAR_ORDER_DURATION)} · Lager 0/15`,
    );
    expect(farOfferText(w)).toBe('Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · Lager 0/15');
    w.islands[B]!.stock.rum = 7;
    w.islands[HOME]!.stock.rum = 99;
    expect(farOfferText(w)).toContain('Lager 7/15');
    expect(farAcceptTooltip(w)).toBe(
      'Ersetzt den Auftrag. Liefern nur am Kontor Felsbucht. Der nächste Auftrag entfällt.',
    );
  });

  it('Fernauftrag nach Annehmen', () => {
    const w = offerWorld();
    const A = islandOf(w, 'B');
    w.islands[A]!.stock.rum = 7;
    acceptFarOrder(w);
    const o = w.order!;
    const expected = `Fernauftrag Felsbucht: 15 Rum · 450 · noch ${formatGameTime(1700)} · Lager 7/15`;
    expect(orderCardText(w)).toBe(expected);
    expect(farOrderText(w, o)).toBe(expected);
    expect(farOrderWarn(w)).toBe(false);
    expect(farAcceptedMessage(w, o)).toBe('Fernauftrag angenommen: 15 Rum nach Felsbucht');
    expect(farDeliveredEntry(o, 42)).toEqual({
      text: 'Fernauftrag geliefert: 15 Rum, +450',
      toast: 'info',
      tick: 42,
    });
    dropKontor(w, A);
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
    expect(farOfferText(w)).toBe('Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · Lager 0/15');
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
    expect(orderCardText(w)).toBe(`Nächster Auftrag in ${formatGameTime(periodStart(3) - w.tick)}`);
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
    const x = load(w);
    expect(farLogEntries(farSnap(x), x)).toEqual([]);
    acceptFarOrder(w);
    const y = load(w);
    expect(farLogEntries(farSnap(y), y)).toEqual([]);
  });
});
