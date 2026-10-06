// Rezept für save-v8.json (M12 Seefahrt T00, Anhang 03 B): Kaufleute-Controller bis genau 3 Häuser der Stufe 4.
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { TIERS } from '../../src/sim/defs/tiers';
import type { GoodId, Result, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { startColony } from './controller';
import { forceRect } from './helpers';
import { newMerchantTrajectory, runMerchants } from './merchantsController';

/** Steuer der Kaufleute im v8-Stand (vor R226 F-03). */
const V8_MERCHANT_TAX = 20;

export const tier4Houses = (w: World): number =>
  Object.values(w.buildings).filter((b) => b.house?.tier === 4).length;

/**
 * Wie balance-merchants.test.ts (Seed 3, startColony, runMerchants), Abbruch über `stop` statt bei
 * `wonMerchants`: nach dem ersten Schritt mit 3 Häusern der Stufe 4. Gleiche Aufrufe, gleiche Reihenfolge.
 */
export function fixtureV8Run(): World {
  // R256 (D-146): Die Fixture ist ein v8-Stand, also mit den v8-Werten der Kaufleute (ohne Gewürz, Steuer 20).
  const { needs, tax } = TIERS[4];
  try {
    TIERS[4].needs = Object.fromEntries(Object.entries(needs).filter(([g]) => g !== 'spice'));
    TIERS[4].tax = V8_MERCHANT_TAX;
    const w = createWorld(3);
    const { layout } = startColony(w);
    runMerchants(w, layout, newMerchantTrajectory(), (x) => tier4Houses(x) >= 3);
    return w;
  } finally {
    TIERS[4].needs = needs;
    TIERS[4].tax = tax;
  }
}

/** Wirft im Test mit Grund, wenn eine Bauaktion fehlschlägt. */
function mustBuild(r: Result, what: string): void {
  if (!r.ok) throw new Error(`fireWorld: ${what}: ${r.reason}`);
}

/**
 * Kleine Brand-Testwelt (Muster aus dem beforeEach und `put` in fire.test.ts): Gras östlich des Kontors,
 * Hauptweg, eine Brennerei. Unabhängig von `fixtureV8Run`.
 */
export function fireWorld(seed: number): World {
  const w = createWorld(seed, { crisisLevel: 'normal', unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  forceRect(w, k.x + 2, k.y - 3, 14, 7, 'grass');
  const money = w.money;
  const stock = { ...home(w).stock };
  w.money = 1_000_000;
  for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
  for (let x = k.x + 2; x <= k.x + 13; x++) mustBuild(placeRoad(w, x, k.y), `Weg ${x}`);
  mustBuild(placeBuilding(w, 'distillery', k.x + 3, k.y + 1), 'Brennerei');
  w.money = money;
  home(w).stock = stock;
  w.tick = CRISIS_FIRST_TICK;
  return w;
}
