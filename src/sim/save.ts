import { crisisWindow } from './crises';
import { BUILDING_DEFS } from './defs/buildings';
import { CRISIS_LEVELS } from './defs/crises';
import { GOODS, GOOD_IDS, SELL_FLOOR, SPICE_GRACE_MAX, SPICE_GRACE_PER_HOUSE } from './defs/goods';
import {
  CRISIS_FIRST_TICK,
  FIRE_OUTAGE,
  ORDER_DURATION,
  ORDER_FIRST_TICK,
  ORDER_PERIOD,
  EFF_MAX,
  EFF_WINDOW,
  UPKEEP_INTERVAL,
} from './defs/timing';
import { LEVELS } from './defs/levels';
import { TAX_CARRY_DIVISOR, TAX_LEVELS, TIERS } from './defs/tiers';
import { UNLOCK_IDS } from './defs/unlocks';
import { ISLANDS, ROUTE_GOODS_PER_DIRECTION, ROUTE_RESERVE, SHIP, SHIP_MAX } from './defs/sea';
import { generateForeignIslands, homeAnchor, laneTicks, type LaneIsland } from './islands';
import { MAP_H, MAP_W } from './mapgen';
import { recomputeConnectivity } from './roads';
import { deriveUnlocks } from './unlocks';
import type {
  BuildingState,
  CrisisKind,
  CrisisLevel,
  GoodId,
  LoadResult,
  Terrain,
  UnlockId,
  World,
} from './types';

export const SAVE_VERSION = 9;

export type { LoadResult };

/** Meldung beim ersten Laden eines alten Standes mit Übergangsbestand Gewürz (v8 → v9). */
export const SPICE_GRACE_NOTICE =
  'Deine Kaufleute wünschen jetzt Gewürz — kaufe es am Kontor oder gründe ein Kontor auf einer Gewürzinsel.';

