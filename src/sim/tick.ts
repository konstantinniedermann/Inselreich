import { tickEconomy } from './economy';
import { citizens, tickPopulation, tickTaxes } from './population';
import { tickProduction } from './production';
import { WIN_CITIZENS } from './defs/tiers';
import type { World } from './types';

/** Setzt `won`, sobald genug Bürger leben; wird nie zurückgesetzt. */
export function checkWin(world: World): void {
  if (citizens(world) >= WIN_CITIZENS) world.won = true;
}

/** Ein Simulationsschritt: Zähler, Produktion, Bevölkerung, Steuern, Wirtschaft (Unterhalt), Sieg. */
export function step(world: World): void {
  world.tick += 1;
  tickProduction(world);
  tickPopulation(world);
  tickTaxes(world);
  tickEconomy(world);
  checkWin(world);
}
