import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis, fireTarget } from '../../src/sim/crises';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { EFF_MAX, EFF_WINDOW } from '../../src/sim/defs/timing';
import { refundCost, tickEconomy, totalUpkeep } from '../../src/sim/economy';
import { goodsBalance } from '../../src/sim/flow';
import { buildingUpkeep } from '../../src/sim/levels';
import { setPaused } from '../../src/sim/pause';
import { tickProduction } from '../../src/sim/production';
import { recomputeConnectivity } from '../../src/sim/roads';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { paidCost, upgradeBuilding } from '../../src/sim/upgrade';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { forceRect, houseNearKontor, placeService, placeTownhall, putBuilding } from './helpers';

/** Zeile im Welt-Raster: Betriebe roh, angebunden, weit weg vom Kontor. */
let slot = 0;
const put = (w: World, defId: BuildingDefId): Building =>
  putBuilding(w, 0, defId, 4 + (slot % 12) * 4, 44 + Math.floor(slot++ / 12) * 4);

const newWorld = (): World => {
  slot = 0;
  return createWorld(3, { unlockAll: true });
};
const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) {
    w.tick++;
    tickProduction(w);
  }
};
const reason = (r: { ok: boolean; reason?: string }): string | undefined => r.reason;

describe('M13-E1 Betrieb stilllegen (AK-M13STL-01…08)', () => {
  it('AK-M13STL-01 Ablauf: still, doppelt, anfahren, doppelt', () => {
    const w = newWorld();
    const f = put(w, 'fisher');
    expect(setPaused(w, f.id, true)).toEqual({ ok: true });
    expect([f.paused, f.state]).toEqual([true, 'paused']);
    expect(setPaused(w, f.id, true)).toEqual({ ok: false, reason: 'Schon stillgelegt' });
    expect(setPaused(w, f.id, false)).toEqual({ ok: true });
    expect(Object.hasOwn(f, 'paused')).toBe(false);
    expect(f.state).toBe('ok');
    expect(setPaused(w, f.id, false)).toEqual({ ok: false, reason: 'Läuft bereits' });
  });

  it('AK-M13STL-02 Gründe, Unversehrtheit und kein Zufall', () => {
    const w = newWorld();
    placeTownhall(w);
    const house = houseNearKontor(w);
    const k = w.buildings[home(w).kontorId]!;
    const chapel = placeService(w, 'chapel', k.x + 4, k.y);
    const market = put(w, 'market');
    const hall = Object.values(w.buildings).find((b) => b.defId === 'townhall')!;
    const fisher = put(w, 'fisher');
    expect(reason(setPaused(w, 9999, true))).toBe('Gebäude nicht gefunden');
    for (const b of [house, chapel, k, hall, market])
      expect(reason(setPaused(w, b.id, true))).toBe('Nur Betriebe lassen sich stilllegen');
    for (const v of ['ja', 1, undefined])
      expect(reason(setPaused(w, fisher.id, v))).toBe('Ungültiger Wert');
    const before = serialize(w);
    for (const id of [-1, 0, 1.5, NaN, '2'])
      for (const p of [true, false, 'x']) {
        const r = setPaused(w, id, p);
        if (!r.ok) expect(serialize(w)).toBe(before);
      }
    expect(serialize(w)).toBe(before);
    const src = readFileSync('src/sim/pause.ts', 'utf8');
    expect(src).not.toContain('./rng');
    expect(src).not.toContain('Math.random');
  });

  it('AK-M13STL-03 Produktion ruht, Anfahren produziert wieder', () => {
    const w = newWorld();
    w.tick = 1000;
    const f = put(w, 'fisher');
    f.progress = 5;
    const food = home(w).stock.food;
    const eff0 = f.eff ?? EFF_WINDOW * EFF_MAX;
    expect(setPaused(w, f.id, true).ok).toBe(true);
    const weaver = put(w, 'weaver');
    home(w).stock.wool = 5;
    expect(setPaused(w, weaver.id, true).ok).toBe(true);
    run(w, 100);
    expect(f.progress).toBe(5);
    expect(home(w).stock.food).toBe(food);
    expect(f.state).toBe('paused');
    expect(f.eff!).toBeLessThan(eff0);
    expect(home(w).stock.wool).toBe(5);
    expect(setPaused(w, f.id, false).ok).toBe(true);
    run(w, 1);
    expect(f.progress).toBe(6);
  });

  it('AK-M13STL-04 Unterhalt halbiert, mit Sparen 34, gebucht −34', () => {
    const w = newWorld();
    w.won = true;
    placeTownhall(w);
    put(w, 'fisher');
    put(w, 'fisher');
    const glass = put(w, 'glassworks');
    expect(totalUpkeep(w)).toBe(55);
    expect(setPaused(w, glass.id, true).ok).toBe(true);
    expect(totalUpkeep(w)).toBe(43);
    w.edict = 'saving';
    expect(totalUpkeep(w)).toBe(34);
    w.money = 0;
    w.upkeepCarry = 0;
    for (let i = 0; i < 100; i++) tickEconomy(w);
    expect(w.money).toBe(-34);
    const f = put(w, 'fisher');
    const tm = put(w, 'toolmaker');
    f.paused = true;
    tm.paused = true;
    expect([buildingUpkeep(f), buildingUpkeep(tm)]).toEqual([3, 13]);
    delete f.paused;
    expect(buildingUpkeep(f)).toBe(5);
    glass.level = 2;
    expect(buildingUpkeep(glass)).toBe(17);
    glass.level = 3;
    expect(buildingUpkeep(glass)).toBe(22);
  });

  it('AK-M13STL-05 Bilanz zählt Stilllegung nicht, Kette läuft leer', () => {
    const w = newWorld();
    const a = put(w, 'fisher');
    const b = put(w, 'fisher');
    const one = goodsBalance(w).food.produced;
    expect(setPaused(w, b.id, true).ok).toBe(true);
    expect(goodsBalance(w).food.produced).toBe(one / 2);
    expect(a.paused).toBeUndefined();

    const c = newWorld();
    const sheep = put(c, 'sheepfarm');
    const weaver = put(c, 'weaver');
    home(c).stock.wool = 2;
    expect(setPaused(c, sheep.id, true).ok).toBe(true);
    for (let i = 0; i < 600 && weaver.state !== 'waitingInput'; i++) run(c, 1);
    expect(weaver.state).toBe('waitingInput');
    expect(home(c).stock.wool).toBe(0);
    expect(goodsBalance(c).wool.produced).toBe(0);
  });

  it('AK-M13STL-06 Brand: nach dem Ausfall wieder stillgelegt, Brandziel gleich', () => {
    const w = newWorld();
    w.tick = 2400;
    const f = put(w, 'fisher');
    const tile = { x: f.x, y: f.y };
    const free = fireTarget(w, tile)?.id;
    expect(setPaused(w, f.id, true).ok).toBe(true);
    expect(fireTarget(w, tile)?.id).toBe(free);
    beginCrisis(w, 0, { kind: 'fire', tile });
    expect([f.state, f.paused]).toEqual(['burning', true]);
    const until = f.outageUntil!;
    expect(buildingUpkeep(f)).toBe(3);
    for (; w.tick < until;) step(w);
    expect(f.outageUntil).toBeUndefined();
    expect([f.state, f.paused]).toEqual(['paused', true]);
  });

  it('AK-M13STL-07 Ausbau behält das Flag, Abriss erstattet wie bei laufendem Betrieb', () => {
    const w = newWorld();
    const f = put(w, 'fisher');
    expect(setPaused(w, f.id, true).ok).toBe(true);
    w.money = 100_000;
    for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect([f.level, f.paused]).toEqual([2, true]);
    const refund = refundCost(paidCost(f)).money;
    const m = w.money;
    expect(demolish(w, f.id).ok).toBe(true);
    expect(w.money - m).toBe(refund);
    expect(w.buildings[f.id]).toBeUndefined();
  });

  it('AK-M13STL-08 Anbindung: still bleibt still, Anfahren ohne Anbindung', () => {
    const w = newWorld();
    const f = put(w, 'fisher');
    expect(setPaused(w, f.id, true).ok).toBe(true);
    recomputeConnectivity(w);
    expect(f.connected).toBe(false);
    expect(f.state).toBe('paused');
    expect(setPaused(w, f.id, false).ok).toBe(true);
    expect(f.state).toBe('notConnected');
  });
});