export function serialize(world: World): string {
  return JSON.stringify(world);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isValidBuilding = (b: unknown): boolean =>
  isObject(b) &&
  typeof b.defId === 'string' &&
  Object.hasOwn(BUILDING_DEFS, b.defId) &&
  typeof b.x === 'number' &&
  typeof b.y === 'number';

const isInt = (v: unknown): v is number => Number.isInteger(v);

/**
 * Auftrag: `null` oder ein Auftrag, der zu den Takt-Konstanten und zum gespeicherten `tick` passt:
 * `due` ergibt sich aus der Periode, der Auftrag ist schon angeboten (`tick ≥ due − ORDER_DURATION`)
 * und noch nicht verfallen (`tick ≤ due`, `tickOrders` löscht erst bei `tick > due`). Menge und Prämie
 * werden nur strukturell geprüft, nicht gegen aktuelle Spielwerte (Spielstände bleiben ladbar).
 */
function isValidOrder(o: unknown, tick: unknown): boolean {
  if (o === null) return true;
  if (
    !isObject(o) ||
    !isInt(tick) ||
    !isInt(o.period) ||
    o.period < 0 ||
    !isInt(o.amount) ||
    o.amount < 1 ||
    !isInt(o.reward) ||
    o.reward < 0 ||
    !isInt(o.due) ||
    typeof o.good !== 'string' ||
    !Object.hasOwn(GOODS, o.good)
  )
    return false;
  if (GOODS[o.good as keyof typeof GOODS].order === undefined) return false;
  const offered = ORDER_FIRST_TICK + o.period * ORDER_PERIOD;
  return o.due === offered + ORDER_DURATION && tick >= offered && tick <= o.due;
}

/** Felder von Save v2: Steuerstufe, Sperre, Verkaufsanteile, Auftrag. */
function isValidV2Fields(raw: Record<string, unknown>): boolean {
  const { taxLevel, sellPct } = raw;
  if (typeof taxLevel !== 'string' || !Object.hasOwn(TAX_LEVELS, taxLevel)) return false;
  if (!isInt(raw.taxLockedUntil) || raw.taxLockedUntil < 0) return false;
  if (
    !isObject(sellPct) ||
    !GOOD_IDS.every((g) => isInt(sellPct[g]) && sellPct[g] >= SELL_FLOOR && sellPct[g] <= 100)
  )
    return false;
  return isValidOrder(raw.order, raw.tick);
}

/** v1 → v2: neue Felder mit den Werten, die das bisherige Verhalten ergeben; Vorhandenes bleibt unberührt. */
export function migrateV1ToV2(raw: Record<string, unknown>): void {
  raw.version = 2;
  raw.taxLevel = 'normal';
  raw.taxLockedUntil = 0;
  raw.sellPct = Object.fromEntries(GOOD_IDS.map((g) => [g, 100]));
  raw.order = null;
}

const CRISIS_KINDS: readonly string[] = ['fire', 'storm', 'boom'];
const FIRE_OUTCOMES: readonly string[] = ['burning', 'extinguished', 'miss'];

const isValidTile = (t: unknown, islandCount: number): boolean =>
  isObject(t) &&
  isInt(t.x) &&
  isInt(t.y) &&
  t.x >= 0 &&
  t.y >= 0 &&
  t.x < MAP_W &&
  t.y < MAP_H &&
  isIntBetween(t.island, 0, islandCount - 1);

/**
 * Krise: `null` oder eine Krise, die zu Stufe, Periode und Tick passt (Spec M6 9.2): Stufe mit Periode `P`,
 * `start = CRISIS_FIRST_TICK + period × P ≤ tick < until`, `from`/`until` nach der Formel der Art. Boom: Gut mit
 * Auftragsdefinition. Brand: `outcome` bekannt, `target` ganzzahlig genau dann, wenn nicht `miss`, `tile` fehlt
 * oder liegt ganzzahlig in der Karte.
 */
function isValidCrisis(
  c: unknown,
  level: CrisisLevel,
  tick: unknown,
  islandCount: number,
): boolean {
  if (c === null) return true;
  if (!isObject(c) || !isInt(tick) || !isInt(c.period) || c.period < 0) return false;
  const period = CRISIS_LEVELS[level].period;
  if (period === null) return false;
  if (typeof c.kind !== 'string' || !CRISIS_KINDS.includes(c.kind)) return false;
  const start = CRISIS_FIRST_TICK + c.period * period;
  const win = crisisWindow(c.kind as CrisisKind, start);
  if (c.from !== win.from || c.until !== win.until) return false;
  if (tick < start || tick >= win.until) return false;
  if (c.kind === 'boom')
    return (
      typeof c.good === 'string' &&
      Object.hasOwn(GOODS, c.good) &&
      GOODS[c.good as GoodId].order !== undefined
    );
  if (c.kind === 'fire') {
    if (typeof c.outcome !== 'string' || !FIRE_OUTCOMES.includes(c.outcome)) return false;
    const hasTarget = c.target !== undefined;
    if (hasTarget && !isInt(c.target)) return false;
    if (hasTarget !== (c.outcome !== 'miss')) return false;
    return c.tile === undefined || isValidTile(c.tile, islandCount);
  }
  return true;
}

/** Ausfall: `outageUntil` und `state 'burning'` nur gemeinsam; `tick < outageUntil ≤ tick + FIRE_OUTAGE`. */
function isValidOutage(b: Record<string, unknown>, tick: unknown): boolean {
  const has = b.outageUntil !== undefined;
  if (has !== (b.state === 'burning')) return false;
  return (
    !has ||
    (isInt(tick) &&
      isInt(b.outageUntil) &&
      b.outageUntil > tick &&
      b.outageUntil <= tick + FIRE_OUTAGE)
  );
}

/** Felder von Save v3: Krisenstufe, Krise, Ausfälle der Gebäude. */
function isValidV3Fields(raw: Record<string, unknown>): boolean {
  const { crisisLevel, tick } = raw;
  if (typeof crisisLevel !== 'string' || !Object.hasOwn(CRISIS_LEVELS, crisisLevel)) return false;
  const islandCount = Array.isArray(raw.islands) ? raw.islands.length : 0;
  if (!isValidCrisis(raw.crisis, crisisLevel as CrisisLevel, tick, islandCount)) return false;
  const buildings = raw.buildings as Record<string, Record<string, unknown>>;
  return Object.values(buildings).every((b) => isValidOutage(b, tick));
}

/** v2 → v3: keine Krisen (R74 Entscheid 5); Gebäude und alles Vorhandene bleiben unberührt. */
export function migrateV2ToV3(raw: Record<string, unknown>): void {
  raw.version = 3;
  raw.crisisLevel = 'off';
  raw.crisis = null;
}

/**
 * Felder von Save v4 (M8 10.2): `wonMerchants` boolean und nur mit `won`; jede Hausstufe ganzzahlig 1 … 4;
 * Stufe 4 nur mit `won` oder aktivem Hebel (`TIERS[4].unlockCitizens` ≠ null; die Bürgerzahl wird bewusst nicht
 * geprüft, Kaufleute ohne Glas schrumpfen unter die Schwelle).
 */
function isValidV4Fields(raw: Record<string, unknown>): boolean {
  if (typeof raw.wonMerchants !== 'boolean') return false;
  if (raw.wonMerchants && raw.won !== true) return false;
  const leverActive = (TIERS[4].unlockCitizens ?? null) !== null;
  const buildings = raw.buildings as Record<string, Record<string, unknown>>;
  return Object.values(buildings).every((b) => {
    if (b.house === undefined) return true;
    if (!isObject(b.house)) return false;
    const tier = b.house.tier;
    if (!isInt(tier) || tier < 1 || tier > 4) return false;
    return tier !== 4 || raw.won === true || leverActive;
  });
}

/** v3 → v4: Glas 0 / 100, zweites Ziel offen; Gebäude und Häuser bleiben unberührt (in v3 gibt es keine Stufe 4). */
export function migrateV3ToV4(raw: Record<string, unknown>): void {
  raw.version = 4;
  if (isObject(raw.stock)) raw.stock.glass = 0;
  if (isObject(raw.sellPct)) raw.sellPct.glass = 100;
  raw.wonMerchants = false;
}

/** v4 → v5 (Spec 8.2): Platzhalter; die echte Freischaltung setzt deserialize nach isWellFormed (deriveUnlocks). */
export function migrateV4ToV5(raw: Record<string, unknown>): void {
  raw.unlocked = ['U0'];
  raw.goodLocks = [];
  raw.upgradeStops = [];
  raw.version = 5;
}

/** v5 → v6 (Spec 5): Überträge 0; `eff`/`level` fehlen = 256 000 bzw. Stufe 1. */
export function migrateV5ToV6(raw: Record<string, unknown>): void {
  raw.taxCarry = 0;
  raw.upkeepCarry = 0;
  raw.version = 6;
}

/** Schlüssel der obersten Ebene von v6, die in v7 in die Insel wandern (P-5). */
const ISLAND_KEYS_V6 = ['width', 'height', 'tiles', 'kontorId', 'stock'] as const;

/**
 * v6 → v7 (M12 E0): wirft nie. Schlüssel in Originalreihenfolge neu einsetzen; `width` wird durch `islands`
 * ersetzt, `height`, `tiles`, `kontorId`, `stock` wandern in Insel 0; je Gebäude `island: 0` direkt nach `state`.
 */
export function migrateV6ToV7(raw: Record<string, unknown>): void {
  const island: Record<string, unknown> = {};
  for (const k of ISLAND_KEYS_V6) island[k] = raw[k];
  const entries = Object.entries(raw);
  for (const [k] of entries) delete raw[k];
  for (const [k, v] of entries) {
    if (k === 'width') raw.islands = [island];
    else if ((ISLAND_KEYS_V6 as readonly string[]).includes(k)) continue;
    else raw[k] = k === 'buildings' ? withIsland(v) : v;
  }
  if (!('islands' in raw)) raw.islands = [island];
  raw.version = 7;
}

function withIsland(buildings: unknown): unknown {
  if (!isObject(buildings)) return buildings;
  for (const [id, b] of Object.entries(buildings)) if (isObject(b)) buildings[id] = insertIsland(b);
  return buildings;
}

function insertIsland(b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    out[k] = v;
    if (k === 'state') out.island = 0;
  }
  if (!('state' in out)) out.island = 0;
  return out;
}

