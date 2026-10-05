import { valueNoise } from '../sim/noise';
import { LIGHT, smoothstep } from './light';
import type { Field } from './terrainField';

// dunes.ts — Dünen auf trockenem Sand (H-R12b, Kurz-Spec 2026-10-05). Reine Mathematik, ohne Canvas.
//
// Grundsatz „Malpfad durchgehend stetig" (M1–M6): Die Dünenform ist ein schiefer Sinus über dem GEGLÄTTETEN
// Küstenwert s̃ (Kämme = Höhenlinien von s̃, also küstenparallel). Aus dem Gefälle gegen das Licht entsteht ein
// stetiger Tonwert je Rasterknoten; scharf wird er erst durch `toneStep` je Pixel (terrain.ts). Die Präsenz ist
// ein Produkt stetiger Faktoren und wirkt nach der Stufung als Kontrastfaktor. Rippeln und Korn gehen vor der
// Stufung in den Pixelton ein. Darstellungswerte, keine Spielwerte.

/** Mitte der Tonleiter (wie `GROUND_FLAT` in terrain.ts). */
const FLAT = 2;
/** Kammabstand in Kacheln (Wellenlänge senkrecht zur Küste). */
export const DUNE_LAMBDA = 9;
/** Schiefe des Profils `sin(φ + k·sin φ)` (M2: k ≤ 0,8); wächst mit der Lichtlage der Küste (siehe `duneSkew`). */
export const DUNE_SKEW = 0.5;
/**
 * Tonamplitude in Stufen je Einheit Profilgefälle. Gemessen (S6, K6): Der Ton ändert sich je Kachel um höchstens
 * 1 Stufe, deshalb bleibt die Amplitude klein und der Kammabstand gross; die Schattenseite liegt unter 1,5 (Stufe −1).
 */
const TONE_AMP = 0.65;
/** Grundaufhellung der Lichtseite (Stufen). */
const TONE_BIAS = 0.05;
/** Sättigung des Tons (Stufen um `FLAT`): nie heller als +1 Stufe, nie dunkler als −2 Stufen. */
const TONE_SPAN = 1.25;
/** Phasenversatz der Kämme durch tieffrequentes Rauschen (rad): die Kämme schwingen, bleiben aber küstenparallel. */
const PHASE_WARP = 5.4 / DUNE_LAMBDA;
/** Rippeln: Abstand in Kacheln, Tiefe als Luma-Anteil (höchstens 3 %); Korn in Stufen. */
export const RIPPLE_PERIOD = 0.2;
export const RIPPLE_DEPTH = 0.03;
export const GRAIN_AMP = 0.05;
/** Präsenz: Einsatz hinter dem nassen Saum (Kacheln, relativ zu `WET_SAND`) von … bis …. */
export const DUNE_ONSET = { from: 1, to: 2.1 } as const;
// gedrehtes Wertrauschen wie `rotNoise`, mit vorab berechneter Drehung (Sinus/Kosinus je Knoten sparen)
const ENV_FREQ = 0.08,
  PHASE_FREQ = 0.17;
const ENV_C = Math.cos(1.17) * ENV_FREQ,
  ENV_S = Math.sin(1.17) * ENV_FREQ,
  PHASE_C = Math.cos(0.61) * PHASE_FREQ,
  PHASE_S = Math.sin(0.61) * PHASE_FREQ;

/** Dünenprofil `h(φ) = sin(φ + k·sin φ)` (C¹, ohne Knick). */
export const duneProfile = (phi: number, k: number): number => Math.sin(phi + k * Math.sin(phi));
/** Ableitung des Profils nach φ. */
export const duneSlope = (phi: number, k: number): number =>
  Math.cos(phi + k * Math.sin(phi)) * (1 + k * Math.cos(phi));

/** Knotenwerte einer Düne. */
export interface DuneNode {
  /** Tonwert 0…4 vor der Stufung (nur Dünenanteil; ohne Rippeln und Korn). */
  tone: number;
  /** Präsenz 0…1 (Kontrastfaktor nach der Stufung). */
  pres: number;
  /** Phase φ des Profils (rad), Grundlage von Kämmen und Rippeln. */
  phase: number;
}

/** Einsatz hinter dem nassen Saum: 0 bis `rel` = 1 Kachel, voll ab `DUNE_ONSET.to` (K1: nie im nassen Saum oder Schaum). */
export const duneOnset = (rel: number): number => {
  const v = (rel - DUNE_ONSET.from) / (DUNE_ONSET.to - DUNE_ONSET.from);
  return v < 0 ? 0 : v > 1 ? 1 : v; // linear: die Präsenz ändert sich je Knoten höchstens um 0,15 (M1), Weichzeichnen geht hier nicht
};

/**
 * Präsenz: Produkt stetiger, langsam veränderlicher Faktoren (M4) — Einsatz hinter dem nassen Saum, Sandanteil (auf
 * Kachelebene geglättet) und eine sehr tieffrequente Hüllkurve (Kuppen setzen längs der Kämme aus). Jeder Faktor ändert
 * sich je Knoten um höchstens 0,1 (M1: ≤ 0,15). Wo das Küstengefälle verschwindet, verschwindet der Ton, nicht die Präsenz.
 */
export function dunePresence(
  seed: number,
  fx: number,
  fy: number,
  rel: number,
  sand: number,
): number {
  const onset = duneOnset(rel);
  if (onset <= 0) return 0;
  const sandF = Math.min(1, Math.max(0, (sand - 0.05) / 0.5));
  if (sandF <= 0) return 0;
  const n = valueNoise(seed + 131, ENV_C * fx - ENV_S * fy, ENV_S * fx + ENV_C * fy);
  return onset * sandF * smoothstep(0.05, 0.35, n);
}

