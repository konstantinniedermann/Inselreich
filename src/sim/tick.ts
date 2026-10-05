import { tickCrises } from './crises';
import { tickEconomy } from './economy';
import { tickOrders } from './orders';
import { citizens, merchants, tickPopulation, tickTaxes } from './population';
import { tickProduction } from './production';
import { tickMarket } from './trade';
import { tickUnlocks } from './unlocks';
import { WIN_CITIZENS, WIN_MERCHANTS, WIN_SPICE_MERCHANTS } from './defs/tiers';
import { spiceLoop, spiceMerchants } from './goal3';
import type { World } from './types';

/**
 * Setzt erst `won` (genug Bürger+), dann `wonMerchants` (genug Kaufleute, nur nach `won`), dann `wonSpice`
 * (drittes Ziel, nur nach `wonMerchants`: Haltezeit und Gewürzschleife, Anhang 05 B/J); alle nie zurück (M8 7).
 */
export function checkWin(world: World): void {
  if (citizens(world) >= WIN_CITIZENS) world.won = true;
  if (world.won && merchants(world) >= WIN_MERCHANTS) world.wonMerchants = true;
  if (
    world.wonMerchants &&
    !world.wonSpice &&
    spiceMerchants(world) >= WIN_SPICE_MERCHANTS &&
    spiceLoop(world)
  )
    world.wonSpice = true;
}

/** Ein Simulationsschritt: Zähler, Produktion, Bevölkerung, Steuern, Wirtschaft (Unterhalt), Markt, Aufträge, Krisen, Sieg, Freischaltung. */
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
  tickUnlocks(world); // letzter Aufruf: Bitgleichheit, Spec 4.3, ADR-005-Nachtrag
}