/** Heimat im rohen v7-Objekt, wenn sie sich sicher neu aufbauen lässt; sonst `null`. */
function rebuildableHome(raw: Record<string, unknown>): Record<string, unknown> | null {
  const { islands, buildings, seed } = raw;
  if (!Array.isArray(islands) || !isObject(islands[0]) || !isObject(buildings)) return null;
  const isl = islands[0];
  if (!Array.isArray(isl.tiles) || isl.tiles.length !== MAP_W * MAP_H) return null;
  if (!isl.tiles.every(isObject) || typeof seed !== 'number' || !Number.isFinite(seed)) return null;
  const kontor = typeof isl.kontorId === 'number' ? buildings[isl.kontorId] : undefined;
  return isObject(kontor) && kontor.defId === 'kontor' ? isl : null;
}

/**
 * v7 → v8 (M12 E1): wirft nie. Heimat bekommt `kind` vorn sowie `ox`, `oy`, `anchor` hinten, die Fremdinseln
 * A und B hängen an (aus `seed` erzeugt, wie `createWorld`). Lässt sich das nicht sicher aufbauen, wird nur die
 * Version gesetzt; die Ladeprüfung lehnt den Stand dann ab.
 */
export function migrateV7ToV8(raw: Record<string, unknown>): void {
  try {
    const isl = rebuildableHome(raw);
    if (isl !== null) addForeignIslands(raw, isl);
  } catch {
    // unbrauchbarer Stand: die Ladeprüfung meldet ihn
  }
  raw.version = 8;
}

