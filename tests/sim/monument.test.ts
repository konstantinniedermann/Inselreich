import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { demolish, placeRoad, removeRoad } from '../../src/sim/build';
import { step } from '../../src/sim/tick';
import { fireTarget } from '../../src/sim/crises';
import { createRng } from '../../src/sim/rng';
import { deserialize } from '../../src/sim/save';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { buyMonumentUnit, buyPrice } from '../../src/sim/trade';
import {
  isMonumentGood,
  monumentLock,
  monumentProgress,
  monumentReserve,
  monumentStartReason,
  newMonument,
  setMonumentBuy,
  tickMonument,
  setMonumentPaused,
  startMonumentStage,
} from '../../src/sim/monument';
import { canPlace, siteRuleOk } from '../../src/sim/placement';
import { needsConnection, recomputeConnectivity } from '../../src/sim/roads';
import { serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { buildEntries } from '../../src/ui/buildMenu';
import { HOME, home, tileAt } from '../../src/sim/world';
import { MONUMENT_GOODS, MONUMENT_STAGES } from '../../src/sim/defs/monument';
import { placeBuilding } from '../../src/sim/build';
import {
  forceRect,
  houseFar,
  placeTownhall,
  putBuilding,
  setHouse,
  twoIslandWorld,
  village,
} from './helpers';
import {
  MONUMENT_AT,
  monumentWorld,
  placeMonument,
  monumentRunWorld,
  runningMonument,
  villageMonument,
} from './monumentHelpers';

vi.mock('../../src/sim/rng', async (orig) => {
  const m = await orig<typeof import('../../src/sim/rng')>();
  return { ...m, createRng: vi.fn(m.createRng) };
});

describe('AK-M13E2-03 Freischaltung', () => {
  const LOCK = 'Erst nach dem Kaufleute-Ziel';
  const { x, y } = MONUMENT_AT;

  it('nennt vor dem Kaufleute-Ziel den Sperrgrund, auch auf Wasser und belegtem Boden', () => {
    const w = monumentWorld();
    w.wonMerchants = false;
    expect(canPlace(w, 'monument', x, y)).toEqual({ ok: false, reason: LOCK });
    forceRect(w, x, y, 3, 3, 'water');
    expect(canPlace(w, 'monument', x, y)).toEqual({ ok: false, reason: LOCK });
    expect(canPlace(w, 'monument', 32, 31)).toEqual({ ok: false, reason: LOCK });
  });

  it('zeigt das Denkmal nur nach dem Ziel und nur auf der Heimatinsel', () => {
    const w = monumentWorld();
    const unlockedBefore = [...w.unlocked];
    w.wonMerchants = false;
    expect(buildEntries(w, 'public', HOME)).not.toContain('monument');
    w.wonMerchants = true;
    expect(canPlace(w, 'monument', x, y).ok).toBe(true);
    expect(buildEntries(w, 'public', HOME)).toContain('monument');
    expect(buildEntries(w, 'public', 1)).not.toContain('monument');
    expect(w.unlocked).toEqual(unlockedBefore);
  });

  it('Standortregel home: nur auf der Heimatinsel', () => {
    const w = monumentWorld();
    expect(siteRuleOk(w, 'monument', x, y, { kind: 'home' }, 1)).toEqual({
      ok: false,
      reason: 'Nur auf der Heimatinsel',
    });
    expect(siteRuleOk(w, 'monument', x, y, { kind: 'home' }, HOME).ok).toBe(true);
  });
});

/** Welt mit gebautem Denkmal (R1.4: placeBuilding setzt world.monument). */
function builtWorld(): { w: World; id: number } {
  const w = monumentWorld();
  const id = placeMonument(w);
  return { w, id };
}

describe('AK-M13E2-04 Bauplatz', () => {
  const { x, y } = MONUMENT_AT;

  it('baut für 500 Geld, 10 Holz, 10 Stein und setzt world.monument', () => {
    const w = monumentWorld();
    const stock = home(w).stock;
    const before = { money: w.money, wood: stock.wood, stone: stock.stone };
    const r = placeBuilding(w, 'monument', x, y);
    expect(r.ok).toBe(true);
    const id = r.id!;
    expect(w.money).toBe(before.money - 500);
    expect(stock.wood).toBe(before.wood - 10);
    expect(stock.stone).toBe(before.stone - 10);
    for (let dy = 0; dy < 3; dy++)
      for (let dx = 0; dx < 3; dx++) expect(tileAt(home(w), x + dx, y + dy)!.buildingId).toBe(id);
    expect(w.monument).toEqual(newMonument(id));
    expect(Object.keys(w.monument!)).toEqual([
      'buildingId',
      'stage',
      'running',
      'delivered',
      'paused',
      'buy',
    ]);
    expect(w.monument).toEqual({
      buildingId: id,
      stage: 0,
      running: false,
      delivered: { stone: 0, tools: 0, glass: 0, spice: 0 },
      paused: false,
      buy: { stone: false, tools: false, glass: false, spice: false },
    });
  });

  it('lehnt ein zweites Denkmal ab, auch nach monumentDone', () => {
    const { w } = builtWorld();
    const reason = 'Es gibt schon ein Denkmal';
    expect(canPlace(w, 'monument', x + 10, y)).toEqual({ ok: false, reason });
    w.monumentDone = true;
    expect(placeBuilding(w, 'monument', x + 10, y)).toEqual({ ok: false, reason });
  });

  it('Fremdinsel: mit Kontor "Nur auf der Heimatinsel", ohne Kontor "Erst ein Kontor"', () => {
    const w = twoIslandWorld();
    w.wonMerchants = true;
    expect(canPlace(w, 'monument', x, y, 1)).toEqual({
      ok: false,
      reason: 'Nur auf der Heimatinsel',
    });
    w.islands[1]!.kontorId = null;
    expect(canPlace(w, 'monument', x, y, 1)).toEqual({
      ok: false,
      reason: 'Erst ein Kontor auf dieser Insel',
    });
  });

  it('Versorgung: kx + 8 ausserhalb, kx + 7 ok', () => {
    const w = monumentWorld();
    const kx = w.buildings[home(w).kontorId]!.x;
    forceRect(w, kx + 8, y, 3, 3, 'grass');
    expect(canPlace(w, 'monument', kx + 8, y)).toEqual({
      ok: false,
      reason: 'Ausserhalb der Versorgung',
    });
    expect(canPlace(w, 'monument', kx + 7, y).ok).toBe(true);
    expect(kx + 7).toBe(x);
  });
});

describe('AK-M13E2-05 3x3 und Anbindung', () => {
  const { x, y } = MONUMENT_AT;

  it('belegte Kachel in der dritten Zeile oder Spalte gibt den Bodengrund', () => {
    for (const [dx, dy] of [
      [1, 2],
      [2, 1],
    ] as const) {
      const w = monumentWorld();
      tileAt(home(w), x + dx, y + dy)!.road = true;
      expect(canPlace(w, 'monument', x, y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    }
  });

  /** Fester Weg ab Kontor (Zeile 29), Zweig bis zur Kachel (tx, ty); danach neu berechnen. */
  function connectedAt(tx: number, ty: number, place: boolean): World {
    const w = monumentWorld();
    const h = home(w);
    tileAt(h, x - 1, y + 1)!.road = false;
    forceRect(w, 30, 28, 16, 10, 'grass');
    const lay = (px: number, py: number): void => {
      tileAt(h, px, py)!.road = true;
    };
    lay(32, 30);
    for (let px = 32; px <= 43; px++) lay(px, 29);
    if (place) placeMonument(w);
    if (tx === x - 1) for (let py = 29; py <= ty; py++) lay(x - 2, py);
    if (tx === x + 3) for (let py = 29; py <= ty; py++) lay(x + 4, py);
    if (ty === y + 3) {
      for (let py = 29; py <= 35; py++) lay(x + 4, py);
      for (let px = x; px <= x + 4; px++) lay(px, 35);
    }
    lay(tx, ty);
    recomputeConnectivity(w);
    return w;
  }

  const border: [number, number][] = [];
  for (let d = 0; d < 3; d++) {
    border.push([x + d, y - 1], [x + d, y + 3], [x - 1, y + d], [x + 3, y + d]);
  }

  it('Weg an jeder der zwölf Randkacheln bindet an', () => {
    expect(border).toHaveLength(12);
    for (const [bx, by] of border) {
      const w = connectedAt(bx, by, true);
      const m = Object.values(w.buildings).find((b) => b.defId === 'monument')!;
      expect(m.connected, `${bx},${by}`).toBe(true);
    }
  });

  it('Weg nur diagonal an der Ecke bindet nicht an', () => {
    const w = connectedAt(x - 1, y - 1, true);
    const m = Object.values(w.buildings).find((b) => b.defId === 'monument')!;
    expect(m.connected).toBe(false);
  });

  it('braucht keine Anbindung und wird nie notConnected', () => {
    expect(needsConnection('monument')).toBe(false);
    const { w, id } = builtWorld();
    recomputeConnectivity(w);
    expect(w.buildings[id]!.state).toBe('ok');
  });
});

describe('AK-M13E2-06 Abschnitt starten', () => {
  it('Stufe 0 mit 4000 Geld startet, zieht alles ab und laeuft', () => {
    const { w } = builtWorld();
    w.money = 4000;
    w.monument!.delivered.stone = 5;
    expect(startMonumentStage(w)).toEqual({ ok: true });
    expect(w.money).toBe(0);
    expect(w.monument!.running).toBe(true);
    expect(w.monument!.delivered).toEqual({ stone: 0, tools: 0, glass: 0, spice: 0 });
    expect(MONUMENT_STAGES[0]!.money).toBe(4000);
    expect(startMonumentStage(w)).toEqual({ ok: false, reason: 'Abschnitt läuft' });
  });

  it('zu wenig Geld (auch negativ) aendert nichts', () => {
    for (const money of [3999, -50]) {
      const { w } = builtWorld();
      w.money = money;
      const before = serialize(w);
      expect(startMonumentStage(w)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
      expect(serialize(w)).toBe(before);
    }
  });

  it('ohne Denkmal und bei fertigem Denkmal', () => {
    const w = monumentWorld();
    expect(startMonumentStage(w)).toEqual({ ok: false, reason: 'Kein Denkmal' });
    expect(monumentStartReason(w)).toBe('Kein Denkmal');
    const b = builtWorld().w;
    b.monument!.stage = 3;
    expect(startMonumentStage(b)).toEqual({ ok: false, reason: 'Denkmal fertig' });
    expect(monumentStartReason(b)).toBe('Denkmal fertig');
  });

  it('Anbindung und Pause sind keine Bedingung', () => {
    const { w, id } = builtWorld();
    w.buildings[id]!.connected = false;
    w.monument!.paused = true;
    expect(monumentStartReason(w)).toBeNull();
    expect(startMonumentStage(w)).toEqual({ ok: true });
  });
});

describe('AK-M13E2-07 Aktionen werfen nie', () => {
  const goods = ['stone', 'wood', '', 0, null, undefined, {}];
  const values = [true, false, 'ja', 1, undefined];
  const snap = (w: World): string => serialize(w);

  it('Eingaben ergeben { ok, reason } ohne Wurf; bei Fehlern bleibt die Welt samt RNG-Seed gleich', () => {
    for (const withMonument of [false, true]) {
      const w = withMonument ? builtWorld().w : monumentWorld();
      const calls: [string, () => ReturnType<typeof startMonumentStage>][] = [
        ['start', () => startMonumentStage(w)],
      ];
      for (const v of values) calls.push(['pause', () => setMonumentPaused(w, v)]);
      for (const g of goods)
        for (const v of values) calls.push(['buy', () => setMonumentBuy(w, g, v)]);
      for (const [, call] of calls) {
        const before = snap(w);
        let r: ReturnType<typeof call> | undefined;
        expect(() => (r = call())).not.toThrow();
        expect(typeof r!.ok).toBe('boolean');
        if (!r!.ok) {
          expect(typeof r!.reason).toBe('string');
          expect(snap(w)).toBe(before);
        }
      }
    }
  });

  it('Gruende in der Reihenfolge von R4', () => {
    const w = monumentWorld();
    expect(setMonumentPaused(w, 'ja')).toEqual({ ok: false, reason: 'Kein Denkmal' });
    expect(setMonumentBuy(w, 'x', 'ja')).toEqual({ ok: false, reason: 'Kein Denkmal' });
    const b = builtWorld().w;
    expect(setMonumentPaused(b, 'ja')).toEqual({ ok: false, reason: 'Ungültiger Wert' });
    expect(setMonumentBuy(b, 'wood', 'ja')).toEqual({ ok: false, reason: 'Ungültiges Gut' });
    expect(setMonumentBuy(b, 'stone', 'ja')).toEqual({ ok: false, reason: 'Ungültiger Wert' });
    expect(setMonumentPaused(b, true)).toEqual({ ok: true });
    expect(setMonumentPaused(b, true)).toEqual({ ok: true });
    expect(b.monument!.paused).toBe(true);
    expect(setMonumentBuy(b, 'glass', true)).toEqual({ ok: true });
    expect(b.monument!.buy.glass).toBe(true);
    expect(isMonumentGood('spice')).toBe(true);
    expect(isMonumentGood('wood')).toBe(false);
  });
});

describe('AK-M13E2-15 Abriss', () => {
  it('erstattet wie jedes Gebaeude, setzt monument null, monumentDone bleibt', () => {
    for (const done of [true, false]) {
      const { w, id } = builtWorld();
      const m = w.monument!;
      m.stage = 1;
      m.running = true;
      m.delivered.stone = 17;
      w.monumentDone = done;
      const stock = home(w).stock;
      const before = { money: w.money, wood: stock.wood, stone: stock.stone, tools: stock.tools };
      expect(demolish(w, id)).toEqual({ ok: true });
      expect(w.monument).toBeNull();
      expect(w.monumentDone).toBe(done);
      expect(w.money).toBe(before.money + 250);
      expect(stock.wood).toBe(before.wood + 5);
      expect(stock.stone).toBe(before.stone + 5);
      expect(stock.tools).toBe(before.tools);
      expect(tileAt(home(w), MONUMENT_AT.x, MONUMENT_AT.y)!.buildingId).toBeNull();
      placeMonument(w);
      expect(w.monument!.stage).toBe(0);
      expect(w.monument!.running).toBe(false);
    }
  });
});

describe('AK-M13E2-09 Reserve', () => {
  const TABLE: [number, number][] = [
    [0, 20],
    [20, 20],
    [25, 20],
    [26, 21],
    [40, 32],
    [60, 48],
    [61, 49],
    [80, 64],
    [81, 65],
  ];

  it.each(TABLE)('%i Kaufleute in einem Haus: Glas und Gewürz %i', (n, expected) => {
    const { w, houses } = village(1);
    if (n > 0) setHouse(houses[0]!, 4, n);
    expect(monumentReserve(w, 'glass')).toBe(expected);
    expect(monumentReserve(w, 'spice')).toBe(expected);
    expect(monumentReserve(w, 'stone')).toBe(20);
    expect(monumentReserve(w, 'tools')).toBe(20);
  });

  it.each(TABLE)('%i Kaufleute auf Häuser verteilt: Reserve %i', (n, expected) => {
    const { w, houses } = village(9);
    houses.forEach((h, i) => setHouse(h, 4, Math.floor(n / 9) + (i < n % 9 ? 1 : 0)));
    expect(houses.reduce((s, h) => s + h.house!.inhabitants, 0)).toBe(n);
    expect(monumentReserve(w, 'glass')).toBe(expected);
  });

  it('80 Kaufleute auf viele Häuser (Summenfolge) ergeben 64, nicht 65', () => {
    const { w, houses } = village(16);
    const parts = [1, 9, 3, 7, 2, 8, 6, 4, 5, 5, 7, 3, 9, 1, 4, 6];
    parts.forEach((p, i) => setHouse(houses[i]!, 4, p));
    expect(parts.reduce((a, b) => a + b, 0)).toBe(80);
    expect(monumentReserve(w, 'glass')).toBe(64);
    expect(monumentReserve(w, 'spice')).toBe(64);
  });

  it('zählt unversorgte Häuser nicht', () => {
    const { w, houses } = village(1);
    setHouse(houses[0]!, 4, 40);
    const far = houseFar(w);
    setHouse(far, 4, 200);
    expect(monumentReserve(w, 'glass')).toBe(32);
  });

  it('zählt Häuser auf einer Fremdinsel nicht', () => {
    const w = twoIslandWorld();
    const k = w.buildings[home(w).kontorId]!;
    setHouse(putBuilding(w, 1, 'house', k.x + 3, k.y), 4, 200);
    setHouse(putBuilding(w, HOME, 'house', k.x + 3, k.y), 4, 40);
    expect(monumentReserve(w, 'glass')).toBe(32);
  });

  it('lässt die Stein-Reserve von einer Glashütte unberührt', () => {
    const { w, houses } = village(1);
    setHouse(houses[0]!, 4, 100);
    const k = w.buildings[home(w).kontorId]!;
    putBuilding(w, HOME, 'glassworks', k.x + 2, k.y + 4);
    expect(monumentReserve(w, 'stone')).toBe(20);
    expect(monumentReserve(w, 'tools')).toBe(20);
  });

  it('monumentLock liefert für alle vier Güter 0', () => {
    const w = monumentWorld();
    for (const g of MONUMENT_GOODS) expect(monumentLock(w, g)).toBe(0);
  });
});

describe('monumentProgress', () => {
  it('ist 0 ohne laufenden Abschnitt', () => {
    const w = monumentWorld();
    placeMonument(w);
    expect(monumentProgress(w)).toBe(0);
  });

  it('rundet Σ geliefert / Σ Soll ab: 414 von 520 sind 79 Prozent', () => {
    const w = monumentWorld();
    placeMonument(w);
    const m = w.monument!;
    m.stage = 1; // Soll 200 + 80 + 140 + 100 = 520
    m.running = true;
    m.delivered = { stone: 200, tools: 80, glass: 100, spice: 34 };
    expect(monumentProgress(w)).toBe(79);
  });
});

const GOOD4 = MONUMENT_GOODS;
const stepTo = (w: World, tick: number): void => {
  while (w.tick < tick) step(w);
};
/** Zukaufpreis im Zug-Tick `tick`: Geld-Unterschied zum Zwilling ohne Zukauf-Schalter, nur dieser Tick. */
const paidAt = (w: World, twin: World, tick: number): number => {
  stepTo(w, tick - 1);
  stepTo(twin, tick - 1);
  const before = twin.money - w.money;
  step(w);
  step(twin);
  return twin.money - w.money - before;
};
const buyTwin = (prep: (w: World) => void): [World, World] => {
  const w = runningMonument().w;
  const twin = runningMonument().w;
  for (const x of [w, twin]) prep(x);
  w.monument!.buy.stone = true;
  return [w, twin];
};
const stock = (w: World) => home(w).stock;
const goal = (stage: number) => MONUMENT_STAGES[stage]!.goods;

describe('AK-M13E2-08 Zug aus dem Lager', () => {
  it('zieht alle 10 Ticks ein Stück Stein über der Reserve', () => {
    const { w } = runningMonument();
    stock(w).stone = 23;
    const seen: [number, number, number][] = [];
    for (let t = 1001; t <= 1040; t++) {
      step(w);
      seen.push([t, stock(w).stone, w.monument!.delivered.stone]);
    }
    const at = (t: number) => seen.find((r) => r[0] === t)!;
    expect(at(1009)).toEqual([1009, 23, 0]);
    expect(at(1010)).toEqual([1010, 22, 1]);
    expect(at(1019)).toEqual([1019, 22, 1]);
    expect(at(1020)).toEqual([1020, 21, 2]);
    expect(at(1030)).toEqual([1030, 20, 3]);
    expect(at(1040)).toEqual([1040, 20, 3]);
  });

  it('Start bei Tick 1005: erster Zug bei 1010', () => {
    const w = runningMonument().w;
    w.monument!.running = false;
    w.tick = 1005;
    w.monument!.running = true;
    stock(w).stone = 23;
    stepTo(w, 1009);
    expect(w.monument!.delivered.stone).toBe(0);
    step(w);
    expect(w.monument!.delivered.stone).toBe(1);
  });

  it('Geld für genau ein Stück: Stein wird gekauft, Glas nicht', () => {
    const { w } = runningMonument();
    w.monument!.buy.stone = true;
    w.monument!.buy.glass = true;
    w.money = 15;
    stepTo(w, 1010);
    expect(w.monument!.delivered).toEqual({ stone: 1, tools: 0, glass: 0, spice: 0 });
    expect(w.money).toBe(0);
  });
});

describe('AK-M13E2-10 Reserve hält', () => {
  it('Lager fällt durch Zug nie unter die Reserve; Glas wird geliefert, Gewürz nicht', () => {
    const { w, houses } = villageMonument();
    Object.assign(stock(w), { stone: 20, tools: 20, glass: 80, spice: 64 });
    const keep = (): void => houses.forEach((h) => setHouse(h, 4, 20));
    keep();
    expect(monumentReserve(w, 'glass')).toBe(64);
    expect(monumentReserve(w, 'spice')).toBe(64);
    for (let i = 0; i < 200; i++) {
      keep();
      const before = { ...w.monument!.delivered };
      step(w);
      for (const g of GOOD4) {
        if (w.monument!.delivered[g] > before[g]) {
          expect(stock(w)[g]).toBeGreaterThanOrEqual(monumentReserve(w, g));
        }
      }
    }
    const d = w.monument!.delivered;
    expect(d.glass).toBeGreaterThanOrEqual(1);
    expect(d.glass).toBeLessThanOrEqual(16);
    expect(d.spice).toBe(0);
  });
});

describe('AK-M13E2-11 Zukauf im Zug', () => {
  it('kauft je Zug ein Stück zum Preis vor dem Zug (15)', () => {
    const { w } = runningMonument();
    w.monument!.buy.stone = true;
    for (const t of [1010, 1020, 1030]) {
      stepTo(w, t - 1);
      const money = w.money;
      const price = buyPrice(w, 'stone', 1);
      step(w);
      expect(money - w.money).toBe(price);
      expect(price).toBe(15);
    }
    expect(w.monument!.delivered.stone).toBe(3);
  });

  it('zahlt mit wirkendem Handel 12', () => {
    const [w, twin] = buyTwin((x) => {
      placeTownhall(x);
      x.edict = 'trade';
    });
    expect(paidAt(w, twin, 1010)).toBe(12);
  });

  it('kauft mit 14 Geld nicht, ohne Schalter nicht', () => {
    const { w } = runningMonument();
    w.monument!.buy.stone = true;
    w.money = 14;
    stepTo(w, 1010);
    expect(w.monument!.delivered.stone).toBe(0);
    expect(w.money).toBe(14);
    const v = runningMonument().w;
    stepTo(v, 1010);
    expect(v.monument!.delivered.stone).toBe(0);
  });

  it('Stein 25: fünf Züge aus dem Lager ohne Geld, dann Kauf', () => {
    const { w } = runningMonument();
    stock(w).stone = 25;
    w.monument!.buy.stone = true;
    const money = w.money;
    stepTo(w, 1050);
    expect(w.monument!.delivered.stone).toBe(5);
    expect(w.money).toBe(money);
    stepTo(w, 1060);
    expect(w.monument!.delivered.stone).toBe(6);
    expect(w.money).toBe(money - 15);
  });

  it('ohne Kontor kein Kauf', () => {
    const { w } = runningMonument();
    w.monument!.buy.stone = true;
    w.islands[0]!.kontorId = null;
    const money = w.money;
    stepTo(w, 1010);
    expect(w.monument!.delivered.stone).toBe(0);
    expect(w.money).toBe(money);
  });

  it('Zukauf-Funktion: Geld = Preis → 1, Preis − 1 → 0 und unverändert', () => {
    const { w } = runningMonument();
    w.money = 15;
    expect(buyMonumentUnit(w, 'stone')).toBe(1);
    expect(w.money).toBe(0);
    w.money = 14;
    const before = serialize(w);
    expect(buyMonumentUnit(w, 'stone')).toBe(0);
    expect(serialize(w)).toBe(before);
  });

  it('qa B8 Lager unter Reserve (Stein 12), Schalter an: nur Kauf, Lager bleibt 12', () => {
    const { w } = runningMonument();
    stock(w).stone = 12;
    w.monument!.buy.stone = true;
    stepTo(w, 1010);
    expect(stock(w).stone).toBe(12);
    expect(w.monument!.delivered.stone).toBe(1);
  });

  it('qa B8 Handel aufgehoben bzw. Amtsstube abgerissen: Preis ab nächstem Zug 15', () => {
    for (const how of ['edict', 'demolish'] as const) {
      const [w, twin] = buyTwin((x) => {
        placeTownhall(x);
        x.edict = 'trade';
      });
      expect(paidAt(w, twin, 1010)).toBe(12);
      for (const x of [w, twin]) {
        if (how === 'edict') x.edict = null;
        else demolish(x, Object.values(x.buildings).find((b) => b.defId === 'townhall')!.id);
      }
      expect(paidAt(w, twin, 1020)).toBe(15);
    }
  });

  it('qa B8 Häuser wachsen von 60 auf 80 Kaufleute: Glas-Reserve 48 → 64 ab nächstem Zug', () => {
    const { w, houses } = villageMonument();
    stock(w).glass = 60;
    houses.forEach((h) => setHouse(h, 4, 15));
    expect(monumentReserve(w, 'glass')).toBe(48);
    stepTo(w, 1010);
    expect(w.monument!.delivered.glass).toBeGreaterThanOrEqual(1);
    houses.forEach((h) => setHouse(h, 4, 20));
    expect(monumentReserve(w, 'glass')).toBe(64);
    const d = w.monument!.delivered.glass;
    stock(w).glass = 60;
    stepTo(w, 1020);
    expect(w.monument!.delivered.glass).toBe(d);
  });

  it('qa B8 Häuser schrumpfen von 80 auf 60: Reserve 64 → 48, Glas 60 liefert wieder', () => {
    const { w, houses } = villageMonument();
    houses.forEach((h) => setHouse(h, 4, 20));
    stock(w).glass = 60;
    stepTo(w, 1010);
    expect(w.monument!.delivered.glass).toBe(0);
    houses.forEach((h) => setHouse(h, 4, 15));
    expect(monumentReserve(w, 'glass')).toBe(48);
    stepTo(w, 1020);
    expect(w.monument!.delivered.glass).toBeGreaterThanOrEqual(1);
  });

  it('qa B8 leeres Lager: mit Schalter Kauf, Lager bleibt 0; ohne Schalter nichts, kein Wurf', () => {
    const { w } = runningMonument();
    for (const g of GOOD4) stock(w)[g] = 0;
    w.monument!.buy.stone = true;
    stepTo(w, 1010);
    expect(w.monument!.delivered.stone).toBe(1);
    expect(stock(w).stone).toBe(0);
    w.monument!.buy.stone = false;
    expect(() => stepTo(w, 1030)).not.toThrow();
    expect(w.monument!.delivered.stone).toBe(1);
    expect(GOOD4.every((g) => stock(w)[g] === 0)).toBe(true);
  });
});

describe('AK-M13E2-13 Abschluss', () => {
  const nearlyDone = (stage: number): World => {
    const { w } = runningMonument();
    const m = w.monument!;
    m.stage = stage;
    m.delivered = { ...goal(stage), stone: goal(stage).stone - 1 };
    stock(w).stone = 25;
    return w;
  };

  it('letzter Rest im Zug-Tick: im selben Tick Abschnitt zu', () => {
    const w = nearlyDone(0);
    stepTo(w, 1009);
    expect(w.monument!.running).toBe(true);
    step(w);
    expect(w.monument).toMatchObject({
      running: false,
      stage: 1,
      delivered: { stone: 0, tools: 0, glass: 0, spice: 0 },
    });
  });

  it('nach Abschnitt 3 ist monumentDone wahr, Sieg-Flags unverändert', () => {
    const w = nearlyDone(2);
    const flags = [w.won, w.wonMerchants, w.wonSpice];
    expect(w.monumentDone).toBe(false);
    stepTo(w, 1010);
    expect(w.monument!.stage).toBe(3);
    expect(w.monumentDone).toBe(true);
    expect([w.won, w.wonMerchants, w.wonSpice]).toEqual(flags);
  });

  it('alle Reste 0 und pausiert: Abschluss im nächsten Tick ohne Zug-Tick', () => {
    const { w } = runningMonument();
    w.monument!.delivered = { ...goal(0) };
    w.monument!.paused = true;
    step(w);
    expect(w.tick % 10).not.toBe(0);
    expect(w.monument).toMatchObject({ running: false, stage: 1 });
  });
});

describe('AK-M13E2-14 Kein Zug', () => {
  const snapshot = (w: World) => ({
    goods: GOOD4.map((g) => stock(w)[g]),
    delivered: { ...w.monument!.delivered },
  });

  it('pausiert, ohne Weg oder ohne laufenden Abschnitt: 100 Schritte ohne Änderung', () => {
    const cases: [string, (w: World) => void][] = [
      ['paused', (w) => (w.monument!.paused = true)],
      ['ohne Weg', (w) => removeRoad(w, MONUMENT_AT.x - 1, MONUMENT_AT.y - 1)],
      ['!running', (w) => (w.monument!.running = false)],
    ];
    for (const [name, prep] of cases) {
      const { w } = runningMonument();
      const twin = runningMonument().w;
      twin.monument!.running = false;
      for (const x of [w, twin]) {
        stock(x).stone = 40;
        stock(x).glass = 40;
      }
      prep(w);
      prep(twin);
      if (name === 'ohne Weg')
        expect(Object.values(w.buildings).find((b) => b.defId === 'monument')!.connected).toBe(
          false,
        );
      const before = snapshot(w);
      for (let i = 0; i < 100; i++) {
        step(w);
        step(twin);
      }
      expect(snapshot(w), name).toEqual(before);
      expect(w.money, name).toBe(twin.money);
    }
  });

  it('Fortsetzen bzw. Weg neu: Zug ab dem nächsten Zug-Tick', () => {
    const { w } = runningMonument();
    stock(w).stone = 40;
    w.monument!.paused = true;
    stepTo(w, 1015);
    w.monument!.paused = false;
    stepTo(w, 1019);
    expect(w.monument!.delivered.stone).toBe(0);
    step(w);
    expect(w.monument!.delivered.stone).toBe(1);
    removeRoad(w, MONUMENT_AT.x - 1, MONUMENT_AT.y - 1);
    stepTo(w, 1030);
    expect(w.monument!.delivered.stone).toBe(1);
    placeRoad(w, MONUMENT_AT.x - 1, MONUMENT_AT.y - 1);
    stepTo(w, 1039);
    expect(w.monument!.delivered.stone).toBe(1);
    step(w);
    expect(w.monument!.delivered.stone).toBe(2);
  });

  it('qa B8 Weg-Abriss zwischen 1009 und 1010: kein Zug bei 1010', () => {
    const { w } = runningMonument();
    stock(w).stone = 40;
    stepTo(w, 1009);
    removeRoad(w, MONUMENT_AT.x - 1, MONUMENT_AT.y - 1);
    step(w);
    expect(w.monument!.delivered.stone).toBe(0);
  });

  it('qa B8 Abriss bei pausiert: monument null, nächster step wirft nicht', () => {
    const { w, id } = runningMonument();
    w.monument!.paused = true;
    expect(demolish(w, id)).toEqual({ ok: true });
    expect(w.monument).toBeNull();
    expect(() => step(w)).not.toThrow();
  });
});

describe('Tick-Platz (R5.1)', () => {
  it('tickMonument steht in step direkt nach tickEconomy', () => {
    const src = readFileSync('src/sim/tick.ts', 'utf8');
    const body = src.slice(src.indexOf('export function step'));
    const calls = [...body.slice(0, body.indexOf('\n}')).matchAll(/^\s+(\w+)\(world\);/gm)].map(
      (m) => m[1],
    );
    expect(calls[calls.indexOf('tickEconomy') + 1]).toBe('tickMonument');
    expect(calls.slice(-2)).toEqual(['checkWin', 'tickUnlocks']);
  });
});

describe('AK-M13E2-16 Determinismus', () => {
  it('(a) fireTarget wählt nie das Denkmal, auch nicht neben brennbaren Nachbarn', () => {
    const { w, id } = runningMonument();
    const { x, y } = MONUMENT_AT;
    const hut = putBuilding(w, HOME, 'lumberjack', x + 3, y);
    let hits = 0;
    for (let tx = x - 3; tx <= x + 7; tx++) {
      for (let ty = y - 3; ty <= y + 6; ty++) {
        const t = fireTarget(w, { x: tx, y: ty });
        if (t !== null) hits++;
        expect(t?.id).not.toBe(id);
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(fireTarget(w, { x: x + 1, y: y + 1 })?.id).toBe(hut.id);
    expect(BUILDING_DEFS.monument.flammable).not.toBe(true);
  });

  it('(b) zwei Kopien aus Speichern/Laden bleiben über 1000 Schritte gleich', () => {
    const a = monumentRunWorld();
    const r = deserialize(serialize(a));
    if (!r.ok) throw new Error('laden');
    const b = r.world;
    for (let i = 0; i < 1000; i++) {
      step(a);
      step(b);
    }
    expect(serialize(b)).toBe(serialize(a));
  });

  it('(c) tickMonument ruft an einem Zug-Tick keinen Zufall auf', () => {
    const w = monumentRunWorld();
    stepTo(w, 1009);
    w.tick = 1010;
    vi.mocked(createRng).mockClear();
    const random = vi.spyOn(Math, 'random');
    tickMonument(w);
    expect(w.monument!.delivered.stone).toBe(1);
    expect(createRng).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });
});

describe('AK-M13E2-49 Speichern und Laden mitten im Abschnitt', () => {
  const END = 1500;
  const withPause = (w: World, paused: boolean): void => {
    // Pause zwischen den Schritten: bei Tick 1015 an, bei 1035 aus.
    if (!paused) return;
    if (w.tick === 1015) setMonumentPaused(w, true);
    if (w.tick === 1035) setMonumentPaused(w, false);
  };
  const run = (w: World, to: number, paused: boolean): void => {
    while (w.tick < to) {
      withPause(w, paused);
      step(w);
    }
  };

  it.each([
    [1007, false],
    [1010, false],
    [1013, false],
    [1025, true],
  ] as const)('Speicher-Tick %i (pausiert: %s): K′ gleich Zwilling Z', (s, paused) => {
    const z = monumentRunWorld();
    run(z, END, paused);
    const k = monumentRunWorld();
    run(k, s, paused);
    const r = deserialize(serialize(k));
    if (!r.ok) throw new Error('laden');
    const k2 = r.world;
    run(k2, END, paused);
    expect(serialize(k2)).toBe(serialize(z));
    expect(k2.monument!.running).toBe(true);
    expect(k2.monument!.delivered.stone).toBeGreaterThanOrEqual(1);
    expect(k2.monument!.delivered.glass).toBeGreaterThanOrEqual(1);
    expect(Math.floor((END - s) / 10) - (paused ? 2 : 0)).toBeGreaterThanOrEqual(40);
  });
});
