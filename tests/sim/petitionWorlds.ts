import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOODS } from '../../src/sim/defs/goods';
import { LEVELS } from '../../src/sim/defs/levels';
import { PETITIONS, type PetitionId } from '../../src/sim/defs/petitions';
import { TIERS } from '../../src/sim/defs/tiers';
import { goodsBalance } from '../../src/sim/flow';
import { answerPetition } from '../../src/sim/petitions';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type {
  Building,
  BuildingDefId,
  GoodId,
  PetitionMark,
  Tier,
  World,
} from '../../src/sim/types';
import { createWorld, home, HOME, idx } from '../../src/sim/world';
import { placeService, putBuilding, setHouse } from './helpers';

/** Seeds der Dominanzprüfung (T00-Ledger: Tickrate 27 849 T/s, Entscheid [3, 7]). */
export const PETITION_SEEDS: readonly number[] = [3, 7];

export type Lage = 'yes' | 'no';

export interface PetitionScene {
  w: World;
  mark: PetitionMark;
  note: string;
  /** Testzufuhr, in beiden Zweigen nach jedem step (Gewürz). */
  feed?: (w: World) => void;
  /** Tick der Antwort, Standard w.tick. */
  answerAt?: number;
}
export type SceneBuilder = (seed: number) => PetitionScene;

export interface DuelRun {
  ok: boolean;
  value: number;
  shortage: GoodId[];
  incident: boolean;
}

/** Waren, die Häuser verbrauchen und die eine Kette liefert. */
const FINAL_GOODS: readonly GoodId[] = ['food', 'cloth', 'rum', 'glass', 'spice'];
/** Wartezeit nach dem Ende der Wirkung, bis zu der ein Engpass als Folge der Bitte zählt. */
const AFTERMATH = 150;
/** Zusatz hinter dem Ende der Wirkung für das Messfenster. */
const WINDOW_TAIL = 300;
/** Zufuhr Gewürz alle so viele Ticks. */
const FEED_EVERY = 100;
/** Abstand des Fabrikfelds unter dem Kontor. */
const FIELD_DY = 8;
const FIELD_X0 = 2;
/** Startbestand der Vorprodukte (Wolle, Zuckerrohr, Stein, Holz), damit kein Anlaufstau entsteht. */
const INPUT_STOCK = 20;
const BIG_MONEY = 20_000;
/** Nächster Zug in unerreichbarer Ferne: die Lage hat genau die eine Marke. */
const NO_DRAW = 1_000_000_000;

interface Chain {
  makers: readonly BuildingDefId[];
  inputs: readonly { good: GoodId; maker: BuildingDefId }[];
}

const CHAINS: Partial<Record<GoodId, Chain>> = {
  food: { makers: ['cattlefarm', 'fisher'], inputs: [] },
  cloth: { makers: ['weaver'], inputs: [{ good: 'wool', maker: 'sheepfarm' }] },
  rum: { makers: ['distillery'], inputs: [{ good: 'cane', maker: 'canefarm' }] },
  glass: {
    makers: ['glassworks'],
    inputs: [
      { good: 'stone', maker: 'quarry' },
      { good: 'wood', maker: 'lumberjack' },
    ],
  },
};

const rateOf = (defId: BuildingDefId, level: 1 | 2 | 3): number =>
  100 / (level === 1 ? BUILDING_DEFS[defId].cycle! : LEVELS[defId]![level - 2]!.cycle);

interface Bundle {
  rate: number;
  parts: { defId: BuildingDefId; level: 1 | 2 | 3 }[];
}

/** Ein Betrieb der Ware auf Stufe `level` samt Zulieferern auf Stufe 1, so viele, dass sie ihn decken. */
function bundleOf(chain: Chain, maker: BuildingDefId, level: 1 | 2 | 3): Bundle {
  const rate = rateOf(maker, level);
  const parts: Bundle['parts'] = [{ defId: maker, level }];
  for (const input of chain.inputs) {
    const n = Math.ceil(rate / rateOf(input.maker, 1) - 1e-9);
    for (let i = 0; i < n; i++) parts.push({ defId: input.maker, level: 1 });
  }
  return { rate, parts };
}

function bundlesOf(chain: Chain): Bundle[] {
  const out: Bundle[] = [];
  for (const maker of chain.makers)
    for (const l of [1, 2, 3] as const) out.push(bundleOf(chain, maker, l));
  return out.sort((a, b) => b.rate - a.rate);
}

/** Auflösung der Rechnung: alle Raten der Betriebe sind Vielfache von 1/60 je 100 Ticks. */
const RES = 60;

/**
 * Wählt Bündel so, dass die Summe der Raten dem Ziel am nächsten kommt (bei Gleichstand weniger
 * Bündel, dann die kleinere Summe). Rundlauf über ganze Einheiten 1/60, fest und ohne Zufall.
 */
