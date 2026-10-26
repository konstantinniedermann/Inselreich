import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { startColony } from './controller';
import { MERCHANT_TICK_LIMIT, newMerchantTrajectory, runMerchants } from './merchantsController';

/**
 * Belegt: Ziel 2 wird erreicht, obwohl nach Ziel 1 Marken gezogen werden und unbeantwortet verfallen (Marken entstehen
 * erst nach Ziel 1, `tickPetitions` setzt `next` erst bei `won`). Belegt nicht: Wirkung von «Ja»-Antworten und
 * den Tempo-Pin; der Controller antwortet nie.
 */
describe('AK-BS-17 Controller mit Bittschriften', () => {
  it('zweites Ziel trotz unbeantworteter Marken; mindestens eine Marke wurde gezogen', () => {
    const w = createWorld(3, { petitionsOn: true });
    const { layout } = startColony(w);
    const drawn = new Set<number>(w.petitions.open.map((m) => m.drawnAt));
    runMerchants(w, layout, newMerchantTrajectory(), (x) => {
      for (const m of x.petitions.open) drawn.add(m.drawnAt);
      return false;
    });
    expect(drawn.size).toBeGreaterThan(0);
    expect(w.wonMerchants).toBe(true);
    expect(w.tick).toBeLessThanOrEqual(MERCHANT_TICK_LIMIT);
  });
});
