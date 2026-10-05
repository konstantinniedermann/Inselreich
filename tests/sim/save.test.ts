import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import v2Json from './fixtures/save-v2.json?raw';
import v3Json from './fixtures/save-v3.json?raw';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis, type CrisisRoll } from '../../src/sim/crises';
import { GOODS, GOOD_IDS, SELL_FLOOR } from '../../src/sim/defs/goods';
import { CRISIS_FIRST_TICK, FIRE_OUTAGE } from '../../src/sim/defs/timing';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { ISLANDS } from '../../src/sim/defs/sea';
import { TIERS } from '../../src/sim/defs/tiers';
import { utilization } from '../../src/sim/levels';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, Island, World } from '../../src/sim/types';
import { buildLock, deriveUnlocks } from '../../src/sim/unlocks';
import { createWorld, home } from '../../src/sim/world';
import { fixtureV6Run, locksV6Run, normalRunTo } from './fixtureV6';
import { CHAIN_HASHES, V6_FORMS } from './e0Pins';
import { V7_FORMS } from './e1Pins';
import { fixtureV7Run } from './fixtureV7';
import {
  forceGrass,
  forceRect,
  fnv1a32,
  foldBackToV6,
  foldBackToV7,
  prepareEast,
  setHouse,
  sortedJson,
  village,
} from './helpers';
import { perfBudget } from '../helpers/perfBudget';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(42);
  k = w.buildings[home(w).kontorId]!;
  prepareEast(w, k);
});

/** Serialisiert, lässt `edit` am rohen Objekt manipulieren und gibt wieder JSON zurück. */
function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

/** Alter Stand (v1–v6) als rohes JSON: Raster, Kontor und Lager oben, Gebäude ohne `island`. */
type V6Json = Omit<World, 'islands' | 'version' | 'buildings'> &
  Island & { version: number; buildings: Record<number, Omit<Building, 'island'>> };

/** Gebäude der geladenen Welt ohne `island` (Vergleich mit dem rohen alten Stand). */
const withoutIsland = (world: World): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(world.buildings).map(([id, b]) => {
      const copy: Record<string, unknown> = { ...b };
      delete copy.island;
      return [id, copy];
    }),
  );

/** Insel 0 im rohen v7-Objekt. */
const isl0 = (raw: Record<string, unknown>): Record<string, unknown> =>
  (raw.islands as Record<string, unknown>[])[0]!;

function expectFailure(json: string, reason: string): void {
  const r = deserialize(json);
  expect(r).toEqual({ ok: false, reason });
}

