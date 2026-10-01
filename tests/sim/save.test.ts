import { beforeEach, describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import v2Json from './fixtures/save-v2.json?raw';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis, type CrisisRoll } from '../../src/sim/crises';
import { GOODS, GOOD_IDS, SELL_FLOOR } from '../../src/sim/defs/goods';
import { CRISIS_FIRST_TICK, FIRE_OUTAGE } from '../../src/sim/defs/timing';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { forceGrass, prepareEast } from './helpers';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(42);
  k = w.buildings[w.kontorId]!;
  prepareEast(w, k);
});

/** Serialisiert, lässt `edit` am rohen Objekt manipulieren und gibt wieder JSON zurück. */
function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

function expectFailure(json: string, reason: string): void {
  const r = deserialize(json);
  expect(r).toEqual({ ok: false, reason });
}

describe('save', () => {
  it('uses version 3', () => {
    expect(SAVE_VERSION).toBe(3);
  });

  it('AK-S1-01 createWorld starts with the v2 fields', () => {
    const fresh = createWorld(3);
    expect(fresh.version).toBe(3);
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
    expect(loaded.version).toBe(3);
    expect(loaded.taxLevel).toBe('normal');
    expect(loaded.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => loaded.sellPct[g] === 100)).toBe(true);
    expect(loaded.order).toBeNull();
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.money).toBe(before.money);
    expect(loaded.stock).toEqual(before.stock);
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
      tampered(w, (r) => (r.version = 4)),
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
    expectFailure(JSON.stringify({ ...w, version: 4 }), 'Unbekannte Version');
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
      delete (raw.stock as Record<string, unknown>).rum;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a wrong number of tiles', () => {
    const json = tampered(w, (raw) => {
      (raw.tiles as unknown[]).pop();
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a tiles array with a null element', () => {
    const json = tampered(w, (raw) => {
      (raw.tiles as unknown[])[0] = null;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a building with an unknown defId', () => {
    const json = tampered(w, (raw) => {
      const b = (raw.buildings as Record<string, Building>)[String(w.kontorId)]!;
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
    for (const json of ['', '{not json', '42', 'null', '[]', '{"version":1}', '"text"']) {
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
  it('AK-S1-01 createWorld: version 3, Stufe off, keine Krise; Option setzt nur die Stufe', () => {
    const a = createWorld(3);
    expect(a.version).toBe(3);
    expect(a.crisisLevel).toBe('off');
    expect(a.crisis).toBeNull();
    const b = createWorld(3, { crisisLevel: 'normal' });
    expect(b.crisisLevel).toBe('normal');
    expect({ ...b, crisisLevel: 'off' }).toEqual(a);
    expect(Object.keys(a).slice(-2)).toEqual(['crisisLevel', 'crisis']); // Key-Reihenfolge (AK-B1-02)
  });

  // Fixture erzeugt auf main 3fcb678 über den temporären Test tests/sim/gen-save-v2.test.ts
  // (GEN_SAVE_V2=1; Seed 3, Weg + Holzfäller + Haus östlich des Kontors, Steuer low bei 1000, 10 Holz verkauft
  // bei 1590, Tick 1600 mit Auftrag Periode 1), siehe Plan M6-Sim Task 1a.
  it('AK-S1-02 lädt einen echten v2-Stand und migriert ihn nach v3', () => {
    const before = JSON.parse(v2Json) as World;
    expect(before.version).toBe(2);
    const r = deserialize(v2Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world;
    expect(loaded.version).toBe(3);
    expect(loaded.crisisLevel).toBe('off');
    expect(loaded.crisis).toBeNull();
    expect(Object.values(loaded.buildings).some((b) => b.outageUntil !== undefined)).toBe(false);
    const shape = (x: World): unknown[] =>
      Object.values(x.buildings).map((b) => [b.id, b.defId, b.x, b.y, b.progress, b.state]);
    expect(shape(loaded)).toEqual(shape(before));
    expect(loaded.stock).toEqual(before.stock);
    expect(loaded.money).toBe(before.money);
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.taxLevel).toBe(before.taxLevel);
    expect(loaded.sellPct).toEqual(before.sellPct);
    expect(loaded.order).toEqual(before.order);
    expect(before.order).not.toBeNull();
    expect(before.sellPct.wood).toBeLessThan(100);
  });

  it('AK-S1-03 lädt den v1-Stand über v2 nach v3', () => {
    const r = deserialize(v1Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(3);
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
      k = w.buildings[w.kontorId]!;
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
      k = w.buildings[w.kontorId]!;
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
      tampered(storm(), (r) => (r.version = 4)),
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
