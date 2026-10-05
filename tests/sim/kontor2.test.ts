import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { plantForest } from '../../src/sim/forest';
import { generateForeignIslands } from '../../src/sim/islands';
import { canPlace, canPlaceRoad } from '../../src/sim/placement';
import { effectiveRefund } from '../../src/sim/queries';
import { serialize } from '../../src/sim/save';
import type { BuildingDefId, World } from '../../src/sim/types';
import { adjacentOf, createWorld, home, tileAt } from '../../src/sim/world';
import { SEED_D37 } from './seePins';
import { seaWorld, shipLiteral } from './seaHelpers';

const B = 2;
const NO_KONTOR = 'Erst ein Kontor auf dieser Insel';

const kontorSite = (w: World, island: number) =>
  generateForeignIslands(w.seed, home(w))[island - 1]!.kontorSite;

/** Gründet kontor2 auf `island` aus dem Heimatlager; Lager der Insel bleibt unberührt. */
function found(w: World, island: number): number {
  const s = kontorSite(w, island);
  const r = placeBuilding(w, 'kontor2', s.x, s.y, island);
  expect(r.ok).toBe(true);
  return r.id!;
}

/** Erster Platz für defId auf der Insel (feste Scanreihenfolge). */
function siteOf(w: World, defId: BuildingDefId, island: number): { x: number; y: number } {
  const isl = w.islands[island]!;
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) if (canPlace(w, defId, x, y, island).ok) return { x, y };
  throw new Error(`kein Platz für ${defId}`);
}
/** Alle Gründe, aus denen `defId` auf der Insel an irgendeiner Kachel scheitert. */
function reasonsOn(w: World, defId: BuildingDefId, island: number): Set<string> {
  const isl = w.islands[island]!;
  const out = new Set<string>();
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) {
      const r = canPlace(w, defId, x, y, island);
      if (!r.ok) out.add(r.reason);
    }
  return out;
}
const lumberSite = (w: World, island: number) => siteOf(w, 'lumberjack', island);

/** Legt Wege per BFS über freie Kacheln vom Holzfäller bis ans Kontor der Insel. */
function roadBetween(w: World, island: number, from: { x: number; y: number }): void {
  const isl = w.islands[island]!;
  const k = w.buildings[isl.kontorId!]!;
  const goal = new Set(adjacentOf(isl, k.x, k.y, 2, 2).map((p) => `${p.x},${p.y}`));
  const prev = new Map<string, string | null>();
  const queue: { x: number; y: number }[] = [];
  for (const p of adjacentOf(isl, from.x, from.y, 1, 1)) {
    if (!canPlaceRoad(w, p.x, p.y, island).ok) continue;
    prev.set(`${p.x},${p.y}`, null);
    queue.push(p);
  }
  for (let h = 0; h < queue.length; h++) {
    const c = queue[h]!;
    if (goal.has(`${c.x},${c.y}`)) {
      for (let key: string | null = `${c.x},${c.y}`; key !== null; key = prev.get(key) ?? null) {
        const [x, y] = key.split(',').map(Number);
        expect(placeRoad(w, x!, y!, island).ok).toBe(true);
      }
      return;
    }
    for (const p of adjacentOf(isl, c.x, c.y, 1, 1)) {
      const key = `${p.x},${p.y}`;
      if (prev.has(key) || !canPlaceRoad(w, p.x, p.y, island).ok) continue;
      prev.set(key, `${c.x},${c.y}`);
      queue.push(p);
    }
  }
  throw new Error('kein Weg gefunden');
}

