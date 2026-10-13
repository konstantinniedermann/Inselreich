import { describe, expect, it } from 'vitest';
import { BOOM_PCT } from '../../src/sim/defs/crises';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { EDICTS } from '../../src/sim/defs/edicts';
import { GOODS, GOOD_IDS, SELL_DROP, SELL_FLOOR } from '../../src/sim/defs/goods';
import { ISLANDS, PREFER_PCT, TRAIT_BUILDINGS, type IslandDef } from '../../src/sim/defs/sea';
import { deserialize, serialize, SAVE_VERSION } from '../../src/sim/save';
import { setRoute, tickShips } from '../../src/sim/ships';
import { prefersGood, sell, sellPrice } from '../../src/sim/trade';
import type { BuildingDefId, GoodId, World } from '../../src/sim/types';
import { HOME, home } from '../../src/sim/world';
import { readFileSync } from 'node:fs';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';

const MOEWEN = 1; // A, Stoff
const FELSBUCHT = 2; // B, Rum
const WEIDENAU = 3; // C, Glas

/** Welt mit Kontor auf allen drei Fremdinseln. */
function world3(): World {
  const w = seaWorld();
  for (const i of [MOEWEN, FELSBUCHT, WEIDENAU]) foundKontor2Literal(w, i);
  return w;
}

function boom(w: World, good: GoodId): void {
  w.crisis = { kind: 'boom', good } as World['crisis'];
}

/** Referenz der alten Formel (vor I-092), ausgeschrieben. */
function oldPrice(good: GoodId, n: number, startPct: number, mult: number): number {
  let acc = 0;
  let pct = startPct;
  for (let i = 0; i < n; i++) {
    acc += GOODS[good].sell * pct * mult;
    pct = Math.max(SELL_FLOOR, pct - SELL_DROP);
  }
  return Math.floor(acc / 10000);
}

/** Erzeuger von `good` samt Kette seiner Eingänge (besuchte Menge gegen Zyklen). */
function chainBuildings(good: GoodId, seen = new Set<GoodId>()): Set<BuildingDefId> {
  const out = new Set<BuildingDefId>();
  if (seen.has(good)) return out;
  seen.add(good);
  for (const [id, def] of Object.entries(BUILDING_DEFS)) {
    if (def.produces !== good) continue;
    out.add(id as BuildingDefId);
    for (const input of def.consumes ?? []) for (const b of chainBuildings(input, seen)) out.add(b);
  }
  return out;
}

function chainViolates(isl: Pick<IslandDef, 'traits'>, good: GoodId): boolean {
  const chain = chainBuildings(good);
  return isl.traits.some((t) => (TRAIT_BUILDINGS[t] ?? []).some((b) => chain.has(b)));
}

const MIN_BUY = Math.min(...Object.values(EDICTS).map((e) => e.buyFactorPct));

