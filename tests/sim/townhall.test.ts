import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../../src/sim/build';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import { UPGRADE_DEFICIT_WAIT_FACTOR, UPGRADE_WAIT } from '../../src/sim/defs/timing';
import { UNLOCKS } from '../../src/sim/defs/unlocks';
import { clearForest, plantForest } from '../../src/sim/forest';
import { canPlace } from '../../src/sim/placement';
import { houseCap, totalTaxes, upgradeStatus } from '../../src/sim/population';
import { setGoodLock, setTaxLevel, setUpgradeStop } from '../../src/sim/tax';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { effectiveTaxLevel, townhallActive } from '../../src/sim/townhall';
import type { Building, GoodId, Tier, World } from '../../src/sim/types';
import { nextUnlocks } from '../../src/sim/unlocks';
import { createWorld, home } from '../../src/sim/world';
import { forceRect, placeService, placeTownhall, prepareEast, village } from './helpers';

const placeRoadOk = (w: World, x: number, y: number): boolean => placeRoad(w, x, y).ok;

/** Haus auf Stufe/Einwohner, alle Güter und Dienste der Stufe erfüllt, seit der (Defizitwelt-)Wartezeit zufrieden (M11 S10). */
function fill(w: World, b: Building, tier: Tier, n: number): void {
  const goods = Object.keys(TIERS[tier].needs) as GoodId[];
  b.house = {
    tier,
    inhabitants: n,
    demand: Object.fromEntries(goods.map((g) => [g, 0])),
    satisfied: Object.fromEntries(goods.map((g) => [g, true])),
    services: Object.fromEntries(TIERS[tier].services.map((s) => [s, true])),
    satisfiedSince: w.tick - UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR,
    supplied: true,
  };
}

describe('M10 Amtsstube (Spec 5.1, 5.2)', () => {
  it('AK-S2-01 (M11 S2) Defs Amtsstube, maxCount, requiresService, U3, brennbar', () => {
    const t = BUILDING_DEFS.townhall;
    expect(t).toMatchObject({
      name: 'Amtsstube',
      w: 2,
      h: 2,
      cost: { money: 200, wood: 15, tools: 2, stone: 5 },
      upkeep: 20,
      category: 'public',
      site: [],
      flammable: true,
      maxCount: { n: 1, reason: 'Es gibt schon eine Amtsstube' },
    });
    for (const k of ['stormAffected', 'service', 'serviceRadius', 'supplyRadius'] as const)
      expect(t[k]).toBeUndefined();
    expect(BUILDING_IDS[BUILDING_IDS.length - 1]).toBe('townhall');
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].maxCount !== undefined)).toEqual([
      'townhall',
    ]);
    expect(UNLOCKS.find((u) => u.id === 'U3')!.buildings).toEqual(['cattlefarm', 'townhall']);
    expect(BUILDING_DEFS.toolmaker.requiresService).toBe('school');
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].requiresService !== undefined)).toEqual([
      'toolmaker',
    ]);
  });
  it('AK-S2-02 höchstens eine Amtsstube, auch wenn die erste brennt oder unverbunden ist; nach Abriss wieder baubar', () => {
    const w = createWorld(3, { unlockAll: true });
    const t = placeTownhall(w);
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 3, k.y + 3, 2, 2, 'grass');
    const second = { ok: false, reason: 'Es gibt schon eine Amtsstube' };
    expect(canPlace(w, 'townhall', k.x + 3, k.y + 3)).toEqual(second);
    t.outageUntil = w.tick + 100;
    expect(canPlace(w, 'townhall', k.x + 3, k.y + 3)).toEqual(second);
    t.outageUntil = undefined;
    expect(removeRoad(w, k.x, k.y + 2).ok).toBe(true);
    expect(canPlace(w, 'townhall', k.x + 3, k.y + 3)).toEqual(second);
    expect(demolish(w, t.id).ok).toBe(true);
    expect(canPlace(w, 'townhall', k.x + 3, k.y + 3).ok).toBe(true);
  });
  it('AK-S2-03 townhallActive: angebunden ohne Ausfall; ohne Weg, mit Ausfall, ohne Amtsstube false', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(townhallActive(w)).toBe(false);
    const t = placeTownhall(w);
    expect(townhallActive(w)).toBe(true);
    t.outageUntil = w.tick + 10;
    expect(townhallActive(w)).toBe(false);
    t.outageUntil = undefined;
    const k = w.buildings[home(w).kontorId]!;
    expect(removeRoad(w, k.x, k.y + 2).ok).toBe(true);
    expect(townhallActive(w)).toBe(false);
  });
  it('AK-S2-04 wirksame Steuer: ohne Amtsstube normal (56, Belegung 8); hoch 72 / 6; niedrig 39; Brand → 56', () => {
    const { w, houses } = village(1, { unlockAll: true });
    fill(w, houses[0]!, 2, 8);
    w.taxLevel = 'high';
    expect(effectiveTaxLevel(w)).toBe('normal');
    expect(totalTaxes(w)).toBe(56);
    expect(houseCap(w, houses[0]!.house!)).toBe(8);
    const t = placeTownhall(w);
    expect(effectiveTaxLevel(w)).toBe('high');
    expect(totalTaxes(w)).toBe(72);
    expect(houseCap(w, houses[0]!.house!)).toBe(6);
    w.taxLevel = 'low';
    expect(totalTaxes(w)).toBe(39);
    w.taxLevel = 'high';
    t.outageUntil = w.tick + 10;
    expect(totalTaxes(w)).toBe(56);
  });
  it('AK-S2-05 setTaxLevel: Gründe in Spec-Reihenfolge, nichts geändert; mit Amtsstube wie M5; unlockAll ohne Amtsstube', () => {
    const w = createWorld(3, { unlockAll: true });
    const keep = (): unknown[] => [w.taxLevel, w.taxLockedUntil];
    const s0 = keep();
    expect(setTaxLevel(w, 'foo')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(setTaxLevel(w, 'high')).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });
    expect(keep()).toEqual(s0);
    const t = placeTownhall(w);
    const k = w.buildings[home(w).kontorId]!;
    expect(removeRoad(w, k.x, k.y + 2).ok).toBe(true);
    expect(setTaxLevel(w, 'high')).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });
    expect(keep()).toEqual(s0);
    expect(t.connected).toBe(false);
    // Delta R163 B-2: „Alles frei" ändert nichts an der Bedingung
    expect(setTaxLevel(createWorld(3, { unlockAll: true }), 'high')).toEqual({
      ok: false,
      reason: 'Braucht eine Amtsstube',
    });
  });
});

