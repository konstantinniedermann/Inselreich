import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { levelChecks } from '../../src/sim/levelChecks';
import { runningLevel } from '../../src/sim/levelRules';
import { createWorld, idx, home } from '../../src/sim/world';
import { totalUpkeep } from '../../src/sim/economy';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { paidCost, upgradeBuilding } from '../../src/sim/upgrade';
import { demolish } from '../../src/sim/build';
import { beginCrisis } from '../../src/sim/crises';
import { FIRE_OUTAGE } from '../../src/sim/defs/timing';
import { LEVELS } from '../../src/sim/defs/levels';
import { UNLOCKS } from '../../src/sim/defs/unlocks';
import { cycleOf, upkeepOf, utilization } from '../../src/sim/levels';
import { goodsBalance } from '../../src/sim/queries';
import { deriveUnlocks, unlockText } from '../../src/sim/unlocks';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { meetLevel, putBuilding, twoIslandWorld } from './helpers';

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
    island: 0,
  };
  w.buildings[b.id] = b;
  home(w).tiles[idx(home(w), x, y)]!.buildingId = b.id;
  return b;
}
/** Erfüllt Fachkräfte und Standort der nächsten Stufe (Ausbau prüft sie seit T05). */
function readyForNext(w: World, b: Building): void {
  const g = b.level ?? 1;
  b.level = (g + 1) as 2 | 3;
  meetLevel(w, b);
  if (g === 1) delete b.level;
  else b.level = g as 2 | 3;
}
const world = (): World => {
  const w = createWorld(3);
  w.unlocked = ['U0', 'U2', 'U3']; // U3 frei, U5 nicht
  w.money = 1000;
  home(w).stock.cloth = 2;
  home(w).stock.rum = 0;
  return w;
};

describe('M11 Ausbau-Werte (Anhang 01 A.4)', () => {
  it('LEVELS: elf Betriebe, ganzzahlig, Stufe 3 schneller als 2 (Werte im Detail: levelRules.test.ts)', () => {
    expect(Object.keys(LEVELS)).toHaveLength(11);
    for (const lv of Object.values(LEVELS)) {
      expect(lv![1]!.cycle).toBeLessThan(lv![0]!.cycle);
      for (const n of [lv![0]!.cycle, lv![0]!.upkeep, lv![1]!.cycle, lv![1]!.upkeep])
        expect(Number.isInteger(n)).toBe(true);
    }
  });
});

describe('M11 Ausbau (Spec 3.6)', () => {
  it('AK-P3-02 Fischer Stufe 1 → 2: Kosten und Gebühr gebucht, cycleOf 24, upkeepOf 7, Bilanz und Unterhalt folgen', () => {
    const w = world();
    const f = fisherAt(w);
    const s = { ...home(w).stock };
    const up = totalUpkeep(w);
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
    expect([
      w.money,
      s.wood - home(w).stock.wood,
      s.tools - home(w).stock.tools,
      s.cloth - home(w).stock.cloth,
    ]).toEqual([950, 3, 1, 2]);
    expect([f.level, cycleOf(w, f), upkeepOf(f)]).toEqual([2, 24, 7]);
    expect(goodsBalance(w).food.produced).toBeCloseTo(100 / 24, 9);
    expect(totalUpkeep(w) - up).toBe(2);
  });
  it('AK-P3-03 sieben Gründe in Reihenfolge; bei fail bleibt die Welt gleich', () => {
    const w = world();
    const f = fisherAt(w);
    readyForNext(w, f); // Fachkräfte und Standort halten; die Reihenfolge davor prüft AK-AL-04
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
    home(w).stock.cloth = 0;
    no(9999, 'Gebäude nicht gefunden'); // (1)
    no(home(w).kontorId, 'Kann nicht ausgebaut werden'); // (2) kein LEVELS-Eintrag
    f.level = 3;
    no(f.id, 'Höchste Stufe erreicht'); // (3)
    delete f.level;
    no(f.id, 'Erst mit den ersten Siedlern'); // (4) functionLock 'upgrade2' → U3-lockText
    w.unlocked = ['U0', 'U2', 'U3'];
    no(f.id, 'Gebäude brennt'); // (5)
    delete f.outageUntil;
    f.state = 'ok';
    no(f.id, 'Zu wenig Geld (0 / 50)'); // (6) Geldzeile
    w.money = 1000;
    no(f.id, 'Zu wenig Stoff (0 / 2)'); // (7) Ware Stufe 2
    home(w).stock.cloth = 2;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    readyForNext(w, f);
    home(w).stock.stone = 2;
    no(f.id, 'Zu wenig Stoff (0 / 2)'); // (7) Ware Stufe 3 (Stoff 0, kein Rum mehr)
  });
  it('AK-P3-04 Ausbau bei progress 30: nächster Schritt +1 Nahrung, progress 0', () => {
    const w = world();
    const f = fisherAt(w);
    f.progress = 30;
    home(w).stock.food = 0;
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(f.progress).toBe(30); // progress bleibt beim Ausbau
    step(w);
    expect([home(w).stock.food, f.progress]).toEqual([1, 0]);
  });
  it('AK-UNL-03 Ausbau vor U3 → U3-lockText; Stufe 2 → 3 vor U5 → U5-lockText', () => {
    const w = world();
    const f = fisherAt(w);
    w.unlocked = ['U0', 'U2'];
    expect(upgradeBuilding(w, f.id)).toEqual({
      ok: false,
      reason: unlockText(w, UNLOCKS[3]!, 'lockText'),
    });
    w.unlocked = ['U0', 'U2', 'U3'];
    f.level = 2;
    home(w).stock.rum = 5;
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id)).toEqual({
      ok: false,
      reason: unlockText(w, UNLOCKS[5]!, 'lockText'),
    });
  });
});

