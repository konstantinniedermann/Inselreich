import { BUILDING_DEFS } from './defs/buildings';
import { COUNCIL_TIERS } from './defs/council';
import { TIERS } from './defs/tiers';
import { fail, ok } from './types';
import type { BuildingDefId, CouncilSide, CouncilTier, Result, Tier, World } from './types';

/* Einziger Leseort (R706 a) für die Ratsbeschluss-Hebel: Dienst-Reichweite, Hausgrösse, Takt.
   `world` ist noch ungenutzt; erst der Ratsbeschluss (T04) liest daraus. */

/** Dienst-Reichweite von `defId`; `undefined` ohne Dienst. */
export const serviceRadiusOf = (_world: World, defId: BuildingDefId): number | undefined =>
  BUILDING_DEFS[defId].serviceRadius;

/** Höchstzahl Einwohner eines Hauses der Stufe `tier`. */
export const maxInhabitantsOf = (_world: World, tier: Tier): number => TIERS[tier].maxInhabitants;

/** Grundtakt `cycle` von `defId`, nach Ratsbeschluss. */
export const councilCycle = (_world: World, _defId: BuildingDefId, cycle: number): number => cycle;

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