describe('M10 Amtsstube: Abriss, Sperren, Werkzeugmacher, Stopp (Spec 5.2–5.5)', () => {
  it('AK-S2-06 Abriss-Lücke: nach Abriss wirkt normal, taxLevel bleibt high; Neubau wirkt wieder ohne Sperrzeit', () => {
    const { w, houses } = village(1, { unlockAll: true });
    fill(w, houses[0]!, 2, 8);
    const t = placeTownhall(w);
    expect(setTaxLevel(w, 'high').ok).toBe(true);
    const lock = w.taxLockedUntil;
    expect(demolish(w, t.id).ok).toBe(true);
    step(w);
    expect(effectiveTaxLevel(w)).toBe('normal');
    expect(w.taxLevel).toBe('high');
    placeTownhall(w);
    expect(effectiveTaxLevel(w)).toBe('high');
    expect(w.taxLockedUntil).toBe(lock);
  });
  it('AK-S2-07 setGoodLock: Gründe, Sortierung, idempotent, Entfernen; unlockAll ohne Amtsstube', () => {
    const w = createWorld(3);
    expect(setGoodLock(w, 2, 'cloth', true)).toEqual({
      ok: false,
      reason: 'Erst mit den ersten Bürgern',
    });
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    expect(setGoodLock(w, 2, 'cloth', true)).toEqual({
      ok: false,
      reason: 'Braucht eine Amtsstube',
    });
    placeTownhall(w);
    for (const [t, g] of [
      [5, 'food'],
      [2, 'gold'],
      [1, 'cloth'],
    ] as const)
      expect(setGoodLock(w, t, g, true)).toEqual({ ok: false, reason: 'Ungültige Sperre' });
    expect(setGoodLock(w, 3, 'rum', true).ok).toBe(true);
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    expect(w.goodLocks).toEqual([
      { tier: 2, good: 'cloth' },
      { tier: 3, good: 'rum' },
    ]);
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    expect(w.goodLocks).toHaveLength(2);
    expect(setGoodLock(w, 2, 'cloth', false).ok).toBe(true);
    expect(w.goodLocks).toEqual([{ tier: 3, good: 'rum' }]);
    expect(setGoodLock(createWorld(3, { unlockAll: true }), 2, 'cloth', true)).toEqual({
      ok: false,
      reason: 'Braucht eine Amtsstube',
    });
  });
  it('AK-S2-08 Sperre in consume: kein Stoff, halbe Steuer 28, nach Tick 101 Stoff 50 und 6 EW; nach Abriss wieder Entnahme', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    const k = w.buildings[home(w).kontorId]!;
    placeService(w, 'chapel', k.x + 8, k.y - 2);
    const t = placeTownhall(w);
    fill(w, h, 2, 8);
    home(w).stock.food = 50;
    home(w).stock.cloth = 50;
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    w.tick = 0;
    step(w);
    expect(h.house!.satisfied.cloth).toBe(false);
    expect(w.stats.taxes).toBe(28);
    while (w.tick < 101) step(w);
    expect(home(w).stock.cloth).toBe(50);
    expect(h.house!.inhabitants).toBe(6);
    expect(demolish(w, t.id).ok).toBe(true);
    for (let i = 0; i < 60; i++) step(w);
    expect(home(w).stock.cloth).toBeLessThan(50);
    expect(w.goodLocks).toEqual([{ tier: 2, good: 'cloth' }]);
  });
  it('AK-S2-09 Sperre eines neuen Bedarfsguts blockiert den Aufstieg; Sperre eines alten nicht', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    placeTownhall(w);
    fill(w, h, 1, 4);
    home(w).stock.cloth = 10;
    w.money = 10_000;
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    expect(upgradeStatus(w, h).reasons).toContain('Stoff für Siedler gesperrt');
    expect(setGoodLock(w, 2, 'cloth', false).ok).toBe(true);
    expect(setGoodLock(w, 2, 'food', true).ok).toBe(true);
    expect(upgradeStatus(w, h).reasons).not.toContain('Nahrung für Siedler gesperrt');
  });
  it('AK-S2-10 Knappheit: ohne Sperre bekommt das Siedlerhaus (kleinere Id) die Einheit, mit Sperre das Bürgerhaus', () => {
    const run = (locked: boolean): { settler: boolean; citizen: boolean } => {
      const { w, houses } = village(2, { unlockAll: true });
      placeTownhall(w);
      fill(w, houses[0]!, 2, 8);
      fill(w, houses[1]!, 3, 15);
      for (const b of houses) b.house!.demand.cloth = 1;
      home(w).stock.cloth = 1;
      if (locked) expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
      step(w);
      return {
        settler: houses[0]!.house!.satisfied.cloth === true,
        citizen: houses[1]!.house!.satisfied.cloth === true,
      };
    };
    expect(run(false)).toEqual({ settler: true, citizen: false });
    expect(run(true)).toEqual({ settler: false, citizen: true });
  });
  // Alle Fälle in createWorld(3, { unlockAll: true }): die Bedingung gilt auch bei „Alles frei" (Delta R163 B-2)
  const setup = (): { w: World; tm: Building } => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    prepareEast(w, k);
    w.money = 100_000;
    expect(placeRoadOk(w, k.x + 2, k.y)).toBe(true);
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    const r = placeBuilding(w, 'toolmaker', k.x + 3, k.y);
    if (!r.ok || r.id === undefined) throw new Error('Werkzeugmacher');
    home(w).stock.wood = 10;
    home(w).stock.tools = 0;
    return { w, tm: w.buildings[r.id]! };
  };
  it('AK-S2-11 Werkzeugmacher braucht Schule in Reichweite; progress bleibt; Unterhalt läuft; unlockAll ohne Schule', () => {
    const a = setup();
    for (let i = 0; i < 100; i++) step(a.w);
    expect([a.tm.state, a.tm.progress, home(a.w).stock.wood, home(a.w).stock.tools]).toEqual([
      'noService',
      0,
      10,
      0,
    ]);
    expect(a.w.stats.upkeep).toBeGreaterThanOrEqual(25);
    // Schule mit Mittenabstand genau 10 (dx 10, dy 0): Werkzeugmacher-Mitte (kx+4, ky+1) → Schule-Mitte (kx+14, ky+1)
    const b = setup();
    const sb = b.w.buildings[home(b.w).kontorId]!;
    placeService(b.w, 'school', sb.x + 13, sb.y);
    for (let i = 0; i < 80; i++) step(b.w);
    expect([home(b.w).stock.tools, home(b.w).stock.wood]).toEqual([1, 9]);
    const c = setup();
    const sc = c.w.buildings[home(c.w).kontorId]!;
    placeService(c.w, 'school', sc.x + 14, sc.y); // Mittenabstand 11
    for (let i = 0; i < 100; i++) step(c.w);
    expect(c.tm.state).toBe('noService');
  });
  it('AK-S2-11 Schule brennt, unverbunden oder abgerissen → noService; progress bleibt; nach Neubau weiter ab 40', () => {
    const fire = setup();
    const fk = fire.w.buildings[home(fire.w).kontorId]!;
    placeService(fire.w, 'school', fk.x + 13, fk.y).outageUntil = 10_000;
    for (let i = 0; i < 100; i++) step(fire.w);
    expect(fire.tm.state).toBe('noService');
    const unc = setup();
    const uk = unc.w.buildings[home(unc.w).kontorId]!;
    placeService(unc.w, 'school', uk.x + 13, uk.y).connected = false;
    for (let i = 0; i < 100; i++) step(unc.w);
    expect(unc.tm.state).toBe('noService');
    const dem = setup();
    const dk = dem.w.buildings[home(dem.w).kontorId]!;
    const s = placeService(dem.w, 'school', dk.x + 13, dk.y);
    while (dem.tm.progress < 40) step(dem.w);
    expect(demolish(dem.w, s.id).ok).toBe(true);
    for (let i = 0; i < 100; i++) step(dem.w);
    expect(dem.tm.progress).toBe(40);
    const tools = home(dem.w).stock.tools;
    placeService(dem.w, 'school', dk.x + 13, dk.y);
    for (let i = 0; i < 40; i++) step(dem.w);
    expect(home(dem.w).stock.tools).toBe(tools + 1);
  });
});

