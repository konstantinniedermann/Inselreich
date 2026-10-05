import { home } from '../../src/sim/world';
import { placeBuilding } from '../../src/sim/build';
import { UNLOCK_IDS } from '../../src/sim/defs/unlocks';
import { TIERS } from '../../src/sim/defs/tiers';
import type { Building, BuildingDefId, GoodId, Tier, World } from '../../src/sim/types';
import { SCENARIOS } from '../sim/scenarios';

export function uxWorld(): { w: World; kx: number; ky: number; fisher: Building; house: Building } {
  const w = SCENARIOS['ux-anbindung']!();
  w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5']; // Stand vor dem Ziel wie in M8; U6 erst nach `won`
  const k = w.buildings[home(w).kontorId]!;
  const all = Object.values(w.buildings);
  return {
    w,
    kx: k.x,
    ky: k.y,
    fisher: all.find((b) => b.defId === 'fisher')!,
    house: all.find((b) => b.defId === 'house')!,
  };
}

export function build(w: World, defId: BuildingDefId, x: number, y: number): Building {
  const money = w.money;
  const stock = { ...home(w).stock };
  w.money = 1_000_000;
  for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
  const unlocked = w.unlocked;
  w.unlocked = [...UNLOCK_IDS]; // Testaufbau: „Alles frei" nur für diesen Bau (Spec 10)
  const r = placeBuilding(w, defId, x, y);
  w.unlocked = unlocked;
  w.money = money;
  home(w).stock = stock;
  if (!r.ok || r.id === undefined) throw new Error(`${defId}@${x},${y}: ${r.ok ? '' : r.reason}`);
  return w.buildings[r.id]!;
}

export function setHouse(b: Building, tier: Tier, inhabitants: number, met: GoodId[]): void {
  const goods = Object.keys(TIERS[tier].needs) as GoodId[];
  b.house = {
    ...b.house!,
    tier,
    inhabitants,
    satisfied: Object.fromEntries(goods.map((g) => [g, met.includes(g)])),
  };
}

/**
 * Setzt alle Nicht-Wohnhäuser auf angebunden. Nach dem letzten `build` aufrufen: `placeBuilding` rechnet die
 * Anbindung neu und setzt vorher gesetzte Flags zurück.
 */
export function connectAll(w: World): void {
  for (const b of Object.values(w.buildings)) if (b.defId !== 'house') b.connected = true;
}
