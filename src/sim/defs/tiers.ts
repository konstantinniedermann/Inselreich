import type { TaxLevel, TaxLevelDef, TitheGood, TitheTier, Tier, TierDef } from '../types';
import { UPGRADE_WAIT, UPKEEP_INTERVAL } from './timing';

/** Ganzzahlige Steuereinheit: ein erfülltes Haus zahlt `TAX_UNIT`, ein unerfülltes 1 (Anhang 01 A.1). */
export const TAX_UNIT = 2;
/** Steuerfaktor, solange nicht alle Bedürfnisse eines Hauses erfüllt sind. */
export const UNSATISFIED_TAX_FACTOR = 1 / TAX_UNIT;
/** Teiler des Steuer-Übertrags: Einheiten × Prozent je Geldstück (Anhang 01 A.1). */
export const TAX_CARRY_DIVISOR = UPKEEP_INTERVAL * 100 * TAX_UNIT;

/** Zehnt-Gut je Stufe (I-223): Pioniere zahlen Werkzeug, Siedler Stein. */
export const TITHE_GOOD = { 1: 'tools', 2: 'stone' } as const satisfies Record<
  TitheTier,
  TitheGood
>;
/** Zehnt-Anteil je Stufe in Prozent der Steuer (I-223). */
export const TITHE_PCT: Record<TitheTier, number> = { 1: 100, 2: 10 };
/** Gutseinheiten je 100 Steuereinheiten (I-223). */
export const TITHE_UNITS_PER_100: Record<TitheGood, number> = { tools: 3, stone: 8 };
/** Teiler des Zehnt-Übertrags: Steuer-Teiler × 100 (I-223). */
export const TITHE_CARRY_DIVISOR = TAX_CARRY_DIVISOR * 100;
/** Stufen mit Zehnt, aufsteigend (I-223). */
export const TITHE_TIERS: readonly TitheTier[] = [1, 2];
/** Zehnt-Güter, in fester Reihenfolge (I-223). */
export const TITHE_GOODS: readonly TitheGood[] = ['tools', 'stone'];

export const TIERS: Record<Tier, TierDef> = {
  1: {
    tier: 1,
    name: 'Pioniere',
    maxInhabitants: 4,
    needs: { food: 0.5 },
    services: [],
    tax: 2,
    upgradeCost: { money: 100, wood: 5, tools: 2, stone: 0 },
  },
  2: {
    tier: 2,
    name: 'Siedler',
    maxInhabitants: 8,
    needs: { food: 0.5, cloth: 0.2 },
    services: ['faith'],
    tax: 7,
    upgradeCost: { money: 300, wood: 10, tools: 5, stone: 5 },
  },
  3: {
    tier: 3,
    name: 'Bürger',
    maxInhabitants: 15,
    needs: { food: 0.5, cloth: 0.2, rum: 0.2 },
    services: ['faith', 'school'],
    tax: 14,
    upgradeCost: { money: 600, wood: 15, tools: 8, stone: 10 },
  },
  4: {
    tier: 4,
    name: 'Kaufleute',
    maxInhabitants: 20,
    needs: { food: 0.5, cloth: 0.2, rum: 0.2, glass: 0.1, spice: 0.1 },
    services: ['faith', 'school', 'bath'],
    tax: 22,
    upgradeCost: null,
    requiresWin: true,
    unlockCitizens: null,
  },
};
/** Alle Bevölkerungsstufen in aufsteigender Reihenfolge. */
export const TIER_IDS: readonly Tier[] = [1, 2, 3, 4];
export const WIN_CITIZENS = 50;
/** Zweites Ziel „Handelsstadt“: so viele Einwohner der Stufe 4 (M8 7; Rückfallwert 40). */
export const WIN_MERCHANTS = 60;
/** Drittes Ziel „Gewürzstadt“: so viele Kaufleute, so viele Ticks gehalten (M12). */
export const WIN_SPICE_MERCHANTS = 80;
export const WIN_SPICE_HOLD = 600;

export const TAX_LEVELS: Record<TaxLevel, TaxLevelDef> = {
  low: { name: 'niedrig', pct: 70, upgradeWait: 150, occupancy: 1 },
  normal: { name: 'normal', pct: 100, upgradeWait: UPGRADE_WAIT, occupancy: 1 },
  high: { name: 'hoch', pct: 130, upgradeWait: null, occupancy: 0.75, pctByTier: { 4: 115 } },
};
export const DEFAULT_TAX_LEVEL: TaxLevel = 'normal';
