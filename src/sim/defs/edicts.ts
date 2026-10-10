// Spielwerte der Edikte (M13-E1, Spec §4). Änderung nur per Ruling (Spec §12 P-5);
// der Balancing-Test muss grün bleiben.
import type { EdictDef, EdictId } from '../types';

export const EDICTS: Readonly<Record<EdictId, EdictDef>> = {
  saving: {
    id: 'saving',
    name: 'Sparen',
    upkeepPct: 80,
    taxPoints: 7,
    buyPct: 100,
    growthInterval: null,
    upgradeWait: null,
  },
  trade: {
    id: 'trade',
    name: 'Handel',
    upkeepPct: 100,
    taxPoints: 0,
    buyPct: 80,
    growthInterval: null,
    upgradeWait: null,
  },
  welfare: {
    id: 'welfare',
    name: 'Wohlfahrt',
    upkeepPct: 100,
    taxPoints: 5,
    buyPct: 100,
    growthInterval: 40,
    upgradeWait: 200,
  },
};
/** Kartenfolge. */
export const EDICT_IDS: readonly EdictId[] = ['saving', 'trade', 'welfare'];
export const EDICT_COST = 600;
/** Weltflagge, gelesen als world[EDICT_UNLOCK] === true. */
export const EDICT_UNLOCK = 'won' as const;
