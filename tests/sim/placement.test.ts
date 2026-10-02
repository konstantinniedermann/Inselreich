import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld, idx, isLand, tileAt } from '../../src/sim/world';
import { buildLock, canPlace, canPlaceRoad } from '../../src/sim/placement';
import { placeBuilding, placeRoad, removeRoad, demolish } from '../../src/sim/build';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import { fail } from '../../src/sim/types';
import type { World } from '../../src/sim/types';
import { forceGrass } from './helpers';

function landRect(w: World, size: number): { x: number; y: number } {
  for (let y = 1; y < w.height - size; y++)
    for (let x = 1; x < w.width - size; x++) {
      let ok = true;
      for (let dy = 0; dy < size && ok; dy++)
        for (let dx = 0; dx < size; dx++) {
          const t = tileAt(w, x + dx, y + dy)!;
          if (t.terrain !== 'grass' || t.buildingId !== null) {
            ok = false;
            break;
          }
        }
      if (ok) return { x, y };
    }
  throw new Error('no land rect');
}

let w: World;
let o: { x: number; y: number };
beforeEach(() => {
  w = createWorld(3);
  o = landRect(w, 8);
});

describe('placement basics', () => {
  it('rejects out of map incl. footprint overhang', () => {
    expect(canPlace(w, 'market', 63, 10)).toEqual({ ok: false, reason: 'Ausserhalb der Karte' });
    expect(canPlaceRoad(w, -1, 0).ok).toBe(false);
  });
  it('rejects water and mountain', () => {
    expect(canPlaceRoad(w, 0, 0)).toEqual({ ok: false, reason: 'Kein Bauland' });
    w.tiles[idx(w, o.x, o.y)]!.terrain = 'mountain';
    expect(canPlace(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Kein Bauland' });
  });
  it('rejects overlap with buildings and roads both ways', () => {
    expect(placeBuilding(w, 'weaver', o.x, o.y).ok).toBe(true);
    expect(canPlaceRoad(w, o.x + 1, o.y + 1)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    expect(placeRoad(w, o.x + 3, o.y).ok).toBe(true);
    expect(canPlace(w, 'weaver', o.x + 3, o.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    const k = w.buildings[w.kontorId]!;
    expect(canPlace(w, 'weaver', k.x, k.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
  });
});

describe('site rules', () => {
  it('fisher needs water adjacent', () => {
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Braucht Wasser angrenzend',
    });
    w.tiles[idx(w, o.x + 3, o.y + 2)]!.terrain = 'water';
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2).ok).toBe(true);
  });
  it('lumberjack needs forest within radius 2', () => {
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Zu wenig Wald in der Nähe',
    });
    w.tiles[idx(w, o.x + 6, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('lumberjack radius is symmetric (dx=-2 ok, dx=-3 rejected)', () => {
    w.tiles[idx(w, o.x + 1, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(false);
    w.tiles[idx(w, o.x + 1, o.y + 4)]!.terrain = 'grass';
    w.tiles[idx(w, o.x + 2, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('quarry needs mountain adjacent', () => {
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Braucht Gebirge angrenzend',
    });
    w.tiles[idx(w, o.x + 5, o.y + 4)]!.terrain = 'mountain';
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('sheepfarm needs 4 grass within radius 2 of its centre', () => {
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2).ok).toBe(true);
    for (let dy = -2; dy < 5; dy++)
      for (let dx = -2; dx < 5; dx++) w.tiles[idx(w, o.x + 2 + dx, o.y + 2 + dy)]!.terrain = 'sand';
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Zu wenig Weide in der Nähe',
    });
  });
  it('house needs kontor or market within radius 8', () => {
    const k = w.buildings[w.kontorId]!;
    const kx = k.x + 1;
    const ky = k.y + 1;
    const findFree = (pred: (dist: number) => boolean): { x: number; y: number; dist: number } => {
      for (let y = 0; y < w.height; y++)
        for (let x = 0; x < w.width; x++) {
          const t = tileAt(w, x, y)!;
          const dist = Math.hypot(x + 0.5 - kx, y + 0.5 - ky);
          if (isLand(t.terrain) && t.buildingId === null && !t.road && pred(dist))
            return { x, y, dist };
        }
      throw new Error('no tile found');
    };
    const far = findFree((d) => d > 8);
    expect(far.dist).toBeGreaterThan(8);
    expect(canPlace(w, 'house', far.x, far.y)).toEqual({
      ok: false,
      reason: 'Ausserhalb der Versorgung',
    });
    const near = findFree((d) => d <= 8);
    expect(near.dist).toBeLessThanOrEqual(8);
    expect(canPlace(w, 'house', near.x, near.y).ok).toBe(true);
    const m = placeBuilding(w, 'market', o.x, o.y);
    expect(m.ok).toBe(true);
    w.buildings[m.id!]!.connected = false;
    expect(canPlace(w, 'house', o.x + 3, o.y + 3)).toEqual({
      ok: false,
      reason: 'Ausserhalb der Versorgung',
    });
    w.buildings[m.id!]!.connected = true;
    expect(canPlace(w, 'house', o.x + 3, o.y + 3).ok).toBe(true);
  });
});

describe('build/demolish', () => {
  it('marks tiles and frees them again', () => {
    const r = placeBuilding(w, 'chapel', o.x, o.y);
    expect(r.ok).toBe(true);
    const id = (r as { id: number }).id;
    expect(tileAt(w, o.x + 1, o.y + 1)!.buildingId).toBe(id);
    expect(w.buildings[id]!.connected).toBe(false);
    expect(demolish(w, id).ok).toBe(true);
    expect(tileAt(w, o.x + 1, o.y + 1)!.buildingId).toBeNull();
    expect(w.buildings[id]).toBeUndefined();
    expect(demolish(w, w.kontorId)).toEqual({
      ok: false,
      reason: 'Kontor kann nicht abgerissen werden',
    });
    expect(demolish(w, 999)).toEqual({ ok: false, reason: 'Gebäude nicht gefunden' });
  });
  it('allows re-placing on the same spot after demolish', () => {
    w.stock.stone = 20; // Kapelle kostet 10 Stein, Refund gibt nur 5 zurück
    const r = placeBuilding(w, 'chapel', o.x, o.y);
    expect(r.ok).toBe(true);
    expect(demolish(w, (r as { id: number }).id).ok).toBe(true);
    expect(placeBuilding(w, 'chapel', o.x, o.y).ok).toBe(true);
  });
  it('creates house state', () => {
    const m = placeBuilding(w, 'market', o.x, o.y);
    expect(m.ok).toBe(true);
    w.buildings[m.id!]!.connected = true;
    w.tick = 7;
    const r = placeBuilding(w, 'house', o.x + 3, o.y + 3);
    expect(r.ok).toBe(true);
    const b = w.buildings[r.id!]!;
    expect(b).toMatchObject({ defId: 'house', connected: false, progress: 0, state: 'ok' });
    expect(b.house).toMatchObject({
      tier: 1,
      inhabitants: 1,
      demand: { food: 1 },
      satisfied: {},
      services: {},
      satisfiedSince: 7,
      supplied: false,
    });
  });
  it('roads add and remove', () => {
    expect(placeRoad(w, o.x, o.y).ok).toBe(true);
    expect(tileAt(w, o.x, o.y)!.road).toBe(true);
    expect(removeRoad(w, o.x, o.y).ok).toBe(true);
    expect(removeRoad(w, o.x, o.y)).toEqual({ ok: false, reason: 'Kein Weg' });
  });
});

describe('costs', () => {
  it('charges costs and refunds half on demolish', () => {
    const m0 = w.money;
    const wood0 = w.stock.wood;
    const r = placeBuilding(w, 'weaver', o.x, o.y);
    expect(w.money).toBe(m0 - 200);
    expect(w.stock.wood).toBe(wood0 - 15);
    expect(w.stock.tools).toBe(20 - 3);
    demolish(w, (r as { id: number }).id);
    expect(w.money).toBe(m0 - 100);
    expect(w.stock.wood).toBe(wood0 - 15 + 7);
    expect(w.stock.tools).toBe(20 - 3 + 1);
  });
  it('rejects unaffordable builds with the reason and leaves the map untouched', () => {
    w.money = 10;
    expect(placeBuilding(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(tileAt(w, o.x, o.y)!.buildingId).toBeNull();
    expect(w.money).toBe(10);
    expect(placeRoad(w, o.x, o.y)).toEqual({ ok: true });
    expect(placeRoad(w, o.x + 1, o.y)).toEqual({ ok: true });
    expect(placeRoad(w, o.x + 2, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(tileAt(w, o.x + 2, o.y)!.road).toBe(false);
    expect(removeRoad(w, o.x, o.y).ok).toBe(true);
    expect(w.money).toBe(2);
  });
});

describe('M8 Bausperre (Änderung S11)', () => {
  /** Geld und Lager reichen für jeden Bau; die Sperre ist der einzige mögliche Grund. */
  const fund = (): void => {
    w.money = 10_000;
    for (const g of ['wood', 'tools', 'stone'] as const) w.stock[g] = 100;
  };
  /** Bürgerhäuser (Stufe 3) mit den Einwohnerzahlen `n`, direkt gesetzt. */
  const citizenHouses = (n: readonly number[]) =>
    n.map((inh, i) => {
      const k = w.buildings[w.kontorId]!; // Häuser brauchen Versorgung: Spalte östlich des Kontors
      forceGrass(w, k.x + 2, k.y + i);
      const r = placeBuilding(w, 'house', k.x + 2, k.y + i);
      expect(r.ok).toBe(true);
      const h = w.buildings[r.id!]!;
      h.house!.tier = 3;
      h.house!.inhabitants = inh;
      return h;
    });
  const water = (): { x: number; y: number } => {
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) if (!isLand(tileAt(w, x, y)!.terrain)) return { x, y };
    throw new Error('kein Wasser');
  };

  it('AK-S1-21 Badehaus vor dem Sieg gesperrt (auch auf Wasser), placeBuilding bucht nichts; mit won frei', () => {
    fund();
    expect(w.won).toBe(false);
    expect(BUILDING_DEFS.bathhouse.unlockTier).toBe(4);
    expect(buildLock(w, 'bathhouse')).toBe('Erst nach dem Ziel');
    expect(canPlace(w, 'bathhouse', o.x, o.y + 2)).toEqual(fail('Erst nach dem Ziel'));
    const sea = water();
    expect(canPlace(w, 'bathhouse', sea.x, sea.y)).toEqual(fail('Erst nach dem Ziel'));
    const money = w.money;
    const stock = { ...w.stock };
    const count = Object.keys(w.buildings).length;
    expect(placeBuilding(w, 'bathhouse', o.x, o.y + 2).ok).toBe(false);
    expect(w.money).toBe(money);
    expect(w.stock).toEqual(stock);
    expect(Object.keys(w.buildings)).toHaveLength(count);
    w.won = true;
    expect(buildLock(w, 'bathhouse')).toBeNull();
    expect(placeBuilding(w, 'bathhouse', o.x, o.y + 2).ok).toBe(true);
  });

  it('AK-S1-21 Hebel 40: Grund mit Zahl bei 39 Bürgern, frei bei 40; stehendes Badehaus bleibt beim Rückfall', () => {
    try {
      TIERS[4].unlockCitizens = 40;
      fund();
      const houses = citizenHouses([15, 15, 9]);
      expect(buildLock(w, 'bathhouse')).toBe('Erst ab 40 Bürgern (jetzt 39)');
      expect(canPlace(w, 'bathhouse', o.x, o.y + 2)).toEqual(fail('Erst ab 40 Bürgern (jetzt 39)'));
      houses[2]!.house!.inhabitants = 10;
      expect(buildLock(w, 'bathhouse')).toBeNull();
      const r = placeBuilding(w, 'bathhouse', o.x, o.y + 2);
      expect(r.ok).toBe(true);
      houses[2]!.house!.inhabitants = 9; // Sperre greift wieder (Spec 21 Punkt 5)
      expect(buildLock(w, 'bathhouse')).toBe('Erst ab 40 Bürgern (jetzt 39)');
      expect(w.buildings[r.id!]?.defId).toBe('bathhouse'); // nur Neubau gesperrt
      expect(canPlace(w, 'bathhouse', o.x + 3, o.y + 2)).toEqual(
        fail('Erst ab 40 Bürgern (jetzt 39)'),
      );
    } finally {
      TIERS[4].unlockCitizens = null;
    }
  });

  it('AK-S1-21 buildLock ist für jedes Gebäude ohne unlockTier null (auch vor dem Sieg)', () => {
    for (const id of BUILDING_IDS)
      if (BUILDING_DEFS[id].unlockTier === undefined) expect(buildLock(w, id), id).toBeNull();
  });
});
