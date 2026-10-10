import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demolish, removeRoad } from '../../src/sim/build';
import { refundCost } from '../../src/sim/economy';
import { activeEdict, activeEdictDef, edictReason, setEdict } from '../../src/sim/edicts';
import { GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { orderUnitReward } from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { buy, buyPrice, sellPrice } from '../../src/sim/trade';
import { recomputeConnectivity } from '../../src/sim/roads';
import { paidCost } from '../../src/sim/upgrade';
import type { Building, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { foldBackToV10, placeTownhall } from './helpers';

/** Testwelt (Spec §10): freigeschaltet, gewonnen, Amtsstube, 1000 Geld, Tick 1000. */
export function edictWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  w.won = true;
  placeTownhall(w);
  w.money = 1000;
  w.tick = 1000;
  return w;
}

const townhallOf = (w: World): Building =>
  Object.values(w.buildings).find((b) => b.defId === 'townhall')!;

describe('M13-E1 Edikte: Aktion', () => {
  it('AK-M13E1-03 Ablauf: erlassen, Sperre, wechseln, aufheben', () => {
    const w = edictWorld();
    expect(setEdict(w, 'saving').ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([400, 'saving', 4000]);
    w.tick = 3999;
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Edikt-Sperrzeit' });
    w.tick = 4000;
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    w.money = 600;
    expect(setEdict(w, 'trade').ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([0, 'trade', 7000]);
    w.tick = 7000;
    expect(setEdict(w, null).ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([0, null, 10000]);
  });

  it('AK-M13E1-04 Gründe und Reihenfolge', () => {
    const w = edictWorld();
    for (const id of ['x', 3, {}])
      expect(setEdict(w, id)).toEqual({ ok: false, reason: 'Ungültiges Edikt' });
    expect(setEdict(w, null)).toEqual({ ok: false, reason: 'Kein Edikt aktiv' });

    const noWon = createWorld(3, { unlockAll: true });
    expect(setEdict(noWon, 'saving')).toEqual({ ok: false, reason: 'Erst nach dem Bürger-Ziel' });
    const noHall = createWorld(3, { unlockAll: true });
    noHall.won = true;
    expect(setEdict(noHall, 'saving')).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });

    const fire = edictWorld();
    townhallOf(fire).outageUntil = fire.tick + 100;
    expect(setEdict(fire, 'saving')).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });

    const same = edictWorld();
    setEdict(same, 'saving');
    same.tick = 1500;
    expect(setEdict(same, 'saving')).toEqual({ ok: false, reason: 'Edikt bereits aktiv' });

    const poor = edictWorld();
    poor.money = -50;
    expect(setEdict(poor, 'trade')).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    const rich = edictWorld();
    setEdict(rich, 'saving');
    rich.money = -50;
    rich.tick = 4000;
    expect(setEdict(rich, null).ok).toBe(true);
  });

  it('AK-M13E1-05 wirft nie, ändert bei Ablehnung nichts, kein RNG', () => {
    const ids: unknown[] = [null, undefined, '', 'saving', 'trade', 'welfare', 'x', 0, NaN, []];
    for (const won of [true, false])
      for (const hall of [true, false])
        for (const id of ids) {
          const w = createWorld(3, { unlockAll: true });
          w.won = won;
          if (hall) placeTownhall(w);
          w.money = 1000;
          w.tick = 1000;
          const before = serialize(w);
          const reason = edictReason(w, id);
          expect(serialize(w)).toBe(before);
          const r = setEdict(w, id);
          expect(typeof r.ok).toBe('boolean');
          expect(r.ok).toBe(reason === null);
          if (!r.ok) expect(serialize(w)).toBe(before);
        }
    const src = readFileSync('src/sim/edicts.ts', 'utf8');
    expect(src).not.toContain('./rng');
    expect(src).not.toContain('Math.random');
  });

  it('AK-M13E1-14 Abriss der Amtsstube hebt das Edikt auf, Sperre bleibt', () => {
    const w = edictWorld();
    setEdict(w, 'saving');
    w.tick = 2000;
    const hall = townhallOf(w);
    const before = w.money;
    const refund = refundCost(paidCost(hall)).money;
    expect(demolish(w, hall.id).ok).toBe(true);
    expect(w.edict).toBeNull();
    expect(w.edictLockedUntil).toBe(4000);
    expect(w.money).toBe(before + refund);
    w.tick = 2500;
    placeTownhall(w);
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Edikt-Sperrzeit' });
    w.tick = 4000;
    w.money = 600;
    expect(setEdict(w, 'trade').ok).toBe(true);
  });

  it('AK-M13E1-15 Freischaltung über won und v10-Stand', () => {
    const w = edictWorld();
    w.won = false;
    expect(setEdict(w, 'saving').ok).toBe(false);
    w.won = true;
    expect(setEdict(w, 'saving').ok).toBe(true);

    const old = edictWorld();
    const res = deserialize(JSON.stringify(foldBackToV10(JSON.parse(serialize(old)))));
    if (!res.ok) throw new Error(res.reason);
    const loaded = res.world;
    expect(loaded.won).toBe(true);
    expect(edictReason(loaded, 'saving')).toBeNull();
    expect(setEdict(loaded, 'saving').ok).toBe(true);
  });

  it('activeEdict ruht bei Brand und fehlender Anbindung, Zustand bleibt', () => {
    const w = edictWorld();
    setEdict(w, 'saving');
    expect(activeEdict(w)).toBe('saving');
    expect(activeEdictDef(w)?.id).toBe('saving');
    const hall = townhallOf(w);
    hall.outageUntil = w.tick + 100;
    expect(activeEdict(w)).toBeNull();
    expect(activeEdictDef(w)).toBeNull();
    expect(w.edict).toBe('saving');
    hall.outageUntil = undefined;
    expect(activeEdict(w)).toBe('saving');

    const k = w.buildings[w.islands[0]!.kontorId!]!;
    expect(removeRoad(w, k.x, k.y + 2).ok).toBe(true);
    recomputeConnectivity(w);
    expect(hall.connected).toBe(false);
    expect(activeEdict(w)).toBeNull();
    expect(w.edict).toBe('saving');
  });
});

