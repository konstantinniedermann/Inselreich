// Betrieb stilllegen (I-035, Spec §8). Kein Zufall, wirft nie, kein Geld, keine Amtsstube.
import { BUILDING_DEFS } from './defs/buildings';
import { fail, ok } from './types';
import type { Building, Result, World } from './types';

function findBuilding(world: World, id: unknown): Building | undefined {
  if (typeof id !== 'number' || !Number.isInteger(id)) return undefined;
  return Object.hasOwn(world.buildings, id) ? world.buildings[id] : undefined;
}

/** Zustand nach dem Anfahren (wie am Ende eines Ausfalls). */
const runningState = (b: Building): Building['state'] =>
  b.outageUntil !== undefined ? 'burning' : b.connected ? 'ok' : 'notConnected';

/** Legt einen Betrieb still oder fährt ihn wieder an (Spec S2); bei `ok: false` bleibt die Welt unverändert. */
export function setPaused(world: World, id: unknown, paused: unknown): Result {
  const b = findBuilding(world, id);
  if (b === undefined) return fail('Gebäude nicht gefunden');
  if (typeof paused !== 'boolean') return fail('Ungültiger Wert');
  if (BUILDING_DEFS[b.defId].produces === undefined)
    return fail('Nur Betriebe lassen sich stilllegen');
  const isPaused = b.paused === true;
  if (paused && isPaused) return fail('Schon stillgelegt');
  if (!paused && !isPaused) return fail('Läuft bereits');
  if (paused) {
    b.paused = true;
    if (b.state !== 'burning') b.state = 'paused';
  } else {
    delete b.paused;
    b.state = runningState(b);
  }
  return ok;
}
