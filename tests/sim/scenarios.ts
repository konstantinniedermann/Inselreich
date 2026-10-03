// Szenario-Saves für die Browser-Checks (Spec 14.1). Kein Produktcode: jedes Szenario baut eine Welt
// nur über Sim-Funktionen (`createWorld`, `placeBuilding`, `placeRoad`, `step`) und Test-Helfer.
// Alle Szenarien nutzen Seed 3 (Kontor an der Westküste) und legen ihr Gelände östlich des Kontors selbst an.
import { writeFileSync } from 'node:fs';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { beginCrisis, flammableRect, rollCrisis } from '../../src/sim/crises';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { CRISIS_LEVELS } from '../../src/sim/defs/crises';
import {
  CRISIS_FIRST_TICK,
  GROWTH_INTERVAL,
  STORM_WARNING,
  UPGRADE_WAIT,
} from '../../src/sim/defs/timing';
import { TIERS } from '../../src/sim/defs/tiers';
import { maxHouseTier, orderForPeriod } from '../../src/sim/orders';
import { newHouseState, SERVICE_IDS } from '../../src/sim/population';
import { recomputeConnectivity } from '../../src/sim/roads';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type {
  Building,
  BuildingDefId,
  CrisisKind,
  CrisisLevel,
  GoodId,
  ServiceId,
  Tier,
  World,
} from '../../src/sim/types';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { createWorld, idx } from '../../src/sim/world';
import { prepareLayout, type Layout } from './controller';
import { forceGrass, forceRect } from './helpers';
import { verdeckung } from './scenarios-iso';

const SEED = 3;

/** Geld und Lager, mit denen gebaut wird; danach gilt wieder der vorherige Stand. */
function withFunds<T>(w: World, fn: () => T): T {
  const money = w.money;
  const stock = { ...w.stock };
  w.money = 1_000_000;
  for (const g of Object.keys(w.stock) as GoodId[]) w.stock[g] = 100;
  try {
    return fn();
  } finally {
    w.money = money;
    w.stock = stock;
  }
}

/** Spec 10: am Ende jedes Szenarios gilt, was die gebaute Welt rechtfertigt (`unlockAll` nur zum Bauen). */
export function finishUnlocks(w: World): void {
  w.unlocked = deriveUnlocks(w);
}

function road(w: World, x: number, y: number): void {
  forceGrass(w, x, y);
  const r = withFunds(w, () => placeRoad(w, x, y));
  if (!r.ok) throw new Error(`road ${x},${y}: ${r.reason}`);
}

/** Weg von (x0, y) bis (x1, y) (Zeile) bzw. von (x, y0) bis (x, y1) (Spalte). */
function roadRow(w: World, x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x++) road(w, x, y);
}
function roadCol(w: World, x: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) road(w, x, y);
}

/** Baut über `placeBuilding` (Geländeregeln gelten), Gelände muss vorher passen; Lager und Geld bleiben unverändert. */
function put(w: World, defId: BuildingDefId, x: number, y: number): Building {
  const r = withFunds(w, () => placeBuilding(w, defId, x, y));
  if (!r.ok || r.id === undefined) throw new Error(`${defId}@${x},${y}: ${r.ok ? '' : r.reason}`);
  return w.buildings[r.id]!;
}

/** Legt ein Wohnhaus direkt an (auch ausserhalb der Versorgung, die die Platzierung verweigern würde). */
function insertHouse(w: World, x: number, y: number): Building {
  forceGrass(w, x, y);
  const id = w.nextBuildingId++;
  const b: Building = {
    id,
    defId: 'house',
    x,
    y,
    connected: false,
    progress: 0,
    state: 'ok',
    house: newHouseState(w),
  };
  w.buildings[id] = b;
  w.tiles[idx(w, x, y)]!.buildingId = id;
  return b;
}

interface HouseSpec {
  tier: Tier;
  inhabitants: number;
  supplied: boolean;
  /** Erfüllte Bedarfsgüter der Stufe; nicht genannte gelten als unerfüllt. */
  metGoods?: GoodId[];
  services?: ServiceId[];
}

