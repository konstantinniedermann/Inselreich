import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { demolish, placeBuilding } from '../../src/sim/build';
import { deliverOrder, tickOrders } from '../../src/sim/orders';
import { canPlace } from '../../src/sim/placement';
import { buy, sell, sellPrice } from '../../src/sim/trade';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import {
  FUNCTION_ENTRY,
  FUNCTION_LABELS,
  ONLY_WITH_CRISES,
  UNLOCK_CHAIN,
  UNLOCK_IDS,
  UNLOCKS,
} from '../../src/sim/defs/unlocks';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { UnlockId, World } from '../../src/sim/types';
import {
  buildingShown,
  buildLock,
  nextUnlocks,
  tickUnlocks,
  unlockText,
} from '../../src/sim/unlocks';
import { createWorld } from '../../src/sim/world';
import { buildColony } from './controller';
import { forceGrass, forceRect, placeService, setHouse, village } from './helpers';

const row = (id: UnlockId) => UNLOCKS.find((u) => u.id === id)!;

describe('M10 Freischaltbaum: Defs und Welt', () => {
  it('AK-S1-01 UNLOCKS: sieben Einträge wie 4.2, Texte 4.5, jede Id genau einmal', () => {
    expect(UNLOCKS.map((u) => u.id)).toEqual(['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6']);
    expect(UNLOCK_IDS).toEqual(UNLOCKS.map((u) => u.id));
    expect(row('U0')).toMatchObject({
      trigger: { kind: 'start' },
      buildings: ['house', 'fisher', 'lumberjack'],
      goods: ['wood', 'tools', 'stone', 'food'],
      functions: [],
    });
    expect(row('U1')).toMatchObject({
      trigger: { kind: 'houses', min: 20 },
      buildings: ['market'],
      goods: [],
      functions: [],
    });
    expect(row('U2')).toMatchObject({
      trigger: { kind: 'tierWish', tier: 2 },
      buildings: ['quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation'],
      goods: ['wool', 'cloth'],
      functions: ['forest'],
    });
    expect(row('U3')).toMatchObject({
      trigger: { kind: 'tierReached', tier: 2 },
      buildings: [],
      goods: [],
      functions: ['orders'],
    });
    expect(row('U4')).toMatchObject({
      trigger: { kind: 'tierWish', tier: 3 },
      buildings: ['canefarm', 'distillery', 'school'],
      goods: ['cane', 'rum'],
      functions: [],
    });
    expect(row('U5')).toMatchObject({
      trigger: { kind: 'tierReached', tier: 3 },
      buildings: ['toolmaker'],
      goods: [],
      functions: ['goodLocks'],
    });
    expect(row('U6')).toMatchObject({
      trigger: { kind: 'tierOpen', tier: 4 },
      buildings: ['bathhouse', 'glassworks'],
      goods: ['glass'],
      functions: [],
    });
    const all = UNLOCKS.flatMap((u) => u.buildings);
    for (const id of BUILDING_IDS.filter((b) => b !== 'kontor'))
      expect(all.filter((b) => b === id)).toHaveLength(1);
    expect(all).not.toContain('kontor');
    for (const g of GOOD_IDS)
      expect(UNLOCKS.flatMap((u) => u.goods).filter((x) => x === g)).toHaveLength(1);
    for (const f of ['forest', 'orders', 'goodLocks'] as const)
      expect(UNLOCKS.flatMap((u) => u.functions).filter((x) => x === f)).toHaveLength(1);
    expect(ONLY_WITH_CRISES).toEqual({ firestation: true });
    expect(UNLOCK_CHAIN).toEqual(['U2', 'U3', 'U4', 'U5', 'U6']);
    expect(FUNCTION_ENTRY).toEqual({ forest: 'U2', orders: 'U3', goodLocks: 'U5' });
    expect(FUNCTION_LABELS).toEqual({
      forest: ['Roden', 'Aufforsten'],
      orders: ['Handelsaufträge'],
      goodLocks: ['Ausgabesperre'],
    });
    for (const u of UNLOCKS) {
      expect(u.tip.length).toBeGreaterThan(0);
      if (u.id !== 'U0')
        for (const k of ['lockText', 'whenText', 'notice'] as const)
          expect(u[k].length).toBeGreaterThan(0);
      for (const k of ['lockText', 'whenText', 'notice', 'tip'] as const)
        expect(u[k]).not.toMatch(/Tick/);
    }
    expect(unlockText(row('U1'), 'lockText')).toBe('Erst ab 20 Wohnhäusern');
    expect(unlockText(row('U2'), 'lockText')).toBe('Erst wenn ein Wohnhaus 4 Pioniere hat');
    expect(unlockText(row('U4'), 'lockText')).toBe('Erst wenn ein Wohnhaus 8 Siedler hat');
    expect(unlockText(row('U6'), 'whenText')).toBe(`nach dem Ziel (${WIN_CITIZENS} Bürger)`);
  });

  it('AK-S1-02 createWorld: version 5, v5-Felder; unlockAll ändert nur unlocked', () => {
    const w = createWorld(3);
    expect(w.version).toBe(5);
    expect(w.unlocked).toEqual(['U0']);
    expect(w.goodLocks).toEqual([]);
    expect(w.upgradeStops).toEqual([]);
    expect('terrainRev' in w).toBe(false);
    const a = createWorld(3, { unlockAll: true });
    expect(a.unlocked).toEqual(['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6']);
    const strip = (x: World): string =>
      JSON.stringify({ ...JSON.parse(serialize(x)), unlocked: null });
    expect(strip(a)).toBe(strip(w));
  });
});

