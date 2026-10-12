import { describe, expect, it } from 'vitest';
import { ARCHIPEL_EXTRA_BYTES, ARCHIPEL_LAYER_SCALE } from '../../src/render/limits';
import { terrainLayerSize } from '../../src/render/terrain';
import { ISLANDS } from '../../src/sim/defs/sea';

describe('M12 E1 Terrain', () => {
  it('AK-E1-21 Archipel-Speicher ist ehrlich benannt (≈ 56,8 MB), Faktor 2', () => {
    // M14-E1: bewusst neu gepinnt (R557): Insel C (Weidenau, 24 × 24) kommt dazu, vorher ≈ 44,5 MB (AK-M14E1-21).
    expect(ARCHIPEL_EXTRA_BYTES / 1e6).toBeCloseTo(56.8, 0);
    expect(ARCHIPEL_LAYER_SCALE).toBe(2);
  });

  it('AK-E1-21 Ebene der Insel A bei Faktor 2 misst 1536 Pixel Kante', () => {
    const a = ISLANDS.find((d) => d.kind === 'A')!;
    const size = terrainLayerSize({ width: a.size, height: a.size }, ARCHIPEL_LAYER_SCALE)[0]!;
    expect(size).toEqual({ w: 1536, h: 1536 });
  });
});
