import { tickCrises } from './crises';
import { tickEconomy } from './economy';
import { tickOrders } from './orders';
import { citizens, merchants, tickPopulation, tickTaxes } from './population';
import { tickProduction } from './production';
import { tickShips, type ShipLoss } from './ships';
import { tickMarket } from './trade';
import { tickUnlocks } from './unlocks';
import { WIN_CITIZENS, WIN_MERCHANTS } from './defs/tiers';
import type { World } from './types';

/** Setzt erst `won` (genug Bürger+), dann `wonMerchants` (genug Kaufleute, nur nach `won`); beide nie zurück (M8 7). */
export function checkWin(world: World): void {
  if (citizens(world) >= WIN_CITIZENS) world.won = true;
  if (world.won && merchants(world) >= WIN_MERCHANTS) world.wonMerchants = true;
}

export interface StepReport {
  lost: ShipLoss[];
}

/** Ein Simulationsschritt: Zähler, Produktion, Schiffe, Bevölkerung, Steuern, Wirtschaft (Unterhalt), Markt, Aufträge, Krisen, Sieg, Freischaltung. */
export function step(world: World): StepReport {
  world.tick += 1;
  tickProduction(world);
  const lost = tickShips(world);
  tickPopulation(world);
  tickTaxes(world);
  tickEconomy(world);
  tickMarket(world);
  tickOrders(world);
  tickCrises(world);
  checkWin(world);
  tickUnlocks(world); // letzter Aufruf: Bitgleichheit, Spec 4.3, ADR-005-Nachtrag
  return { lost };
}
