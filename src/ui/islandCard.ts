// islandCard.ts — Text der Inselkarte beim Mouse-over über einer Fremdinsel (Spec M12 Anhang 02 D). Rein.
import { TICK_MS } from '../sim/defs/timing';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import {
  ISLANDS,
  TRAIT_BUILDINGS,
  TRAIT_CYCLE_PCT,
  TRAIT_LABELS,
  type IslandDef,
} from '../sim/defs/sea';
import { HOME } from '../sim/world';
import { seaLanes, travelTicks } from '../sim/islands';
import type { World } from '../sim/types';

const clock = (seconds: number): string => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Abschnitte der Traits mit Wirkung, z. B. `"Gebirge+: Steinbruch, Glashütte ×2"` (Def-Reihenfolge). */
export function traitEffectTexts(def: IslandDef): string[] {
  const factor = 100 / TRAIT_CYCLE_PCT;
  return def.traits.flatMap((t) => {
    const ids = TRAIT_BUILDINGS[t];
    if (ids === undefined) return [];
    return [`${TRAIT_LABELS[t]}: ${ids.map((id) => BUILDING_DEFS[id].name).join(', ')} ×${factor}`];
  });
}

/** `"Möweninsel · 24 × 24 · Gewürz · Fahrzeit 0:27"`; `d` ist die Seeweg-Länge in Kacheln. */
export function formatIslandCard(def: IslandDef, width: number, height: number, d: number): string {
  const plain = def.traits
    .filter((t) => TRAIT_BUILDINGS[t] === undefined)
    .map((t) => TRAIT_LABELS[t]);
  const seconds = (travelTicks(d) * TICK_MS) / 1000;
  const parts = [def.name, `${width} × ${height}`];
  if (plain.length > 0) parts.push(plain.join(', '));
  parts.push(...traitEffectTexts(def), `Fahrzeit ${clock(seconds)}`);
  return parts.join(' · ');
}

const lanes = new WeakMap<World, ReturnType<typeof seaLanes>>();

/** Karte der Fremdinsel `i` (≥ 1) oder `null`, wenn es sie nicht gibt. */
export function islandCard(world: World, i: number): string | null {
  const isl = world.islands[i];
  if (!isl || i === HOME || isl.kind === 'home') return null;
  const def = ISLANDS.find((d) => d.kind === isl.kind);
  let all = lanes.get(world);
  if (!all) lanes.set(world, (all = seaLanes(world.islands)));
  const lane = all.find((l) => l.a === HOME && l.b === i);
  if (!def || !lane) return null;
  return formatIslandCard(def, isl.width, isl.height, lane.d);
}
