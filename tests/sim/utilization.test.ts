import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { utilization } from '../../src/sim/levels';
import { tickProduction } from '../../src/sim/production';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { createWorld, tileAt } from '../../src/sim/world';
import { forceRect, placeService, village } from './helpers';

/** Fügt einen Betrieb direkt ein (angebunden, ohne Kacheln; Muster production.test.ts). */
function prod(w: World, defId: BuildingDefId, x: number, y: number): Building {
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

function run(w: World, n: number): void {
  for (let i = 0; i < n; i++) {
    w.tick += 1;
    tickProduction(w);
  }
}

/** Jagdhütte mit freiem Wald und Weg zum Kontor (Muster sources.test.ts). */
function hunterAt(w: World): Building {
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y, 5, 1, 'grass');
  forceRect(w, k.x + 3, k.y - 4, 7, 7, 'grass');
  forceRect(w, k.x + 4, k.y - 3, 5, 2, 'forest');
  for (let i = 2; i <= 6; i++) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
  const r = placeBuilding(w, 'hunter', k.x + 6, k.y - 1);
  expect(r.ok).toBe(true);
  return w.buildings[r.id!]!;
}

/** Weberei mit Weg zum Kontor, über placeBuilding angebunden. */
function weaverAt(w: World): Building {
  const k = w.buildings[w.kontorId]!;
  if (!tileAt(w, k.x + 2, k.y)!.road) forceRect(w, k.x + 2, k.y, 3, 1, 'grass'); // Weg vorhanden: nicht überschreiben
  forceRect(w, k.x + 3, k.y + 1, 2, 2, 'grass');
  for (let i = 2; i <= 4; i++)
    if (!tileAt(w, k.x + i, k.y)!.road) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
  const r = placeBuilding(w, 'weaver', k.x + 3, k.y + 1);
  expect(r.ok).toBe(true);
  const b = w.buildings[r.id!]!;
  expect(b.connected).toBe(true);
  return b;
}

describe('M11 Auslastung (Spec 3.5)', () => {
  it('AK-P2S4-01 Fischer ohne eff, 500 Schritte ok: eff 256 000, utilization 1000', () => {
    const w = createWorld(3);
    w.stock.food = 0;
    const f = prod(w, 'fisher', 0, 0);
    run(w, 500);
    expect([f.state, f.eff, utilization(f)]).toEqual(['ok', 256000, 1000]);
  });

  it('AK-P2S4-02 Weberei ohne Wolle: nach 256 Schritten 367, nach 2000 genau 0', () => {
    const w = createWorld(3);
    w.stock.wool = 0;
    const v = prod(w, 'weaver', 0, 0);
    run(w, 256);
    expect([v.state, v.eff, utilization(v)]).toEqual(['waitingInput', 94072, 367]);
    run(w, 2000 - 256);
    expect([v.eff, utilization(v)]).toEqual([255, 0]);
  });

  it('AK-P2S4-03 ab eff 0 mit ok: nach 2000 Schritten genau 1000', () => {
    const w = createWorld(3);
    w.stock.food = 0;
    const f = prod(w, 'fisher', 0, 0);
    f.eff = 0;
    run(w, 1912);
    expect(utilization(f)).toBe(999);
    run(w, 88);
    expect([f.eff, utilization(f)]).toEqual([256000, 1000]);
  });

  it('AK-P2S4-04 Dauersturm: Fischer 450 … 550 (gemessen 499 oder 501), Jagdhütte 1000', () => {
    const w = createWorld(3, { unlockAll: true });
    w.money = 10_000;
    w.stock.food = 0;
    const h = hunterAt(w);
    w.crisis = { period: 0, kind: 'storm', from: w.tick + 1, until: w.tick + 3000 };
    const f = prod(w, 'fisher', 0, 0);
    run(w, 2000);
    expect(utilization(f)).toBeGreaterThanOrEqual(450);
    expect(utilization(f)).toBeLessThanOrEqual(550);
    expect([499, 501]).toContain(utilization(f));
    expect(utilization(h)).toBe(1000);
  });

  it('AK-P2S4-05 Speichern nach 777 Schritten, Laden, je 500 weitere: serialize gleich; eff im Spielstand', () => {
    const w = createWorld(3, { unlockAll: true });
    w.money = 10_000;
    w.stock.wool = 0;
    hunterAt(w); // zweiter, angebundener Betrieb (ein direkt eingefügter Fischer verliert beim Laden `connected`)
    const v = weaverAt(w);
    for (let i = 0; i < 777; i++) step(w);
    expect(JSON.parse(serialize(w)).buildings[v.id].eff).toBeLessThan(256000);
    const r = deserialize(serialize(w));
    if (!r.ok) throw new Error(r.reason);
    for (let i = 0; i < 500; i++) {
      step(w);
      step(r.world);
    }
    expect(serialize(r.world)).toBe(serialize(w));
  });

  it('AK-P2S4-06 Häuser, Kapelle, Markt nie mit eff; Zwilling mit eff 0 hat gleiches Geld und Lager', () => {
    const { w } = village(4, { unlockAll: true });
    placeService(w, 'chapel', 30, 30);
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 2, k.y + 3, 2, 2, 'grass');
    const m = placeBuilding(w, 'market', k.x + 2, k.y + 3);
    expect(m.ok).toBe(true);
    const f = hunterAt(w); // angebundener Betrieb; Jagdhütte statt Fischer (Standort Küste)
    const twin = deserialize(serialize(w));
    if (!twin.ok) throw new Error(twin.reason);
    const tf = twin.world.buildings[f.id]!;
    tf.eff = 0;
    for (let i = 0; i < 1000; i++) {
      step(w);
      step(twin.world);
    }
    for (const b of Object.values(w.buildings)) {
      if (BUILDING_DEFS[b.defId].produces === undefined) expect(b.eff).toBeUndefined();
    }
    expect(f.eff).not.toBeUndefined();
    expect(twin.world.money).toBe(w.money);
    expect(twin.world.stock).toEqual(w.stock);
    expect(tf.eff).not.toBe(f.eff);
  });

  it('RF-4 Abriss und Neubau am selben Platz: eff und level weg, Neubau Stufe 1 mit 100 %', () => {
    const w = createWorld(3, { unlockAll: true });
    w.money = 10_000;
    w.stock.wool = 0;
    const v = weaverAt(w);
    for (let i = 0; i < 300; i++) step(w);
    expect(v.eff).toBeLessThan(256000);
    v.level = 2;
    const { x, y } = v;
    expect(demolish(w, v.id).ok).toBe(true);
    w.money = 10_000;
    const r = placeBuilding(w, 'weaver', x, y);
    expect(r.ok).toBe(true);
    const n = w.buildings[r.id!]!;
    expect([n.eff, n.level, utilization(n)]).toEqual([undefined, undefined, 1000]);
  });
});
