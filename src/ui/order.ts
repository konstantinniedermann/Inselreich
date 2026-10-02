import { GOODS } from '../sim/defs/goods';
import { nextOrderTick } from '../sim/orders';
import type { Order, World } from '../sim/types';
import { setField } from './dom';

export interface OrderActions {
  deliver(): void;
}

/** Text der Auftragskarte: aktiver Auftrag mit Lagerstand, sonst die Wartezeit bis zum nächsten. */
export function orderCardText(world: World): string {
  const o = world.order;
  if (o === null) return `Nächster Auftrag in ${nextOrderTick(world) - world.tick} Ticks`;
  const name = GOODS[o.good].name;
  return (
    `Auftrag: ${o.amount} ${name} · Prämie ${o.reward} · noch ${o.due - world.tick} Ticks` +
    ` · Lager ${world.stock[o.good]}/${o.amount}`
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
  setField(el, 'order-text', orderCardText(world));
  const btn = el.querySelector<HTMLElement>('[data-field="order-deliver"]');
  if (btn) btn.hidden = world.order === null;
  if (btn && world.order !== null) {
    btn.classList.toggle('unaffordable', world.stock[world.order.good] < world.order.amount);
  }
}