describe('M12 E2 Kontor II', () => {
  it('AK-E2-01: ohne Seefahrt gesperrt, mit Seefahrt Kosten aus dem Heimatlager', () => {
    const locked = createWorld(SEED_D37);
    const s = kontorSite(locked, B);
    expect(canPlace(locked, 'kontor2', s.x, s.y, B)).toEqual({
      ok: false,
      reason: 'Seefahrt mit den Kaufleuten',
    });
    const w = seaWorld();
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    home(w).stock.stone = 100;
    w.islands[B]!.stock.wood = 7;
    const money = w.money;
    const id = found(w, B);
    const c = BUILDING_DEFS.kontor2.cost;
    expect(w.money).toBe(money - c.money);
    expect(home(w).stock.wood).toBe(100 - c.wood);
    expect(home(w).stock.tools).toBe(100 - c.tools);
    expect(home(w).stock.stone).toBe(100 - c.stone);
    expect(w.islands[B]!.stock.wood).toBe(7);
    expect(w.islands[B]!.kontorId).toBe(id);
    const again = reasonsOn(w, 'kontor2', B);
    expect(again).toContain('Auf dieser Insel steht schon ein Kontor');
    expect(reasonsOn(w, 'kontor2', 0)).toContain('Nur auf einer fernen Insel');
  });

  it('AK-E2-02: ohne Kontor kein Bau, Weg, Forst; danach Bau aus dem Insellager', () => {
    const w = seaWorld();
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    home(w).stock.stone = 100;
    w.islands[B]!.stock.wood = 50;
    w.islands[B]!.stock.tools = 50;
    const isl = w.islands[B]!;
    const k = kontorSite(w, B);
    expect(canPlace(w, 'lumberjack', k.x + 3, k.y, B)).toEqual({ ok: false, reason: NO_KONTOR });
    expect(placeRoad(w, k.x + 3, k.y, B)).toEqual({ ok: false, reason: NO_KONTOR });
    expect(plantForest(w, k.x + 3, k.y, B)).toEqual({ ok: false, reason: NO_KONTOR });
    found(w, B);
    const homeBefore = { ...home(w).stock };
    const lj2 = lumberSite(w, B);
    const woodB = isl.stock.wood;
    const r = placeBuilding(w, 'lumberjack', lj2.x, lj2.y, B);
    expect(r.ok).toBe(true);
    expect(isl.stock.tools).toBe(50 - BUILDING_DEFS.lumberjack.cost.tools);
    expect(isl.stock.wood).toBe(woodB - BUILDING_DEFS.lumberjack.cost.wood);
    expect(home(w).stock).toEqual(homeBefore);
    expect(w.buildings[r.id!]!.connected).toBe(false);
    roadBetween(w, B, lj2);
    expect(w.buildings[r.id!]!.connected).toBe(true);
  });

  it('AK-E2-02: gleiche Wege auf der Heimat binden den Fremdinsel-Betrieb nicht an', () => {
    const w = seaWorld();
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    home(w).stock.stone = 100;
    found(w, B);
    w.islands[B]!.stock.tools = 50;
    const lj = lumberSite(w, B);
    const id = placeBuilding(w, 'lumberjack', lj.x, lj.y, B).id!;
    const k = kontorSite(w, B);
    for (let x = Math.min(lj.x, k.x); x <= Math.max(lj.x, k.x); x++)
      tileAt(home(w), x, lj.y)!.road = true;
    expect(w.buildings[id]!.connected).toBe(false);
  });

  it('AK-E2-12: zu wenig im Heimatlager nennt die Heimat, Welt unverändert', () => {
    const w = seaWorld();
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    home(w).stock.stone = 9;
    w.islands[B]!.stock.stone = 10;
    const before = serialize(w);
    const s = kontorSite(w, B);
    expect(placeBuilding(w, 'kontor2', s.x, s.y, B)).toEqual({
      ok: false,
      reason: 'Nicht genug Stein in der Heimat',
    });
    expect(serialize(w)).toBe(before);
  });

  it('AK-E2-13: leeres Lager der Fremdinsel nennt die Insel, auch bei vollem Heimatlager', () => {
    const w = seaWorld();
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    home(w).stock.stone = 100;
    found(w, B);
    const isl = w.islands[B]!;
    isl.stock.wood = 0;
    isl.stock.tools = 50;
    const lj = siteOf(w, 'hunter', B);
    // Holzfäller kostet kein Holz (Plan sagte Holz); Jagdhütte kostet Holz und hat dieselbe Gründe-Reihenfolge
    const r = placeBuilding(w, 'hunter', lj.x, lj.y, B);
    expect(r.ok === false && r.reason).toBe('Nicht genug Holz auf Felsbucht');
  });

  describe('AK-E2-03 Abriss', () => {
    function setup() {
      const w = seaWorld();
      home(w).stock.wood = 100;
      home(w).stock.tools = 100;
      home(w).stock.stone = 100;
      const id = found(w, B);
      w.islands[B]!.stock.wood = 40;
      w.islands[B]!.stock.tools = 20;
      return { w, id };
    }
    const BLOCKED = { ok: false, reason: 'Erst Route auflösen' };

    it('(a) Schiff mit Route auf B sperrt', () => {
      const { w, id } = setup();
      shipLiteral(w, { route: { a: 0, b: B, ab: [], ba: [] } });
      expect(demolish(w, id)).toEqual(BLOCKED);
      expect(w.buildings[id]).toBeDefined();
    });

    it('(b) Schiff mit Ziel B sperrt', () => {
      const { w, id } = setup();
      shipLiteral(w, { to: B, left: 5 });
      expect(demolish(w, id)).toEqual(BLOCKED);
    });

    it('(c) ohne Bezug: Hälfte ins Heimatlager, Insellager bleibt, Betriebe getrennt', () => {
      const { w, id } = setup();
      const lj = lumberSite(w, B);
      const lid = placeBuilding(w, 'lumberjack', lj.x, lj.y, B).id!;
      roadBetween(w, B, lj);
      expect(w.buildings[lid]!.connected).toBe(true);
      const stockB = { ...w.islands[B]!.stock };
      const money = w.money;
      const homeStock = { ...home(w).stock };
      const refund = effectiveRefund(w, BUILDING_DEFS.kontor2.cost);
      expect(demolish(w, id)).toEqual({ ok: true });
      expect(w.money).toBe(money + refund.money);
      expect(home(w).stock.wood).toBe(homeStock.wood + refund.wood);
      expect(home(w).stock.tools).toBe(homeStock.tools + refund.tools);
      expect(home(w).stock.stone).toBe(homeStock.stone + refund.stone);
      expect(w.islands[B]!.stock).toEqual(stockB);
      expect(w.islands[B]!.kontorId).toBeNull();
      expect(w.buildings[lid]!.connected).toBe(false);
      found(w, B);
      expect(w.islands[B]!.stock).toEqual(stockB);
    });

    it('(d) Schiff im Hafen B auf Heimfahrt ohne Route sperrt nicht', () => {
      const { w, id } = setup();
      shipLiteral(w, { port: B, to: 0, left: 10, route: null, homing: true });
      expect(demolish(w, id)).toEqual({ ok: true });
    });

    it('Heimat-Kontor bleibt unabreissbar', () => {
      const { w } = setup();
      expect(demolish(w, home(w).kontorId).ok).toBe(false);
    });
  });

  it('Heimat bitgleich: Gründe auf Insel 0 unverändert', () => {
    const locked = createWorld(SEED_D37);
    expect(canPlace(locked, 'kontor2', 0, 0, 0).ok).toBe(false);
    const w = seaWorld();
    home(w).stock.wood = 0;
    home(w).stock.tools = 0;
    const k = w.buildings[home(w).kontorId]!;
    expect(canPlace(w, 'lumberjack', 0, 0, 0)).toEqual({ ok: false, reason: 'Kein Bauland' });
    expect(canPlaceRoad(w, k.x, k.y, 0)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    expect(demolish(w, home(w).kontorId)).toEqual({
      ok: false,
      reason: 'Kontor kann nicht abgerissen werden',
    });
  });
});
