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
