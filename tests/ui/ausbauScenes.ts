import { recomputeConnectivity } from '../../src/sim/roads';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import type { BuildingDefId, CrisisLevel, Tier, World } from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { forceRect, putBuilding } from '../sim/helpers';

/**
 * Feste Szenen für die Browser-Checks des Ausbaus (Anhang 02 N7). Reine Testhilfe: Welt per `createWorld`,
 * Gebäude per `putBuilding` relativ zum Heimatkontor, Wege gelegt und angebunden. Kein Zufall, keine Uhrzeit.
 */
export type SceneId = 'S1' | 'S2' | 'S3' | 'S4';
export interface Scene {
  world: World;
  focus: { island: number; x: number; y: number };
  /** Benannte Gebäude (Id) und Koordinaten für den Tester. */
  ids: Record<string, number>;
}

const SEED = 3;
const MONEY = 20_000;
const FILL = { wood: 50, tools: 20, stone: 20, cloth: 4, cane: 50 } as const;
const GROUND_ROW = 45; // Küstenreihe: darunter Wasser, darüber Land
const ROAD_ROW = 44;

function newWorld(crisisLevel: CrisisLevel): World {
  const w = createWorld(SEED, { crisisLevel, unlockAll: true });
  w.money = MONEY;
  return w;
}

function fillStock(w: World, island: number): void {
  const stock = w.islands[island]!.stock;
  for (const g of GOOD_IDS) stock[g] = 0;
  Object.assign(stock, FILL);
}

function setLevel(w: World, id: number, level: 2 | 3): void {
  w.buildings[id]!.level = level;
}

function citizenHouse(w: World, x: number, y: number): number {
  const h = putBuilding(w, 0, 'house', x, y);
  h.house!.tier = 3 as Tier;
  return h.id;
}

/** Heimatinsel: Land x 34–53 / y 36–45, Wasser darunter, Weg vom Kontor hinunter und entlang der Küste. */
function coastPatch(w: World): void {
  const k = w.buildings[home(w).kontorId]!;
  forceRect(w, 34, 36, 20, 10, 'grass');
  forceRect(w, 34, GROUND_ROW + 1, 20, 4, 'water');
  const isl = home(w);
  const road = (x: number, y: number): void => {
    forceRect(w, x, y, 1, 1, 'grass');
    isl.tiles[idx(isl, x, y)]!.road = true;
  };
  for (let y = k.y + 2; y <= ROAD_ROW; y++) road(k.x + 1, y);
  for (let x = k.x + 2; x <= 53; x++) road(x, ROAD_ROW);
}

function done(w: World, ids: Record<string, number>, x: number, y: number, island = 0): Scene {
  recomputeConnectivity(w);
  return { world: w, focus: { island, x, y }, ids };
}

function s1(): Scene {
  const w = newWorld('off');
  coastPatch(w);
  fillStock(w, 0);
  const put = (d: BuildingDefId, x: number, y: number): number => putBuilding(w, 0, d, x, y).id;
  const ids = {
    fisher: put('fisher', 44, GROUND_ROW),
    n2: put('fisher', 46, GROUND_ROW),
    n3: put('fisher', 41, GROUND_ROW),
    citizen: citizenHouse(w, 44, 39),
  };
  setLevel(w, ids.fisher, 2);
  return done(w, ids, 44, 42);
}

function s2(): Scene {
  const w = newWorld('normal');
  coastPatch(w);
  fillStock(w, 0);
  const put = (d: BuildingDefId, x: number, y: number): number => putBuilding(w, 0, d, x, y).id;
  const ids = {
    distillery: put('distillery', 40, 42),
    fire: put('firestation', 44, 43),
    cane: put('canefarm', 36, 42),
    citizen: citizenHouse(w, 38, 39),
  };
  setLevel(w, ids.distillery, 3);
  return done(w, ids, 41, 42);
}

/** Kolonie (Insel 1): Kontor, Weg, Steinbruch an einer Gebirgsgruppe, kein Wohnhaus. */
function s3(): Scene {
  const w = newWorld('off');
  const isl = w.islands[1]!;
  const kontor = putBuilding(w, 1, 'kontor2', 8, 8);
  isl.kontorId = kontor.id;
  for (let y = 8; y <= 10; y++) isl.tiles[idx(isl, 10, y)]!.road = true;
  const quarry = putBuilding(w, 1, 'quarry', 11, 10);
  for (let y = 9; y <= 12; y++)
    for (let x = 12; x <= 13; x++) isl.tiles[idx(isl, x, y)]!.terrain = 'mountain';
  fillStock(w, 1);
  const ids = { kontor: kontor.id, quarry: quarry.id };
  return done(w, ids, 11, 10, 1);
}

function s4(): Scene {
  const w = newWorld('off');
  coastPatch(w);
  fillStock(w, 0);
  const put = (d: BuildingDefId, x: number, y: number): number => putBuilding(w, 0, d, x, y).id;
  const ids = {
    source: put('fisher', 36, GROUND_ROW),
    sourceCitizen: citizenHouse(w, 36, 40),
    f1: put('fisher', 49, GROUND_ROW),
    f2: put('fisher', 52, GROUND_ROW),
    citizenA: citizenHouse(w, 43, 40),
    citizenB: citizenHouse(w, 50, 40),
    targetY: GROUND_ROW,
    targetAx: 43,
    targetBx: 50,
  };
  setLevel(w, ids.source, 3);
  return done(w, ids, 43, 43);
}

const BUILDERS: Record<SceneId, () => Scene> = { S1: s1, S2: s2, S3: s3, S4: s4 };

export function scene(id: SceneId): Scene {
  return BUILDERS[id]();
}
