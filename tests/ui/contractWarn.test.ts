import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTRACT_WARN_TICKS, GOODS } from '../../src/sim/defs/goods';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { contractWarning, nextSettleTick } from '../../src/sim/orders';
import type { Contract, World } from '../../src/sim/types';
import { HOME, createWorld } from '../../src/sim/world';
import { formatGameTime } from '../../src/ui/time';
import { FakeElement, fakeDocument } from './fakeDom';
import {
  flashOrderCard,
  renderOrder,
  updateOrder,
  orderCardText,
  shouldWarnNow,
  warnPeriod,
} from '../../src/ui/order';

const contract = (deliveries: number): Contract => ({
  good: 'rum',
  amount: 5,
  price: 27,
  island: HOME,
  deliveries,
});

/** Vertragswelt im Warnfenster: Rum fehlt komplett. */
function warnWorld(deliveries: number): World {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contract = contract(deliveries);
  w.islands[HOME]!.stock.rum = 0;
  w.tick = ORDER_FIRST_TICK + ORDER_PERIOD - 100;
  return w;
}

describe('I-122 Warnzusatz der Vertragskarte (AK-W7)', () => {
  it('Fehlt und Kulanz bei treuem Kunden', () => {
    const t = orderCardText(warnWorld(5));
    expect(t).toContain(`Fehlt: 5 ${GOODS.rum.name}`);
    expect(t).toContain('Kulanz wird verbraucht');
  });

  it('Strafe bei nicht treuem Kunden', () => {
    const w = warnWorld(4);
    const t = orderCardText(w);
    expect(t).toContain(`sonst Strafe ${contractWarning(w)!.penalty}`);
  });

  it('kein Kontor nennt die Insel', () => {
    const w = warnWorld(4);
    w.islands[HOME]!.kontorId = null;
    expect(orderCardText(w)).toContain('kein Kontor');
  });

  it('ausserhalb des Fensters bitgleich zum Bestand', () => {
    const w = warnWorld(4);
    w.tick = ORDER_FIRST_TICK + 10;
    expect(nextSettleTick(w) - w.tick).toBeGreaterThan(CONTRACT_WARN_TICKS);
    const t = orderCardText(w);
    expect(t).not.toContain('Fehlt');
    expect(t).not.toContain('Strafe');
    expect(t).not.toContain('Kulanz');
  });

  it('Beipack: Rest nach Fernauftrag und Vertrag bis zur Abrechnung', () => {
    const w = warnWorld(4);
    w.farSkip = Math.floor((w.tick - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1;
    expect(orderCardText(w)).toContain(
      `nächste Lieferung ${formatGameTime(nextSettleTick(w) - w.tick)}`,
    );
  });
});

describe('I-122 shouldWarnNow (AK-W8)', () => {
  const w = warnWorld(4);
  const warn = contractWarning(w);
  it('erste Meldung je Periode, dann nicht mehr, nächste Periode wieder', () => {
    const p = warnPeriod(w);
    expect(warn).not.toBeNull();
    expect(shouldWarnNow(null, warn, p)).toBe(true);
    expect(shouldWarnNow(p, warn, p)).toBe(false);
    expect(shouldWarnNow(p, warn, p + 1)).toBe(true);
  });
  it('ohne Warnung nie', () => {
    expect(shouldWarnNow(null, null, 3)).toBe(false);
  });
});

describe('I-122 flashOrderCard', () => {
  afterEach(() => vi.useRealTimers());
  const fake = (): HTMLElement => {
    const set = new Set<string>();
    return {
      classList: {
        add: (c: string) => set.add(c),
        remove: (c: string) => set.delete(c),
        contains: (c: string) => set.has(c),
      },
    } as unknown as HTMLElement;
  };
  it('Klasse da, nach 2500 ms weg', () => {
    vi.useFakeTimers();
    const el = fake();
    flashOrderCard(el);
    expect(el.classList.contains('order-card--soon')).toBe(true);
    vi.advanceTimersByTime(2499);
    expect(el.classList.contains('order-card--soon')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(el.classList.contains('order-card--soon')).toBe(false);
  });
  it('Abbruch entfernt den Timer', () => {
    vi.useFakeTimers();
    const el = fake();
    const cancel = flashOrderCard(el);
    cancel();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('I-122 updateOrder entfernt Flash bei Ende der Warnung (Regel 6)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('order-card--soon sofort weg, wenn contractWarning null ist', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = warnWorld(0);
    const el = new FakeElement('span');
    const actions = {
      deliver: vi.fn(),
      accept: vi.fn(),
      decline: vi.fn(),
      cancel: vi.fn(),
      toProducer: vi.fn(),
      acceptFar: vi.fn(),
    };
    renderOrder(el as unknown as HTMLElement, w, actions);
    el.classList.toggle('order-card--soon', true);
    updateOrder(el as unknown as HTMLElement, w);
    expect(el.classList.contains('order-card--soon')).toBe(true);
    w.islands[HOME]!.stock.rum = 99;
    updateOrder(el as unknown as HTMLElement, w);
    expect(el.classList.contains('order-card--soon')).toBe(false);
  });
});
