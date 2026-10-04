import { valueNoise } from '../sim/noise';
import { LIGHT, smoothstep, toneStep } from './light';
import { PALETTE, mixHex, rgbOfCss } from './palette';

// dunes.ts — Dünenfelder als lesbare Sandformen (H-R12, Stilrahmen D7/S2/S3). Reine Mathematik, kein Canvas, keine
// Welt: der Aufrufer reicht den Küstenwert `s` (Kacheln, landeinwärts +) und dessen Gradienten durch. Die Kämme sind
// Höhenlinien einer Phase p(s) und laufen darum automatisch küstenparallel; die Phase wird längs verwirbelt.

/** Spec 5.1: sandWet bei 0 ≤ s < 0,18 (gleicher Wert wie in terrain.ts). */
export const WET_SAND = 0.18;
/** Ab diesem Küstenwert (≥ 1 Kachel hinter dem nassen Saum) darf eine Düne stehen; davor ist alles 0. */
export const DUNE_ONSET = WET_SAND + 1;
/** Abstand der Kämme quer zur Küste (Kacheln). */
export const DUNE_LAMBDA = 2.4;
/** Kammlage im Profil (Anteil der Periode ab dem Trog, seewärts → landeinwärts): lange Luv-, kurze Leeseite. */
export const DUNE_PROFILE_CREST = 0.7;
/** Tonstufe von sandDry auf der 0…4-Skala der Tonleiter (wie `TONE_FLAT` im Massiv). */
export const DUNE_TONE_FLAT = 2;
/** Obergrenze für Ton samt Rippeln und Korn: sandDry plus 1 Stufe (Stilrahmen Dünen (2)). */
export const DUNE_TONE_MAX = DUNE_TONE_FLAT + 1;

const ONSET_RAMP = 0.9; // Breite (Kacheln) des weichen Einsatzes hinter DUNE_ONSET
const WARP_AMP = 0.8; // Phasenverwirbelung in Perioden (Kämme mäandern, bleiben aber küstenparallel)
const CREST_HALF = 0.1; // Halbbreite des Kamms in Perioden
const GRAIN_AMP = 0.06; // Korn: höchstens ±0,06 Stufen
const RIPPLE_AMP = 0.18; // Rippeln: höchstens ±0,18 Stufen
const RIPPLE_LAMBDA = 0.22; // Rippelabstand (Kacheln)
const TONE_GAIN = 1.6; // Stufen je Hanggefälle · Lichtanteil
// S6: höchstens 1 Stufe Unterschied innerhalb einer Kachel → der Ton bleibt in [1,5; 3,5), also nur Stufen 2 und 3
const TONE_MIN = 1.55;
const BEACH_NARROW = 1.5; // trockene Strandbreite (Kacheln), darunter bleibt der Sand glatt
const BEACH_OK = 2.2; // ab hier trägt der Strand voll
const BEACH_MID = 3; // K3: ab hier öffnet die Maske mindestens zu `MASK_FLOOR` (mittlere Strände tragen einzelne Kämme)
const MASK_FLOOR = 0.45;
const BEACH_WIDE = 4; // ab hier ist die Maske zu 80 % offen (breite Strände tragen Dünen)
const END_FADE = 1; // Kacheln, auf denen die Dünen vor dem Strandende auslaufen
// Drehungen (rad) der Rauschfelder: keine achsparallelen Muster
const ROT_MASK = 0.7,
  ROT_ENV = 1.1,
  ROT_WARP = 0.4,
  ROT_RIP = 0.9;
/** Wie `rotNoise` (gleiches Ergebnis), aber Sinus und Cosinus der festen Drehwinkel nur einmal (Frame-Budget je Knoten). */
const ROT_TRIG = new Map<number, readonly [number, number]>(
  [ROT_MASK, ROT_ENV, ROT_WARP, ROT_RIP].map((r) => [r, [Math.cos(r), Math.sin(r)] as const]),
);
function rotNoise(seed: number, fx: number, fy: number, freq: number, rot: number): number {
  const [co, si] = ROT_TRIG.get(rot)!;
  const c = co * freq,
    s = si * freq;
  return valueNoise(seed, c * fx - s * fy, s * fx + c * fy);
}
/** Gewicht des Windes im Dünenlicht: Luvseite blickt immer zum Licht, egal wie die Küste zur Sonne liegt. */
const WIND_LIGHT = 0.85;
const SUN_LIGHT = 0.3;

