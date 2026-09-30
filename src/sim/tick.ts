import { tickEconomy } from './economy';
import { tickPopulation } from './population';
import { tickProduction } from './production';
import type { World } from './types';

/** Ein Simulationsschritt: Zähler, dann Produktion, Bevölkerung, Wirtschaft (Unterhalt). */
export function step(world: World): void {
  world.tick += 1;
  tickProduction(world);
  tickPopulation(world);
  tickEconomy(world);
}
