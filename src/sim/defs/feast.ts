import type { GoodId } from '../types';

/** Festarten einer Kapelle (I-201); Reihenfolge = Anzeigereihenfolge. */
export const FEAST_KIND_IDS = ['ascension', 'harvest', 'market'] as const;
export type FeastKind = (typeof FEAST_KIND_IDS)[number];

export interface FeastKindDef {
  name: string;
  /** Schlüsselreihenfolge = Prüf- und Abbuchreihenfolge, Rum zuerst. */
  cost: Partial<Record<GoodId, number>>;
  /** Wirkt auf Häuser im Kapellenradius oder auf die ganze Insel der Kapelle. */
  scope: 'chapel' | 'island';
  /** Erntefest: Produktionszyklus in Prozent. */
  cyclePct?: number;
  /** Markttag: Verkaufspreis in Prozent. */
  sellPct?: number;
}

export const FEAST_KINDS = {
  ascension: { name: 'Aufstiegsfest', cost: { rum: 10 }, scope: 'chapel' },
  harvest: { name: 'Erntefest', cost: { rum: 10, cloth: 15 }, scope: 'island', cyclePct: 75 },
  market: { name: 'Markttag', cost: { rum: 10, glass: 5 }, scope: 'island', sellPct: 125 },
} as const satisfies Record<FeastKind, FeastKindDef>;