export interface DuneSample {
  /** Höhe 0…1 (mal Amplitude im Aufrufer); 0 für s < DUNE_ONSET. */
  h: number;
  /** Kontinuierlicher Tonwert 0…4 aus Hanggefälle · Licht (nur Dünenform), ≤ DUNE_TONE_MAX − Rippeln − Korn. */
  tone: number;
  /** Kammstärke 0…1 (scharfe Kammlinie, Knick im Profil). */
  crest: number;
  /** Rippeln als Tonversatz in Stufen (±RIPPLE_AMP, küstenparallel, nicht auf der Leeseite). */
  ripple: number;
  /** Sandkorn als Tonversatz in Stufen (±GRAIN_AMP). */
  grain: number;
  /** Rippelgewicht 0…1 (trockener Sand, nicht Lee) und Phasenversatz in Perioden — für `rippleOf` je Pixel. */
  rip: number;
  rwarp: number;
}

/** Rippeln (Stufen) je Pixel aus Knotenwerten: `rip` Gewicht, `s` Küstenwert am Pixel, `rwarp` Phasenversatz. */
export const rippleOf = (rip: number, s: number, rwarp: number): number =>
  RIPPLE_AMP * rip * Math.sin(2 * Math.PI * (s / RIPPLE_LAMBDA + rwarp));

const FLAT = (): DuneSample => ({
  h: 0,
  tone: DUNE_TONE_FLAT,
  crest: 0,
  ripple: 0,
  grain: 0,
  rip: 0,
  rwarp: 0,
});

const sstep = (a: number, b: number, x: number): number => {
  const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
  return t * t * (3 - 2 * t);
};

/**
 * Düne an einem Kachelpunkt. `s` Küstenwert (landeinwärts +), `(gx, gy)` sein Gradient im Kachelraum (≈ Einheitsvektor
 * landeinwärts), `beach` die trockene Strandbreite an dieser Stelle (Kacheln; Standard unbegrenzt) — schmale Strände
 * (< 1,5) bleiben glatt, kurz vor dem Strandende (s − WET_SAND → beach) laufen die Dünen aus.
 */
export function duneSample(
  seed: number,
  fx: number,
  fy: number,
  s: number,
  gx: number,
  gy: number,
  beach = Infinity,
): DuneSample {
  const dry = sstep(WET_SAND + 0.1, WET_SAND + 0.6, s);
  const gl = Math.hypot(gx, gy);
  if (dry <= 0 || gl < 1e-6) return FLAT();
  const gn = (valueNoise(seed + 415, fx * 5, fy * 5) - 0.5) * 2 * GRAIN_AMP * dry;
  const nx = gx / gl,
    ny = gy / gl;

  // Gewicht: Einsatz, Strandbreite, Strandende, Maske (~Hälfte frei), Hüllkurve längs (Dünen setzen aus)
  let w = 0;
  if (s > DUNE_ONSET) {
    w = sstep(DUNE_ONSET, DUNE_ONSET + ONSET_RAMP, s);
    if (beach !== Infinity) {
      w *= sstep(BEACH_NARROW, BEACH_OK, beach) * sstep(0, END_FADE, beach + WET_SAND - s);
    }
    if (w > 0) {
      let mask = sstep(0.46, 0.58, rotNoise(seed + 411, fx, fy, 0.06, ROT_MASK));
      if (beach !== Infinity) {
        mask = Math.max(mask, MASK_FLOOR * sstep(2, BEACH_MID, beach));
        mask = Math.max(mask, 0.8 * sstep(BEACH_MID + 0.5, BEACH_WIDE, beach));
      }
      w *= mask;
      if (w > 0) w *= sstep(0.36, 0.56, rotNoise(seed + 412, fx, fy, 0.11, ROT_ENV));
    }
  }

  // Phase: Küstenabstand / Wellenlänge + verwirbelte Verschiebung (Gradient des Rauschens per Differenz); ohne Gewicht
  // bleibt die Düne flach, dann entfällt die Phase (Frame-Budget: drei Rauschaufrufe je Knoten)
  let p = 0,
    px = 0,
    py = 0;
  if (w > 0) {
    const E = 0.1;
    const w0 = rotNoise(seed + 413, fx, fy, 0.09, ROT_WARP);
    const wx = (rotNoise(seed + 413, fx + E, fy, 0.09, ROT_WARP) - w0) / E;
    const wy = (rotNoise(seed + 413, fx, fy + E, 0.09, ROT_WARP) - w0) / E;
    p = (s - DUNE_ONSET) / DUNE_LAMBDA + WARP_AMP * (w0 - 0.5);
    px = gx / DUNE_LAMBDA + WARP_AMP * wx;
    py = gy / DUNE_LAMBDA + WARP_AMP * wy;
  }
  const f = p - Math.floor(p);
  const c = DUNE_PROFILE_CREST;

  // Asymmetrisches Profil: Luv (f < c) wächst langsam, Kamm mit Knick, Lee fällt steil
  let hh: number, dhdf: number;
  if (f < c) {
    const u = f / c;
    hh = Math.pow(u, 1.8);
    dhdf = (1.8 * Math.pow(u, 0.8)) / c;
  } else {
    const v = (f - c) / (1 - c);
    hh = Math.pow(1 - v, 1.5);
    dhdf = (-1.5 * Math.sqrt(1 - v)) / (1 - c);
  }
  const h = w * hh;
  const tent = Math.max(0, 1 - Math.abs(f - c) / CREST_HALF);
  const crest = w * tent * tent * (3 - 2 * tent);

  // Licht: Gefälle gegen eine Lichtrichtung, die zur Hälfte der Wind (seewärts) ist → Luv hell, Lee dunkel
  const dhx = w * dhdf * px,
    dhy = w * dhdf * py;
  const lx = SUN_LIGHT * LIGHT.x - WIND_LIGHT * nx,
    ly = SUN_LIGHT * LIGHT.y - WIND_LIGHT * ny;
  const lit = -(dhx * lx + dhy * ly);
  const body = DUNE_TONE_MAX - RIPPLE_AMP - GRAIN_AMP;
  const tone = Math.max(TONE_MIN, Math.min(body, DUNE_TONE_FLAT + TONE_GAIN * lit));

  // Rippeln: quer zum Wind (Phase aus s), nur Luv/flach, auf glattem Sand schwächer
  const slopeN = dhx * nx + dhy * ny; // > 0 Luv (steigt landeinwärts), < 0 Lee
  const rip =
    dry *
    (0.55 + 0.45 * Math.min(1, w)) *
    (1 - sstep(0.1, 0.5, -slopeN)) *
    (1 - sstep(1.0, 1.6, slopeN));
  const rwarp = 0.8 * (rotNoise(seed + 414, fx, fy, 0.35, ROT_RIP) - 0.5);
  const ripple = rippleOf(rip, s, rwarp);

  return { h, tone, crest, ripple, grain: gn, rip, rwarp };
}