describe('I-092 Inselmarkt-Vorliebe', () => {
  it('AK-IM-01 Defs', () => {
    expect(PREFER_PCT).toBe(130);
    const by = (k: string) => ISLANDS.find((i) => i.kind === k)!.prefers;
    expect(by('A')).toEqual(['cloth']);
    expect(by('C')).toEqual(['glass']);
    expect(by('B')).toEqual(['rum']);
  });

  it('AK-IM-02 Invarianten', () => {
    for (const isl of ISLANDS) {
      expect(isl.prefers.length).toBeLessThanOrEqual(1);
      for (const g of isl.prefers) {
        expect(GOODS[g].sell).toBeGreaterThan(6);
        expect(g).not.toBe('spice');
        expect(chainViolates(isl, g)).toBe(false);
        expect(Math.max(BOOM_PCT, PREFER_PCT) * GOODS[g].sell).toBeLessThan(MIN_BUY * GOODS[g].buy);
      }
    }
  });

  it('AK-IM-02 Gegenproben der Kettenregel', () => {
    const weidenau = ISLANDS.find((i) => i.kind === 'C')!;
    const felsbucht = ISLANDS.find((i) => i.kind === 'B')!;
    expect(chainViolates(weidenau, 'cloth')).toBe(true);
    expect(chainViolates(felsbucht, 'glass')).toBe(true);
  });

  it('AK-IM-02 Gegenprobe Edikt Handel + Boom', () => {
    expect(EDICTS.trade.buyFactorPct).toBe(80);
    const f = 150;
    expect((f * GOODS.rum.sell) / 100).toBe(27);
    expect((80 * GOODS.rum.buy) / 100).toBe(32);
    expect((f * GOODS.glass.sell) / 100).toBe(30);
    expect((80 * GOODS.glass.buy) / 100).toBe(40);
    expect((f * GOODS.cloth.sell) / 100).toBe(18);
    expect((80 * GOODS.cloth.buy) / 100).toBe(24);
  });

  it('AK-IM-03 Preise und Verkauf', () => {
    const w = world3();
    expect(sellPrice(w, 'glass', 1, WEIDENAU)).toBe(26);
    expect(sellPrice(w, 'glass', 10, WEIDENAU)).toBe(248);
    expect(sellPrice(w, 'glass', 50, WEIDENAU)).toBe(981);
    expect(sellPrice(w, 'cloth', 1, MOEWEN)).toBe(15);
    expect(sellPrice(w, 'rum', 1, FELSBUCHT)).toBe(23);
    w.islands[WEIDENAU]!.stock.glass = 10;
    const before = w.money;
    expect(sell(w, 'glass', 10, WEIDENAU)).toEqual({ ok: true });
    expect(w.money - before).toBe(248);
  });

  it('AK-IM-03 Glas per Schiff von Felsbucht nach Weidenau erlöst 248', () => {
    const w = world3();
    w.islands[FELSBUCHT]!.stock.glass = 10;
    const s = shipLiteral(w);
    expect(
      setRoute(w, s.id, {
        a: FELSBUCHT,
        b: WEIDENAU,
        ab: [{ good: 'glass', reserve: 0 }],
        ba: [{ good: 'wood', reserve: 0 }],
      }),
    ).toEqual({ ok: true });
    for (let i = 0; i < 20000 && w.islands[WEIDENAU]!.stock.glass < 10; i++) tickShips(w);
    expect(w.islands[WEIDENAU]!.stock.glass).toBe(10);
    const before = w.money;
    expect(sell(w, 'glass', 10, WEIDENAU).ok).toBe(true);
    expect(w.money - before).toBe(248);
  });

  it('AK-IM-04 Heimat bitgleich zur alten Formel', () => {
    for (const good of GOOD_IDS)
      for (const n of [1, 10, 50])
        for (const pct of [100, 30])
          for (const withBoom of [false, true]) {
            const w = seaWorld();
            w.sellPct[good] = pct;
            if (withBoom) boom(w, good);
            const ref = oldPrice(good, n, pct, withBoom ? BOOM_PCT : 100);
            expect(sellPrice(w, good, n)).toBe(ref);
            expect(sellPrice(w, good, n, HOME)).toBe(ref);
          }
    const w = seaWorld();
    expect(sellPrice(w, 'glass', 1)).toBe(20);
    expect(sellPrice(w, 'glass', 10)).toBe(191);
    expect(sellPrice(w, 'glass', 50)).toBe(755);
  });

  it('AK-IM-05 Kein Vorliebe-Gut', () => {
    const w = world3();
    expect(sellPrice(w, 'glass', 1, FELSBUCHT)).toBe(20);
    expect(sellPrice(w, 'glass', 1, MOEWEN)).toBe(20);
    expect(sellPrice(w, 'cloth', 10, WEIDENAU)).toBe(sellPrice(w, 'cloth', 10));
  });

  it('AK-IM-06 Boom und Vorliebe stapeln nicht', () => {
    const w = world3();
    boom(w, 'rum');
    expect(sellPrice(w, 'rum', 1, FELSBUCHT)).toBe(27);
    expect(sellPrice(w, 'rum', 1)).toBe(27);
    expect(sellPrice(w, 'glass', 1, WEIDENAU)).toBe(26);
    boom(w, 'glass');
    expect(sellPrice(w, 'glass', 1, WEIDENAU)).toBe(30);
  });

  it('AK-IM-07 Sättigung global', () => {
    const w = world3();
    w.islands[WEIDENAU]!.stock.glass = 10;
    sell(w, 'glass', 10, WEIDENAU);
    expect(w.sellPct.glass).toBe(90);
    home(w).stock.glass = 1;
    const before = w.money;
    sell(w, 'glass', 1);
    expect(w.money - before).toBe(18);
    w.sellPct.glass = SELL_FLOOR;
    expect(sellPrice(w, 'glass', 1, WEIDENAU)).toBe(7);
    w.islands[WEIDENAU]!.stock.glass = 1;
    sell(w, 'glass', 1, WEIDENAU);
    expect(w.sellPct.glass).toBe(30);
  });

  it('AK-IM-08 sellPrice ist rein', () => {
    const w = world3();
    const before = serialize(w);
    sellPrice(w, 'glass', 10, WEIDENAU);
    expect(serialize(w)).toBe(before);
  });

  it('AK-IM-09 Fehlerfälle ohne Zustandsänderung', () => {
    const w = seaWorld();
    let before = serialize(w);
    expect(sell(w, 'glass', 1, WEIDENAU)).toEqual({
      ok: false,
      reason: 'Kein Kontor auf Weidenau',
    });
    foundKontor2Literal(w, WEIDENAU);
    before = serialize(w);
    expect(sell(w, 'glass', 1, WEIDENAU)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(sell(w, 'glass', 1, 99)).toEqual({ ok: false, reason: 'Unbekannte Insel' });
    expect(serialize(w)).toBe(before);
  });

  it('AK-IM-10 Alter Spielstand lädt, Vorliebe wirkt danach', () => {
    expect(SAVE_VERSION).toBe(SAVE_VERSION); // gegen die Konstante, keine Zahl
    const json = readFileSync('tests/sim/fixtures/save-v12-felsbucht.json', 'utf8');
    const loaded = deserialize(json);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const w = loaded.world;
    expect(JSON.parse(serialize(w)).version).toBe(SAVE_VERSION);
    if (w.islands[FELSBUCHT]!.kontorId === null) foundKontor2Literal(w, FELSBUCHT);
    w.islands[FELSBUCHT]!.stock.rum = 1;
    w.sellPct.rum = 100;
    const before = w.money;
    expect(sell(w, 'rum', 1, FELSBUCHT)).toEqual({ ok: true });
    expect(w.money - before).toBe(23);
  });

  it('prefersGood: unbekannte Insel wirft nicht', () => {
    const w = seaWorld();
    expect(prefersGood(w, 99, 'glass')).toBe(false);
    expect(prefersGood(w, WEIDENAU, 'glass')).toBe(true);
    expect(prefersGood(w, HOME, 'glass')).toBe(false);
  });
});
