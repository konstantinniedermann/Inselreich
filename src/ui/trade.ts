import { HOME } from '../sim/world';
import { islandName } from '../sim/islands';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { BOOM_PCT } from '../sim/defs/crises';
import { buy, buyPrice, buyQuoteFor, sell, sellPrice } from '../sim/trade';
import { RESERVE_GOODS, RESERVE_STEPS } from '../sim/defs/reserve';
import { reserveHolds } from '../sim/queries';
import { reserveOf } from '../sim/reserve';
import { activeEdictDef } from '../sim/edicts';
import { goodUnlocked } from '../sim/unlocks';
import type { GoodId, Result, World } from '../sim/types';
import type { ReasonCtx } from './hints';
import { setField } from './dom';

export interface TradeActions {
  back(): void;
  /** Nach jedem Kauf/Verkauf, mit dem Ergebnis der Sim-Aktion (Meldung und Ton macht der Aufrufer). */
  changed(op: 'buy' | 'sell', result: Result, good: GoodId, n: number): void;
  /** Reserve-Wunsch (Sperrbestand, I-049); der Aufrufer ruft `setReserve` und meldet eine Absage. */
  reserve(good: GoodId, value: number): void;
}

const isReserveGood = (g: GoodId): boolean => (RESERVE_GOODS as readonly string[]).includes(g);

/** Tooltip der Reserve-Zeile (Spec R5). */
export function reserveTitle(good: GoodId, value: number): string {
  return `Betriebe nehmen ${GOODS[good].name} nur, solange mehr als ${value} im Lager liegen. Bauen, Handel und Schiffe sind frei.`;
}

/** Zusatz «hält n Betrieb(e) an»; leer, wenn keine Reserve oder kein Betrieb wartet. */
export function reserveHoldText(world: World, island: number, good: GoodId): string {
  const n = reserveOf(world.islands[island]!, good) > 0 ? reserveHolds(world, island, good) : 0;
  return n === 0 ? '' : n === 1 ? 'hält 1 Betrieb an' : `hält ${n} Betriebe an`;
}

/** Nächste Stufe in Richtung `dir`, an den Rändern unverändert. */
function stepFrom(value: number, dir: -1 | 1): number {
  const i = RESERVE_STEPS.findIndex((s) => s === value);
  const j = Math.min(RESERVE_STEPS.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir));
  return RESERVE_STEPS[j]!;
}

/** Beschriftung und Tooltip eines Verkaufsbuttons: genauer Erlös aus `sellPrice`, nie ein Stückpreis. */
function sellTexts(
  world: World,
  good: GoodId,
  n: number,
): { label: string; price: string; title: string } {
  const price = sellPrice(world, good, n);
  return {
    label: `−${n}`,
    price: `${price} Geld`,
    title: `${n} ${GOODS[good].name} verkaufen für ${price} Geld`,
  };
}

/** Stückpreis am Kontor mit wirkendem Edikt (Spec U-7). */
export function buyUnitText(w: World, good: GoodId): string {
  return `${buyPrice(w, good, 1)} Geld`;
}

/** Kaufanteil des Guts, z. B. «Kauf 109 %» (I-048). */
export function buyPctText(w: World, good: GoodId): string {
  return `Kauf ${w.buyPct[good]} %`;
}

/** Verkaufsanteil des Guts, z. B. «Verkauf 80 %». */
export function sellPctText(w: World, good: GoodId): string {
  return `Verkauf ${w.sellPct[good]} %`;
}

/** Knopftitel Kaufen; ab einem Mittel über 100 % mit Zusatz. */
export function buyTitleText(
  name: string,
  n: number,
  quote: { price: number; meanPct: number },
): string {
  const base = `${n} ${name} kaufen für ${quote.price} Geld`;
  return quote.meanPct > 100 ? `${base} · im Mittel ${quote.meanPct} %` : base;
}

export function buyTitle(w: World, good: GoodId, n: number): string {
  return buyTitleText(GOODS[good].name, n, buyQuoteFor(w, good, n));
}