/** Setzt die Hausfelder direkt (statt Aufstieg per Simulation); `satisfiedSince` = aktueller Tick. */
function setHouse(w: World, b: Building, s: HouseSpec): void {
  const met = s.metGoods ?? [];
  const tier = TIERS[s.tier];
  const goods = Object.keys(tier.needs) as GoodId[];
  b.house = {
    tier: s.tier,
    inhabitants: s.inhabitants,
    demand: Object.fromEntries(goods.map((g) => [g, 0])),
    satisfied: Object.fromEntries(goods.map((g) => [g, met.includes(g)])),
    services: Object.fromEntries(SERVICE_IDS.map((sv) => [sv, (s.services ?? []).includes(sv)])),
    satisfiedSince: w.tick,
    supplied: s.supplied,
  };
}

/** Seed-3-Welt mit Gras östlich des Kontors: x = kx+2 … kx+19, y = ky-9 … ky+9. Liefert die Kontor-Koordinaten. */
function baseWorld(level: CrisisLevel = 'off'): { w: World; kx: number; ky: number } {
  const w = createWorld(SEED, { crisisLevel: level, unlockAll: true });
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y - 9, 18, 19, 'grass');
  return { w, kx: k.x, ky: k.y };
}

const setTerrain = (w: World, x: number, y: number, t: 'water' | 'forest' | 'mountain'): void => {
  w.tiles[idx(w, x, y)]!.terrain = t;
};

/** Startgrundriss der Kleinszenarien: Hauptstrasse ab Kontor, Wasserspalte, Waldkachel. */
function smallColony(level: CrisisLevel = 'off'): { w: World; kx: number; ky: number } {
  const s = baseWorld(level);
  roadRow(s.w, s.kx + 2, s.kx + 12, s.ky);
  return s;
}

function bilanzNahrung(): World {
  const { w, kx, ky } = smallColony();
  setTerrain(w, kx + 8, ky - 1, 'water');
  put(w, 'fisher', kx + 9, ky - 1); // Wasser westlich, Weg südlich
  for (const [x, y] of [
    [kx + 3, ky - 2],
    [kx + 4, ky - 2],
    [kx + 3, ky + 1],
    [kx + 4, ky + 1],
  ] as const) {
    setHouse(w, put(w, 'house', x, y), {
      tier: 1,
      inhabitants: 4,
      supplied: true,
      metGoods: ['food'],
    });
  }
  w.stock.food = 50;
  return w;
}

function lagerHolz99(): World {
  const { w, kx, ky } = smallColony();
  put(w, 'market', kx + 4, ky + 1); // 2×2, Weg nördlich
  w.stock.wood = 99;
  return w;
}

function bedarf(): World {
  const { w, kx, ky } = smallColony();
  put(w, 'chapel', kx + 6, ky - 2); // angebunden, Radius 10
  // unversorgt: Mitte weiter als 8 vom Kontor (Platzierung würde es verweigern)
  setHouse(w, insertHouse(w, kx + 12, ky - 8), { tier: 1, inhabitants: 2, supplied: false });
  // Siedlerhaus mit Kapelle in Reichweite, aber ohne Stoff im Lager
  setHouse(w, put(w, 'house', kx + 3, ky - 2), {
    tier: 2,
    inhabitants: 8,
    supplied: true,
    metGoods: ['food'],
    services: ['faith'],
  });
  // erfülltes Pionierhaus
  setHouse(w, put(w, 'house', kx + 3, ky + 1), {
    tier: 1,
    inhabitants: 4,
    supplied: true,
    metGoods: ['food'],
  });
  return w;
}

function autosaveLauf(): World {
  const { w, kx, ky } = smallColony();
  setTerrain(w, kx + 8, ky - 1, 'water');
  setTerrain(w, kx + 11, ky - 2, 'forest');
  put(w, 'fisher', kx + 9, ky - 1);
  put(w, 'lumberjack', kx + 11, ky - 1);
  put(w, 'house', kx + 3, ky - 2);
  put(w, 'house', kx + 4, ky - 2);
  put(w, 'house', kx + 3, ky + 1);
  while (w.tick < 100) step(w);
  return w;
}

function auftrag(): World {
  const w = createWorld(SEED, { unlockAll: true });
  w.tick = 595;
  w.stock.wood = 50;
  w.stock.food = 30;
  return w;
}

