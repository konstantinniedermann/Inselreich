import { describe, expect, it } from 'vitest';
import { RESERVE_GOODS, RESERVE_STEPS } from '../../src/sim/defs/reserve';
import { TIERS } from '../../src/sim/defs/tiers';
import { createWorld } from '../../src/sim/world';

describe('Sperrbestand: Defs und Anlage', () => {
  it('Reserve-Güter sind Holz und Stein', () => {
    expect([...RESERVE_GOODS]).toEqual(['wood', 'stone']);
  });

  it('Reserve-Stufen sind 0, 20, 40, 60', () => {
    expect([...RESERVE_STEPS]).toEqual([0, 20, 40, 60]);
  });

  it('kein Haushaltsgut aus TIERS[*].needs ist ein Reserve-Gut (AK-SB-01)', () => {
    const needed = Object.values(TIERS).flatMap((t) => Object.keys(t.needs));
    for (const good of RESERVE_GOODS) expect(needed).not.toContain(good);
  });

  it('createWorld legt auf jeder Insel reserve 0/0 an', () => {
    const world = createWorld(1);
    expect(world.islands.length).toBeGreaterThan(1);
    for (const isl of world.islands) expect(isl.reserve).toEqual({ wood: 0, stone: 0 });
  });
});
