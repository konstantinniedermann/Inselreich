export const DAY_TICKS = 6000; // ein Tag = 10 Minuten bei 1x
export const NIGHT_MAX_ALPHA = 0.2; // Helligkeit nie unter 80 %
export const NIGHT_COLOR = '10, 20, 60';

/** Deckkraft der Nacht-Tönung: 0 bei Tick 0, maximal bei einem halben Tag. */
export function dayNightAlpha(tick: number): number {
  return (NIGHT_MAX_ALPHA * (1 - Math.cos((2 * Math.PI * tick) / DAY_TICKS))) / 2;
}
