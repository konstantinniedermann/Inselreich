import { HOME } from '../sim/world';
import { islandName } from '../sim/islands';
import { GOODS } from '../sim/defs/goods';
import { contractUnitPrice, nextOrderTick } from '../sim/orders';
import { ORDER_PERIOD } from '../sim/defs/timing';
import type { StepReport } from '../sim/tick';
import type { SoundEvent } from '../audio/sound';
import { functionLock } from '../sim/unlocks';
import type { ContractEvent, GoodId, Order, Result, World } from '../sim/types';
import { setField } from './dom';
import { sellPrice } from '../sim/trade';
import { goodProductionPer100 } from './production';
import { GOODS_BALANCE_TICKS, formatGameTime, perMinute } from './time';

export interface OrderActions {
  /** Liefert aus dem Lager der aktiven Insel. */
  deliver(): void;
  /** Nimmt das Stammkunde-Angebot an. */
  accept(): void;
  /** Lehnt das Angebot ab. */
  decline(): void;
  /** Springt zum Erzeuger des Vertragsguts. */
  toProducer(): void;
  /** Kündigt den laufenden Vertrag. */
  cancel(): void;
}

/**
 * Wertet das Ergebnis einer Vertragsaktion aus: bei `fail` zeigt `showError` den Grund (Meldung und
 * Fehlerklang), bei `ok` die Meldung aus `onOk` (`null` = still).
 */
export function runContractAction(
  r: Result,
  onOk: () => string | null,
  out: { showError(reason: string): void; show(text: string): void },
): void {
  if (!r.ok) {
    out.showError(r.reason);
    return;
  }
  const text = onOk();
  if (text !== null) out.show(text);
}

/** Zwischenspeicher der Erzeugung je Welt; Schlüssel `tick|island|good`, nicht im Spielstand. */
const producedCache = new WeakMap<World, { key: string; value: number }>();

/**
 * Erzeugung von `good` auf `island` je Minute (Summe der Erzeuger, `goodProductionPer100`). Die Karte
 * fragt jeden Frame, daher einmal je Tick, Insel und Gut (Messung: R607).
 */
function producedPerMinute(world: World, island: number, good: GoodId): number {
  const key = `${world.tick}|${island}|${good}`;
  const hit = producedCache.get(world);
  if (hit !== undefined && hit.key === key) return hit.value;
  const value = perMinute(goodProductionPer100(world, island, good), GOODS_BALANCE_TICKS);
  producedCache.set(world, { key, value });
  return value;
}

/** Text der Auftragskarte: aktiver Auftrag mit Lagerstand, sonst die Wartezeit bis zum nächsten. */
export function orderCardText(world: World, island: number = HOME): string {
  const rest = (): string => formatGameTime(nextOrderTick(world) - world.tick);
  const takt = formatGameTime(ORDER_PERIOD);
  const c = world.contract;
  if (c !== null) {
    const stock = world.islands[c.island]!.stock[c.good];
    return (
      `Stammkunde: ${c.amount} ${GOODS[c.good].name}${islandSuffix(world, c.island)}` +
      ` · nächste Lieferung ${rest()} · Lager ${stock}/${c.amount}`
    );
  }
  const offer = world.contractOffer;
  if (offer !== null) {
    const def = GOODS[offer.good];
    const made = producedPerMinute(world, offer.island, offer.good);
    const production = made > 0 ? `Erzeugung ${made} / min` : 'keine Erzeugung';
    return (
      `Stammkunde: ${def.order!.contract} ${def.name}${islandSuffix(world, offer.island)}` +
      ` alle ${takt} zu ${contractUnitPrice(offer.good)} je Stück` +
      ` · Markt jetzt ≈ ${sellPrice(world, offer.good, 1)} · ${production} · Angebot noch ${rest()}`
    );
  }
  const o = world.order;
  if (o === null) return `Nächster Auftrag in ${formatGameTime(nextOrderTick(world) - world.tick)}`;
  const name = GOODS[o.good].name;
  return (
    `Auftrag: ${o.amount} ${name} · Prämie ${o.reward} · noch ${formatGameTime(o.due - world.tick)}` +
    ` · Lager ${world.islands[island]!.stock[o.good]}/${o.amount}`
  );
}

function islandSuffix(world: World, island: number): string {
  return island === HOME ? '' : ` auf ${islandName(world, island)}`;
}

/** Warnzustand des Vertrags: Lager der Lieferinsel unter der Liefermenge oder kein Kontor dort. */
export function contractWarn(world: World): boolean {
  const c = world.contract;
  if (c === null) return false;
  const isl = world.islands[c.island]!;
  return isl.kontorId === null || isl.stock[c.good] < c.amount;
}

/** Meldung direkt nach dem Annehmen (liest `world.contract`). */
export function contractAgreedMessage(world: World): string {
  const c = world.contract!;
  return (
    `Stammkunde: ${c.amount} ${GOODS[c.good].name}${islandSuffix(world, c.island)}` +
    ` alle ${formatGameTime(ORDER_PERIOD)} vereinbart`
  );
}

export const CONTRACT_CANCELLED = 'Stammkunde gekündigt';

