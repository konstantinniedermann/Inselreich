import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld, idx, isLand, tileAt, tilesInRadius, home } from '../../src/sim/world';
import { buildLock, canPlace, canPlaceRoad, siteRuleOk } from '../../src/sim/placement';
import { placeBuilding, placeRoad, removeRoad, demolish } from '../../src/sim/build';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import { fail } from '../../src/sim/types';
import { deriveUnlocks, entryOfBuilding } from '../../src/sim/unlocks';
import type { World } from '../../src/sim/types';
import { checkAfford } from '../../src/sim/economy';
import { generateForeignIslands } from '../../src/sim/islands';
import { forceGrass, forceRect } from './helpers';
import { foundKontor2Literal, plantationSites, seaWorld } from './seaHelpers';

function landRect(w: World, size: number): { x: number; y: number } {
  for (let y = 1; y < home(w).height - size; y++)
    for (let x = 1; x < home(w).width - size; x++) {
      let ok = true;
      for (let dy = 0; dy < size && ok; dy++)
        for (let dx = 0; dx < size; dx++) {
          const t = tileAt(home(w), x + dx, y + dy)!;
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
  w = createWorld(3, { unlockAll: true });
  o = landRect(w, 8);
});

describe('placement basics', () => {
  it('rejects out of map incl. footprint overhang', () => {
    expect(canPlace(w, 'market', 63, 10)).toEqual({ ok: false, reason: 'Ausserhalb der Karte' });
    expect(canPlaceRoad(w, -1, 0).ok).toBe(false);
  });
  it('rejects water and mountain', () => {
    expect(canPlaceRoad(w, 0, 0)).toEqual({ ok: false, reason: 'Kein Bauland' });
    home(w).tiles[idx(home(w), o.x, o.y)]!.terrain = 'mountain';
    expect(canPlace(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Kein Bauland' });
  });
  it('rejects overlap with buildings and roads both ways', () => {
    expect(placeBuilding(w, 'weaver', o.x, o.y).ok).toBe(true);
    expect(canPlaceRoad(w, o.x + 1, o.y + 1)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    expect(placeRoad(w, o.x + 3, o.y).ok).toBe(true);
    expect(canPlace(w, 'weaver', o.x + 3, o.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    const k = w.buildings[home(w).kontorId]!;
    expect(canPlace(w, 'weaver', k.x, k.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
  });
});

describe('site rules', () => {
  it('fisher needs water adjacent', () => {
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Braucht Wasser angrenzend',
    });
    home(w).tiles[idx(home(w), o.x + 3, o.y + 2)]!.terrain = 'water';
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2).ok).toBe(true);
  });
  it('lumberjack needs forest within radius 2 (M11 S3)', () => {
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Zu wenig freier Wald in der Nähe',
    });
    home(w).tiles[idx(home(w), o.x + 6, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('lumberjack radius is symmetric (dx=-2 ok, dx=-3 rejected)', () => {
    home(w).tiles[idx(home(w), o.x + 1, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(false);
    home(w).tiles[idx(home(w), o.x + 1, o.y + 4)]!.terrain = 'grass';
    home(w).tiles[idx(home(w), o.x + 2, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('quarry needs mountain adjacent', () => {
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Braucht Gebirge angrenzend',
    });
    home(w).tiles[idx(home(w), o.x + 5, o.y + 4)]!.terrain = 'mountain';
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('sheepfarm needs 4 grass within radius 2 of its centre', () => {
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2).ok).toBe(true);
    for (let dy = -2; dy < 5; dy++)
      for (let dx = -2; dx < 5; dx++)
        home(w).tiles[idx(home(w), o.x + 2 + dx, o.y + 2 + dy)]!.terrain = 'sand';
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Zu wenig Weide in der Nähe',
    });
  });
  it('house needs kontor or market within radius 8', () => {
    const k = w.buildings[home(w).kontorId]!;
    const kx = k.x + 1;
    const ky = k.y + 1;
    const findFree = (pred: (dist: number) => boolean): { x: number; y: number; dist: number } => {
      for (let y = 0; y < home(w).height; y++)
        for (let x = 0; x < home(w).width; x++) {
          const t = tileAt(home(w), x, y)!;
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
    expect(tileAt(home(w), o.x + 1, o.y + 1)!.buildingId).toBe(id);
    expect(w.buildings[id]!.connected).toBe(false);
    expect(demolish(w, id).ok).toBe(true);
    expect(tileAt(home(w), o.x + 1, o.y + 1)!.buildingId).toBeNull();
    expect(w.buildings[id]).toBeUndefined();
    expect(demolish(w, home(w).kontorId)).toEqual({
      ok: false,
      reason: 'Kontor kann nicht abgerissen werden',
    });
    expect(demolish(w, 999)).toEqual({ ok: false, reason: 'Gebäude nicht gefunden' });
  });
  it('allows re-placing on the same spot after demolish', () => {
    home(w).stock.stone = 20; // Kapelle kostet 10 Stein, Refund gibt nur 5 zurück
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
    expect(tileAt(home(w), o.x, o.y)!.road).toBe(true);
    expect(removeRoad(w, o.x, o.y).ok).toBe(true);
    expect(removeRoad(w, o.x, o.y)).toEqual({ ok: false, reason: 'Kein Weg' });
  });
});

describe('costs', () => {
  it('charges costs and refunds half on demolish', () => {
    const m0 = w.money;
    const wood0 = home(w).stock.wood;
    const r = placeBuilding(w, 'weaver', o.x, o.y);
    expect(w.money).toBe(m0 - 200);
    expect(home(w).stock.wood).toBe(wood0 - 15);
    expect(home(w).stock.tools).toBe(20 - 3);
    demolish(w, (r as { id: number }).id);
    expect(w.money).toBe(m0 - 100);
    expect(home(w).stock.wood).toBe(wood0 - 15 + 7);
    expect(home(w).stock.tools).toBe(20 - 3 + 1);
  });
  it('rejects unaffordable builds with the reason and leaves the map untouched', () => {
    w.money = 10;
    expect(placeBuilding(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(tileAt(home(w), o.x, o.y)!.buildingId).toBeNull();
    expect(w.money).toBe(10);
    expect(placeRoad(w, o.x, o.y)).toEqual({ ok: true });
    expect(placeRoad(w, o.x + 1, o.y)).toEqual({ ok: true });
    expect(placeRoad(w, o.x + 2, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(tileAt(home(w), o.x + 2, o.y)!.road).toBe(false);
    expect(removeRoad(w, o.x, o.y).ok).toBe(true);
    expect(w.money).toBe(2);
  });
});

describe('M8 Bausperre (Änderung S11)', () => {
  beforeEach(() => {
    w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5']; // „Alles frei" ausser U6 (Badehaus, Glashütte), wie M8 vor dem Ziel
  });
  /** Geld und Lager reichen für jeden Bau; die Sperre ist der einzige mögliche Grund. */
  const fund = (): void => {
    w.money = 10_000;
    for (const g of ['wood', 'tools', 'stone'] as const) home(w).stock[g] = 100;
  };
  /** Bürgerhäuser (Stufe 3) mit den Einwohnerzahlen `n`, direkt gesetzt. */
  const citizenHouses = (n: readonly number[]) =>
    n.map((inh, i) => {
      const k = w.buildings[home(w).kontorId]!; // Häuser brauchen Versorgung: Spalte östlich des Kontors
      forceGrass(w, k.x + 2, k.y + i);
      const r = placeBuilding(w, 'house', k.x + 2, k.y + i);
      expect(r.ok).toBe(true);
      const h = w.buildings[r.id!]!;
      h.house!.tier = 3;
      h.house!.inhabitants = inh;
      return h;
    });
  const water = (): { x: number; y: number } => {
    for (let y = 0; y < home(w).height; y++)
      for (let x = 0; x < home(w).width; x++)
        if (!isLand(tileAt(home(w), x, y)!.terrain)) return { x, y };
    throw new Error('kein Wasser');
  };

  it('AK-S1-21 Badehaus vor dem Sieg gesperrt (auch auf Wasser), placeBuilding bucht nichts; mit won frei', () => {
    fund();
    expect(w.won).toBe(false);
    expect(entryOfBuilding('bathhouse')?.id).toBe('U6');
    expect(buildLock(w, 'bathhouse')).toBe('Erst nach dem Ziel');
    expect(canPlace(w, 'bathhouse', o.x, o.y + 2)).toEqual(fail('Erst nach dem Ziel'));
    const sea = water();
    expect(canPlace(w, 'bathhouse', sea.x, sea.y)).toEqual(fail('Erst nach dem Ziel'));
    const money = w.money;
    const stock = { ...home(w).stock };
    const count = Object.keys(w.buildings).length;
    expect(placeBuilding(w, 'bathhouse', o.x, o.y + 2).ok).toBe(false);
    expect(w.money).toBe(money);
    expect(home(w).stock).toEqual(stock);
    expect(Object.keys(w.buildings)).toHaveLength(count);
    w.won = true;
    w.unlocked = deriveUnlocks(w);
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
      w.unlocked = deriveUnlocks(w);
      expect(buildLock(w, 'bathhouse')).toBeNull();
      const r = placeBuilding(w, 'bathhouse', o.x, o.y + 2);
      expect(r.ok).toBe(true);
      houses[2]!.house!.inhabitants = 9; // Sperre greift wieder (Spec 21 Punkt 5)
      w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5']; // M10: Freischaltung ist gespeichert; der Rückfall wird nachgestellt
      expect(buildLock(w, 'bathhouse')).toBe('Erst ab 40 Bürgern (jetzt 39)');
      expect(w.buildings[r.id!]?.defId).toBe('bathhouse'); // nur Neubau gesperrt
      expect(canPlace(w, 'bathhouse', o.x + 3, o.y + 2)).toEqual(
        fail('Erst ab 40 Bürgern (jetzt 39)'),
      );
    } finally {
      TIERS[4].unlockCitizens = null;
    }
  });

  it('AK-S1-21 buildLock ist für jedes Gebäude ausserhalb von U6 null (auch vor dem Sieg)', () => {
    for (const id of BUILDING_IDS)
      if (entryOfBuilding(id)?.id !== 'U6') expect(buildLock(w, id), id).toBeNull();
  });

  it('AK-S2-19 Glashütte vor dem Sieg gesperrt, placeBuilding bucht nichts; mit won frei', () => {
    fund();
    expect(entryOfBuilding('glassworks')?.id).toBe('U6');
    expect(buildLock(w, 'glassworks')).toBe('Erst nach dem Ziel');
    expect(canPlace(w, 'glassworks', o.x, o.y + 2)).toEqual(fail('Erst nach dem Ziel'));
    const money = w.money;
    const stock = { ...home(w).stock };
    expect(placeBuilding(w, 'glassworks', o.x, o.y + 2).ok).toBe(false);
    expect(w.money).toBe(money);
    expect(home(w).stock).toEqual(stock);
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(buildLock(w, 'glassworks')).toBeNull();
    expect(placeBuilding(w, 'glassworks', o.x, o.y + 2).ok).toBe(true);
  });
});

describe('M11 Regelfeld free (Spec 3.3)', () => {
  const w0 = (): World => {
    const x = createWorld(3, { unlockAll: true });
    x.money = 10_000;
    return x;
  };
  function hunterSite(x: World): { w: World; x: number; y: number } {
    const k = x.buildings[home(x).kontorId]!;
    forceRect(x, k.x + 2, k.y, 5, 1, 'grass');
    forceRect(x, k.x + 3, k.y - 4, 7, 7, 'grass');
    forceRect(x, k.x + 4, k.y - 3, 5, 2, 'forest');
    for (let i = 2; i <= 6; i++) expect(placeRoad(x, k.x + i, k.y).ok).toBe(true);
    const site = { x: k.x + 6, y: k.y - 1 };
    const [cx, cy] = [site.x + 0.5, site.y + 0.5];
    const free = tilesInRadius(home(x), cx, cy, 3).filter((p) => {
      const t = tileAt(home(x), p.x, p.y)!;
      return t.terrain === 'forest' && t.buildingId === null && !t.road;
    });
    expect(free).toHaveLength(10);
    return { w: x, ...site };
  }
  it('AK-P2S2-02 Jagdhütte: genau 10 freie Waldkacheln ok; Weg, Gebäude oder eigener Grundriss zählen nicht', () => {
    const reason = { ok: false, reason: 'Zu wenig freier Wald in der Nähe' };
    const a = hunterSite(w0());
    expect(canPlace(a.w, 'hunter', a.x, a.y)).toEqual({ ok: true });
    const b = hunterSite(w0());
    expect(placeRoad(b.w, b.x - 2, b.y - 1).ok).toBe(true);
    expect(canPlace(b.w, 'hunter', b.x, b.y)).toEqual(reason);
    const c = hunterSite(w0());
    expect(placeBuilding(c.w, 'house', c.x - 2, c.y - 1).ok).toBe(true);
    expect(canPlace(c.w, 'hunter', c.x, c.y)).toEqual(reason);
    const d = hunterSite(w0());
    home(d.w).tiles[idx(home(d.w), d.x - 2, d.y - 1)]!.terrain = 'grass'; // 9 frei ...
    home(d.w).tiles[idx(home(d.w), d.x, d.y)]!.terrain = 'forest'; // ... plus Wald unter dem eigenen Grundriss
    expect(canPlace(d.w, 'hunter', d.x, d.y)).toEqual(reason);
  });
  it('AK-P2S2-05 Regeln ohne free zählen wie heute: Schäferei mit Weg auf einer ihrer 4 Weidekacheln bleibt baubar', () => {
    expect(siteRuleOk).toBeTypeOf('function');
    const sheep = (): { w: World; x: number; y: number } => {
      const x = w0();
      const k = x.buildings[home(x).kontorId]!;
      const [X, Y] = [k.x + 6, k.y - 8];
      forceRect(x, X - 4, Y - 4, 10, 10, 'forest');
      for (const [gx, gy] of [
        [X, Y - 1],
        [X + 1, Y - 1],
        [X - 1, Y],
        [X - 1, Y + 1],
      ] as const)
        forceGrass(x, gx, gy);
      expect(placeRoad(x, X - 1, Y).ok).toBe(true); // Weg auf einer der 4 Weidekacheln
      return { w: x, x: X, y: Y };
    };
    const a = sheep();
    expect(canPlace(a.w, 'sheepfarm', a.x, a.y)).toEqual({ ok: true });
    const b = sheep();
    home(b.w).tiles[idx(home(b.w), b.x, b.y - 1)]!.terrain = 'forest';
    expect(canPlace(b.w, 'sheepfarm', b.x, b.y)).toEqual({
      ok: false,
      reason: 'Zu wenig Weide in der Nähe',
    });
  });
});

describe('M12 Seefahrt Platzregeln (T02)', () => {
  const NO_SPICE = fail('Hier wächst kein Gewürz');
  const TRAIT = { kind: 'islandTrait', trait: 'spice' } as const;
  const FOREIGN = { kind: 'foreignNoKontor' } as const;

  it('AK-E3-02 spicefarm: Heimat und Insel ohne Gewürz → „Hier wächst kein Gewürz"', () => {
    expect(siteRuleOk(w, 'spicefarm', o.x, o.y, TRAIT, 0)).toEqual(NO_SPICE);
    expect(canPlace(w, 'spicefarm', o.x, o.y)).toEqual(NO_SPICE);
    const sw = seaWorld();
    const site = plantationSites(sw, 1)[0]!;
    sw.islands[1]!.kind = 'home'; // Kopie ohne Merkmal: keine Art in ISLANDS
    expect(siteRuleOk(sw, 'spicefarm', site.x, site.y, TRAIT, 1)).toEqual(NO_SPICE);
  });
  it('AK-E3-02 spicefarm auf A und B an plantationSites: kein Grund aus islandTrait', () => {
    const sw = seaWorld();
    for (const island of [1, 2]) {
      foundKontor2Literal(sw, island);
      for (const site of plantationSites(sw, island)) {
        expect(siteRuleOk(sw, 'spicefarm', site.x, site.y, TRAIT, island)).toEqual({ ok: true });
        expect(canPlace(sw, 'spicefarm', site.x, site.y, island).reason).not.toBe(NO_SPICE.reason);
      }
    }
  });
  it('AK-E2-09 kontor2: Heimat → „Nur auf einer fernen Insel"', () => {
    expect(siteRuleOk(w, 'kontor2', o.x, o.y, FOREIGN, 0)).toEqual(
      fail('Nur auf einer fernen Insel'),
    );
  });
  it('AK-E2-09 zweites kontor2 auf B → „Auf dieser Insel steht schon ein Kontor"', () => {
    const sw = seaWorld();
    const site = generateForeignIslands(sw.seed, home(sw))[1]!.kontorSite;
    expect(siteRuleOk(sw, 'kontor2', site.x, site.y, FOREIGN, 2)).toEqual({ ok: true });
    foundKontor2Literal(sw, 2);
    expect(siteRuleOk(sw, 'kontor2', site.x, site.y, FOREIGN, 2)).toEqual(
      fail('Auf dieser Insel steht schon ein Kontor'),
    );
    expect(siteRuleOk(sw, 'kontor2', site.x, site.y, FOREIGN, 1)).toEqual({ ok: true });
  });
  it('E1-Übergabe: kontor2 am kontorSite auf A und B für Seeds 1 … 50 ohne Platzregelgrund', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const sw = seaWorld(seed);
      const placed = generateForeignIslands(sw.seed, home(sw));
      for (const island of [1, 2]) {
        const site = placed[island - 1]!.kontorSite;
        expect(
          canPlace(sw, 'kontor2', site.x, site.y, island),
          `seed ${seed} insel ${island}`,
        ).toEqual({
          ok: true,
        });
      }
    }
  });
  it('checkAfford: mit where hängt der Ort an den Grund, ohne bleibt der Text', () => {
    const cost = { money: 0, wood: 0, tools: 0, stone: 10 };
    home(w).stock.stone = 0;
    expect(checkAfford(w, home(w), cost)).toEqual(fail('Zu wenig Stein'));
    expect(checkAfford(w, home(w), cost, 'in der Heimat')).toEqual(
      fail('Zu wenig Stein in der Heimat'),
    );
    home(w).stock.stone = 10;
    expect(checkAfford(w, home(w), cost, 'in der Heimat')).toEqual({ ok: true });
  });
});