function addForeignIslands(raw: Record<string, unknown>, isl: Record<string, unknown>): void {
  const tiles = isl.tiles as Array<Record<string, unknown>>;
  const kontor = (raw.buildings as Record<number, Record<string, number>>)[isl.kontorId as number]!;
  const terrain = tiles.map((t) => t.terrain) as Terrain[];
  const anchor = homeAnchor(terrain, MAP_W, MAP_H, { x: kontor.x!, y: kontor.y! });
  const homeIsland = { kind: 'home', ...isl, ox: 0, oy: 0, anchor };
  const layout = { ox: 0, oy: 0, width: MAP_W, height: MAP_H, anchor };
  const foreign = generateForeignIslands(raw.seed as number, layout).map((p) => ({
    kind: p.kind,
    width: p.width,
    height: p.height,
    tiles: p.terrain.map((t) => ({ terrain: t, buildingId: null, road: false })),
    kontorId: null,
    stock: Object.fromEntries(GOOD_IDS.map((g) => [g, 0])),
    ox: p.ox,
    oy: p.oy,
    anchor: p.anchor,
  }));
  raw.islands = [homeIsland, ...foreign];
}

const isTier4House = (b: unknown): boolean =>
  isObject(b) && isObject(b.house) && b.house.tier === 4;

/** Übergangsbestand: je Haus der Stufe 4 `SPICE_GRACE_PER_HOUSE`, höchstens `SPICE_GRACE_MAX`. */
function spiceGrace(buildings: unknown): number {
  const houses = isObject(buildings) ? Object.values(buildings).filter(isTier4House).length : 0;
  return Math.min(SPICE_GRACE_MAX, SPICE_GRACE_PER_HOUSE * houses);
}

function addSpiceToIslands(raw: Record<string, unknown>): number {
  if (!Array.isArray(raw.islands)) return 0;
  for (const isl of raw.islands) {
    if (isObject(isl) && isObject(isl.stock)) isl.stock.spice ??= 0;
  }
  const homeIsl: unknown = raw.islands[0];
  if (!isObject(homeIsl) || !isObject(homeIsl.stock)) return 0;
  homeIsl.stock.spice = spiceGrace(raw.buildings);
  return homeIsl.stock.spice as number;
}

/**
 * v8 → v9 (M12 Seefahrt): wirft nie. Gewürz je Insel 0 (`sellPct` 100), Krisen-`tile` bekommt `island 0`,
 * `ships`, `nextShipId`, `wonSpice` neu. Die Heimat bekommt den Übergangsbestand (gesetzt, nicht addiert);
 * Rückgabe: dieser Bestand, 0 wenn nichts gelegt wurde.
 */
export function migrateV8ToV9(raw: Record<string, unknown>): number {
  let grace = 0;
  try {
    grace = addSpiceToIslands(raw);
    if (isObject(raw.sellPct)) raw.sellPct.spice ??= 100;
    if (isObject(raw.crisis) && isObject(raw.crisis.tile)) raw.crisis.tile.island = 0;
  } catch {
    // unbrauchbarer Stand: die Ladeprüfung meldet ihn
  }
  raw.ships = [];
  raw.nextShipId = 1;
  raw.wonSpice = false;
  raw.version = 9;
  return grace;
}