/** Text, Art und Klang zu einem Vertragsereignis. */
export function contractNotice(
  ev: ContractEvent,
  world: World,
): { text: string; kind: 'info' | 'warn'; sound: SoundEvent } {
  const name = GOODS[ev.good].name;
  if (ev.kind === 'delivered') {
    return {
      text: `Stammkunde: ${ev.amount} ${name} geliefert, +${ev.pay}`,
      kind: 'info',
      sound: 'orderDone',
    };
  }
  const why =
    ev.reason === 'stock'
      ? `: zu wenig ${name}`
      : ev.reason === 'kontor'
        ? `: kein Kontor auf ${islandName(world, ev.island)}`
        : '';
  return {
    text: `Stammkunde abgesprungen${why}. Strafe ${ev.penalty}`,
    kind: 'warn',
    sound: 'error',
  };
}

/** Meldet und vertont die Vertragsereignisse der Schritte eines Frames. */
export function announceContract(
  reports: readonly StepReport[],
  out: { show(text: string, kind: 'info' | 'warn'): void; play(e: SoundEvent): void },
  world: World,
): void {
  for (const r of reports) {
    if (r.contract === null) continue;
    const n = contractNotice(r.contract, world);
    out.show(n.text, n.kind);
    out.play(n.sound);
  }
}

/**
 * Ereignis aus dem Vergleich der Auftragsperiode zweier Frames: neue Periode = `new`, Auftrag
 * verschwunden = `expired`. Eine Lieferung setzt den Vergleichswert vorher selbst auf `null`.
 */
export function orderChange(prev: number | null, cur: number | null): 'new' | 'expired' | null {
  if (cur === prev) return null;
  return cur !== null ? 'new' : 'expired';
}

/** Meldung zum Wechsel des Auftrags zwischen zwei Frames; `null`, wenn sich nichts geändert hat. */
export function orderMessage(prev: Order | null, cur: Order | null): string | null {
  if (cur !== null && (prev === null || prev.period !== cur.period)) {
    return `Neuer Auftrag: ${cur.amount} ${GOODS[cur.good].name} · Prämie ${cur.reward}`;
  }
  if (cur === null && prev !== null)
    return `Auftrag verfallen: ${prev.amount} ${GOODS[prev.good].name}`;
  return null;
}

/** Auftragskarte sichtbar: ab U3 (Spec 11.4). */
export function orderVisible(world: World): boolean {
  return functionLock(world, 'orders') === null;
}

/** Meldung nur, wenn die Karte im vorigen und im jetzigen Frame sichtbar war (kein „Neuer Auftrag" beim Wechsel zu U3). */
export function orderMessageFor(
  prevOrder: Order | null,
  prevVisible: boolean,
  cur: World,
): string | null {
  return prevVisible && orderVisible(cur) ? orderMessage(prevOrder, cur.order) : null;
}

export function deliveredMessage(o: Order): string {
  return `Auftrag geliefert: ${o.amount} ${GOODS[o.good].name} · +${o.reward} Geld`;
}

/** Knopftext: „Liefern“, ausserhalb der Heimat mit dem Namen der Insel. */
export function deliverLabel(world: World, island: number = HOME): string {
  return island === HOME ? 'Liefern' : `Liefern · ${islandName(world, island)}`;
}

/** Baut die Auftragskarte auf: Text und „Liefern" (immer klickbar, der Grund kommt als Toast). */
export function renderOrder(
  el: HTMLElement,
  world: World,
  actions: OrderActions,
  island: number = HOME,
): void {
  el.replaceChildren();
  const text = document.createElement('span');
  text.dataset.field = 'order-text';
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Liefern';
  btn.dataset.field = 'order-deliver';
  btn.addEventListener('click', () => {
    btn.blur();
    actions.deliver();
  });
  const extra = (field: string, label: string, run: () => void): HTMLElement => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = label;
    b.dataset.field = field;
    b.addEventListener('click', () => {
      b.blur();
      run();
    });
    return b;
  };
  el.append(
    text,
    btn,
    extra('order-accept', 'Annehmen', () => actions.accept()),
    extra('order-decline', 'Ablehnen', () => actions.decline()),
    extra('order-producer', 'Zum Erzeuger', () => actions.toProducer()),
    extra('order-cancel', 'Kündigen', () => actions.cancel()),
  );
  updateOrder(el, world, island);
}

/** Aktualisiert Text und Sichtbarkeit des Buttons. */
export function updateOrder(el: HTMLElement, world: World, island: number = HOME): void {
  const visible = orderVisible(world);
  if (el.hidden === visible) el.hidden = !visible;
  setField(el, 'order-text', orderCardText(world, island));
  const offer = world.contractOffer !== null;
  const setHidden = (field: string, hidden: boolean): void => {
    const b = el.querySelector<HTMLElement>(`[data-field="${field}"]`);
    if (b && b.hidden !== hidden) b.hidden = hidden;
  };
  setHidden('order-accept', !offer);
  setHidden('order-decline', !offer);
  setHidden('order-producer', world.contract === null);
  setHidden('order-cancel', world.contract === null);
  el.classList.toggle('order-card--warn', contractWarn(world));
  const btn = el.querySelector<HTMLElement>('[data-field="order-deliver"]');
  if (btn) btn.hidden = world.order === null;
  if (btn) {
    const label = deliverLabel(world, island);
    if (btn.textContent !== label) btn.textContent = label;
  }
  if (btn && world.order !== null) {
    btn.classList.toggle(
      'unaffordable',
      world.islands[island]!.stock[world.order.good] < world.order.amount,
    );
  }
}