describe('M13-E1 Kaufpreis Handel', () => {
  const tradeWorld = (): World => {
    const w = edictWorld();
    setEdict(w, 'trade');
    return w;
  };

  it('AK-M13E1-09 Handel senkt den Kaufpreis, aufgerundet über die Gesamtmenge', () => {
    const w = tradeWorld();
    expect(buyPrice(w, 'food', 1)).toBe(7);
    expect(buyPrice(w, 'food', 10)).toBe(64);
    expect(buyPrice(w, 'glass', 10)).toBe(400);
    expect(buyPrice(w, 'spice', 1)).toBe(32);
    const before = w.money;
    expect(buy(w, 'food', 10).ok).toBe(true);
    expect(w.money).toBe(before - 64);
  });

  it('AK-M13E1-09 ohne wirkendes Edikt gilt n × buy (auch AK-M13E1-13)', () => {
    const plain = edictWorld();
    expect(buyPrice(plain, 'food', 10)).toBe(80);
    const w = tradeWorld();
    w.edict = null;
    expect(buyPrice(w, 'food', 10)).toBe(80);
    const out = tradeWorld();
    townhallOf(out).outageUntil = out.tick + 100;
    expect(buyPrice(out, 'food', 10)).toBe(80);
    const loose = tradeWorld();
    const k = loose.buildings[loose.islands[0]!.kontorId!]!;
    removeRoad(loose, k.x, k.y + 2);
    recomputeConnectivity(loose);
    expect(buyPrice(loose, 'food', 10)).toBe(80);
  });

  it('AK-M13E1-10 Arbitrage: Kaufpreis n = 1 laut Tabelle', () => {
    const w = tradeWorld();
    const expected = {
      wood: 8,
      tools: 32,
      stone: 12,
      food: 7,
      wool: 10,
      cloth: 24,
      cane: 10,
      rum: 32,
      glass: 40,
      spice: 32,
    };
    for (const g of GOOD_IDS) expect(buyPrice(w, g, 1)).toBe(expected[g as keyof typeof expected]);
  });

  it('AK-M13E1-10 Arbitrage: Kauf teurer als Prämie und Boom-Verkauf', () => {
    const w = tradeWorld();
    for (const g of GOOD_IDS) {
      const boom = tradeWorld();
      boom.crisis = { period: 1, kind: 'boom', from: 0, until: 9999, good: g };
      boom.sellPct[g] = 100;
      for (const n of [1, 10, 100]) {
        if (GOODS[g].order !== undefined)
          expect(buyPrice(w, g, n)).toBeGreaterThan(n * orderUnitReward(g));
        expect(buyPrice(w, g, n)).toBeGreaterThan(sellPrice(boom, g, n));
      }
    }
  });
});