describe('M10 taxBlocks, Aufstiegsstopp, Determinismus mit Speichern (Spec 12.2, 5.4)', () => {
  it('AK-S2-12 taxBlocks: aktive Amtsstube mit hoch → U4 true, U1 false; ohne Amtsstube beide false', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    w.unlocked = ['U0', 'U2', 'U3'];
    placeTownhall(w);
    w.taxLevel = 'high';
    const n = nextUnlocks(w);
    expect(n.find((e) => e.id === 'U4')!.taxBlocks).toBe(true);
    expect(n.find((e) => e.id === 'U1')!.taxBlocks).toBe(false);
    const v = createWorld(3, { crisisLevel: 'normal' });
    v.unlocked = ['U0', 'U2', 'U3'];
    v.taxLevel = 'high';
    expect(nextUnlocks(v).every((e) => !e.taxBlocks)).toBe(true);
  });
  it('AK-S2-13 Aufstiegsstopp (K1): angehalten nur mit aktiver Amtsstube; Gründe (M11 S10)', () => {
    const { w, houses } = village(1, { unlockAll: true });
    expect(setUpgradeStop(w, 1, true)).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });
    const k = w.buildings[home(w).kontorId]!;
    placeService(w, 'chapel', k.x - 2, k.y + 2); // am Weg der Amtsstube: angebunden, in Reichweite
    const t = placeTownhall(w);
    expect(setUpgradeStop(w, 4, true)).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(setUpgradeStop(w, 1, true).ok).toBe(true);
    expect(w.upgradeStops).toEqual([1]);
    fill(w, houses[0]!, 1, 4);
    w.money = 10_000;
    home(w).stock = { ...home(w).stock, cloth: 10, wood: 50, tools: 50, stone: 50 };
    expect(upgradeStatus(w, houses[0]!).reasons[0]).toBe('Aufstieg in der Amtsstube angehalten');
    w.tick = 49;
    step(w);
    expect(houses[0]!.house!.tier).toBe(1);
    expect(demolish(w, t.id).ok).toBe(true);
    expect(upgradeStatus(w, houses[0]!).ok).toBe(true);
  });
  it('AK-F1-09 (b) Roden, Aufforsten und goodLocks, Speichern und Laden, 100 Schritte → gleiches serialize', () => {
    const w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    w.money = 1000;
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 6, k.y + 3, 1, 1, 'forest');
    expect(clearForest(w, k.x + 6, k.y + 3).ok).toBe(true);
    expect(plantForest(w, k.x + 6, k.y + 3).ok).toBe(true);
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    const r = deserialize(serialize(w));
    if (!r.ok) throw new Error(r.reason);
    for (let i = 0; i < 100; i++) {
      step(w);
      step(r.world);
    }
    expect(serialize(r.world)).toBe(serialize(w));
  });
  it('RF-2 brennende Amtsstube: Sperre und hoch wirken nicht, danach wieder; gespeicherte Werte unverändert', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const t = placeTownhall(w);
    fill(w, houses[0]!, 2, 8);
    home(w).stock.cloth = 50;
    home(w).stock.food = 50;
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    w.taxLevel = 'high';
    t.outageUntil = w.tick + 1000;
    houses[0]!.house!.demand.cloth = 1;
    step(w);
    expect(home(w).stock.cloth).toBe(49);
    expect(effectiveTaxLevel(w)).toBe('normal');
    t.outageUntil = undefined;
    houses[0]!.house!.demand.cloth = 1;
    step(w);
    expect(home(w).stock.cloth).toBe(49);
    expect(effectiveTaxLevel(w)).toBe('high');
    expect([w.goodLocks, w.taxLevel]).toEqual([[{ tier: 2, good: 'cloth' }], 'high']);
  });
});
