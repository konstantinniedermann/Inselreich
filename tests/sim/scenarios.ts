// Szenario-Saves für die Browser-Checks (Spec 14.1). Kein Produktcode: jedes Szenario baut eine Welt
// nur über Sim-Funktionen (`createWorld`, `placeBuilding`, `placeRoad`, `step`) und Test-Helfer.
// Alle Szenarien nutzen Seed 3 (Kontor an der Westküste) und legen ihr Gelände östlich des Kontors selbst an.
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { TIERS } from '../../src/sim/defs/tiers';
import { newHouseState } from '../../src/sim/population';
import { recomputeConnectivity } from '../../src/sim/roads';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, GoodId, ServiceId, Tier, World } from '../../src/sim/types';
import { createWorld, idx } from '../../src/sim/world';
import { forceGrass, forceRect } from './helpers';

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
    services: Object.fromEntries(
      (['faith', 'school'] as ServiceId[]).map((sv) => [sv, (s.services ?? []).includes(sv)]),
    ),
    satisfiedSince: w.tick,
    supplied: s.supplied,
  };
}

/** Seed-3-Welt mit Gras östlich des Kontors: x = kx+2 … kx+19, y = ky-9 … ky+9. Liefert die Kontor-Koordinaten. */
function baseWorld(): { w: World; kx: number; ky: number } {
  const w = createWorld(SEED);
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y - 9, 18, 19, 'grass');
  return { w, kx: k.x, ky: k.y };
}

const setTerrain = (w: World, x: number, y: number, t: 'water' | 'forest' | 'mountain'): void => {
  w.tiles[idx(w, x, y)]!.terrain = t;
};

/** Startgrundriss der Kleinszenarien: Hauptstrasse ab Kontor, Wasserspalte, Waldkachel. */
function smallColony(): { w: World; kx: number; ky: number } {
  const s = baseWorld();
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
  const w = createWorld(SEED);
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

export const SCENARIOS: Record<string, () => World> = {
  'bilanz-nahrung': bilanzNahrung,
  'lager-holz-99': lagerHolz99,
  bedarf,
  'autosave-lauf': autosaveLauf,
  auftrag,
  galerie,
  'leistung-50': leistung50,
  'tag-0': tag0,
  'tag-3000': tag3000,
};

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
