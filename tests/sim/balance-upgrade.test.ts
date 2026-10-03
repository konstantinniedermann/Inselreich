import { describe, expect, it } from 'vitest';
import { buy, buyPrice } from '../../src/sim/trade';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { LEVELS } from '../../src/sim/defs/levels';
import { functionLock } from '../../src/sim/unlocks';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { CONTROL_INTERVAL, runColony, startColony, type Trajectory } from './controller';

const UPGRADE_RESERVE = 300; // Geld nach dem Ausbau, wie RESERVE im Controller (dort nicht exportiert)
const FEE_RESERVE = 5; // Gebührenware, die nach dem Ausbau für die Häuser im Lager bleibt

/** Variante „baut Fischer aus" (Spec 11.4, Ruling R196: kauft fehlendes Werkzeug selbst): zwischen zwei Schritten, nur bei tick % 100 === 50 (abseits der
 *  Controller-Takte), höchstens ein Ausbau je Takt, kleinste Id zuerst; Stufe 2 ab U3, Stufe 3 ab U5. */
function upgradeFishers(w: World): void {
  if (w.tick % CONTROL_INTERVAL !== 50) return;
  for (const b of Object.values(w.buildings)) {
    if (b.defId !== 'fisher' || b.level === 3) continue;
    const lv = b.level ?? 1;
    if (functionLock(w, lv === 1 ? 'upgrade2' : 'upgrade3') !== null) continue;
    const next = LEVELS.fisher![lv - 1]!;
    const missing = Math.max(0, next.cost.tools - w.stock.tools);
    const toolPrice = missing > 0 ? buyPrice('tools', missing) : 0;
    if (w.money - next.cost.money - toolPrice < UPGRADE_RESERVE) continue;
    if (w.stock.wood < next.cost.wood) continue;
    if (missing > 0 && !buy(w, 'tools', missing).ok) continue;
    if (w.stock[next.fee.good] - next.fee.amount < FEE_RESERVE) continue;
    if (upgradeBuilding(w, b.id).ok) return;
  }
}

function variant(): Trajectory & { levels: Record<1 | 2 | 3, number> } {
  const w = createWorld(3); // Krisen aus, Seed 3
  const { layout, t } = startColony(w);
  runColony(w, layout, t, {}, (x) => {
    upgradeFishers(x);
    return false;
  });
  const levels = { 1: 0, 2: 0, 3: 0 };
  for (const b of Object.values(w.buildings)) if (b.defId === 'fisher') levels[b.level ?? 1] += 1;
  return { ...t, levels };
}

/** M-15 (Ruling R196: reine Messung, kein Sieg-Limit), gemessen auf 2b43e9d mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-upgrade.test.ts` (Spec 14). */
const M15 = { winTick: 8250, minMoney: 71, levels: { 1: 0, 2: 11, 3: 0 } };

describe('M11 Balancing Ausbau (Spec 11.4)', () => {
  it('AK-M11B-01 Variante „baut Fischer aus" (R196: reine Messung): greift, siegt, minMoney ≥ 0; M-15 gepinnt', () => {
    const r = variant();
    if (import.meta.env.VITE_BALANCE_LOG) console.log('M-15', JSON.stringify(r));
    expect(r.levels[2] + r.levels[3]).toBeGreaterThan(0); // die Variante greift
    expect(r.winTick).not.toBeNull();
    expect(r.minMoney).toBeGreaterThanOrEqual(0);
    expect({ winTick: r.winTick, minMoney: r.minMoney, levels: r.levels }).toEqual(M15);
  });
  it('AK-BAS-05 Referenz-Endwelt: 0 Jagdhütten, 0 Rinderfarmen, kein level; nie ein Betrieb in noForest', () => {
    const w = createWorld(3);
    const { layout, t } = startColony(w);
    let noForest = 0;
    runColony(w, layout, t, {}, (x) => {
      noForest += Object.values(x.buildings).filter((b) => b.state === 'noForest').length;
      return false;
    });
    expect(t.winTick).toBe(6750); // M-01 als Kontrolle, dass es der Referenzlauf ist
    expect([t.buildings.hunter ?? 0, t.buildings.cattlefarm ?? 0]).toEqual([0, 0]);
    expect(Object.values(w.buildings).filter((b) => b.level !== undefined)).toEqual([]);
    expect(noForest).toBe(0);
  });
});