/** Kleine Kolonie für die Tag-Nacht-Prüfung: sichtbares Gras, Küste, Wald, Wege, Häuser. */
function tagWelt(): World {
  const { w, kx, ky } = smallColony();
  setTerrain(w, kx + 8, ky - 1, 'water');
  setTerrain(w, kx + 11, ky - 2, 'forest');
  put(w, 'fisher', kx + 9, ky - 1);
  put(w, 'lumberjack', kx + 11, ky - 1);
  put(w, 'house', kx + 3, ky - 2);
  put(w, 'house', kx + 4, ky - 2);
  put(w, 'house', kx + 3, ky + 1);
  return w;
}

function tag0(): World {
  return tagWelt();
}

/** Dieselbe Welt, über `step` auf genau Tick 3000 gebracht (Aufträge und Takte bleiben konsistent). */
function tag3000(): World {
  const w = tagWelt();
  while (w.tick < 3000) step(w);
  return w;
}

/** Ein Gebäude jedes Typs, alle angebunden; Sonderfälle nach Vorgabe des Controllers. */
function galerie(): World {
  const { w, kx, ky } = baseWorld();
  roadRow(w, kx + 2, kx + 18, ky); // gerader Weg, 17 Kacheln
  setTerrain(w, kx + 11, ky - 2, 'forest');
  setTerrain(w, kx + 12, ky - 2, 'water');
  setTerrain(w, kx + 7, ky + 2, 'mountain');
  setTerrain(w, kx + 12, ky + 5, 'forest');
  // Nordreihe: 2×2 an y = ky-2, 1×1 an y = ky-1
  put(w, 'chapel', kx + 3, ky - 2);
  put(w, 'school', kx + 5, ky - 2);
  put(w, 'market', kx + 7, ky - 2);
  put(w, 'weaver', kx + 9, ky - 2);
  put(w, 'lumberjack', kx + 11, ky - 1);
  put(w, 'fisher', kx + 12, ky - 1);
  put(w, 'sheepfarm', kx + 13, ky - 2);
  put(w, 'canefarm', kx + 15, ky - 2);
  put(w, 'distillery', kx + 17, ky - 2);
  // Südreihe: drei Hausstufen, Steinbruch am Berg
  const tiers: Tier[] = [1, 2, 3];
  tiers.forEach((tier, i) => {
    setHouse(w, put(w, 'house', kx + 3 + i, ky + 1), {
      tier,
      inhabitants: TIERS[tier].maxInhabitants,
      supplied: true,
      metGoods: Object.keys(TIERS[tier].needs) as GoodId[],
      services: TIERS[tier].services,
    });
  });
  put(w, 'quarry', kx + 7, ky + 1);
  put(w, 'toolmaker', kx + 9, ky + 1);
  put(w, 'firestation', kx + 13, ky + 1); // M6-S2: jeder Gebäudetyp (angebunden, Weg nördlich)
  put(w, 'bathhouse', kx + 11, ky + 1); // M8-S1: jeder Gebäudetyp (angebunden, Weg nördlich)
  put(w, 'glassworks', kx + 15, ky + 1); // M8-S2: jeder Gebäudetyp (angebunden, Weg nördlich)
  put(w, 'townhall', kx + 17, ky + 1); // M10-S2: jeder Gebäudetyp (angebunden, Weg nördlich)
  // Sonderfälle: Holzfäller ohne Weg (Wald ringsum, keine Wegkachel angrenzend), Weberei ohne Wolle
  put(w, 'lumberjack', kx + 12, ky + 4);
  const weaver = Object.values(w.buildings).find((b) => b.defId === 'weaver')!;
  w.stock.food = 100; // Lagerobergrenze; deckt den Verbrauch der drei Häuser weit über 1000 Ticks
  weaver.state = 'waitingInput'; // wie `tickProduction` es beim ersten Tick ohne Wolle setzen würde
  return w;
}

