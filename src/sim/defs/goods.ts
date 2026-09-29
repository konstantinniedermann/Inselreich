import type { GoodDef, GoodId } from '../types';

export const GOODS: Record<GoodId, GoodDef> = {
  wood: { id: 'wood', name: 'Holz', buy: 10, sell: 4 },
  tools: { id: 'tools', name: 'Werkzeug', buy: 40, sell: 15 },
  stone: { id: 'stone', name: 'Stein', buy: 15, sell: 6 },
  food: { id: 'food', name: 'Nahrung', buy: 8, sell: 3 },
  wool: { id: 'wool', name: 'Wolle', buy: 12, sell: 5 },
  cloth: { id: 'cloth', name: 'Stoff', buy: 30, sell: 12 },
  cane: { id: 'cane', name: 'Zuckerrohr', buy: 12, sell: 5 },
  rum: { id: 'rum', name: 'Rum', buy: 40, sell: 18 },
};
export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
export const STORAGE_CAP = 100;
export const START_MONEY = 5000;
export const START_STOCK: Record<GoodId, number> = {
  wood: 40,
  tools: 20,
  stone: 10,
  food: 20,
  wool: 0,
  cloth: 0,
  cane: 0,
  rum: 0,
};
