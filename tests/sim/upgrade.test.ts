import { describe, expect, it } from 'vitest';
import { createWorld, idx } from '../../src/sim/world';
import { totalUpkeep } from '../../src/sim/economy';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { paidCost, upgradeBuilding } from '../../src/sim/upgrade';
import { demolish } from '../../src/sim/build';
import { beginCrisis } from '../../src/sim/crises';
import { FIRE_OUTAGE } from '../../src/sim/defs/timing';
import { LEVELS, type LevelDef } from '../../src/sim/defs/levels';
import { UNLOCKS } from '../../src/sim/defs/unlocks';
import { cycleOf, upkeepOf } from '../../src/sim/levels';
import { goodsBalance } from '../../src/sim/queries';
import { deriveUnlocks, unlockText } from '../../src/sim/unlocks';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';

/** Angebundener Fischer, direkt eingefügt (Muster production.test.ts:15); Kachel trägt die Id für demolish. */
function fisherAt(w: World, x = 0, y = 0): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId: 'fisher',
    x,
    y,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  w.buildings[b.id] = b;
  w.tiles[idx(w, x, y)]!.buildingId = b.id;
  return b;
}
const world = (): World => {
  const w = createWorld(3);
  w.unlocked = ['U0', 'U2', 'U3']; // U3 frei, U5 nicht
  w.money = 1000;
  w.stock.cloth = 2;
  w.stock.rum = 0;
  return w;
};

describe('M11 Ausbau-Werte (Anhang 01 A.4)', () => {
  it('LEVELS: neun heutige Betriebe, Werte Anhang 01 A.4, ganzzahlig, Stufe 3 schneller als 2 (Vorstufe AK-P3-01)', () => {
    const T = (
      cycle: number,
      upkeep: number,
      m: number,
      h: number,
      wz: number,
      s: number,
      good: GoodId,
      amount: number,
    ) => ({
      cycle,
      upkeep,
      cost: { money: m, wood: h, tools: wz, stone: s },
      fee: { good, amount },
    });
    const want: Record<string, [LevelDef, LevelDef]> = {
      fisher: [T(24, 7, 50, 3, 1, 0, 'cloth', 2), T(16, 9, 75, 4, 2, 0, 'rum', 2)],
      lumberjack: [T(18, 7, 25, 0, 1, 0, 'cloth', 2), T(12, 9, 38, 0, 1, 0, 'rum', 2)],
      quarry: [T(36, 13, 75, 5, 2, 0, 'cloth', 2), T(24, 17, 113, 8, 3, 0, 'rum', 2)],
      sheepfarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
      canefarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
      weaver: [T(30, 20, 100, 8, 2, 0, 'cloth', 3), T(20, 26, 150, 12, 3, 0, 'rum', 3)],
      toolmaker: [T(48, 33, 100, 8, 2, 0, 'cloth', 3), T(32, 43, 150, 12, 3, 0, 'rum', 3)],
      distillery: [T(30, 26, 125, 8, 2, 3, 'cloth', 3), T(20, 34, 188, 12, 3, 4, 'rum', 3)],
      glassworks: [T(30, 33, 150, 10, 3, 5, 'cloth', 3), T(20, 43, 225, 15, 5, 8, 'rum', 3)],
    };
    for (const [id, lv] of Object.entries(want))
      expect(LEVELS[id as BuildingDefId], id).toEqual(lv);
    for (const lv of Object.values(LEVELS)) {
      expect(lv![1].cycle).toBeLessThan(lv![0].cycle);
      for (const n of [lv![0].cycle, lv![0].upkeep, lv![1].cycle, lv![1].upkeep])
        expect(Number.isInteger(n)).toBe(true);
    }
  });
});

