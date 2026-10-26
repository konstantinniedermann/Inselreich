import { BUILDING_DEFS } from './defs/buildings';
import { COUNCIL, COUNCIL_TIERS } from './defs/council';
import { TIERS } from './defs/tiers';
import { SHIP_TICKS_PER_SEA_TILE } from './defs/sea';
import { fail, ok } from './types';
import type {
  BuildingDefId,
  CouncilDef,
  CouncilSide,
  CouncilTier,
  Result,
  Tier,
  World,
} from './types';

/* Einziger Leseort (R706 a) für die Ratsbeschluss-Hebel: Dienst-Reichweite, Hausgrösse, Takt, Fahrzeit. */

/** Wert des Hebels `kind` für `key` (defId bzw. Stufe) aus den beschlossenen Stufen; `undefined` ohne Treffer. */
function activeLever(
  world: Pick<World, 'council'>,
  kind: CouncilDef['lever']['kind'],
  key?: string | number,
): number | undefined {
  for (const t of COUNCIL_TIERS) {
    const side = world.council[t];
    if (side === null || side === 'open') continue;
    const lever = COUNCIL[t][side]?.lever;
    if (lever === undefined || lever.kind !== kind) continue;
    if (!('defId' in lever || 'tier' in lever)) return lever.value;
    if (('defId' in lever ? lever.defId : lever.tier) === key) return lever.value;
  }
  return undefined;
}

/** Dienst-Reichweite von `defId`; `undefined` ohne Dienst. */
export const serviceRadiusOf = (world: World, defId: BuildingDefId): number | undefined =>
  activeLever(world, 'serviceRadius', defId) ?? BUILDING_DEFS[defId].serviceRadius;

/** Höchstzahl Einwohner eines Hauses der Stufe `tier`. */
export const maxInhabitantsOf = (world: World, tier: Tier): number =>
  activeLever(world, 'maxInhabitants', tier) ?? TIERS[tier].maxInhabitants;

/** Takt `cycle` von `defId` nach Ratsbeschluss: proportional zum Def-Takt, mindestens 1 (R711 R-3). */
export function councilCycle(world: World, defId: BuildingDefId, cycle: number): number {
  const v = activeLever(world, 'cycle', defId);
  if (v === undefined) return cycle;
  return Math.max(1, Math.floor((cycle * v) / BUILDING_DEFS[defId].cycle!));
}

/** Ticks je Seefeld; mit Seerecht der Ratswert, sonst der Def-Wert. */
export const seaTileTicks = (world: Pick<World, 'council'>): number =>
  activeLever(world, 'seaTileTicks') ?? SHIP_TICKS_PER_SEA_TILE;

/** Höchste Hausstufe über alle Inseln (0 ohne Haus). */
function highestHouseTier(world: World): number {
  let max = 0;
  for (const id of Object.keys(world.buildings)
    .map(Number)
    .sort((a, b) => a - b)) {
    const tier = world.buildings[id]!.house?.tier;
    if (tier !== undefined && tier > max) max = tier;
  }
  return max;
}

/** Öffnet Ratsbeschlüsse ab Hausstufe 2/3/4; schliesst nie wieder (Spec §3.2.1). Kein RNG. */
export function tickCouncil(world: World): void {
  if (COUNCIL_TIERS.every((t) => world.council[t] !== null)) return;
  const max = highestHouseTier(world);
  for (const t of COUNCIL_TIERS)
    if (t <= max && world.council[t] === null) world.council[t] = 'open';
}

const isTier = (v: unknown): v is CouncilTier => (COUNCIL_TIERS as readonly unknown[]).includes(v);

/** Gültige Seite der Stufe `tier` (C nur, wo die Tabelle sie führt). */
export const isCouncilSide = (tier: CouncilTier, side: unknown): side is CouncilSide =>
  (side === 'A' || side === 'B' || side === 'C') && Object.hasOwn(COUNCIL[tier], side);

/** Vorhandene Seiten der Stufe in der Reihenfolge A, B, C. */
export const councilSides = (tier: CouncilTier): CouncilSide[] =>
  (['A', 'B', 'C'] as const).filter((s) => COUNCIL[tier][s] !== undefined);

/** Grund, den `decree` liefern würde, oder null; ändert nichts. */
export function decreeReason(world: World, tier: unknown, side: unknown): string | null {
  if (!isTier(tier)) return 'Ungültige Stufe';
  if (!isCouncilSide(tier, side)) return 'Ungültige Seite';
  const state = world.council[tier];
  if (state === null) return 'Beschluss nicht offen';
  if (state !== 'open') return 'Schon beschlossen';
  return null;
}

/** Rechnet die Restfahrzeit aller fahrenden Schiffe auf den neuen Feldwert um, mindestens 1. */
function rescaleVoyages(world: World, alt: number, neu: number): void {
  if (neu === alt) return;
  for (const ship of world.ships)
    if (ship.to !== null) ship.left = Math.max(1, Math.ceil((ship.left * neu) / alt));
}

/** Beschliesst die Seite einer offenen Stufe, einmalig; kein Geld, keine Pause-Sperre. */
export function decree(world: World, tier: unknown, side: unknown): Result {
  const reason = decreeReason(world, tier, side);
  if (reason !== null) return fail(reason);
  const alt = seaTileTicks(world);
  world.council[tier as CouncilTier] = side as CouncilSide;
  rescaleVoyages(world, alt, seaTileTicks(world));
  return ok;
}

/** Offene Beschlüsse, aufsteigend nach Stufe. */
export const openCouncilTiers = (world: World): CouncilTier[] =>
  COUNCIL_TIERS.filter((t) => world.council[t] === 'open');
