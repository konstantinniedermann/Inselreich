import { LIGHT, rotNoise, smoothstep } from './light';

// dunes.ts — Dünen auf trockenem Sand (H-R12b, Kurz-Spec 2026-10-05). Reine Mathematik, ohne Canvas.
//
// Grundsatz „Malpfad durchgehend stetig" (M1–M6): Die Dünenform ist ein schiefer Sinus über dem GEGLÄTTETEN
// Küstenwert s̃ (Kämme = Höhenlinien von s̃, also küstenparallel). Aus dem Gefälle gegen das Licht entsteht ein
// stetiger Tonwert je Rasterknoten; scharf wird er erst durch `toneStep` je Pixel (terrain.ts). Die Präsenz ist
// ein Produkt stetiger Faktoren und wirkt nach der Stufung als Kontrastfaktor. Rippeln und Korn gehen vor der
// Stufung in den Pixelton ein. Darstellungswerte, keine Spielwerte.

/** Mitte der Tonleiter (wie `GROUND_FLAT` in terrain.ts). */
const FLAT = 2;
/** Weichzeichner-Radius der Küsten- und Sandfelder in Knoten (zwei Durchgänge, Wirkradius ≈ 1 Kachel bei 8 Knoten je Kachel). */
export const DUNE_BLUR = 4;
/** Weichzeichner-Radius der Präsenz in Knoten (ein Durchgang: Nachbarknoten ändern sich um höchstens 1 / (2 · 5 + 1)). */
export const DUNE_PRES_BLUR = 5;
/** Reichweite aller Dünen-Weichzeichner und des Gefälles in Knoten (Rand des Teilfensters, `SMOOTH_BORDER`). */
export const DUNE_REACH = 2 * DUNE_BLUR + DUNE_PRES_BLUR + 1;
/** Kammabstand in Kacheln (Wellenlänge senkrecht zur Küste). */
export const DUNE_LAMBDA = 6;
/** Schiefe des Profils `sin(φ + k·sin φ)` (M2: k ≤ 0,8); wächst mit der Lichtlage der Küste (siehe `duneSkew`). */
export const DUNE_SKEW = 0.5;
/**
 * Tonamplitude in Stufen je Einheit Profilgefälle. Gemessen (S6, K6): Der Ton ändert sich je Kachel um höchstens
 * 1 Stufe, deshalb bleibt die Amplitude klein und der Kammabstand gross; die Schattenseite liegt unter 1,5 (Stufe −1).
 */
const TONE_AMP = 0.55;
/** Grundaufhellung der Lichtseite (Stufen). */
const TONE_BIAS = 0;
/** Sättigung des Tons (Stufen um `FLAT`): nie heller als +1 Stufe, nie dunkler als −2 Stufen. */
const TONE_SPAN = 0.9;
/** Phasenversatz der Kämme durch tieffrequentes Rauschen (rad): die Kämme schwingen, bleiben aber küstenparallel. */
const PHASE_WARP = 0.9;
/** Rippeln: Abstand in Kacheln, Tonamplitude in Stufen, Korn in Stufen. */
export const RIPPLE_PERIOD = 0.2;
export const RIPPLE_AMP = 0.2;
/** Mittlere Anhebung der Rippeln auf der Lichtseite (Stufen): die Lichtseite liegt knapp unter der Stufenschwelle 2,5. */
export const RIPPLE_LIFT = 0.15;
export const GRAIN_AMP = 0.05;
/** Präsenz: Einsatz hinter dem nassen Saum (Kacheln, relativ zu `WET_SAND`) von … bis …. */
export const DUNE_ONSET = { from: 1, to: 2.3 } as const;
const ROT_PHASE = 0.61,
  ROT_ENV = 1.17,
  ROT_ENV2 = 0.29;

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
 * Präsenz ohne Einsatz: Produkt stetiger Faktoren aus geglättetem Sandanteil, Küstengefälle und tieffrequenter
 * Hüllkurve (Kuppen setzen längs der Kämme aus). Terrain weichzeichnet sie (M1: ≤ 0,15 je Knoten) und multipliziert
 * danach `duneOnset`.
 */
export function duneBase(seed: number, fx: number, fy: number, sand: number, grad: number): number {
  const sandF = smoothstep(0.05, 0.5, sand);
  if (sandF <= 0) return 0;
  const gradF = smoothstep(0.35, 0.8, grad);
  if (gradF <= 0) return 0;
  const n =
    0.65 * rotNoise(seed + 131, fx, fy, 0.11, ROT_ENV) +
    0.35 * rotNoise(seed + 132, fx, fy, 0.27, ROT_ENV2);
  return sandF * gradF * smoothstep(0.2, 0.38, n);
}

/**
 * Schiefe je nach Lichtlage: das Vorzeichen folgt dem Licht auf dem Küstengefälle, glatt durch 0 (sonst Sprung, wo
 * die Küste quer zum Licht läuft). Lange flache Lichtseite, kurze steile Schattenseite.
 */
export const duneSkew = (dn: number): number => DUNE_SKEW * Math.tanh(dn / 0.5);

/**
 * Dünenwerte an einem Knoten (fx, fy in Kacheln). `rel` = s̃ − WET_SAND, `sand` = geglätteter Sandanteil,
 * (gx, gy) = Gefälle von s̃ je Kachel. Schreibt nach `o` (`pres` ist die Basis ohne Einsatz, siehe `duneBase`).
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
  o.pres = duneBase(seed, fx, fy, sand, grad);
  o.tone = FLAT;
  o.phase = 0;
  // Ton und Phase auch knapp ausserhalb der Präsenz (stetiger Verlauf bis zum Rand, M1); weit weg bleibt FLAT
  if (rel <= DUNE_ONSET.from - 0.4 || sand <= 0) return;
  const phi =
    (2 * Math.PI * (rel - DUNE_ONSET.from)) / DUNE_LAMBDA +
    PHASE_WARP * (2 * rotNoise(seed + 133, fx, fy, 0.17, ROT_PHASE) - 1);
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
 * Rippeln und Korn je Pixel (Stufen, vor der Stufung addiert): feine Rippeln längs der Kämme (`phase` · Kammabstand /
 * Rippelabstand), nur auf der Lichtseite (nicht auf der steilen Seite), plus Korn `grain` ∈ −0,5…0,5.
 */
export function duneFine(phase: number, tone: number, grain: number): number {
  const lit = smoothstep(FLAT, FLAT + 0.3, tone);
  const ripple = Math.sin((phase * DUNE_LAMBDA) / RIPPLE_PERIOD);
  return lit * (RIPPLE_LIFT + RIPPLE_AMP * ripple) + 2 * GRAIN_AMP * grain;
}
