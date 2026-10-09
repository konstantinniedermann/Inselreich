import { placeBuilding, placeRoad } from '../../src/sim/build';
import { newHouseState } from '../../src/sim/population';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld, footprint, idx, home } from '../../src/sim/world';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { TIER_IDS } from '../../src/sim/defs/tiers';
import { taxTarget } from '../../src/sim/tax';
import type {
  Building,
  BuildingDefId,
  CrisisLevel,
  ServiceId,
  TaxLevel,
  Tier,
  World,
} from '../../src/sim/types';

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

const V8_ISLAND_KEYS = [
  'kind',
  'width',
  'height',
  'tiles',
  'kontorId',
  'stock',
  'ox',
  'oy',
  'anchor',
] as const;
const V8_ADDED_KEYS = ['kind', 'ox', 'oy', 'anchor'] as const;

const V9_ADDED_WORLD_KEYS = ['ships', 'nextShipId', 'wonSpice'] as const;
const V9_WORLD_KEYS = [
  'version',
  'seed',
  'islands',
  'tick',
  'buildings',
  'nextBuildingId',
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
  ...V9_ADDED_WORLD_KEYS,
] as const;

/** Setzt alle vier Steuerregler auf dieselbe Stufe (T1b: über `taxTarget`). */
export function setAllTax(world: World, level: TaxLevel): void {
  for (const t of TIER_IDS) world.taxLevels[t] = taxTarget(level, t);
}

/**
 * Formt ein v10-JSON-Objekt in die v9-Form zurück (I-028): ein `taxLevel` und eine `taxLockedUntil` statt je vier,
 * Schlüsselfolge `V9_WORLD_KEYS`, `version 9`. Unbekannter Schlüssel (auch `taxLevel`) oder nicht zusammenfassbare
 * Regler (Stufen 1 bis 3 ungleich, oder Stufe 4 weder gleich noch `normal` bei `low`) → Fehler im Test.
 */
export function foldBackToV9(v10: Record<string, unknown>): Record<string, unknown> {
  const allowed = V9_WORLD_KEYS.map((k) => (k === 'taxLevel' ? 'taxLevels' : k)) as string[];
  for (const k of Object.keys(v10))
    if (!allowed.includes(k)) throw new Error(`foldBackToV9: unbekannter Schlüssel ${k}`);
  const levels = v10.taxLevels as Record<string, string>;
  const [a, b, c, d] = TIER_IDS.map((t) => levels[t]);
  if (!(a === b && b === c && (d === a || (a === 'low' && d === 'normal'))))
    throw new Error('foldBackToV9: Regler nicht zusammenfassbar');
  const locks = Object.values(v10.taxLockedUntil as Record<string, number>);
  const out: Record<string, unknown> = {};
  for (const k of V9_WORLD_KEYS) {
    if (k === 'taxLevel') out[k] = a;
    else if (k === 'taxLockedUntil') out[k] = Math.max(...locks);
    else if (k in v10) out[k] = v10[k];
  }
  out.version = 9;
  return out;
}

/**
 * Formt ein v9-JSON-Objekt in die v8-Form zurück (M12 Seefahrt): ohne `ships`, `nextShipId`, `wonSpice`,
 * `crisis.tile.island`, `stock.spice` je Insel und `sellPct.spice`; `version 8`. Unbekannter Schlüssel → Fehler im Test.
 */
export function foldBackToV8(v9: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(v9))
    if (!(V9_WORLD_KEYS as readonly string[]).includes(k))
      throw new Error(`foldBackToV8: unbekannter Schlüssel ${k}`);
  const out: Record<string, unknown> = { ...v9 };
  for (const k of V9_ADDED_WORLD_KEYS) delete out[k];
  out.version = 8;
  out.islands = (v9.islands as Record<string, unknown>[]).map((isl) => {
    const stock = { ...(isl.stock as Record<string, unknown>) };
    delete stock.spice;
    return { ...isl, stock };
  });
  const sellPct = { ...(v9.sellPct as Record<string, unknown>) };
  delete sellPct.spice;
  out.sellPct = sellPct;
  const crisis = v9.crisis as Record<string, unknown> | null;
  if (crisis && crisis.tile) {
    const tile = { ...(crisis.tile as Record<string, unknown>) };
    delete tile.island;
    out.crisis = { ...crisis, tile };
  }
  return out;
}

/**
 * Formt ein v8-JSON-Objekt in die v7-Form zurück (M12 E1): nur die Heimat bleibt, ohne `kind`, `ox`, `oy`,
 * `anchor`; `version 7`. Unbekannter Inselschlüssel → Fehler im Test.
 */
export function foldBackToV7(v8: Record<string, unknown>): Record<string, unknown> {
  const islands = v8.islands as Record<string, unknown>[];
  if (!Array.isArray(islands) || islands.length < 1)
    throw new Error('foldBackToV7: mindestens eine Insel erwartet');
  const homeIsl: Record<string, unknown> = { ...islands[0]! };
  for (const k of Object.keys(homeIsl))
    if (!(V8_ISLAND_KEYS as readonly string[]).includes(k))
      throw new Error(`foldBackToV7: unbekannter Inselschlüssel ${k}`);
  for (const k of V8_ADDED_KEYS) delete homeIsl[k];
  return { ...v8, islands: [homeIsl], version: 7 };
}

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

