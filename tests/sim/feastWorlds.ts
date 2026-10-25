import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { FEAST_KIND_IDS, type FeastKind } from '../../src/sim/defs/feast';
import { GOOD_IDS, GOODS, STORAGE_CAP } from '../../src/sim/defs/goods';
import { FEAST_DURATION } from '../../src/sim/defs/timing';
import { TIERS } from '../../src/sim/defs/tiers';
import { holdFeast } from '../../src/sim/feast';
import { inChapelRadius } from '../../src/sim/feastEffect';
import { step } from '../../src/sim/tick';
import { sell } from '../../src/sim/trade';
import type { Building, BuildingDefId, GoodId, Tier, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { forceRect, putBuilding, setHouse } from './helpers';

export type FeastLage = 'A' | 'B' | 'C' | 'C2';
export type FeastRun = 'none' | FeastKind;
/** Feste Seeds (R553); ein Ersatz wäre eine feste Konstante, nie eine Suche zur Laufzeit. */
export const FEAST_SEEDS = [3, 7] as const;
export const FEAST_RUNS: readonly FeastRun[] = ['none', ...FEAST_KIND_IDS];

export interface FeastScene {
  w: World;
  chapel: Building;
  houses: Building[];
  producers: Building[];
  sales: Partial<Record<GoodId, number>>;
}

export interface RunLog {
  holdOk: boolean;
  sellOk: boolean;
  capHit: GoodId[];
  zeroHit: GoodId[];
  workshopUnits: number;
  housesRisen: number;
  incident: boolean;
  value: number;
}

/** Festbeginn T0 (fester Tick, keine Uhr). */
const T0 = 1000;
/** Lagerstand direkt gesetzt, darf die Lagergrenze überschreiten (Vorrat für Aufstieg und Hausbedarf). */
const AMPLE = 500;

type Stock = Partial<Record<GoodId, number>>;
type Spec = { defId: BuildingDefId; level?: 2 | 3 };

/** Fertige Szene: alle Gebäude per `putBuilding` (angebunden), danach nichts mehr, was die Anbindung neu rechnet. */
interface Layout {
  lage: FeastLage;
  tier: Tier;
  houseCount: number;
  inhabitants: number;
  stock: Stock;
  near: Spec[]; // Betriebe im Kapellenradius
  far: Spec[]; // Betriebe ausserhalb des Radius (nur Lage A, Güterbilanz)
  sales: Stock;
}

const L3 = (defId: BuildingDefId, n: number): Spec[] =>
  Array.from({ length: n }, () => ({ defId, level: 3 }));

const ENTRIES: Stock = { wool: 150, cane: 150, stone: 150, wood: 150 };
const HOUSE_BASE: Stock = { food: AMPLE, spice: AMPLE };
const PLATEAU_WORKS: Spec[] = [
  ...L3('weaver', 2),
  ...L3('distillery', 3),
  ...L3('glassworks', 1),
  ...L3('toolmaker', 1),
];

const LAYOUTS: Record<FeastLage, Layout> = {
  A: {
    lage: 'A',
    tier: 3,
    houseCount: 5,
    inhabitants: 15,
    stock: {
      ...HOUSE_BASE,
      wood: AMPLE,
      tools: AMPLE,
      stone: AMPLE,
      cloth: 200,
      rum: 200,
      glass: 100,
    },
    near: [...L3('weaver', 4), ...L3('distillery', 4)],
    // Nominale Erzeugung deckt Bedarf und Aufstiegs-Delta (kein Defizit, sonst doppelte Wartezeit)
    far: [...L3('fisher', 9), ...L3('glassworks', 2)],
    sales: {},
  },
  B: {
    lage: 'B',
    tier: 4,
    houseCount: 3,
    inhabitants: 20,
    stock: { ...HOUSE_BASE, ...ENTRIES, rum: 50, cloth: 50, glass: 50 },
    near: PLATEAU_WORKS,
    far: [],
    sales: { rum: 30, cloth: 30, glass: 20 },
  },
  C: {
    lage: 'C',
    tier: 4,
    houseCount: 1,
    inhabitants: 20,
    stock: { ...HOUSE_BASE, rum: 100, cloth: 100, glass: 100 },
    near: PLATEAU_WORKS,
    far: [],
    sales: { rum: 60, cloth: 60, glass: 40 },
  },
  C2: {
    lage: 'C2',
    tier: 4,
    houseCount: 3,
    inhabitants: 20,
    stock: { ...HOUSE_BASE, ...ENTRIES, rum: 100, cloth: 100, glass: 100 },
    near: PLATEAU_WORKS,
    far: [],
    sales: { rum: 60, cloth: 60, glass: 40 },
  },
};

function putSpec(w: World, spec: Spec, x: number, y: number): Building {
  const b = putBuilding(w, 0, spec.defId, x, y);
  if (spec.level !== undefined) b.level = spec.level;
  return b;
}

/** Wohnhaus, voll belegt und versorgt: Aufstiegsuhr und Bedürfnisse stehen bei T0 (`satisfiedSince = T0`). */
function putHouse(w: World, tier: Tier, inhabitants: number, x: number, y: number): Building {
  const b = putBuilding(w, 0, 'house', x, y);
  setHouse(b, tier, inhabitants);
  const h = b.house!;
  const goods = Object.keys(TIERS[tier].needs) as GoodId[];
  h.demand = Object.fromEntries(goods.map((g) => [g, 0]));
  h.satisfied = Object.fromEntries(goods.map((g) => [g, true]));
  h.services = Object.fromEntries(TIERS[tier].services.map((s) => [s, true]));
  h.supplied = true;
  h.satisfiedSince = T0;
  return b;
}

function setStock(w: World, stock: Stock): void {
  const s = home(w).stock;
  for (const g of GOOD_IDS) s[g] = stock[g] ?? 0;
}

/**
 * Aufbau relativ zum Heimatkontor (kx, ky), alles auf Gras: Häuser x = kx+2 … kx+6, y = ky−2 …;
 * Dienste (Kapelle, Schule, Bad) bei y = ky+4; Betriebe im Radius darunter; ferne Betriebe westlich (> 10 Kacheln).
 */
export function feastScene(lage: FeastLage, seed: number): FeastScene {
  const L = LAYOUTS[lage];
  const w = createWorld(seed, { unlockAll: true, crisisLevel: 'off' });
  w.tick = T0;
  w.money = 100_000;
  const k = w.buildings[home(w).kontorId]!;
  forceRect(w, k.x + 2, k.y - 2, 10, 14, 'grass');
  forceRect(w, k.x - 24, k.y - 2, 22, 8, 'grass');
  const chapel = putBuilding(w, 0, 'chapel', k.x + 2, k.y + 4);
  putBuilding(w, 0, 'school', k.x + 4, k.y + 4);
  putBuilding(w, 0, 'bathhouse', k.x + 6, k.y + 4);
  const houses = Array.from({ length: L.houseCount }, (_, i) =>
    putHouse(w, L.tier, L.inhabitants, k.x + 2 + (i % 5), k.y - 2 + Math.floor(i / 5)),
  );
  const producers = L.near.map((s, i) =>
    putSpec(w, s, k.x + 2 + 2 * (i % 4), k.y + 7 + 2 * Math.floor(i / 4)),
  );
  L.far.forEach((s, i) => {
    const big = BUILDING_DEFS[s.defId].w === 2;
    if (big) putSpec(w, s, k.x - 10 - 2 * (i % 9), k.y + 3);
    else putSpec(w, s, k.x - 10 - (i % 9), k.y);
  });
  setStock(w, L.stock);
  return { w, chapel, houses, producers, sales: L.sales };
}

const producedGoods = (producers: Building[]): GoodId[] => [
  ...new Set(producers.map((p) => BUILDING_DEFS[p.defId].produces!)),
];

/** Güter, die mindestens ein Haus der Szene verbraucht (Bedarf seiner jeweiligen Stufe). */
const consumedGoods = (houses: Building[]): GoodId[] => [
  ...new Set(houses.flatMap((h) => Object.keys(TIERS[h.house!.tier].needs) as GoodId[])),
];

/** Wert: Geld plus Lager der Heimat zu `GOODS[g].sell` (ohne Sättigung). */
function worth(w: World): number {
  const s = home(w).stock;
  return w.money + GOOD_IDS.reduce((sum, g) => sum + s[g] * GOODS[g].sell, 0);
}

const hasIncident = (w: World): boolean =>
  w.crisis !== null || Object.values(w.buildings).some((b) => b.outageUntil !== undefined);

/** Ein Lauf: Fest (ausser `none`), im selben Tick der Verkauf der Szene, dann `FEAST_DURATION` Schritte. */
export function runFeast(lage: FeastLage, seed: number, run: FeastRun): RunLog {
  const { w, chapel, houses, producers, sales } = feastScene(lage, seed);
  const log: RunLog = {
    holdOk: true,
    sellOk: true,
    capHit: [],
    zeroHit: [],
    workshopUnits: 0,
    housesRisen: 0,
    incident: false,
    value: 0,
  };
  if (run !== 'none') log.holdOk = holdFeast(w, chapel.id, run).ok;
  for (const [good, n] of Object.entries(sales) as [GoodId, number][])
    if (!sell(w, good, n).ok) log.sellOk = false;
  const tiers0 = houses.map((h) => h.house!.tier);
  const made = producedGoods(producers);
  const used = consumedGoods(houses);
  const cap = new Set<GoodId>();
  const zero = new Set<GoodId>();
  const progress = producers.map((p) => p.progress);
  for (let t = 0; t < FEAST_DURATION; t++) {
    step(w);
    const s = home(w).stock;
    for (const g of made) if (s[g] >= STORAGE_CAP) cap.add(g);
    for (const g of used) if (s[g] < 1) zero.add(g);
    producers.forEach((p, i) => {
      if (progress[i]! > 0 && p.progress === 0) log.workshopUnits += 1;
      progress[i] = p.progress;
    });
    if (hasIncident(w)) log.incident = true;
  }
  log.capHit = [...cap];
  log.zeroHit = [...zero];
  log.housesRisen = houses.filter((h, i) => h.house!.tier > tiers0[i]!).length;
  log.value = worth(w);
  return log;
}

/** Radiusprüfung der Szene (Vorbedingung: Häuser und Betriebe im Kapellenradius). */
export function inRadius(scene: FeastScene, list: Building[]): boolean {
  return list.every((b) => inChapelRadius(scene.w, scene.chapel, b));
}
