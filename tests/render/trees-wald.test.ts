import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { sortedObjects } from '../../src/render/iso';
import { crownsFor, type TreeItem } from '../../src/render/trees';
import { forceRect } from '../sim/helpers';

// trees-wald.test.ts — L1 „Wald organisch" (ART-STIL-02): Platzierung und Form des Waldes.

/** Welt mit geradem Waldrand: Wald x0 … x0+11, y0 … y0+5; ringsum freie Wiese. Der Rand zeigt nach +y. */
function straightEdgeWorld(seed: number): { world: World; x0: number; y0: number } {
  const world = createWorld(seed);
  const x0 = 20,
    y0 = 20;
  forceRect(world, x0 - 3, y0 - 3, 18, 12, 'grass');
  forceRect(world, x0, y0, 12, 6, 'forest');
  return { world, x0, y0 };
}
const trees = (w: World): TreeItem[] =>
  sortedObjects(w).filter((i): i is TreeItem => i.kind === 'tree');
const sd = (v: number[]): number => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};

describe('L1 Kronenlage aus einem Feld', () => {
  it('Kronenlage aus einem Feld: Entlang eines geraden Waldrands von 10 Kacheln streut der Abstand der äussersten Krone zur Kachelkante mit SD ≥ 0,12 Kachel', () => {
    for (const seed of [1, 2, 5, 7]) {
      const { world, x0, y0 } = straightEdgeWorld(seed);
      const row = trees(world).filter(
        (t) => t.fp.y === y0 + 5 && t.fp.x >= x0 + 1 && t.fp.x <= x0 + 10,
      );
      expect(row).toHaveLength(10);
      // Abstand der äussersten Krone zur Kachelkante (+y-Seite) in Kacheln, inklusive Stempelversatz
      const dist = row.map((t) => {
        const oy = (t as { oy?: number }).oy ?? 0;
        return Math.max(...crownsFor(world.seed, t.variant).map((c) => c.cy + c.r + oy)) - 1;
      });
      expect(sd(dist), `Seed ${seed}`).toBeGreaterThanOrEqual(0.12);
    }
  });
});
