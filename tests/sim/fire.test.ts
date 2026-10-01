import { beforeEach, describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../../src/sim/build';
import { beginCrisis, fireTarget, flammableRect, isProtected } from '../../src/sim/crises';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { totalUpkeep } from '../../src/sim/economy';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { forceRect, houseNearKontor, placeService } from './helpers';

const T = CRISIS_FIRST_TICK; // Periode 0 bei Stufe normal

let w: World;
let kx: number;
let ky: number;

/** Seed 3, Stufe normal; Gras östlich des Kontors, Hauptweg (kx+2 … kx+13, ky). */
beforeEach(() => {
  w = createWorld(3, { crisisLevel: 'normal' });
  const k = w.buildings[w.kontorId]!;
  kx = k.x;
  ky = k.y;
  forceRect(w, kx + 2, ky - 3, 14, 7, 'grass');
  withFunds(() => {
    for (let x = kx + 2; x <= kx + 13; x++) expect(placeRoad(w, x, ky).ok).toBe(true);
  });
});

/** Baut mit vollen Mitteln; danach gelten Geld und Lager wie vorher (Tests vergleichen sauber). */
function withFunds<R>(fn: () => R): R {
  const money = w.money;
  const stock = { ...w.stock };
  w.money = 1_000_000;
  for (const g of Object.keys(w.stock) as GoodId[]) w.stock[g] = 100;
  try {
    return fn();
  } finally {
    w.money = money;
    w.stock = stock;
  }
}

function put(defId: BuildingDefId, x: number, y: number): Building {
  let id = -1;
  withFunds(() => {
    const r = placeBuilding(w, defId, x, y);
    expect(r.ok, `${defId}@${x},${y}`).toBe(true);
    id = r.id!;
  });
  return w.buildings[id]!;
}

/** Angebundene Brennerei (kx+3, ky+1), Zuckerrohr 10, Tick T. */
function distillery(): Building {
  const d = put('distillery', kx + 3, ky + 1);
  w.stock.cane = 10;
  w.tick = T;
  return d;
}

const clone = (x: World): World => JSON.parse(serialize(x)) as World;
const run = (x: World, n: number): void => {
  for (let i = 0; i < n; i++) step(x);
};
const burnAt = (b: Building): void => beginCrisis(w, 0, { kind: 'fire', tile: { x: b.x, y: b.y } });

/** Brennbares Gebäude direkt einfügen (ohne Kacheln), für reine Zielwahl-Tests. */
function direct(defId: BuildingDefId, x: number, y: number): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId,
    x,
    y,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  w.buildings[b.id] = b;
  return b;
}

