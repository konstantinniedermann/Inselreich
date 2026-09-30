import type { TaxLevel, TaxLevelDef, Tier, TierDef } from '../types';
import { UPGRADE_WAIT } from './timing';

/** Steuerfaktor, solange nicht alle Bedürfnisse eines Hauses erfüllt sind. */
export const UNSATISFIED_TAX_FACTOR = 0.5;

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
    upgradeCost: null,
  },
};
export const WIN_CITIZENS = 50;

export const TAX_LEVELS: Record<TaxLevel, TaxLevelDef> = {
  low: { name: 'niedrig', pct: 70, upgradeWait: 150, occupancy: 1 },
  normal: { name: 'normal', pct: 100, upgradeWait: UPGRADE_WAIT, occupancy: 1 },
  high: { name: 'hoch', pct: 130, upgradeWait: null, occupancy: 0.75 },
};
export const DEFAULT_TAX_LEVEL: TaxLevel = 'normal';
