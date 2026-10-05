import { hash2 } from '../sim/noise';
import { PALETTE, rgbOfCss } from './palette';

// variants.ts — Gebäudevarianten (H-R7, G1). Reine Daten und Funktionen, kein DOM, kein Zufall ausser `hash2`.
// Art Direction: Die Silhouette ist die Identität, die Oberfläche trägt die Varianz. Eine Variante ändert nur
// Farbtöne (Wand, Dach, Kamin), Fensterläden und Material; nie Dachform, Firstrichtung, Höhe oder Umriss.

/**
 * Zahl der Varianten je Typ und Stufe. Obergrenze Speicher: Der Sprite-Cache hält je Typ, Stufe, Variante, Zoom
 * und DPR ein Sprite. Die volle Matrix (alle Typen und Stufen x 4 Varianten) belegt bei Zoom 1 / DPR 2 16,7 MB,
 * bei Zoom 2 / DPR 2 aber 80,9 MB (M12 T02: mit Kontor II und Gewürzplantage, vorher 76,1 MB) und liegt damit
 * 26 % über `SPRITE_CACHE_MAX_BYTES` (64 MB, per LRU gedeckelt, unverändert; Test-Schranke 1,30). Ein Bild
 * 1280 x 800 zeigt bei Zoom 2 rund 250 Kacheln (1280 x 800 / (128 x 64 / 2)); alle 96 Kombinationen (24 Typ-
 * und Stufenfälle x 4 Varianten) belegen etwa 269 Kacheln (96 x 2,8, Faktor wie bisher 224 / 80) und könnten also zugleich im Bild sein. Das ist selten (so viele verschiedene Typen, Stufen und
 * Varianten gleichzeitig), tritt es ein, verdrängt die LRU Einträge desselben Frames (LRU-Thrash, siehe
 * `docs/beobachtungen.md`). Mehr als 4 Varianten trennt Betrachter kaum noch, kostet aber linear Speicher.
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

/**
 * Variante 0 ist der bisherige Look (bytegleich); die übrigen verschieben Töne deutlich, aber innerhalb der
 * Farbfamilie des Typs (Mischanteile 13 bis 26 %, Blindtest H-R7: 5 bis 7 % waren bei Standard-Zoom kaum zu sehen).
 * 1 heller und kühler, 2 dunkler Putz bei hellem Dach, 3 warm und erdig. Die Wandtönung gilt für alle Flächen des
 * Körpers, trägt also auch Typen ohne Hausdach (Fischerhütte, Glashütte, Steinbruch, Marktplatz, Weberei).
 */
export const VARIANT_LOOKS: readonly VariantLook[] = [
  { wall: null, roof: null, chimney: null, shutters: null },
  {
    wall: ['#ffffff', 0.17],
    roof: [PALETTE.roofSlate, 0.26],
    chimney: [PALETTE.roofTerracotta, 0.55],
    shutters: PALETTE.wallTimber,
  },
  {
    wall: ['#000000', 0.13],
    roof: ['#ffffff', 0.14],
    chimney: ['#000000', 0.3],
    shutters: PALETTE.roofCopper,
  },
  {
    wall: [PALETTE.earth, 0.22],
    roof: [PALETTE.earth, 0.24],
    chimney: ['#ffffff', 0.25],
    shutters: null,
  },
];

/** Anteil der Sättigung (HSV) des Ausgangstons, den eine Variante mindestens behält (Typ-Identität, Blindtest H-R7). */
export const KEEP_SATURATION = 0.9;

const hsvSat = (r: number, g: number, b: number): number => {
  const mx = Math.max(r, g, b);
  return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
};

/**
 * Holt die Sättigung eines gemischten Tons auf mindestens `KEEP_SATURATION` der Sättigung des Ausgangstons zurück
 * (Helligkeit bleibt), damit Mischen mit Weiss oder Erde kräftige Töne nicht auswäscht.
 */
export function keepSaturation(orig: string, mixed: string): string {
  const o = rgbOfCss(orig),
    m = rgbOfCss(mixed);
  const so = hsvSat(o[0]!, o[1]!, o[2]!),
    sm = hsvSat(m[0]!, m[1]!, m[2]!);
  const target = so * KEEP_SATURATION;
  if (sm >= target || sm === 0) return mixed;
  const mx = Math.max(m[0]!, m[1]!, m[2]!);
  const k = target / sm;
  return `rgb(${m.map((c) => Math.min(255, Math.max(0, Math.round(mx - (mx - c) * k)))).join(',')})`;
}
