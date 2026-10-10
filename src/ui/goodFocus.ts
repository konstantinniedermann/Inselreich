// goodFocus.ts — rein: Erzeuger und Verbraucher eines Guts auf einer Insel und die Meldungen M1–M3 (I-043); nicht im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { missingInputs } from '../sim/queries';
import type { Building, GoodId, World } from '../sim/types';
import { buildLock } from '../sim/unlocks';
import { jumpTarget } from './islandJump';
import { compareSort, spot, type ProblemSort } from './problems';
import { stateInfo } from './texts';

export type FocusRole = 'producer' | 'consumer';
export interface FocusEntry {
  key: string; // `b:<id>`
  role: FocusRole;
  island: number;
  id: number;
  at: { x: number; y: number }; // Archipel-Kacheln, Footprint-Mitte
  sort: ProblemSort; // [Rolle 0|1, 0, Abstand zu jumpTarget, ID]
  building: Building;
}

/** Erzeuger vor Verbrauchern, je Rolle nach Abstand zum Sprungziel, dann ID. Alle Zustände zählen. */
export function focusList(world: World, island: number, good: GoodId): FocusEntry[] {
  const j = jumpTarget(world, island);
  const out: FocusEntry[] = [];
  for (const b of Object.values(world.buildings)) {
    if (b.island !== island || b.house || b.defId === 'kontor') continue;
    const def = BUILDING_DEFS[b.defId];
    const role: FocusRole | null =
      def.produces === good ? 'producer' : def.consumes?.includes(good) ? 'consumer' : null;
    if (role === null) continue;
    const at = spot(world, b);
    out.push({
      key: `b:${b.id}`,
      role,
      island,
      id: b.id,
      at,
      sort: [role === 'producer' ? 0 : 1, 0, Math.hypot(at.x - j.x, at.y - j.y), b.id],
      building: b,
    });
  }
  return out.sort((a, b) => compareSort(a.sort, b.sort));
}

/** M1: `index` ist 1-basiert. */
export function focusMessage(
  world: World,
  good: GoodId,
  index: number,
  count: number,
  e: FocusEntry,
): string {
  const def = BUILDING_DEFS[e.building.defId];
  const role = e.role === 'producer' ? 'Erzeuger' : 'Verbraucher';
  const state = stateInfo(e.building, world.tick, missingInputs(world, e.building)).text;
  return `${GOODS[good].name} ${index} von ${count}: ${def.name} (${role}) · ${state}`;
}

/** M2: kein Erzeuger auf der Insel; nennt die freigeschalteten Erzeuger-Typen. */
export function noProducerMessage(world: World, good: GoodId): string {
  const names = Object.values(BUILDING_DEFS)
    .filter((d) => d.produces === good && buildLock(world, d.id) === null)
    .map((d) => d.name);
  const head = `Noch kein Erzeuger für ${GOODS[good].name} — `;
  if (names.length === 0) return `${head}Erzeuger noch nicht frei`;
  const list =
    names.length === 1
      ? names[0]!
      : `${names.slice(0, -1).join(', ')} oder ${names[names.length - 1]}`;
  return `${head}Bauen: ${list}`;
}

/** M3: der Fokus hat nichts mehr zu markieren. */
export const emptyFocusMessage = (good: GoodId): string =>
  `${GOODS[good].name}: nichts mehr markiert`;
