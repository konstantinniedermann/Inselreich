import type { BuildingDefId, GoodId } from '../types';

/** Höchstzahl Schiffe (M12 Seefahrt). */
export const SHIP_MAX = 4;
export const SHIP = {
  cost: { money: 1200, wood: 25, tools: 10, stone: 0 },
  upkeep: 15,
  capacity: 50,
} as const;
/** Routen (T02 bestätigt): Güter je Richtung; Reserve absolut in Einheiten (nicht Prozent). */
export const ROUTE_GOODS_PER_DIRECTION = 2;
export const ROUTE_RESERVE = { default: 10, step: 10, max: 90 } as const;

export type IslandKind = 'A' | 'B' | 'C';
/** Arten, auf denen Gebirge zu Gras wird und die Ersatzform reines Gras ist (kein Gebirgsblock). */
export const GRASS_ONLY_KINDS: readonly IslandKind[] = ['A', 'C'];
export type IslandTrait = 'spice' | 'mountain' | 'mountainRich' | 'fertile';

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
  /** Konsumgüter, für die diese Insel `PREFER_PCT` % zahlt (höchstens eines). */
  prefers: readonly GoodId[];
}

/** Erlösfaktor in Prozent für das Vorliebe-Gut einer Fremdinsel (stapelt nicht mit dem Boom). */
export const PREFER_PCT = 130;

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
    prefers: ['cloth'],
  },
  {
    kind: 'B',
    name: 'Felsbucht',
    dMin: 35,
    dMax: 40,
    size: 36,
    traits: ['spice', 'mountain', 'mountainRich'],
    plantations: 3,
    quarries: 3,
    prefers: ['rum'],
  },
  {
    kind: 'C',
    name: 'Weidenau',
    dMin: 30,
    dMax: 35,
    size: 24,
    traits: ['spice', 'fertile'],
    plantations: 6,
    quarries: 0,
    prefers: ['glass'],
  },
];

export const TRAIT_LABELS: Record<IslandTrait, string> = {
  spice: 'Gewürz',
  mountain: 'Gebirge',
  mountainRich: 'Gebirge+',
  fertile: 'Fruchtbar',
};
/** Zyklus-Faktor in Prozent für Betriebe mit Inselvorteil (50 = doppelter Ausstoss). */
export const TRAIT_CYCLE_PCT = 50;
/** Betriebe, deren Zyklus ein Trait verkürzt; Traits ohne Eintrag wirken nicht auf Zyklen. */
export const TRAIT_BUILDINGS: Partial<Record<IslandTrait, readonly BuildingDefId[]>> = {
  mountainRich: ['quarry', 'glassworks'],
  fertile: ['canefarm', 'sheepfarm'],
};

export const ISLANDS_SALT = 0x27d4eb2f; // eigener Strom, ≠ Auftrag 0x9e3779b1, ≠ CRISIS_SALT
export const ISLAND_TRIES = 50;
export const ISLAND_GAP_MIN = 8;
export const ARCHIPEL_SPAN_MAX = 300;
export const ISLAND_RIM = 4; // Land nur in [RIM, size − RIM − 1] (P-2)
export const SHIP_TICKS_PER_SEA_TILE = 10;
/** Ersatzlage: Anzahl gleichmässig verteilter Richtungen. */
export const FALLBACK_DIRECTIONS = 16;
/** Stufe 3 (Ersatzregel): Suche ab dMax in Schritten von FALLBACK_FAR_STEP Kacheln, FALLBACK_FAR_STEPS Mal. */
export const FALLBACK_FAR_STEP = 4;
export const FALLBACK_FAR_STEPS = 10;
/** Ersatzform der Insel B: Kantenlänge des Gebirgsblocks in der Land-Ecke oben links. */
export const FALLBACK_MOUNTAIN_SIDE = 4;

// Geländeteil der Gewürzplantage (E3 `spicefarm.site` enthält ihn)
export const PLANTATION_SITE = {
  w: 2,
  h: 2,
  site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4, free: true }],
} as const;

// Fahrlinie über Wasser (SEE-F1): reine Darstellung, beeinflusst Seeweg `d` und Fahrzeit nicht.
/** Zuschlag je Kachel Landnähe unter `ROUTE_DEEP` auf die Zellkosten. */
export const ROUTE_SHORE_PENALTY = 0.2;
/** Ab diesem Landabstand (Kacheln) gilt Wasser als tief, ohne Zuschlag. */
export const ROUTE_DEEP = 5;
/** Mindestabstand zu Land (Kacheln) beim Ausdünnen per Sichtlinie, wo möglich. */
export const ROUTE_CLEAR = 3;
/** Radius der Eckenrundung in Kacheln. */
export const ROUTE_ROUND_RADIUS = 2;
/** Schrittweite der abgetasteten Polylinie in Kacheln. */
export const ROUTE_STEP = 0.5;
/** Rasterrand um den Archipel in Kacheln. */
export const ROUTE_MARGIN = 2;
/** Deterministischer Deckel: höchstens so viele Knoten werden je Suche abgearbeitet. */
export const ROUTE_MAX_NODES = 200000;
/** Zielwert: grösster Richtungswechsel (Grad) je abgetastetem Schritt. */
export const ROUTE_MAX_TURN = 30;
/** Höchstzahl Glättungsdurchgänge nach der Abtastung. */
export const ROUTE_SMOOTH_PASSES = 60;
/** Mindest-Landabstand in Zellen (8er) auf der Fahrlinie; 2 Zellen = mindestens 1,5 Kacheln zur Landmitte. */
export const ROUTE_MIN_DIST = 2;
/** Radius um die Anker (Kacheln), in dem die Fahrlinie näher an Land liegen darf. */
export const ROUTE_EXIT_RADIUS = 1.5;
/** Zuschlag je Zelle unter `ROUTE_MIN_DIST` Landabstand: Engstellen nur, wenn es nicht anders geht. */
export const ROUTE_NARROW_PENALTY = 20;
