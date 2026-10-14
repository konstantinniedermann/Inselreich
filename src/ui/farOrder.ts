import { GOODS } from '../sim/defs/goods';
import { FAR_ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../sim/defs/timing';
import { islandName } from '../sim/islands';
import type { FarOffer, Order, World } from '../sim/types';
import type { LogEntry } from './crisisLog';
import { formatGameTime } from './time';

/** Texte, Lieferziel und Log-Einträge zum Fernangebot (Handel 2, Anhang 02); DOM-frei, liest nur die Welt. */

/** Kurzform «Menge Gut nach Insel» für Log und Meldungen. */
function line(world: World, x: { amount: number; good: Order['good']; island: number }): string {
  return `${x.amount} ${GOODS[x.good].name} nach ${islandName(world, x.island)}`;
}

function stockOn(world: World, island: number, good: Order['good']): number {
  return world.islands[island]!.stock[good];
}

/** T-02: Text des offenen Fernangebots; `null` ohne Angebot. Das Lager ist das der Fern-Insel. */
export function farOfferText(world: World): string | null {
  const f = world.farOffer;
  if (f === null) return null;
  const period = world.order?.period ?? 0;
  const due = ORDER_FIRST_TICK + period * ORDER_PERIOD + FAR_ORDER_DURATION;
  return (
    `Fernangebot ${islandName(world, f.island)}: ${f.amount} ${GOODS[f.good].name} · ${f.reward}` +
    ` · Frist ${formatGameTime(due - world.tick)} · Lager ${stockOn(world, f.island, f.good)}/${f.amount}`
  );
}

/** T-03: Tooltip des Annehmen-Knopfs; leer ohne Angebot. */
export function farAcceptTooltip(world: World): string {
  const f = world.farOffer;
  if (f === null) return '';
  return `Ersetzt den Auftrag. Liefern nur am Kontor ${islandName(world, f.island)}. Der nächste Auftrag entfällt.`;
}

/** T-04: Text der Auftragskarte bei einem Fernauftrag. */
export function farOrderText(world: World, o: Order): string {
  const island = o.island!;
  return (
    `Fernauftrag ${islandName(world, island)}: ${o.amount} ${GOODS[o.good].name} · ${o.reward}` +
    ` · noch ${formatGameTime(o.due - world.tick)} · Lager ${stockOn(world, island, o.good)}/${o.amount}`
  );
}

/** T-05: Warnzustand, wenn der Fernauftrag kein Kontor auf der Fern-Insel mehr hat. */
export function farOrderWarn(world: World): boolean {
  const o = world.order;
  if (o === null || o.island === undefined) return false;
  return world.islands[o.island]!.kontorId === null;
}

/** T-07: Meldung direkt nach dem Annehmen. */
export function farAcceptedMessage(world: World, o: Order): string {
  return `Fernauftrag angenommen: ${line(world, { ...o, island: o.island! })}`;
}

/** T-16 (= T-08): Log-Eintrag zur Lieferung. */
export function farDeliveredEntry(o: Order, tick: number): LogEntry {
  return {
    text: `Fernauftrag geliefert: ${o.amount} ${GOODS[o.good].name}, +${o.reward}`,
    toast: 'info',
    tick,
  };
}

/** AK-29: Insel, aus der «Liefern» liefert: die Fern-Insel beim Fernauftrag, sonst die aktive Insel. */
export function deliverTarget(world: World, active: number): number {
  return world.order?.island ?? active;
}

export interface FarSnap {
  offer: FarOffer | null;
  order: Order | null;
}

/** Vergleichsstand für `farLogEntries`: Kopien, keine Referenzen. */
export function farSnap(world: World): FarSnap {
  return {
    offer: world.farOffer === null ? null : { ...world.farOffer },
    order: world.order === null ? null : { ...world.order },
  };
}

/** T-17, T-18: Verfall eines Fernauftrags bzw. eines unangenommenen Fernangebots zwischen `prev` und jetzt. */
export function farLogEntries(prev: FarSnap, world: World): LogEntry[] {
  const out: LogEntry[] = [];
  const o = prev.order;
  const gone = (p: Order): boolean => world.order === null || world.order.period !== p.period;
  if (o !== null && o.island !== undefined && world.tick > o.due && gone(o))
    out.push({
      text: `Fernauftrag verfallen: ${line(world, { ...o, island: o.island })}`,
      toast: 'info',
      tick: world.tick,
    });
  const f = prev.offer;
  if (
    f !== null &&
    world.farOffer === null &&
    o !== null &&
    o.island === undefined &&
    world.tick > o.due
  )
    out.push({ text: `Fernangebot verfallen: ${line(world, f)}`, toast: null, tick: world.tick });
  return out;
}
