/** Höchstzahl Schiffe (M12 Seefahrt). */
export const SHIP_MAX = 4;
export const SHIP = { capacity: 50 } as const;
/** Routen (T02 bestätigt): Güter je Richtung und Reserve in Prozent. */
export const ROUTE_GOODS_PER_DIRECTION = 2;
export const ROUTE_RESERVE = { default: 10, step: 10, max: 90 } as const;

export type IslandKind = 'A' | 'B';
export type IslandTrait = 'spice' | 'mountain';

export interface IslandDef {
  kind: IslandKind;
  name: string;
  /** Seeweg ab Heimatanker in Kacheln (Spanne). */
  dMin: number;
  dMax: number;
  /** Kantenlänge des quadratischen Inselrasters. */
  size: number;
  traits: readonly IslandTrait[];
  plantations: number;
  quarries: number;
}

export const HOME_NAME = 'Heimat';

export const ISLANDS: readonly IslandDef[] = [
  {
    kind: 'A',
    name: 'Möweninsel',
    dMin: 25,
    dMax: 30,
    size: 24,
    traits: ['spice'],
    plantations: 2,
    quarries: 0,
  },
  {
    kind: 'B',
    name: 'Felsbucht',
    dMin: 35,
    dMax: 40,
    size: 36,
    traits: ['spice', 'mountain'],
    plantations: 3,
    quarries: 1,
  },
];

export const TRAIT_LABELS: Record<IslandTrait, string> = { spice: 'Gewürz', mountain: 'Gebirge' };

export const ISLANDS_SALT = 0x27d4eb2f; // eigener Strom, ≠ Auftrag 0x9e3779b1, ≠ CRISIS_SALT
export const ISLAND_TRIES = 50;
export const ISLAND_GAP_MIN = 8;
export const ARCHIPEL_SPAN_MAX = 300;
export const ISLAND_RIM = 4; // Land nur in [RIM, size − RIM − 1] (P-2)
export const SHIP_TICKS_PER_SEA_TILE = 10;
/** Ersatzlage: Anzahl gleichmässig verteilter Richtungen. */
export const FALLBACK_DIRECTIONS = 16;
/** Ersatzform der Insel B: Kantenlänge des Gebirgsblocks in der Land-Ecke oben links. */
export const FALLBACK_MOUNTAIN_SIDE = 4;

// Geländeteil der Gewürzplantage (E3 `spicefarm.site` enthält ihn)
export const PLANTATION_SITE = {
  w: 2,
  h: 2,
  site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4, free: true }],
} as const;
