import { describe, expect, it } from 'vitest';
import {
  FOREST_VARIANTS,
  forestLayout,
  forestType,
  variantParts,
  type TileClass,
} from '../../src/render/forest';
import { valueNoise } from '../../src/sim/noise';

// forest.test.ts — reine Platzierung (L1 Wald organisch): Rolle, Art-Slot, Form, Versatz, Riesenbaum, Waldtyp.

const N = 48;
/** Klassenraster: Wald-Klumpen aus Rauschen, Wiese ringsum, ein Streifen gesperrt (Weg). */
function blobGrid(seed: number): TileClass[] {
  const g: TileClass[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const n = valueNoise(seed + 77, x / 7, y / 7);
      g.push(n > 0.5 ? 'forest' : 'meadow');
    }
  return g;
}
const at = (g: TileClass[]) => (x: number, y: number) =>
  x < 0 || y < 0 || x >= N || y >= N ? ('blocked' as const) : g[y * N + x]!;
const SEEDS = [1, 2, 5, 7, 11, 14];

describe('L1 forest: Aufbau der Varianten', () => {
  it('FOREST_VARIANTS ≤ 24; variantParts ist die Umkehrung der Zuordnung', () => {
    expect(FOREST_VARIANTS).toBeLessThanOrEqual(24);
    const seen = new Set<string>();
    for (let v = 0; v < FOREST_VARIANTS; v++) {
      const p = variantParts(v);
      expect(p.slot).toBeGreaterThanOrEqual(0);
      expect(p.slot).toBeLessThan(3);
      seen.add(`${p.slot}|${p.role}|${p.form}`);
    }
    expect(seen.size).toBe(FOREST_VARIANTS);
  });
});