describe('M11 Ausbau: Abriss, Freischaltung, Brand (Spec 3.6, 4)', () => {
  it('AK-P3-05 Abriss Fischer Stufe 3: +107 Geld, +6 Holz, +2 Werkzeug, +1 Stein; Stoff und Rum unverändert', () => {
    const w = world();
    const f = fisherAt(w);
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    home(w).stock.cloth = 4;
    home(w).stock.stone = 2;
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(paidCost(f)).toEqual({ money: 215, wood: 12, tools: 5, stone: 2 });
    const m = w.money,
      s = { ...home(w).stock };
    expect(demolish(w, f.id).ok).toBe(true);
    expect([
      w.money - m,
      home(w).stock.wood - s.wood,
      home(w).stock.tools - s.tools,
      home(w).stock.stone - s.stone,
    ]).toEqual([107, 6, 2, 1]);
    expect([home(w).stock.cloth, home(w).stock.rum]).toEqual([s.cloth, s.rum]);
  });
  it('AK-P3-06 Brand: Stufe bleibt; Ausbau während des Ausfalls → „Gebäude brennt"; nach dem Ausfall Stufe 2', () => {
    const w = world();
    const f = fisherAt(w);
    readyForNext(w, f);
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    beginCrisis(w, 0, { kind: 'fire', tile: { x: f.x, y: f.y } }); // keine Feuerwache: brennt
    expect([f.state, f.level]).toEqual(['burning', 2]);
    home(w).stock.cloth = 2;
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
  it('RF-5 Ausbau im Sturm und bei noForest: Kosten und Ware gebucht, eff und state unberührt', () => {
    const w = world();
    const f = fisherAt(w);
    w.crisis = { period: 0, kind: 'storm', from: w.tick, until: w.tick + 300 };
    f.eff = 123456; // Feld seit T01, Akkumulator kommt erst mit T06
    readyForNext(w, f);
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
      island: 0,
      eff: 1000,
    };
    w.buildings[l.id] = l;
    home(w).stock.cloth = 2;
    readyForNext(w, l);
    expect(upgradeBuilding(w, l.id).ok).toBe(true);
    expect([l.level, l.state, l.eff, l.progress, home(w).stock.cloth]).toEqual([
      2,
      'noForest',
      1000,
      7,
      2, // Holzfäller verlangt keine fachliche Ware: Stoff bleibt
    ]);
  });
});

describe('M11 Kette und Auslastung (Spec 10)', () => {
  it('AK-P3-07 Weberei Stufe 2, Schäferei Stufe 1, Wolle 0: in 600 Schritten mindestens einmal waitingInput, utilization < 1000', () => {
    const w = createWorld(3, { unlockAll: true });
    const put = (defId: BuildingDefId, x: number): Building => {
      const b: Building = {
        id: w.nextBuildingId++,
        defId,
        x,
        y: 5,
        connected: true,
        progress: 0,
        state: 'ok',
        island: 0,
      };
      w.buildings[b.id] = b;
      return b;
    };
    put('sheepfarm', 0);
    const weaver = put('weaver', 3);
    weaver.level = 2;
    home(w).stock.wool = 0;
    let waited = false;
    for (let i = 0; i < 600; i++) {
      step(w);
      if (weaver.state === 'waitingInput') waited = true;
    }
    expect(waited).toBe(true);
    expect(utilization(weaver)).toBeLessThan(1000);
  });
});

describe('AK-AL-05 Ausbau bucht Geld, Baustoff und fachliche Ware (Stufe 2/3)', () => {
  const reich = (): World => {
    const w = createWorld(3, { unlockAll: true, crisisLevel: 'off' });
    w.money = 100000;
    for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 500;
    return w;
  };
  const betriebAt = (w: World, defId: BuildingDefId): Building => {
    const b = fisherAt(w, 20, 20); // Inselmitte: der Standortradius liegt ganz auf der Karte
    b.defId = defId;
    return b;
  };
  it('Fischer 2 → 3 bucht genau 65 Geld, 4 Holz, 2 Wz, 2 Stein, 2 Stoff; progress, eff, state bleiben', () => {
    const w = reich();
    const f = fisherAt(w);
    f.level = 2;
    f.progress = 17;
    f.eff = 4321;
    readyForNext(w, f);
    const s = { ...home(w).stock };
    const m = w.money;
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
    const st = home(w).stock;
    expect([
      m - w.money,
      s.wood - st.wood,
      s.tools - st.tools,
      s.stone - st.stone,
      s.cloth - st.cloth,
    ]).toEqual([65, 4, 2, 2, 2]);
    expect([f.level, f.progress, f.eff, f.state]).toEqual([3, 17, 4321, 'ok']);
  });
  const faelle = Object.keys(LEVELS).flatMap((id) => [1, 2].map((von) => [id, von] as const));
  it.each(faelle)('%s Ausbau von Stufe %i lässt den Rum-Bestand unberührt', (id, von) => {
    const w = reich();
    const b = betriebAt(w, id as BuildingDefId);
    if (von === 2) b.level = 2;
    const rum = home(w).stock.rum;
    readyForNext(w, b);
    expect(upgradeBuilding(w, b.id)).toEqual({ ok: true });
    expect(home(w).stock.rum).toBe(rum);
    expect(b.level).toBe(von + 1);
  });
});

describe('AUSBAU-LOGIK T05 Ausbau prüft in einer Reihenfolge (R7, N3)', () => {
  /** Leere Heimat (alles Wasser ausser Gebäuden), Fischer g 2 mit Bürgerhaus und vollem Lager: Ausbau auf 3 geht. */
  function bereit(): { w: World; f: Building } {
    const w = createWorld(3, { unlockAll: true, crisisLevel: 'off' });
    for (const t of home(w).tiles) if (t.buildingId === null) t.terrain = 'water';
    w.money = 812;
    Object.assign(home(w).stock, { wood: 10, tools: 5, stone: 5, cloth: 14 });
    const f = putBuilding(w, 0, 'fisher', 20, 20);
    f.level = 3;
    meetLevel(w, f);
    f.level = 2;
    return { w, f };
  }
  const gescheitert = (w: World, id: number, reason: string): void => {
    const before = JSON.stringify(w);
    expect(upgradeBuilding(w, id)).toEqual({ ok: false, reason });
    expect(JSON.stringify(w)).toBe(before);
  };

  it('Grundwelt: alles erfüllt, Ausbau gelingt', () => {
    const { w, f } = bereit();
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
    expect(f.level).toBe(3);
  });
  it('AK-AL-04 je Schritt scheitert genau dieser zuerst, Welt unverändert', () => {
    const faelle: [string, (w: World, f: Building) => void, string | ((w: World) => string)][] = [
      [
        'Wissen',
        (w) => {
          w.unlocked = ['U0', 'U2', 'U3'];
        },
        (w) => unlockText(w, UNLOCKS[5]!, 'lockText'),
      ],
      [
        'Brand',
        (_w, f) => {
          f.outageUntil = 99;
        },
        'Gebäude brennt',
      ],
      [
        'Fachkräfte',
        (w) => {
          for (const b of Object.values(w.buildings)) if (b.house !== undefined) b.house.tier = 2;
        },
        'Keine Meister im Umkreis 8 (kein Bürgerhaus auf dieser Insel)',
      ],
      [
        'Standort',
        (w) => {
          putBuilding(w, 0, 'fisher', 22, 20);
          putBuilding(w, 0, 'fisher', 22, 21);
        },
        'Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 3 (erlaubt 1)',
      ],
      [
        'Geld',
        (w) => {
          w.money = 10;
        },
        'Zu wenig Geld (10 / 65)',
      ],
      [
        'Holz',
        (w) => {
          home(w).stock.wood = 0;
        },
        'Zu wenig Holz (0 / 4)',
      ],
      [
        'Werkzeug',
        (w) => {
          home(w).stock.tools = 0;
        },
        'Zu wenig Werkzeug (0 / 2)',
      ],
      [
        'Stein',
        (w) => {
          home(w).stock.stone = 0;
        },
        'Zu wenig Stein (0 / 2)',
      ],
      [
        'Ware',
        (w) => {
          home(w).stock.cloth = 1;
        },
        'Zu wenig Stoff (1 / 2)',
      ],
    ];
    for (const [name, setze, erwartet] of faelle) {
      const { w, f } = bereit();
      setze(w, f);
      const reason = typeof erwartet === 'function' ? erwartet(w) : erwartet;
      const before = JSON.stringify(w);
      const r = upgradeBuilding(w, f.id);
      expect([name, r.ok]).toEqual([name, false]);
      const got = r.ok ? '' : r.reason;
      expect([name, got]).toEqual([name, reason]);
      expect(JSON.stringify(w)).toBe(before);
    }
  });
  it('AK-AL-04 gedrosselter Betrieb wartet nicht auf eine Neuberechnung (g 2, k 1)', () => {
    const w = createWorld(3, { unlockAll: true, crisisLevel: 'off' });
    for (const t of home(w).tiles) if (t.buildingId === null) t.terrain = 'water';
    w.money = 812;
    Object.assign(home(w).stock, { wood: 10, tools: 5, stone: 5, cloth: 14 });
    const f = putBuilding(w, 0, 'fisher', 20, 20);
    const n1 = putBuilding(w, 0, 'fisher', 21, 20);
    putBuilding(w, 0, 'fisher', 22, 20);
    f.level = 3;
    meetLevel(w, f);
    f.level = 2;
    expect(runningLevel(w, f)).toBe(1);
    expect(demolish(w, n1.id).ok).toBe(true);
    expect(runningLevel(w, f)).toBe(2);
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
  });
  it('AK-AL-04 upgrade.ts ruft runningLevel nicht auf', () => {
    expect(readFileSync('src/sim/upgrade.ts', 'utf8')).not.toContain('runningLevel');
  });
  it('AK-AL-18 brennender Betrieb: «Gebäude brennt», Welt unverändert', () => {
    const { w, f } = bereit();
    f.outageUntil = w.tick + 50;
    f.state = 'burning';
    gescheitert(w, f.id, 'Gebäude brennt');
  });
  it('AK-AL-21 Steinbruch auf Kolonie ohne Wohnhaus; Kontor ändert nichts', () => {
    const w = twoIslandWorld();
    w.money = 1000;
    const q = putBuilding(w, 1, 'quarry', 20, 20);
    const text = 'Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)';
    gescheitert(w, q.id, text);
    putBuilding(w, 1, 'kontor', 24, 24);
    gescheitert(w, q.id, text);
  });
  it('AK-AL-37 erster Grund gleich bei mehreren verletzten Bedingungen', () => {
    const welten: ((w: World, f: Building) => void)[] = [
      (w) => {
        for (const b of Object.values(w.buildings)) if (b.house !== undefined) b.house.tier = 1;
        w.money = 0;
      },
      (w) => {
        putBuilding(w, 0, 'fisher', 22, 20);
        putBuilding(w, 0, 'fisher', 22, 21);
        home(w).stock.cloth = 0;
      },
      (w, f) => {
        f.outageUntil = 99;
        for (const b of Object.values(w.buildings)) if (b.house !== undefined) b.house.tier = 1;
      },
      (w) => {
        w.unlocked = ['U0', 'U2', 'U3'];
        home(w).stock.stone = 0;
      },
    ];
    for (const setze of welten) {
      const { w, f } = bereit();
      setze(w, f);
      const rows = levelChecks(w, f, 3);
      expect(rows.filter((c) => !c.ok).length).toBeGreaterThanOrEqual(2);
      const r = upgradeBuilding(w, f.id);
      expect(r.ok ? '' : r.reason).toBe(rows.find((c) => !c.ok)!.text);
    }
  });
});