function isUnlockList(v: unknown): boolean {
  if (!Array.isArray(v) || !v.includes('U0')) return false;
  let last = -1;
  for (const id of v) {
    const i = UNLOCK_IDS.indexOf(id as UnlockId);
    if (i <= last) return false; // unbekannt (−1), doppelt oder falsche Reihenfolge
    last = i;
  }
  return true;
}
function isGoodLockList(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  let last = -1;
  for (const e of v) {
    if (!isObject(e)) return false;
    const tier = e.tier;
    if (tier !== 1 && tier !== 2 && tier !== 3 && tier !== 4) return false;
    const gi = GOOD_IDS.indexOf(e.good as GoodId);
    if (gi < 0 || !Object.hasOwn(TIERS[tier].needs, e.good as string)) return false;
    const key = tier * 100 + gi;
    if (key <= last) return false; // doppelt oder unsortiert
    last = key;
  }
  return true;
}
function isUpgradeStopList(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  let last = 0;
  for (const t of v as unknown[]) {
    if (t !== 1 && t !== 2 && t !== 3 && t !== 4) return false;
    if (TIERS[t].upgradeCost === null || t <= last) return false;
    last = t;
  }
  return true;
}

/** Ein Wohnhaus ohne Hausdaten bräuchte jede Abfrage der Freischaltung als Sonderfall (Spec 8.2). */
const housesHaveState = (buildings: unknown): boolean =>
  Object.values(buildings as Record<string, Record<string, unknown>>).every(
    (b) => b.defId !== 'house' || isObject(b.house),
  );

function isValidV5Fields(raw: Record<string, unknown>): boolean {
  return (
    housesHaveState(raw.buildings) &&
    isUnlockList(raw.unlocked) &&
    isGoodLockList(raw.goodLocks) &&
    isUpgradeStopList(raw.upgradeStops)
  );
}

const BUILDING_STATES: readonly BuildingState[] = [
  'ok',
  'waitingInput',
  'storageFull',
  'notConnected',
  'burning',
  'noService',
  'noForest',
];

const isIntBetween = (v: unknown, min: number, max: number): boolean =>
  isInt(v) && v >= min && v <= max;

/** `eff` nur bei Betrieben mit `produces`, `level` nur bei Betrieben mit Ausbau-Eintrag (Spec 5). */
function isValidV6Building(b: unknown): boolean {
  if (!isObject(b)) return false;
  const def = BUILDING_DEFS[b.defId as keyof typeof BUILDING_DEFS];
  if (!BUILDING_STATES.includes(b.state as BuildingState)) return false;
  if (
    b.eff !== undefined &&
    (def.produces === undefined || !isIntBetween(b.eff, 0, EFF_WINDOW * EFF_MAX))
  )
    return false;
  if (b.level !== undefined && (LEVELS[def.id] === undefined || (b.level !== 2 && b.level !== 3)))
    return false;
  return true;
}

/** `feastAt` (H-I007) nur an der Kapelle, ganzzahlig, `0 ≤ feastAt ≤ tick`; fehlt = kein Fest (keine Save-Version). */
function isValidFeast(b: unknown, tick: unknown): boolean {
  if (!isObject(b) || b.feastAt === undefined) return true;
  return b.defId === 'chapel' && isInt(tick) && isIntBetween(b.feastAt, 0, tick);
}

function isValidV6Fields(raw: Record<string, unknown>): boolean {
  return (
    isIntBetween(raw.taxCarry, 0, TAX_CARRY_DIVISOR - 1) &&
    isIntBetween(raw.upkeepCarry, 0, UPKEEP_INTERVAL - 1) &&
    Object.values(raw.buildings as Record<string, unknown>).every(
      (b) => isValidV6Building(b) && isValidFeast(b, raw.tick),
    )
  );
}

const hasValidIslandIndex = (b: unknown, count: number): boolean =>
  isObject(b) && isInt(b.island) && b.island >= 0 && b.island < count;

const hasFullStock = (stock: unknown): boolean =>
  isObject(stock) && GOOD_IDS.every((g) => typeof stock[g] === 'number');

const isAnchorInside = (a: unknown, w: number, h: number): boolean =>
  isObject(a) && isIntBetween(a.x, 0, w - 1) && isIntBetween(a.y, 0, h - 1);

/** Raster der Insel: Kantenlängen ganzzahlig 1 … `maxSize`, genau `w · h` Kacheln als Objekte. */
function hasValidRaster(isl: Record<string, unknown>, maxW: number, maxH: number): boolean {
  const { width, height, tiles } = isl;
  if (!isIntBetween(width, 1, maxW) || !isIntBetween(height, 1, maxH)) return false;
  return (
    Array.isArray(tiles) &&
    tiles.length === (width as number) * (height as number) &&
    tiles.every(isObject)
  );
}