describe('save', () => {
  it('uses version 5', () => {
    expect(SAVE_VERSION).toBe(7);
  });

  it('AK-S1-01 createWorld starts with the v2 fields', () => {
    const fresh = createWorld(3);
    expect(fresh.version).toBe(7);
    expect(fresh.taxLevel).toBe('normal');
    expect(fresh.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => fresh.sellPct[g] === 100)).toBe(true);
    expect(fresh.order).toBeNull();
  });

  // Fixture erzeugt mit Commit cf9e35e über den temporären Test tests/sim/gen-save-v1.test.ts
  // (GEN_SAVE_V1=1; Seed 3, Weg + Holzfäller + Haus östlich des Kontors, 1000 Ticks), siehe Plan M5 Task S1.
  it('AK-S1-02 lädt einen echten v1-Stand und migriert ihn', () => {
    const before = JSON.parse(v1Json) as Record<string, unknown>;
    expect(before.version).toBe(1);
    const r = deserialize(v1Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world;
    expect(loaded.version).toBe(7);
    expect(loaded.taxLevel).toBe('normal');
    expect(loaded.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => loaded.sellPct[g] === 100)).toBe(true);
    expect(loaded.order).toBeNull();
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.money).toBe(before.money);
    expect(home(loaded).stock).toEqual({ ...(before.stock as object), glass: 0 });
    expect(Object.keys(loaded.buildings)).toEqual(Object.keys(before.buildings as object));
  });

  it('AK-S1-03 round-trips a v2 world with tax, sell share and order', () => {
    w.taxLevel = 'high';
    w.taxLockedUntil = 450;
    w.sellPct.wood = 73;
    w.tick = 700; // ein aktiver Auftrag muss zum Tick passen (isValidOrder)
    w.order = { period: 0, good: 'wood', amount: 25, reward: 175, due: 1200 };
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
  });

  it('AK-S1-04 weist beschädigte v2-Felder ab', () => {
    const bad: Array<(raw: Record<string, unknown>) => void> = [
      (r) => (r.taxLevel = 'extrem'),
      (r) => ((r.sellPct as Record<string, number>).wood = 29),
      (r) => ((r.sellPct as Record<string, number>).wood = 101),
      (r) => ((r.sellPct as Record<string, number>).wood = 50.5),
      (r) => delete (r.sellPct as Record<string, number>).rum,
      (r) => (r.order = { period: 0, good: 'tools', amount: 5, reward: 0, due: 1200 }),
      (r) => (r.order = { period: 0, good: 'wood', amount: 0, reward: 0, due: 1200 }),
      (r) => (r.order = { period: 0, good: 'wood', amount: 5.5, reward: 0, due: 1200 }),
      (r) => (r.taxLockedUntil = 1.5),
      (r) => (r.taxLockedUntil = -7),
    ];
    for (const edit of bad) expectFailure(tampered(w, edit), 'Beschädigter Spielstand');
    expectFailure(
      tampered(w, (r) => (r.version = 8)),
      'Unbekannte Version',
    );
  });

  it('isValidOrder-Grenzen: Auftrag passt zu Tick und Periode', () => {
    const order = (tick: number, o: Record<string, unknown>): string =>
      tampered(w, (r) => {
        r.tick = tick;
        r.order = { period: 0, good: 'wood', amount: 25, reward: 175, due: 1200, ...o };
      });
    // gültig direkt nach dem Angebot (Tick 600) und am due-Tick (1200)
    expect(deserialize(order(600, {})).ok).toBe(true);
    expect(deserialize(order(1200, {})).ok).toBe(true);
    // Periode 1: Angebot bei 1500, due 2100
    expect(deserialize(order(1500, { period: 1, due: 2100 })).ok).toBe(true);
    // knapp daneben: vor dem Angebot, nach due
    expectFailure(order(599, {}), 'Beschädigter Spielstand');
    expectFailure(order(1201, {}), 'Beschädigter Spielstand');
    // due passt nicht zur Periode
    expectFailure(order(700, { due: 1199 }), 'Beschädigter Spielstand');
    expectFailure(order(700, { due: 1201 }), 'Beschädigter Spielstand');
    expectFailure(order(700, { period: 1 }), 'Beschädigter Spielstand');
    expectFailure(order(700, { period: -1, due: 300 }), 'Beschädigter Spielstand');
    // Struktur: Menge ganzzahlig >= 1, Prämie ganzzahlig >= 0
    expectFailure(order(700, { amount: 0, reward: 0 }), 'Beschädigter Spielstand');
    expectFailure(order(700, { reward: -1 }), 'Beschädigter Spielstand');
  });

  it('isValidOrder: Prämie und Menge nicht an aktuelle Spielwerte gebunden', () => {
    const json = tampered(w, (r) => {
      r.tick = 700;
      r.order = { period: 0, good: 'wood', amount: 19, reward: 1, due: 1200 };
    });
    expect(deserialize(json).ok).toBe(true);
    const json2 = tampered(w, (r) => {
      r.tick = 700;
      r.order = { period: 0, good: 'wood', amount: 41, reward: 9999, due: 1200 };
    });
    expect(deserialize(json2).ok).toBe(true);
  });

  it('AK-S1-04 Güter tragen die Auftragsdaten (Spec 5.3), SELL_FLOOR ist 30', () => {
    expect(SELL_FLOOR).toBe(30);
    const table: Record<string, [number, number, number] | undefined> = {
      wood: [1, 20, 40],
      food: [1, 10, 20],
      stone: [2, 10, 20],
      wool: [2, 10, 20],
      cloth: [2, 6, 12],
      cane: [3, 10, 20],
      rum: [3, 6, 12],
      glass: [4, 4, 8],
      tools: undefined,
    };
    for (const g of GOOD_IDS) {
      const o = GOODS[g].order;
      const want = table[g];
      expect(o === undefined ? undefined : [o.tier, o.min, o.max]).toEqual(want);
    }
  });

  it('round-trips a played world unchanged', () => {
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    forceGrass(w, k.x, k.y - 1);
    const house = placeBuilding(w, 'house', k.x, k.y - 1);
    expect(house.ok).toBe(true);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.buildings[house.id!]!.house!.demand).not.toEqual({});

    const r = deserialize(serialize(w));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
    expect(r.world.buildings[lj.id!]!.connected).toBe(true);
  });

  it('rejects an unknown version', () => {
    expectFailure(JSON.stringify({ ...w, version: 8 }), 'Unbekannte Version');
  });

  it('rejects invalid JSON', () => {
    expectFailure('{not json', 'Ungültiges Format');
  });

  it('rejects JSON that is not an object', () => {
    expectFailure('42', 'Ungültiges Format');
    expectFailure('null', 'Ungültiges Format');
  });

  it('rejects a stock without every good', () => {
    const json = tampered(w, (raw) => {
      delete (isl0(raw).stock as Record<string, unknown>).rum;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a wrong number of tiles', () => {
    const json = tampered(w, (raw) => {
      (isl0(raw).tiles as unknown[]).pop();
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a tiles array with a null element', () => {
    const json = tampered(w, (raw) => {
      (isl0(raw).tiles as unknown[])[0] = null;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a building with an unknown defId', () => {
    const json = tampered(w, (raw) => {
      const b = (raw.buildings as Record<string, Building>)[String(home(w).kontorId)]!;
      (b as { defId: string }).defId = 'castle';
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('recomputes connectivity instead of trusting the saved flag', () => {
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    const json = tampered(w, (raw) => {
      const b = (raw.buildings as Record<string, Building>)[String(lj.id)]!;
      b.connected = true;
      b.state = 'ok';
    });

    const r = deserialize(json);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world.buildings[lj.id!]!;
    expect(loaded.connected).toBe(false);
    expect(loaded.state).toBe('notConnected');
  });

  it('keeps the victory flag', () => {
    w.won = true;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.won).toBe(true);
  });

  it('never throws on garbage input', () => {
    for (const json of [
      '',
      '{not json',
      '42',
      'null',
      '[]',
      '{"version":1}',
      '"text"',
      '{"version":6,"buildings":null}',
      '{"version":6,"buildings":{"1":5}}',
      '{"version":6,"buildings":{"1":null}}',
      '{"version":7}',
      '{"version":7,"islands":null}',
      '{"version":7,"islands":[null]}',
      '{"version":7,"islands":[{}],"buildings":null}',
    ]) {
      expect(() => deserialize(json)).not.toThrow();
    }
  });
});

const T = CRISIS_FIRST_TICK; // Periode 0 bei Stufe normal

/** `w` auf Stufe normal, Krise `roll` der Periode `k` bei ihrem Start, danach `after` Ticks weiter (ohne step). */
function inCrisis(roll: CrisisRoll, after = 50, level: 'normal' | 'mild' = 'normal', k = 0): World {
  w.crisisLevel = level;
  w.tick = T + k * (level === 'normal' ? 600 : 1200);
  beginCrisis(w, k, roll);
  w.tick += after;
  return w;
}

/** Angebundener Holzfäller brennt (Ausfall bis T + 200), Krise `burning` mit Ziel. */
function burningWorld(): { world: World; id: number } {
  for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
  const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
  expect(lj.ok).toBe(true);
  inCrisis({ kind: 'fire', tile: { x: k.x + 6, y: k.y } });
  const b = w.buildings[lj.id!]!;
  b.state = 'burning';
  b.outageUntil = T + FIRE_OUTAGE;
  w.crisis!.outcome = 'burning';
  w.crisis!.target = b.id;
  return { world: w, id: b.id };
}

describe('M6 Save v3', () => {
  it('AK-S1-01 createWorld: version 5, Stufe off, keine Krise; Option setzt nur die Stufe', () => {
    const a = createWorld(3);
    expect(a.version).toBe(7);
    expect(a.crisisLevel).toBe('off');
    expect(a.crisis).toBeNull();
    const b = createWorld(3, { crisisLevel: 'normal' });
    expect(b.crisisLevel).toBe('normal');
    expect({ ...b, crisisLevel: 'off' }).toEqual(a);
    expect(Object.keys(a).slice(-7, -5)).toEqual(['crisisLevel', 'crisis']); // Key-Reihenfolge (AK-B1-02)
  });

  // Fixture erzeugt auf main 3fcb678 über den temporären Test tests/sim/gen-save-v2.test.ts
  // (GEN_SAVE_V2=1; Seed 3, Weg + Holzfäller + Haus östlich des Kontors, Steuer low bei 1000, 10 Holz verkauft
  // bei 1590, Tick 1600 mit Auftrag Periode 1), siehe Plan M6-Sim Task 1a.
  it('AK-S1-02 lädt einen echten v2-Stand und migriert ihn nach v3', () => {
    const before = JSON.parse(v2Json) as V6Json;
    expect(before.version).toBe(2);
    const r = deserialize(v2Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world;
    expect(loaded.version).toBe(7);
    expect(loaded.crisisLevel).toBe('off');
    expect(loaded.crisis).toBeNull();
    expect(Object.values(loaded.buildings).some((b) => b.outageUntil !== undefined)).toBe(false);
    const shape = (x: World | V6Json): unknown[] =>
      Object.values(x.buildings).map((b) => [b.id, b.defId, b.x, b.y, b.progress, b.state]);
    expect(shape(loaded)).toEqual(shape(before));
    expect(home(loaded).stock).toEqual({ ...before.stock, glass: 0 });
    expect(loaded.money).toBe(before.money);
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.taxLevel).toBe(before.taxLevel);
    expect(loaded.sellPct).toEqual({ ...before.sellPct, glass: 100 });
    expect(loaded.order).toEqual(before.order);
    expect(before.order).not.toBeNull();
    expect(before.sellPct.wood).toBeLessThan(100);
  });

  it('AK-S1-03 lädt den v1-Stand über v2 nach v3', () => {
    const r = deserialize(v1Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(7);
    expect(r.world.crisisLevel).toBe('off');
    expect(r.world.crisis).toBeNull();
    expect(r.world.taxLevel).toBe('normal');
    expect(r.world.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => r.world.sellPct[g] === 100)).toBe(true);
    expect(r.world.order).toBeNull();
  });

  it('AK-S1-04 Round-trip v3: Sturm in der Vorwarnung, Brand burning, Boom', () => {
    const cases: Array<() => World> = [
      () => inCrisis({ kind: 'storm' }),
      () => burningWorld().world,
      () => inCrisis({ kind: 'boom', good: 'rum' }),
    ];
    for (const make of cases) {
      w = createWorld(42);
      k = w.buildings[home(w).kontorId]!;
      prepareEast(w, k);
      const world = make();
      const r = deserialize(serialize(world));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.world).toEqual(world);
    }
  });

  it('AK-S1-05 weist jede verletzte Ladeprüfung einzeln ab', () => {
    type Edit = (r: Record<string, unknown>) => void;
    const crisis = (r: Record<string, unknown>): Record<string, unknown> =>
      r.crisis as Record<string, unknown>;
    const storm = (): World => {
      w = createWorld(42);
      return inCrisis({ kind: 'storm' });
    };
    const boom = (): World => {
      w = createWorld(42);
      return inCrisis({ kind: 'boom', good: 'rum' });
    };
    const fire = (): { world: World; id: number } => {
      w = createWorld(42);
      k = w.buildings[home(w).kontorId]!;
      prepareEast(w, k);
      return burningWorld();
    };
    const onStorm: Edit[] = [
      (r) => (r.crisisLevel = 'extrem'),
      (r) => (r.crisis = 5),
      (r) => (crisis(r).period = 1.5),
      (r) => (crisis(r).period = -1),
      (r) => (r.crisisLevel = 'off'),
      (r) => (r.tick = T - 1), // Periodenstart nach tick
      (r) => (r.tick = T + 500), // tick ≥ until
      (r) => (crisis(r).kind = 'flood'),
      (r) => (crisis(r).from = T + 200),
      (r) => (crisis(r).until = T + 501),
    ];
    for (const edit of onStorm) expectFailure(tampered(storm(), edit), 'Beschädigter Spielstand');
    const onBoom: Edit[] = [(r) => (crisis(r).good = 'tools'), (r) => delete crisis(r).good];
    for (const edit of onBoom) expectFailure(tampered(boom(), edit), 'Beschädigter Spielstand');
    const b = (r: Record<string, unknown>, id: number): Record<string, unknown> =>
      (r.buildings as Record<string, Record<string, unknown>>)[String(id)]!;
    const onFire: Array<(r: Record<string, unknown>, id: number) => void> = [
      (r) => (crisis(r).outcome = 'smoulder'),
      (r) => delete crisis(r).target, // burning ohne target
      (r) => (crisis(r).outcome = 'miss'), // miss mit target
      (r) => (crisis(r).tile = { x: 64, y: 3 }),
      (r) => (crisis(r).tile = { x: 3, y: 1.5 }),
      (r) => (crisis(r).target = 1.5),
      (r) => (crisis(r).tile = { x: -1, y: 3 }),
      (r, id) => (b(r, id).outageUntil = 10.5),
      (r, id) => (b(r, id).outageUntil = T + 50), // ≤ tick
      (r, id) => (b(r, id).outageUntil = T + 50 + FIRE_OUTAGE + 1), // > tick + 200
      (r, id) => delete b(r, id).outageUntil, // burning ohne outageUntil
      (r, id) => (b(r, id).state = 'ok'), // outageUntil ohne burning
    ];
    for (const edit of onFire) {
      const { world, id } = fire();
      expectFailure(
        tampered(world, (r) => edit(r, id)),
        'Beschädigter Spielstand',
      );
    }
    expectFailure(
      tampered(storm(), (r) => (r.version = 8)),
      'Unbekannte Version',
    );
  });

  it('AK-S1-11 Laden mitten in einer Krise ändert den Verlauf nicht', () => {
    const a = createWorld(3, { crisisLevel: 'normal' });
    while (a.tick < 4000) step(a);
    let b = createWorld(3, { crisisLevel: 'normal' });
    while (b.tick < 2500) step(b);
    expect(b.crisis?.kind).toBe('storm');
    const r = deserialize(serialize(b));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    b = r.world;
    while (b.tick < 4000) step(b);
    expect(serialize(b)).toBe(serialize(a));
  });

  it('RF-1 Krise auf Stufe mild (Periode 1, Start 3600) lädt', () => {
    const world = inCrisis({ kind: 'storm' }, 50, 'mild', 1);
    expect(world.crisis).toMatchObject({ period: 1, from: 3801, until: 4100 });
    const r = deserialize(serialize(world));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world).toEqual(world);
  });
});

// Fixture erzeugt auf main 31b5977 über den temporären Test tests/sim/gen-save-v3.test.ts
// (GEN_SAVE_V3=1; Seed 3, crisisLevel 'normal', Controller startColony/runColony ohne Optionen mit stop beim
// ersten Tick ≥ 3000 mit laufender Krise, aktivem Auftrag, Bürgerhaus und sellPct < 100 → Tick 5400),
// siehe Plan M8 Task 1 Schritt 1.
describe('M8 Save v4', () => {
  it('AK-S1-02 createWorld: version 4, wonMerchants false, Glas 0 / 100, übrige Felder wie nach M6', () => {
    const a = createWorld(3);
    expect(a.version).toBe(7);
    expect(a.wonMerchants).toBe(false);
    expect(home(a).stock.glass).toBe(0);
    expect(a.sellPct.glass).toBe(100);
    const keys = Object.keys(a);
    expect(keys.indexOf('wonMerchants')).toBe(keys.indexOf('won') + 1);
    expect(keys.slice(-7, -5)).toEqual(['crisisLevel', 'crisis']);
  });

  it('AK-S1-11 lädt einen echten v3-Stand und migriert ihn nach v4', () => {
    const before = JSON.parse(v3Json) as V6Json;
    expect(before.version).toBe(3);
    expect(before.tick).toBeGreaterThanOrEqual(3000);
    expect(before.crisisLevel).toBe('normal');
    expect(before.crisis).not.toBeNull();
    expect(before.order).not.toBeNull();
    expect(Object.values(before.buildings).some((b) => b.house?.tier === 3)).toBe(true);
    expect(Object.values(before.sellPct).some((p) => p < 100)).toBe(true);
    const r = deserialize(v3Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world;
    expect(loaded.version).toBe(7);
    expect(home(loaded).stock.glass).toBe(0);
    expect(loaded.sellPct.glass).toBe(100);
    expect(loaded.wonMerchants).toBe(false);
    expect(withoutIsland(loaded)).toEqual(before.buildings);
    expect(home(loaded).stock).toEqual({ ...before.stock, glass: 0 });
    expect(loaded.money).toBe(before.money);
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.taxLevel).toBe(before.taxLevel);
    expect(loaded.sellPct).toEqual({ ...before.sellPct, glass: 100 });
    expect(loaded.order).toEqual(before.order);
    expect(loaded.crisisLevel).toBe(before.crisisLevel);
    expect(loaded.crisis).toEqual(before.crisis);
  });

  it('AK-S1-12 v1 und v2 laden über alle Migrationen nach v4', () => {
    for (const json of [v1Json, v2Json]) {
      const before = JSON.parse(json) as Record<string, unknown>;
      const r = deserialize(json);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.world.version).toBe(7);
      expect(r.world.wonMerchants).toBe(false);
      expect(home(r.world).stock.glass).toBe(0);
      expect(r.world.sellPct.glass).toBe(100);
      expect(r.world.crisisLevel).toBe('off');
      expect(r.world.crisis).toBeNull();
      expect(r.world.taxLevel).toBe(before.version === 1 ? 'normal' : before.taxLevel);
      expect(r.world.order).toEqual(before.version === 1 ? null : before.order);
    }
  });

  it('AK-S1-13 Round-trip v4: won, Kaufmannshaus, wonMerchants, Glas 7, sellPct.glass 90', () => {
    forceGrass(w, k.x + 2, k.y + 1);
    const h = placeBuilding(w, 'house', k.x + 2, k.y + 1);
    expect(h.ok).toBe(true);
    w.buildings[h.id!]!.house!.tier = 4;
    w.buildings[h.id!]!.house!.inhabitants = 20;
    w.won = true;
    w.wonMerchants = true;
    home(w).stock.glass = 7;
    w.sellPct.glass = 90;
    expect(w.version).toBe(7);
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world).toEqual(w);
  });

  it('AK-S1-14 weist jede verletzte v4-Ladeprüfung einzeln ab; Stufe 4 vor dem Sieg nur mit Hebel', () => {
    forceGrass(w, k.x + 2, k.y + 1);
    const h = placeBuilding(w, 'house', k.x + 2, k.y + 1);
    expect(h.ok).toBe(true);
    const tier = (t: number) => (r: Record<string, unknown>) =>
      ((r.buildings as Record<string, { house: { tier: number } }>)[String(h.id)]!.house.tier = t);
    const bad: Array<(r: Record<string, unknown>) => void> = [
      (r) => delete r.wonMerchants,
      (r) => (r.wonMerchants = 1),
      (r) => (r.wonMerchants = true), // bei won false
      tier(5),
      tier(0),
      tier(3.5),
      tier(4), // bei won false, Hebel null
      (r) => delete (isl0(r).stock as Record<string, unknown>).glass,
      (r) => delete (r.sellPct as Record<string, unknown>).glass,
      (r) => ((r.sellPct as Record<string, number>).glass = 29),
      (r) => ((r.sellPct as Record<string, number>).glass = 101),
    ];
    for (const edit of bad) expectFailure(tampered(w, edit), 'Beschädigter Spielstand');
    expectFailure(
      tampered(w, (r) => (r.version = 8)),
      'Unbekannte Version',
    );
    try {
      TIERS[4].unlockCitizens = 40;
      expect(deserialize(tampered(w, tier(4))).ok).toBe(true);
    } finally {
      TIERS[4].unlockCitizens = null;
    }
  });
});

/** Synthetischer v4-Stand: v5-Felder entfernt, version 4 (Spec 8.2). */
function asV4(w: World): string {
  const raw = JSON.parse(serialize(w)) as Record<string, unknown>;
  delete raw.unlocked;
  delete raw.goodLocks;
  delete raw.upgradeStops;
  raw.version = 4;
  return JSON.stringify(raw);
}
const loadOk = (json: string): World => {
  const r = deserialize(json);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};
/** Angebundener Werkzeugmacher östlich des Kontors (wie tests/sim/toolmaker.test.ts). */
function connectedToolmaker(w: World): Building {
  const k = w.buildings[home(w).kontorId]!;
  prepareEast(w, k);
  expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
  forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
  const r = placeBuilding(w, 'toolmaker', k.x + 3, k.y);
  if (!r.ok || r.id === undefined) throw new Error(r.ok ? 'ohne Id' : r.reason);
  return w.buildings[r.id]!;
}

describe('M10 Save v5 (Spec 8.2)', () => {
  it('AK-S1-11 Round-trip v5 mit unlocked, goodLocks, upgradeStops', () => {
    const w = createWorld(3);
    w.unlocked = ['U0', 'U2', 'U3'];
    w.goodLocks = [{ tier: 2, good: 'cloth' }];
    w.upgradeStops = [1];
    expect(loadOk(serialize(w))).toEqual(w);
  });
  // Fixture erzeugt auf <BASIS> (= 592df06) mit dem temporären Test gen-save-v4 (Plan M10 Task 1 Schritt 1):
  // Controller Seed 3, Krisen normal mit Feuerwache, angehalten bei Tick 4800, dann setTaxLevel(w, 'high').
  it('AK-S1-12 save-v4.json lädt als v5 mit abgeleiteter Freischaltung; alles andere unverändert', () => {
    const json = readFileSync('tests/sim/fixtures/save-v4.json', 'utf8');
    const raw = JSON.parse(json) as Record<string, unknown>;
    const w = loadOk(json);
    expect(w.version).toBe(7);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
    expect(w.goodLocks).toEqual([]);
    expect(w.upgradeStops).toEqual([]);
    expect(w.taxLevel).toBe('high');
    for (const k of [
      'money',
      'tick',
      'taxLockedUntil',
      'sellPct',
      'order',
      'crisisLevel',
      'crisis',
      'won',
      'wonMerchants',
    ] as const)
      expect(w[k]).toEqual(raw[k]);
    expect(home(w).stock).toEqual(raw.stock);
    const bare = Object.values(w.buildings).map(({ island, ...b }) => ({ island, b }));
    expect(bare.every((e) => e.island === 0)).toBe(true);
    expect(Object.fromEntries(bare.map((e) => [e.b.id, e.b]))).toEqual(raw.buildings);
  });
  it('AK-S1-13 Kette: save-v3 → U0, U2 … U5; save-v1, save-v2 → v5 mit deriveUnlocks', () => {
    const v3 = loadOk(readFileSync('tests/sim/fixtures/save-v3.json', 'utf8'));
    expect(v3.version).toBe(7);
    expect(v3.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
    for (const f of ['save-v1.json', 'save-v2.json']) {
      const w = loadOk(readFileSync(`tests/sim/fixtures/${f}`, 'utf8'));
      expect(w.version).toBe(7);
      expect(w.unlocked).toEqual(deriveUnlocks(w));
      expect(w.goodLocks).toEqual([]);
      expect(w.upgradeStops).toEqual([]);
    }
  });
  it('AK-S1-14 Migration je Fall (a, b, c1, d–g)', () => {
    const a = village(4, { unlockAll: true });
    expect(loadOk(asV4(a.w)).unlocked).toEqual(['U0']);
    const b = village(4, { unlockAll: true });
    setHouse(b.houses[0]!, 1, 4);
    expect(loadOk(asV4(b.w)).unlocked).toEqual(['U0', 'U2']);
    const c = createWorld(3, { unlockAll: true });
    const tm = connectedToolmaker(c);
    home(c).stock.wood = 10;
    tm.progress = 20;
    expect(loadOk(asV4(c)).unlocked).toEqual(['U0', 'U5']); // c1: ohne Kette (c2 in Task 4)
    const d = createWorld(3, { unlockAll: true });
    const k = d.buildings[home(d).kontorId]!;
    forceRect(d, k.x + 3, k.y + 3, 2, 2, 'grass');
    expect(placeBuilding(d, 'market', k.x + 3, k.y + 3).ok).toBe(true);
    expect(loadOk(asV4(d)).unlocked).toContain('U1');
    expect(loadOk(asV4(village(20, { unlockAll: true }).w)).unlocked).toContain('U1');
    const f = village(1, { unlockAll: true });
    f.w.won = true;
    expect(loadOk(asV4(f.w)).unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
    const g = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const gk = g.buildings[home(g).kontorId]!;
    forceRect(g, gk.x + 3, gk.y + 3, 2, 2, 'grass');
    expect(placeBuilding(g, 'firestation', gk.x + 3, gk.y + 3).ok).toBe(true);
    expect(loadOk(asV4(g)).unlocked).toEqual(['U0', 'U2']);
  });
  it('AK-S1-15 Negativfälle → Beschädigter Spielstand bzw. Unbekannte Version, ohne Ausnahme', () => {
    const bad = (mut: (r: Record<string, unknown>) => void) => {
      const r = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      mut(r);
      return deserialize(JSON.stringify(r));
    };
    const damaged = { ok: false, reason: 'Beschädigter Spielstand' };
    const cases: ((r: Record<string, unknown>) => void)[] = [
      (r) => delete r.unlocked,
      (r) => (r.unlocked = 'U0'),
      (r) => (r.unlocked = ['U0', 'U9']),
      (r) => (r.unlocked = ['U0', 2]),
      (r) => (r.unlocked = ['U0', 'U2', 'U2']),
      (r) => (r.unlocked = ['U2']),
      (r) => (r.unlocked = ['U2', 'U0']),
      (r) => delete r.goodLocks,
      (r) => (r.goodLocks = [{ tier: 5, good: 'food' }]),
      (r) => (r.goodLocks = [{ tier: 2, good: 'gold' }]),
      (r) => (r.goodLocks = [{ tier: 1, good: 'cloth' }]),
      (r) =>
        (r.goodLocks = [
          { tier: 2, good: 'cloth' },
          { tier: 2, good: 'cloth' },
        ]),
      (r) =>
        (r.goodLocks = [
          { tier: 3, good: 'rum' },
          { tier: 2, good: 'cloth' },
        ]),
      (r) => delete r.upgradeStops,
      (r) => (r.upgradeStops = [0]),
      (r) => (r.upgradeStops = [4]),
      (r) => (r.upgradeStops = [1, 1]),
      (r) => (r.upgradeStops = [2, 1]),
    ];
    for (const m of cases) expect(() => bad(m)).not.toThrow();
    for (const m of cases) expect(bad(m)).toEqual(damaged);
    const v = village(1, { unlockAll: true });
    const r4 = JSON.parse(asV4(v.w)) as Record<string, unknown>;
    expect(deserialize(JSON.stringify({ ...r4, buildings: 5 }))).toEqual(damaged);
    const noHouse = JSON.parse(asV4(v.w)) as { buildings: Record<string, Record<string, unknown>> };
    delete noHouse.buildings[String(v.houses[0]!.id)]!.house;
    expect(() => deserialize(JSON.stringify(noHouse))).not.toThrow();
    expect(deserialize(JSON.stringify(noHouse))).toEqual(damaged);
    expect(bad((r) => (r.version = 8))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
  it('RF-1 gespeicherte Freischaltung gilt: U6 ohne won bleibt, U2 … U5 werden nicht nachgezogen', () => {
    const w = createWorld(3);
    w.unlocked = ['U0', 'U6'];
    const l = loadOk(serialize(w));
    expect(buildLock(l, 'bathhouse')).toBeNull();
    step(l);
    expect(l.unlocked).toEqual(['U0', 'U6']);
  });
  it('AK-S1-14 (c2) migrierter Werkzeugmacher ohne Schule: 100 Schritte noService, progress 20, Holz 10, Werkzeug gleich', () => {
    const c = createWorld(3, { unlockAll: true });
    const tm = connectedToolmaker(c);
    home(c).stock.wood = 10;
    tm.progress = 20;
    const w = loadOk(asV4(c));
    const tools = home(w).stock.tools;
    for (let i = 0; i < 100; i++) step(w);
    const b = w.buildings[tm.id]!;
    expect([b.state, b.progress, home(w).stock.wood, home(w).stock.tools]).toEqual([
      'noService',
      20,
      10,
      tools,
    ]);
  });
});

// Fixture erzeugt auf 7e46aae (src = 4a5130e) mit dem temporären Test tests/sim/gen-save-v5.test.ts (Plan M11 T00):
// Controller Seed 3, Krisen normal mit Feuerwache, angehalten bei Tick 2650 (Sturm aktiv ab 2601), serialize.
describe('M11 Fixture save-v5 (Anhang 02 E)', () => {
  it('T00 save-v5.json roh: version 5, ohne taxCarry/eff/level, Sturm aktiv bei Tick 2650; lädt', () => {
    const json = readFileSync('tests/sim/fixtures/save-v5.json', 'utf8');
    const raw = JSON.parse(json) as Record<string, unknown>;
    expect(raw.version).toBe(5);
    expect(raw.tick).toBe(2650);
    expect('taxCarry' in raw || 'upkeepCarry' in raw).toBe(false);
    const crisis = raw.crisis as { kind: string; from: number };
    expect(crisis.kind).toBe('storm');
    expect(crisis.from).toBeLessThanOrEqual(2650);
    for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>))
      expect('eff' in b || 'level' in b).toBe(false);
    expect(deserialize(json).ok).toBe(true); // nach T01: lädt als v6 (AK-SAV-02)
  });
});

const addRawB = (w: World, defId: BuildingDefId): Building => {
  const id = w.nextBuildingId++;
  return (w.buildings[id] = {
    id,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
  });
};

describe('M11 Save v6 (Spec 5)', () => {
  it('AK-SAV-01 createWorld: version 6, Überträge 0; nach 1000 Schritten Round-trip gleich', () => {
    const w = createWorld(3);
    expect([w.version, w.taxCarry, w.upkeepCarry]).toEqual([7, 0, 0]);
    const v = village(4);
    for (let i = 0; i < 1000; i++) step(v.w);
    expect(loadOk(serialize(v.w))).toEqual(v.w);
  });
  it('AK-SAV-02 save-v5.json lädt als v6 (Überträge 0, ohne eff/level, Auslastung 1000); v1–v4 durch die Kette', () => {
    const w = loadOk(readFileSync('tests/sim/fixtures/save-v5.json', 'utf8'));
    expect([w.version, w.taxCarry, w.upkeepCarry]).toEqual([7, 0, 0]);
    for (const b of Object.values(w.buildings)) {
      expect([b.eff, b.level]).toEqual([undefined, undefined]);
      expect(utilization(b)).toBe(BUILDING_DEFS[b.defId].produces ? 1000 : null);
    }
    expect(() => {
      for (let i = 0; i < 100; i++) step(w);
    }).not.toThrow();
    for (const f of ['save-v1.json', 'save-v2.json', 'save-v3.json', 'save-v4.json'])
      expect(loadOk(readFileSync(`tests/sim/fixtures/${f}`, 'utf8')).version, f).toBe(7);
  });
  it('AK-SAV-04 Beschädigter Spielstand bei kaputten Überträgen, eff, level, state; noForest angenommen', () => {
    const { w: v, houses } = village(1);
    const fisher = addRawB(v, 'fisher'); // fisher erhält in P3 einen LEVELS-Eintrag: Fälle bleiben gültig
    const chapel = addRawB(v, 'chapel');
    const on = (id: number, k: string, val: unknown) => (r: Record<string, unknown>) => {
      (r.buildings as Record<string, Record<string, unknown>>)[String(id)]![k] = val;
    };
    const cases: ((r: Record<string, unknown>) => void)[] = [
      (r) => (r.taxCarry = -1),
      (r) => (r.taxCarry = 20000),
      (r) => (r.taxCarry = 1.5),
      (r) => (r.upkeepCarry = 100),
      on(fisher.id, 'eff', -1),
      on(fisher.id, 'eff', 256001),
      on(fisher.id, 'eff', 1.5),
      on(houses[0]!.id, 'eff', 1000),
      on(fisher.id, 'level', 1),
      on(fisher.id, 'level', 4),
      on(chapel.id, 'level', 2),
      on(fisher.id, 'state', 'foo'),
    ];
    for (const c of cases) {
      expect(() => deserialize(tampered(v, c))).not.toThrow();
      expect(deserialize(tampered(v, c))).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });
    }
    for (const ok of [
      on(fisher.id, 'state', 'noForest'),
      on(fisher.id, 'eff', 0),
      on(fisher.id, 'eff', 256000),
    ])
      expect(deserialize(tampered(v, ok)).ok).toBe(true);
  });
  it('AK-SAV-05 version 7 → Unbekannte Version; SAVE_VERSION 6', () => {
    expect(SAVE_VERSION).toBe(7);
    expect(deserialize(tampered(createWorld(3), (r) => (r.version = 8)))).toEqual({
      ok: false,
      reason: 'Unbekannte Version',
    });
  });
});

describe('M12 E0 Schritt 0 (Anhang 01 C)', () => {
  const FIX = 'tests/sim/fixtures/save-v6.json';
  const LOCKS = 'tests/sim/fixtures/save-v6-locks.json';
  const raw = (path: string): Record<string, any> => JSON.parse(readFileSync(path, 'utf8')); // eslint-disable-line @typescript-eslint/no-explicit-any

  it('T00 save-v6.json roh', () => {
    const json = readFileSync(FIX, 'utf8');
    const r = raw(FIX);
    expect(r.version).toBe(6);
    expect(r.tick).toBe(3000);
    const bs = Object.values(r.buildings) as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(bs.some((b) => b.state === 'burning' && b.outageUntil !== undefined)).toBe(true);
    expect(r.crisis.kind).toBe('fire');
    expect(r.order.period).toBe(2);
    expect(r.upgradeStops).toEqual([1]);
    expect(bs.filter((b) => b.level === 2).length).toBeGreaterThanOrEqual(1);
    const stock = Object.values(r.stock) as number[];
    expect(stock).toHaveLength(9);
    expect(stock.filter((n) => n > 0)).toHaveLength(8);
    expect(r.taxCarry).toBeGreaterThan(0);
    expect(deserialize(json).ok).toBe(true);
  });
  it('T00 Rezept = Fixture', () => {
    expect(JSON.stringify(foldBackToV6(JSON.parse(serialize(fixtureV6Run().w))))).toBe(
      readFileSync(FIX, 'utf8'),
    );
  });
  it('T00 save-v6-locks.json roh', () => {
    const json = readFileSync(LOCKS, 'utf8');
    const r = raw(LOCKS);
    expect(r.version).toBe(6);
    expect(r.goodLocks).toEqual([{ tier: 1, good: 'food' }]);
    expect(r.upgradeStops).toEqual([1]);
    const bs = Object.values(r.buildings) as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(bs.filter((b) => b.defId === 'townhall')).toHaveLength(1);
    expect(r.stock.glass).toBeGreaterThan(0);
    expect(r.unlocked).toHaveLength(7);
    expect(deserialize(json).ok).toBe(true);
    expect(JSON.stringify(foldBackToV6(JSON.parse(serialize(locksV6Run()))))).toBe(json);
  });
  it('T00 v6-Formen', () => {
    const forms = {
      off: createWorld(3),
      unlockAll: createWorld(3, { unlockAll: true }),
      mild: createWorld(3, { crisisLevel: 'mild' }),
      normal: createWorld(3, { crisisLevel: 'normal' }),
    };
    for (const [k, w] of Object.entries(forms)) {
      const s = JSON.stringify(foldBackToV6(JSON.parse(serialize(w))));
      expect({ hash: fnv1a32(s), length: s.length }, k).toEqual(V6_FORMS[k]);
    }
  });
  it.each([1, 2, 3, 4, 5])('T00 Kette save-v%i', (n) => {
    const r = deserialize(readFileSync(`tests/sim/fixtures/save-v${n}.json`, 'utf8'));
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(fnv1a32(sortedJson(foldBackToV6(JSON.parse(serialize(r.world)))))).toBe(
        CHAIN_HASHES[n],
      );
  });
});

describe('M12 E0 Save v7', () => {
  const FIX = 'tests/sim/fixtures/save-v6.json';
  const LOCKS = 'tests/sim/fixtures/save-v6-locks.json';
  type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const rawOf = (path: string): Raw => JSON.parse(readFileSync(path, 'utf8'));
  const v7Json = (world: World): Raw => JSON.parse(serialize(world));
  const load = (json: string): World => {
    const r = deserialize(json);
    if (!r.ok) throw new Error(r.reason);
    return r.world;
  };
  const folded = (world: World): string => JSON.stringify(foldBackToV6(v7Json(world)));
  const hashOf = (s: string): { hash: number; length: number } => ({
    hash: fnv1a32(s),
    length: s.length,
  });
  const FORMS: Record<string, () => World> = {
    off: () => createWorld(3),
    unlockAll: () => createWorld(3, { unlockAll: true }),
    mild: () => createWorld(3, { crisisLevel: 'mild' }),
    normal: () => createWorld(3, { crisisLevel: 'normal' }),
  };

  it('AK-E0-17 Fold-back von createWorld(3) = gepinnte v6-Serialisierung', () => {
    expect(hashOf(folded(createWorld(3)))).toEqual(V6_FORMS['off']);
  });

  it('AK-E0-01 createWorld: version 7, genau eine Insel, Kontor island 0', () => {
    const fresh = createWorld(3);
    expect(fresh.version).toBe(7);
    expect(fresh.islands).toHaveLength(1);
    const isl = fresh.islands[0]!;
    expect(Object.keys(isl)).toEqual(['width', 'height', 'tiles', 'kontorId', 'stock']);
    expect(isl.width).toBe(64);
    expect(isl.height).toBe(64);
    expect(isl.tiles).toHaveLength(4096);
    expect(isl.kontorId).toBe(1);
    expect(fresh.buildings[1]!.island).toBe(0);
    const keys = Object.keys(fresh);
    for (const gone of ['width', 'height', 'tiles', 'kontorId', 'stock'])
      expect(keys).not.toContain(gone);
    expect(SAVE_VERSION).toBe(7);
  });

  it.each(Object.keys(FORMS))('AK-E0-02 Fold-back der Form %s = V6_FORMS', (k) => {
    expect(hashOf(folded(FORMS[k]!()))).toEqual(V6_FORMS[k]);
  });

  it('AK-E0-03 save-v6.json lädt als v7; Fold-back = Fixture ohne connected', () => {
    const fixture = rawOf(FIX);
    const world = load(readFileSync(FIX, 'utf8'));
    expect(world.version).toBe(7);
    expect(world.islands[0]!.stock).toEqual(fixture.stock);
    const back = JSON.parse(folded(world)) as Raw;
    const strip = (r: Raw): Raw => {
      const c = JSON.parse(JSON.stringify(r)) as Raw;
      for (const b of Object.values(c.buildings) as Raw[]) delete b.connected;
      return c;
    };
    expect(strip(back)).toEqual(strip(fixture));
  });

  it.each([1, 2, 3, 4, 5])('AK-E0-04 Kette save-v%i (Hash über Fold-back)', (n) => {
    const world = load(readFileSync(`tests/sim/fixtures/save-v${n}.json`, 'utf8'));
    expect(world.version).toBe(7);
    expect(fnv1a32(sortedJson(foldBackToV6(v7Json(world))))).toBe(CHAIN_HASHES[n]);
  });

  const stepTimes = (world: World, n: number): void => {
    for (let i = 0; i < n; i++) step(world);
  };

  it('AK-E0-05a save-v6.json: Weiterlauf wie fixtureV6Run()', () => {
    const loaded = load(readFileSync(FIX, 'utf8'));
    const live = fixtureV6Run().w;
    stepTimes(loaded, 300);
    stepTimes(live, 300);
    expect(serialize(loaded)).toBe(serialize(live));
  });

  it.each([
    [1000, (w: World) => expect(w.order).not.toBeNull()],
    [2650, (w: World) => expect(w.crisis?.kind).toBe('storm')],
    [4300, (w: World) => expect(w.crisis?.kind).toBe('boom')],
  ])('AK-E0-05b Fold-back-Stand Tick %i: Weiterlauf identisch', (tick, check) => {
    const live = normalRunTo(tick).w;
    check(live);
    const loaded = load(folded(live));
    stepTimes(loaded, 300);
    stepTimes(live, 300);
    expect(serialize(loaded)).toBe(serialize(live));
  });

  it('AK-E0-06 v6 nur mit Kontor lädt, Kontor island 0', () => {
    const world = load(folded(createWorld(3)));
    expect(world.islands[0]!.kontorId).toBe(1);
    expect(world.buildings[1]!.island).toBe(0);
  });

  it('AK-E0-06 Sperren aus save-v6-locks.json bleiben unverändert', () => {
    const fixture = rawOf(LOCKS);
    const world = load(readFileSync(LOCKS, 'utf8'));
    expect(world.unlocked).toEqual(fixture.unlocked);
    expect(world.goodLocks).toEqual(fixture.goodLocks);
    expect(world.upgradeStops).toEqual(fixture.upgradeStops);
    expect(world.islands[0]!.stock.glass).toBe(fixture.stock.glass);
  });

  describe('AK-E0-07 Ladeprüfung', () => {
    type Edit = (r: Raw) => void;
    const base = (): Raw => v7Json(createWorld(3));
    const v6 = (): Raw => JSON.parse(folded(createWorld(3)));
    const isl = (r: Raw): Raw => r.islands[0];
    const cases: Array<[string, () => Raw, Edit]> = [
      ['N01 v6 stock ohne glass', v6, (r) => delete r.stock.glass],
      ['N02 v6 buildings leer', v6, (r) => (r.buildings = {})],
      ['N03 islands fehlt', base, (r) => delete r.islands],
      ['N04 islands kein Array', base, (r) => (r.islands = {})],
      ['N05 islands leer', base, (r) => (r.islands = [])],
      [
        'N06 zwei Inseln',
        base,
        (r) => (r.islands = [r.islands[0], JSON.parse(JSON.stringify(r.islands[0]))]),
      ],
      ['N07 width 63', base, (r) => (isl(r).width = 63)],
      ['N08 height 65', base, (r) => (isl(r).height = 65)],
      ['N09 4095 Kacheln', base, (r) => isl(r).tiles.pop()],
      ['N10 Kachel null', base, (r) => (isl(r).tiles[5] = null)],
      ['N11 kontorId ohne Gebäude', base, (r) => (isl(r).kontorId = 99)],
      [
        'N12 kontorId auf Kapelle',
        base,
        (r) => {
          r.buildings[7] = { ...r.buildings[1], id: 7, defId: 'chapel' };
          isl(r).kontorId = 7;
          delete r.buildings[1];
        },
      ],
      ['N13 Kontor island 1', base, (r) => (r.buildings[1].island = 1)],
      ['N14 stock ohne Gut', base, (r) => delete isl(r).stock.wood],
      ['N15 stock.wood Text', base, (r) => (isl(r).stock.wood = 'viel')],
      ['N16 Gebäude ohne island', base, (r) => delete r.buildings[1].island],
      ['N17 island 1', base, (r) => (r.buildings[1].island = 1)],
      ['N18 island -1', base, (r) => (r.buildings[1].island = -1)],
      ['N19 island 0,5', base, (r) => (r.buildings[1].island = 0.5)],
      ['N20 island "0"', base, (r) => (r.buildings[1].island = '0')],
      ['N21 tiles zusätzlich oben', base, (r) => (r.tiles = isl(r).tiles)],
    ];
    it.each(cases)('%s', (_name, make, edit) => {
      const r = make();
      edit(r);
      const json = JSON.stringify(r);
      expect(() => deserialize(json)).not.toThrow();
      expect(deserialize(json)).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });
    });
  });

  it('AK-E0-08 Round-trip: Start, Endwelt, Welt im Brand', () => {
    const burning = normalRunTo(3000).w;
    expect(burning.crisis?.outcome).toBe('burning');
    for (const world of [createWorld(3), normalRunTo(1000).w, burning]) {
      const s1 = serialize(world);
      const s2 = serialize(load(s1));
      expect(s2).toBe(s1);
    }
  });

  it('AK-E0-08 geladener v6-Stand: zweiter Round-trip zeichengleich', () => {
    const once = serialize(load(readFileSync(FIX, 'utf8')));
    expect(serialize(load(once))).toBe(once);
  });

  it('AK-E0-09 version 8 → Unbekannte Version', () => {
    expect(deserialize(tampered(createWorld(3), (r) => (r.version = 8)))).toEqual({
      ok: false,
      reason: 'Unbekannte Version',
    });
  });
});

describe('M12 E1 Schritt 0 (Anhang 03 B)', () => {
  const FIX7 = 'tests/sim/fixtures/save-v7.json';
  it('T00 save-v7.json roh', () => {
    const json = readFileSync(FIX7, 'utf8');
    const r = JSON.parse(json);
    expect(r.version).toBe(7);
    expect(r.tick).toBe(3000);
    expect(r.islands).toHaveLength(1);
    expect(r.width).toBeUndefined();
    expect(Object.values(r.buildings).every((b: any) => b.island === 0)).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(r.crisis.kind).toBe('fire');
    expect(r.upgradeStops).toEqual([1]);
    expect(deserialize(json).ok).toBe(true);
  });
  it('T00 Rezept = Fixture v7', () => {
    expect(serialize(fixtureV7Run())).toBe(readFileSync(FIX7, 'utf8'));
  });
  it('T00 v7-Formen', () => {
    const forms = {
      off: createWorld(3),
      unlockAll: createWorld(3, { unlockAll: true }),
      mild: createWorld(3, { crisisLevel: 'mild' }),
      normal: createWorld(3, { crisisLevel: 'normal' }),
    };
    for (const [k, w] of Object.entries(forms)) {
      const s = serialize(w);
      expect({ hash: fnv1a32(s), length: s.length }, k).toEqual(V7_FORMS[k]);
    }
  });
});

describe('M12 E1 Save v8', () => {
  type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const FIX7 = 'tests/sim/fixtures/save-v7.json';
  const load = (json: string): World => {
    const r = deserialize(json);
    if (!r.ok) throw new Error(r.reason);
    return r.world;
  };
  const rawOf = (world: World): Raw => JSON.parse(serialize(world));
  const foreignOf = (world: World): Island[] => createWorld(world.seed).islands.slice(1);
  const hashOf = (s: string): { hash: number; length: number } => ({
    hash: fnv1a32(s),
    length: s.length,
  });

  it('AK-E1-05 createWorld(3): Heimat plus A und B, Fremdinseln ohne Kontor und Lager 0', () => {
    const fresh = createWorld(3);
    expect(SAVE_VERSION).toBe(8);
    expect(fresh.version).toBe(8);
    expect(fresh.islands).toHaveLength(3);
    expect(fresh.islands.map((i) => i.kind)).toEqual(['home', ...ISLANDS.map((d) => d.kind)]);
    expect(ISLANDS.some((d) => (d.kind as string) === 'home')).toBe(false);
    expect(Object.keys(fresh.islands[0]!)).toEqual([
      'kind',
      'width',
      'height',
      'tiles',
      'kontorId',
      'stock',
      'ox',
      'oy',
      'anchor',
    ]);
    for (const isl of fresh.islands.slice(1)) {
      expect(isl.kontorId).toBeNull();
      expect(GOOD_IDS.every((g) => isl.stock[g] === 0)).toBe(true);
      expect(isl.tiles).toHaveLength(isl.width * isl.height);
    }
    expect(home(fresh).ox).toBe(0);
    expect(home(fresh).oy).toBe(0);
  });

  it('AK-E1-05 save-v7.json lädt als v8 mit den Fremdinseln von createWorld(seed)', () => {
    const world = load(readFileSync(FIX7, 'utf8'));
    expect(world.version).toBe(8);
    expect(world.islands).toHaveLength(3);
    expect(world.islands.slice(1)).toEqual(foreignOf(world));
  });

  it('AK-E1-05 Round-trip: createWorld(3) und geladenes v7', () => {
    const fresh = createWorld(3);
    expect(serialize(load(serialize(fresh)))).toBe(serialize(fresh));
    const once = serialize(load(readFileSync(FIX7, 'utf8')));
    expect(serialize(load(once))).toBe(once);
  });

  it.each(['off', 'unlockAll', 'mild', 'normal'])('Bitgleich Heimat: Form %s = V7_FORMS', (k) => {
    const forms: Record<string, World> = {
      off: createWorld(3),
      unlockAll: createWorld(3, { unlockAll: true }),
      mild: createWorld(3, { crisisLevel: 'mild' }),
      normal: createWorld(3, { crisisLevel: 'normal' }),
    };
    expect(hashOf(JSON.stringify(foldBackToV7(rawOf(forms[k]!))))).toEqual(V7_FORMS[k]);
  });

  it('Bitgleich Heimat: Fold-back des geladenen save-v7.json = Datei', () => {
    const world = load(readFileSync(FIX7, 'utf8'));
    expect(JSON.stringify(foldBackToV7(rawOf(world)))).toBe(readFileSync(FIX7, 'utf8'));
  });

  describe('AK-E1-06 Ladeprüfung', () => {
    type Edit = (r: Raw) => void;
    const base = (): Raw => rawOf(createWorld(3));
    const cases: Array<[string, Edit]> = [
      ['L01 Länge 2', (r) => r.islands.pop()],
      ['L02 Kinds B, A', (r) => ([r.islands[1], r.islands[2]] = [r.islands[2], r.islands[1]])],
      ['L03 Kind C', (r) => (r.islands[1].kind = 'C')],
      ['L04 Heimat-Kind A', (r) => (r.islands[0].kind = 'A')],
      ['L05 A width 25', (r) => (r.islands[1].width = 25)],
      ['L06 B height 37', (r) => (r.islands[2].height = 37)],
      ['L07 tiles zu kurz', (r) => r.islands[1].tiles.pop()],
      ['L08 Heimat kontorId null', (r) => (r.islands[0].kontorId = null)],
      ['L09 A kontorId 1', (r) => (r.islands[1].kontorId = 1)],
      ['L10 ox 1,5', (r) => (r.islands[1].ox = 1.5)],
      ['L11 anchor fehlt', (r) => delete r.islands[1].anchor],
      ['L12 Heimat oy 3', (r) => (r.islands[0].oy = 3)],
      ['L13 Gebäude island 3', (r) => (r.buildings[1].island = 3)],
      ['L14 A ohne stock.food', (r) => delete r.islands[1].stock.food],
    ];
    it.each(cases)('%s', (_name, edit) => {
      const r = base();
      edit(r);
      const json = JSON.stringify(r);
      expect(() => deserialize(json)).not.toThrow();
      expect(deserialize(json)).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });
    });

    it('Gebäude auf Fremdinsel ohne Kontor lädt', () => {
      const r = base();
      r.buildings[2] = { ...r.buildings[1], id: 2, defId: 'chapel', x: 5, y: 5, island: 1 };
      r.nextBuildingId = 3;
      r.islands[1].tiles[5 * r.islands[1].width + 5].buildingId = 2;
      expect(r.islands[1].kontorId).toBeNull();
      expect(deserialize(JSON.stringify(r)).ok).toBe(true);
    });

    it('negatives ox/oy (ganzzahlig) lädt', () => {
      const r = base();
      r.islands[1].ox = -40;
      r.islands[1].oy = -3;
      expect(deserialize(JSON.stringify(r)).ok).toBe(true);
    });

    it.each([
      ['version 7 ohne Rest', { version: 7 }],
      ['islands null', { version: 7, islands: null }],
      ['leere Insel', { version: 7, seed: 'x', islands: [{}] }],
    ])('Garbage %s wirft nicht', (_n, obj) => {
      const json = JSON.stringify(obj);
      expect(() => deserialize(json)).not.toThrow();
      expect(deserialize(json).ok).toBe(false);
    });

    it('version 9 → Unbekannte Version', () => {
      expect(deserialize(tampered(createWorld(3), (r) => (r.version = 9)))).toEqual({
        ok: false,
        reason: 'Unbekannte Version',
      });
    });
  });

  describe('AK-M12-B5 Kette', () => {
    it.each([1, 2, 3, 4, 5, 6, 7])('save-v%i lädt als v8, Kettenhash über Fold-back', (n) => {
      const world = load(readFileSync(`tests/sim/fixtures/save-v${n}.json`, 'utf8'));
      expect(world.version).toBe(8);
      if (n <= 5)
        expect(fnv1a32(sortedJson(foldBackToV6(foldBackToV7(rawOf(world)))))).toBe(CHAIN_HASHES[n]);
    });

    it.each([1, 2, 3, 4, 5, 6, 7])('qa-B4 save-v%i: Fremdinseln wie createWorld(seed)', (n) => {
      const world = load(readFileSync(`tests/sim/fixtures/save-v${n}.json`, 'utf8'));
      expect(world.islands.slice(1)).toEqual(foreignOf(world));
      expect(world.islands.map((i) => i.kind)).toEqual(['home', 'A', 'B']);
    });
  });

  it('B6 createWorld gesamt: Mittel über Seeds 1…50 im Budget', () => {
    createWorld(1);
    const t0 = performance.now();
    for (let s = 1; s <= 50; s++) createWorld(s);
    const mean = (performance.now() - t0) / 50;
    expect(mean).toBeLessThanOrEqual(perfBudget(5));
  });
});