/** Kontext für die Fehlermeldung einer Handelsaktion. */
export function tradeReasonCtx(
  world: World,
  op: 'buy' | 'sell',
  good: GoodId,
  n: number,
  island: number,
): ReasonCtx {
  return op === 'buy'
    ? { cost: { money: buyPrice(world, good, n), wood: 0, tools: 0, stone: 0 }, good, island }
    : { good, amount: n, island };
}

/** Hinweis im Spaltenkopf «Kaufen», nur bei wirkendem Handel-Edikt. */
export function buyHeadNote(w: World): string {
  const d = activeEdictDef(w);
  return d !== null && d.buyFactorPct < 100 ? `Edikt ${d.name}: −${100 - d.buyFactorPct} %` : '';
}

/** Wahr, solange `good` das Boom-Gut der laufenden Krise ist. */
export function boomGood(world: World, good: GoodId): boolean {
  const c = world.crisis;
  return c !== null && c.kind === 'boom' && c.good === good;
}

/** Handelszeilen (Spec 11.4): Güter, die frei sind oder im Lager liegen; Kaufen nur für freie Güter. */
export function tradeRows(
  world: World,
  island: number = HOME,
): { good: GoodId; canBuy: boolean }[] {
  const stock = world.islands[island]!.stock;
  return GOOD_IDS.filter((g) => goodUnlocked(world, g) || stock[g] > 0).map((good) => ({
    good,
    canBuy: goodUnlocked(world, good),
  }));
}

/** Titel des Handelsdialogs: Heimat wie bisher, Fremdinsel mit Namen. */
export function tradeTitle(world: World, island: number = HOME): string {
  return island === HOME ? 'Handel am Kontor' : `Handel · ${islandName(world, island)}`;
}

/** Handelsmengen pro Klick (reine Bedienung, keine Spielwerte). */
const AMOUNTS = [1, 10] as const;

function cell(parent: HTMLElement, className: string, text?: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  return el;
}

/** Baut den Handelsdialog des Kontors auf. */
export function renderTrade(
  panel: HTMLElement,
  world: World,
  actions: TradeActions,
  island: number = HOME,
): void {
  panel.replaceChildren();
  const head = cell(panel, 'panel-head');
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = tradeTitle(world, island);
  const back = document.createElement('button');
  back.className = 'btn';
  back.textContent = 'Zurück';
  back.addEventListener('click', () => {
    back.blur();
    actions.back();
  });
  head.append(title, back);

  const table = cell(panel, 'trade-table');
  const buyHead = cell(table, 'trade-head', 'Kaufen');
  const note = document.createElement('small');
  note.dataset.field = 'buy-note';
  note.hidden = true;
  buyHead.append(note);
  cell(table, 'trade-head', 'Verkaufen');

  const addTradeButton = (
    parent: HTMLElement,
    good: GoodId,
    op: 'buy' | 'sell',
    n: number,
  ): void => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-small';
    const sellT = op === 'sell' ? sellTexts(world, good, n) : null;
    btn.textContent = sellT ? sellT.label : `+${n}`;
    if (sellT) btn.appendChild(document.createElement('small'));
    btn.dataset.good = good;
    btn.dataset.op = op;
    btn.dataset.n = String(n);
    btn.title = sellT ? sellT.title : buyTitle(world, good, n);
    btn.addEventListener('click', () => {
      btn.blur();
      const r = op === 'buy' ? buy(world, good, n, island) : sell(world, good, n, island);
      actions.changed(op, r, good, n);
    });
    parent.appendChild(btn);
  };

  for (const { good, canBuy } of tradeRows(world, island)) {
    const name = cell(table, 'trade-good', GOODS[good].name);
    // Boom-Marke direkt hinter den Gutnamen; bei Platzmangel wandern Lager und Preis in die nächste Zeile
    const boom = document.createElement('span');
    boom.className = 'badge--boom';
    boom.dataset.field = `boom-${good}`;
    boom.hidden = true;
    name.appendChild(boom);
    const stock = document.createElement('small');
    stock.dataset.field = `stock-${good}`;
    name.appendChild(stock);
    const buyPct = document.createElement('small');
    buyPct.dataset.field = `buy-pct-${good}`;
    name.appendChild(buyPct);
    const pct = document.createElement('small');
    pct.dataset.field = `price-${good}`;
    name.appendChild(pct);
    if (isReserveGood(good)) {
      const box = document.createElement('span');
      box.className = 'trade-reserve';
      box.dataset.field = `reserve-box-${good}`;
      const mk = (label: string, dir: -1 | 1): HTMLButtonElement => {
        const b = document.createElement('button');
        b.className = 'btn btn-small';
        b.textContent = label;
        b.dataset.reserve = `${good}-${dir < 0 ? 'minus' : 'plus'}`;
        b.addEventListener('click', () => {
          b.blur();
          actions.reserve(good, stepFrom(reserveOf(world.islands[island]!, good), dir));
        });
        return b;
      };
      const val = document.createElement('small');
      val.dataset.field = `reserve-${good}`;
      const hold = document.createElement('small');
      hold.dataset.field = `reserve-hold-${good}`;
      hold.hidden = true;
      box.append(mk('−', -1), val, mk('+', 1), hold);
      name.appendChild(box);
    }

    const buyCell = cell(table, 'trade-cell');
    if (canBuy) {
      cell(buyCell, 'trade-price', buyUnitText(world, good)).dataset.field = `buy-price-${good}`;
      for (const n of AMOUNTS) addTradeButton(buyCell, good, 'buy', n);
    } else {
      cell(buyCell, 'trade-price', 'noch nicht freigeschaltet');
    }

    const sellCell = cell(table, 'trade-cell');
    for (const n of AMOUNTS) addTradeButton(sellCell, good, 'sell', n);
  }

  updateTrade(panel, world, island);
}

