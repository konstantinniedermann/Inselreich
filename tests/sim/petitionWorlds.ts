import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOODS } from '../../src/sim/defs/goods';
import { LEVELS, WORKFORCE_RADIUS } from '../../src/sim/defs/levels';
import { PETITIONS, type PetitionId } from '../../src/sim/defs/petitions';
import { SHIP } from '../../src/sim/defs/sea';
import { STORM_DURATION } from '../../src/sim/defs/timing';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { TIERS } from '../../src/sim/defs/tiers';
import { goodsBalance } from '../../src/sim/flow';
import { inSupplyRange } from '../../src/sim/supply';
import { workforceAt } from '../../src/sim/levelRules';
import { holdFeast } from '../../src/sim/feast';
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
  /** Tick, ab dem ein Sturm wirkt (B9): der Lauf setzt `world.crisis` selbst, in beiden Zweigen gleich. */
  stormAt?: number;
  /** Zähler der Lage am Ende des Laufs (B6: zusätzliche Ladungen, die in der Heimat ankamen). */
  probe?: (w: World) => number;
  /** Weitere benannte Zähler der Lage am Ende des Laufs (B4, B5). */
  extras?: Record<string, (w: World) => number>;
}
export type SceneBuilder = (seed: number) => PetitionScene;

export interface DuelRun {
  ok: boolean;
  value: number;
  shortage: GoodId[];
  incident: boolean;
  /** Zusatzmass: Wert (Geld plus Lager) im letzten Tick der Wirkung, vor dem Verfall über der Lagergrenze. */
  valueAtEffectEnd: number;
  /** Wert von `scene.probe` am Ende des Laufs. */
  probe?: number;
  /** Werte von `scene.extras` am Ende des Laufs. */
  extras?: Record<string, number>;
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

/** Abstand um ein ausgebautes Rinderfarm-Gehöft, der frei bleibt (Standortregel: freies Gras im Umkreis). */
const GRAZING = 2;
/** Fachkräfte-Häuser einer Lage stehen höchstens so weit von ihrem Betrieb (Arbeitsweg minus Spielraum). */
const CREW_REACH = WORKFORCE_RADIUS - 0.1;
const REACH_TILES = Math.ceil(CREW_REACH);

/** Liegt das Rechteck im Weideraum eines ausgebauten Rinderfarm-Gehöfts? */
function inGrazing(w: World, x: number, y: number, wd: number, ht: number): boolean {
  for (const o of Object.values(w.buildings)) {
    if (o.defId !== 'cattlefarm' || o.level === undefined) continue;
    const d = BUILDING_DEFS[o.defId];
    const apart =
      x + wd <= o.x - GRAZING ||
      x >= o.x + d.w + GRAZING ||
      y + ht <= o.y - GRAZING ||
      y >= o.y + d.h + GRAZING;
    if (!apart) return true;
  }
  return false;
}

/** Häuser, die einem Betrieb der Stufe `level` Fachkräfte stellen. */
const crewHouses = (w: World, defId: BuildingDefId, level: 1 | 2 | 3): Building[] => {
  const tier = LEVELS[defId]![level - 2]!.workforceTier;
  return Object.values(w.buildings).filter((b) => b.house !== undefined && b.house.tier >= tier);
};

/**
 * Erste freie Stelle, mit `margin` Kacheln Abstand; fest und ohne Zufall. Ohne `crew` im Fabrikfeld unter dem
 * Kontor, mit `crew` auf der ganzen Insel, aber im Arbeitsweg eines der Häuser.
 */
function freeSpot(
  w: World,
  wd: number,
  ht: number,
  margin = 1,
  crew: Building[] = [],
): { x: number; y: number } | undefined {
  const isl = home(w);
  const k = w.buildings[isl.kontorId]!;
  const y0 = crew.length > 0 ? margin : k.y + FIELD_DY;
  for (let y = y0; y + ht + margin < isl.height; y++) {
    for (let x = Math.max(FIELD_X0, margin); x + wd + margin < isl.width; x++) {
      if (inGrazing(w, x, y, wd, ht)) continue;
      if (
        crew.length > 0 &&
        !crew.some(
          (h) => Math.hypot(x + wd / 2 - (h.x + 0.5), y + ht / 2 - (h.y + 0.5)) <= CREW_REACH,
        )
      )
        continue;
      let free = true;
      for (let yy = y - margin; yy < y + ht + margin && free; yy++)
        for (let xx = x - margin; xx < x + wd + margin && free; xx++) {
          const t = isl.tiles[idx(isl, xx, yy)]!;
          if (t.buildingId !== null || t.terrain === 'forest') free = false;
        }
      if (free) return { x, y };
    }
  }
  return undefined;
}

/** Gras im Weideraum, damit die Standortregel nur an Abstand und Bebauung hängt, nicht am Zufallsgelände. */
function carveGrazing(w: World, b: Building): void {
  const isl = home(w);
  const d = BUILDING_DEFS[b.defId];
  for (let y = b.y - GRAZING; y < b.y + d.h + GRAZING; y++)
    for (let x = b.x - GRAZING; x < b.x + d.w + GRAZING; x++) {
      const t = isl.tiles[idx(isl, x, y)]!;
      if (t.buildingId === null) t.terrain = 'grass';
    }
}

function placeProducer(w: World, defId: BuildingDefId, level: 1 | 2 | 3): Building {
  const d = BUILDING_DEFS[defId];
  const wide = defId === 'lumberjack' ? d.w + 1 : d.w; // rechts daneben eine Waldkachel (Standortregel)
  const grazing = defId === 'cattlefarm' && level > 1;
  const margin = grazing ? GRAZING : 1;
  // Ausgebaut: wo ein Haus passender Stufe im Arbeitsweg steht, sonst im Fabrikfeld (dann ergänzt `ensureCrew`)
  const near = level > 1 ? freeSpot(w, wide, d.h, margin, crewHouses(w, defId, level)) : undefined;
  const { x, y } = near ?? freeSpot(w, wide, d.h, margin)!;
  const b = putBuilding(w, HOME, defId, x, y);
  if (defId === 'lumberjack') home(w).tiles[idx(home(w), x + 1, y)]!.terrain = 'forest';
  if (level > 1) b.level = level as 2 | 3;
  if (grazing) carveGrazing(w, b);
  return b;
}

/** Nächste freie Kachel für ein Haus im Arbeitsweg von `b`; Reihenfolge fest nach Abstand, y, x. */
function crewSpot(w: World, b: Building): { x: number; y: number } {
  const isl = home(w);
  const found: { x: number; y: number; d: number }[] = [];
  for (let y = b.y - REACH_TILES; y <= b.y + REACH_TILES; y++)
    for (let x = b.x - REACH_TILES; x <= b.x + REACH_TILES; x++) {
      if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) continue;
      const t = isl.tiles[idx(isl, x, y)]!;
      if (t.buildingId !== null || t.road || t.terrain === 'forest') continue;
      if (inGrazing(w, x, y, 1, 1) || inSupplyRange(w, HOME, x + 0.5, y + 0.5)) continue;
      const c = BUILDING_DEFS[b.defId];
      const d = Math.hypot(x + 0.5 - (b.x + c.w / 2), y + 0.5 - (b.y + c.h / 2));
      if (d <= CREW_REACH) found.push({ x, y, d });
    }
  found.sort((a, z) => a.d - z.d || a.y - z.y || a.x - z.x);
  const spot = found[0];
  if (spot === undefined) throw new Error('Kein Platz für ein Fachkräfte-Haus');
  return spot;
}

