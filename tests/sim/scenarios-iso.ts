// Szenario `verdeckung` (M7-ISO §14, §16): Prüfstellen für Verdeckung, Signale und Schatten. Kein Produktcode.
// Die Helfer `withFunds`, `road`, `roadRow`, `roadCol`, `insertHouse`, `setHouse` und `baseWorld` sind aus
// `scenarios.ts` bewusst kopiert (Plan R96): `scenarios.ts` importiert diese Datei, ein Rückimport wäre ein Zyklus.
import { placeRoad } from '../../src/sim/build';
import { TIERS } from '../../src/sim/defs/tiers';
import { newHouseState } from '../../src/sim/population';
import { recomputeConnectivity } from '../../src/sim/roads';
import type { Building, GoodId, ServiceId, Tier, World } from '../../src/sim/types';
import { createWorld, idx } from '../../src/sim/world';
import { forceGrass, forceRect } from './helpers';

const SEED = 3;

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
function roadRow(w: World, x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x++) road(w, x, y);
}
function roadCol(w: World, x: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) road(w, x, y);
}

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
  metGoods?: GoodId[];
  services?: ServiceId[];
}

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

function baseWorld(): { w: World; kx: number; ky: number } {
  const w = createWorld(SEED);
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y - 9, 18, 19, 'grass');
  return { w, kx: k.x, ky: k.y };
}

/** Holzfäller ohne Platzierungsregeln (Wald in der Nähe ist für die Darstellung unerheblich). */
function insertLumberjack(w: World, x: number, y: number): Building {
  const id = w.nextBuildingId++;
  const b: Building = { id, defId: 'lumberjack', x, y, connected: false, progress: 0, state: 'ok' };
  w.buildings[id] = b;
  w.tiles[idx(w, x, y)]!.buildingId = id;
  return b;
}

interface Pos {
  x: number;
  y: number;
}
/** Lagen relativ zum Kontor von Seed 3 (Prüfstellen für QA-SLICE und `tests/render/verdeckung.test.ts`). */
function layout(kx: number, ky: number) {
  const L1 = { x: kx + 10, y: ky + 5 };
  return {
    F: { x: kx + 5, y: ky - 3 }, // Wohnhaus Stufe 3, vorn
    H: { x: kx + 5, y: ky - 4 }, // Wohnhaus Stufe 1 dahinter (Bedarfssymbol)
    P: { x: kx + 4, y: ky - 3 }, // Holzfäller ohne Weg (roter Punkt) dahinter
    L1, // Holzfäller mit Weg, Bäume davor und dahinter
    L2: { x: kx + 16, y: ky + 7 }, // Holzfäller frei stehend
    tVor: [
      { x: L1.x + 1, y: L1.y },
      { x: L1.x + 2, y: L1.y },
    ] as Pos[],
    tHinter: [
      { x: L1.x - 1, y: L1.y - 1 },
      { x: L1.x, y: L1.y - 1 },
      { x: L1.x - 1, y: L1.y },
    ] as Pos[],
  };
}

/** Lagen mit absoluten Kachelkoordinaten (Seed 3 legt den Kontor fest). */
export const VERDECKUNG = (() => {
  const k = createWorld(SEED);
  const b = k.buildings[k.kontorId]!;
  return layout(b.x, b.y);
})();

export function verdeckung(): World {
  const { w, kx, ky } = baseWorld();
  const L = layout(kx, ky);
  roadRow(w, kx + 2, kx + 18, ky);
  roadCol(w, kx + 14, ky + 1, ky + 6);
  roadRow(w, kx + 10, kx + 18, ky + 6);
  const everything = Object.keys(TIERS[3].needs) as GoodId[];
  setHouse(w, insertHouse(w, L.F.x, L.F.y), {
    tier: 3,
    inhabitants: 12,
    supplied: true,
    metGoods: everything,
    services: ['faith', 'school'],
  });
  setHouse(w, insertHouse(w, L.H.x, L.H.y), { tier: 1, inhabitants: 3, supplied: true });
  insertLumberjack(w, L.P.x, L.P.y);
  insertLumberjack(w, L.L1.x, L.L1.y);
  insertLumberjack(w, L.L2.x, L.L2.y);
  for (const t of [...L.tVor, ...L.tHinter]) forceRect(w, t.x, t.y, 1, 1, 'forest');
  recomputeConnectivity(w);
  return w;
}
