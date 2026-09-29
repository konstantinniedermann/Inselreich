import type { Tier, TierDef } from '../types';

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
    needs: { food: 0.5, cloth: 0.25 },
    services: ['faith'],
    tax: 3,
    upgradeCost: { money: 300, wood: 10, tools: 5, stone: 5 },
  },
  3: {
    tier: 3,
    name: 'Bürger',
    maxInhabitants: 15,
    needs: { food: 0.5, cloth: 0.25, rum: 0.25 },
    services: ['faith', 'school'],
    tax: 5,
    upgradeCost: null,
  },
};
export const WIN_CITIZENS = 50;
