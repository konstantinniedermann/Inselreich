// monumentSprite.ts — Maler der fünf Bildstufen des Denkmals «Feuersäule» (M13-E2 T08, Art-Vorschlag §2/§4).
// Reine Zeichenfunktion ohne Welt- und Zufallszugriff; deterministisch je (x, y, Stufe). Laufzeit-Importe nur aus
// `isoBase`, `palette`, `limits`: `iso.ts` importiert diese Datei, `sprites.ts` wird nur als Typ gelesen.
// Höhen: `MONUMENT_HEIGHTS[s]` ist das Höhenmass H(s) = (Oberkante der hinteren Ecke − höchster Punkt) / ISO_H,
// gemessen wie in AK-ISO-10; alle Bauteile bleiben darunter, die Stufe 4 unter `H_TOWER` (3 · ISO_H).
import type { Building } from '../sim/types';
import { ISO_H } from './isoBase';
import { PALETTE, mixHex, shadeSide, toInk, toLight } from './palette';
import type { IsoPainter } from './sprites';

export type MonumentImageStage = 0 | 1 | 2 | 3 | 4;

/** Höhe des Körpers in ISO_H-Einheiten je Bildstufe; streng steigend; [4] in [2,8; 3,0], [0] ≤ 0,3. */
export const MONUMENT_HEIGHTS: readonly [number, number, number, number, number] = [
  0.2, 0.8, 1.5, 2.6, 2.9,
];

type Rect = readonly [number, number, number, number]; // u0, v0, u1, v1
interface Wall {
  left: string;
  right: string;
}
const wallOf = (c: string): Wall => ({ left: toLight(c, 0.06), right: shadeSide(c, 0.2) });

/** Bodenhöhe z, bei der der Punkt (u, v) um `rel · ISO_H` über der hinteren Ecke der Raute erscheint. */
const zAt = (u: number, v: number, rel: number): number => rel * ISO_H + ((u + v) * ISO_H) / 2;

// --- Masse (Kachel- bzw. Weltpixel; Darstellungswerte) ---
/** Drei Terrassen: Grundriss und Höhe (z0 → z1). */
const TERRACES: readonly (readonly [Rect, number, number])[] = [
  [[0.15, 0.15, 2.85, 2.85], 0, 8],
  [[0.55, 0.55, 2.45, 2.45], 8, 16],
  [[0.95, 0.95, 2.05, 2.05], 16, 24],
];
const SHAFT_Z0 = 24;
const SHAFT_Z1 = 116;
const SHAFT_HALF_BASE = 0.3; // halbe Kantenlänge am Fuss (Kachel)
const SHAFT_HALF_TOP = 0.22;
const CAPITAL_HALF = 0.35;
const CAPITAL_Z1 = SHAFT_Z1 + 8;
const BOWL_HALF = 0.28;
const BOWL_BACK = 1.5 - BOWL_HALF;
/** Oberkante der Feuerschale: ihre hintere Ecke trifft genau H(4). */
const BOWL_Z1 = zAt(BOWL_BACK, BOWL_BACK, MONUMENT_HEIGHTS[4]);

const STONE = wallOf(PALETTE.wallStone);
const STONE_TOP = PALETTE.rockLight;
const TIMBER = wallOf(PALETTE.wallTimber);
const COPPER = wallOf(PALETTE.roofCopper);
const RIM = PALETTE.wallLime;
const JOINT = toInk(PALETTE.wallStone, 0.28);
const PAVED = mixHex(PALETTE.sandDry, PALETTE.rock, 0.3);
const GLASS = mixHex(PALETTE.waterShallow, PALETTE.wallLime, 0.5);
const CORD = toLight(PALETTE.wallLime, 0.2);
const CLOTH = toLight(PALETTE.wallLime, 0.35);

/** Quader mit linker (+v) und rechter (+u) Wand und Deckfläche. */
function box(
  p: IsoPainter,
  [u0, v0, u1, v1]: Rect,
  z0: number,
  z1: number,
  wall: Wall,
  top: string,
  outline = true,
): void {
  p.quad([u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1], wall.left, outline);
  p.quad([u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1], wall.right, outline);
  p.quad([u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1], top, outline);
}

/** Dünne Stange (Pfosten, Pflock, Mast) von z0 bis z1; die Oberkante gilt an der hinteren Ecke (u, v). */
function stake(p: IsoPainter, u: number, v: number, z0: number, z1: number, w = 0.05): void {
  box(p, [u, v, u + w, v + w], z0, z1, TIMBER, TIMBER.left, false);
}

