import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { beginCrisis, rollCrisis } from '../../src/sim/crises';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { BOOM_PCT } from '../../src/sim/defs/crises';
import { GOODS, GOOD_IDS, ORDER_PREMIUM } from '../../src/sim/defs/goods';
import {
  deliverOrder,
  maxHouseTier,
  orderForPeriod,
  orderPool,
  orderUnitReward,
} from '../../src/sim/orders';
import { goodsBalance } from '../../src/sim/queries';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { sell } from '../../src/sim/trade';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { createWorld, idx, home } from '../../src/sim/world';

/** Seed-3-Welt, Krisen aus, Lager für Glas leer gestartet; Tick 1000 (keine Krisenperiode, kein Auftragsstart). */
function base(): World {
  const w = createWorld(3, { unlockAll: true });
  w.tick = 1000;
  home(w).stock = { ...home(w).stock, stone: 0, wood: 0, glass: 0 };
  return w;
}

/** Gebäude direkt eingefügt (ohne Kacheln; Produktion liest nur `connected`), Ids aufsteigend. */
function direct(w: World, defId: BuildingDefId, x: number, connected = true): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId,
    x,
    y: 5,
    connected,
    progress: 0,
    state: 'ok',
    island: 0,
  };
  w.buildings[b.id] = b;
  return b;
}

const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) step(w);
};
const clone = (w: World): World => JSON.parse(serialize(w)) as World;

describe('M8 Glashütte: Werte', () => {
  it('AK-S2-01 (M11 S2) glassworks laut Spec 5.2; Ein-Input-Betriebe als Liste; sechzehn brennbare Ids', () => {
    const g = BUILDING_DEFS.glassworks;
    expect(g).toMatchObject({
      name: 'Glashütte',
      w: 2,
      h: 2,
      cost: { money: 300, wood: 20, tools: 6, stone: 10 },
      upkeep: 25,
      category: 'production',
      produces: 'glass',
      consumes: ['stone', 'wood'],
      cycle: 50,
      site: [],
      flammable: true,
    });
    expect(g.stormAffected).toBeUndefined();
    expect(BUILDING_DEFS.weaver.consumes).toEqual(['wool']);
    expect(BUILDING_DEFS.distillery.consumes).toEqual(['cane']);
    expect(BUILDING_DEFS.toolmaker.consumes).toEqual(['wood']);
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].flammable === true)).toHaveLength(16); // M12 T02: + spicefarm
  });
});

