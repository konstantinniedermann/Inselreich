import type { BuildingDefId, Cost, GoodId } from '../types';

export interface LevelDef {
  cycle: number; // ganzzahlig
  upkeep: number; // ganzzahlig, je 100 Ticks
  cost: Cost; // Geld, Holz, Werkzeug, Stein (sofort bezahlt)
  fee: { good: GoodId; amount: number }; // Gebührenware, nicht erstattet
}
/** Index 0 = Stufe 2, Index 1 = Stufe 3. Fehlt ein Eintrag: Betrieb nicht ausbaubar. P3 füllt die Tabelle. */
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly [LevelDef, LevelDef]>>> = {};
