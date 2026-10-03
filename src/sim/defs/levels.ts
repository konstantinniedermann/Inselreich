import type { BuildingDefId, Cost, GoodId } from '../types';

export interface LevelDef {
  cycle: number; // ganzzahlig
  upkeep: number; // ganzzahlig, je 100 Ticks
  cost: Cost; // Geld, Holz, Werkzeug, Stein (sofort bezahlt)
  fee: { good: GoodId; amount: number }; // Gebührenware, nicht erstattet
}
const T = (
  cycle: number,
  upkeep: number,
  money: number,
  wood: number,
  tools: number,
  stone: number,
  good: GoodId,
  amount: number,
): LevelDef => ({ cycle, upkeep, cost: { money, wood, tools, stone }, fee: { good, amount } });

/**
 * Index 0 = Stufe 2, Index 1 = Stufe 3 (Anhang 01 A.4). Fehlt ein Eintrag: Betrieb nicht ausbaubar.
 * `hunter`/`cattlefarm` setzt T09.
 * Parameter von T: Zyklus, Unterhalt, Geld, Holz, Werkzeug, Stein, Gebührenware, Gebührenmenge.
 */
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly [LevelDef, LevelDef]>>> = {
  fisher: [T(24, 7, 50, 3, 1, 0, 'cloth', 2), T(16, 9, 75, 4, 2, 0, 'rum', 2)],
  lumberjack: [T(18, 7, 25, 0, 1, 0, 'cloth', 2), T(12, 9, 38, 0, 1, 0, 'rum', 2)],
  quarry: [T(36, 13, 75, 5, 2, 0, 'cloth', 2), T(24, 17, 113, 8, 3, 0, 'rum', 2)],
  sheepfarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
  canefarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
  weaver: [T(30, 20, 100, 8, 2, 0, 'cloth', 3), T(20, 26, 150, 12, 3, 0, 'rum', 3)],
  toolmaker: [T(48, 33, 100, 8, 2, 0, 'cloth', 3), T(32, 43, 150, 12, 3, 0, 'rum', 3)],
  distillery: [T(30, 26, 125, 8, 2, 3, 'cloth', 3), T(20, 34, 188, 12, 3, 4, 'rum', 3)],
  glassworks: [T(30, 33, 150, 10, 3, 5, 'cloth', 3), T(20, 43, 225, 15, 5, 8, 'rum', 3)],
};
