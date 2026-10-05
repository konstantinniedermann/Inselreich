import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { TEX } from '../../src/render/iso';
import { terrainFields } from '../../src/render/terrainField';
import {
  buildGrid,
  foothillField,
  foothillsFor,
  patchGrid,
  RASTER,
  terrainCodes,
  terrainPatchRect,
} from '../../src/render/terrain';

// H-T3 — foothillField je Felder cachen (gleiche Instanz), patchGrid invalidiert bei Gebirgsänderung.

function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return Math.min(a.length, b.length);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
  return -1;
}

/** Eine Wiesenkachel mit Gebirge in ≤ 3 Kacheln Abstand (Mitte der Karte nicht nötig). */
function grassNearMountain(w: ReturnType<typeof createWorld>): number {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w.width || y >= w.height ? '' : w.tiles[y * w.width + x]!.terrain;
  for (let y = 4; y < w.height - 4; y++)
    for (let x = 4; x < w.width - 4; x++) {
      if (at(x, y) !== 'grass') continue;
      for (let d = -3; d <= 3; d++) if (at(x + d, y) === 'mountain') return y * w.width + x;
    }
  throw new Error('keine Wiese am Gebirge');
}

describe('H-T3 foothillsFor (Cache je Felder)', () => {
  it('H-T3 gleiche Instanz bei unveränderten Feldern, Werte wie foothillField', () => {
    const w = createWorld(3, { unlockAll: true });
    const fields = terrainFields(w);
    const a = foothillsFor(fields);
    expect(foothillsFor(fields)).toBe(a);
    expect(firstDiff(a.near.v, foothillField(fields).near.v)).toBe(-1);
    expect(firstDiff(a.wide.v, foothillField(fields).wide.v)).toBe(-1);
    expect(foothillsFor(terrainFields(w))).not.toBe(a);
  });

  it('H-T3 patchGrid mit geänderter Gebirgskachel aktualisiert den Cache und ergibt das Raster des Vollaufbaus', () => {
    const w = createWorld(3, { unlockAll: true });
    const fields = terrainFields(w);
    const grid = buildGrid(w, fields);
    const before = foothillsFor(fields);
    const prev = terrainCodes(w);
    const t = grassNearMountain(w);
    w.tiles[t]!.terrain = 'mountain';
    const next = terrainCodes(w);
    const rect = terrainPatchRect(prev, next, w.width, w.height)!;
    patchGrid(w, fields, grid, prev, next, rect);
    const after = foothillsFor(fields);
    expect(after).not.toBe(before);
    expect(firstDiff(after.near.v, foothillField(fields).near.v)).toBe(-1);
    expect(firstDiff(after.wide.v, foothillField(fields).wide.v)).toBe(-1);
    expect(firstDiff(after.near.v, before.near.v)).not.toBe(-1);
    const full = buildGrid(w);
    // patchGrid gleicht nur das Rechteck ab (Knoten je Kachel: TEX / RASTER); dort muss es dem Vollaufbau gleichen
    const k = TEX / RASTER;
    for (const f of ['scree', 'tint', 'tone', 'shade', 'mfoot', 'patch', 'warm'] as const)
      for (let j = rect.y0 * k; j <= (rect.y1 + 1) * k; j++)
        for (let i = rect.x0 * k; i <= (rect.x1 + 1) * k; i++)
          expect(grid[f][j * grid.nx + i], `${f} ${i},${j}`).toBe(full[f][j * grid.nx + i]);
  }, 30000);

  it('H-T3 patchGrid ohne Gebirgsänderung (Wald ↔ Wiese) behält die Instanz', () => {
    const w = createWorld(3, { unlockAll: true });
    const fields = terrainFields(w);
    const grid = buildGrid(w, fields);
    const before = foothillsFor(fields);
    const prev = terrainCodes(w);
    const k = grassNearMountain(w);
    w.tiles[k]!.terrain = 'forest';
    const next = terrainCodes(w);
    patchGrid(w, fields, grid, prev, next, terrainPatchRect(prev, next, w.width, w.height)!);
    expect(foothillsFor(fields)).toBe(before);
  }, 30000);
});