// ---------- Kanten und Kammakzent je Pixel (K1, K2) ----------

/** Kammakzent: dunkle Linie im Lee hinter dem Kamm, höchstens 0,5 Stufe (Textur unter einer Stufe, zählt nicht für S6). */
export const DUNE_ACCENT = 0.5;
/** Ton, ab dem die Luvseite voll auf Stufe „sandDry plus 1“ steht (weiche Fusskante läuft von DUNE_TONE_FLAT bis hier). */
export const DUNE_LIFT_FULL = 2.7;
/** Breite des Akzents in Ausgabe-px hinter der harten Kante (dünner Strich, kein Band). */
export const DUNE_ACCENT_PX = 1.5;
/** Schattenfarbe des Akzents: kühl (rockDark ↔ waterDeep), die Sandfarbe mischt dorthin statt zu Grau. */
export const DUNE_SHADOW: readonly [number, number, number] = rgbOfCss(
  mixHex(PALETTE.rockDark, PALETTE.waterDeep, 0.5),
);
const EDGE_TONE = 2.5; // Stufengrenze, an der die Kammkante kippt

/**
 * Stufung der Düne je Pixel. `t` Tonwert (interpoliert), `dn` sein Gefälle landeinwärts (Stufen je Kachel), `hw` die
 * schmale Kantenhalbbreite des Rasters (`toneHalfWidth`), `gpx` das Tongefälle je Ausgabepixel. Liefert `lift` 0…1
 * (Stufe 2 → 3) und `accent` 0…DUNE_ACCENT. Steigt der Ton landeinwärts (Luvseite), läuft die Stufe weich und breit
 * hinauf (Fusskante, ganze Luvflanke); fällt er (Kamm → Lee), kippt sie hart, und der Akzent ist ein Strich von
 * DUNE_ACCENT_PX Ausgabepixeln Breite unmittelbar hinter dieser Kante (Abstand aus Tonabstand / Gefälle je px).
 * `out` wird wiederverwendet (kein Objekt je Pixel).
 */
export function duneShade(
  t: number,
  dn: number,
  hw: number,
  gpx: number,
  out: { lift: number; accent: number } = { lift: 0, accent: 0 },
): { lift: number; accent: number } {
  const c = smoothstep(0.1, -0.5, dn); // 0 steigend … 1 fallend
  const wide = smoothstep(DUNE_TONE_FLAT, DUNE_LIFT_FULL, t);
  const hard = Math.max(0, Math.min(1, toneStep(t, hw) - DUNE_TONE_FLAT));
  const px = gpx > 1e-6 && t <= EDGE_TONE ? (EDGE_TONE - t) / gpx : Infinity; // Abstand hinter der Kante in px
  out.lift = wide + (hard - wide) * c;
  out.accent = c * DUNE_ACCENT * Math.max(0, 1 - px / DUNE_ACCENT_PX);
  return out;
}
