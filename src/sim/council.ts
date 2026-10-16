import { BUILDING_DEFS } from './defs/buildings';
import { TIERS } from './defs/tiers';
import type { BuildingDefId, Tier, World } from './types';

/* Einziger Leseort (R706 a) für die Ratsbeschluss-Hebel: Dienst-Reichweite, Hausgrösse, Takt.
   `world` ist noch ungenutzt; erst der Ratsbeschluss (T04) liest daraus. */

/** Dienst-Reichweite von `defId`; `undefined` ohne Dienst. */
export const serviceRadiusOf = (_world: World, defId: BuildingDefId): number | undefined =>
  BUILDING_DEFS[defId].serviceRadius;

/** Höchstzahl Einwohner eines Hauses der Stufe `tier`. */
export const maxInhabitantsOf = (_world: World, tier: Tier): number => TIERS[tier].maxInhabitants;

/** Grundtakt `cycle` von `defId`, nach Ratsbeschluss. */
export const councilCycle = (_world: World, _defId: BuildingDefId, cycle: number): number => cycle;
