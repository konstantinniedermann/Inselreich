import { crisisWindow } from './crises';
import { BUILDING_DEFS } from './defs/buildings';
import { CRISIS_LEVELS } from './defs/crises';
import { GOODS, GOOD_IDS, SELL_FLOOR } from './defs/goods';
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
import { MAP_H, MAP_W } from './mapgen';
import { recomputeConnectivity } from './roads';
import { deriveUnlocks } from './unlocks';
import type { BuildingState, CrisisKind, CrisisLevel, GoodId, UnlockId, World } from './types';

export const SAVE_VERSION = 6;

export type LoadResult = { ok: true; world: World } | { ok: false; reason: string };

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

const isValidTile = (t: unknown): boolean =>
  isObject(t) && isInt(t.x) && isInt(t.y) && t.x >= 0 && t.y >= 0 && t.x < MAP_W && t.y < MAP_H;

/**
 * Krise: `null` oder eine Krise, die zu Stufe, Periode und Tick passt (Spec M6 9.2): Stufe mit Periode `P`,
 * `start = CRISIS_FIRST_TICK + period × P ≤ tick < until`, `from`/`until` nach der Formel der Art. Boom: Gut mit
 * Auftragsdefinition. Brand: `outcome` bekannt, `target` ganzzahlig genau dann, wenn nicht `miss`, `tile` fehlt
 * oder liegt ganzzahlig in der Karte.
 */
function isValidCrisis(c: unknown, level: CrisisLevel, tick: unknown): boolean {
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
    return c.tile === undefined || isValidTile(c.tile);
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
  if (!isValidCrisis(raw.crisis, crisisLevel as CrisisLevel, tick)) return false;
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

/** Strukturprüfung der Felder, auf die das Spiel direkt zugreift. */
function isWellFormed(raw: Record<string, unknown>): boolean {
  const { width, height, tiles, buildings, kontorId, stock, stats } = raw;
  if (width !== MAP_W || height !== MAP_H) return false;
  if (!Array.isArray(tiles) || tiles.length !== MAP_W * MAP_H) return false;
  if (!tiles.every(isObject)) return false;
  if (typeof raw.money !== 'number') return false;
  if (typeof kontorId !== 'number' || !isObject(buildings) || !isObject(buildings[kontorId]))
    return false;
  if (!Object.values(buildings).every(isValidBuilding)) return false;
  if (!isObject(stock) || !GOOD_IDS.every((g) => typeof stock[g] === 'number')) return false;
  if (!isValidV2Fields(raw)) return false;
  if (!isValidV3Fields(raw)) return false;
  if (!isValidV4Fields(raw)) return false;
  if (!isValidV5Fields(raw)) return false;
  if (!isValidV6Fields(raw)) return false;
  if (!isObject(stats) || typeof stats.taxes !== 'number' || typeof stats.upkeep !== 'number')
    return false;
  return (
    typeof raw.won === 'boolean' &&
    typeof raw.tick === 'number' &&
    typeof raw.nextBuildingId === 'number'
  );
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
  if (raw.version !== SAVE_VERSION) return { ok: false, reason: 'Unbekannte Version' };
  if (!isWellFormed(raw)) return { ok: false, reason: 'Beschädigter Spielstand' };
  const world = raw as unknown as World;
  try {
    // Persistiertes `connected` nicht übernehmen, sondern aus den Wegen neu ableiten
    recomputeConnectivity(world);
    if (fromV4) world.unlocked = deriveUnlocks(world);
  } catch {
    return { ok: false, reason: 'Beschädigter Spielstand' };
  }
  return { ok: true, world };
}