describe('M8 Zwei-Input-Produktion (Spec 5.3)', () => {
  it('AK-S2-02 Glashütte allein, Stein 3, Holz 2, 200 Schritte: Glas 2, Stein 1, Holz 0, waitingInput', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    home(w).stock.stone = 3;
    home(w).stock.wood = 2;
    run(w, 200);
    expect([home(w).stock.glass, home(w).stock.stone, home(w).stock.wood]).toEqual([2, 1, 0]);
    expect(gw.state).toBe('waitingInput');
    expect(gw.progress).toBe(0);
  });

  it('AK-S2-03 ein Input fehlt: Stein 0, Holz 5, 100 Schritte: Holz 5, Glas 0, waitingInput', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    home(w).stock.wood = 5;
    run(w, 100);
    expect([home(w).stock.wood, home(w).stock.glass]).toEqual([5, 0]);
    expect(gw.state).toBe('waitingInput');
  });

  it('AK-S2-04 Konkurrenz ums Holz: Werkzeugmacher (kleinere Id) gewinnt, Glashütte wartet, Stein bleibt', () => {
    const w = base();
    const tm = direct(w, 'toolmaker', 10);
    direct(w, 'school', 10); // M10: Werkzeugmacher braucht eine Schule in Reichweite
    const gw = direct(w, 'glassworks', 13);
    expect(tm.id).toBeLessThan(gw.id);
    home(w).stock.wood = 1;
    home(w).stock.stone = 1;
    step(w);
    expect(tm.progress).toBe(1);
    expect(gw.state).toBe('waitingInput');
    expect(gw.progress).toBe(0);
    expect([home(w).stock.stone, home(w).stock.wood]).toEqual([1, 0]);
  });

  it('AK-S2-06 Lager voll: Stein und Holz je −1, Glas bleibt 100, storageFull', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    home(w).stock = { ...home(w).stock, glass: 100, stone: 5, wood: 5 };
    run(w, 50);
    expect([home(w).stock.stone, home(w).stock.wood, home(w).stock.glass]).toEqual([4, 4, 100]);
    expect(gw.state).toBe('storageFull');
  });

  it('AK-S2-07 Abriss im Zyklus: Rückerstattung 150 / 10 / 3 / 5, Inputs des Zyklus verloren', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    home(w).stock = { ...home(w).stock, stone: 3, wood: 3, tools: 0 };
    run(w, 25);
    expect(gw.progress).toBe(25);
    expect([home(w).stock.stone, home(w).stock.wood]).toEqual([2, 2]);
    const m0 = w.money;
    expect(demolish(w, gw.id).ok).toBe(true);
    expect(w.money - m0).toBe(150);
    expect([home(w).stock.wood, home(w).stock.tools, home(w).stock.stone]).toEqual([12, 3, 7]);
  });

  it('AK-S2-08 Brand bei progress 20: −300 Geld, Glas 4 statt 8, Entnahmen 4 statt 8, progress 0 statt 20', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    home(w).stock = { ...home(w).stock, stone: 50, wood: 50 };
    gw.progress = 20;
    const twin = clone(w);
    beginCrisis(w, 0, { kind: 'fire', tile: { x: gw.x, y: gw.y } });
    expect(w.crisis).toMatchObject({ outcome: 'burning', target: gw.id });
    run(w, 400);
    run(twin, 400);
    expect(w.tick).toBe(1400);
    expect(w.money - twin.money).toBe(-300);
    expect([
      home(w).stock.glass,
      50 - home(w).stock.stone,
      50 - home(w).stock.wood,
      gw.progress,
    ]).toEqual([4, 4, 4, 0]);
    const tg = twin.buildings[gw.id]!;
    expect([
      home(twin).stock.glass,
      50 - home(twin).stock.stone,
      50 - home(twin).stock.wood,
      tg.progress,
    ]).toEqual([8, 8, 8, 20]);
  });

  it('AK-S2-09 Sturm: Glashütte unberührt, Holzfäller liefert die Hälfte (M11 S3)', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10);
    const lj = direct(w, 'lumberjack', 13);
    home(w).tiles[idx(home(w), 14, 5)]!.terrain = 'forest'; // M11 S3: Holzfäller braucht freien Wald
    home(w).stock = { ...home(w).stock, stone: 50, wood: 50 };
    w.crisisLevel = 'normal';
    w.tick = 2400;
    const twin = clone(w);
    beginCrisis(w, 0, { kind: 'storm' });
    run(w, 200); // Vorwarnung
    run(twin, 200);
    for (const x of [w, twin]) {
      x.buildings[gw.id]!.progress = 0;
      x.buildings[lj.id]!.progress = 0;
    }
    const s0 = { ...home(w).stock };
    const t0 = { ...home(twin).stock };
    run(w, 300);
    run(twin, 300);
    expect(home(w).stock.glass - s0.glass).toBe(6);
    expect(home(twin).stock.glass - t0.glass).toBe(6);
    // Holz: Zugang des Holzfällers minus 6 Einheiten für die Glashütte
    expect(home(w).stock.wood - s0.wood + 6).toBe(5);
    expect(home(twin).stock.wood - t0.wood + 6).toBe(10);
  });

  it('AK-S2-16 goodsBalance: Glas produced 2, Stein consumed 2, Holz consumed 2 je 100 Ticks', () => {
    const w = base();
    direct(w, 'glassworks', 10);
    const bal = goodsBalance(w);
    expect(bal.glass.produced).toBe(2);
    expect(bal.stone.consumed).toBe(2);
    expect(bal.wood.consumed).toBe(2);
  });

  it('RF-2 nicht angebundene Glashütte mit vollem Lager: notConnected, nichts entnommen', () => {
    const w = base();
    const gw = direct(w, 'glassworks', 10, false);
    home(w).stock = { ...home(w).stock, stone: 100, wood: 100 };
    run(w, 100);
    expect(gw.state).toBe('notConnected');
    expect([home(w).stock.stone, home(w).stock.wood, home(w).stock.glass]).toEqual([100, 100, 0]);
  });
});