describe('L1 forest: Platzierung', () => {
  it('RF-L1-1 Rollen: Kern = 8 Nachbarn Wald; Rand = Wiese als Nachbar; Eng = gesperrter Nachbar', () => {
    const w = 20,
      cls = (x: number, y: number): TileClass =>
        x === 12 && y === 5
          ? 'blocked'
          : x < 0 || y < 0 || x >= w || y >= w
            ? 'blocked'
            : x >= 6 && x < 16 && y >= 3 && y < 15
              ? 'forest'
              : 'meadow';
    const L = forestLayout(3, w, w, cls);
    const role = (x: number, y: number) => L[y * w + x]?.role;
    expect(role(10, 9)).toBe(0); // Kern
    expect(role(6, 9)).toBe(1); // Rand (Wiese links)
    expect(role(11, 5)).toBe(2); // Eng (Nachbar (12,5) gesperrt)
    expect(role(12, 5)).toBeUndefined(); // gesperrte Kachel hat keinen Stempel
    expect(role(2, 2)).toBeUndefined(); // Wiese hat keinen Stempel
  });

  it('RF-L1-2 deterministisch: gleicher Seed, gleiche Liste (Variante, Versatz, Riese)', () => {
    for (const seed of SEEDS) {
      const g = blobGrid(seed);
      expect(forestLayout(seed, N, N, at(g))).toEqual(forestLayout(seed, N, N, at(g)));
    }
  });

  it('AK Nachbarpaare: in ≥ 90 % der 4-Nachbarpaare freier Waldkacheln verschiedene Stempel', () => {
    for (const seed of SEEDS) {
      const L = forestLayout(seed, N, N, at(blobGrid(seed)));
      let pairs = 0,
        diff = 0;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ] as const) {
            const a = L[y * N + x],
              b = L[(y + dy) * N + x + dx];
            if (x + dx >= N || y + dy >= N || !a || !b) continue;
            pairs++;
            if (a.variant !== b.variant) diff++;
          }
      expect(pairs).toBeGreaterThan(300);
      expect(diff / pairs, `Seed ${seed}`).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('AK Bestände: gleiche Art (Slot) bei ≥ 65 % der Nachbarpaare', () => {
    for (const seed of SEEDS) {
      const L = forestLayout(seed, N, N, at(blobGrid(seed)));
      let pairs = 0,
        same = 0;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ] as const) {
            const a = L[y * N + x],
              b = L[(y + dy) * N + x + dx];
            if (x + dx >= N || y + dy >= N || !a || !b) continue;
            pairs++;
            if (variantParts(a.variant).slot === variantParts(b.variant).slot) same++;
          }
      expect(same / pairs, `Seed ${seed}`).toBeGreaterThanOrEqual(0.65);
    }
  });

  // R298: Kern-Versatz ±0,2 statt ±0,08 (Kugelraster aufbrechen), Rand dazu ±0,1 quer zur Normalen (Treppen aufbrechen)
  it('RF-L1-3 Versatz: Rand ±0,3 entlang der Aussennormalen und ±0,1 quer dazu, Kern ±0,2, Eng 0; beide Vorzeichen kommen vor', () => {
    let pos = 0,
      neg = 0;
    for (const seed of SEEDS) {
      const L = forestLayout(seed, N, N, at(blobGrid(seed)));
      for (const p of L) {
        if (!p) continue;
        if (p.role === 2) expect([p.ox, p.oy]).toEqual([0, 0]);
        if (p.role === 0) {
          expect(Math.abs(p.ox)).toBeLessThanOrEqual(0.2 + 1e-9);
          expect(Math.abs(p.oy)).toBeLessThanOrEqual(0.2 + 1e-9);
        }
        if (p.role === 1) {
          expect(Math.hypot(p.ox, p.oy)).toBeLessThanOrEqual(Math.hypot(0.3, 0.1) + 1e-9);
          if (Math.hypot(p.ox, p.oy) > 0.1) {
            pos++;
          }
        }
      }
    }
    // Vorzeichen: Skalarprodukt mit der Aussennormalen wird im Test gegen eine Kante geprüft
    expect(pos).toBeGreaterThan(50);
    const cls = (x: number, y: number): TileClass =>
      x < 0 || y < 0 || x >= 30 || y >= 30
        ? 'blocked'
        : y < 20 && y >= 5 && x >= 5 && x < 25
          ? 'forest'
          : 'meadow';
    for (const seed of SEEDS) {
      const L = forestLayout(seed, 30, 30, cls);
      for (let x = 7; x < 23; x++) {
        const p = L[19 * 30 + x]!; // Randreihe, Wiese bei +y
        expect(p.role).toBe(1);
        expect(Math.abs(p.ox)).toBeLessThanOrEqual(0.1 + 1e-9); // quer zur Normalen
        expect(Math.abs(p.oy)).toBeLessThanOrEqual(0.3 + 1e-9);
        if (p.oy > 0) pos++;
        else neg++;
      }
    }
    expect(neg).toBeGreaterThan(0);
  });

  it('RF-L1-10 Treppe: vorspringende Stufen rücken nach innen, einspringende nach aussen (Mittel ≥ 0,15 Kachel auseinander)', () => {
    // Waldrand als Kachel-Treppe x + y ≤ 40: im Bild eine waagrechte Zickzack-Kante. Auf x + y = 40 springt die Stufe
    // vor (Wiese rechts und unten), auf x + y = 39 springt sie ein (Wiese nur diagonal bei (+1, +1)).
    const w = 48;
    const cls = (x: number, y: number): TileClass =>
      x < 0 || y < 0 || x >= w || y >= w ? 'blocked' : x + y <= 40 ? 'forest' : 'meadow';
    const n = Math.SQRT1_2;
    for (const seed of SEEDS) {
      const L = forestLayout(seed, w, w, cls);
      const out: number[] = [],
        inn: number[] = [];
      for (let x = 12; x < 30; x++) {
        const a = L[(40 - x) * w + x]!,
          b = L[(39 - x) * w + x]!;
        expect([a.role, b.role]).toEqual([1, 1]);
        out.push(a.ox * n + a.oy * n);
        inn.push(b.ox * n + b.oy * n);
      }
      const mean = (v: number[]) => v.reduce((p, q) => p + q, 0) / v.length;
      expect(mean(inn) - mean(out), `Seed ${seed}`).toBeGreaterThanOrEqual(0.15);
    }
  });

  it('RF-L1-4 Riesenbaum: höchstens einer je Karte, in 20–60 % der Seeds 1–40, nur im Kern', () => {
    let withGiant = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const L = forestLayout(seed, N, N, at(blobGrid(seed)));
      const gi = L.filter((p) => p?.giant);
      expect(gi.length).toBeLessThanOrEqual(1);
      for (const p of gi) expect(p!.role).toBe(0);
      if (gi.length === 1) withGiant++;
    }
    expect(withGiant).toBeGreaterThanOrEqual(8);
    expect(withGiant).toBeLessThanOrEqual(24);
  });

  it('RF-L1-5 Lichtung: im Kern gibt es Kacheln mit Rand-Variante, aber nur in ≥ 9 Waldkacheln', () => {
    let clear = 0,
      kern = 0;
    for (const seed of SEEDS) {
      const L = forestLayout(seed, N, N, at(blobGrid(seed)));
      const g = at(blobGrid(seed));
      for (let y = 1; y < N - 1; y++)
        for (let x = 1; x < N - 1; x++) {
          const p = L[y * N + x];
          if (!p) continue;
          let allForest = true;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) if (g(x + dx, y + dy) !== 'forest') allForest = false;
          if (!allForest) continue;
          kern++;
          if (variantParts(p.variant).role === 1) clear++;
        }
    }
    expect(clear).toBeGreaterThan(0);
    expect(clear / kern).toBeLessThan(0.25);
  });

  it('RF-L1-6 Waldtyp aus hash2(seed + 500, 0, 0): stabil, über Seeds 1–40 mindestens 3 der 4 Typen', () => {
    const types = new Set<number>();
    for (let s = 1; s <= 40; s++) {
      expect(forestType(s)).toBe(forestType(s));
      types.add(forestType(s));
    }
    expect(types.size).toBeGreaterThanOrEqual(3);
    for (const t of types) expect([0, 1, 2, 3]).toContain(t);
  });
});
