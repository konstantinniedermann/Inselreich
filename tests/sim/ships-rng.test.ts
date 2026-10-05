import { describe, expect, it, vi } from 'vitest';
import { laneTicks } from '../../src/sim/islands';
import { createRng } from '../../src/sim/rng';
import { setRoute, tickShips } from '../../src/sim/ships';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';

vi.mock('../../src/sim/rng', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/sim/rng')>();
  return { ...orig, createRng: vi.fn(orig.createRng) };
});

vi.mock('../../src/sim/islands', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/sim/islands')>();
  return { ...orig, laneTicks: vi.fn(orig.laneTicks) };
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

  it('laneTicks wird nur bei Abfahrt gerechnet, nie je Tick', () => {
    const w = seaWorld();
    foundKontor2Literal(w, 1);
    foundKontor2Literal(w, 2);
    for (const i of [0, 1, 2]) w.islands[i]!.stock.wood = 100;
    for (const [a, b] of [
      [0, 2],
      [0, 1],
      [1, 2],
      [0, 2],
    ] as [number, number][]) {
      const s = shipLiteral(w);
      setRoute(w, s.id, {
        a,
        b,
        ab: [{ good: 'wood', reserve: 0 }],
        ba: [{ good: 'tools', reserve: 0 }],
      });
    }
    vi.mocked(laneTicks).mockClear();
    const n = 3000;
    let departures = 0;
    for (let i = 0; i < n; i++) {
      const before = w.ships.map((s) => ({ to: s.to, left: s.left }));
      tickShips(w);
      w.ships.forEach((s, k) => {
        const b = before[k]!;
        if (s.to !== null && (b.to === null || b.left === 1)) departures += 1;
      });
    }
    expect(departures).toBeGreaterThan(4);
    expect(laneTicks).toHaveBeenCalledTimes(departures);
    expect(departures).toBeLessThan((n * 4) / 10);
  });
});

function home0(w: ReturnType<typeof seaWorld>): void {
  w.islands[0]!.stock.wood = 100;
}
