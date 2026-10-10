/** Echtzeit-Dauer eines Ticks bei Geschwindigkeit 1× (Millisekunden). */
export const TICK_MS = 100;
/** Raten je 100 Ticks; Teiler des Unterhalts-Übertrags; Takt des Tons `coin`. */
export const UPKEEP_INTERVAL = 100;
/** Alle 50 Ticks wächst oder schrumpft ein Haus um einen Einwohner. */
export const GROWTH_INTERVAL = 50;
/** Nach jedem Umschalten der Steuerstufe gesperrt (Ticks). */
export const TAX_SWITCH_LOCK = 300;
/** Ticks ununterbrochener Zufriedenheit, bevor ein Haus aufsteigen darf. */
export const UPGRADE_WAIT = 300;
/** Wartezeit-Faktor des Aufstiegs, solange die Zielstufe ein Güterdefizit hätte (Anhang 01 A.1). */
export const UPGRADE_DEFICIT_WAIT_FACTOR = 2;
/** Fensterlänge der Auslastungs-Glättung: `eff` fällt je Schritt um `floor(eff / EFF_WINDOW)` (Anhang 01 A.1). */
export const EFF_WINDOW = 256;
/** Zielwert der Auslastung in Promille (100 %), wenn ein Betrieb in diesem Schritt produziert (Anhang 01 A.1). */
export const EFF_MAX = 1000;
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

/*
 * Fest in der Kapelle (H-I007): Rum je Fest, Wirkdauer und Abklingzeit ab Festbeginn (Ticks, 1× = 10 Ticks/s).
 * Die verkürzte Aufstiegs-Wartezeit ist `TAX_LEVELS.low.upgradeWait`. Die Save-Prüfung liest `feastAt`
 * nur gegen den Tick, die Werte hier ändern also keine alten Stände.
 */
/** Rum, den ein Fest aus dem Lager verbraucht. */
export const FEAST_RUM = 10;
/** Wirkdauer eines Fests (60 s bei 1×). */
export const FEAST_DURATION = 600;
/** Abklingzeit je Kapelle ab Festbeginn (3 min bei 1×); länger als die Wirkdauer. */
export const FEAST_COOLDOWN = 1800;
/** Sperre nach Erlass, Wechsel oder Aufheben eines Edikts (5 min bei 1×). */
export const EDICT_LOCK = 3000;
