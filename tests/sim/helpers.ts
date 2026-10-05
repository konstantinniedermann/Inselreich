import { placeBuilding, placeRoad } from '../../src/sim/build';
import { newHouseState } from '../../src/sim/population';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld, idx, home } from '../../src/sim/world';
import type { Building, CrisisLevel, Tier, World } from '../../src/sim/types';

/** Deterministisches Layout: 6 freie Grasskacheln ab der Ostkante des Kontors, Wald nördlich von Kachel 5. */
export function prepareEast(world: World, kontor: Building): void {
  for (let i = 0; i < 6; i++) {
    const t = home(world).tiles[idx(home(world), kontor.x + 2 + i, kontor.y)]!;
    t.terrain = 'grass';
    t.buildingId = null;
    t.road = false;
  }
  home(world).tiles[idx(home(world), kontor.x + 2 + 4, kontor.y - 1)]!.terrain = 'forest';
}

export function forceGrass(world: World, x: number, y: number): void {
  const t = home(world).tiles[idx(home(world), x, y)]!;
  t.terrain = 'grass';
  t.buildingId = null;
  t.road = false;
}

/** Erzwingt ein w×h-Rechteck aus Gelände `terrain` (frei, ohne Weg), ab (x0, y0). */
export function forceRect(
  world: World,
  x0: number,
  y0: number,
  w: number,
  h: number,
  terrain: 'grass' | 'water' | 'forest',
): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      forceGrass(world, x, y);
      home(world).tiles[idx(home(world), x, y)]!.terrain = terrain;
    }
  }
}

/**
 * Platziert Kapelle oder Schule auf erzwungenem Gras und setzt `connected` manuell (Anbindung ist
 * in roads.test.ts getestet). Geld und Lager bleiben unverändert, damit Tests sauber vergleichen.
 */
export function placeService(
  world: World,
  defId: 'chapel' | 'school' | 'bathhouse',
  x: number,
  y: number,
): Building {
  const money = world.money;
  const stock = { ...home(world).stock };
  forceRect(world, x, y, BUILDING_DEFS[defId].w, BUILDING_DEFS[defId].h, 'grass');
  // Ausreichend Mittel für die Baukosten (Schule braucht mehr Stein als das Startlager)
  world.money = 1_000_000;
  for (const good of Object.keys(home(world).stock) as (keyof ReturnType<typeof home>['stock'])[])
    home(world).stock[good] = 100;
  const r = placeBuilding(world, defId, x, y);
  if (!r.ok || r.id === undefined) throw new Error(`${defId} not placed`);
  world.money = money;
  home(world).stock = stock;
  const b = world.buildings[r.id]!;
  b.connected = true;
  return b;
}

function placedHouse(world: World, x: number, y: number): Building {
  const r = placeBuilding(world, 'house', x, y);
  if (!r.ok || r.id === undefined) throw new Error('house not placed');
  return world.buildings[r.id]!;
}

/** Haus auf einer Kachel, die 4er-angrenzend (Ostseite) am Kontor-Footprint liegt. */
export function houseNearKontor(world: World): Building {
  const k = world.buildings[home(world).kontorId]!;
  const x = k.x + BUILDING_DEFS.kontor.w;
  forceGrass(world, x, k.y);
  return placedHouse(world, x, k.y);
}

/**
 * Haus mit Mitte-Abstand > 8 vom Kontor, also ausserhalb von dessen Versorgungsradius.
 * Wird direkt eingefügt, ohne `placeBuilding`: die Platzierung verweigert unversorgte Orte zu Recht.
 */
export function houseFar(world: World): Building {
  const k = world.buildings[home(world).kontorId]!;
  const kc = center(BUILDING_DEFS.kontor, k.x, k.y);
  const supplyRadius = BUILDING_DEFS.kontor.supplyRadius ?? 0;
  for (let y = 0; y < home(world).height; y++) {
    for (let x = 0; x < home(world).width; x++) {
      const h = center(BUILDING_DEFS.house, x, y);
      if (Math.hypot(h.cx - kc.cx, h.cy - kc.cy) <= supplyRadius + 1) continue;
      if (home(world).tiles[idx(home(world), x, y)]!.buildingId !== null) continue;
      forceGrass(world, x, y);
      const id = world.nextBuildingId++;
      const house: Building = {
        id,
        defId: 'house',
        x,
        y,
        connected: false,
        progress: 0,
        state: 'ok',
        island: 0,
        house: newHouseState(world),
      };
      world.buildings[id] = house;
      home(world).tiles[idx(home(world), x, y)]!.buildingId = id;
      return house;
    }
  }
  throw new Error('no far tile');
}

