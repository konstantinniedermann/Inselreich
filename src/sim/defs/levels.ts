import type { BuildingDefId, Cost, GoodId, Tier } from '../types';

/** Standortregel einer Stufe (Anhang 01, Spalte Standort); gelesen ab T02. */
export type LevelSite =
  | { kind: 'fisherSpacing'; radius: number; maxOthers: number }
  | { kind: 'freeTerrain'; terrain: 'forest' | 'grass'; radius: number; min: number }
  | { kind: 'terrainNear'; terrain: 'mountain'; radius: number; min: number }
  | { kind: 'fireStation' };

export interface LevelDef {
  cycle: number; // ganzzahlig
  upkeep: number; // ganzzahlig, je 100 Ticks
  cost: Cost; // Geld, Holz, Werkzeug, Stein (sofort bezahlt)
  extra?: { good: GoodId; amount: number }; // fachliche Ware, nicht erstattet
  workforceTier: Tier; // Fachkräfte dieser Stufe im Arbeitsweg
  site?: LevelSite;
}

const cost = (money: number, wood: number, tools: number, stone: number): Cost => ({
  money,
  wood,
  tools,
  stone,
});
const forest = (radius: number, min: number): LevelSite => ({
  kind: 'freeTerrain',
  terrain: 'forest',
  radius,
  min,
});
const grass = (radius: number, min: number): LevelSite => ({
  kind: 'freeTerrain',
  terrain: 'grass',
  radius,
  min,
});
const mountain = (radius: number, min: number): LevelSite => ({
  kind: 'terrainNear',
  terrain: 'mountain',
  radius,
  min,
});
const fisherSpacing = (radius: number): LevelSite => ({
  kind: 'fisherSpacing',
  radius,
  maxOthers: 1,
});
const FIRE_STATION: LevelSite = { kind: 'fireStation' };

const L2 = (cycle: number, upkeep: number, c: Cost, site?: LevelSite): LevelDef => ({
  cycle,
  upkeep,
  cost: c,
  workforceTier: 2,
  ...(site ? { site } : {}),
});
const L3 = (
  cycle: number,
  upkeep: number,
  c: Cost,
  site?: LevelSite,
  extra?: LevelDef['extra'],
): LevelDef => ({
  cycle,
  upkeep,
  cost: c,
  workforceTier: 3,
  ...(extra ? { extra } : {}),
  ...(site ? { site } : {}),
});
const CLOTH_2 = { good: 'cloth', amount: 2 } as const;

/**
 * Index 0 = Stufe 2, Index 1 = Stufe 3 (Anhang 01). Fehlt ein Eintrag: Betrieb nicht ausbaubar.
 * Parameter: Zyklus, Unterhalt, Kosten (Geld, Holz, Werkzeug, Stein), optional Standort.
 * Nur der Fischer verlangt eine fachliche Ware (Stoff für das Netz).
 */
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly LevelDef[]>>> = {
  fisher: [
    { ...L2(24, 7, cost(50, 3, 1, 0), fisherSpacing(2)), extra: CLOTH_2 },
    L3(16, 9, cost(65, 4, 2, 2), fisherSpacing(3), CLOTH_2),
  ],
  hunter: [
    L2(30, 7, cost(85, 1, 1, 0), forest(3, 14)),
    L3(20, 9, cost(88, 2, 1, 2), forest(3, 18)),
  ],
  cattlefarm: [
    L2(12, 13, cost(215, 8, 2, 0), grass(3, 18)),
    L3(8, 17, cost(248, 12, 3, 4), grass(3, 20)),
  ],
  lumberjack: [
    L2(18, 7, cost(85, 0, 1, 0), forest(2, 4)),
    L3(12, 9, cost(88, 0, 1, 2), forest(2, 6)),
  ],
  quarry: [
    L2(36, 13, cost(135, 5, 2, 0), mountain(2, 3)),
    L3(24, 17, cost(148, 8, 3, 3), mountain(2, 4)),
  ],
  sheepfarm: [
    L2(30, 13, cost(165, 5, 1, 0), grass(3, 8)),
    L3(20, 17, cost(188, 8, 2, 3), grass(3, 12)),
  ],
  canefarm: [
    L2(30, 13, cost(165, 5, 1, 0), grass(3, 8)),
    L3(20, 17, cost(188, 8, 2, 3), grass(3, 12)),
  ],
  weaver: [L2(30, 20, cost(190, 8, 2, 0)), L3(20, 26, cost(210, 12, 3, 4))],
  toolmaker: [L2(48, 33, cost(190, 8, 2, 0)), L3(32, 43, cost(210, 12, 3, 4), FIRE_STATION)],
  distillery: [L2(30, 26, cost(265, 8, 2, 3)), L3(20, 34, cost(278, 12, 3, 6), FIRE_STATION)],
  glassworks: [L2(30, 33, cost(340, 10, 3, 5)), L3(20, 43, cost(315, 15, 5, 10), FIRE_STATION)],
};

/** Arbeitsweg: grösster Mittenabstand zwischen Betrieb und Fachkräfte-Haus (Spec R3). */
export const WORKFORCE_RADIUS = 8;
/**
 * Vertragliche Obergrenze in Ticks, bis eine Änderung der laufenden Stufe wirkt; die Umsetzung liest bei
 * jedem Zugriff (Plan P-4), der Wert ist die Zusage nach aussen.
 */
export const LEVEL_RECHECK_TICKS = 10;