/**
 * Testwelt mit zwei Inseln (Anhang 01 F), nur im Speicher, nie gespeichert: Insel 1 = Kopie der Heimat-Kacheln
 * ohne Belegung und Wege, eigenes Kontor auf derselben Position (neue Id, `island 1`), Lager 0 ausser
 * Holz und Werkzeug je 50.
 */
export function twoIslandWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  const h = home(w);
  const k0 = w.buildings[h.kontorId]!;
  const tiles = h.tiles.map((t) => ({ ...t, buildingId: null as number | null, road: false }));
  const stock = Object.fromEntries(
    GOOD_IDS.map((g) => [g, 0]),
  ) as World['islands'][number]['stock'];
  stock.wood = 50;
  stock.tools = 50;
  const id = w.nextBuildingId++;
  // Testwelt: Insel 1 ersetzt die Fremdinseln (in E0 gab es nur zwei Inseln), Lage und Anker wie die Heimat.
  w.islands = [
    h,
    {
      kind: 'A',
      width: h.width,
      height: h.height,
      tiles,
      kontorId: id,
      stock,
      ox: h.ox,
      oy: h.oy,
      anchor: h.anchor,
    },
  ];
  w.buildings[id] = {
    id,
    defId: 'kontor',
    x: k0.x,
    y: k0.y,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 1,
  };
  for (const p of footprint(BUILDING_DEFS.kontor, k0.x, k0.y))
    tiles[idx(h, p.x, p.y)]!.buildingId = id;
  return w;
}

/** Setzt ein Gebäude direkt auf `island` (ohne Platzierungsprüfung, Geld und Lager unberührt); angebunden. */
export function putBuilding(
  world: World,
  island: number,
  defId: BuildingDefId,
  x: number,
  y: number,
): Building {
  const isl = world.islands[island]!;
  const id = world.nextBuildingId++;
  const b: Building = { id, defId, x, y, connected: true, progress: 0, state: 'ok', island };
  if (defId === 'house') b.house = newHouseState(world);
  world.buildings[id] = b;
  for (const p of footprint(BUILDING_DEFS[defId], x, y)) {
    const t = isl.tiles[idx(isl, p.x, p.y)]!;
    t.terrain = 'grass';
    t.buildingId = id;
  }
  return b;
}

function naiveDistance(a: Building, b: Building): number {
  const ca = center(BUILDING_DEFS[a.defId], a.x, a.y);
  const cb = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return Math.hypot(ca.cx - cb.cx, ca.cy - cb.cy);
}

/** Naive Referenz (Code vor T05 mit Inselfilter aus T04): durchsucht je Aufruf alle Gebäude. */
export function serviceAvailableNaive(world: World, house: Building, service: ServiceId): boolean {
  return Object.values(world.buildings).some((b) => {
    const def = BUILDING_DEFS[b.defId];
    return (
      def.service === service &&
      b.island === house.island &&
      b.connected &&
      b.outageUntil === undefined &&
      naiveDistance(house, b) <= (def.serviceRadius ?? 0)
    );
  });
}

/** Naive Referenz der Versorgung: Kontor der Insel oder angebundener Markt im Radius (Mitte zu Mitte). */
export function isSuppliedNaive(world: World, house: Building): boolean {
  const c = center(BUILDING_DEFS[house.defId], house.x, house.y);
  const kontorId = world.islands[house.island]?.kontorId;
  return Object.values(world.buildings).some((b) => {
    if (b.island !== house.island) return false;
    if (!((b.defId === 'kontor' && b.id === kontorId) || (b.defId === 'market' && b.connected)))
      return false;
    const def = BUILDING_DEFS[b.defId];
    const m = center(def, b.x, b.y);
    return Math.hypot(c.cx - m.cx, c.cy - m.cy) <= (def.supplyRadius ?? 0);
  });
}

const DENSE_SERVICES = ['chapel', 'school', 'bathhouse'] as const;

/**
 * Dichte-Szene D1 (Anhang 01 D): `createWorld(3, { unlockAll: true })`, Gebäude direkt in `buildings`,
 * ohne Kachelbelegung, alle angebunden, Insel 0. 484 Häuser (Stufe 4, 20 EW) auf (3i, 3j), 64 Dienstgebäude
 * auf (1 + 8i, 1 + 8j) reihum Kapelle, Schule, Badehaus. Mit `toolmakers` zusätzlich 4 Werkzeugmacher auf (2 + 16i, 2).
 */
export function denseScene(opts: { toolmakers?: boolean } = {}): World {
  const w = createWorld(3, { unlockAll: true });
  const add = (defId: BuildingDefId, x: number, y: number): Building => {
    const id = w.nextBuildingId++;
    const b: Building = { id, defId, x, y, connected: true, progress: 0, state: 'ok', island: 0 };
    w.buildings[id] = b;
    return b;
  };
  for (let i = 0; i < 22; i++) {
    for (let j = 0; j < 22; j++) {
      const h = add('house', 3 * i, 3 * j);
      h.house = { ...newHouseState(w), tier: 4, inhabitants: 20, supplied: true };
    }
  }
  let k = 0;
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) add(DENSE_SERVICES[k++ % 3]!, 1 + 8 * i, 1 + 8 * j);
  if (opts.toolmakers) for (let i = 0; i < 4; i++) add('toolmaker', 2 + 16 * i, 2);
  return w;
}
