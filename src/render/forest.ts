import { hash2, valueNoise } from '../sim/noise';

// forest.ts — reine Platzierung des Waldes (ART-STIL-02 L1, Spec 2.1 / 3.2 B1–B5 / 3.7). Kein Canvas, kein DOM.
// Je freier Waldkachel genau ein Stempel: Rolle (Kern, Rand, Eng), Art-Slot (Bestand), Form, Versatz, Riesenbaum.
// Alles ist eine reine Funktion von (Seed, Kachel); nur `hash2` und `valueNoise`. Salze 500 und 501–519 (s. Kopf von
// groundDecor.ts): 500 Waldtyp · 501 Akzentart · 502 Bestandsfeld · 503 Akzentfeld · 504/514 Randversatz ·
// 505 Hash-Streuung Rand · 506/507 Kern-Streuung x/y · 508 Lichtungsfeld · 509 Riesenbaum-Wahl je Kachel ·
// 510 Riesenbaum ja/nein · 511 Formreihenfolge · 515 Wiederholung in der Formwahl (R298) · 516 Randversatz quer zur
// Normalen (R298). Die Kronen selbst würfelt `trees.ts` (Salze 51/52/68, 512 und 513).

/** Rolle einer Waldkachel: Kern (alle 8 Nachbarn freier Wald), Rand (grenzt an freie Wiese), Eng (gesperrter Nachbar). */
export type Role = 0 | 1 | 2;
/** Art-Slot: Platz 0 ist die Hauptart des Waldtyps, 1 die Nebenart, 2 der Akzent. */
export type Slot = 0 | 1 | 2;
/** Waldtyp (Spec 3.7): 0 Mischwald, 1 Nadelwald, 2 Birken- und Hellholzwald, 3 Pinienwald. */
export type ForestType = 0 | 1 | 2 | 3;
/** Klasse einer Kachel für die Platzierung: freier Wald, freie Wiese (kein Gebäude, kein Weg), sonst gesperrt. */
export type TileClass = 'forest' | 'meadow' | 'blocked';

export interface Placement {
  variant: number;
  role: Role;
  slot: Slot;
  /** Stempelversatz in Kacheln (Kachelraum). */
  ox: number;
  oy: number;
  /** Uralter Riesenbaum (B3). */
  giant: boolean;
}

/** Formen je Rolle (Kern, Rand, Eng) und Plätze je Slot: 3 + 3 + 2 = 8; 3 Slots ergeben 24 Varianten. */
export const ROLE_FORMS = [3, 3, 2] as const;
const ROLE_BASE = [0, 3, 6] as const;
export const FORMS_PER_SLOT = 8;
export const FOREST_VARIANTS = 3 * FORMS_PER_SLOT;

export const variantOf = (slot: number, role: number, form: number): number =>
  slot * FORMS_PER_SLOT + ROLE_BASE[role]! + form;
export function variantParts(v: number): { slot: Slot; role: Role; form: number } {
  const slot = Math.floor(v / FORMS_PER_SLOT) as Slot,
    r = v % FORMS_PER_SLOT;
  const role: Role = r < 3 ? 0 : r < 6 ? 1 : 2;
  return { slot, role, form: r - ROLE_BASE[role] };
}

/**
 * Waldtyp je Karte aus `hash2(seed + 500, 0, 0)`. Der Stempel-Seed (`env.seed`, Weltseed) und der Seed der
 * Inselansicht sind für die Heimatinsel gleich; gilt der Typ je Karte, kommt er immer aus dem Stempel-Seed.
 */
export const forestType = (seed: number): ForestType =>
  (Math.floor(hash2(seed + 500, 0, 0) * 4) % 4) as ForestType;
/** Mischwald: Akzentart ist Ahorn (B5) statt Birke (B4)? */
export const accentIsMaple = (seed: number): boolean => hash2(seed + 501, 0, 0) < 0.5;

