import { tickCrises } from './crises';
import { tickEconomy } from './economy';
import { tickOrders } from './orders';
import { tickCouncil } from './council';
import { citizens, merchants, tickPopulation, tickTaxes } from './population';
import { tickProduction } from './production';
import { tickShips, type ShipLoss } from './ships';
import { tickMonument } from './monument';
import { tickMarket } from './trade';
import { tickTrial } from './trial';
import { tickUnlocks } from './unlocks';
import { WIN_CITIZENS, WIN_MERCHANTS, WIN_SPICE_MERCHANTS } from './defs/tiers';
import { spiceLoop, spiceMerchants } from './goal3';
import type { ContractEvent, World } from './types';

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

export interface StepReport {
  lost: ShipLoss[];
  /** Vertragsereignis dieses Schritts (I-047, R12), sonst `null`. */
  contract: ContractEvent | null;
}

/** Ein Simulationsschritt: Zähler, Produktion, Schiffe, Bevölkerung, Auflage, Ratsbeschluss (öffnet ab Hausstufe 2/3/4), Steuern, Wirtschaft (Unterhalt), Markt, Aufträge, Krisen, Sieg, Freischaltung. */
export function step(world: World): StepReport {
  world.tick += 1;
  tickProduction(world);
  const lost = tickShips(world);
  tickPopulation(world);
  tickTrial(world);
  tickCouncil(world);
  tickTaxes(world);
  tickEconomy(world);
  tickMonument(world);
  tickMarket(world);
  const contract = tickOrders(world);
  tickCrises(world);
  checkWin(world);
  tickUnlocks(world); // letzter Aufruf: Bitgleichheit, Spec 4.3, ADR-005-Nachtrag
  return { lost, contract };
}