describe('M8 Glas im Handel, in Aufträgen und Booms (Spec 5.1, 5.4)', () => {
  it('AK-S2-11 Glas-Verkauf: 10 Glas +191, sellPct 90; im Boom +286', () => {
    const w = base();
    home(w).stock.glass = 10;
    const m0 = w.money;
    expect(sell(w, 'glass', 10).ok).toBe(true);
    expect(w.money - m0).toBe(191);
    expect(w.sellPct.glass).toBe(90);
    const b = base();
    home(b).stock.glass = 10;
    b.crisisLevel = 'normal';
    b.tick = 2400;
    beginCrisis(b, 0, { kind: 'boom', good: 'glass' });
    const b0 = b.money;
    expect(sell(b, 'glass', 10).ok).toBe(true);
    expect(b.money - b0).toBe(286);
  });

  it('AK-S2-12 Auftrag Glas: Stückprämie 37, Menge 4 … 8 → 148 … 296, Lieferung von 8', () => {
    expect(orderUnitReward('glass')).toBe(37);
    const { min, max } = GOODS.glass.order!;
    expect([min * 37, max * 37]).toEqual([148, 296]);
    const w = base();
    w.tick = 1500;
    w.order = { period: 1, good: 'glass', amount: 8, reward: 296, due: 2100 };
    home(w).stock.glass = 8;
    const m0 = w.money;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.money - m0).toBe(296);
    expect(home(w).stock.glass).toBe(0);
  });

  it('AK-S2-13 Stufe 4: Pool mit 8 Gütern, Glas zuletzt; über k 0 … 199 (Seed 3) kommt Glas vor', () => {
    const pool = orderPool(4);
    expect(pool).toEqual(['wood', 'stone', 'food', 'wool', 'cloth', 'cane', 'rum', 'glass']);
    const goods = Array.from({ length: 200 }, (_, k) => orderForPeriod(3, k, 4).good);
    expect(goods).toContain('glass');
  });

  it('AK-S2-14 Boom-Pool: Höchststufe 4 zieht aus 8 Gütern, Glas kommt über k 0 … 199 (Seed 3) vor', () => {
    const booms = Array.from({ length: 200 }, (_, k) => rollCrisis(3, k, 4, null)).filter(
      (r) => r.kind === 'boom',
    );
    expect(booms.length).toBeGreaterThan(0);
    for (const r of booms) expect(orderPool(4)).toContain(r.good);
    expect(booms.map((r) => r.good)).toContain('glass');
  });

  it('AK-S2-15 Invariante mit Glas: Boompreis 30 < Prämie 37 < Kauf 50', () => {
    expect(GOOD_IDS).toContain('glass');
    const { buy, sell: s } = GOODS.glass;
    expect((s * BOOM_PCT) / 100).toBe(30);
    expect(Math.floor(buy * ORDER_PREMIUM)).toBe(37);
    expect(buy).toBe(50);
  });

  it('RF-5 Glas-Auftrag läuft weiter, wenn die Höchststufe unter 4 fällt; Stand lädt; nächster Pool ohne Glas', () => {
    const w = base();
    const house = direct(w, 'house', 3);
    house.house = {
      tier: 4,
      inhabitants: 20,
      demand: {},
      satisfied: {},
      services: {},
      satisfiedSince: 0,
      supplied: false,
    };
    w.won = true;
    w.tick = 1500;
    w.order = { period: 1, good: 'glass', amount: 6, reward: 222, due: 2100 };
    expect(maxHouseTier(w)).toBe(4);
    delete w.buildings[house.id]; // alle Kaufmannshäuser abgerissen (Zustandssetzung)
    expect(maxHouseTier(w)).toBe(1);
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    const delivered = clone(w);
    home(delivered).stock.glass = 6;
    expect(deliverOrder(delivered).ok).toBe(true);
    while (w.tick < 2100) step(w);
    expect(w.order).toMatchObject({ good: 'glass', due: 2100 });
    while (w.tick < 2400) step(w);
    expect(w.order).not.toBeNull();
    expect(w.order!.good).not.toBe('glass');
    expect(orderPool(maxHouseTier(w))).toContain(w.order!.good);
  });
});
