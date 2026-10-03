import { hash2 } from '../sim/noise';
import { PALETTE } from './palette';

// variants.ts — Gebäudevarianten (H-R7, G1). Reine Daten und Funktionen, kein DOM, kein Zufall ausser `hash2`.
// Art Direction: Die Silhouette ist die Identität, die Oberfläche trägt die Varianz. Eine Variante ändert nur
// Farbtöne (Wand, Dach, Kamin), Fensterläden und Material; nie Dachform, Firstrichtung, Höhe oder Umriss.

/**
 * Zahl der Varianten je Typ und Stufe. Obergrenze Speicher: Der Sprite-Cache hält je Typ, Stufe, Variante, Zoom
 * und DPR ein Sprite. Die volle Matrix (alle Typen und Stufen x 4 Varianten) belegt bei Zoom 1 / DPR 2 16,7 MB,
 * bei Zoom 2 / DPR 2 aber 66,7 MB und liegt damit knapp über `SPRITE_CACHE_MAX_BYTES` (64 MB). Das ist kein Thrash:
 * Ein Bild 1280 x 800 zeigt bei Zoom 2 höchstens 125 Kacheln, also nie alle 80 Kombinationen zugleich (Test AK7:
 * die 40 grössten Sprites passen ins Limit); die LRU verdrängt nur, was nicht mehr im Bild ist. Mehr als 4 Varianten
 * trennt Betrachter kaum noch, kostet aber linear Speicher; bei grösseren Fenstern oder Zoom-Stufen neu abwägen.
 */
export const VARIANT_COUNT = 4;

/** Salz, damit die Variante nicht mit anderen `hash2`-Nutzern (Wege, Bäume, Gelände) gleich läuft. */
const VARIANT_SALT = 5113;

/** Variante eines Gebäudes: reine Funktion von Welt-Seed und Position (kein Sim-Zufall, kein Save-Feld). */
export const variantOf = (seed: number, x: number, y: number): number =>
  Math.min(VARIANT_COUNT - 1, Math.floor(hash2(seed + VARIANT_SALT, x, y) * VARIANT_COUNT));

/** Mischung `[Zielfarbe, Anteil]`. */
export type Mix = readonly [string, number];

export interface VariantLook {
  /** Wandtönung (alle Flächen, kleiner Abstand), `null` = unverändert. */
  wall: Mix | null;
  /** Zusätzliche Dachtönung (Ziegelton), `null` = unverändert. */
  roof: Mix | null;
  /** Kaminfarbe: Mischung mit der Grundfarbe, `null` = unverändert. */
  chimney: Mix | null;
  /** Fensterläden (Hausstufen 2 und 3): Farbe oder `null`. */
  shutters: string | null;
}

/** Variante 0 ist der bisherige Look (bytegleich); die übrigen verschieben nur Töne. */
export const VARIANT_LOOKS: readonly VariantLook[] = [
  { wall: null, roof: null, chimney: null, shutters: null },
  {
    wall: ['#ffffff', 0.05],
    roof: ['#000000', 0.12],
    chimney: [PALETTE.roofTerracotta, 0.55],
    shutters: PALETTE.wallTimber,
  },
  {
    wall: ['#000000', 0.05],
    roof: ['#ffffff', 0.1],
    chimney: ['#000000', 0.25],
    shutters: PALETTE.roofCopper,
  },
  {
    wall: [PALETTE.earth, 0.07],
    roof: [PALETTE.earth, 0.2],
    chimney: ['#ffffff', 0.2],
    shutters: null,
  },
];