describe('M10 Freischaltung: Auslöser und Kette (Spec 4.2, 4.3)', () => {
  it('AK-S1-03 Pionierhaus mit 4 EW → U2, mit 3 EW nicht', () => {
    const { w, houses } = village(4);
    setHouse(houses[0]!, 1, 3);
    step(w);
    expect(w.unlocked).toEqual(['U0']);
    setHouse(houses[0]!, 1, 4);
    step(w);
    expect(w.unlocked).toEqual(['U0', 'U2']);
  });
  it('AK-S1-03 Siedlerhaus → U2, U3; volles Siedlerhaus → U4; Bürgerhaus → U2 … U5', () => {
    const a = village(1);
    setHouse(a.houses[0]!, 2, 1);
    step(a.w);
    expect(a.w.unlocked).toEqual(['U0', 'U2', 'U3']);
    const b = village(1);
    setHouse(b.houses[0]!, 2, 8);
    step(b.w);
    expect(b.w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4']);
    const c = village(1);
    setHouse(c.houses[0]!, 3, 1);
    step(c.w);
    expect(c.w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
  });
  it('AK-S1-03 20 Wohnhäuser → U1, 19 nicht', () => {
    const a = village(20);
    step(a.w);
    expect(a.w.unlocked).toEqual(['U0', 'U1']);
    const b = village(19);
    step(b.w);
    expect(b.w.unlocked).toEqual(['U0']);
  });
  it('AK-S1-03 won true → U6 mit U2 … U5; Reihenfolge UNLOCK_IDS, keine Doppelten', () => {
    const { w } = village(1);
    w.won = true;
    step(w);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
    tickUnlocks(w);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
  });
  it('AK-S1-04 monoton: Schrumpfen und Abriss aller Häuser nehmen U2 nicht zurück', () => {
    const { w, houses } = village(4);
    setHouse(houses[0]!, 1, 4);
    step(w);
    expect(w.unlocked).toContain('U2');
    setHouse(houses[0]!, 1, 1);
    for (const h of houses) expect(demolish(w, h.id).ok).toBe(true);
    for (let i = 0; i < 200; i++) step(w);
    expect(w.unlocked).toContain('U2');
  });
  it('AK-S1-05 (a) U2 direkt nach dem Schritt, in dem das Haus 4 EW erreicht', () => {
    const { w, houses } = village(1);
    w.stock.food = 100;
    setHouse(houses[0]!, 1, 3);
    for (let i = 0; i < 400 && houses[0]!.house!.inhabitants < 4; i++) {
      expect(w.unlocked).not.toContain('U2');
      step(w);
    }
    expect(houses[0]!.house!.inhabitants).toBe(4);
    expect(w.unlocked).toContain('U2');
  });
  it('AK-S1-05 (b) Bürgerzahl erreicht WIN_CITIZENS: won und U6 nach demselben Schritt', () => {
    const { w, houses } = village(4);
    [15, 15, 15, 5].forEach((n, i) => setHouse(houses[i]!, 3, n));
    expect(w.won).toBe(false);
    expect(w.unlocked).not.toContain('U6');
    step(w);
    expect(w.won).toBe(true);
    expect(w.unlocked).toContain('U6');
  });
  it('AK-S1-05 (c) tickUnlocks ist der letzte Aufruf in step, direkt nach checkWin', () => {
    const src = readFileSync('src/sim/tick.ts', 'utf8');
    const body = src.slice(src.indexOf('export function step'));
    const calls = [...body.slice(0, body.indexOf('\n}')).matchAll(/^\s+(\w+)\(world\);/gm)].map(
      (m) => m[1],
    );
    expect(calls.slice(-2)).toEqual(['checkWin', 'tickUnlocks']);
  });
});

describe('M10 nextUnlocks (Spec 12.2)', () => {
  it('AK-S1-10 neue Welt mit 3/2/1/1 EW: U1 und U2 mit Fortschritt; Kette; U6; unlockAll leer', () => {
    const { w, houses } = village(4, { crisisLevel: 'normal' });
    [3, 2, 1, 1].forEach((n, i) => setHouse(houses[i]!, 1, n));
    const n = nextUnlocks(w);
    expect(n.map((e) => e.id)).toEqual(['U1', 'U2']);
    expect(n[0]).toMatchObject({
      names: ['Marktplatz'],
      when: 'sobald 20 Wohnhäuser stehen',
      now: 4,
      need: 20,
      taxBlocks: false,
    });
    expect(n[1]).toMatchObject({
      names: ['Steinbruch', 'Schäferei', 'Weberei', 'Kapelle', 'Feuerwache', 'Roden', 'Aufforsten'],
      when: 'sobald ein Wohnhaus 4 Pioniere hat',
      now: 3,
      need: 4,
      taxBlocks: false,
    });
    const off = village(4);
    [3, 2, 1, 1].forEach((m, i) => setHouse(off.houses[i]!, 1, m));
    expect(nextUnlocks(off.w)[1]!.names).toEqual([
      'Steinbruch',
      'Schäferei',
      'Weberei',
      'Kapelle',
      'Roden',
      'Aufforsten',
    ]);
    w.unlocked = ['U0', 'U2'];
    expect(nextUnlocks(w).find((e) => e.id === 'U3')).toMatchObject({ now: null, need: null });
    w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5'];
    setHouse(houses[0]!, 3, 12);
    expect(nextUnlocks(w)).toEqual([expect.objectContaining({ id: 'U6', now: 12, need: 50 })]);
    expect(nextUnlocks(createWorld(3, { unlockAll: true }))).toEqual([]);
  });
});

describe('M10 Sperren in der Sim (Spec 4.4)', () => {
  it('AK-S1-06 Bausperre zuerst, auch auf Wasser; nichts gebucht; frei nach U2; U0-Gebäude und Kontor nie gesperrt', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    const reason = 'Erst wenn ein Wohnhaus 4 Pioniere hat';
    expect(buildLock(w, 'chapel')).toBe(reason);
    expect(canPlace(w, 'chapel', k.x + 3, k.y)).toEqual({ ok: false, reason });
    expect(canPlace(w, 'chapel', 0, 0)).toEqual({ ok: false, reason }); // (0,0) ist Wasser
    const before = serialize(w);
    expect(placeBuilding(w, 'chapel', k.x + 3, k.y).ok).toBe(false);
    expect(serialize(w)).toBe(before);
    expect(buildLock(w, 'market')).toBe('Erst ab 20 Wohnhäusern');
    expect(buildLock(w, 'school')).toBe('Erst wenn ein Wohnhaus 8 Siedler hat');
    expect(buildLock(w, 'toolmaker')).toBe('Erst mit den ersten Bürgern');
    expect(buildLock(w, 'bathhouse')).toBe('Erst nach dem Ziel');
    for (const id of ['house', 'fisher', 'lumberjack', 'kontor'] as const)
      expect(buildLock(w, id)).toBeNull();
    w.unlocked = ['U0', 'U2'];
    expect(buildLock(w, 'chapel')).toBeNull();
    expect(placeBuilding(w, 'chapel', k.x + 3, k.y).ok).toBe(true);
  });
  it('AK-S1-07 roh gesetzte Schule ohne U4 versorgt, lässt sich abreissen, zweiter Bau scheitert mit U4-Grund', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceGrass(w, k.x + 2, k.y);
    const r = placeBuilding(w, 'house', k.x + 2, k.y);
    if (!r.ok || r.id === undefined) throw new Error('Haus');
    const h = w.buildings[r.id]!;
    const school = placeService(w, 'school', k.x + 4, k.y); // nach dem Haus: Platzieren setzt `connected` zurück
    w.unlocked = ['U0'];
    setHouse(h, 2, 7); // 8 (voll) würde U4 per Wunsch auslösen; der Plan-Wert 8 widerspricht dem Test
    step(w);
    expect(h.house!.services.school).toBe(true);
    const money = w.money;
    expect(demolish(w, school.id).ok).toBe(true);
    expect(w.money).toBeGreaterThan(money); // Erstattung wie heute
    forceRect(w, k.x + 4, k.y, 2, 2, 'grass');
    expect(canPlace(w, 'school', k.x + 4, k.y)).toEqual({
      ok: false,
      reason: 'Erst wenn ein Wohnhaus 8 Siedler hat',
    });
  });
  it('AK-S1-08 Kauf gesperrt bis U2, Verkauf aus dem Lager immer', () => {
    const w = createWorld(3);
    const before = serialize(w);
    expect(buy(w, 'wool', 1)).toEqual({
      ok: false,
      reason: 'Erst wenn ein Wohnhaus 4 Pioniere hat',
    });
    expect(serialize(w)).toBe(before);
    expect(buy(w, 'wood', 1).ok).toBe(true);
    w.stock.wool = 5;
    const price = sellPrice(w, 'wool', 5);
    const m = w.money;
    expect(sell(w, 'wool', 5).ok).toBe(true);
    expect(w.money - m).toBe(price);
    w.stock.wool = 5;
    expect(sell(w, 'wool', 6)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    w.unlocked = ['U0', 'U2'];
    expect(buy(w, 'wool', 1).ok).toBe(true);
  });
  it('AK-S1-09 Auftrag entsteht vor U3, Lieferung gesperrt, mit U3 möglich; gleiche Aufträge in beiden Welten', () => {
    const a = createWorld(3);
    const b = createWorld(3, { unlockAll: true });
    for (const w of [a, b]) {
      w.tick = 599;
      w.tick += 1;
      tickOrders(w);
    }
    expect(a.order).not.toBeNull();
    expect(a.order).toEqual(b.order);
    a.stock[a.order!.good] = 99;
    const before = serialize(a);
    expect(deliverOrder(a)).toEqual({ ok: false, reason: 'Erst mit den ersten Siedlern' });
    expect(serialize(a)).toBe(before);
    a.unlocked = ['U0', 'U2', 'U3'];
    expect(deliverOrder(a).ok).toBe(true);
  });
  it('AK-S1-17 „Alles frei" bitgleich: buildColony liefert denselben Trajectory', () => {
    expect(buildColony(createWorld(3, { unlockAll: true }))).toEqual(buildColony(createWorld(3)));
  });
  it('AK-S1-18 Feuerwache bei Krisen off: nicht angezeigt, aber baubar; bei mild angezeigt', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    expect(buildingShown(w, 'firestation')).toBe(false);
    expect(buildLock(w, 'firestation')).toBeNull();
    expect(canPlace(w, 'firestation', k.x + 3, k.y).ok).toBe(true);
    expect(
      buildingShown(createWorld(3, { crisisLevel: 'mild', unlockAll: true }), 'firestation'),
    ).toBe(true);
  });
});
