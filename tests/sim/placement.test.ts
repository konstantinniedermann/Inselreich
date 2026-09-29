import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld, idx, isLand, tileAt } from '../../src/sim/world';
import { canPlace, canPlaceRoad } from '../../src/sim/placement';
import { placeBuilding, placeRoad, removeRoad, demolish } from '../../src/sim/build';
import type { World } from '../../src/sim/types';

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
    expect(placeBuilding(w, 'market', o.x, o.y).ok).toBe(true);
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
  it('creates house state', () => {
    expect(placeBuilding(w, 'market', o.x, o.y).ok).toBe(true);
    const r = placeBuilding(w, 'house', o.x + 3, o.y + 3);
    expect(r.ok).toBe(true);
    const b = w.buildings[r.id!]!;
    expect(b).toMatchObject({ defId: 'house', connected: false, progress: 0, state: 'ok' });
    expect(b.house).toMatchObject({
      tier: 1,
      inhabitants: 1,
      demand: {},
      satisfied: {},
      satisfiedSince: 0,
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