export function pickBundles(chain: Chain, target: number): Bundle[] {
  const all = bundlesOf(chain);
  const units = all.map((b) => Math.round(b.rate * RES));
  const goal = Math.round(target * RES);
  const top = goal + Math.max(...units);
  const count: number[] = Array<number>(top + 1).fill(Infinity);
  const via: number[] = Array<number>(top + 1).fill(-1);
  count[0] = 0;
  for (let t = 1; t <= top; t++)
    all.forEach((_, i) => {
      const prev = t - units[i]!;
      if (prev >= 0 && count[prev]! + 1 < count[t]!) {
        count[t] = count[prev]! + 1;
        via[t] = i;
      }
    });
  let best = 0;
  for (let t = 0; t <= top; t++) {
    if (count[t] === Infinity) continue;
    const better =
      Math.abs(t - goal) < Math.abs(best - goal) ||
      (Math.abs(t - goal) === Math.abs(best - goal) && count[t]! < count[best]!);
    if (better) best = t;
  }
  const picked: Bundle[] = [];
  for (let t = best; t > 0; t -= units[via[t]!]!) picked.push(all[via[t]!]!);
  return picked;
}

/** Erste freie Stelle im Fabrikfeld unter dem Kontor, mit einer Kachel Abstand; fest und ohne Zufall. */
function freeSpot(w: World, wd: number, ht: number): { x: number; y: number } {
  const isl = home(w);
  const k = w.buildings[isl.kontorId]!;
  for (let y = k.y + FIELD_DY; y + ht < isl.height - 1; y++) {
    for (let x = FIELD_X0; x + wd < isl.width - 1; x++) {
      let free = true;
      for (let yy = y - 1; yy <= y + ht && free; yy++)
        for (let xx = x - 1; xx <= x + wd && free; xx++) {
          const t = isl.tiles[idx(isl, xx, yy)]!;
          if (t.buildingId !== null || t.terrain === 'forest') free = false;
        }
      if (free) return { x, y };
    }
  }
  throw new Error('Fabrikfeld voll');
}

function placeProducer(w: World, defId: BuildingDefId, level: 1 | 2 | 3): Building {
  const d = BUILDING_DEFS[defId];
  const wide = defId === 'lumberjack' ? d.w + 1 : d.w; // rechts daneben eine Waldkachel (Standortregel)
  const { x, y } = freeSpot(w, wide, d.h);
  const b = putBuilding(w, HOME, defId, x, y);
  if (defId === 'lumberjack') home(w).tiles[idx(home(w), x + 1, y)]!.terrain = 'forest';
  if (level > 1) b.level = level as 2 | 3;
  return b;
}

/** Bedarf der versorgten Häuser je Ware und 100 Ticks. */
const demandOf = (w: World, g: GoodId): number => goodsBalance(w, HOME)[g].consumed;

/**
 * Betriebe je Kette auf (1 + ü) × Bedarf, nur auf HOME. Liest den Bedarf aus goodsBalance, also stehen
 * die Häuser vorher. Gewürz hat keine Kette (Testzufuhr): die Zufuhrrate je 100 Ticks kommt zurück.
 */
export function chainsAt(
  w: World,
  homeOver: Partial<Record<GoodId, number>>,
): Partial<Record<GoodId, number>> {
  const fed: Partial<Record<GoodId, number>> = {};
  for (const g of FINAL_GOODS) {
    const over = homeOver[g];
    if (over === undefined) continue;
    const target = demandOf(w, g) * (1 + over);
    const chain = CHAINS[g];
    if (chain === undefined) {
      fed[g] = target;
      continue;
    }
    for (const bundle of pickBundles(chain, target))
      for (const p of bundle.parts) placeProducer(w, p.defId, p.level);
  }
  return fed;
}

/** Tatsächliches ü je Ware: Erzeugung gegen Bedarf der Häuser; `fed` ergänzt die Zufuhr (Gewürz). */
export function measuredOver(
  w: World,
  fed: Partial<Record<GoodId, number>> = {},
): Partial<Record<GoodId, number>> {
  const bal = goodsBalance(w, HOME);
  const out: Partial<Record<GoodId, number>> = {};
  for (const g of FINAL_GOODS) {
    if (bal[g].consumed === 0) continue;
    out[g] = (bal[g].produced + (fed[g] ?? 0)) / bal[g].consumed - 1;
  }
  return out;
}

interface HouseSpec {
  tier: Tier;
  inhabitants: readonly number[];
  over: Partial<Record<GoodId, number>>;
  stock: Partial<Record<GoodId, number>>;
}

