import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bodyHull } from '../../src/render/iso';
import { bodyPolygons } from '../../src/render/sprites';
import { VARIANT_COUNT } from '../../src/render/variants';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import type { Building, Tier } from '../../src/sim/types';

// L3 Referenz (Gate-Auflage Q2): Picking-Polygone (`bodyPolygons`) und `bodyHull` bleiben bytegleich, auch wenn
// der Bildmodus (Hand-Linie, Silhouette, Bodenkontakt) hinzukommt. Die Fixture entstand auf dem unveränderten
// Stand vor L3. Neu erzeugen nur nach bewusster Änderung der Körperformen: `it.skip` unten auf `it` stellen,
// einmal laufen lassen, wieder auf `it.skip` setzen.

const FIXTURE = 'tests/render/fixtures/l3-body-referenz.json';

interface Entry {
  polygons: string;
  hull: string;
  count: number;
}
const sha = (s: string): string =>
  createHash('sha256').update(new TextEncoder().encode(s)).digest('hex');

function compute(): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const def of Object.values(BUILDING_DEFS)) {
    const tiers: (Tier | undefined)[] = def.id === 'house' ? [1, 2, 3, 4] : [undefined];
    const levels: (2 | 3 | undefined)[] = LEVELS[def.id] ? [undefined, 2, 3] : [undefined];
    for (const tier of tiers)
      for (const level of levels)
        for (let v = 0; v < VARIANT_COUNT; v++) {
          const b: Building = {
            id: 3,
            defId: def.id,
            x: 10,
            y: 10,
            connected: true,
            progress: 0,
            state: 'ok',
            island: 0,
          };
          if (tier) b.house = { tier } as unknown as Building['house'];
          if (level) b.level = level;
          const polys = bodyPolygons(def, b, v);
          out[`${def.id}|t${tier ?? '-'}|l${level ?? '-'}|v${v}`] = {
            polygons: sha(JSON.stringify(polys)),
            hull: sha(JSON.stringify(bodyHull(def, b))),
            count: polys.length,
          };
        }
  }
  return out;
}

describe('L3 Referenz: Picking-Polygone und bodyHull bytegleich', () => {
  it.skip('Generator: schreibt die Fixture (nur bewusst ausführen)', () => {
    writeFileSync(FIXTURE, JSON.stringify(compute(), null, 1));
  });
  it('RF-L3-1 bodyPolygons und bodyHull stimmen für jeden Typ, jede Stufe, Ausbaustufe und Variante mit der Fixture überein', () => {
    const ref = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Entry>;
    const now = compute();
    expect(Object.keys(now).sort()).toEqual(Object.keys(ref).sort());
    const diff = Object.keys(ref).filter((k) => JSON.stringify(now[k]) !== JSON.stringify(ref[k]));
    expect(diff).toEqual([]);
  });
});
