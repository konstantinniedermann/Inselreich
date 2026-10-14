// storageFull.ts — rein: «Lager voll» als Problem (I-085); Zähler nur im UI-Zustand, nie im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { TICK_MS } from '../sim/defs/timing';
import type { Building, GoodId, World } from '../sim/types';

/** Darstellungswert (kein Spielwert): so lange muss ein Stau dauern, bevor er als Problem gilt. */
export const FULL_PROBLEM_SECONDS = 30;
export const FULL_PROBLEM_TICKS = Math.ceil((FULL_PROBLEM_SECONDS * 1000) / TICK_MS);
/** Karenz gegen Flackern: erst nach so vielen Ticks ohne Stau gilt der Stau als beendet (5 s). */
export const FULL_GRACE_TICKS = Math.ceil(5000 / TICK_MS);

export interface StorageProblem {
  island: number;
  good: GoodId;
  stock: number;
  producers: Building[]; // Kandidaten für den Sprung
}

const startKey = (island: number, good: GoodId): string => `f:${island}:${good}`;
const missKey = (island: number, good: GoodId): string => `x:${island}:${good}`;

/** Welt, zu der ein Zähler gehört: anderes Objekt (Laden, Neues Spiel) = Zähler verwerfen. */
const owners = new WeakMap<Map<string, number>, World>();

/** Erzeuger des Guts auf der Insel, die laufen dürften (angebunden, nicht stillgelegt). */
function producersOf(world: World, island: number, good: GoodId): Building[] {
  const out: Building[] = [];
  for (const b of Object.values(world.buildings)) {
    if (b.island !== island || b.paused === true || !b.connected) continue;
    if (BUILDING_DEFS[b.defId].produces === good) out.push(b);
  }
  return out;
}

/** Zähler fortschreiben; im HUD-Takt aufrufen. Schlüssel `f:<insel>:<gut>` = Tick des ersten Beobachtens. */
export function trackFullSince(since: Map<string, number>, world: World): void {
  if (owners.get(since) !== world) {
    since.clear();
    owners.set(since, world);
  }
  for (const t of since.values()) {
    if (t > world.tick) {
      since.clear(); // Tick gesunken = Laden
      break;
    }
  }
  world.islands.forEach((isl, i) => {
    for (const g of GOOD_IDS) {
      const sk = startKey(i, g);
      const mk = missKey(i, g);
      if (isl.stock[g] < STORAGE_CAP) {
        since.delete(sk);
        since.delete(mk);
        continue;
      }
      const jam = producersOf(world, i, g).some((b) => b.state === 'storageFull');
      if (jam) {
        if (!since.has(sk)) since.set(sk, world.tick);
        since.delete(mk);
      } else if (since.has(sk)) {
        const missed = since.get(mk) ?? world.tick;
        since.set(mk, missed);
        if (world.tick - missed >= FULL_GRACE_TICKS) {
          since.delete(sk);
          since.delete(mk);
        }
      }
    }
  });
}

/** Ein Eintrag je (Insel, Gut), dessen Stau mindestens `FULL_PROBLEM_TICKS` dauert. */
export function storageProblems(world: World, since: Map<string, number>): StorageProblem[] {
  const out: StorageProblem[] = [];
  world.islands.forEach((isl, i) => {
    for (const g of GOOD_IDS) {
      const t = since.get(startKey(i, g));
      if (t === undefined || world.tick - t < FULL_PROBLEM_TICKS) continue;
      if (isl.stock[g] < STORAGE_CAP) continue;
      const all = producersOf(world, i, g);
      const jammed = all.filter((b) => b.state === 'storageFull');
      const producers = jammed.length > 0 ? jammed : all; // Karenz: Eintrag bleibt im Flacker-Tick
      if (producers.length > 0) out.push({ island: i, good: g, stock: isl.stock[g], producers });
    }
  });
  return out;
}
