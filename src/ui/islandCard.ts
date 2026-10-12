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
import { islandCycle, traitOf } from '../sim/levels';
import { HOME } from '../sim/world';
import { seaLanes, travelTicks } from '../sim/islands';
import { GOODS } from '../sim/defs/goods';
import { perMinute } from './time';
import type { Building, World } from '../sim/types';
import { islandName } from '../sim/islands';

const clock = (seconds: number): string => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Abschnitte der Traits mit Wirkung, z. B. `"Gebirge+: Steinbruch, Glashütte ×2"` (Def-Reihenfolge). */
export function traitEffectTexts(def: IslandDef): string[] {
  return def.traits.flatMap((t) => {
    const ids = TRAIT_BUILDINGS[t];
    if (ids === undefined) return [];
    return [
      `${TRAIT_LABELS[t]}: ${ids.map((id) => BUILDING_DEFS[id].name).join(', ')} ${factorText()}`,
    ];
  });
}

/** Abschnitte mit Wirkung der Insel `i` (leer für Heimat und Inseln ohne Wirkung). */
export function islandEffectTexts(world: World, i: number): string[] {
  const kind = world.islands[i]?.kind;
  const def = ISLANDS.find((d) => d.kind === kind);
  return def === undefined ? [] : traitEffectTexts(def);
}

/** Faktor-Text, z. B. `×2`; einzige Stelle im UI, die den Faktor aus `TRAIT_CYCLE_PCT` bildet. */
export const factorText = (): string => `×${100 / TRAIT_CYCLE_PCT}`;

/** Zeile `Inselvorteil ×2 (Gebirge+)` für Trait-Betriebe auf einer Trait-Insel, sonst `null`. */
export function traitLine(world: World, b: Building): string | null {
  const t = traitOf(world, b.island, b.defId);
  return t === undefined ? null : `Inselvorteil ${factorText()} (${TRAIT_LABELS[t]})`;
}

/** Bauleisten-Zeile `Auf Felsbucht: Gebirge+ ×2 — 20 Stein / min`; `null`, wenn die Insel den Trait nicht trägt. */
export function traitBuildLine(
  world: World,
  island: number,
  defId: Building['defId'],
): string | null {
  const t = traitOf(world, island, defId);
  const def = BUILDING_DEFS[defId];
  if (t === undefined || def.produces === undefined || def.cycle === undefined) return null;
  const rate = perMinute(1, islandCycle(world, island, defId, def.cycle));
  return `Auf ${islandName(world, island)}: ${TRAIT_LABELS[t]} ${factorText()} — ${rate} ${GOODS[def.produces].name} / min`;
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