/** ≥ 50 Gebäude (ohne Wege), davon 30 Wohnhäuser in gemischten Stufen; für die Frame-Zeit bei Zoom 0.5. */
function leistung50(): World {
  const { w, kx, ky } = baseWorld();
  for (let y = ky - 8; y <= ky + 8; y++) forceGrass(w, kx + 20, y);
  for (let y = ky - 8; y <= ky + 8; y++) setTerrain(w, kx + 20, y, 'forest');
  roadRow(w, kx + 2, kx + 18, ky);
  roadCol(w, kx + 18, ky - 8, ky + 8);
  // 30 Häuser in 6 Reihen à 5 (im Versorgungsradius des Kontors), Stufen wechseln je Haus
  let i = 0;
  for (const y of [ky - 3, ky - 2, ky - 1, ky + 1, ky + 2, ky + 3]) {
    for (let x = kx + 2; x <= kx + 6; x++) {
      // Nur 2 Bürgerhäuser (30 Bürger < WIN_CITIZENS), sonst Stufe 1 und 2 im Wechsel: kein Sieg im ersten Tick
      const tier: Tier = i < 2 ? 3 : i % 2 === 0 ? 1 : 2;
      setHouse(w, put(w, 'house', x, y), {
        tier,
        inhabitants: TIERS[tier].maxInhabitants,
        supplied: true,
        metGoods: i % 2 === 0 ? (Object.keys(TIERS[tier].needs) as GoodId[]) : [],
        services: TIERS[tier].services,
      });
      i++;
    }
  }
  // 2×2-Betriebe beidseits der Hauptstrasse
  const kinds: BuildingDefId[] = [
    'market',
    'chapel',
    'school',
    'sheepfarm',
    'canefarm',
    'weaver',
    'distillery',
  ];
  let n = 0;
  for (const x of [8, 10, 12, 14, 16]) {
    put(w, kinds[n++ % kinds.length]!, kx + x, ky - 2);
    put(w, kinds[n++ % kinds.length]!, kx + x, ky + 1);
  }
  // 17 Holzfäller am Waldrand, Weg westlich
  for (let y = ky - 8; y <= ky + 8; y++) put(w, 'lumberjack', kx + 19, y);
  recomputeConnectivity(w);
  return w;
}

/** `T_k − 1` der ersten Periode (k = 0…199), deren Ziehung die Art `kind` liefert (Spec 17.1). */
export function tickBeforeFirst(w: World, kind: CrisisKind): number {
  const P = CRISIS_LEVELS[w.crisisLevel].period!;
  for (let k = 0; k < 200; k++)
    if (rollCrisis(w.seed, k, maxHouseTier(w), flammableRect(w)).kind === kind)
      return CRISIS_FIRST_TICK + P * k - 1;
  throw new Error(`keine Periode mit ${kind}`);
}

function kriseBrandWelt(guarded: boolean): World {
  const { w, kx, ky } = smallColony('normal'); // Weg kx+2 … kx+12
  put(w, 'distillery', kx + 3, ky + 1);
  if (guarded) put(w, 'firestation', kx + 6, ky + 1); // Mittenabstand 2.55
  w.stock.cane = 20;
  w.money = 1000;
  w.tick = tickBeforeFirst(w, 'fire'); // Seed 3: 2999
  return w;
}

function kriseSturm(): World {
  const { w, kx, ky } = smallColony('normal');
  setTerrain(w, kx + 8, ky - 1, 'water');
  setTerrain(w, kx + 11, ky - 2, 'forest');
  put(w, 'fisher', kx + 9, ky - 1);
  put(w, 'lumberjack', kx + 11, ky - 1);
  w.tick = tickBeforeFirst(w, 'storm'); // Seed 3: 2399
  return w;
}

function sturmAktiv(): World {
  const w = kriseSturm();
  const T = w.tick + 1;
  while (w.tick < T + 300) step(w);
  return w;
}

function sturmKlar(): World {
  const w = sturmAktiv();
  w.crisisLevel = 'off';
  w.crisis = null;
  return w;
}

function kriseBoom(): World {
  const { w } = baseWorld('normal');
  w.stock.wood = 50;
  w.stock.food = 50;
  w.tick = tickBeforeFirst(w, 'boom'); // Seed 3: 4199
  return w;
}

function kriseAus(): World {
  const w = tagWelt(); // Stufe off, Fischer, Holzfäller, drei Häuser
  w.tick = 2390;
  return w;
}

