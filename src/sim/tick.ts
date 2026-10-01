import { tickCrises } from './crises';
import { tickEconomy } from './economy';
import { tickOrders } from './orders';
import { citizens, tickPopulation, tickTaxes } from './population';
import { tickProduction } from './production';
import { tickMarket } from './trade';
import { WIN_CITIZENS } from './defs/tiers';
import type { World } from './types';

/** Setzt `won`, sobald genug Bürger leben; wird nie zurückgesetzt. */
export function checkWin(world: World): void {
  if (citizens(world) >= WIN_CITIZENS) world.won = true;
}

/** Ein Simulationsschritt: Zähler, Produktion, Bevölkerung, Steuern, Wirtschaft (Unterhalt), Markt, Aufträge, Krisen, Sieg. */
export function step(world: World): void {
  world.tick += 1;
  tickProduction(world);
  tickPopulation(world);
  tickTaxes(world);
  tickEconomy(world);
  tickMarket(world);
  tickOrders(world);
  tickCrises(world);
  checkWin(world);
}