/** Art-Slot einer Kachel aus einem tieffrequenten Bestandsfeld (Merkmal ≈ 6 Kacheln), Schwellen je Waldtyp. */
export function slotAt(seed: number, type: ForestType, x: number, y: number): Slot {
  const d = valueNoise(seed + 502, (x + 0.5) / 6, (y + 0.5) / 6);
  if (type === 0) {
    // Akzent selten: kleine Gruppen aus einem eigenen, höher gefrequenten Feld
    if (valueNoise(seed + 503, (x + 0.5) / 3.5, (y + 0.5) / 3.5) > 0.76) return 2;
    return d < 0.5 ? 0 : 1;
  }
  return d < 0.6 ? 0 : d < 0.86 ? 1 : 2;
}

const AMP = 0.3;
/** Kern-Versatz je Achse (R298: ±0,2 statt ±0,08; kleine Lücken im Kronendach lesen sich als Waldbodenschatten). */
const CORE_SHIFT = 0.2;
/** Randversatz: Weissrauschen je Kachel, Konvexitätsausgleich je Stufe, Jitter quer zur Normalen (R298). */
const EDGE_WHITE = 0.14,
  EDGE_BULGE = 0.14,
  EDGE_TANGENT = 0.1;
/**
 * Formwahl (R298): Kosten einer Wiederholung links/oben (meist 4, in `REPEAT_P` der Kacheln nur `REPEAT_COST`) und
 * der oberen Diagonalen; die Diagonale (x − 1, y − 1) liegt im Bild genau darüber und wiegt deshalb mehr.
 */
const REPEAT_P = 0.2,
  REPEAT_COST = 0.8,
  DIAG_COST = 1.2,
  ANTI_COST = 0.8;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
/** Randversatz-Betrag in Kacheln an einem Kachelpunkt: Rauschen (Periode ≈ 4,5 Kacheln), in [−0,3; +0,3]. */
export const forestEdgeShift = (seed: number, fx: number, fy: number): number =>
  AMP *
  Math.tanh(
    ((valueNoise(seed + 504, fx / 4.5, fy / 4.5) - 0.5) * 1.1 +
      (valueNoise(seed + 514, fx / 2.3, fy / 2.3) - 0.5) * 2.2) /
      AMP,
  );
/** Lichtungsfeld 0…1 (Merkmal ≈ 5 Kacheln); ab 0,5 lichtet sich der Kern. */
export const forestClearing = (seed: number, fx: number, fy: number): number => {
  const n = valueNoise(seed + 508, fx / 5, fy / 5);
  const t = clamp((n - 0.78) / 0.1, 0, 1);
  return t * t * (3 - 2 * t);
};

const NB: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/**
 * Platzierung aller freien Waldkacheln einer w × h-Karte. `cls` liefert die Klasse einer Kachel (ausserhalb der
 * Karte: `blocked`). Ergebnis je Kachel `y * w + x`, `undefined` ausserhalb des freien Waldes.
 */
