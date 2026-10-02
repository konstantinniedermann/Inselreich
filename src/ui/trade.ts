import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { BOOM_PCT } from '../sim/defs/crises';
import { buy, buyPrice, sell, sellPrice } from '../sim/trade';
import type { GoodId, Result, World } from '../sim/types';
import { setField } from './dom';

export interface TradeActions {
  back(): void;
  /** Nach jedem Kauf/Verkauf, mit dem Ergebnis der Sim-Aktion (Meldung und Ton macht der Aufrufer). */
  changed(op: 'buy' | 'sell', result: Result): void;
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

/** Wahr, solange `good` das Boom-Gut der laufenden Krise ist. */
export function boomGood(world: World, good: GoodId): boolean {
  const c = world.crisis;
  return c !== null && c.kind === 'boom' && c.good === good;
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
export function renderTrade(panel: HTMLElement, world: World, actions: TradeActions): void {
  panel.replaceChildren();
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Handel am Kontor';
  panel.appendChild(title);

  const table = cell(panel, 'trade-table');
  cell(table, 'trade-head', 'Kaufen');
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
    btn.title = sellT
      ? sellT.title
      : `${n} ${GOODS[good].name} kaufen für ${buyPrice(good, n)} Geld`;
    btn.addEventListener('click', () => {
      btn.blur();
      const r = op === 'buy' ? buy(world, good, n) : sell(world, good, n);
      actions.changed(op, r);
    });
    parent.appendChild(btn);
  };

  for (const good of GOOD_IDS) {
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
    const pct = document.createElement('small');
    pct.dataset.field = `price-${good}`;
    name.appendChild(pct);

    const buyCell = cell(table, 'trade-cell');
    cell(buyCell, 'trade-price', `${GOODS[good].buy} Geld`);
    for (const n of AMOUNTS) addTradeButton(buyCell, good, 'buy', n);

    const sellCell = cell(table, 'trade-cell');
    for (const n of AMOUNTS) addTradeButton(sellCell, good, 'sell', n);
  }

  const buttons = cell(panel, 'panel-actions');
  const back = document.createElement('button');
  back.className = 'btn';
  back.textContent = 'Zurück';
  back.addEventListener('click', () => {
    back.blur();
    actions.back();
  });
  buttons.appendChild(back);
  updateTrade(panel, world);
}

/** Aktualisiert Lagerbestände und dämpft Buttons, die sicher scheitern würden (bleiben klickbar). */
export function updateTrade(panel: HTMLElement, world: World): void {
  for (const good of GOOD_IDS) {
    setField(panel, `stock-${good}`, `Lager ${world.stock[good]}`);
    setField(panel, `price-${good}`, `Preis ${world.sellPct[good]} %`);
    const boom = setField(panel, `boom-${good}`, `Boom +${BOOM_PCT - 100} %`);
    if (boom) boom.hidden = !boomGood(world, good);
  }
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('button[data-op]')) {
    const good = btn.dataset.good as GoodId;
    const n = Number(btn.dataset.n);
    const unaffordable =
      btn.dataset.op === 'buy'
        ? buyPrice(good, n) > world.money || world.stock[good] + n > STORAGE_CAP
        : world.stock[good] < n;
    btn.classList.toggle('unaffordable', unaffordable);
    if (btn.dataset.op === 'sell') {
      const t = sellTexts(world, good, n);
      const price = btn.querySelector('small');
      if (price && price.textContent !== t.price) price.textContent = t.price;
      if (btn.title !== t.title) btn.title = t.title;
    }
  }
}