describe('M13-E1 Determinismus mit Stilllegen (PLAN-M13-04)', () => {
  /** Echt angebundene Welt: Weg östlich des Kontors, Betriebe beidseits (Anbindung überlebt das Laden). */
  const build = (): World => {
    const w = createWorld(3, { unlockAll: true, crisisLevel: 'normal' });
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 2, k.y - 3, 14, 7, 'grass');
    w.money = 1_000_000;
    for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
    for (let x = k.x + 2; x <= k.x + 13; x++) expect(placeRoad(w, x, k.y).ok).toBe(true);
    let south = k.x + 2;
    for (const d of [
      'sheepfarm',
      'weaver',
      'canefarm',
      'distillery',
      'toolmaker',
      'glassworks',
    ] as const) {
      const def = BUILDING_DEFS[d];
      const r = placeBuilding(w, d, south, k.y + 1);
      expect(r.ok, d).toBe(true);
      south += def.w;
    }
    w.money = 50_000;
    home(w).stock = { ...home(w).stock, wool: 3, cane: 3 };
    return w;
  };
  const ids = (w: World): number[] =>
    Object.keys(w.buildings)
      .map(Number)
      .sort((a, b) => a - b);
  /** Skript je Tick, Ids über die Reihenfolge der Betriebe (stabil, da gleiche Welt). */
  const act = (w: World): void => {
    const [a, b, c, d] = ids(w).filter((i) => i !== home(w).kontorId);
    const t = w.tick;
    if (t === 100) setPaused(w, a, true);
    if (t === 300) setPaused(w, c, true);
    if (t === 600) setPaused(w, a, false);
    if (t === 2399) setPaused(w, b, true);
    if (t === 3000) demolish(w, c!);
    if (t === 3200) setPaused(w, d, true);
    if (t === 3500) setPaused(w, d, false);
  };
  const igniteSecond = (w: World): void => {
    const b = w.buildings[ids(w).filter((i) => i !== home(w).kontorId)[1]!]!;
    beginCrisis(w, 0, { kind: 'fire', tile: { x: b.x, y: b.y } });
  };
  const play = (w: World, to: number): void => {
    while (w.tick < to) {
      act(w);
      step(w);
      if (w.tick === 2400) igniteSecond(w); // Periode 0 beginnt mit diesem Tick (Krisenfenster)
    }
  };
  const reload = (w: World): World => {
    const r = deserialize(serialize(w));
    if (!r.ok) throw new Error(r.reason);
    return r.world;
  };

  it('gleiche Folge zweimal gleich; Laden mitten im Lauf ändert nichts', () => {
    const x = build();
    play(x, 4000);
    const y = build();
    play(y, 4000);
    expect(serialize(y)).toBe(serialize(x));
    const z = build();
    play(z, 700);
    const z2 = reload(z);
    play(z2, 4000);
    expect(serialize(z2)).toBe(serialize(x));
    const u = build();
    play(u, 2500);
    const burning = u.buildings[ids(u).filter((i) => i !== home(u).kontorId)[1]!]!;
    expect([burning.state, burning.paused]).toEqual(['burning', true]);
    const u2 = reload(u);
    play(u2, 4000);
    expect(serialize(u2)).toBe(serialize(x));
  });
});
