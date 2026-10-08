import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { createWorld, home } from '../../src/sim/world';
import { lockedToolText } from '../../src/ui/goal';
import {
  PIPETTE_KONTOR_TEXT,
  buildingDefAt,
  pipetteResult,
  toolForBuilding,
} from '../../src/ui/pipette';
import type { BuildingDefId } from '../../src/sim/types';
import { uxWorld } from './worlds';

describe('Pipette (AK-TK-11..14)', () => {
  it('AK-TK-11 toolForBuilding', () => {
    for (const id of Object.keys(BUILDING_DEFS) as BuildingDefId[]) {
      if (id === 'kontor' || id === 'kontor2') expect(toolForBuilding(id)).toBeNull();
      else expect(toolForBuilding(id)).toEqual({ kind: 'build', defId: id });
    }
    expect(toolForBuilding('house')).toEqual({ kind: 'build', defId: 'house' });
    expect(toolForBuilding('cattlefarm')).toEqual({ kind: 'build', defId: 'cattlefarm' });
  });

  it('AK-TK-12 pipetteResult: frei und gesperrt', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    expect(pipetteResult(w, 'fisher')).toEqual({
      ok: true,
      tool: { kind: 'build', defId: 'fisher' },
    });
    const r = pipetteResult(w, 'school');
    const tool = { kind: 'build', defId: 'school' } as const;
    expect(lockedToolText(w, tool)).not.toBeNull();
    expect(r).toEqual({ ok: false, reason: lockedToolText(w, tool) });
    if (!r.ok) expect(r.reason).toContain(BUILDING_DEFS.school.name);
  });

  it('AK-TK-13 Kontor lässt sich nicht nachbauen', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    expect(PIPETTE_KONTOR_TEXT).toBe('Kontor lässt sich nicht nachbauen');
    for (const id of ['kontor', 'kontor2'] as const)
      expect(pipetteResult(w, id)).toEqual({ ok: false, reason: PIPETTE_KONTOR_TEXT });
  });

  it('AK-TK-14 buildingDefAt über die ganze Grundfläche', () => {
    const { w } = uxWorld();
    const big = Object.values(w.buildings).filter(
      (b) => BUILDING_DEFS[b.defId].w * BUILDING_DEFS[b.defId].h > 1,
    );
    expect(big.length).toBeGreaterThan(0);
    for (const b of big) {
      const d = BUILDING_DEFS[b.defId];
      for (let dy = 0; dy < d.h; dy++)
        for (let dx = 0; dx < d.w; dx++)
          expect(buildingDefAt(w, b.island, b.x + dx, b.y + dy)).toBe(b.defId);
    }
    expect(buildingDefAt(w, 0, -1, -1)).toBeNull();
    expect(buildingDefAt(w, 0, 9999, 9999)).toBeNull();
    expect(buildingDefAt(w, 99, 0, 0)).toBeNull();
    const isl = home(w);
    let sawNull = false;
    for (let y = 0; y < isl.height && !sawNull; y++)
      for (let x = 0; x < isl.width; x++)
        if (isl.tiles[y * isl.width + x]!.buildingId === null) {
          expect(buildingDefAt(w, 0, x, y)).toBeNull();
          sawNull = true;
          break;
        }
    expect(sawNull).toBe(true);
    // Wegkachel und Waldkachel ohne Gebäude -> null
    const road = isl.tiles.findIndex((t) => t.road && t.buildingId === null);
    expect(road).toBeGreaterThanOrEqual(0);
    expect(buildingDefAt(w, 0, road % isl.width, Math.floor(road / isl.width))).toBeNull();
    const forest = isl.tiles.findIndex((t) => t.terrain === 'forest' && t.buildingId === null);
    expect(forest).toBeGreaterThanOrEqual(0);
    expect(buildingDefAt(w, 0, forest % isl.width, Math.floor(forest / isl.width))).toBeNull();
  });
});