/** Aktualisiert Lagerbestände und dämpft Buttons, die sicher scheitern würden (bleiben klickbar). */
export function updateTrade(panel: HTMLElement, world: World, island: number = HOME): void {
  const stock = world.islands[island]!.stock;
  for (const good of GOOD_IDS) {
    setField(panel, `stock-${good}`, `Lager ${stock[good]}`);
    setField(panel, `buy-pct-${good}`, buyPctText(world, good));
    setField(panel, `price-${good}`, sellPctText(world, good));
    const boom = setField(panel, `boom-${good}`, `Boom +${BOOM_PCT - 100} %`);
    if (boom) boom.hidden = !boomGood(world, good);
  }
  for (const good of RESERVE_GOODS) {
    const value = reserveOf(world.islands[island]!, good);
    setField(panel, `reserve-${good}`, `Reserve ${value}`);
    const box = panel.querySelector<HTMLElement>(`[data-field="reserve-box-${good}"]`);
    const title = reserveTitle(good, value);
    if (box && box.title !== title) box.title = title;
    const text = reserveHoldText(world, island, good);
    const hold = setField(panel, `reserve-hold-${good}`, text);
    if (hold && hold.hidden !== (text === '')) hold.hidden = text === '';
  }
  for (const good of GOOD_IDS) setField(panel, `buy-price-${good}`, buyUnitText(world, good));
  const noteText = buyHeadNote(world);
  const note = setField(panel, 'buy-note', noteText);
  if (note) {
    if (note.hidden !== (noteText === '')) note.hidden = noteText === '';
    if (note.title !== noteText) note.title = noteText;
  }
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('button[data-op]')) {
    const good = btn.dataset.good as GoodId;
    const n = Number(btn.dataset.n);
    const unaffordable =
      btn.dataset.op === 'buy'
        ? buyPrice(world, good, n) > world.money || stock[good] + n > STORAGE_CAP
        : stock[good] < n;
    btn.classList.toggle('unaffordable', unaffordable);
    if (btn.dataset.op === 'buy') {
      const title = buyTitle(world, good, n);
      if (btn.title !== title) btn.title = title;
    }
    if (btn.dataset.op === 'sell') {
      const t = sellTexts(world, good, n);
      const price = btn.querySelector('small');
      if (price && price.textContent !== t.price) price.textContent = t.price;
      if (btn.title !== t.title) btn.title = t.title;
    }
  }
}