export function forestLayout(
  seed: number,
  w: number,
  h: number,
  cls: (x: number, y: number) => TileClass,
): (Placement | undefined)[] {
  const type = forestType(seed);
  const out: (Placement | undefined)[] = new Array(w * h);
  const core = new Uint8Array(w * h);
  const clearing = new Uint8Array(w * h);
  const roleOf = (x: number, y: number): Role => {
    let rand = false;
    for (const [dx, dy] of NB) {
      const c = cls(x + dx, y + dy);
      if (c === 'blocked') return 2;
      if (c === 'meadow') rand = true;
    }
    return rand ? 1 : 0;
  };
  // Zeilenweise Formwahl nach Kosten: die Varianten des linken und des oberen Nachbarn sind teuer (4-Nachbarpaare
  // verschieden), die der beiden oberen Diagonalen billig, aber nicht frei. Bei nur drei Formen erzwingt das gierige
  // Meiden von links und oben sonst Form(x, y) = Form(x − 1, y − 1), also senkrechte Streifen gleicher Stempel im Bild
  // (R298). Mit kleiner Wahrscheinlichkeit (Salz 515) ist eine Wiederholung links oder oben billiger als eine Diagonale.
  const at = (x: number, y: number): number | undefined =>
    x >= 0 && x < w && y >= 0 ? out[y * w + x]?.variant : undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (cls(x, y) !== 'forest') continue;
      const role = roleOf(x, y);
      if (role === 0) core[y * w + x] = 1;
      let useRole: Role = role;
      if (role === 0 && forestClearing(seed, x + 0.5, y + 0.5) >= 0.5) {
        useRole = 1; // Lichtung (B2): der Kern nimmt die lichtere Rand-Form
        clearing[y * w + x] = 1;
      }
      const slot = slotAt(seed, type, x, y);
      const wv = at(x - 1, y),
        nv = at(x, y - 1),
        dv = at(x - 1, y - 1),
        av = at(x + 1, y - 1);
      const rep = hash2(seed + 515, x, y) < REPEAT_P ? REPEAT_COST : 4;
      let variant = -1,
        best = Infinity;
      for (let f = 0; f < ROLE_FORMS[useRole]; f++) {
        const v = variantOf(slot, useRole, f);
        const cost =
          (v === wv ? rep : 0) +
          (v === nv ? rep : 0) +
          (v === dv ? DIAG_COST : 0) +
          (v === av ? ANTI_COST : 0) +
          hash2(seed + 511, x * 8 + f, y) * 0.5;
        if (cost < best) {
          best = cost;
          variant = v;
        }
      }
      let ox = 0,
        oy = 0;
      if (role === 0) {
        ox = (hash2(seed + 506, x, y) - 0.5) * 2 * CORE_SHIFT;
        oy = (hash2(seed + 507, x, y) - 0.5) * 2 * CORE_SHIFT;
      } else if (role === 1) {
        let sx = 0,
          sy = 0,
          ortho = 0;
        for (const [dx, dy] of NB) {
          if (cls(x + dx, y + dy) !== 'meadow') continue;
          sx += dx;
          sy += dy;
          if (dx === 0 || dy === 0) ortho++;
        }
        const len = Math.hypot(sx, sy) || 1;
        const nx = sx / len,
          ny = sy / len;
        // Konvexität: vorspringende Stufe (Wiese an zwei, drei Seiten) nach innen, einspringende (Wiese nur
        // diagonal) nach aussen; danach das glatte Feld und je Kachel Weissrauschen
        const bulge = clamp(ortho - 1, -1, 1.5);
        const a = clamp(
          forestEdgeShift(seed, x + 0.5, y + 0.5) * 0.8 +
            (hash2(seed + 505, x, y) - 0.5) * 2 * EDGE_WHITE -
            bulge * EDGE_BULGE,
          -AMP,
          AMP,
        );
        const t = (hash2(seed + 516, x, y) - 0.5) * 2 * EDGE_TANGENT;
        ox = nx * a - ny * t;
        oy = ny * a + nx * t;
      }
      out[y * w + x] = { variant, role, slot, ox, oy, giant: false };
    }
  // B3 Riesenbaum: in etwa der Hälfte der Karten genau einer, in der tiefsten Kernkachel (dichteste 5 × 5-Umgebung)
  if (hash2(seed + 510, 0, 0) < 0.5) {
    let best = -1,
      bestScore = 8;
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        if (!core[y * w + x] || clearing[y * w + x]) continue;
        let s = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) s += core[(y + dy) * w + x + dx]!;
        const score = s + hash2(seed + 509, x, y) * 0.5;
        if (s >= 9 && score > bestScore) {
          bestScore = score;
          best = y * w + x;
        }
      }
    const p = best >= 0 ? out[best] : undefined;
    if (p) p.giant = true;
  }
  return out;
}