/** Heimat (Index 0): feste Grösse, Ursprung 0/0, Kontor als Zahl. */
function isValidHome(isl: Record<string, unknown>): boolean {
  return (
    isl.width === MAP_W &&
    isl.height === MAP_H &&
    hasValidRaster(isl, MAP_W, MAP_H) &&
    isl.ox === 0 &&
    isl.oy === 0 &&
    typeof isl.kontorId === 'number'
  );
}

/** Kontor einer Fremdinsel: `null` oder Id eines `kontor2` auf genau dieser Insel (`kontor2` kommt mit M12 Seefahrt T02). */
function isForeignKontor(kontorId: unknown, index: number, buildings: unknown): boolean {
  if (kontorId === null) return true;
  if (!isInt(kontorId) || !isObject(buildings)) return false;
  const b = buildings[kontorId];
  return isObject(b) && b.defId === 'kontor2' && b.island === index;
}

/** Fremdinsel: Raster höchstens `size`, Kontor `null` oder `kontor2` der Insel. */
function isValidForeign(
  isl: Record<string, unknown>,
  size: number,
  index: number,
  buildings: unknown,
): boolean {
  return (
    hasValidRaster(isl, size, size) &&
    isForeignKontor(isl.kontorId, index, buildings) &&
    isInt(isl.ox) &&
    isInt(isl.oy)
  );
}

function isValidIsland(isl: unknown, i: number, buildings: unknown): boolean {
  if (!isObject(isl) || isl.kind !== (i === 0 ? 'home' : ISLANDS[i - 1]!.kind)) return false;
  if (!hasFullStock(isl.stock)) return false;
  const shapeOk =
    i === 0 ? isValidHome(isl) : isValidForeign(isl, ISLANDS[i - 1]!.size, i, buildings);
  return shapeOk && isAnchorInside(isl.anchor, isl.width as number, isl.height as number);
}

/** Raster, Lager, Kontor und Inselbezug der Gebäude (v8: Heimat plus alle `ISLANDS`, keine v6-Reste oben). */
function isValidIslands(raw: Record<string, unknown>): boolean {
  const { islands, buildings } = raw;
  if (!isObject(buildings) || !Array.isArray(islands)) return false;
  if (islands.length !== 1 + ISLANDS.length) return false;
  if (ISLAND_KEYS_V6.some((k) => Object.hasOwn(raw, k))) return false;
  if (!islands.every((isl, i) => isValidIsland(isl, i, buildings))) return false;
  const home = islands[0] as Record<string, unknown>;
  const kontor = buildings[home.kontorId as number];
  if (!isObject(kontor) || kontor.defId !== 'kontor' || kontor.island !== 0) return false;
  const all = Object.values(buildings);
  return all.every(isValidBuilding) && all.every((b) => hasValidIslandIndex(b, islands.length));
}

const hasKontor = (islands: Record<string, unknown>[], i: unknown): boolean =>
  isInt(i) && isObject(islands[i]) && islands[i].kontorId !== null;

const isValidReserveGood = (g: unknown): g is Record<string, unknown> =>
  isObject(g) &&
  GOOD_IDS.includes(g.good as GoodId) &&
  isIntBetween(g.reserve, 0, ROUTE_RESERVE.max) &&
  (g.reserve as number) % ROUTE_RESERVE.step === 0;

function isValidRoute(r: unknown, islands: Record<string, unknown>[]): boolean {
  if (r === null) return true;
  if (!isObject(r) || r.a === r.b || !hasKontor(islands, r.a) || !hasKontor(islands, r.b))
    return false;
  const { ab, ba } = r;
  if (!Array.isArray(ab) || !Array.isArray(ba)) return false;
  if (ab.length > ROUTE_GOODS_PER_DIRECTION || ba.length > ROUTE_GOODS_PER_DIRECTION) return false;
  const all = [...ab, ...ba];
  if (!all.every(isValidReserveGood)) return false;
  const goods = all.map((g) => (g as Record<string, unknown>).good);
  return new Set(goods).size === goods.length;
}

