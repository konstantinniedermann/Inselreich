// M14-E1 T03: Save v13 (Insel C «Weidenau»). Rundlauf (AK-20), Migration v12 → v13 (AK-21, Tech-B2, Tech-B3).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ISLAND_GAP_MIN } from '../../src/sim/defs/sea';
import { recomputeConnectivity } from '../../src/sim/roads';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { foldBackToV12, putBuilding } from './helpers';
import { foundKontor2Literal } from './seaHelpers';

const FELS = 2;
const WEIDEN = 3;

const loaded = (json: string): World => {
  const r = deserialize(json);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};

function v12Of(w: World): Record<string, unknown> {
  return foldBackToV12(JSON.parse(serialize(w)) as Record<string, unknown>);
}

/** Welt mit Kontor II und Steinbruch auf der Felsbucht (Seed 3), wie AK-M14E1-21 verlangt. */
function felsWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  const k = foundKontor2Literal(w, FELS);
  putBuilding(w, FELS, 'quarry', k.x + 4, k.y);
  w.money = 12_345;
  recomputeConnectivity(w);
  return w;
}

describe('M14-E1 Save v13', () => {
  it('Version 13 in SAVE_VERSION und createWorld', () => {
    expect(SAVE_VERSION).toBe(13);
    expect(createWorld(3).version).toBe(13);
  });

  it('AK-M14E1-20: Rundlauf mit Gebäuden und Lager auf Weidenau', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = foundKontor2Literal(w, WEIDEN);
    putBuilding(w, WEIDEN, 'canefarm', k.x + 4, k.y);
    putBuilding(w, WEIDEN, 'sheepfarm', k.x + 7, k.y);
    w.islands[WEIDEN]!.stock.cane = 7;
    recomputeConnectivity(w);
    const back = loaded(serialize(w));
    expect(back).toEqual(w);
    expect(back.islands[WEIDEN]!.stock.cane).toBe(7);
  });

  it('AK-M14E1-21: Migration v12 → v13 ergänzt Weidenau, Rest unverändert', () => {
    const w = felsWorld();
    const old = v12Of(w);
    expect(old.version).toBe(12);
    expect((old.islands as unknown[]).length).toBe(3);
    const reference = loaded(serialize(w));
    const m = loaded(JSON.stringify(old));
    expect(m.version).toBe(13);
    expect(m.islands).toHaveLength(4);
    expect(JSON.stringify(m.islands[3])).toBe(JSON.stringify(createWorld(3).islands[3]));
    expect(m.islands.slice(0, 3)).toEqual(reference.islands.slice(0, 3));
    expect(m.buildings).toEqual(reference.buildings);
    expect(m.ships).toEqual(reference.ships);
    expect(m.money).toBe(12_345);
  });

  it('Tech-B3: verschobene gespeicherte Möweninsel → C ohne Überlappung, kein Wurf', () => {
    const old = v12Of(felsWorld());
    const stored = (old.islands as Record<string, number>[])[1]!;
    stored.ox = stored.ox! + 3;
    const m = loaded(JSON.stringify(old));
    expect(m.islands).toHaveLength(4);
    const c = m.islands[3]!;
    for (const o of m.islands.slice(0, 3)) {
      const gx = Math.max(o.ox - (c.ox + c.width), c.ox - (o.ox + o.width));
      const gy = Math.max(o.oy - (c.oy + c.height), c.oy - (o.oy + o.height));
      expect(Math.max(gx, gy)).toBeGreaterThanOrEqual(ISLAND_GAP_MIN);
    }
  });

  it('Tech-B2: save.ts importiert weder createWorld noch world.ts', () => {
    const src = readFileSync('src/sim/save.ts', 'utf8');
    expect(src).not.toMatch(/from '\.\/world'/);
    expect(src).not.toMatch(/createWorld\(/);
  });
});