function feuerwache(): World {
  const { w, kx, ky } = baseWorld('normal');
  roadRow(w, kx + 2, kx + 18, ky);
  setTerrain(w, kx + 8, ky - 1, 'water');
  setTerrain(w, kx + 8, ky + 1, 'water');
  put(w, 'chapel', kx + 3, ky - 2);
  put(w, 'school', kx + 5, ky - 2);
  put(w, 'fisher', kx + 9, ky - 1);
  put(w, 'fisher', kx + 9, ky + 1);
  put(w, 'sheepfarm', kx + 15, ky + 1); // Mittenabstand zur Wache 11.5 > 8
  put(w, 'firestation', kx + 4, ky + 1); // Kapelle 2.55, Schule 2.9
  w.tick = 1000;
  return w;
}

function leistungSturm(): World {
  const w = leistung50();
  w.crisisLevel = 'normal';
  w.tick = CRISIS_FIRST_TICK;
  beginCrisis(w, 0, { kind: 'storm' });
  w.tick = CRISIS_FIRST_TICK + STORM_WARNING + 1;
  return w;
}

/** M7-UX: Kontor mit 3 Wegkacheln, Fischerhütte durch genau eine freie Kachel vom Weg getrennt (AK-UX-05, -23). */
function uxAnbindung(): World {
  const { w, kx, ky } = baseWorld();
  roadRow(w, kx + 2, kx + 4, ky); // Kontor ist 2×2 bei (kx, ky): (kx+2, ky) ist Wurzel
  setTerrain(w, kx + 7, ky, 'water');
  put(w, 'fisher', kx + 6, ky); // Wasser östlich, Lücke (kx+5, ky) westlich
  put(w, 'house', kx + 3, ky - 2);
  w.money = 1000;
  return w;
}

/** M7-UX: 4 Bürgerhäuser (4 × 15 ≥ WIN_CITIZENS), `won` noch falsch; der erste Tick setzt es (AK-UX-24). */
function uxSieg(): World {
  const { w, kx, ky } = baseWorld();
  for (let i = 0; i < 4; i++) {
    setHouse(w, put(w, 'house', kx + 3 + i, ky - 2), {
      tier: 3,
      inhabitants: TIERS[3].maxInhabitants,
      supplied: true,
      metGoods: Object.keys(TIERS[3].needs) as GoodId[],
      services: TIERS[3].services,
    });
  }
  return w;
}

/** M8: 1 vor dem Wachstumstakt (tick = 50 · n − 1, Spec 18.1). */
const PRE_GROWTH_TICK = GROWTH_INTERVAL * 20 - 1;

/**
 * Volles bzw. teilbelegtes Haus der Stufe `tier`, versorgt, alle Bedarfsgüter und Dienste der Stufe erfüllt,
 * seit UPGRADE_WAIT Ticks zufrieden (`satisfiedSince = tick − 300`, statt 300 Schritte zu simulieren).
 * `metGoods` überschreibt die erfüllten Güter (z. B. ohne Glas).
 */
function settledHouse(
  w: World,
  x: number,
  y: number,
  tier: Tier,
  inhabitants: number,
  metGoods: GoodId[] = Object.keys(TIERS[tier].needs) as GoodId[],
): Building {
  const b = put(w, 'house', x, y);
  setHouse(w, b, { tier, inhabitants, supplied: true, metGoods, services: TIERS[tier].services });
  b.house!.satisfiedSince = w.tick - UPGRADE_WAIT;
  return b;
}

/** Lager für Häuser der Stufen 3 und 4: Nahrung, Stoff und Rum reichen weit über 300 Ticks. */
function stockHouses(w: World): void {
  w.stock.food = 50;
  w.stock.cloth = 30;
  w.stock.rum = 30;
}

/** M8 AK-U1-04, AK-U1-09, AK-U2-03, -06: vor dem Sieg, 45 Bürger, Kapelle und Schule, kein Bad, Glas 0. */
function m8VorSieg(): World {
  const { w, kx, ky } = smallColony(); // Weg kx+2 … kx+12
  w.tick = 400;
  put(w, 'chapel', kx + 6, ky - 2);
  put(w, 'school', kx + 6, ky + 1);
  settledHouse(w, kx + 3, ky - 2, 3, TIERS[3].maxInhabitants);
  settledHouse(w, kx + 4, ky - 2, 3, TIERS[3].maxInhabitants);
  settledHouse(w, kx + 3, ky + 1, 3, TIERS[3].maxInhabitants);
  stockHouses(w);
  w.money = 3000;
  w.stock.wood = 60;
  w.stock.tools = 20;
  w.stock.stone = 30;
  w.stock.glass = 0;
  return w;
}

