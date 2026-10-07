import { describe, expect, it } from 'vitest';
import {
  MIN_CROWNS,
  OVERHANG,
  VORWALD_REACH,
  VORWALD_TOP,
  bandCell,
  forestClearing,
  forestType,
  woodLayout,
  type TileClass,
  type WoodInput,
} from '../../src/render/forest';
import { SAUM_LEVEL, saumAt } from '../../src/render/woodField';
import { TREE_H, crownGeom, type Crown } from '../../src/render/crown';
import { valueNoise } from '../../src/sim/noise';
import { expand, treeItems, treesOf, woodWorld } from './woodHelpers';

// forest.test.ts — reine Platzierung des Waldes (WALD-02): jede Krone einzeln aus dem Saumfeld, Blue-Noise über
// Kachelgrenzen, Vorwald, Tiefenband-Zellen, Riesenbaum, Waldtyp.

const N = 40;
/** Klassenraster: Wald-Klumpen aus Rauschen, Wiese ringsum, ein Weg (Objekt) quer, ein Haus mit Vorplatz. */
function grid(seed: number): TileClass[] {
  const g: TileClass[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const n = valueNoise(seed + 77, x / 7, y / 7);
      g.push(n > 0.5 ? 'forest' : 'meadow');
    }
  for (let x = 4; x < 30; x++) g[20 * N + x] = 'object'; // Weg
  g[8 * N + 8] = 'object'; // Haus auf (8, 8), Vorplatz +x, +y, +x+y
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const)
    if (g[(8 + dy) * N + 8 + dx] === 'meadow') g[(8 + dy) * N + 8 + dx] = 'quiet';
  return g;
}
const input = (seed: number, g = grid(seed)): WoodInput => ({
  seed,
  w: N,
  h: N,
  terrainForest: (x, y) => {
    const c = g[y * N + x];
    return c === 'forest' || (c === 'object' && valueNoise(seed + 77, x / 7, y / 7) > 0.5);
  },
  cls: (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 'blocked' : g[y * N + x]!),
});
type Abs = Crown & { fx: number; fy: number; own: boolean };
/** Alle Bäume eines Layouts mit absolutem Fuss (Gruppen in ihre Bäume aufgelöst). */
const flat = (L: ReturnType<typeof woodLayout>): Abs[] =>
  expand(
    L.cells.flatMap((c) =>
      c.crowns.map((k) => ({ ...k, fx: c.x + k.cx, fy: c.y + k.cy, own: c.own })),
    ),
  );

const SEEDS = [1, 2, 5, 7, 11, 14];

