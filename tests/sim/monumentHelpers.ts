import { placeBuilding, placeRoad } from '../../src/sim/build';
import { startMonumentStage } from '../../src/sim/monument';
import { recomputeConnectivity } from '../../src/sim/roads';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { forceRect, village } from './helpers';
import type { Building } from '../../src/sim/types';

/** Fester 3×3-Bauplatz des Denkmals: Kontor (32, 31) + 7 in x, im Kontorradius (Spec Anhang 01 F). */
export const MONUMENT_AT = { x: 39, y: 31 } as const;

/** Testwelt M13-E2 (Spec §10): Kaufleute-Ziel erreicht, leere Stadt, Lager je 20, viel Geld, Tick 1000. */
export function monumentWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  w.wonMerchants = true;
  w.money = 100_000;
  w.tick = 1000;
  const stock = home(w).stock;
  stock.stone = 20;
  stock.tools = 20;
  stock.glass = 20;
  stock.spice = 20;
  forceRect(w, MONUMENT_AT.x, MONUMENT_AT.y, 3, 3, 'grass');
  forceRect(w, MONUMENT_AT.x - 1, MONUMENT_AT.y + 1, 1, 1, 'grass');
  if (!placeRoad(w, MONUMENT_AT.x - 1, MONUMENT_AT.y + 1).ok) throw new Error('Weg am Denkmal');
  return w;
}

/** Baut das Denkmal am festen Bauplatz; wirft nur im Test, wenn der Bau scheitert. */
export function placeMonument(w: World): number {
  const r = placeBuilding(w, 'monument', MONUMENT_AT.x, MONUMENT_AT.y);
  if (!r.ok || r.id === undefined) throw new Error('Denkmal setzen');
  return r.id;
}

/** Wegstück Kontor → Randkachel (x−1, y+1) des Denkmals: (32,30), Zeile 29 bis x−1, Spalte x−1 bis y+1. */
export function layMonumentRoad(w: World): void {
  forceRect(w, 30, 28, 16, 10, 'grass');
  const lay = (x: number, y: number): void => {
    w.islands[0]!.tiles[y * w.islands[0]!.width + x]!.road = true;
  };
  lay(32, 30);
  for (let x = 32; x <= MONUMENT_AT.x - 1; x++) lay(x, 29);
  for (let y = 29; y <= MONUMENT_AT.y + 1; y++) lay(MONUMENT_AT.x - 1, y);
  recomputeConnectivity(w);
}

/** Angebundenes Denkmal, Abschnitt 1 läuft (Tick 1000), alle `buy` aus, Lager je 20. */
export function runningMonument(): { w: World; id: number } {
  const w = monumentWorld();
  layMonumentRoad(w);
  const id = placeMonument(w);
  recomputeConnectivity(w);
  if (!startMonumentStage(w).ok) throw new Error('Abschnitt starten');
  return { w, id };
}

/** Vier Stufe-4-Häuser (je 15 Kaufleute) mit angebundenem Denkmal neben dem Kontor; Abschnitt 1 läuft, Tick 1000. */
export const VILLAGE_MONUMENT_AT = { x: 34, y: 31 } as const;
export function villageMonument(): { w: World; houses: Building[]; id: number } {
  const { w, houses } = village(4, { unlockAll: true });
  w.wonMerchants = true;
  w.money = 100_000;
  w.tick = 1000;
  forceRect(w, 32, 30, 6, 1, 'grass');
  forceRect(w, VILLAGE_MONUMENT_AT.x, VILLAGE_MONUMENT_AT.y, 3, 3, 'grass');
  for (let x = 32; x <= 37; x++) w.islands[0]!.tiles[30 * w.islands[0]!.width + x]!.road = true;
  const r = placeBuilding(w, 'monument', VILLAGE_MONUMENT_AT.x, VILLAGE_MONUMENT_AT.y);
  if (!r.ok || r.id === undefined) throw new Error('Denkmal im Dorf');
  recomputeConnectivity(w);
  for (const h of houses) {
    h.house!.tier = 4;
    h.house!.inhabitants = 15;
  }
  if (!startMonumentStage(w).ok) throw new Error('Abschnitt starten');
  return { w, houses, id: r.id };
}
