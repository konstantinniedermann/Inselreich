import { serviceRadiusOf } from './council';
import { BUILDING_DEFS } from './defs/buildings';
import { FEAST_KIND_IDS, FEAST_KINDS, type FeastKind } from './defs/feast';
import { FEAST_COOLDOWN, FEAST_DURATION } from './defs/timing';
import type { Building, World } from './types';
import { center } from './world';

/** Stand des Fests einer Kapelle: bereit, läuft oder Abklingzeit; `remaining` in Ticks bis zum Phasenende. */
export type FeastState = { phase: 'ready' | 'active' | 'cooldown'; remaining: number };

/** Phase und Restzeit; `feastAt` fehlt = bereit. Die Uhr läuft auch bei Brand weiter. */
export function feastState(world: World, chapel: Building): FeastState {
  if (chapel.feastAt === undefined) return { phase: 'ready', remaining: 0 };
  const elapsed = world.tick - chapel.feastAt;
  if (elapsed < FEAST_DURATION) return { phase: 'active', remaining: FEAST_DURATION - elapsed };
  if (elapsed < FEAST_COOLDOWN) return { phase: 'cooldown', remaining: FEAST_COOLDOWN - elapsed };
  return { phase: 'ready', remaining: 0 };
}

/** Eine Kapelle wirkt nur, wenn sie angebunden ist und nicht brennt (wie `serviceAvailable`). */
export function chapelWorks(chapel: Building): boolean {
  return chapel.connected && chapel.outageUntil === undefined;
}

/** Ziel auf der Insel der Kapelle (Koordinaten sind inselbezogen) mit Mittelpunktabstand im Dienstradius. */
export function inChapelRadius(world: World, chapel: Building, target: Building): boolean {
  if (chapel.island !== target.island) return false;
  const hc = center(BUILDING_DEFS[target.defId], target.x, target.y);
  const def = BUILDING_DEFS[chapel.defId];
  const c = center(def, chapel.x, chapel.y);
  return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= (serviceRadiusOf(world, chapel.defId) ?? 0);
}

export function isFeastKind(k: unknown): k is FeastKind {
  return (FEAST_KIND_IDS as readonly unknown[]).includes(k);
}

/** Art des letzten Fests der Kapelle; fehlt = Aufstiegsfest. */
export function feastKindOf(chapel: Building): FeastKind {
  return chapel.feastKind ?? 'ascension';
}

/** Läuft an dieser Kapelle ein Fest der Art `kind`, und wirkt die Kapelle? */
function runs(world: World, c: Building, kind: FeastKind): boolean {
  if (feastKindOf(c) !== kind || c.feastAt === undefined || !chapelWorks(c)) return false;
  return feastState(world, c).phase === 'active';
}

/** Wirkt ein Aufstiegsfest auf das Haus (Id-Reihenfolge, einmal). */
export function feastActive(world: World, house: Building): boolean {
  return Object.values(world.buildings).some(
    (c) => runs(world, c, 'ascension') && inChapelRadius(world, c, house),
  );
}

/** Wirkt ein Erntefest auf das Gebäude: gleiche Insel, Kapelle im Radius. */
export function harvestActive(world: World, b: Building): boolean {
  return Object.values(world.buildings).some(
    (c) =>
      c.feastKind === 'harvest' &&
      c.island === b.island &&
      runs(world, c, 'harvest') &&
      inChapelRadius(world, c, b),
  );
}

/** Verkürzter Produktionszyklus unter dem Erntefest, nie unter 1. */
export function harvestCycle(cycle: number): number {
  return Math.max(1, Math.floor((cycle * FEAST_KINDS.harvest.cyclePct) / 100));
}

/** Läuft auf der Insel ein Markttag. */
export function marketActive(world: World, island: number): boolean {
  return Object.values(world.buildings).some(
    (c) => c.feastKind === 'market' && c.island === island && runs(world, c, 'market'),
  );
}
