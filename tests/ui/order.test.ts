import { describe, expect, it, vi } from 'vitest';
import type { ContractEvent, Order } from '../../src/sim/types';
import type { StepReport } from '../../src/sim/tick';
import { islandName } from '../../src/sim/islands';
import { orderForPeriod } from '../../src/sim/orders';
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
} from '../../src/ui/order';
import { diffSoundEvents, soundSnapshot } from '../../src/ui/soundEvents';
import { HOME, home, createWorld } from '../../src/sim/world';

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
    w.contract = { good: 'rum', amount: 5, price: 27, island };
    return w;
  };

  it('Angebot Heimat', () => {
    expect(orderCardText(withOffer(HOME))).toBe(
      'Stammkunde: 5 Rum alle 1:30 zu 27 je Stück · Angebot noch 1:15',
    );
  });

  it('Angebot Fremdinsel nennt die Insel', () => {
    const w = withOffer(1);
    expect(orderCardText(w)).toBe(
      `Stammkunde: 5 Rum auf ${islandName(w, 1)} alle 1:30 zu 27 je Stück · Angebot noch 1:15`,
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
    expect(orderCardText(w)).toBe('Stammkunde: 5 Rum · nächste Lieferung 1:15 · Lager 12/5');
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
    expect(orderCardText(base())).toBe('Nächster Auftrag in 1:15');
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
    c.contract = { good: 'rum', amount: 5, price: 27, island: HOME };
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
