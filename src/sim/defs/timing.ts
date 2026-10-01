/** Echtzeit-Dauer eines Ticks bei Geschwindigkeit 1× (Millisekunden). */
export const TICK_MS = 100;
/** Steuern und Unterhalt werden alle 100 Ticks verbucht. */
export const UPKEEP_INTERVAL = 100;
/** Alle 50 Ticks wächst oder schrumpft ein Haus um einen Einwohner. */
export const GROWTH_INTERVAL = 50;
/** Nach jedem Umschalten der Steuerstufe gesperrt (Ticks). */
export const TAX_SWITCH_LOCK = 300;
/** Ticks ununterbrochener Zufriedenheit, bevor ein Haus aufsteigen darf. */
export const UPGRADE_WAIT = 300;
/** Alle 10 Ticks erholt sich der Verkaufsanteil jedes Guts um einen Prozentpunkt. */
export const SELL_RECOVERY_INTERVAL = 10;
/*
 * Achtung: ORDER_FIRST_TICK, ORDER_PERIOD und ORDER_DURATION liest die Save-Prüfung (`isValidOrder`).
 * Eine Änderung lässt Stände mit laufendem Auftrag bei der Prüfung scheitern und braucht eine
 * Save-Migration (arc42, R61).
 */
/** Tick des ersten Handelsauftrags. */
export const ORDER_FIRST_TICK = 600;
/** Abstand zwischen zwei Auftragsperioden (Ticks). */
export const ORDER_PERIOD = 900;
/** Laufzeit eines Auftrags ab Angebot (Ticks); kürzer als die Periode. */
export const ORDER_DURATION = 600;

/*
 * Achtung: CRISIS_FIRST_TICK, STORM_WARNING, STORM_DURATION, FIRE_OUTAGE und BOOM_DURATION liest die
 * Save-Prüfung (`isValidCrisis`, `isValidOutage`). Eine Änderung lässt Stände mit laufender Krise bei der
 * Prüfung scheitern und braucht eine Save-Migration (Spec M6 9.2, 20.8).
 */
/** Tick der ersten Krisenperiode (4 min bei 1×). */
export const CRISIS_FIRST_TICK = 2400;
/** Vorwarnung vor einem Sturm (Ticks); er wirkt ab Periodenstart + STORM_WARNING + 1. */
export const STORM_WARNING = 200;
/** Wirkdauer eines Sturms (Ticks) mit halber Leistung der sturmanfälligen Betriebe. */
export const STORM_DURATION = 300;
/** Ausfall eines brennenden Gebäudes (Ticks); gilt für alle Gebäude (R74 Entscheid 3). */
export const FIRE_OUTAGE = 200;
/** Dauer eines Booms (Verkaufs-Ticks ab Periodenstart). */
export const BOOM_DURATION = 300;
