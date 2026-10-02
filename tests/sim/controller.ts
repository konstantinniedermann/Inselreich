// Balancing-Controller (ausgelagert aus balance.test.ts, M6-B1). Kein Test: wird von balance.test.ts und balance-crises.test.ts genutzt.
import { expect } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { TIERS, WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { canPlace } from '../../src/sim/placement';
import { citizens, populationByTier, serviceAvailable } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import { buy, buyPrice, sell } from '../../src/sim/trade';
import type { Building, BuildingDefId, Cost, GoodId, Tier, World } from '../../src/sim/types';
import { buildingsOfType } from '../../src/sim/world';
import { forceRect } from './helpers';

/** Obergrenze der Spielzeit, in der 50 Bürger erreicht sein müssen (Kurz-Spec Balancing). */
export const MAX_TICKS = 9000;
/** Strengere Grenze für den Sieg nach Übernahme der Eskalationswerte (Entscheid in der Kurz-Spec). */
export const WIN_TICK_LIMIT = 7500;
/** Der Controller entscheidet alle 100 Ticks, was gebaut oder gekauft wird. */
export const CONTROL_INTERVAL = 100;
/** Geld, das nach jedem Bau oder Kauf übrig bleiben muss (deckt einen Aufstieg zum Bürger). */
const RESERVE = 300;
/** Holzfäller senken den Holzzukauf; zwei reichen für den gestaffelten Ausbau. */
const LUMBERJACKS = 2;
/**
 * Überschuss: ab 50 Einheiten im Lager wird auf 30 verkauft. Die Zahl der Betriebe wird nach oben
 * gerundet; ohne Verkauf liefe der Mehrausstoss ins Lagerlimit und verfiele.
 */
const SURPLUS_AT = 50;
const SURPLUS_KEEP = 30;
const SURPLUS_GOODS = ['wood', 'food', 'cloth', 'rum'] as const;

type Slot = readonly [number, number];

/** Feste Bauplätze rund um das Kontor; Wege liegen schon, bevor die Plätze belegt werden. */
export interface Layout {
  roads: Slot[];
  houses: Slot[];
  lumberjacks: Slot[];
  fishers: Slot[];
  /** 2×2-Plätze an Wegen für Rohstoffbetriebe und Verarbeiter. */
  farms: Slot[];
  chapel: Slot;
  school: Slot;
  /**
   * Platz der Feuerwache im Krisen-Lauf `normal` (Spec 15, Ruling R99). Feste geometrische Regel, nicht am
   * Sieg-Tick gesucht: Kandidat ist jede Kachel, die im Endlayout frei bleibt (Gras, in keinem Slot) und an
   * einen Layout-Weg grenzt (angebunden). Gewählt wird der Kandidat, dessen Mitte die meisten Mitten der
   * brennbaren Produktions-Slots (Holzfäller, Fischer, Farmen und Verarbeiter; 41 Slots) im Abstand
   * <= serviceRadius (8) deckt. Es bleiben vier Kandidaten (kx+10/ky±8 mit je 16 Slots, kx+2/ky±1 mit je 6).
   * Bleibt ein Gleichstand (hier kx+10/ky-8 und kx+10/ky+8: gleiche Abdeckung, gleicher Abstand zum Schwerpunkt
   * der Slots), entscheidet die Bau-Reihenfolge (R101): Der Bot bebaut den Norden zuerst, dort steht deshalb die
   * Produktion, die zu Beginn brennen kann. Mit dem Spiegelplatz [kx+10, ky+8] läge der Sieg im Lauf normal
   * vermutlich über 8000 (R101; nicht gemessen). Nicht gedeckt sind
   * die Fischer-Slots an der Küste (kx+9) ausserhalb von 8 Kacheln, die weit östlichen Farmen und die
   * Holzfäller am Waldrand (kx+19).
   */
  fireStation: Slot;
}

type Need = 'food' | 'cloth' | 'rum';
/** Bedarfsgut → Betrieb, der es herstellt, und dessen Rohstoffbetrieb (null bei Nahrung). */
const CHAINS: Record<Need, { producer: BuildingDefId; raw: BuildingDefId | null }> = {
  food: { producer: 'fisher', raw: null },
  cloth: { producer: 'weaver', raw: 'sheepfarm' },
  rum: { producer: 'distillery', raw: 'canefarm' },
};
const NO_COST: Cost = { money: 0, wood: 0, tools: 0, stone: 0 };

/**
 * Erzwingt das Gelände östlich des Kontors (Seed 3: Kontor an der Westküste): Gras für Häuser und
 * Betriebe, eine Wasserspalte für die Fischer, ein Waldstreifen für Holzfäller.
 */
function forceTerrain(w: World): void {
  const k = w.buildings[w.kontorId]!;
  const kx = k.x;
  const ky = k.y;
  forceRect(w, kx + 2, ky - 9, 18, 19, 'grass');
  forceRect(w, kx + 8, ky - 8, 1, 8, 'water'); // Wasserspalte nördlich der Hauptstrasse
  forceRect(w, kx + 8, ky + 1, 1, 8, 'water'); // Wasserspalte südlich der Hauptstrasse
  forceRect(w, kx + 20, ky - 7, 1, 15, 'forest');
}

/** Alle Bauplätze und Wege aus der Kontor-Lage; ändert die Welt nicht (auch nach dem Laden nutzbar). */
export function layoutFor(w: World): Layout {
  const k = w.buildings[w.kontorId]!;
  const kx = k.x;
  const ky = k.y;
  const roads: Slot[] = [];
  for (let x = kx + 2; x <= kx + 18; x++) roads.push([x, ky]); // Hauptstrasse ab dem Kontor
  for (let y = ky - 7; y <= ky + 7; y++) if (y !== ky) roads.push([kx + 10, y]); // Querstrasse
  for (let x = kx + 11; x <= kx + 18; x++) roads.push([x, ky - 5], [x, ky + 5]); // Nebenstrassen

  const fishers: Slot[] = [];
  for (let y = ky - 7; y <= ky + 7; y++) if (y !== ky) fishers.push([kx + 9, y]);
  const farms: Slot[] = [];
  for (const dy of [-7, -4, -2, 1, 3, 6])
    for (const dx of [11, 13, 15, 17]) farms.push([kx + dx, ky + dy]);

  return {
    roads,
    houses: [
      [kx + 3, ky - 2],
      [kx + 4, ky - 2],
      [kx + 3, ky + 1],
      [kx + 4, ky + 1],
    ],
    lumberjacks: [
      [kx + 19, ky - 5],
      [kx + 19, ky],
      [kx + 19, ky + 5],
    ],
    fishers,
    farms,
    chapel: [kx + 6, ky - 2],
    school: [kx + 6, ky + 1],
    fireStation: [kx + 10, ky - 8],
  };
}

/** Gelände erzwingen, dann das Layout bestimmen. */
export function prepareLayout(w: World): Layout {
  forceTerrain(w);
  return layoutFor(w);
}

const count = (w: World, defId: BuildingDefId): number => buildingsOfType(w, defId).length;
const houses = (w: World): Building[] => buildingsOfType(w, 'house');

/** Stufe, auf die ein Haus als Nächstes zusteuert: ein voll belegtes Haus steigt bald auf. */
function planTier(b: Building): Tier {
  const h = b.house!;
  const full = h.inhabitants === TIERS[h.tier].maxInhabitants;
  return h.tier < 3 && full ? ((h.tier + 1) as Tier) : h.tier;
}

/**
 * Benötigte Verarbeiter für ein Gut: Verbrauch aller Häuser bei Vollbelegung ihrer Stufe ÷ Ausstoss
 * je 100 Ticks. Steuert ein Haus auf eine Stufe mit diesem Bedarf zu, steht mindestens einer bereit,
 * damit beim Aufstieg schon Ware im Lager liegt.
 */
function producersNeeded(w: World, good: Need): number {
  let demand = 0;
  let upcoming = false;
  for (const b of houses(w)) {
    const tier = TIERS[b.house!.tier];
    demand += tier.maxInhabitants * (tier.needs[good] ?? 0);
    if (TIERS[planTier(b)].needs[good] !== undefined) upcoming = true;
  }
  const output = 100 / BUILDING_DEFS[CHAINS[good].producer].cycle!;
  return Math.max(Math.ceil(demand / output), upcoming ? 1 : 0);
}

/**
 * Kosten des nächsten Aufstiegs, der nur noch an Geld oder Material hängt (Haus voll, Dienste und
 * neue Bedarfsgüter vorhanden). Immer nur ein Haus auf einmal, damit die Reserve den Ausbau der
 * Ketten nicht blockiert. Die Reserve bleibt beim Bauen unangetastet.
 */
function upgradeReserve(w: World): Cost {
  for (const b of houses(w)) {
    const tier = b.house!.tier;
    const next = planTier(b);
    const cost = TIERS[tier].upgradeCost;
    if (!cost || next === tier) continue;
    if (!TIERS[next].services.every((s) => serviceAvailable(w, b, s))) continue;
    const newNeeds = Object.keys(TIERS[next].needs).filter((g) => !(g in TIERS[tier].needs));
    if (newNeeds.every((g) => w.stock[g as GoodId] >= 1)) return cost;
  }
  return NO_COST;
}

/**
 * Kauft fehlendes Holz, Werkzeug und Stein für `cost` plus die Aufstiegs-Reserve. Nur wenn danach
 * noch Geld für `cost`, die Reserve und `keep` bleibt; sonst false und nichts gekauft.
 */
function buyMissing(w: World, cost: Cost, keep = RESERVE): boolean {
  const reserve = upgradeReserve(w);
  const goods = ['wood', 'tools', 'stone'] as const;
  const missing = goods.map((g) => [g, Math.max(0, cost[g] + reserve[g] - w.stock[g])] as const);
  const price = missing.reduce((sum, [g, n]) => sum + buyPrice(g, n), 0);
  if (w.money - price - cost.money - reserve.money < keep) return false;
  for (const [g, n] of missing) if (n > 0) expect(buy(w, g, n).ok).toBe(true);
  return true;
}

/** Preis einschliesslich aller Waren zum Kaufpreis (Lagerbestand unberücksichtigt). */
function fullPrice(cost: Cost): number {
  return (
    cost.money +
    buyPrice('wood', cost.wood) +
    buyPrice('tools', cost.tools) +
    buyPrice('stone', cost.stone)
  );
}

/** Verkauft Fertigwaren und Holz ab `SURPLUS_AT` zurück auf `SURPLUS_KEEP`. */
function sellSurplus(w: World): void {
  for (const g of SURPLUS_GOODS)
    if (w.stock[g] >= SURPLUS_AT) expect(sell(w, g, w.stock[g] - SURPLUS_KEEP).ok).toBe(true);
}

/** Baut `defId` auf dem ersten passenden freien Platz; false, wenn das Geld (noch) nicht reicht. */
function build(w: World, defId: BuildingDefId, slots: readonly Slot[]): boolean {
  const slot = slots.find(([x, y]) => canPlace(w, defId, x, y).ok);
  if (!slot) throw new Error(`kein freier Platz für ${defId}`);
  if (!buyMissing(w, BUILDING_DEFS[defId].cost)) return false;
  const r = placeBuilding(w, defId, slot[0], slot[1]);
  expect(r.ok, `${defId} at ${slot[0]},${slot[1]}`).toBe(true);
  return true;
}

/** Baut eine Kette (Rohstoffbetrieb + Verarbeiter) paarweise aus, bis der Bedarf gedeckt ist. */
function buildChain(w: World, good: Need, layout: Layout): boolean {
  const { producer, raw } = CHAINS[good];
  const producerSlots = producer === 'fisher' ? layout.fishers : layout.farms;
  while (count(w, producer) < producersNeeded(w, good)) {
    if (raw && count(w, raw) <= count(w, producer) && !build(w, raw, layout.farms)) return false;
    if (!build(w, producer, producerSlots)) return false;
  }
  return true;
}

/**
 * Ein Controller-Durchlauf in fester Priorität. Scheitert ein Schritt am Geld, endet der Durchlauf:
 * spätere Stufen warten, bis die frühere bezahlt ist.
 */
export function control(w: World, layout: Layout, opts: ColonyOptions): void {
  const anyPlan = (tier: Tier): boolean => houses(w).some((b) => planTier(b) >= tier);
  // 1. Überschuss verkaufen, Material für den nächsten Aufstieg vorhalten (auch ohne `RESERVE`)
  sellSurplus(w);
  if (!buyMissing(w, NO_COST, 0)) return;
  // 2. Holzfäller: günstiges Holz für den ganzen Ausbau
  while (count(w, 'lumberjack') < LUMBERJACKS)
    if (!build(w, 'lumberjack', layout.lumberjacks)) return;
  // 3. Nahrung für alle Häuser bei Vollbelegung
  if (!buildChain(w, 'food', layout)) return;
  // 4. Siedler: Kapelle, dann Stoffkette
  if (anyPlan(2) && count(w, 'chapel') === 0 && !build(w, 'chapel', [layout.chapel])) return;
  if (
    opts.fireStation === true &&
    count(w, 'chapel') > 0 &&
    count(w, 'firestation') === 0 &&
    !build(w, 'firestation', [layout.fireStation])
  )
    return;
  if (!buildChain(w, 'cloth', layout)) return;
  // 5. Bürger: Schule erst, wenn auch das erste Rum-Paar bezahlbar ist (sonst Unterhalt ohne Nutzen)
  if (anyPlan(3) && count(w, 'school') === 0) {
    const start: BuildingDefId[] = ['school', 'canefarm', 'distillery'];
    const budget = start.reduce((sum, id) => sum + fullPrice(BUILDING_DEFS[id].cost), 0);
    if (w.money < budget + RESERVE) return;
    if (!build(w, 'school', [layout.school])) return;
  }
  buildChain(w, 'rum', layout);
}

export interface ColonyOptions {
  /** Krisen-Lauf normal: eine Feuerwache, sobald die Kapelle steht, auf layout.fireStation (Spec 15). */
  fireStation?: boolean;
}

export interface Trajectory {
  firstSettler: number | null;
  firstCitizen: number | null;
  winTick: number | null;
  minMoney: number;
  endMoney: number;
  buildings: Partial<Record<BuildingDefId, number>>;
}

/**
 * Skriptgesteuerte Kolonie auf Seed 3 mit echten Aktionen (Weg bauen, Gebäude bauen, kaufen,
 * verkaufen, Simulationsschritte); nur das Gelände wird erzwungen. Startphase: alle Wege und
 * 4 Wohnhäuser im Kontor-Radius. Danach baut der Controller alle 100 Ticks nach Bedarf Holzfäller,
 * Fischer, Kapelle, Stoffkette, Schule und Rumkette aus und kauft Holz, Werkzeug und Stein zu.
 * Läuft bis 50 Bürger oder `MAX_TICKS`.
 * Laufdaten ausgeben: `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance.test.ts`
 * (Vite reicht nur `VITE_*`-Variablen an `import.meta.env` weiter).
 */
export function startColony(w: World): { layout: Layout; t: Trajectory } {
  const layout = prepareLayout(w);
  for (const [x, y] of layout.roads) expect(placeRoad(w, x, y).ok).toBe(true);
  for (const slot of layout.houses) expect(build(w, 'house', [slot])).toBe(true);

  const t: Trajectory = {
    firstSettler: null,
    firstCitizen: null,
    winTick: null,
    minMoney: w.money,
    endMoney: 0,
    buildings: {},
  };
  return { layout, t };
}

/** Controller-Schleife bis Sieg oder MAX_TICKS; hält nach dem ersten Schritt mit stop(w) === true (Rückgabe true). */
export function runColony(
  w: World,
  layout: Layout,
  t: Trajectory,
  opts: ColonyOptions = {},
  stop?: (w: World) => boolean,
): boolean {
  while (w.tick < MAX_TICKS && citizens(w) < WIN_CITIZENS) {
    if (w.tick % CONTROL_INTERVAL === 0) control(w, layout, opts);
    step(w);
    const pop = populationByTier(w);
    if (t.firstSettler === null && pop[2] > 0) t.firstSettler = w.tick;
    if (t.firstCitizen === null && pop[3] > 0) t.firstCitizen = w.tick;
    if (t.winTick === null && w.won) t.winTick = w.tick;
    t.minMoney = Math.min(t.minMoney, w.money);
    if (stop?.(w)) return true;
  }
  t.endMoney = w.money;
  t.buildings = {};
  for (const b of Object.values(w.buildings))
    t.buildings[b.defId] = (t.buildings[b.defId] ?? 0) + 1;
  return false;
}

/** startColony + runColony. */
export function buildColony(w: World, opts: ColonyOptions = {}): Trajectory {
  const { layout, t } = startColony(w);
  runColony(w, layout, t, opts);
  return t;
}
