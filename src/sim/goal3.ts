// Drittes Ziel „Gewürzstadt“ (M12, Anhang 05 B): rein lesende Abfragen, ohne Zufall, ohne Schreibzugriff.
import { WIN_SPICE_HOLD, TIERS } from './defs/tiers';
import { allNeedsMet } from './population';
import type { Route, World } from './types';
import { HOME } from './world';

/** Summe der Einwohner aller Kaufmannshäuser (Stufe 4), die voll versorgt sind und das seit `WIN_SPICE_HOLD` Ticks sind. */
export function spiceMerchants(world: World): number {
  let sum = 0;
  for (const b of Object.values(world.buildings)) {
    const house = b.house;
    if (house?.tier !== 4) continue;
    if (allNeedsMet(house, TIERS[4]) && world.tick - house.satisfiedSince >= WIN_SPICE_HOLD)
      sum += house.inhabitants;
  }
  return sum;
}

/** Fremdinsel, von der die Route Gewürz in die Heimat holt, sonst null. */
function spiceSource(route: Route): number | null {
  if (route.a === HOME && route.b !== HOME && route.ba.some((g) => g.good === 'spice'))
    return route.b;
  if (route.b === HOME && route.a !== HOME && route.ab.some((g) => g.good === 'spice'))
    return route.a;
  return null;
}

/** Es gibt ein Schiff mit Route, die Gewürz von einer Fremdinsel in die Heimat holt, und dort steht eine Plantage. */
export function spiceLoop(world: World): boolean {
  return world.ships.some((ship) => {
    const island = ship.route === null ? null : spiceSource(ship.route);
    if (island === null) return false;
    return Object.values(world.buildings).some(
      (b) => b.defId === 'spicefarm' && b.island === island,
    );
  });
}
