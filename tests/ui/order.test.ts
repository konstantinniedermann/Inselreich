import { describe, expect, it } from 'vitest';
import type { Order } from '../../src/sim/types';
import { deliveredMessage, orderCardText, orderChange, orderMessage } from '../../src/ui/order';
import { createWorld } from '../../src/sim/world';

describe('orderCardText (Spec 10.7)', () => {
  it('zeigt den aktiven Auftrag mit Lagerstand', () => {
    const w = createWorld(1);
    w.tick = 1300;
    w.stock.wood = 12;
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
