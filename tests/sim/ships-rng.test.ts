import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../src/sim/rng';
import { setRoute, tickShips } from '../../src/sim/ships';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';

vi.mock('../../src/sim/rng', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/sim/rng')>();
  return { ...orig, createRng: vi.fn(orig.createRng) };
});

describe('M12 E4 tickShips Zufall', () => {
  it('AK-E4-10 tickShips zieht keinen Zufall', () => {
    const w = seaWorld();
    foundKontor2Literal(w, 2);
    home0(w);
    const s = shipLiteral(w);
    setRoute(w, s.id, {
      a: 0,
      b: 2,
      ab: [{ good: 'wood', reserve: 0 }],
      ba: [{ good: 'tools', reserve: 0 }],
    });
    vi.mocked(createRng).mockClear();
    for (let i = 0; i < 5000; i++) tickShips(w);
    expect(createRng).toHaveBeenCalledTimes(0);
  });
});

function home0(w: ReturnType<typeof seaWorld>): void {
  w.islands[0]!.stock.wood = 100;
}