/** Seed 3; n Wohnhäuser östlich des Kontors (x = kx+2 … kx+6, ab y = ky−2, je 5 pro Zeile), alle im Kontor-Radius. */
export function village(
  n: number,
  opts: { crisisLevel?: CrisisLevel; unlockAll?: boolean } = {},
): { w: World; houses: Building[] } {
  const w = createWorld(3, { crisisLevel: opts.crisisLevel ?? 'off', unlockAll: opts.unlockAll });
  w.money = 100_000;
  home(w).stock.wood = 200;
  const k = w.buildings[home(w).kontorId]!;
  const houses: Building[] = [];
  for (let i = 0; i < n; i++) {
    const x = k.x + 2 + (i % 5);
    const y = k.y - 2 + Math.floor(i / 5);
    forceGrass(w, x, y);
    const r = placeBuilding(w, 'house', x, y);
    if (!r.ok || r.id === undefined) throw new Error(`Haus ${i}: ${r.ok ? 'ohne Id' : r.reason}`);
    houses.push(w.buildings[r.id]!);
  }
  w.money = 5000;
  return { w, houses };
}
export const setHouse = (b: Building, tier: Tier, n: number): void => {
  b.house!.tier = tier;
  b.house!.inhabitants = n;
};

/** Angebundene Amtsstube südlich des Kontors: Weg (kx, ky+2), Amtsstube 2×2 ab (kx, ky+3). Welt braucht U3. Geld und Lager unverändert. */
export function placeTownhall(world: World): Building {
  const k = world.buildings[home(world).kontorId]!;
  forceRect(world, k.x, k.y + 2, 2, 3, 'grass');
  const money = world.money;
  const stock = { ...home(world).stock };
  world.money = 1_000_000;
  for (const g of Object.keys(home(world).stock) as (keyof ReturnType<typeof home>['stock'])[])
    home(world).stock[g] = 100;
  if (!placeRoad(world, k.x, k.y + 2).ok) throw new Error('Weg');
  const r = placeBuilding(world, 'townhall', k.x, k.y + 3);
  if (!r.ok || r.id === undefined) throw new Error(r.ok ? 'ohne Id' : r.reason);
  world.money = money;
  home(world).stock = stock;
  const b = world.buildings[r.id]!;
  if (!b.connected) throw new Error('nicht angebunden');
  return b;
}

/** FNV-1a, 32 Bit, über die UTF-16-Codeeinheiten (Test-Helfer, keine Abhängigkeit). */
export function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, sortKeys(o[k])]),
    );
  }
  return v;
}

/** `JSON.stringify` mit rekursiv nach Schlüssel sortierten Objekten (Arrays behalten ihre Reihenfolge). */
export function sortedJson(v: unknown): string {
  return JSON.stringify(sortKeys(v));
}

const V6_KEYS = [
  'version',
  'seed',
  'width',
  'height',
  'tick',
  'tiles',
  'buildings',
  'nextBuildingId',
  'kontorId',
  'stock',
  'money',
  'stats',
  'won',
  'wonMerchants',
  'taxLevel',
  'taxLockedUntil',
  'sellPct',
  'order',
  'crisisLevel',
  'crisis',
  'unlocked',
  'goodLocks',
  'upgradeStops',
  'taxCarry',
  'upkeepCarry',
] as const;
const ISLAND_KEYS = ['width', 'height', 'tiles', 'kontorId', 'stock'] as const;

/**
 * Formt ein v7-JSON-Objekt mit genau einer Insel in die v6-Form zurück (Anhang 01 E): v6-Schlüsselreihenfolge,
 * je Gebäude ohne `island`. Unbekannte Schlüssel oder mehr als eine Insel → Fehler im Test.
 */
export function foldBackToV6(v7: Record<string, unknown>): Record<string, unknown> {
  const islands = v7.islands as Record<string, unknown>[];
  if (!Array.isArray(islands) || islands.length !== 1)
    throw new Error('foldBackToV6: genau eine Insel erwartet');
  const isl = islands[0]!;
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(v7)) if (k !== 'islands') flat[k] = v;
  for (const k of Object.keys(isl)) {
    if (!(ISLAND_KEYS as readonly string[]).includes(k))
      throw new Error(`foldBackToV6: unbekannter Inselschlüssel ${k}`);
    flat[k] = isl[k];
  }
  for (const k of Object.keys(flat))
    if (!(V6_KEYS as readonly string[]).includes(k))
      throw new Error(`foldBackToV6: unbekannter Schlüssel ${k}`);
  const out: Record<string, unknown> = {};
  for (const k of V6_KEYS) if (k in flat) out[k] = flat[k];
  out.version = 6;
  const buildings: Record<string, unknown> = {};
  for (const [id, b] of Object.entries(out.buildings as Record<string, Record<string, unknown>>)) {
    const c = { ...b };
    delete c.island;
    buildings[id] = c;
  }
  out.buildings = buildings;
  return out;
}
