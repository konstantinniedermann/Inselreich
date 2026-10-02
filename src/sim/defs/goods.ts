import type { GoodDef, GoodId } from '../types';

export const GOODS: Record<GoodId, GoodDef> = {
  wood: { id: 'wood', name: 'Holz', buy: 10, sell: 4, order: { tier: 1, min: 20, max: 40 } },
  tools: { id: 'tools', name: 'Werkzeug', buy: 40, sell: 15 },
  stone: { id: 'stone', name: 'Stein', buy: 15, sell: 6, order: { tier: 2, min: 10, max: 20 } },
  food: { id: 'food', name: 'Nahrung', buy: 8, sell: 3, order: { tier: 1, min: 10, max: 20 } },
  wool: { id: 'wool', name: 'Wolle', buy: 12, sell: 5, order: { tier: 2, min: 10, max: 20 } },
  cloth: { id: 'cloth', name: 'Stoff', buy: 30, sell: 12, order: { tier: 2, min: 6, max: 12 } },
  cane: { id: 'cane', name: 'Zuckerrohr', buy: 12, sell: 5, order: { tier: 3, min: 10, max: 20 } },
  rum: { id: 'rum', name: 'Rum', buy: 40, sell: 18, order: { tier: 3, min: 6, max: 12 } },
  glass: { id: 'glass', name: 'Glas', buy: 50, sell: 20, order: { tier: 4, min: 4, max: 8 } },
};
export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
/** Untergrenze für den Verkaufsanteil je Gut (in %). */
export const SELL_FLOOR = 30;
/** Abschlag je verkaufter Einheit (Prozentpunkte des Verkaufsanteils). */
export const SELL_DROP = 1;
/** Stückprämie eines Handelsauftrags: `floor(buy × ORDER_PREMIUM)`. */
export const ORDER_PREMIUM = 0.75;
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
  glass: 0,
};
