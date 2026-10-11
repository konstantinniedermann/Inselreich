import { placeBuilding, placeRoad } from '../../src/sim/build';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { forceRect } from './helpers';

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
