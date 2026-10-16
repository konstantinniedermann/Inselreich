import { GOODS } from '../sim/defs/goods';
import type { ContractOffer, Order, World } from '../sim/types';
import type { LogEntry } from './crisisLog';

/** Log-Einträge zum Verfall von Zufallsauftrag und Stammkunden-Angebot; DOM-frei, liest nur die Welt. */

export interface AutoSnap {
  order: Order | null;
  contractOffer: ContractOffer | null;
}

/** Vergleichsstand für `expiryLogEntries`: Kopien, keine Referenzen. */
export function autoSnap(world: World): AutoSnap {
  return {
    order: world.order === null ? null : { ...world.order },
    contractOffer: world.contractOffer === null ? null : { ...world.contractOffer },
  };
}

/**
 * Verfall ohne Spielerhandlung zwischen `prev` und jetzt; älteste zuerst (Stammkunde, dann Zufallsauftrag).
 * Fernaufträge und Fernangebote bleiben Sache von `farLogEntries`. `toast` ist immer null.
 */
export function expiryLogEntries(prev: AutoSnap, world: World): LogEntry[] {
  const out: LogEntry[] = [];
  const offer = prev.contractOffer;
  if (offer !== null) {
    const same =
      world.contractOffer !== null &&
      world.contractOffer.good === offer.good &&
      world.contractOffer.island === offer.island;
    const accepted = world.contract !== null && world.contract.good === offer.good;
    if (!same && !accepted)
      out.push({
        text: `Stammkunden-Angebot verfallen: ${GOODS[offer.good].name}`,
        toast: null,
        tick: world.tick,
      });
  }
  const o = prev.order;
  if (
    o !== null &&
    o.island === undefined &&
    world.tick > o.due &&
    (world.order === null || world.order.period !== o.period)
  )
    out.push({
      text: `Auftrag verfallen: ${o.amount} ${GOODS[o.good].name}`,
      toast: null,
      tick: world.tick,
    });
  return out;
}
