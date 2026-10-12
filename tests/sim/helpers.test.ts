// M14-E1 T03: Rückfaltung foldBackToV12 (AK-M14E1-24a, 24h).
import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { fnv1a32, foldBackToV12 } from './helpers';

const jsonOf = (seed: number): Record<string, unknown> =>
  JSON.parse(serialize(createWorld(seed))) as Record<string, unknown>;

describe('foldBackToV12', () => {
  it('AK-M14E1-24a: createWorld(3) → v12-Form, Pin auf der Basis 62da7923 gemessen', () => {
    const out = foldBackToV12(jsonOf(3));
    const text = JSON.stringify(out);
    expect(out.version).toBe(12);
    expect((out.islands as unknown[]).length).toBe(3);
    // Basis (main @ 62da7923): serialize(createWorld(3)) = 306608 Zeichen, FNV-1a 2274015653
    expect({ hash: fnv1a32(text), length: text.length }).toEqual({
      hash: 2274015653,
      length: 306608,
    });
  });

  it('AK-M14E1-24h: nur 3 Inseln bei Version 13 → Fehler', () => {
    const x = jsonOf(3);
    (x.islands as unknown[]).pop();
    expect(() => foldBackToV12(x)).toThrow('foldBackToV12: 4 Inseln erwartet');
  });
});
