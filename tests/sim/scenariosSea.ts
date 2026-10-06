// Szenario für das dritte Ziel „Gewürzstadt“ (M12 T06, Anhang 05 J.5). Nur Tests, schreibt keine Saves.
import { placeBuilding } from '../../src/sim/build';
import { generateForeignIslands } from '../../src/sim/islands';
import { buyShip } from '../../src/sim/ships';

import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { TIERS, WIN_SPICE_HOLD } from '../../src/sim/defs/tiers';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { recomputeConnectivity } from '../../src/sim/roads';
import { createWorld, footprint, home, idx } from '../../src/sim/world';
import { forceGrass, placeService } from './helpers';
import { foundKontor2Literal, plantationSites, seaWorld, shipLiteral } from './seaHelpers';

export interface SpiceGoalOptions {
  houses?: number;
  withShip?: boolean;
  withFarm?: boolean;
  spiceInStock?: boolean;
  wonMerchants?: boolean;
  /** Rezept für den Browser-Stand: erreicht das Ziel ohne Nachfüllen (Nachweis in T14). */
  forBrowser?: boolean;
}

/** Bedarfsgüter der Kaufleute (Stufe 4) in fester Reihenfolge der Definition. */
export const MERCHANT_NEEDS = Object.keys(TIERS[4].needs) as GoodId[];

/** Einwohner je Kaufmannshaus im Szenario (Höchstbelegung der Stufe). */
const HOUSE_EW = TIERS[4].maxInhabitants;
/** Wie viele Haltezeiten das Lager im Browser-Rezept ausreichen muss: Haltezeit plus 100 Ticks, je 100 Ticks. */
const BROWSER_PERIODS = (WIN_SPICE_HOLD + 100) / 100;
/** Zahl der Rinderfarmen, Weber und Brenner für den Browser-Stand, wenn das Lager allein nicht reicht. */
const BROWSER_FOOD_FARMS = 6;
const BROWSER_CHAIN_SHOPS = 2;

/** Setzt ein Gebäude direkt auf die Heimat (ohne Platzierungsprüfung, angebunden). */
function literalBuilding(w: World, defId: BuildingDefId, x: number, y: number): Building {
  const id = w.nextBuildingId++;
  const b: Building = { id, defId, x, y, connected: true, progress: 0, state: 'ok', island: 0 };
  w.buildings[id] = b;
  for (const p of footprint(BUILDING_DEFS[defId], x, y)) {
    forceGrass(w, p.x, p.y);
    home(w).tiles[idx(home(w), p.x, p.y)]!.buildingId = id;
  }
  return b;
}

function addFarmOnTwo(w: World): void {
  const site = plantationSites(w, 2)[0]!;
  const isl = w.islands[2]!;
  const id = w.nextBuildingId++;
  w.buildings[id] = {
    id,
    defId: 'spicefarm',
    x: site.x,
    y: site.y,
    connected: false,
    progress: 0,
    state: 'ok',
    island: 2,
  };
  for (const p of footprint(BUILDING_DEFS.spicefarm, site.x, site.y))
    isl.tiles[idx(isl, p.x, p.y)]!.buildingId = id;
}

/** Heimat-Lager je Bedarfsgut: 100 oder (Browser-Rezept) 7 × Bedarf je 100 Ticks, höchstens 100. */
function stockFor(good: GoodId, ew: number, forBrowser: boolean): number {
  if (!forBrowser) return STORAGE_CAP;
  const per100 = TIERS[4].needs[good]! * ew;
  return Math.min(STORAGE_CAP, Math.ceil(BROWSER_PERIODS * per100));
}

/** Betriebe, die im Browser-Rezept den Rest über 100 decken: Rinderfarmen, Weberei und Brennerei (Vorrat Wolle, Zuckerrohr). */
function addBrowserProducers(w: World, kx: number, ky: number): void {
  const home0 = home(w);
  for (let i = 0; i < BROWSER_FOOD_FARMS; i++)
    literalBuilding(w, 'cattlefarm', kx + 12 + (i % 3) * 2, ky + (Math.floor(i / 3) + 4) * 2);
  for (let i = 0; i < BROWSER_CHAIN_SHOPS; i++) {
    literalBuilding(w, 'weaver', kx + 2 + i * 2, ky + 8);
    literalBuilding(w, 'distillery', kx + 2 + i * 2, ky + 10);
  }
  home0.stock.wool = STORAGE_CAP;
  home0.stock.cane = STORAGE_CAP;
}

/** Setzt eine Wegkachel direkt (Gras erzwungen); Anbindung folgt aus `recomputeConnectivity`. */
function roadTile(w: World, x: number, y: number): void {
  forceGrass(w, x, y);
  home(w).tiles[idx(home(w), x, y)]!.road = true;
}

