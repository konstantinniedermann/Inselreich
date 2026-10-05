import { home } from '../sim/world';
import { GOODS } from '../sim/defs/goods';
import { nextOrderTick } from '../sim/orders';
import { functionLock } from '../sim/unlocks';
import type { Order, World } from '../sim/types';
import { setField } from './dom';
import { formatGameTime } from './time';

export interface OrderActions {
  deliver(): void;
}

/** Text der Auftragskarte: aktiver Auftrag mit Lagerstand, sonst die Wartezeit bis zum nächsten. */
export function orderCardText(world: World): string {
  const o = world.order;
  if (o === null) return `Nächster Auftrag in ${formatGameTime(nextOrderTick(world) - world.tick)}`;
  const name = GOODS[o.good].name;
  return (
    `Auftrag: ${o.amount} ${name} · Prämie ${o.reward} · noch ${formatGameTime(o.due - world.tick)}` +
    ` · Lager ${home(world).stock[o.good]}/${o.amount}`
  );
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

/** Baut die Auftragskarte auf: Text und „Liefern" (immer klickbar, der Grund kommt als Toast). */
export function renderOrder(el: HTMLElement, world: World, actions: OrderActions): void {
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
  el.append(text, btn);
  updateOrder(el, world);
}

/** Aktualisiert Text und Sichtbarkeit des Buttons. */
export function updateOrder(el: HTMLElement, world: World): void {
  const visible = orderVisible(world);
  if (el.hidden === visible) el.hidden = !visible;
  setField(el, 'order-text', orderCardText(world));
  const btn = el.querySelector<HTMLElement>('[data-field="order-deliver"]');
  if (btn) btn.hidden = world.order === null;
  if (btn && world.order !== null) {
    btn.classList.toggle('unaffordable', home(world).stock[world.order.good] < world.order.amount);
  }
}
