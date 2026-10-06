// Szenario für das dritte Ziel „Gewürzstadt“ (M12 T06, Anhang 05 J.5). Nur Tests, schreibt keine Saves.
import { placeBuilding } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { TIERS, WIN_SPICE_HOLD } from '../../src/sim/defs/tiers';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { footprint, home, idx } from '../../src/sim/world';
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
  const services = (['chapel', 'school', 'bathhouse'] as const).map((defId, i) =>
    placeService(w, defId, k.x + 4 + i * 2, k.y),
  );
  for (const s of services) s.connected = true; // Platzieren setzt die Anbindung zurück
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
  w.won = true;
  w.wonMerchants = opts.wonMerchants ?? true;
  return w;
}