function isValidCargo(c: unknown): boolean {
  if (!isObject(c)) return false;
  let sum = 0;
  for (const [good, n] of Object.entries(c)) {
    if (!GOOD_IDS.includes(good as GoodId) || !isInt(n) || n < 1) return false;
    sum += n;
  }
  return sum <= SHIP.capacity;
}

function isValidShip(s: unknown, islands: Record<string, unknown>[]): boolean {
  if (!isObject(s) || !isIntBetween(s.port, 0, islands.length - 1)) return false;
  const port = s.port as number;
  if (s.to !== null) {
    if (!hasKontor(islands, s.to) || s.to === port) return false;
  }
  const maxLeft =
    s.to === null ? 0 : laneTicks(islands as unknown as LaneIsland[], port, s.to as number);
  if (!isIntBetween(s.left, 0, maxLeft)) return false;
  if (!isValidCargo(s.cargo) || !isValidRoute(s.route, islands)) return false;
  return typeof s.homing === 'boolean' && (!s.homing || s.route === null);
}

/** Felder von Save v9 (M12 Seefahrt): Schiffe, Zähler, drittes Ziel. */
function isValidV9Fields(raw: Record<string, unknown>): boolean {
  const { ships, nextShipId } = raw;
  const islands = raw.islands as Record<string, unknown>[];
  if (typeof raw.wonSpice !== 'boolean' || (raw.wonSpice && raw.wonMerchants !== true))
    return false;
  if (!Array.isArray(ships) || ships.length > SHIP_MAX) return false;
  if (!ships.every((s) => isValidShip(s, islands))) return false;
  const ids = ships.map((s) => (s as Record<string, unknown>).id);
  if (!ids.every((id) => isInt(id) && id >= 1) || new Set(ids).size !== ids.length) return false;
  if (!isInt(nextShipId) || nextShipId < 1) return false;
  return ids.every((id) => nextShipId > (id as number));
}

/** Strukturprüfung der Felder, auf die das Spiel direkt zugreift. */
function isWellFormed(raw: Record<string, unknown>): boolean {
  const { stats } = raw;
  if (typeof raw.money !== 'number') return false;
  if (!isValidIslands(raw)) return false;
  if (!isValidV2Fields(raw)) return false;
  if (!isValidV3Fields(raw)) return false;
  if (!isValidV4Fields(raw)) return false;
  if (!isValidV5Fields(raw)) return false;
  if (!isValidV6Fields(raw)) return false;
  if (!isValidV9Fields(raw)) return false;
  if (!isObject(stats) || typeof stats.taxes !== 'number' || typeof stats.upkeep !== 'number')
    return false;
  return (
    typeof raw.won === 'boolean' &&
    typeof raw.tick === 'number' &&
    typeof raw.nextBuildingId === 'number'
  );
}

/** `isWellFormed`, aber unbrauchbare Strukturen führen zu `false` statt zu einer Ausnahme. */
function isWellFormedSafe(raw: Record<string, unknown>): boolean {
  try {
    return isWellFormed(raw);
  } catch {
    return false;
  }
}

/** Liest einen Spielstand; wirft nie, sondern meldet den Grund. */
export function deserialize(json: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'Ungültiges Format' };
  }
  if (!isObject(raw)) return { ok: false, reason: 'Ungültiges Format' };
  if (raw.version === 1) migrateV1ToV2(raw);
  if (raw.version === 2) migrateV2ToV3(raw);
  if (raw.version === 3) migrateV3ToV4(raw);
  const fromV4 = raw.version === 4;
  if (fromV4) migrateV4ToV5(raw);
  if (raw.version === 5) migrateV5ToV6(raw);
  if (raw.version === 6) migrateV6ToV7(raw);
  if (raw.version === 7) migrateV7ToV8(raw);
  const grace = raw.version === 8 ? migrateV8ToV9(raw) : 0;
  if (raw.version !== SAVE_VERSION) return { ok: false, reason: 'Unbekannte Version' };
  if (!isWellFormedSafe(raw)) return { ok: false, reason: 'Beschädigter Spielstand' };
  const world = raw as unknown as World;
  try {
    // Persistiertes `connected` nicht übernehmen, sondern aus den Wegen neu ableiten
    recomputeConnectivity(world);
    if (fromV4) world.unlocked = deriveUnlocks(world);
  } catch {
    return { ok: false, reason: 'Beschädigter Spielstand' };
  }
  return grace > 0 ? { ok: true, world, notice: SPICE_GRACE_NOTICE } : { ok: true, world };
}