/** M8 AK-U1-05 (AK-S3-08-Lage): 49 Bürger, kein Badehaus (Änderung S11); 1 vor dem Takt. */
function m8KurzVorSieg(): World {
  const { w, kx, ky } = baseWorld();
  roadRow(w, kx + 2, kx + 18, ky);
  w.tick = PRE_GROWTH_TICK;
  put(w, 'chapel', kx + 6, ky - 2);
  put(w, 'school', kx + 6, ky + 1);
  settledHouse(w, kx + 3, ky - 2, 3, TIERS[3].maxInhabitants);
  settledHouse(w, kx + 4, ky - 2, 3, TIERS[3].maxInhabitants);
  settledHouse(w, kx + 8, ky - 1, 3, TIERS[3].maxInhabitants);
  settledHouse(w, kx + 3, ky + 1, 3, 4);
  stockHouses(w);
  w.money = 3000;
  w.stock.wood = 30;
  w.stock.tools = 20;
  w.stock.stone = 20;
  w.stock.glass = 5;
  return w;
}

/** Kapelle, Schule und Badehaus an der Hauptstrasse der Kleinkolonie; alle Häuser bei kx+3/4 im Radius. */
function servicesWithBath(w: World, kx: number, ky: number): void {
  put(w, 'chapel', kx + 6, ky - 2);
  put(w, 'school', kx + 6, ky + 1);
  put(w, 'bathhouse', kx + 9, ky - 2);
}

/** M8 AK-U1-06: won, 3 Kaufmannshäuser 20 / 20 / 19, alles reichlich, 1 vor dem Takt. */
function m8KurzVorHandelsstadt(): World {
  const { w, kx, ky } = smallColony();
  w.won = true;
  w.tick = PRE_GROWTH_TICK;
  servicesWithBath(w, kx, ky);
  settledHouse(w, kx + 3, ky - 2, 4, TIERS[4].maxInhabitants);
  settledHouse(w, kx + 4, ky - 2, 4, TIERS[4].maxInhabitants);
  settledHouse(w, kx + 3, ky + 1, 4, TIERS[4].maxInhabitants - 1);
  stockHouses(w);
  w.stock.glass = 20;
  w.money = 3000;
  return w;
}

/** M8 AK-U2-04: angebundene Glashütte, Stein 5, Holz 0, wartet (wie `tickProduction` es setzen würde). */
function m8GlashuetteWartet(): World {
  const { w, kx, ky } = smallColony();
  w.won = true; // Änderung S11: Glashütte erst nach der Freischaltung
  const works = put(w, 'glassworks', kx + 9, ky - 2);
  w.stock.stone = 5;
  w.stock.wood = 0;
  works.state = 'waitingInput';
  return w;
}

/** M8 AK-U2-05, -06, -10, AK-R1-02: won, 1 Kaufmannshaus 20 EW mit allen Diensten, Glas 0 und nicht erfüllt. */
function m8KaufleuteOhneGlas(): World {
  const { w, kx, ky } = smallColony();
  w.won = true;
  servicesWithBath(w, kx, ky);
  const goods = (Object.keys(TIERS[4].needs) as GoodId[]).filter((g) => g !== 'glass');
  settledHouse(w, kx + 3, ky - 2, 4, TIERS[4].maxInhabitants, goods);
  stockHouses(w);
  w.stock.glass = 0;
  w.money = 3000; // Änderung S11: für AK-U2-06/-10 (Badehaus bauen)
  w.stock.wood = 60;
  w.stock.tools = 20;
  w.stock.stone = 30;
  return w;
}

/** M8 AK-U2-07: Glas 10, Verkaufsanteil Glas 100 (Startwert). */
function m8Handel(): World {
  const w = createWorld(SEED, { unlockAll: true });
  w.stock.glass = 10;
  return w;
}

/** M10: Seed 3, Gelände und Wege wie der Controller (`prepareLayout`, alle `layout.roads`), noch keine Häuser. */
function m10Base(level: CrisisLevel = 'off'): { w: World; kx: number; ky: number; layout: Layout } {
  const w = createWorld(SEED, { crisisLevel: level, unlockAll: true });
  const layout = prepareLayout(w);
  for (const [x, y] of layout.roads) road(w, x, y);
  const k = w.buildings[w.kontorId]!;
  return { w, kx: k.x, ky: k.y, layout };
}