/**
 * Schiefe je nach Lichtlage: das Vorzeichen folgt dem Licht auf dem Küstengefälle, glatt durch 0 (sonst Sprung, wo
 * die Küste quer zum Licht läuft). Lange flache Lichtseite, kurze steile Schattenseite.
 */
export const duneSkew = (dn: number): number => DUNE_SKEW * Math.tanh(dn / 0.5);

/**
 * Dünenwerte an einem Knoten (fx, fy in Kacheln). `rel` = s̃ − WET_SAND, `sand` = geglätteter Sandanteil,
 * (gx, gy) = Gefälle von s̃ je Kachel. Schreibt nach `o`.
 */
export function duneNode(
  seed: number,
  fx: number,
  fy: number,
  rel: number,
  sand: number,
  gx: number,
  gy: number,
  o: DuneNode,
): void {
  const grad = Math.hypot(gx, gy);
  o.pres = dunePresence(seed, fx, fy, rel, sand);
  o.tone = FLAT;
  o.phase = 0;
  // Ton und Phase auch knapp ausserhalb der Präsenz (stetiger Verlauf bis zum Rand, M1); weit weg bleibt FLAT
  if (rel <= DUNE_ONSET.from - 0.4 || sand <= 0) return;
  const phi =
    (2 * Math.PI * (rel - DUNE_ONSET.from)) / DUNE_LAMBDA +
    PHASE_WARP *
      (2 * valueNoise(seed + 133, PHASE_C * fx - PHASE_S * fy, PHASE_S * fx + PHASE_C * fy) - 1);
  o.phase = phi;
  // Licht auf dem Gefälle (n · L), M5: Amplitude wie `groundHeight` mit 1 / max(0,35, |n·L|) ausgeglichen
  const dn = (gx * LIGHT.x + gy * LIGHT.y) / Math.max(grad, 0.5);
  const c = dn / Math.max(0.35, Math.abs(dn));
  const hp = duneSlope(phi, duneSkew(dn));
  // wo das Küstengefälle verschwindet (Wasserscheide der Insel), dreht sich die Richtung schnell: Ton läuft aus
  const x = (-TONE_AMP * hp * c + TONE_BIAS * Math.abs(c)) * smoothstep(0.2, 0.7, grad);
  o.tone = FLAT + TONE_SPAN * Math.tanh(x / TONE_SPAN);
}

/**
 * Mikro-Unebenheit je Pixel vor der Stufung (Stufen, wie `groundMicro`): Korn `grain` ∈ −0,5…0,5, höchstens ±0,05.
 * Rippeln gehen nicht vor die Stufung ein (sonst kippt jede Rippel über die Schwelle und wird zum Strich, D7).
 */
export const duneMicro = (grain: number): number => 2 * GRAIN_AMP * grain;

/**
 * Rippeln nach der Stufung: Helligkeitsfaktor 1 − 0…`RIPPLE_DEPTH` (nur abdunkelnd: der Maximalton bleibt sandDry +
 * 1 Stufe), nur auf der Lichtseite (Ton über der Ebene) und längs der Kämme (`phase` · Kammabstand / Rippelabstand).
 */
export function duneRipple(phase: number, tone: number): number {
  const lit = smoothstep(FLAT, FLAT + 0.3, tone);
  if (lit <= 0) return 1;
  const u = (phase * DUNE_LAMBDA) / (RIPPLE_PERIOD * 2 * Math.PI);
  const f = u - Math.floor(u);
  const w = 4 * f * (1 - f); // Parabelwelle 0…1, C⁰-stetig im Maximum glatt, billig
  return 1 - lit * RIPPLE_DEPTH * w;
}

/**
 * Kachelfeld mit Catmull-Rom (C¹) statt bilinear abgetastet (Kachelmitten bei i + 0,5, Ränder geklemmt). Bilinear
 * hätte an den Zellgrenzen einen Gefällesprung; der würde im Ton zur Kachelwelle (M3).
 */
export function sampleCubic(f: Field, fx: number, fy: number): number {
  const u = fx - 0.5,
    v = fy - 0.5;
  const x0 = Math.floor(u),
    y0 = Math.floor(v);
  const tx = u - x0,
    ty = v - y0;
  const w = f.w,
    mx = w - 1,
    my = f.h - 1;
  const xa = Math.min(mx, Math.max(0, x0 - 1)),
    xb = Math.min(mx, Math.max(0, x0)),
    xc = Math.min(mx, Math.max(0, x0 + 1)),
    xd = Math.min(mx, Math.max(0, x0 + 2));
  const t2 = tx * tx,
    t3 = t2 * tx;
  // Catmull-Rom-Gewichte
  const c0 = 0.5 * (-t3 + 2 * t2 - tx),
    c1 = 0.5 * (3 * t3 - 5 * t2 + 2),
    c2 = 0.5 * (-3 * t3 + 4 * t2 + tx),
    c3 = 0.5 * (t3 - t2);
  const s2 = ty * ty,
    s3 = s2 * ty;
  const d0 = 0.5 * (-s3 + 2 * s2 - ty),
    d1 = 0.5 * (3 * s3 - 5 * s2 + 2),
    d2 = 0.5 * (-3 * s3 + 4 * s2 + ty),
    d3 = 0.5 * (s3 - s2);
  const vv = f.v;
  const row = (y: number): number => {
    const o = Math.min(my, Math.max(0, y)) * w;
    return c0 * vv[o + xa]! + c1 * vv[o + xb]! + c2 * vv[o + xc]! + c3 * vv[o + xd]!;
  };
  return d0 * row(y0 - 1) + d1 * row(y0) + d2 * row(y0 + 1) + d3 * row(y0 + 2);
}