/**
 * Jeder ausgebaute Betrieb hält seine Stufe nur mit einem Haus passender Stufe im Arbeitsweg (AUSBAU-LOGIK).
 * Fehlt eines, kommt ein Haus daneben, ausserhalb der Versorgung: es bleibt bei einem Bewohner ohne Verbrauch
 * und ändert Bedarf und Wachstum der Lage nicht.
 */
function ensureCrew(w: World, tier: Tier): void {
  for (const b of Object.values(w.buildings)) {
    if (b.level === undefined || workforceAt(w, b, b.level).ok) continue;
    const { x, y } = crewSpot(w, b);
    setHouse(putBuilding(w, HOME, 'house', x, y), tier, 0);
  }
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
  /** Zusätzliche Betriebe der Lage, nach den Ketten gesetzt (B7). */
  setup?: (w: World) => void;
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
  if (spec.tier === 4) w.won = true; // Stufe 4 ist nur nach dem Ziel ladbar
  w.petitions.next = NO_DRAW; // in jeder Lage: die Bitten ziehen nichts ausser der Marke der Lage
  buildTown(w, spec);
  const fed = chainsAt(w, spec.over);
  spec.setup?.(w);
  ensureCrew(w, spec.tier);
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

/** `allowStorm`: der vom Test gesetzte Sturm zählt nicht als Zwischenfall (B9). */
const burning = (w: World, allowStorm: boolean): boolean =>
  (w.crisis !== null && !(allowStorm && w.crisis.kind === 'storm')) ||
  Object.values(w.buildings).some((b) => b.state === 'burning' || b.outageUntil !== undefined);

/** Setzt den Sturm der Lage einen Tick vor seiner Wirkung, mit der Dauer aus `timing.ts`. */
function setStorm(scene: PetitionScene, w: World): void {
  if (scene.stormAt === undefined || w.tick !== scene.stormAt - 1) return;
  w.crisis = {
    period: 0,
    kind: 'storm',
    from: scene.stormAt,
    until: scene.stormAt + STORM_DURATION - 1,
  };
}

function run(scene: PetitionScene, base: World, answer: Lage): DuelRun {
  const w = snapshot(base);
  const def = PETITIONS[scene.mark.id];
  const answerAt = scene.answerAt ?? w.tick;
  let incident = false;
  const allowStorm = scene.stormAt !== undefined;
  while (w.tick < answerAt) {
    const rep = step(w);
    scene.feed?.(w);
    setStorm(scene, w);
    if (rep.lost.length > 0 || burning(w, allowStorm)) incident = true;
  }
  const goods = new Set<GoodId>(consumedGoods(w));
  const before = worth(w);
  const res = answerPetition(w, scene.mark.drawnAt, answer);
  const shortage = new Set<GoodId>();
  const nach = answerAt + def.delay + def.duration + AFTERMATH;
  const end = answerAt + def.delay + def.duration + WINDOW_TAIL;
  let valueAtEffectEnd = 0;
  while (w.tick < end) {
    const rep = step(w);
    scene.feed?.(w);
    setStorm(scene, w);
    if (rep.lost.length > 0 || burning(w, allowStorm)) incident = true;
    for (const g of consumedGoods(w)) goods.add(g); // Aufstiege bringen neue Bedarfswaren
    if (w.tick <= nach) for (const g of goods) if (home(w).stock[g] === 0) shortage.add(g);
    if (w.tick === answerAt + def.delay + def.duration - 1) valueAtEffectEnd = worth(w) - before;
  }
  const out: DuelRun = {
    ok: res.ok,
    value: worth(w) - before,
    shortage: [...shortage].sort(),
    incident,
    valueAtEffectEnd,
  };
  if (scene.probe !== undefined) out.probe = scene.probe(w);
  if (scene.extras !== undefined)
    out.extras = Object.fromEntries(Object.entries(scene.extras).map(([k, f]) => [k, f(w)]));
  return out;
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

// ---- Lagen B6 bis B9 (Anhang 01; Ersatzmass Anhang 02, B-5) ----

/** Gewürzbedarf der Heimat je 100 Ticks aus goodsBalance. */
const spiceDemand = (w: World): number => demandOf(w, 'spice');

/**
 * B6, Testzufuhr statt Route: alle `L` Ticks kommt die Ladung `load` Gewürz in die Heimat (L = Umlauf, so dass
 * Ladung je Umlauf dem Bedarf entspricht). Wirkt die Saat (Ja, aktiv), wächst die Plantage um (100 / pct − 1);
 * der Zusatz fährt mit, soweit Schiffsraum frei ist und das Fremdlager ihn hält. Voller Schiffsraum: kein Zusatz,
 * er bleibt im Fremdlager (100, verfällt). Gemessen wird nur, was in der Heimat ankommt.
 */
function spiceFeedOf(
  w: World,
  load: number,
  foreign: number,
): { feed: (w: World) => void; probe: (w: World) => number; every: number; extra: number } {
  const every = Math.ceil((load / spiceDemand(w)) * 100);
  const r = PETITIONS.spiceSeed.reward;
  const pct = r.kind === 'cycle' ? r.pct : 100;
  const extra = Math.max(
    0,
    Math.min(SHIP.capacity - load, foreign - load, Math.floor((load * (100 - pct)) / pct)),
  );
  const arrived = new WeakMap<World, number>();
  const feed = (x: World): void => {
    if (x.tick === 0 || x.tick % every !== 0) return;
    const active = x.petitions.effects.some(
      (e) => e.id === 'spiceSeed' && e.answer === 'yes' && e.until > x.tick,
    );
    const add = load + (active ? extra : 0);
    if (active && extra > 0) arrived.set(x, (arrived.get(x) ?? 0) + 1);
    const stock = home(x).stock;
    stock.spice = Math.min(STORAGE_CAP, stock.spice + add);
  };
  return { feed, probe: (x) => arrived.get(x) ?? 0, every, extra };
}

/** B6 Ja: Fremdlager 20, die Ladung 15 ist kleiner, der Zusatz kommt an. */
const B6_FOREIGN_YES = 20;
const B6_LOAD_YES = 15;
const B6_OVER = { food: 0.2, cloth: 0.2, rum: 0.2, glass: 0.2 } as const;
const B6_STOCK = { food: 60, cloth: 60, rum: 60, glass: 60 } as const;

function b6Scene(seed: number, yes: boolean): PetitionScene {
  const spec: HouseSpec = {
    tier: 4,
    inhabitants: [20, 20, 20],
    over: B6_OVER,
    stock: { ...B6_STOCK, spice: yes ? 40 : 12 },
  };
  const scene = sceneOf(seed, 'spiceSeed', spec, yes ? 'B6 Ja' : 'B6 Nein');
  const load = yes ? B6_LOAD_YES : SHIP.capacity;
  const f = spiceFeedOf(scene.w, load, yes ? B6_FOREIGN_YES : STORAGE_CAP);
  scene.feed = f.feed;
  scene.probe = f.probe;
  scene.note =
    `B6 ${yes ? 'Ja' : 'Nein'}: Testzufuhr Gewürz, Heimat ${spec.stock.spice}, Fremdlager ` +
    `${yes ? B6_FOREIGN_YES : STORAGE_CAP}, Ladung ${load} alle ${f.every} Ticks, Zusatz je Ladung ${f.extra}` +
    `; ü ${yes ? 'Zufuhr = Bedarf, Zusatz frei' : 'Zufuhr = Bedarf, Schiff voll'}`;
  return scene;
}

/** B7: drei Webereien auf HOME; Wolle-Erzeugung = `farms` Schafweiden, Bedarf der Webereien 6 je 100 Ticks. */
const placeWeavery = (farms: number) => (w: World) => {
  for (let i = 0; i < 3; i++) placeProducer(w, 'weaver', 1);
  for (let i = 0; i < farms; i++) placeProducer(w, 'sheepfarm', 1);
};

/** B9: Bürgerhäuser auf Höchstbelegung; so viele, dass ein halbierter Takt im Sturm den Bestand angreift. */
const B9_HOUSE_COUNT = 11;
const B9_HOUSES = Array<number>(B9_HOUSE_COUNT).fill(15);
const B9_OVER = 0.1;
/** Sturm hinter der Genügsamkeitsfrist (R999): Antwort + 2400. */
const B9_STORM_AFTER = 2400;

/** Bewohner aller Häuser. */
const people = (w: World): number =>
  Object.values(w.buildings).reduce((n, b) => n + (b.house?.inhabitants ?? 0), 0);

/** B8: Höchststand der Bewohner im Lauf (nach dem Ende der Wirkung schrumpfen die Häuser wieder). */
function withPeakPeople(b: Record<Lage, SceneBuilder>): Record<Lage, SceneBuilder> {
  const peaked =
    (build: SceneBuilder): SceneBuilder =>
    (seed) => {
      const scene = build(seed);
      const peak = new WeakMap<World, number>();
      const before = scene.feed;
      scene.feed = (w) => {
        before?.(w);
        peak.set(w, Math.max(peak.get(w) ?? 0, people(w)));
      };
      scene.probe = (w) => peak.get(w) ?? 0;
      return scene;
    };
  return { yes: peaked(b.yes), no: peaked(b.no) };
}

const weaveryScene = (seed: number, yes: boolean): PetitionScene => {
  const spec: HouseSpec = {
    tier: 3,
    inhabitants: [15, 15],
    over: { food: 0.2, rum: 0.2 },
    stock: yes
      ? { wool: 80, cloth: 40, food: 60, rum: 60 }
      : { wool: 20, cloth: 30, food: 60, rum: 60 },
    setup: placeWeavery(yes ? 4 : 3),
  };
  const scene = sceneOf(seed, 'woolMarket', spec, yes ? 'B7 Ja' : 'B7 Nein');
  scene.note += yes
    ? '; 3 Webereien, 4 Schafweiden (Wolle ü 33 %), Stoff ü 0'
    : '; 3 Webereien, 3 Schafweiden (Wolle = Bedarf), Wolle 20 = Kosten';
  return scene;
};

const granaryScene = (seed: number, yes: boolean): PetitionScene => {
  const level = yes ? 100 : 90;
  const scene = sceneOf(
    seed,
    'granary',
    {
      tier: 3,
      inhabitants: B9_HOUSES,
      over: yes ? { food: B9_OVER, cloth: B9_OVER, rum: B9_OVER } : { food: 0, cloth: 0, rum: 0 },
      stock: { cloth: level, rum: level, food: level },
    },
    yes ? 'B9 Ja: Sturm gesetzt' : 'B9 Nein: Krisen aus',
  );
  if (yes) scene.stormAt = scene.w.tick + B9_STORM_AFTER;
  return scene;
};

export const SCENES_B6_B9: Partial<Record<PetitionId, Record<Lage, SceneBuilder>>> = {
  spiceSeed: { yes: (seed) => b6Scene(seed, true), no: (seed) => b6Scene(seed, false) },
  woolMarket: { yes: (seed) => weaveryScene(seed, true), no: (seed) => weaveryScene(seed, false) },
  returnees: withPeakPeople(
    buildersFor(
      'returnees',
      {
        tier: 3,
        inhabitants: P1_HOUSES,
        over: { food: 0.15, cloth: 0.15, rum: 0.15 },
        stock: { cloth: 60, rum: 60, food: 60 },
      },
      'B8 Ja: 4 Bürgerhäuser, Nahrung, Stoff, Rum ü 15 %',
      {
        tier: 3,
        inhabitants: P1_HOUSES,
        over: { food: 0, cloth: 0, rum: 0 },
        stock: { cloth: 31, rum: 5, food: 38 },
      },
      'B8 Nein: P1, ü 0, Nahrung 38',
    ),
  ),
  granary: { yes: (seed) => granaryScene(seed, true), no: (seed) => granaryScene(seed, false) },
};

Object.assign(SCENES, SCENES_B6_B9);

// ---- Stabile Stadt (Anhang 03, AK-BS-05) ----

/** Ziel-ü der Ketten; die Betriebe liefern ganze Raten, das tatsächliche ü liest `measuredOver`. */
const STABLE_OVER = 0.1;
const STABLE_HOUSES = [20, 20, 20, 20, 20, 20] as const;

export interface StableTown {
  w: World;
  /** Tatsächliches ü je Ware (Betriebe plus Testzufuhr Gewürz). */
  over: Partial<Record<GoodId, number>>;
  /** Testzufuhr Gewürz; in jedem Zweig nach jedem step aufrufen. */
  feed: ((w: World) => void) | undefined;
}

/**
 * Anhang 03 §1: 6 Kaufmannshäuser (Stufe 4, 20 Bewohner) mit allen Diensten, Lager 100 je Ware, Krisen aus,
 * Steuer «normal», alle Ketten auf etwa 110 % (Gewürz per Testzufuhr). Noch ohne Bitte und ohne Einschwingen.
 */
export function stableTown(seed: number): StableTown {
  const w = createWorld(seed, { unlockAll: true, crisisLevel: 'off', petitionsOn: true });
  w.money = BIG_MONEY;
  w.won = true; // Stufe 4 ist nur nach dem Ziel ladbar
  w.petitions.next = NO_DRAW;
  buildTown(w, { tier: 4, inhabitants: STABLE_HOUSES, over: {}, stock: {} });
  const fed = chainsAt(w, {
    food: STABLE_OVER,
    cloth: STABLE_OVER,
    rum: STABLE_OVER,
    glass: STABLE_OVER,
    spice: STABLE_OVER,
  });
  const stock = home(w).stock;
  for (const g of Object.keys(stock) as GoodId[]) stock[g] = STORAGE_CAP;
  settleHouses(w);
  const feed = feedOf(fed);
  const capped =
    feed &&
    ((x: World): void => {
      feed(x);
      home(x).stock.spice = Math.min(STORAGE_CAP, home(x).stock.spice);
    });
  return { w, over: measuredOver(w, fed), feed: capped };
}

// ---- Lagen B4 und B5 (Anhang 01; Aufstiegswelle nach dem Muster von I-201 Lage A) ----

/** Wartezeit-Beginn der Aufstiegswelle: nach Antwort + 500, damit ohne Wirkung erst später aufgestiegen wird. */
const WAVE_SINCE = 500;
/** Fest in B5 beginnt, sobald die Wirkung läuft (Verzug) plus dieser Abstand. */
const FEAST_AFTER = 100;
const WAVE_HOUSES = [15, 15, 15, 15, 15] as const;
const WAVE_STOCK = { glass: 500, spice: 500, food: 100, cloth: 100, wood: 100, tools: 50 } as const;

const chapelOf = (w: World): Building =>
  Object.values(w.buildings).find((b) => b.defId === 'chapel')!;

/** Aufstiegsbereit: alle Häuser steigen frühestens `WAVE_SINCE` Ticks nach der Antwort auf (Stufe 3 nach 4). */
function prepareWave(w: World, since: number): void {
  w.won = true; // Stufe 4 ist nur nach dem Ziel ladbar
  for (const b of Object.values(w.buildings))
    if (b.house !== undefined) b.house.satisfiedSince = since;
}

/** Summe der Haus-Ticks auf Stufe 4: Zähler dafür, wie früh die Welle aufsteigt. */
function riserTicks(): { feed: (w: World) => void; ticks: (w: World) => number } {
  const sum = new WeakMap<World, number>();
  const feed = (w: World): void => {
    let n = 0;
    for (const b of Object.values(w.buildings))
      if (b.house !== undefined && b.house.tier === 4) n++;
    sum.set(w, (sum.get(w) ?? 0) + n);
  };
  return { feed, ticks: (w) => sum.get(w) ?? 0 };
}

const plateauSpec = (rum: number, cane: number): HouseSpec => ({
  tier: 4,
  inhabitants: [20, 20, 20],
  over: { food: 0, cloth: 0, rum: 0, glass: 0, spice: 0 },
  stock: { food: 60, cloth: 60, rum, glass: 60, spice: 60, cane },
});

function bellScene(seed: number, yes: boolean): PetitionScene {
  const spec: HouseSpec = yes
    ? {
        tier: 3,
        inhabitants: WAVE_HOUSES,
        over: { food: 0.2, cloth: 0.2, rum: 0.2 },
        stock: { ...WAVE_STOCK, rum: 30, stone: 30 + 5 * 10 },
      }
    : plateauSpec(15, INPUT_STOCK);
  const scene = sceneOf(
    seed,
    'bell',
    spec,
    yes ? 'B4 Ja: Aufstiegswelle' : 'B4 Nein: Plateau, Rum 15',
  );
  scene.mark.anchor = chapelOf(scene.w).id;
  if (yes) prepareWave(scene.w, scene.w.tick + WAVE_SINCE);
  const r = riserTicks();
  const supply = scene.feed;
  scene.feed = (w) => {
    supply?.(w);
    r.feed(w);
  };
  scene.extras = { riserTicks: r.ticks };
  return scene;
}

/** B5 läuft 6900 Ticks: die Häuser wachsen auf Stufe 4 auf 20 Bewohner, die Ketten tragen das mit. */
const B5_OVER = 0.6;
/** Glas und Gewürz tragen die Stufe-4-Häuser über das ganze Fenster (kein Zulauf in der Lage). */
const B5_AMPLE = 2000;

/** B5: das Aufstiegsfest nach dem Verzug; im Ja-Lauf mit Gutschein (Abklingzeit egal), sonst sobald erlaubt. */
function feastDrinkScene(seed: number, yes: boolean): PetitionScene {
  const spec: HouseSpec = yes
    ? {
        tier: 3,
        inhabitants: WAVE_HOUSES,
        over: { food: B5_OVER, cloth: B5_OVER, rum: B5_OVER },
        stock: { ...WAVE_STOCK, glass: B5_AMPLE, spice: B5_AMPLE, rum: 30, stone: 80, cane: 40 },
      }
    : plateauSpec(15, 25);
  const scene = sceneOf(
    seed,
    'feastDrink',
    spec,
    yes ? 'B5 Ja: Aufstiegswelle' : 'B5 Nein: Plateau, Rohr 25',
  );
  const chapel = chapelOf(scene.w);
  scene.mark.anchor = chapel.id;
  chapel.feastAt = scene.w.tick; // Fest läuft beim Start, danach Abklingzeit
  if (yes) prepareWave(scene.w, scene.w.tick + FEAST_AFTER + PETITIONS.feastDrink.delay + 100);
  const holdFrom = scene.w.tick + PETITIONS.feastDrink.delay + FEAST_AFTER;
  const state = new WeakMap<World, { held: boolean; rum: number }>();
  const r = riserTicks();
  const supply = scene.feed;
  scene.feed = (w) => {
    supply?.(w);
    r.feed(w);
    const st = state.get(w) ?? { held: false, rum: 0 };
    state.set(w, st);
    if (st.held || w.tick < holdFrom) return;
    const rum = home(w).stock.rum;
    if (!holdFeast(w, chapel.id, 'ascension').ok) return;
    st.held = true;
    st.rum = rum - home(w).stock.rum;
  };
  scene.extras = {
    riserTicks: r.ticks,
    feastHeld: (w) => (state.get(w)?.held ? 1 : 0),
    feastRum: (w) => state.get(w)?.rum ?? -1,
  };
  return scene;
}

Object.assign(SCENES, {
  bell: {
    yes: (seed: number) => bellScene(seed, true),
    no: (seed: number) => bellScene(seed, false),
  },
  feastDrink: {
    yes: (seed: number) => feastDrinkScene(seed, true),
    no: (seed: number) => feastDrinkScene(seed, false),
  },
});
