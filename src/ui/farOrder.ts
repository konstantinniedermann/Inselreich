import { GOODS } from '../sim/defs/goods';
import { FAR_ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../sim/defs/timing';
import { islandName } from '../sim/islands';
import { farAlternative } from '../sim/orders';
import type { FarOffer, Order, World } from '../sim/types';
import type { MapMark } from '../render/seaMap';
import type { LogEntry } from './crisisLog';
import { formatGameTime } from './time';
import { homeTravelTicks, type Lanes } from './homeTravel';

/** Texte, Lieferziel und Log-Einträge zum Fernangebot (Handel 2, Anhang 02); DOM-frei, liest nur die Welt. */

/** Kurzform «Menge Gut nach Insel» für Log und Meldungen. */
function line(world: World, x: { amount: number; good: Order['good']; island: number }): string {
  return `${x.amount} ${GOODS[x.good].name} nach ${islandName(world, x.island)}`;
}

function stockOn(world: World, island: number, good: Order['good']): number {
  return world.islands[island]!.stock[good];
}

/** P-7: Tick, an dem das offene Fernangebot verfällt; `null` ohne Angebot. */
export function farOfferDue(world: World): number | null {
  if (world.farOffer === null) return null;
  const period = world.order?.period ?? 0;
  return ORDER_FIRST_TICK + period * ORDER_PERIOD + FAR_ORDER_DURATION;
}

/** I-114: Angebot der Karte `which` (0 Erstangebot, 1 Zweitkarte); `null`, wenn es die Karte nicht gibt. */
export function farOfferOf(world: World, which: 0 | 1): FarOffer | null {
  return which === 1 ? farAlternative(world) : world.farOffer;
}

export interface FarOfferParts {
  head: string;
  travel: string | null;
  stock: string;
  short: boolean;
  tip: string;
}

/** I-136: Teile des Fernangebots der Karte `which`; `null` ohne Angebot. Das Lager ist das der Fern-Insel. */
export function farOfferParts(world: World, which: 0 | 1 = 0, lanes?: Lanes): FarOfferParts | null {
  const f = farOfferOf(world, which);
  const due = farOfferDue(world);
  if (f === null || due === null) return null;
  const have = stockOn(world, f.island, f.good);
  const ticks = homeTravelTicks(world, f.island, lanes);
  const short = have < f.amount;
  return {
    head:
      `Fernangebot ${islandName(world, f.island)}: ${f.amount} ${GOODS[f.good].name} · ${f.reward}` +
      ` · Frist ${formatGameTime(due - world.tick)}`,
    travel: ticks === null ? null : `≈ ${formatGameTime(ticks)} Fahrt`,
    stock: `Lager ${have}/${f.amount}`,
    short,
    tip: short ? `Fehlt ${f.amount - have} ${GOODS[f.good].name}` : '',
  };
}

/** I-136: Text vor dem Lager-Teil, inklusive trennendem « · ». */
export function farOfferLead(p: FarOfferParts): string {
  return `${p.head}${p.travel === null ? '' : ` · ${p.travel}`} · `;
}

/** T-02: Text des Fernangebots der Karte `which`; `null` ohne Angebot (eine Quelle: `farOfferParts`). */
export function farOfferText(world: World, which: 0 | 1 = 0, lanes?: Lanes): string | null {
  const p = farOfferParts(world, which, lanes);
  return p === null ? null : farOfferLead(p) + p.stock;
}

/** T-03: Tooltip des Annehmen-Knopfs der Karte `which`; leer ohne Angebot. */
export function farAcceptTooltip(world: World, which: 0 | 1 = 0): string {
  const f = farOfferOf(world, which);
  if (f === null) return '';
  return `Ersetzt den Auftrag. Liefern nur am Kontor ${islandName(world, f.island)}. Der nächste Auftrag entfällt.`;
}

export interface FarOrderParts {
  lead: string;
  stock: string;
  short: boolean;
  late: boolean;
  /** Tooltip des Lager-Teils: «Fehlt n Gut» bei `short`, sonst leer. */
  tip: string;
}

/** T-04: Teile der Auftragskarte bei einem Fernauftrag (eine Quelle, Muster `farOfferParts`). Liest nur die Welt. */
export function farOrderParts(world: World, o: Order, lanes?: Lanes): FarOrderParts {
  const island = o.island!;
  const have = stockOn(world, island, o.good);
  const short = have < o.amount;
  return {
    lead:
      `Fernauftrag ${islandName(world, island)}: ${o.amount} ${GOODS[o.good].name} · ${o.reward}` +
      ` · noch ${formatGameTime(o.due - world.tick)} · `,
    stock: `Lager ${have}/${o.amount}`,
    short,
    late: farLate(world, { island, amount: o.amount, good: o.good }, o.due - world.tick, lanes),
    tip: short ? `Fehlt ${o.amount - have} ${GOODS[o.good].name}` : '',
  };
}

/** Anhang hinter dem Lager-Teil, wenn Ware aus der Heimat nicht mehr rechtzeitig käme. */
export const FAR_LATE_SUFFIX = ' · zu spät';

/** T-04: Text der Auftragskarte bei einem Fernauftrag. */
export function farOrderText(world: World, o: Order, lanes?: Lanes): string {
  const p = farOrderParts(world, o, lanes);
  return p.lead + p.stock + (p.late ? FAR_LATE_SUFFIX : '');
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

/**
 * I-155: Kommt Ware aus der Heimat nicht mehr rechtzeitig? Wahr, wenn die Fahrt (strikt) länger dauert als `rest`
 * und Lager der Fern-Insel plus rechtzeitig eintreffende Fracht die Menge nicht decken. Liest nur die Welt.
 */
export function farLate(
  world: World,
  x: { island: number; amount: number; good: Order['good'] },
  rest: number,
  lanes?: Lanes,
): boolean {
  if (rest <= 0 || world.islands[x.island]!.kontorId === null) return false;
  const travel = homeTravelTicks(world, x.island, lanes);
  if (travel === null || rest >= travel) return false;
  let have = stockOn(world, x.island, x.good);
  for (const s of world.ships)
    if (s.to === x.island && s.left <= rest) have += s.cargo[x.good] ?? 0;
  return have < x.amount;
}

/** I-101: Marke der Seekarte für Fernauftrag (Vorrang) bzw. Fernangebot; `null` sonst. Liest nur die Welt. */
export function farMark(world: World, lanes?: Lanes): MapMark | null {
  const o = world.order;
  const f = world.farOffer;
  let kind: MapMark['kind'];
  let x: { island: number; amount: number; good: Order['good'] };
  let ticks: number;
  if (o !== null && o.island !== undefined) {
    kind = 'order';
    x = { island: o.island, amount: o.amount, good: o.good };
    ticks = o.due - world.tick;
  } else if (f !== null) {
    kind = 'offer';
    x = f;
    ticks = farOfferDue(world)! - world.tick;
  } else return null;
  const late = farLate(world, x, ticks, lanes);
  const travel = homeTravelTicks(world, x.island, lanes);
  return {
    island: x.island,
    kind,
    text: `${x.amount} ${GOODS[x.good].name} · ${formatGameTime(ticks)}${late ? ' · zu spät' : ''}`,
    warn: world.islands[x.island]!.kontorId === null,
    late,
    tip:
      travel === null
        ? null
        : `Fahrzeit ≈ ${formatGameTime(travel)}, Rest ${formatGameTime(ticks)}` +
          (late ? ' · zu spät für Ware aus der Heimat' : ''),
  };
}
