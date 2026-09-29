import { tickEconomy } from './economy';
import { tickProduction } from './production';
import type { World } from './types';

/** Ein Simulationsschritt: Zähler, dann Produktion, dann Wirtschaft (Unterhalt). */
export function step(world: World): void {
  world.tick += 1;
  tickProduction(world);
  tickEconomy(world);
}