/** M10: ein Haus der Stufe `tier` auf Slot `slot` des Controller-Layouts, versorgt, Bedarf und Dienste erfüllt. */
function m10House(w: World, slot: Slot, tier: Tier, inhabitants: number): Building {
  return settledHouse(w, slot[0], slot[1], tier, inhabitants);
}

function m10Start(): World {
  return createWorld(SEED, { crisisLevel: 'normal' });
}

function m10PionierFastVoll(): World {
  const { w, layout } = m10Base('normal');
  w.tick = GROWTH_INTERVAL * 2 - 1;
  layout.houses.forEach((slot, i) => m10House(w, slot, 1, i === 0 ? 3 : 2));
  w.stock.food = 30;
  w.unlocked = ['U0'];
  return w;
}

function m10SiedlerFast(): World {
  const { w, layout } = m10Base();
  w.tick = GROWTH_INTERVAL * 31 - 1;
  put(w, 'chapel', layout.chapel[0], layout.chapel[1]);
  m10House(w, layout.houses[0]!, 1, TIERS[1].maxInhabitants);
  w.stock.cloth = 5;
  w.money = 2000;
  w.stock.wood = 20;
  w.stock.tools = 10;
  const o = orderForPeriod(SEED, 1, maxHouseTier(w));
  w.order = { period: 1, ...o, due: 2100 };
  w.unlocked = ['U0', 'U2'];
  return w;
}

function m10Wald(): World {
  const { w, kx, ky, layout } = m10Base();
  m10House(w, layout.houses[0]!, 1, TIERS[1].maxInhabitants);
  put(w, 'lumberjack', kx + 19, ky - 5);
  w.money = 500;
  w.unlocked = ['U0', 'U2'];
  return w;
}

/** Häuser auf den vier Hausplätzen, Kapelle, Schule und zwei Werkzeugmacher (mit/ohne Schule in Reichweite). */
function m10Amtsstube(townhallAt: [number, number], level: 'normal' | 'high'): World {
  const { w, kx, ky, layout } = m10Base();
  const tiers: Tier[] = [1, 2, 3, 3];
  layout.houses.forEach((slot, i) => m10House(w, slot, tiers[i]!, TIERS[tiers[i]!].maxInhabitants));
  put(w, 'chapel', layout.chapel[0], layout.chapel[1]);
  put(w, 'school', layout.school[0], layout.school[1]);
  put(w, 'toolmaker', kx + 11, ky + 1);
  put(w, 'toolmaker', kx + 17, ky + 6);
  put(w, 'townhall', kx + townhallAt[0], ky + townhallAt[1]);
  w.stock.cloth = 2;
  w.taxLevel = level === 'high' ? 'high' : w.taxLevel;
  return w;
}

function m10KriseBald(): World {
  const w = createWorld(SEED, { crisisLevel: 'normal' });
  w.tick = CRISIS_FIRST_TICK - 1;
  return w;
}

type Slot = readonly [number, number];
type Probes = Record<string, { x: number; y: number }>;