function reload(x: World): World {
  const r = deserialize(serialize(x));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

describe('M6 Brand und Feuerwache', () => {
  it('AK-S2-01 ungeschützter Brand: Gebühr sofort, Ausfall 200, danach Produktion', () => {
    const d = distillery();
    const twin = clone(w);
    const m0 = w.money;
    burnAt(d);
    expect(w.money - m0).toBe(-250);
    expect(w.crisis).toMatchObject({ kind: 'fire', outcome: 'burning', target: d.id });
    expect(d.state).toBe('burning');
    expect(d.outageUntil).toBe(T + 200);
    for (let i = 0; i < 200; i++) {
      step(w);
      step(twin);
      expect(d.progress, `tick ${w.tick}`).toBe(0);
    }
    expect(d.state).toBe('ok');
    expect(d.outageUntil).toBeUndefined();
    run(w, 200);
    run(twin, 200);
    expect([w.stock.rum, w.stock.cane]).toEqual([4, 6]);
    expect([twin.stock.rum, twin.stock.cane]).toEqual([8, 2]);
  });

  it('AK-S2-02 Fortschritt verloren, entnommener Input kommt nicht zurück', () => {
    const d = distillery();
    d.progress = 30;
    burnAt(d);
    expect(d.progress).toBe(0);
    expect(w.stock.cane).toBe(10);
  });

  it('AK-S2-03 geschützt nur mit angebundener Wache im Mittenabstand ≤ 8', () => {
    const d = distillery();
    put('firestation', kx + 6, ky + 1); // Mittenabstand 2.55, Weg nördlich
    w.tick = T;
    const twin = clone(w);
    const m0 = w.money;
    burnAt(d);
    expect(w.crisis).toMatchObject({ outcome: 'extinguished', target: d.id });
    expect(d.outageUntil).toBeUndefined();
    expect(w.money).toBe(m0);
    run(w, 400);
    run(twin, 400);
    expect([w.stock.rum, w.stock.cane, w.money]).toEqual([
      twin.stock.rum,
      twin.stock.cane,
      twin.money,
    ]);
  });

  it.each([
    ['nicht angebunden', 6, 3], // keine Wegkachel angrenzend, Mittenabstand 2.9
    ['Mittenabstand 8.51 (dx 8.5, dy 0.5)', 12, 1],
  ])('AK-S2-03 Wache %s → burning', (_n, dx, dy) => {
    const d = distillery();
    put('firestation', kx + dx, ky + dy);
    w.tick = T;
    burnAt(d);
    expect(w.crisis!.outcome).toBe('burning');
  });

  it('AK-S2-03 Grenze: Mittenabstand 7.52 (dx 7.5, dy 0.5) schützt', () => {
    const d = distillery();
    put('firestation', kx + 11, ky + 1);
    w.tick = T;
    expect(isProtected(w, d)).toBe(true);
  });

  it('AK-S2-04 Ziel: miss ausserhalb 2, nächstes vor fernerem, Gleichstand kleinste Id, Haus übersprungen', () => {
    const far = direct('weaver', 40, 40);
    expect(fireTarget(w, { x: 35, y: 40 })).toBeNull(); // dx = 40 − 35 = 5
    w.tick = T;
    const m0 = w.money;
    beginCrisis(w, 0, { kind: 'fire', tile: { x: 35, y: 40 } });
    expect(w.crisis!.outcome).toBe('miss');
    expect(w.crisis!.target).toBeUndefined();
    expect(w.money).toBe(m0);
    delete w.buildings[far.id];
    const a = direct('weaver', 22, 19); // Abstand 2 zu (20,20)
    const b = direct('weaver', 18, 21); // Abstand 1
    expect(fireTarget(w, { x: 20, y: 20 })!.id).toBe(b.id);
    delete w.buildings[b.id];
    direct('weaver', 17, 22); // ebenfalls Abstand 2, grössere Id
    expect(fireTarget(w, { x: 20, y: 20 })!.id).toBe(a.id);
    direct('house', 20, 20); // Wohnhaus auf der Kachel: nicht brennbar
    expect(fireTarget(w, { x: 20, y: 20 })!.id).toBe(a.id);
  });

  it('AK-S2-05 ohne brennbare Gebäude: Rechteck null, Brand miss ohne Kachel, 200 Ticks Krise', () => {
    houseNearKontor(w);
    put('market', kx + 4, ky + 1);
    expect(flammableRect(w)).toBeNull();
    w.tick = 2999; // Seed 3: Periode 1 ist ein Brand
    step(w);
    expect(w.crisis).toMatchObject({ kind: 'fire', period: 1, outcome: 'miss' });
    expect(w.crisis!.tile).toBeUndefined();
    run(w, 199);
    expect(w.crisis).not.toBeNull();
    step(w);
    expect(w.crisis).toBeNull();
  });

  it('AK-S2-06 Brand bei Geld −100 bucht trotzdem', () => {
    const d = distillery();
    w.money = -100;
    burnAt(d);
    expect(w.money).toBe(-350);
    expect(d.state).toBe('burning');
  });

  it('AK-S2-07 brennende Kapelle: Dienst fällt aus, Haus verliert Bewohner', () => {
    const house = houseNearKontor(w);
    house.house = {
      ...house.house!,
      tier: 2,
      inhabitants: 8,
      demand: { food: 0, cloth: 0 },
      satisfied: { food: true, cloth: true },
      services: { faith: true, school: false },
      satisfiedSince: T - 1000,
      supplied: true,
    } as typeof house.house;
    w.stock.food = 100;
    w.stock.cloth = 100;
    const chapel = placeService(w, 'chapel', kx + 3, ky - 3);
    w.tick = T;
    const twin = clone(w);
    burnAt(chapel);
    for (let i = 1; i <= 200; i++) {
      step(w);
      step(twin);
      expect(house.house!.services.faith, `tick ${w.tick}`).toBe(false);
      if (i === 1) expect(house.house!.satisfiedSince).toBe(T + 1);
      if (i === 100) {
        expect(house.house!.inhabitants).toBe(6);
        expect(w.stats.taxes).toBe(21);
        const th = twin.buildings[house.id]!.house!;
        expect(th.inhabitants).toBe(8);
        expect(twin.stats.taxes).toBe(56);
      }
      expect(house.house!.tier).toBe(2);
    }
    step(w);
    expect(house.house!.services.faith).toBe(true);
    expect(house.house!.tier).toBe(2);
  });

  it('AK-S2-08 Abriss während des Brandes: halbe Kosten zurück, Krise läuft weiter', () => {
    const d = distillery();
    burnAt(d);
    const m1 = w.money;
    const s = { ...w.stock };
    expect(demolish(w, d.id)).toEqual({ ok: true });
    expect(w.money - m1).toBe(125);
    expect(w.stock.wood - s.wood).toBe(7);
    expect(w.stock.tools - s.tools).toBe(2);
    expect(w.stock.stone - s.stone).toBe(2);
    expect(w.crisis).toMatchObject({ target: d.id });
    run(w, 199);
    expect(w.crisis).not.toBeNull();
    step(w);
    expect(w.tick).toBe(T + 200);
    expect(w.crisis).toBeNull();
  });

  it('AK-S2-09 Anbindung: Verlust während Brand endet in notConnected, Wiederanbindung in ok', () => {
    const d = distillery();
    burnAt(d);
    removeRoad(w, kx + 2, ky);
    expect(d.connected).toBe(false);
    expect(d.state).toBe('burning');
    run(w, 200);
    expect(d.state).toBe('notConnected');

    w = createWorld(3, { crisisLevel: 'normal' });
    const k = w.buildings[w.kontorId]!;
    kx = k.x;
    ky = k.y;
    forceRect(w, kx + 2, ky - 3, 14, 7, 'grass');
    withFunds(() => {
      for (let x = kx + 2; x <= kx + 13; x++) placeRoad(w, x, ky);
    });
    const d2 = distillery();
    burnAt(d2);
    removeRoad(w, kx + 2, ky);
    withFunds(() => placeRoad(w, kx + 2, ky));
    expect(d2.connected).toBe(true);
    expect(d2.state).toBe('burning');
    run(w, 200);
    expect(d2.state).toBe('ok');
  });

  it('AK-S2-10 Feuerwache und Brennbarkeit laut Spec 4.4/5.5', () => {
    expect(BUILDING_DEFS.firestation).toMatchObject({
      name: 'Feuerwache',
      w: 1,
      h: 1,
      cost: { money: 150, wood: 10, tools: 2, stone: 0 },
      upkeep: 10,
      category: 'public',
      serviceRadius: 8,
      fireProtection: true,
      site: [],
    });
    expect(BUILDING_DEFS.firestation.flammable).toBeUndefined();
    const flammable = BUILDING_IDS.filter((id) => BUILDING_DEFS[id].flammable === true).sort();
    expect(flammable).toEqual([
      'canefarm',
      'chapel',
      'distillery',
      'fisher',
      'lumberjack',
      'quarry',
      'school',
      'sheepfarm',
      'toolmaker',
      'weaver',
    ]);
    expect(BUILDING_IDS.filter((id) => BUILDING_DEFS[id].fireProtection === true)).toEqual([
      'firestation',
    ]);
    const base = totalUpkeep(w);
    const lone = put('firestation', kx + 6, ky + 3); // ohne Weg
    expect(lone.state).toBe('notConnected');
    const linked = put('firestation', kx + 6, ky + 1); // Weg nördlich
    expect(linked.state).toBe('ok');
    expect(totalUpkeep(w) - base).toBe(20);
  });

  it('AK-S2-11 Laden während des Ausfalls: Verlauf wie ohne Laden', () => {
    const d = distillery();
    burnAt(d);
    run(w, 50);
    w = reload(w);
    run(w, 350);
    expect([w.stock.rum, w.stock.cane]).toEqual([4, 6]);
  });

  it('AK-S2-12 Unterhalt läuft während des Ausfalls weiter', () => {
    const d = distillery();
    const twin = clone(w);
    burnAt(d);
    for (let i = 0; i < 2; i++) {
      run(w, 400);
      run(twin, 400);
      expect(twin.money - w.money).toBe(250);
      expect(w.stats.upkeep).toBe(twin.stats.upkeep);
    }
  });

  it('RF-3 nicht angebundenes Gebäude brennt: Gebühr, burning, danach notConnected', () => {
    const d = distillery();
    withFunds(() => removeRoad(w, kx + 2, ky));
    expect(d.state).toBe('notConnected');
    const m0 = w.money;
    burnAt(d);
    expect(w.money - m0).toBe(-250);
    expect(d.state).toBe('burning');
    run(w, 200);
    expect(d.state).toBe('notConnected');
    expect(d.outageUntil).toBeUndefined();
  });

  it.each([0, 199])('RF-4 Speichern nach %i Ticks Ausfall: Verlauf bitgleich', (after) => {
    const d = distillery();
    burnAt(d);
    expect(d.state).toBe('burning');
    const twin = clone(w);
    run(w, after);
    w = reload(w);
    run(w, 400 - after);
    run(twin, 400);
    expect(serialize(w)).toBe(serialize(twin));
  });

  it('RF-5 Ziel abgerissen: Stand lädt, Krise läuft bis until', () => {
    const d = distillery();
    burnAt(d);
    expect(w.crisis!.target).toBe(d.id);
    demolish(w, d.id);
    run(w, 10);
    expect(deserialize(serialize(w)).ok).toBe(true);
    while (w.tick < T + 200) step(w);
    expect(w.crisis).toBeNull();
  });
});
