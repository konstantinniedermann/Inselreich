import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { buy, buyPrice, sell, sellPrice } from '../sim/trade';
import type { GoodId, World } from '../sim/types';
import { setField } from './inspect';
import { showMessage } from './messages';

export interface TradeActions {
  back(): void;
  changed(): void;
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
  cell(table, 'trade-head', 'Gut');
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
    btn.textContent = op === 'buy' ? `+${n}` : `−${n}`;
    btn.dataset.good = good;
    btn.dataset.op = op;
    btn.dataset.n = String(n);
    btn.title =
      op === 'buy'
        ? `${n} ${GOODS[good].name} kaufen für G ${buyPrice(good, n)}`
        : `${n} ${GOODS[good].name} verkaufen für G ${sellPrice(good, n)}`;
    btn.addEventListener('click', () => {
      btn.blur();
      const r = op === 'buy' ? buy(world, good, n) : sell(world, good, n);
      if (!r.ok) showMessage(r.reason, 'error');
      actions.changed();
    });
    parent.appendChild(btn);
  };

  for (const good of GOOD_IDS) {
    const name = cell(table, 'trade-good', GOODS[good].name);
    const stock = document.createElement('small');
    stock.dataset.field = `stock-${good}`;
    name.appendChild(stock);

    const buyCell = cell(table, 'trade-cell');
    cell(buyCell, 'trade-price', `G ${GOODS[good].buy}`);
    for (const n of AMOUNTS) addTradeButton(buyCell, good, 'buy', n);

    const sellCell = cell(table, 'trade-cell');
    cell(sellCell, 'trade-price', `G ${GOODS[good].sell}`);
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

/** Aktualisiert Lagerbestände und sperrt Buttons, die sicher scheitern würden. */
export function updateTrade(panel: HTMLElement, world: World): void {
  for (const good of GOOD_IDS) setField(panel, `stock-${good}`, `Lager ${world.stock[good]}`);
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('button[data-op]')) {
    const good = btn.dataset.good as GoodId;
    const n = Number(btn.dataset.n);
    const disabled =
      btn.dataset.op === 'buy'
        ? buyPrice(good, n) > world.money || world.stock[good] + n > STORAGE_CAP
        : world.stock[good] < n;
    if (btn.disabled !== disabled) btn.disabled = disabled;
  }
}
