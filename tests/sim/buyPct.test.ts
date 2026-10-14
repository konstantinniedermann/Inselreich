import { beforeEach, describe, expect, it } from 'vitest';
import { BUY_CAP, BUY_RISE, GOODS, GOOD_IDS, ORDER_PREMIUM } from '../../src/sim/defs/goods';
import { BUY_RECOVERY_INTERVAL, SELL_RECOVERY_INTERVAL } from '../../src/sim/defs/timing';
import { SAVE_VERSION, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import {
  buy,
  buyMonumentUnit,
  buyPrice,
  buyQuote,
  sell,
  sellPrice,
  tickMarket,
} from '../../src/sim/trade';
import type { GoodId, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { foldBackToV11, foldBackToV12, placeTownhall } from './helpers';
import { runningMonument } from './monumentHelpers';

/** Testwelt Spec §9: freigeschaltet, Kontor auf der Heimat, 10 000 Geld, Tick 1000. */
function zkWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  w.money = 10_000;
  w.tick = 1000;
  return w;
}

function withTrade(w: World): World {
  placeTownhall(w);
  w.edict = 'trade';
  return w;
}

const tickAt = (w: World, tick: number): void => {
  w.tick = tick;
  tickMarket(w);
};

let w: World;
beforeEach(() => {
  w = zkWorld();
});

describe('AK-ZK-01 Zustand', () => {
  it('buyPct: Schlüssel GOOD_IDS, alle 100, version = SAVE_VERSION, letzter Schlüssel', () => {
    const fresh = createWorld(3);
    expect(Object.keys(fresh.buyPct)).toEqual([...GOOD_IDS]);
    expect(Object.values(fresh.buyPct).every((v) => v === 100)).toBe(true);
    expect(fresh.version).toBe(SAVE_VERSION);
    const keys = Object.keys(JSON.parse(serialize(fresh)) as object);
    expect(keys.slice(keys.indexOf('buyPct'), keys.indexOf('buyPct') + 3)).toEqual([
      'buyPct',
      'contract',
      'contractOffer',
    ]);
  });
});

describe('AK-ZK-07 Kauf-Erholung', () => {
  it('ein Punkt je Intervall, Boden 100, Tick 0 ohne Erholung', () => {
    w.buyPct.tools = 120;
    w.buyPct.wood = 101;
    for (let t = 1001; t <= 1190; t++) tickAt(w, t);
    expect([w.buyPct.tools, w.buyPct.wood]).toEqual([101, 100]);
    for (let t = 1191; t <= 1200; t++) tickAt(w, t);
    expect([w.buyPct.tools, w.buyPct.wood]).toEqual([100, 100]);
    for (let t = 1201; t <= 1300; t++) tickAt(w, t);
    expect([w.buyPct.tools, w.buyPct.wood]).toEqual([100, 100]);
    const zero = zkWorld();
    zero.buyPct.tools = 120;
    tickAt(zero, 0);
    expect(zero.buyPct.tools).toBe(120);
  });

  it('Zusatz: Verkauf und Kauf erholen sich je nach eigenem Intervall', () => {
    for (let t = 1; t <= 200; t++) {
      const x = zkWorld();
      x.sellPct.wood = 50;
      x.buyPct.wood = 150;
      tickAt(x, t);
      expect(x.sellPct.wood === 51, `sell ${t}`).toBe(t % SELL_RECOVERY_INTERVAL === 0);
      expect(x.buyPct.wood === 149, `buy ${t}`).toBe(t % BUY_RECOVERY_INTERVAL === 0);
    }
  });
});

describe('AK-ZK-08 buyQuote und buyPrice', () => {
  it('rise 0: heutiger Preis, Mittel und Ende 100', () => {
    for (const g of GOOD_IDS)
      for (let n = 1; n <= 100; n++)
        for (const edict of [100, 80]) {
          const base = n * GOODS[g].buy;
          const price = edict === 100 ? base : Math.floor((base * 80 + 99) / 100);
          expect(buyQuote(GOODS[g].buy, 100, n, 0, BUY_CAP, edict)).toEqual({
            price,
            meanPct: 100,
            endPct: 100,
          });
        }
  });

  it('rise 2: Werkzeug 10 und Deckel', () => {
    expect(buyQuote(40, 100, 10, 2, 160, 100)).toEqual({ price: 436, meanPct: 109, endPct: 120 });
    expect(buyQuote(40, 150, 10, 2, 160, 100).endPct).toBe(160);
  });

  it('buyPrice = buyQuote mit den Welt-Werten, Anteil 133, mit und ohne Edikt', () => {
    for (const edict of [false, true]) {
      const x = zkWorld();
      if (edict) withTrade(x);
      x.buyPct.tools = 133;
      for (const n of [1, 10])
        expect(buyPrice(x, 'tools', n)).toBe(
          buyQuote(GOODS.tools.buy, 133, n, BUY_RISE, BUY_CAP, edict ? 80 : 100).price,
        );
    }
  });
});

describe('AK-ZK-09 Auftragspraemie', () => {
  it('Praemie je Einheit unabhaengig vom Kaufanteil', () => {
    expect(Math.floor(GOODS.wood.buy * ORDER_PREMIUM)).toBe(7);
    expect(Math.floor(GOODS.rum.buy * ORDER_PREMIUM)).toBe(30);
    expect(Math.floor(GOODS.glass.buy * ORDER_PREMIUM)).toBe(37);
  });
});

describe('AK-ZK-11 buy zahlt buyPrice', () => {
  it('Geldaenderung = vorher gelesener Preis, Anteil 100 und 133, mit und ohne Edikt', () => {
    for (const pct of [100, 133])
      for (const edict of [false, true])
        for (const g of GOOD_IDS)
          for (const n of [1, 10]) {
            const x = zkWorld();
            if (edict) withTrade(x);
            x.buyPct[g] = pct;
            const price = buyPrice(x, g, n);
            const before = x.money;
            expect(buy(x, g, n).ok, `${g} ${n}`).toBe(true);
            expect(before - x.money).toBe(price);
          }
  });
});

describe('AK-ZK-12 buy wirft nie', () => {
  it('ungueltige Mengen: ok false, Welt unveraendert', () => {
    const before = serialize(w);
    for (const n of [0, -1, 1.5, NaN, 101]) {
      expect(buy(w, 'tools', n).ok, String(n)).toBe(false);
      expect(serialize(w)).toBe(before);
    }
  });
});

describe('AK-ZK-29 Denkmal-Zukauf zahlt, hebt nicht', () => {
  const paid = (x: World, g: 'stone'): [number, 0 | 1] => {
    const before = x.money;
    const r = buyMonumentUnit(x, g);
    return [before - x.money, r];
  };

  it('zahlt den gueltigen Anteil, buyPct bleibt', () => {
    for (const [pct, edict, cost] of [
      [120, false, 18],
      [120, true, 15],
      [100, false, 15],
      [100, true, 12],
    ] as const) {
      const { w: m } = runningMonument();
      if (edict) withTrade(m);
      m.buyPct.stone = pct;
      expect(paid(m, 'stone')).toEqual([cost, 1]);
      expect(m.buyPct.stone).toBe(pct);
    }
  });

  it('bei 17 Geld und Anteil 120 kein Zukauf, Welt unveraendert', () => {
    const { w: m } = runningMonument();
    m.buyPct.stone = 120;
    m.money = 17;
    const before = serialize(m);
    expect(buyMonumentUnit(m, 'stone')).toBe(0);
    expect(serialize(m)).toBe(before);
  });

  it('Tick-Grenze: der Zug bei Tick 1000 zahlt vor der Erholung 18, danach 119', () => {
    const { w: m } = runningMonument();
    const twin = runningMonument().w;
    for (const x of [m, twin]) {
      x.tick = 999;
      x.buyPct.stone = 120;
      x.islands[0]!.stock.stone = 12;
    }
    m.monument!.buy.stone = true;
    step(m);
    step(twin);
    expect(twin.money - m.money).toBe(18);
    expect(m.monument!.delivered.stone).toBe(1);
    expect(m.buyPct.stone).toBe(119);
  });

  it('Zwillingslauf 600 Ticks: buyPct beider Welten gleich', () => {
    const a = runningMonument().w;
    const b = runningMonument().w;
    for (const x of [a, b]) {
      x.buyPct.stone = 150;
      x.islands[0]!.stock.stone = 12;
    }
    a.monument!.buy.stone = true;
    for (let i = 0; i < 600; i++) {
      step(a);
      step(b);
      expect(a.buyPct).toEqual(b.buyPct);
    }
    expect(a.monument!.delivered.stone).toBeGreaterThan(0);
  });
});

describe('AK-ZK-31 kein Kauf-Verkauf-Gewinn', () => {
  const boomWorld = (g: GoodId): World => {
    const b = zkWorld();
    b.crisis = { period: 1, kind: 'boom', from: 0, until: 9999, good: g };
    b.sellPct[g] = 100;
    return b;
  };

  it('Kaufpreis > Boom-Verkaufserloes, Anteil 100 und 160', () => {
    for (const g of GOOD_IDS)
      for (const pct of [100, 160])
        for (const n of [1, 10, 100]) {
          const x = withTrade(zkWorld());
          x.buyPct[g] = pct;
          expect(buyPrice(x, g, n), `${g} ${pct} ${n}`).toBeGreaterThan(
            sellPrice(boomWorld(g), g, n),
          );
        }
  });

  it('Rueckfahrt im selben Tick kostet Geld', () => {
    for (const g of GOOD_IDS)
      for (const n of [1, 10, 100]) {
        const x = withTrade(boomWorld(g));
        x.money = 100_000;
        home(x).stock[g] = 0;
        const before = x.money;
        expect(buy(x, g, n).ok).toBe(true);
        expect(sell(x, g, n).ok).toBe(true);
        expect(x.money, `${g} ${n}`).toBeLessThan(before);
      }
  });
});

describe('AK-ZK-33 Rueckfaltung', () => {
  const v12Of = (x: World): Record<string, unknown> =>
    foldBackToV12(JSON.parse(serialize(x)) as Record<string, unknown>);

  /** Stand der Vorversion von Hand: ohne monument, monumentDone, buyPct und islands[*].reserve. */
  const v11ByHand = (v12: Record<string, unknown>): Record<string, unknown> => {
    const hand: Record<string, unknown> = {};
    for (const k of Object.keys(v12))
      if (!['monument', 'monumentDone', 'buyPct'].includes(k)) hand[k] = v12[k];
    hand.islands = (v12.islands as Record<string, unknown>[]).map((isl) => {
      const kept: Record<string, unknown> = {};
      for (const k of Object.keys(isl)) if (k !== 'reserve') kept[k] = isl[k];
      return kept;
    });
    hand.version = 11;
    return hand;
  };

  it('alle 100: buyPct entfaellt, Rest in gleicher Folge', () => {
    const v12 = v12Of(createWorld(3));
    const out = foldBackToV11(v12);
    expect('buyPct' in out).toBe(false);
    expect(JSON.stringify(out)).toBe(JSON.stringify(v11ByHand(v12)));
  });

  it('Anteil 101 wirft', () => {
    const x = createWorld(3);
    x.buyPct.tools = 101;
    expect(() => foldBackToV11(v12Of(x))).toThrow(/Kaufanteil nicht rückfaltbar/);
  });

  it('Prod-B4: reserve ungleich 0 wirft', () => {
    const v12 = v12Of(createWorld(3));
    (v12.islands as { reserve: Record<string, number> }[])[0]!.reserve.wood = 1;
    expect(() => foldBackToV11(v12)).toThrow(/Sperrbestand nicht rückfaltbar/);
  });

  it('Prod-B4: Denkmal gesetzt wirft', () => {
    const v12 = v12Of(createWorld(3));
    v12.monument = {};
    expect(() => foldBackToV11(v12)).toThrow(/Denkmal nicht rückfaltbar/);
    const { w: m } = runningMonument();
    expect(() => foldBackToV11(v12Of(m))).toThrow(/Denkmal nicht rückfaltbar/);
  });

  it('Prod-B4: alles neutral (buyPct, reserve, Denkmal) ergibt die v11-Form', () => {
    const x = createWorld(3);
    for (const isl of x.islands) expect(isl.reserve).toEqual({ wood: 0, stone: 0 });
    const v12 = v12Of(x);
    expect(JSON.stringify(foldBackToV11(v12))).toBe(JSON.stringify(v11ByHand(v12)));
  });
});