describe('M11 Ausbau (Spec 3.6)', () => {
  it('AK-P3-02 Fischer Stufe 1 → 2: Kosten und Gebühr gebucht, cycleOf 24, upkeepOf 7, Bilanz und Unterhalt folgen', () => {
    const w = world();
    const f = fisherAt(w);
    const s = { ...w.stock };
    const up = totalUpkeep(w);
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
    expect([
      w.money,
      s.wood - w.stock.wood,
      s.tools - w.stock.tools,
      s.cloth - w.stock.cloth,
    ]).toEqual([950, 3, 1, 2]);
    expect([f.level, cycleOf(f), upkeepOf(f)]).toEqual([2, 24, 7]);
    expect(goodsBalance(w).food.produced).toBeCloseTo(100 / 24, 9);
    expect(totalUpkeep(w) - up).toBe(2);
  });
  it('AK-P3-03 sieben Gründe in Reihenfolge; bei fail bleibt die Welt gleich', () => {
    const w = world();
    const f = fisherAt(w);
    const no = (id: number, reason: string) => {
      const before = serialize(w);
      expect(upgradeBuilding(w, id)).toEqual({ ok: false, reason });
      expect(serialize(w)).toBe(before);
    };
    // Ausgangslage: jede spätere Bedingung verletzt, dann Schritt für Schritt heilen
    w.unlocked = ['U0'];
    f.outageUntil = w.tick + 100;
    f.state = 'burning';
    w.money = 0;
    w.stock.cloth = 0;
    no(9999, 'Gebäude nicht gefunden'); // (1)
    no(w.kontorId, 'Kann nicht ausgebaut werden'); // (2) kein LEVELS-Eintrag
    f.level = 3;
    no(f.id, 'Höchste Stufe erreicht'); // (3)
    delete f.level;
    no(f.id, 'Erst mit den ersten Siedlern'); // (4) functionLock 'upgrade2' → U3-lockText
    w.unlocked = ['U0', 'U2', 'U3'];
    no(f.id, 'Gebäude brennt'); // (5)
    delete f.outageUntil;
    f.state = 'ok';
    no(f.id, 'Zu wenig Geld'); // (6) checkAfford
    w.money = 1000;
    no(f.id, 'Zu wenig Stoff'); // (7) Gebühr Stufe 2
    w.stock.cloth = 2;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    no(f.id, 'Zu wenig Rum'); // (7) Gebühr Stufe 3
  });
  it('AK-P3-04 Ausbau bei progress 30: nächster Schritt +1 Nahrung, progress 0', () => {
    const w = world();
    const f = fisherAt(w);
    f.progress = 30;
    w.stock.food = 0;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(f.progress).toBe(30); // progress bleibt beim Ausbau
    step(w);
    expect([w.stock.food, f.progress]).toEqual([1, 0]);
  });
  it('AK-UNL-03 Ausbau vor U3 → U3-lockText; Stufe 2 → 3 vor U5 → U5-lockText', () => {
    const w = world();
    const f = fisherAt(w);
    w.unlocked = ['U0', 'U2'];
    expect(upgradeBuilding(w, f.id)).toEqual({
      ok: false,
      reason: unlockText(UNLOCKS[3]!, 'lockText'),
    });
    w.unlocked = ['U0', 'U2', 'U3'];
    f.level = 2;
    w.stock.rum = 5;
    expect(upgradeBuilding(w, f.id)).toEqual({
      ok: false,
      reason: unlockText(UNLOCKS[5]!, 'lockText'),
    });
  });
});

describe('M11 Ausbau: Abriss, Freischaltung, Brand (Spec 3.6, 4)', () => {
  it('AK-P3-05 Abriss Fischer Stufe 3: +112 Geld, +6 Holz, +2 Werkzeug; Stoff und Rum unverändert', () => {
    const w = world();
    const f = fisherAt(w);
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    w.stock.rum = 2;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(paidCost(f)).toEqual({ money: 225, wood: 12, tools: 5, stone: 0 });
    const m = w.money,
      s = { ...w.stock };
    expect(demolish(w, f.id).ok).toBe(true);
    expect([w.money - m, w.stock.wood - s.wood, w.stock.tools - s.tools]).toEqual([112, 6, 2]);
    expect([w.stock.cloth, w.stock.rum]).toEqual([s.cloth, s.rum]);
  });
  it('AK-P3-06 Brand: Stufe bleibt; Ausbau während des Ausfalls → „Gebäude brennt"; nach dem Ausfall Stufe 2', () => {
    const w = world();
    const f = fisherAt(w);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    beginCrisis(w, 0, { kind: 'fire', tile: { x: f.x, y: f.y } }); // keine Feuerwache: brennt
    expect([f.state, f.level]).toEqual(['burning', 2]);
    w.stock.cloth = 2;
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: false, reason: 'Gebäude brennt' });
    for (let i = 0; i <= FIRE_OUTAGE; i++) step(w);
    expect([f.outageUntil, f.level]).toEqual([undefined, 2]);
  });
  it('AK-UNL-04 deriveUnlocks: Fischer Stufe 2 ohne Häuser → U3, nicht U2; Stufe 3 → U5', () => {
    const w = createWorld(3);
    const f = fisherAt(w);
    f.level = 2;
    expect(deriveUnlocks(w)).toEqual(['U0', 'U3']);
    f.level = 3;
    expect(deriveUnlocks(w)).toEqual(['U0', 'U3', 'U5']);
  });
  it('RF-5 Ausbau im Sturm und bei noForest: Kosten und Gebühr gebucht, eff und state unberührt', () => {
    const w = world();
    const f = fisherAt(w);
    w.crisis = { period: 0, kind: 'storm', from: w.tick, until: w.tick + 300 };
    f.eff = 123456; // Feld seit T01, Akkumulator kommt erst mit T06
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect([f.level, f.eff, f.state, w.money]).toEqual([2, 123456, 'ok', 950]);
    const l: Building = {
      id: w.nextBuildingId++,
      defId: 'lumberjack',
      x: 1,
      y: 0,
      connected: true,
      progress: 7,
      state: 'noForest',
      eff: 1000,
    };
    w.buildings[l.id] = l;
    w.stock.cloth = 2;
    expect(upgradeBuilding(w, l.id).ok).toBe(true);
    expect([l.level, l.state, l.eff, l.progress, w.stock.cloth]).toEqual([
      2,
      'noForest',
      1000,
      7,
      0,
    ]);
  });
});