/** Terrassenrand in `wallLime`: Vorderkanten der Deckfläche. */
function rim(p: IsoPainter, [u0, v0, u1, v1]: Rect, z: number): void {
  p.line([u0, v1, z], [u1, v1, z], RIM);
  p.line([u1, v0, z], [u1, v1, z], RIM);
}

/** Halbe Kantenlänge des Schafts auf der Höhe z (verjüngt linear). */
const shaftHalf = (z: number): number =>
  SHAFT_HALF_BASE + ((SHAFT_HALF_TOP - SHAFT_HALF_BASE) * (z - SHAFT_Z0)) / (SHAFT_Z1 - SHAFT_Z0);

/** Sich verjüngender vierkantiger Schaft von SHAFT_Z0 bis `zTop`, Fugen als Linien auf der linken Wand. */
function shaft(p: IsoPainter, zTop: number): void {
  const c = 1.5;
  const [hb, ht] = [shaftHalf(SHAFT_Z0), shaftHalf(zTop)];
  const [b0, b1, t0, t1] = [c - hb, c + hb, c - ht, c + ht];
  p.quad([b0, b1, SHAFT_Z0], [b1, b1, SHAFT_Z0], [t1, t1, zTop], [t0, t1, zTop], STONE.left);
  p.quad([b1, b0, SHAFT_Z0], [b1, b1, SHAFT_Z0], [t1, t1, zTop], [t1, t0, zTop], STONE.right);
  p.quad([t0, t0, zTop], [t1, t0, zTop], [t1, t1, zTop], [t0, t1, zTop], STONE_TOP);
  for (let z = SHAFT_Z0 + 14; z < zTop - 2; z += 14) {
    const h = shaftHalf(z);
    p.line([c - h, c + h, z], [c + h, c + h, z], JOINT);
    p.line([c + h, c - h, z], [c + h, c + h, z], JOINT);
  }
  p.lightEdges([
    [[b0, b1, SHAFT_Z0], [t0, t1, zTop], STONE.left],
    [[t0, t0, zTop], [t0, t1, zTop], STONE_TOP],
  ]);
}

/**
 * Gerüstring um `rect` von z0 bis zur gemeinsamen Höhe `zTop`; Querriegel auf halber und voller Höhe. Hintere Teile
 * (`front` false) werden vor dem Schaft gezeichnet, vordere danach.
 */
function scaffold(
  p: IsoPainter,
  [u0, v0, u1, v1]: Rect,
  z0: number,
  zTop: number,
  front: boolean,
): void {
  const poles: [number, number][] = front
    ? [
        [u1, v0],
        [u0, v1],
        [u1, v1],
      ]
    : [[u0, v0]];
  for (const [u, v] of poles) stake(p, u, v, z0, zTop);
  const rails: [number, number, number, number][] = front
    ? [
        [u1, v0, u1, v1],
        [u0, v1, u1, v1],
      ]
    : [
        [u0, v0, u1, v0],
        [u0, v0, u0, v1],
      ];
  for (const [ua, va, ub, vb] of rails)
    for (const z of [z0 + (zTop - z0) * 0.5, zTop - 1])
      p.line([ua, va, z], [ub, vb, z], TIMBER.left);
}

/** Baugrund: vier Pflöcke mit Schnur und zwei kleine Steinstapel im Erdhof. */
function ground(p: IsoPainter): void {
  const [a, b] = [0.25, 2.75];
  const zPeg = zAt(a, a, MONUMENT_HEIGHTS[0]); // hinterer Pflock bestimmt H(0)
  const zCord = zPeg * 0.75;
  const cord = (u0: number, v0: number, u1: number, v1: number): void =>
    p.line([u0, v0, zCord], [u1, v1, zCord], CORD);
  stake(p, a, a, 0, zPeg);
  cord(a, a, b, a);
  cord(a, a, a, b);
  stake(p, b, a, 0, zPeg);
  stake(p, a, b, 0, zPeg);
  cord(b, a, b, b);
  cord(a, b, b, b);
  stake(p, b, b, 0, zPeg);
  box(p, [1.9, 0.7, 2.3, 1.05], 0, 5, STONE, STONE_TOP);
  box(p, [1.1, 1.9, 1.4, 2.15], 0, 3, STONE, STONE_TOP);
}

/** Stein- und Glasstapel auf der untersten Terrasse (Stufen 1 bis 3). */
function stacks(p: IsoPainter, glass: boolean): void {
  if (!glass) box(p, [0.22, 1.0, 0.48, 1.35], 8, 13, STONE, STONE_TOP);
  else box(p, [1.1, 2.55, 1.45, 2.78], 8, 14, wallOf(GLASS), GLASS);
}