const M10_PROBES: Record<string, Record<string, [number, number]>> = {
  'm10-start': { kontor: [0, 0] },
  'm10-pionier-fast-voll': { kontor: [0, 0], haus3: [3, -2] },
  'm10-siedler-fast': { kontor: [0, 0], 'haus-voll': [3, -2], kapelle: [6, -2] },
  'm10-wald': { kontor: [0, 0], wald: [20, -7], weide: [12, -3], holzfaeller: [19, -5] },
  'm10-amtsstube': {
    kontor: [0, 0],
    amtsstube: [11, -7],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-amtsstube-aus': {
    kontor: [0, 0],
    amtsstube: [3, -6],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-krise-bald': { kontor: [0, 0] },
};

function relativeProbes(name: string, w: World): Probes {
  const k = w.buildings[w.kontorId]!;
  return Object.fromEntries(
    Object.entries(M10_PROBES[name]!).map(([p, [dx, dy]]) => [p, { x: k.x + dx, y: k.y + dy }]),
  );
}

/** `galerie`: je Gebäudetyp die Ursprungskachel des ersten gebauten Gebäudes (feste Id-Reihenfolge). */
function galerieProbes(w: World): Probes {
  const out: Probes = {};
  for (const id of BUILDING_IDS) {
    const b = Object.values(w.buildings).find((x) => x.defId === id);
    if (b !== undefined) out[id] = { x: b.x, y: b.y };
  }
  return out;
}

const RAW_SCENARIOS: Record<string, () => World> = {
  'bilanz-nahrung': bilanzNahrung,
  verdeckung,
  'lager-holz-99': lagerHolz99,
  bedarf,
  'autosave-lauf': autosaveLauf,
  auftrag,
  galerie,
  'leistung-50': leistung50,
  'tag-0': tag0,
  'tag-3000': tag3000,
  'krise-brand': () => kriseBrandWelt(false),
  'krise-brand-geschuetzt': () => kriseBrandWelt(true),
  'krise-sturm': kriseSturm,
  'sturm-aktiv': sturmAktiv,
  'sturm-klar': sturmKlar,
  'krise-boom': kriseBoom,
  'krise-aus': kriseAus,
  feuerwache,
  'leistung-sturm': leistungSturm,
  'ux-anbindung': uxAnbindung,
  'ux-sieg': uxSieg,
  'm8-vor-sieg': m8VorSieg,
  'm8-kurz-vor-sieg': m8KurzVorSieg,
  'm8-kurz-vor-handelsstadt': m8KurzVorHandelsstadt,
  'm8-glashuette-wartet': m8GlashuetteWartet,
  'm8-kaufleute-ohne-glas': m8KaufleuteOhneGlas,
  'm8-handel': m8Handel,
  'm10-start': m10Start,
  'm10-pionier-fast-voll': m10PionierFastVoll,
  'm10-siedler-fast': m10SiedlerFast,
  'm10-wald': m10Wald,
  'm10-amtsstube': () => m10Amtsstube([11, -7], 'normal'),
  'm10-amtsstube-aus': () => m10Amtsstube([3, -6], 'high'),
  'm10-krise-bald': m10KriseBald,
};

/**
 * Ohne Nachbearbeitung: `verdeckung` (Welt aus `scenarios-iso.ts`, dort nicht Teil von Task 2; ein Test vergleicht sie
 * mit dem Original) und `auftrag` (bleibt „Alles frei", damit der Auftrag lieferbar ist, Spec 4.4).
 */
const KEEP_UNLOCKS = new Set(['verdeckung', 'auftrag']);

export const SCENARIOS: Record<string, () => World> = Object.fromEntries(
  Object.entries(RAW_SCENARIOS).map(([name, build]) => [
    name,
    KEEP_UNLOCKS.has(name)
      ? build
      : (): World => {
          const w = build();
          finishUnlocks(w);
          return w;
        },
  ]),
);

/**
 * Schreibt je Szenario `<out>/<name>.json` über `write` und liefert die Anzahl. Ohne `out` passiert
 * nichts (0). Der Ordner muss vorher existieren; das Anlegen übernimmt der Aufrufer.
 */
export function writeScenarios(
  out: string | undefined,
  write: (path: string, data: string) => void,
): number {
  if (out === undefined || out === '') return 0;
  let n = 0;
  for (const [name, build] of Object.entries(SCENARIOS)) {
    write(`${out}/${name}.json`, serialize(build()));
    n++;
  }
  return n;
}

/** Prüfpunkte je Szenario aus Spec 18.1 (absolute Kacheln, Name → Kachel). */
export const PROBES: Record<string, (w: World) => Probes> = {
  ...Object.fromEntries(
    Object.keys(M10_PROBES).map((n) => [n, (w: World) => relativeProbes(n, w)]),
  ),
  galerie: galerieProbes,
};

/** Schreibt je Szenario aus `PROBES` die Datei `<out>/<name>.probes.json` und liefert die Anzahl (ohne `out`: 0). */
export function writeProbes(
  out: string | undefined,
  write: (path: string, data: string) => void = writeFileSync,
): number {
  if (out === undefined || out === '') return 0;
  let n = 0;
  for (const [name, probes] of Object.entries(PROBES)) {
    write(`${out}/${name}.probes.json`, JSON.stringify(probes(SCENARIOS[name]!())));
    n++;
  }
  return n;
}
