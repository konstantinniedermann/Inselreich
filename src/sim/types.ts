export type GoodId = 'wood' | 'tools' | 'stone' | 'food' | 'wool' | 'cloth' | 'cane' | 'rum';
export type Terrain = 'water' | 'sand' | 'grass' | 'forest' | 'mountain';
export type BuildingDefId =
  | 'kontor'
  | 'market'
  | 'house'
  | 'fisher'
  | 'lumberjack'
  | 'quarry'
  | 'sheepfarm'
  | 'weaver'
  | 'canefarm'
  | 'distillery'
  | 'chapel'
  | 'school';
export type ServiceId = 'faith' | 'school';
export type Category = 'infrastructure' | 'housing' | 'production' | 'public';
export interface Cost {
  money: number;
  wood: number;
  tools: number;
  stone: number;
}
export type SiteRule =
  | { kind: 'coast' } // ≥1 Wasserkachel 4er-angrenzend
  | { kind: 'adjacent'; terrain: Terrain; min: number } // ≥min Kacheln des Terrains 4er-angrenzend
  | { kind: 'radius'; terrain: Terrain; radius: number; min: number } // ≥min Kacheln im Radius
  | { kind: 'supply' }; // im Radius von Kontor oder Markt
export interface BuildingDef {
  id: BuildingDefId;
  name: string;
  w: number;
  h: number;
  cost: Cost;
  upkeep: number;
  category: Category;
  produces?: GoodId;
  consumes?: GoodId;
  cycle?: number;
  service?: ServiceId;
  serviceRadius?: number;
  supplyRadius?: number;
  site: SiteRule[];
}
export interface OrderDef {
  tier: Tier;
  min: number;
  max: number;
}
export interface GoodDef {
  id: GoodId;
  name: string;
  buy: number;
  sell: number;
  /** Fehlt: kein Auftragsgut. */
  order?: OrderDef;
}
export type Tier = 1 | 2 | 3;
export interface TierDef {
  tier: Tier;
  name: string;
  maxInhabitants: number;
  needs: Partial<Record<GoodId, number>>; // Verbrauch je Einwohner pro 100 Ticks
  services: ServiceId[];
  tax: number; // Steuer je Einwohner pro 100 Ticks
  upgradeCost: Cost | null; // Kosten für Aufstieg auf tier+1
}
export type BuildingState = 'ok' | 'waitingInput' | 'storageFull' | 'notConnected';
export interface HouseState {
  tier: Tier;
  inhabitants: number;
  demand: Partial<Record<GoodId, number>>;
  satisfied: Partial<Record<GoodId, boolean>>;
  services: Partial<Record<ServiceId, boolean>>;
  satisfiedSince: number;
  supplied: boolean;
}
export interface Building {
  id: number;
  defId: BuildingDefId;
  x: number;
  y: number;
  connected: boolean;
  progress: number;
  state: BuildingState;
  house?: HouseState;
}
export interface Tile {
  terrain: Terrain;
  buildingId: number | null;
  road: boolean;
}
export type TaxLevel = 'low' | 'normal' | 'high';
export interface TaxLevelDef {
  name: string;
  /** Steuer in % der Grundsteuer (ganzzahlig). */
  pct: number;
  /** Ticks ununterbrochener Zufriedenheit bis zum Aufstieg; `null` sperrt den Aufstieg. */
  upgradeWait: number | null;
  /** Anteil der Höchstbelegung, auf den ein Haus zielt. */
  occupancy: number;
}
export interface Order {
  period: number;
  good: GoodId;
  amount: number;
  reward: number;
  /** Letzter Tick, an dem geliefert werden kann. */
  due: number;
}
export interface World {
  version: 2;
  seed: number;
  width: number;
  height: number;
  tick: number;
  tiles: Tile[];
  buildings: Record<number, Building>;
  nextBuildingId: number;
  kontorId: number;
  stock: Record<GoodId, number>;
  money: number;
  stats: { taxes: number; upkeep: number };
  won: boolean;
  taxLevel: TaxLevel;
  taxLockedUntil: number;
  sellPct: Record<GoodId, number>;
  order: Order | null;
}
export type Result = { readonly ok: true } | { readonly ok: false; readonly reason: string };
export const ok: Result = Object.freeze({ ok: true as const });
export const fail = (reason: string): Result => ({ ok: false, reason });
