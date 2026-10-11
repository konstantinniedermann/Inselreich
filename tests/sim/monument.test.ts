import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import {
  isMonumentGood,
  monumentStartReason,
  newMonument,
  setMonumentBuy,
  setMonumentPaused,
  startMonumentStage,
} from '../../src/sim/monument';
import { canPlace, siteRuleOk } from '../../src/sim/placement';
import { needsConnection, recomputeConnectivity } from '../../src/sim/roads';
import { serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { buildEntries } from '../../src/ui/buildMenu';
import { HOME, home, tileAt } from '../../src/sim/world';
import { MONUMENT_STAGES } from '../../src/sim/defs/monument';
import { placeBuilding } from '../../src/sim/build';
import { forceRect, twoIslandWorld } from './helpers';
import { MONUMENT_AT, monumentWorld, placeMonument } from './monumentHelpers';

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
