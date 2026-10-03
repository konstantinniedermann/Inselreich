import type { Cost } from '../types';

/** Roden: Wald → Weide, kein Holz (Spec 6). */
export const CLEAR_FOREST_COST: Cost = { money: 10, wood: 0, tools: 0, stone: 0 };
/** Aufforsten: Weide → Wald (Spec 6). */
export const PLANT_FOREST_COST: Cost = { money: 20, wood: 0, tools: 0, stone: 0 };
