export type GoodId =
  'wood' | 'tools' | 'stone' | 'food' | 'wool' | 'cloth' | 'cane' | 'rum' | 'glass';
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
  | 'school'
  | 'toolmaker'
  | 'firestation'
  | 'bathhouse'
  | 'glassworks'
  | 'townhall'
  | 'hunter'
  | 'cattlefarm';
export type ServiceId = 'faith' | 'school' | 'bath';
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
  | { kind: 'radius'; terrain: Terrain; radius: number; min: number; free?: true } // ≥min Kacheln im Radius; `free`: nur unbebaute Kacheln
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
  /** Inputs, je 1 Einheit je Zyklus, atomar entnommen (M8 5.3). */
  consumes?: readonly GoodId[];
  cycle?: number;
  service?: ServiceId;
  serviceRadius?: number;
  supplyRadius?: number;
  /** Kann bei einem Brand getroffen werden (M6). */
  flammable?: boolean;
  /** Produziert im Sturm nur halb so schnell (M6). */
  stormAffected?: boolean;
  /** Schützt Gebäude im Radius vor Brand (M6). */
  fireProtection?: boolean;
  /** Produziert nur mit erreichbarem Dienst dieser Art (M10 5.5). */
  requiresService?: ServiceId;
  /** Höchstzahl gleichzeitig stehender Gebäude dieser Art (M10 5.1). */
  maxCount?: { n: number; reason: string };
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
export type Tier = 1 | 2 | 3 | 4;
export interface TierDef {
  tier: Tier;
  name: string;
  maxInhabitants: number;
  needs: Partial<Record<GoodId, number>>; // Verbrauch je Einwohner pro 100 Ticks
  services: ServiceId[];
  tax: number; // Steuer je Einwohner pro 100 Ticks
  upgradeCost: Cost | null; // Kosten für Aufstieg auf tier+1
  /** Aufstieg auf diese Stufe erst nach `won` (M8 4.2). */
  requiresWin?: boolean;
  /** Hebel: frei ab so vielen Bürgern+; `null` = nur nach dem Sieg (M8 4.4). */
  unlockCitizens?: number | null;
}
export type BuildingState =
  'ok' | 'waitingInput' | 'storageFull' | 'notConnected' | 'burning' | 'noService' | 'noForest';
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
  /** Letzter Ausfall-Tick; nur bei state 'burning'. */
  outageUntil?: number;
  /** Auslastung in Promille × `EFF_WINDOW` (0 … 256 000); fehlt = 256 000 (volle Auslastung). */
  eff?: number;
  /** Ausbaustufe; fehlt = Stufe 1. */
  level?: 2 | 3;
  /** Beginn des letzten Fests (Tick); nur an der Kapelle, fehlt = noch nie gefeiert. */
  feastAt?: number;
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
export type CrisisLevel = 'off' | 'mild' | 'normal';
export interface CrisisLevelDef {
  /** Anzeige: aus | mild | normal */
  name: string;
  /** Ticks je Periode; null = keine Krisen. */
  period: number | null;
}
export type CrisisKind = 'fire' | 'storm' | 'boom';
export type FireOutcome = 'burning' | 'extinguished' | 'miss';
export interface Crisis {
  period: number;
  kind: CrisisKind;
  /** Erster Tick mit Wirkung. */
  from: number;
  /** Letzter Tick mit Wirkung; am Ende dieses Schritts entfernt. */
  until: number;
  /** Nur boom. */
  good?: GoodId;
  /** Nur fire; fehlt ohne brennbares Gebäude. */
  tile?: { x: number; y: number };
  /** Nur fire; fehlt bei 'miss'. */
  target?: number;
  /** Nur fire. */
  outcome?: FireOutcome;
}
export type UnlockId = 'U0' | 'U1' | 'U2' | 'U3' | 'U4' | 'U5' | 'U6';
export type UnlockFunction = 'forest' | 'orders' | 'goodLocks' | 'upgrade2' | 'upgrade3';
export type UnlockTrigger =
  | { kind: 'start' }
  | { kind: 'houses'; min: number }
  | { kind: 'tierWish'; tier: Tier }
  | { kind: 'tierReached'; tier: Tier }
  | { kind: 'tierOpen'; tier: Tier };
export interface UnlockDef {
  id: UnlockId;
  trigger: UnlockTrigger;
  buildings: readonly BuildingDefId[];
  goods: readonly GoodId[];
  functions: readonly UnlockFunction[];
  lockText: string; // Platzhalter {min}, {max}; '' nur bei U0
  whenText: string; // Platzhalter {min}, {max}, {WIN_CITIZENS}; '' nur bei U0
  notice: string; // '' nur bei U0
  tip: string;
}
export interface GoodLock {
  tier: Tier;
  good: GoodId;
}
export interface World {
  version: 6;
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
  /** Zweites Ziel „Handelsstadt“ erreicht (M8 7); wird nie zurückgesetzt. */
  wonMerchants: boolean;
  taxLevel: TaxLevel;
  taxLockedUntil: number;
  sellPct: Record<GoodId, number>;
  order: Order | null;
  crisisLevel: CrisisLevel;
  crisis: Crisis | null;
  /** Freigeschaltete Einträge in UNLOCK_IDS-Reihenfolge, monoton (M10 4). */
  unlocked: UnlockId[];
  /** Ausgabesperren, sortiert nach Stufe, dann GOOD_IDS-Index, ohne Doppelte (M10 5.3). */
  goodLocks: GoodLock[];
  /** Stufen mit Aufstiegsstopp, aufsteigend (M10 5.4). */
  upgradeStops: Tier[];
  /** Steuer-Übertrag in Einheiten, 0 … TAX_CARRY_DIVISOR − 1 (M11 3.1). */
  taxCarry: number;
  /** Unterhalts-Übertrag, 0 … UPKEEP_INTERVAL − 1 (M11 3.1). */
  upkeepCarry: number;
}
export type Result = { readonly ok: true } | { readonly ok: false; readonly reason: string };
export const ok: Result = Object.freeze({ ok: true as const });
export const fail = (reason: string): Result => ({ ok: false, reason });
