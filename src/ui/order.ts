import { HOME } from '../sim/world';
import { islandName } from '../sim/islands';
import { CONTRACT_LOYAL_AFTER, GOODS } from '../sim/defs/goods';
import { contractUnitPrice, nextOrderTick, previewOrder } from '../sim/orders';
import { ORDER_PERIOD } from '../sim/defs/timing';
import type { StepReport } from '../sim/tick';
import type { SoundEvent } from '../audio/sound';
import { functionLock } from '../sim/unlocks';
import type { Contract, ContractEvent, GoodId, Order, Result, World } from '../sim/types';
import { setField } from './dom';
import { deliverTarget, farOrderText, farOrderWarn } from './farOrder';
import { sellPrice } from '../sim/trade';
import { goodProductionPer100 } from './production';
import { GOODS_BALANCE_TICKS, formatGameTime, perMinute } from './time';

export interface OrderActions {
  /** Liefert aus dem Lager der aktiven Insel. */
  deliver(): void;
  /** Nimmt das Fernangebot an; `pick` 1 wählt die Zweitkarte. */
  acceptFar(pick?: 0 | 1): void;
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

/** Zwischenspeicher der Erzeugung je Welt; Schlüssel `tick|island|good|Gebäude|nächste Id|Stufensumme|stillgelegte Ids|unangebundene Ids`, nicht im Spielstand. */
const producedCache = new WeakMap<World, { key: string; value: number }>();

/**
 * Erzeugung von `good` auf `island` je Minute (Summe der Erzeuger, `goodProductionPer100`). Die Karte
 * fragt jeden Frame, daher einmal je Tick, Insel und Gut (Messung: R607). Im Schlüssel fangen
 * Gebäudezahl, nächste Gebäude-Id (Neubau nach Abriss bei gleicher Zahl), Stufensumme (Ausbau ändert
 * den Zyklus ohne Zahl, Id oder Liste; Stufen sinken nie, die Summe genügt) und die Id-Listen der
 * stillgelegten und der nicht angebundenen Betriebe Bau, Abriss, Ausbau, Stilllegen, Strassenbau und
 * Tausch im pausierten Spiel ab (R622). Listen statt Summen, weil verschiedene Id-Mengen dieselbe
 * Summe und Anzahl haben können (z. B. {1,4} und {2,3}).
 */
function producedPerMinute(world: World, island: number, good: GoodId): number {
  let count = 0;
  const pausedIds: number[] = [];
  const unconnectedIds: number[] = [];
  let levels = 0;
  for (const b of Object.values(world.buildings)) {
    count++;
    levels += b.level ?? 1;
    if (b.paused === true) pausedIds.push(b.id);
    if (!b.connected) unconnectedIds.push(b.id);
  }
  const key = `${world.tick}|${island}|${good}|${count}|${world.nextBuildingId}|${levels}|${pausedIds.join(',')}|${unconnectedIds.join(',')}`;
  const hit = producedCache.get(world);
  if (hit !== undefined && hit.key === key) return hit.value;
  const value = perMinute(goodProductionPer100(world, island, good), GOODS_BALANCE_TICKS);
  producedCache.set(world, { key, value });
  return value;
}

/** Baustein der Vertragszeile (I-091): «Treue n/N» bzw. «treu: verzeiht einmal»; N aus CONTRACT_LOYAL_AFTER. */
export function loyaltyText(c: Contract): string {
  return c.deliveries >= CONTRACT_LOYAL_AFTER
    ? 'treu: verzeiht einmal'
    : `Treue ${c.deliveries}/${CONTRACT_LOYAL_AFTER}`;
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
      ` · nächste Lieferung ${rest()} · Lager ${stock}/${c.amount}` +
      ` · ${loyaltyText(c)}`
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
      ` · Markt jetzt ≈ ${sellPrice(world, offer.good, 1, offer.island)} · ${production} · Angebot noch ${rest()}`
    );
  }
  const o = world.order;
  const next = previewOrder(world);
  if (o === null) {
    return (
      `Nächster Auftrag in ${rest()}` +
      (next === null ? '' : ` · voraussichtlich ${GOODS[next.good].name}`)
    );
  }
  if (o.island !== undefined) return farOrderText(world, o);
  const name = GOODS[o.good].name;
  return (
    `Auftrag: ${o.amount} ${name} · Prämie ${o.reward} · noch ${formatGameTime(o.due - world.tick)}` +
    ` · Lager ${world.islands[island]!.stock[o.good]}/${o.amount}` +
    (next === null ? '' : ` · danach voraussichtlich ${GOODS[next.good].name}`)
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
  switch (ev.kind) {
    case 'delivered':
      return {
        text:
          `Stammkunde: ${ev.amount} ${name} geliefert, +${ev.pay}` +
          (ev.becameLoyal ? ' · treu: verzeiht einen Fehlbestand' : ''),
        kind: 'info',
        sound: 'orderDone',
      };
    case 'excused': {
      let why: string;
      const reason = ev.reason;
      switch (reason) {
        case 'stock':
          why = `zu wenig ${name}`;
          break;
        case 'kontor':
          why = `kein Kontor auf ${islandName(world, ev.island)}`;
          break;
        default: {
          const unreachable: never = reason;
          return unreachable;
        }
      }
      return {
        text: `Stammkunde wartet: ${why}, diesmal ohne Strafe`,
        kind: 'warn',
        sound: 'error',
      };
    }
    case 'broken': {
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
    default: {
      const unreachable: never = ev;
      return unreachable;
    }
  }
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
  if (cur === null && prev !== null) {
    if (prev.island !== undefined) return null;
    return `Auftrag verfallen: ${prev.amount} ${GOODS[prev.good].name}`;
  }
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
  el.classList.toggle('order-card--warn', contractWarn(world) || farOrderWarn(world));
  const btn = el.querySelector<HTMLElement>('[data-field="order-deliver"]');
  if (btn) btn.hidden = world.order === null;
  const target = deliverTarget(world, island);
  if (btn) {
    const label = deliverLabel(world, target);
    if (btn.textContent !== label) btn.textContent = label;
  }
  if (btn && world.order !== null) {
    btn.classList.toggle(
      'unaffordable',
      world.islands[target]!.stock[world.order.good] < world.order.amount,
    );
  }
}