/**
 * Echte Wege ab dem Kontor: Reihe über den Diensten, im Browser-Rezept zusätzlich eine Spange und zwei Reihen an den
 * Betrieben. Ohne sie verlöre das Szenario beim Laden die Anbindung (`deserialize` leitet `connected` aus Wegen ab).
 */
function layRoads(w: World, kx: number, ky: number, withProducers: boolean): void {
  for (let x = kx; x <= kx + 11; x++) roadTile(w, x, ky - 1);
  if (withProducers) {
    for (let y = ky; y <= ky + 12; y++) roadTile(w, kx + 11, y);
    for (let x = kx + 2; x <= kx + 17; x++) {
      roadTile(w, x, ky + 7);
      roadTile(w, x, ky + 12);
    }
  }
}

/**
 * Welt, in der das dritte Ziel kurz vor der Haltezeit steht: Kontor II samt Plantage auf Insel 2, ein Schiff mit
 * Gewürzroute 2 → 0, `houses` Kaufmannshäuser zu 20 Einwohnern in der Heimat mit allen Diensten und Lager 100
 * je Bedarfsgut. `satisfiedSince = tick`. Das Nachfüllen je 100 Ticks macht die Testschleife.
 */
export function spiceGoalScenario(opts: SpiceGoalOptions = {}): World {
  const { houses = 4, withShip = true, withFarm = true, spiceInStock = true } = opts;
  const w = seaWorld();
  foundKontor2Literal(w, 2);
  if (withFarm) addFarmOnTwo(w);
  if (withShip)
    shipLiteral(w, { route: { a: 0, b: 2, ab: [], ba: [{ good: 'spice', reserve: 10 }] } });
  const k = w.buildings[home(w).kontorId]!;
  const ids: Building[] = [];
  for (let i = 0; i < houses; i++) {
    forceGrass(w, k.x + 2, k.y + i);
    const r = placeBuilding(w, 'house', k.x + 2, k.y + i);
    if (!r.ok || r.id === undefined) throw new Error(`Haus ${i} nicht gesetzt`);
    ids.push(w.buildings[r.id]!);
  }
  (['chapel', 'school', 'bathhouse'] as const).forEach((defId, i) =>
    placeService(w, defId, k.x + 4 + i * 2, k.y),
  );
  w.tick = 449;
  w.money = 1_000_000;
  for (const b of ids) {
    const h = b.house!;
    h.tier = 4;
    h.inhabitants = HOUSE_EW;
    h.satisfied = Object.fromEntries(MERCHANT_NEEDS.map((g) => [g, true]));
    h.satisfiedSince = w.tick;
  }
  const forBrowser = opts.forBrowser === true;
  for (const g of MERCHANT_NEEDS) home(w).stock[g] = stockFor(g, HOUSE_EW * houses, forBrowser);
  if (!spiceInStock) home(w).stock.spice = 0;
  if (forBrowser) addBrowserProducers(w, k.x, k.y);
  layRoads(w, k.x, k.y, forBrowser);
  recomputeConnectivity(w);
  w.won = true;
  w.wonMerchants = opts.wonMerchants ?? true;
  return w;
}

/** Gewürz im Lager der Felsbucht beim Start der Routenprobe (AK-E4-13). */
const ROUTE_START_SPICE = 30;
/** Fremdinsel „Felsbucht“ (B). */
const FELSBUCHT = 2;

/**
 * Start der Routenprobe im Browser (AK-E4-13, Fixture `see-route-start-v9.json`): Seed 3, alles freigeschaltet,
 * `kontor2` auf der Felsbucht (per `placeBuilding`), ein freies Schiff im Heimathafen, Gewürz 30 im Lager der Felsbucht.
 */
export function seeRouteStart(): World {
  const w = createWorld(3, { unlockAll: true });
  w.money = 10_000;
  home(w).stock.wood = 100;
  home(w).stock.tools = 100;
  home(w).stock.stone = 100;
  const site = generateForeignIslands(w.seed, home(w))[FELSBUCHT - 1]!.kontorSite;
  const kontor = placeBuilding(w, 'kontor2', site.x, site.y, FELSBUCHT);
  if (!kontor.ok) throw new Error(`kontor2 nicht gesetzt: ${kontor.reason}`);
  const ship = buyShip(w);
  if (!ship.ok) throw new Error(`Schiff nicht gekauft: ${ship.reason}`);
  w.islands[FELSBUCHT]!.stock.spice = ROUTE_START_SPICE;
  return w;
}
