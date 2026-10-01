import type { CrisisKind, CrisisLevel, CrisisLevelDef } from '../types';

/** Krisenstufen (Spec M6 4.1, 4.2): Periodenlänge in Ticks, `null` = keine Krisen. */
export const CRISIS_LEVELS: Record<CrisisLevel, CrisisLevelDef> = {
  off: { name: 'aus', period: null },
  mild: { name: 'mild', period: 1200 },
  normal: { name: 'normal', period: 600 },
};
/** Standard von `createWorld`; hält den Balancing-Lauf bitgleich. */
export const DEFAULT_WORLD_CRISIS_LEVEL: CrisisLevel = 'off';
/** Standard der UI für „Neu" (U1). */
export const DEFAULT_NEW_GAME_CRISIS_LEVEL: CrisisLevel = 'normal';
/** Gewichte in ganzen Prozent, Summe 100; kumuliert in der Reihenfolge fire, storm, boom. */
export const CRISIS_WEIGHTS: Record<CrisisKind, number> = { fire: 50, storm: 25, boom: 25 };
/** Chebyshev-Abstand Zielkachel → Grundfläche, bis zu dem ein brennbares Gebäude getroffen wird. */
export const FIRE_HIT_RADIUS = 2;
/** Verkaufspreis im Boom in Prozent (ganzzahlig wie TAX_LEVELS.pct). */
export const BOOM_PCT = 150;
/** Im aktiven Sturm wächst `progress` sturmanfälliger Betriebe nur bei `tick % STORM_TICK_DIVISOR === 0`. */
export const STORM_TICK_DIVISOR = 2;
/** Ableitungskonstante der Krisen neben 0x9e3779b1 (Aufträge), ADR-010 Nachtrag M6. */
export const CRISIS_SALT = 0x85ebca6b;