describe('WALD-02 Platzierung', () => {
  it('RF-W-2 deterministisch: gleiche Eingabe, gleiche Kronen (Lage, Grösse, Art, Ton)', () => {
    for (const seed of [3, 7]) {
      const a = woodLayout(input(seed)),
        b = woodLayout(input(seed));
      expect(b.cells).toEqual(a.cells);
      expect(flat(a).length).toBeGreaterThan(400);
    }
    expect(flat(woodLayout(input(3)))).not.toEqual(flat(woodLayout(input(4))));
  });

  it('RF-W-3 Kronen nie auf gesperrten Kacheln: Fuss nur auf Wald oder Wiese, Fussscheibe nie über Objekt, Sand oder Vorplatz (+x, +y, +x+y)', () => {
    for (const seed of SEEDS) {
      const g = grid(seed);
      const cls = (x: number, y: number): TileClass =>
        x < 0 || y < 0 || x >= N || y >= N ? 'blocked' : g[y * N + x]!;
      for (const c of flat(woodLayout(input(seed, g)))) {
        const tx = Math.floor(c.fx),
          ty = Math.floor(c.fy);
        expect(['forest', 'meadow']).toContain(cls(tx, ty));
        if (c.giant) continue;
        // jede Nachbarkachel, die die Fussscheibe schneidet, ist Wald oder Wiese
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = Math.max(tx + dx, Math.min(c.fx, tx + dx + 1)),
              ny = Math.max(ty + dy, Math.min(c.fy, ty + dy + 1));
            if ((nx - c.fx) ** 2 + (ny - c.fy) ** 2 < c.r * c.r - 1e-9)
              expect(['forest', 'meadow'], `Seed ${seed} ${tx + dx},${ty + dy}`).toContain(
                cls(tx + dx, ty + dy),
              );
          }
        expect(c.fx - c.r).toBeGreaterThanOrEqual(tx - OVERHANG - 1e-9);
        expect(c.fx + c.r).toBeLessThanOrEqual(tx + 1 + OVERHANG + 1e-9);
      }
    }
  });

  it('RF-W-3 Vorwald höchstens VORWALD_REACH = 2 Kacheln vor dem Wald, nie vor einem Gebäude, Gehölze ≤ 0,6 × TREE_H', () => {
    expect(VORWALD_REACH).toBeLessThanOrEqual(2);
    expect(VORWALD_TOP).toBeLessThanOrEqual(0.6 * TREE_H + 1e-9);
    let meadow = 0;
    for (const seed of SEEDS) {
      const g = grid(seed);
      for (const c of flat(woodLayout(input(seed, g)))) {
        const tx = Math.floor(c.fx),
          ty = Math.floor(c.fy);
        if (g[ty * N + tx] !== 'meadow') continue;
        meadow++;
        let d = Infinity;
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++)
            if (g[y * N + x] === 'forest')
              d = Math.min(d, Math.max(Math.abs(x - tx), Math.abs(y - ty)));
        expect(d).toBeLessThanOrEqual(2);
        expect(c.h + c.r * 64).toBeLessThanOrEqual(0.6 * TREE_H * 1.25); // grobe Obergrenze, genau unten
      }
    }
    expect(meadow).toBeGreaterThan(30);
  });

  it('RF-W-3 Vorwald auf echten Karten: Kronen auf Wiesenkacheln sind höchstens 0,6 × TREE_H hoch, ihre Dichte fällt nach aussen ab', () => {
    for (const seed of [7, 14, 1]) {
      const w = woodWorld(seed);
      const isl = w.islands[0]!;
      const W = isl.width;
      const terr = (x: number, y: number) => isl.tiles[y * W + x]?.terrain;
      const dist = (tx: number, ty: number): number => {
        let d = 9;
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++)
            if (terr(tx + dx, ty + dy) === 'forest')
              d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
        return d;
      };
      const per = [0, 0, 0, 0];
      const tiles = [0, 0, 0, 0];
      for (let i = 0; i < isl.tiles.length; i++)
        if (isl.tiles[i]!.terrain === 'grass') {
          const d = dist(i % W, Math.floor(i / W));
          if (d <= 3) tiles[d]!++;
        }
      for (const c of treesOf(w)) {
        const tx = Math.floor(c.fx),
          ty = Math.floor(c.fy);
        if (terr(tx, ty) !== 'grass') continue;
        expect(c.h + crownHalf(c), `Seed ${seed}`).toBeLessThanOrEqual(0.6 * TREE_H + 1e-6);
        const d = dist(tx, ty);
        expect(d).toBeLessThanOrEqual(2);
        per[d]!++;
      }
      const dens = per.map((n, d) => n / Math.max(1, tiles[d]!));
      expect(dens[1]!, `Seed ${seed}`).toBeGreaterThan(dens[2]!);
      // Wiese bleibt Wiese: im Mittel unter einer Krone je Vorwaldkachel
      expect(dens[1]!, `Seed ${seed}`).toBeLessThan(1.5);
    }
  });

  it('RF-W-4 jede freie Waldkachel trägt ≥ MIN_CROWNS = 2 lebende Kronen (Spec 2.1.5), auch hinter der Saumlinie', () => {
    expect(MIN_CROWNS).toBeGreaterThanOrEqual(2);
    for (const seed of SEEDS) {
      const g = grid(seed);
      const n = new Map<number, number>();
      for (const c of flat(woodLayout(input(seed, g))))
        if (!c.dead) {
          const k = Math.floor(c.fy) * N + Math.floor(c.fx);
          n.set(k, (n.get(k) ?? 0) + 1);
        }
      for (let i = 0; i < N * N; i++)
        if (g[i] === 'forest')
          expect(n.get(i) ?? 0, `Seed ${seed} Kachel ${i}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('RF-W-5 Höhen- und Grössenspreizung im Nadelwald: höchste / niedrigste Krone ≥ 2 und Radien ≥ 2 (P95/P5), einzelne Überhälter', () => {
    for (const seed of [7, 14]) {
      expect(forestType(seed)).toBe(1);
      const cs = treesOf(woodWorld(seed)).filter(
        (c) => c.kind === 1 && !c.bush && !c.dead && !c.giant && !c.young,
      );
      const q = (a: number[], p: number) =>
        [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))]!;
      const top = cs.map((c) => c.h + crownHalf(c));
      expect(q(top, 0.95) / q(top, 0.05), `Seed ${seed} Höhe`).toBeGreaterThanOrEqual(2);
      const r = cs.map((c) => c.r);
      expect(q(r, 0.95) / q(r, 0.05), `Seed ${seed} Radius`).toBeGreaterThanOrEqual(2);
      expect(Math.max(...top)).toBeLessThanOrEqual(TREE_H + 1e-6);
    }
  });

  it('RF-W-6 Bestände, Töne, Beimischung: Nachbarkronen gleicher Art ≥ 65 %, Tonflecken (gleicher Ton bei ≥ 50 % der Nachbarn, alle drei Töne), Beimischung 3–20 %', () => {
    for (const seed of [7, 14, 2, 1]) {
      const cs = treesOf(woodWorld(seed)).filter((c) => !c.dead && !c.bush && !c.giant);
      let same = 0,
        tone = 0,
        pairs = 0;
      for (let i = 0; i < cs.length; i++) {
        const a = cs[i]!;
        let best: (typeof cs)[number] | null = null,
          bd = 0.7;
        for (let j = 0; j < cs.length; j++) {
          if (i === j) continue;
          const d = Math.hypot(cs[j]!.fx - a.fx, cs[j]!.fy - a.fy);
          if (d < bd) {
            bd = d;
            best = cs[j]!;
          }
        }
        if (!best) continue;
        pairs++;
        if (best.kind === a.kind) same++;
        if (Math.abs((best.tone ?? 0) - (a.tone ?? 0)) <= 0.5) tone++; // Bäume einer Gruppe streuen ±½ Stufe
      }
      expect(same / pairs, `Seed ${seed} Art`).toBeGreaterThanOrEqual(0.65);
      expect(tone / pairs, `Seed ${seed} Ton`).toBeGreaterThanOrEqual(0.5);
      for (const t of [-1, 0, 1]) expect(cs.some((c) => Math.round(c.tone ?? 0) === t)).toBe(true);
      const counts = new Map<number, number>();
      for (const c of cs) counts.set(c.kind, (counts.get(c.kind) ?? 0) + 1);
      const main = Math.max(...counts.values());
      expect(1 - main / cs.length, `Seed ${seed} Beimischung`).toBeGreaterThanOrEqual(0.03);
    }
  });

  it('RF-W-7 Sortierung mit Versatz (B5): die Kronen jeder Tiefenband-Zelle liegen in [x + y + 0,5; x + y + 1,5), über die Zeilen steigt die Tiefe in Zeichenreihenfolge', () => {
    for (let i = 0; i < 500; i++) {
      const fx = 3 + ((i * 37) % 97) / 9.7,
        fy = 2 + ((i * 53) % 89) / 8.9;
      const c = bandCell(fx, fy);
      expect(fx + fy).toBeGreaterThanOrEqual(c.x + c.y + 0.5 - 1e-9);
      expect(fx + fy).toBeLessThan(c.x + c.y + 1.5);
      expect(Math.abs(fx - fy - (c.x - c.y))).toBeLessThanOrEqual(1 + 1e-9);
      expect(Number.isInteger(c.x) && Number.isInteger(c.y)).toBe(true);
    }
    for (const seed of [7, 14]) {
      const items = treeItems(woodWorld(seed));
      let maxPrev = -Infinity,
        row = -1,
        maxRow = -Infinity;
      for (const it of items) {
        const k = it.fp.x + it.fp.y;
        const ds = it.crowns.map((c) => it.fp.x + c.cx + it.fp.y + c.cy);
        if (it.own) {
          for (const d of ds) {
            expect(d).toBeGreaterThanOrEqual(k);
            expect(d).toBeLessThanOrEqual(k + 2);
          }
          continue;
        }
        if (k !== row) {
          maxPrev = Math.max(maxPrev, maxRow);
          maxRow = -Infinity;
          row = k;
        }
        for (const d of ds) {
          expect(d, `Seed ${seed} Zelle ${it.fp.x},${it.fp.y}`).toBeGreaterThanOrEqual(
            maxPrev - 1e-9,
          );
          maxRow = Math.max(maxRow, d);
        }
        // Kronen einer Zelle nach Tiefe sortiert
        for (let j = 1; j < ds.length; j++)
          expect(ds[j]!).toBeGreaterThanOrEqual(ds[j - 1]! - 1e-9);
      }
    }
  });

  it('RF-W-8 keine Periodik im Kachelabstand (B4): Fusspunkte im Kachel-Anteil gleich verteilt (6 × 6-Fächer 0,5–1,6 × Mittel), keine zwei Nachbarkacheln mit derselben Anordnung', () => {
    for (const seed of [7, 14, 1]) {
      const cs = treesOf(woodWorld(seed)).filter((c) => !c.dead && !c.bush);
      const bins = new Array(36).fill(0);
      for (const c of cs) {
        const u = c.fx - Math.floor(c.fx),
          v = c.fy - Math.floor(c.fy);
        bins[Math.min(5, Math.floor(v * 6)) * 6 + Math.min(5, Math.floor(u * 6))]++;
      }
      const m = cs.length / 36;
      for (const b of bins) {
        expect(b, `Seed ${seed}`).toBeGreaterThan(0.5 * m);
        expect(b, `Seed ${seed}`).toBeLessThan(1.6 * m);
      }
      // Anordnung je Kachel (gerundete Anteile): keine Wiederholung in 4-/8-Nachbarschaft
      const pat = new Map<string, string>();
      for (const c of cs) {
        const k = `${Math.floor(c.fx)},${Math.floor(c.fy)}`;
        const s = `${(c.fx % 1).toFixed(2)}:${(c.fy % 1).toFixed(2)}`;
        pat.set(k, [pat.get(k) ?? '', s].sort().join('|'));
      }
      let rep = 0;
      for (const [k, p] of pat) {
        const [x, y] = k.split(',').map(Number) as [number, number];
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
          [1, 1],
          [1, -1],
        ] as const)
          if (pat.get(`${x + dx},${y + dy}`) === p) rep++;
      }
      expect(rep, `Seed ${seed}`).toBe(0);
    }
  });

  it('RF-W-9 Saum: Kronen hinter der Saumlinie sind niedrig und werfen eigenen Schatten; im Kern stehen höhere Bäume', () => {
    for (const seed of [7, 14]) {
      const w = woodWorld(seed);
      const cs = treesOf(w).filter((c) => !c.dead && !c.bush && !c.giant);
      const behind = cs.filter(
        (c) =>
          c.cast &&
          w.islands[0]!.tiles[Math.floor(c.fy) * 64 + Math.floor(c.fx)]!.terrain === 'forest',
      );
      // Kern: Bäume ohne eigenen Schatten (Gruppen aufgelöst); verglichen wird die Höhe der Krone über dem Fuss
      const core = cs.filter((c) => !c.cast);
      const top = (c: Crown) => c.h + crownHalf(c);
      const mean = (a: Crown[]) => a.reduce((s, c) => s + top(c), 0) / a.length;
      expect(behind.length).toBeGreaterThan(0);
      expect(mean(behind)).toBeLessThan(0.85 * mean(core));
    }
    // Einzelkronen ohne eigenen Schatten stehen innerhalb der Saumlinie (S ≥ SAUM_LEVEL; Toleranz für das Rücken an
    // Sperrkanten). Gruppen zählen mit ihrem Fuss (ihre Bäume streuen bis zum Gruppenradius).
    const L = woodLayout(input(5));
    let n = 0;
    for (const cell of L.cells)
      for (const c of cell.crowns)
        if (!c.cast && !c.dead && !c.giant && !cell.own) {
          n++;
          expect(saumAt(5, L.mask, cell.x + c.cx, cell.y + c.cy)).toBeGreaterThanOrEqual(
            SAUM_LEVEL - 0.15,
          );
        }
    expect(n).toBeGreaterThan(100);
  });

  it('RF-L1-4 Riesenbaum: höchstens einer je Karte, in 20–60 % der Seeds 1–40, nur in einer Kernkachel', () => {
    let withGiant = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const g = grid(seed);
      const gi = flat(woodLayout(input(seed, g))).filter((c) => c.giant);
      expect(gi.length).toBeLessThanOrEqual(1);
      for (const c of gi) {
        const tx = Math.floor(c.fx),
          ty = Math.floor(c.fy);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) expect(g[(ty + dy) * N + tx + dx]).toBe('forest');
      }
      if (gi.length === 1) withGiant++;
    }
    expect(withGiant).toBeGreaterThanOrEqual(8);
    expect(withGiant).toBeLessThanOrEqual(24);
  });

  it('RF-L1-5 Lichtung: wo forestClearing ≥ 0,5, stehen im Kern weniger Kronen (≤ 75 % der Dichte daneben), Totholz kommt vor', () => {
    let inC = 0,
      inT = 0,
      outC = 0,
      outT = 0,
      dead = 0;
    for (const seed of SEEDS) {
      const g = grid(seed);
      const cs = flat(woodLayout(input(seed, g))).filter((c) => !c.dead);
      dead += flat(woodLayout(input(seed, g))).filter((c) => c.dead).length;
      const per = new Map<number, number>();
      for (const c of cs)
        per.set(
          Math.floor(c.fy) * N + Math.floor(c.fx),
          (per.get(Math.floor(c.fy) * N + Math.floor(c.fx)) ?? 0) + 1,
        );
      for (let y = 2; y < N - 2; y++)
        for (let x = 2; x < N - 2; x++) {
          let core = true;
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) core &&= g[(y + dy) * N + x + dx] === 'forest';
          if (!core) continue;
          const n = per.get(y * N + x) ?? 0;
          if (forestClearing(seed, x + 0.5, y + 0.5) >= 0.5) {
            inC += n;
            inT++;
          } else {
            outC += n;
            outT++;
          }
        }
    }
    expect(inT).toBeGreaterThan(0);
    expect(inC / inT).toBeLessThanOrEqual(0.75 * (outC / outT));
    expect(dead).toBeGreaterThan(0);
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

/** Halbe Kronenhöhe (aus der Form). */
function crownHalf(c: Crown): number {
  return crownGeom(c).hh;
}