/** Wimpel an den beiden Vorderecken der untersten Terrasse (nur Stufe 4). */
function pennants(p: IsoPainter): void {
  stake(p, 0.22, 2.78, 8, 42);
  p.poly(
    [
      [0.27, 2.8, 42],
      [0.62, 2.8, 38],
      [0.27, 2.8, 33],
    ],
    CLOTH,
  );
  stake(p, 2.78, 0.22, 8, 42);
  p.poly(
    [
      [2.8, 0.27, 42],
      [2.8, 0.62, 38],
      [2.8, 0.27, 33],
    ],
    CLOTH,
  );
}

/** Zeichnet das 3×3-Denkmal der Bildstufe s (0 Baugrund, 1 Sockel mit Gerüst, 2 Terrassen, 3 Schaft, 4 Fertig). */
export function drawMonument(p: IsoPainter, _b: Building, s: MonumentImageStage): void {
  const { w, h } = p;
  const yard = s === 4 ? PAVED : PALETTE.earth;
  const [yu0, yv0, yu1, yv1] = [0.08, 0.08, w - 0.08, h - 0.08];
  p.quad([yu0, yv0, 0], [yu1, yv0, 0], [yu1, yv1, 0], [yu0, yv1, 0], yard, false);
  if (s === 4)
    for (const t of [0.5, 1.0, 1.5, 2.0, 2.5]) {
      p.line([yu0, t, 0], [yu1, t, 0], toInk(PAVED, 0.2));
      p.line([t, yv0, 0], [t, yv1, 0], toInk(PAVED, 0.2));
    }
  if (s === 0) {
    ground(p);
    return;
  }
  const terraces = s === 1 ? 1 : 3;
  const ringRect: Rect = s === 1 ? TERRACES[0]![0] : TERRACES[1]![0];
  const ringZ0 = s === 1 ? TERRACES[0]![2] : TERRACES[1]![2];
  const relTop = s === 1 ? MONUMENT_HEIGHTS[1] : s === 2 ? MONUMENT_HEIGHTS[2] : 2.3;
  const ringTop = zAt(ringRect[0], ringRect[1], relTop);
  const scaffolded = s >= 1 && s <= 3;

  TERRACES.slice(0, terraces).forEach(([r, z0, z1], i) => {
    box(p, r, z0, z1, STONE, STONE_TOP);
    rim(p, r, z1);
    p.lightEdges([[[r[0], r[3], z1], [r[2], r[3], z1], STONE.left]]);
    if (i === 0 && scaffolded) stacks(p, false);
  });
  if (scaffolded) stacks(p, true);
  if (scaffolded) scaffold(p, ringRect, ringZ0, ringTop, false);
  if (s >= 2) shaft(p, s === 2 ? SHAFT_Z0 + (SHAFT_Z1 - SHAFT_Z0) / 3 : SHAFT_Z1);
  if (scaffolded) scaffold(p, ringRect, ringZ0, ringTop, true);
  if (s === 3) {
    // Kran: Mast links der Terrasse, Ausleger über den Schaft, Seil mit Last; Spitze exakt auf H(3)
    const [mu, mv] = [0.98, 2.0];
    const zMast = zAt(mu, mv, MONUMENT_HEIGHTS[3]);
    stake(p, mu, mv, 24, zMast);
    p.line([mu, mv, zMast], [1.55, mv, zMast - 4], TIMBER.left);
    p.line([1.55, mv, zMast - 4], [1.55, mv, zMast - 26], CORD);
    box(p, [1.5, mv, 1.6, mv + 0.1], zMast - 32, zMast - 26, STONE, STONE_TOP, false);
  }
  if (s === 4) {
    // Kapitell in Kupfer, darüber die Feuerschale mit glühender Fläche
    const [c0, c1] = [1.5 - CAPITAL_HALF, 1.5 + CAPITAL_HALF];
    box(p, [c0, c0, c1, c1], SHAFT_Z1, CAPITAL_Z1, COPPER, toLight(PALETTE.roofCopper, 0.15));
    const [b0, b1] = [BOWL_BACK, 1.5 + BOWL_HALF];
    box(p, [b0, b0, b1, b1], CAPITAL_Z1, BOWL_Z1, wallOf(PALETTE.rockDark), PALETTE.window);
    pennants(p);
  }
}

/** Leuchtfeuer der Stufe 4 bei Nacht (Muster Fenster-/Signallicht); ohne Wirkung bei s < 4. */
export function monumentNightLight(s: MonumentImageStage): boolean {
  return s === 4;
}
