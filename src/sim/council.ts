import { BUILDING_DEFS } from './defs/buildings';
import { COUNCIL, COUNCIL_TIERS } from './defs/council';
import { TIERS } from './defs/tiers';
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

/* Einziger Leseort (R706 a) für die Ratsbeschluss-Hebel: Dienst-Reichweite, Hausgrösse, Takt. */

/** Wert des Hebels `kind` für `key` (defId bzw. Stufe) aus den beschlossenen Stufen; `undefined` ohne Treffer. */
function activeLever(
  world: World,
  kind: CouncilDef['lever']['kind'],
  key: string | number,
): number | undefined {
  for (const t of COUNCIL_TIERS) {
    const side = world.council[t];
    if (side !== 'A' && side !== 'B') continue;
    const lever = COUNCIL[t][side].lever;
    if (lever.kind !== kind) continue;
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
const isSide = (v: unknown): v is CouncilSide => v === 'A' || v === 'B';

/** Grund, den `decree` liefern würde, oder null; ändert nichts. */
export function decreeReason(world: World, tier: unknown, side: unknown): string | null {
  if (!isTier(tier)) return 'Ungültige Stufe';
  if (!isSide(side)) return 'Ungültige Seite';
  const state = world.council[tier];
  if (state === null) return 'Beschluss nicht offen';
  if (state !== 'open') return 'Schon beschlossen';
  return null;
}

/** Beschliesst die Seite einer offenen Stufe, einmalig; kein Geld, keine Pause-Sperre. */
export function decree(world: World, tier: unknown, side: unknown): Result {
  const reason = decreeReason(world, tier, side);
  if (reason !== null) return fail(reason);
  world.council[tier as CouncilTier] = side as CouncilSide;
  return ok;
}

/** Offene Beschlüsse, aufsteigend nach Stufe. */
export const openCouncilTiers = (world: World): CouncilTier[] =>
  COUNCIL_TIERS.filter((t) => world.council[t] === 'open');