/** Stückzahl der Bitte beim Ziehen: gleiche Klemmung wie im Spiel, aus den Kosten der Bitte gelesen. */
function amountFor(w: World, id: PetitionId): number {
  const c = PETITIONS[id].cost.find((x) => 'div' in x);
  if (c === undefined || !('div' in c)) return 0;
  let e = 0;
  for (const b of Object.values(w.buildings))
    if (b.house !== undefined && b.house.tier >= 2) e += b.house.inhabitants;
  return Math.min(c.max, Math.max(c.min, Math.ceil(e / c.div)));
}

function feedOf(rates: Partial<Record<GoodId, number>>): ((w: World) => void) | undefined {
  const goods = Object.keys(rates) as GoodId[];
  if (goods.length === 0) return undefined;
  // zustandslos: bis Tick t sind floor(rate × t / 100) Einheiten geliefert, der Zuwachs kommt alle 100 Ticks
  const total = (rate: number, t: number): number => Math.floor((rate * t) / FEED_EVERY);
  return (w) => {
    if (w.tick % FEED_EVERY !== 0) return;
    for (const g of goods)
      home(w).stock[g] += total(rates[g]!, w.tick) - total(rates[g]!, w.tick - FEED_EVERY);
  };
}

/** Häuser und Dienste so setzen, dass alle Häuser versorgt und erfüllt starten. */
function buildTown(w: World, spec: HouseSpec): void {
  const k = w.buildings[home(w).kontorId]!;
  placeService(w, 'chapel', k.x + 2, k.y);
  placeService(w, 'school', k.x + 4, k.y);
  placeService(w, 'bathhouse', k.x + 6, k.y);
  spec.inhabitants.forEach((n, i) => {
    const b = putBuilding(w, HOME, 'house', k.x + 2 + (i % 5), k.y - 2 + Math.floor(i / 5));
    setHouse(b, spec.tier, n);
  });
}

/** Erfüllt-Zustand, damit kein Haus im ersten Wachstumstakt schrumpft. */
function settleHouses(w: World): void {
  for (const b of Object.values(w.buildings)) {
    b.connected = true; // ein späteres placeService leitet die Anbindung neu ab und löscht das Flag
    const h = b.house;
    if (h === undefined) continue;
    h.supplied = true;
    h.satisfiedSince = w.tick;
    for (const g of Object.keys(TIERS[h.tier].needs) as GoodId[]) {
      h.demand[g] = 0;
      h.satisfied[g] = true;
    }
    for (const s of TIERS[h.tier].services) h.services[s] = true;
  }
}

function sceneOf(seed: number, id: PetitionId, spec: HouseSpec, note: string): PetitionScene {
  const w = createWorld(seed, { unlockAll: true, crisisLevel: 'off', petitionsOn: true });
  w.money = BIG_MONEY;
  if (spec.tier === 4) {
    w.won = true; // Stufe 4 ist nur nach dem Ziel ladbar; die Bitten sollen aber nur die Marke der Lage ziehen
    w.petitions.next = NO_DRAW;
  }
  buildTown(w, spec);
  const fed = chainsAt(w, spec.over);
  const stock = home(w).stock;
  for (const g of Object.keys(stock) as GoodId[]) stock[g] = 0;
  for (const g of ['wool', 'cane', 'stone', 'wood'] as const) stock[g] = INPUT_STOCK;
  for (const g of Object.keys(spec.stock) as GoodId[]) stock[g] = spec.stock[g]!;
  settleHouses(w);
  const mark: PetitionMark = { id, drawnAt: w.tick, amount: amountFor(w, id) };
  w.petitions.open.push(mark);
  const over = measuredOver(w, fed);
  const overNote = (Object.keys(over) as GoodId[])
    .map((g) => `${g} ${over[g]!.toFixed(2)}`)
    .join(', ');
  const scene: PetitionScene = { w, mark, note: `${note}; ü ${overNote}` };
  const feed = feedOf(fed);
  if (feed !== undefined) {
    scene.feed = feed;
    scene.note += '; Gewürz per Testzufuhr (je 100 Ticks, Bedarf × (1 + ü))';
  }
  return scene;
}

export function snapshot(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  // Laden leitet `connected` aus Wegen ab; die Lagen setzen Gebäude ohne Wege direkt (putBuilding), also übernehmen wir das Flag
  for (const b of Object.values(r.world.buildings)) b.connected = w.buildings[b.id]!.connected;
  return r.world;
}

const worth = (w: World): number => {
  let v = w.money;
  for (const g of Object.keys(GOODS) as GoodId[]) v += home(w).stock[g] * GOODS[g].sell;
  return v;
};

function consumedGoods(w: World): GoodId[] {
  const set = new Set<GoodId>();
  for (const b of Object.values(w.buildings))
    if (b.house !== undefined)
      for (const g of Object.keys(TIERS[b.house.tier].needs) as GoodId[]) set.add(g);
  return [...set].sort();
}

