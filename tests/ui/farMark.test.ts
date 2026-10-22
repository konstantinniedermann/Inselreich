// UI-HAEPPCHEN-F T02: farMark, Schlüssel und Tooltip der Seekarte (I-101, AK-M1 bis M5, Z2).
import { describe, expect, it } from 'vitest';
import { mapLayout, tileToMap } from '../../src/render/seaMap';
import { acceptFarOrder } from '../../src/sim/orders';
import type { World } from '../../src/sim/types';
import {
  farMark,
  farOfferDue,
  farOfferText,
  farOrderText,
  farOrderWarn,
} from '../../src/ui/farOrder';
import { homeTravelTicks } from '../../src/ui/homeTravel';
import { SEA_MAP_H, SEA_MAP_PAD, SEA_MAP_W, seaMapKey, seaMapTip } from '../../src/ui/seaMapView';
import { formatGameTime } from '../../src/ui/time';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from '../sim/farHelpers';

const P = periodStart(1);
const layoutOf = (w: World) => mapLayout(w, SEA_MAP_W, SEA_MAP_H, SEA_MAP_PAD);

function offerWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, P);
  return w;
}
function orderWorld(): World {
  const w = offerWorld();
  acceptFarOrder(w);
  return w;
}
function tipOf(w: World, rest: number): string {
  const t = homeTravelTicks(w, islandOf(w, 'B'))!;
  return `Fahrzeit ≈ ${formatGameTime(t)}, Rest ${formatGameTime(rest)}`;
}
function landPoint(w: World, i: number) {
  const s = w.islands[i]!;
  const k = s.tiles.findIndex((t) => t.terrain !== 'water');
  return tileToMap(layoutOf(w), s.ox + (k % s.width) + 0.5, s.oy + Math.floor(k / s.width) + 0.5);
}

describe('AK-M1 keine Marke', () => {
  it('ohne Angebot und Auftrag null', () => {
    const w = farWorld(3, ['B']);
    w.farOffer = null;
    w.order = null;
    expect(farMark(w)).toBeNull();
  });
  it('Normalauftrag null', () => {
    const w = farWorld(3, ['B']);
    stepAt(w, periodStart(0));
    expect(w.order?.island).toBeUndefined();
    w.farOffer = null;
    expect(farMark(w)).toBeNull();
  });
});

describe('AK-M2 Marke', () => {
  it('Fernangebot', () => {
    const w = offerWorld();
    const m = farMark(w)!;
    expect(m.kind).toBe('offer');
    expect(m.island).toBe(islandOf(w, 'B'));
    expect(m.text).toBe(`15 Rum · ${formatGameTime(farOfferDue(w)! - w.tick)}`);
    expect(farOfferText(w)).toContain(m.text.split(' · ')[0]!);
    expect(farOfferText(w)).toContain(`Frist ${m.text.split(' · ')[1]}`);
  });
  it('Fernauftrag', () => {
    const w = orderWorld();
    const m = farMark(w)!;
    expect(m.kind).toBe('order');
    expect(m.island).toBe(w.order!.island);
    expect(m.text).toBe(`15 Rum · ${formatGameTime(w.order!.due - w.tick)}`);
    expect(farOrderText(w, w.order!)).toContain(m.text.split(' · ')[0]!);
    expect(farOrderText(w, w.order!)).toContain(`noch ${m.text.split(' · ')[1]}`);
  });
  it('Z2 farOfferDue null ohne Angebot', () => {
    const w = farWorld(3, ['B']);
    w.farOffer = null;
    expect(farOfferDue(w)).toBeNull();
  });
});

describe('AK-M3 warn', () => {
  it('Angebot: nach Kontor-Verlust true', () => {
    const w = offerWorld();
    expect(farMark(w)!.warn).toBe(false);
    dropKontor(w, islandOf(w, 'B'));
    expect(farMark(w)!.warn).toBe(true);
  });
  it('Auftrag gleich farOrderWarn', () => {
    const w = orderWorld();
    expect(farMark(w)!.warn).toBe(farOrderWarn(w));
    dropKontor(w, islandOf(w, 'B'));
    expect(farMark(w)!.warn).toBe(true);
    expect(farOrderWarn(w)).toBe(true);
  });
});

describe('AK-M4 seaMapKey', () => {
  it('Marke erscheint, verschwindet, Sekundenwechsel, Warnflag', () => {
    const w = farWorld(3, ['B']);
    const l = layoutOf(w);
    const none = seaMapKey(w, l);
    stepAt(w, P);
    const k0 = seaMapKey(w, l);
    expect(k0).not.toBe(none);
    w.tick += 20; // eine Sekunde weiter
    const k1 = seaMapKey(w, l);
    expect(k1).not.toBe(k0);
    dropKontor(w, islandOf(w, 'B'));
    expect(seaMapKey(w, l)).not.toBe(k1);
    w.farOffer = null;
    expect(seaMapKey(w, l).endsWith('|m:-')).toBe(true);
  });
  it('gleich innerhalb derselben Sekunde', () => {
    const w = offerWorld();
    const l = layoutOf(w);
    const text = (): string => formatGameTime(farOfferDue(w)! - w.tick);
    // so ausrichten, dass der nächste Tick noch in derselben Sekunde liegt
    while (text() !== formatGameTime(farOfferDue(w)! - (w.tick + 1))) w.tick += 1;
    const k = seaMapKey(w, l);
    const t = text();
    w.tick += 1;
    expect(text()).toBe(t);
    expect(seaMapKey(w, l)).toBe(k);
  });
});

describe('AK-M5 seaMapTip', () => {
  it('Fern-Insel endet mit Fern-Abschnitt, andere unverändert', () => {
    const w = farWorld(3, ['B']);
    const l = layoutOf(w);
    const B = islandOf(w, 'B');
    const p = landPoint(w, B);
    const q = landPoint(w, 0);
    const baseB = seaMapTip(w, l, p.x, p.y)!;
    const baseHome = seaMapTip(w, l, q.x, q.y);
    stepAt(w, P);
    const off = seaMapTip(w, l, p.x, p.y)!;
    expect(off).toBe(
      `${baseB} · Fernangebot: 15 Rum · ${formatGameTime(farOfferDue(w)! - w.tick)} · ${tipOf(w, farOfferDue(w)! - w.tick)}`,
    );
    expect(seaMapTip(w, l, q.x, q.y)).toBe(baseHome);
    acceptFarOrder(w);
    expect(
      seaMapTip(w, l, p.x, p.y)!.endsWith(
        `· Fernauftrag: 15 Rum · ${formatGameTime(w.order!.due - w.tick)} · ${tipOf(w, w.order!.due - w.tick)}`,
      ),
    ).toBe(true);
    w.order = null;
    w.farOffer = null;
    expect(seaMapTip(w, l, p.x, p.y)).toBe(baseB);
  });
});