const burning = (w: World): boolean =>
  w.crisis !== null ||
  Object.values(w.buildings).some((b) => b.state === 'burning' || b.outageUntil !== undefined);

function run(scene: PetitionScene, base: World, answer: Lage): DuelRun {
  const w = snapshot(base);
  const def = PETITIONS[scene.mark.id];
  const answerAt = scene.answerAt ?? w.tick;
  let incident = false;
  while (w.tick < answerAt) {
    const rep = step(w);
    scene.feed?.(w);
    if (rep.lost.length > 0 || burning(w)) incident = true;
  }
  const goods = consumedGoods(w);
  const before = worth(w);
  const res = answerPetition(w, scene.mark.drawnAt, answer);
  const shortage = new Set<GoodId>();
  const nach = answerAt + def.delay + def.duration + AFTERMATH;
  const end = answerAt + def.delay + def.duration + WINDOW_TAIL;
  while (w.tick < end) {
    const rep = step(w);
    scene.feed?.(w);
    if (rep.lost.length > 0 || burning(w)) incident = true;
    if (w.tick <= nach) for (const g of goods) if (home(w).stock[g] === 0) shortage.add(g);
  }
  return { ok: res.ok, value: worth(w) - before, shortage: [...shortage].sort(), incident };
}

/** Zwei Läufe aus demselben serialize; Fenster [Antwort, Antwort + delay + duration + 300]. */
export function duel(scene: PetitionScene): { yes: DuelRun; no: DuelRun } {
  const base = snapshot(scene.w);
  return { yes: run(scene, base, 'yes'), no: run(scene, base, 'no') };
}

// ---- Lagen (Anhang 01, Zeilen B1 bis B3) ----

const FIVE = { food: 0.2, cloth: 0.2, rum: 0.2, glass: 0.2, spice: 0.2 } as const;
const ALL_60 = { food: 60, cloth: 60, rum: 60, glass: 60, spice: 60 } as const;
/**
 * P1: vier Bürgerhäuser (Stufe 3) auf Höchstbelegung (60 Bewohner): Häuser wachsen sonst in 150 Ticks
 * dorthin, und ü = 0 gälte nicht mehr. Die Bitte kostet dann 12 Waren (⌈60 / 5⌉).
 */
const P1_HOUSES = [15, 15, 15, 15] as const;

const buildersFor = (
  id: PetitionId,
  yes: HouseSpec,
  yesNote: string,
  no: HouseSpec,
  noNote: string,
): Record<Lage, SceneBuilder> => ({
  yes: (seed) => sceneOf(seed, id, yes, yesNote),
  no: (seed) => sceneOf(seed, id, no, noNote),
});

export const SCENES: Partial<Record<PetitionId, Record<Lage, SceneBuilder>>> = {
  weavers: buildersFor(
    'weavers',
    { tier: 4, inhabitants: [20, 20, 20, 20, 20, 20], over: FIVE, stock: ALL_60 },
    'B1 Ja: 6 Kaufmannshäuser, ü 20 % in fünf Ketten, Lager je 60',
    {
      tier: 3,
      inhabitants: P1_HOUSES,
      over: { food: 0, cloth: 0, rum: 0 },
      stock: { cloth: 31, rum: 5, food: 38 },
    },
    'B1 Nein: P1, 4 Bürgerhäuser, ü 0, Stoff 31, Rum 5, Nahrung 38',
  ),
  tavern: buildersFor(
    'tavern',
    {
      tier: 3,
      inhabitants: P1_HOUSES,
      over: { rum: 0.2, food: 0.2, cloth: 0.2 },
      stock: { rum: 40, food: 60, cloth: 60 },
    },
    'B2 Ja: 4 Bürgerhäuser, Rum, Nahrung, Stoff ü 20 %, Rum 40',
    {
      tier: 3,
      inhabitants: P1_HOUSES,
      over: { food: 0, cloth: 0, rum: -0.4 },
      stock: { cloth: 31, rum: 12, food: 38 },
    },
    'B2 Nein: P1 mit Rum 12 (= Kosten der Bitte), Rum-Erzeugung gegen Bedarf im Verhältnis 0,6 (Anhang: 6 gegen 10)',
  ),
  glaziers: buildersFor(
    'glaziers',
    { tier: 4, inhabitants: [20, 20, 20], over: FIVE, stock: { ...ALL_60, glass: 40 } },
    'B3 Ja: 3 Kaufmannshäuser, alle Ketten ü 20 %, Glas 40',
    {
      tier: 4,
      inhabitants: [20, 20, 20],
      over: { food: 0, cloth: 0, rum: 0, glass: 0, spice: 0 },
      stock: { ...ALL_60, glass: 26 },
    },
    'B3 Nein: P3a, alle Ketten ü 0, Glas 26 (Erzeugung 6 gegen Bedarf 6), übrige Lager 60, Gewürz ü 0',
  ),
};
