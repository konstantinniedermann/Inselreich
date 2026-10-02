import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { buildLock } from '../sim/placement';
import { SERVICE_BUILDING, populationByTier, tierLock } from '../sim/population';
import { crisisView, goalView, goodsBalance } from '../sim/queries';
import type { GoodId, TaxLevel, Tier, World } from '../sim/types';
import type { GameState } from './app';
import { blurAfterClick, setField } from './dom';
import type { Settings } from './settings';
import { renderOrder, updateOrder } from './order';
import { crisisCardText } from './crisis';
import { taxEffect } from './guide';
import { goalTexts } from './goal';
import { GOODS_BALANCE_TICKS, formatGameTime, perMinute, signedNum } from './time';

const TIER_IDS = Object.keys(TIERS).map(Number) as Tier[];

const SPEEDS: { value: GameState['speed']; label: string }[] = [
  { value: 0, label: '⏸' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

/** Schwelle, unter der eine Bilanz als „ausgeglichen" gilt (gegen Gleitkomma-Rauschen). */
const TREND_EPS = 0.05;

/** Trendpfeil zur Bilanz je 100 Ticks. */
export function trendArrow(net: number): '↑' | '↓' | '→' {
  if (net >= TREND_EPS) return '↑';
  if (net <= -TREND_EPS) return '↓';
  return '→';
}

/** Bilanz mit einer Nachkommastelle und Vorzeichen (typografisches Minus); im Rauschen „±0.0". */
export function formatBalance(net: number): string {
  if (Math.abs(net) < TREND_EPS) return '±0.0';
  return net > 0 ? `+${net.toFixed(1)}` : `−${(-net).toFixed(1)}`;
}

/** Trendpfeil und Bilanz für den Lager-Chip, z. B. „↓ −5.5". */
export function balanceLabel(net: number): string {
  return `${trendArrow(net)} ${formatBalance(net)}`;
}

const TAX_IDS = Object.keys(TAX_LEVELS) as TaxLevel[];

/** Tooltip einer Steuerstufe: Wirkung in Klartext (`taxEffect`, alles aus `TAX_LEVELS`). */
export function taxTooltip(level: TaxLevel): string {
  return taxEffect(level);
}

/** Spielstand-Aktionen, die `app.ts` bereitstellt (das HUD kennt keinen Speicher). */
export interface HudActions {
  /** Setzt das Tempo (merkt das letzte laufende für die Taste P). */
  setSpeed(speed: GameState['speed']): void;
  /** Aktuelle Einstellungen für die Ton-Regler. */
  settings(): Settings;
  setMuted(muted: boolean): void;
  /**
   * Öffnet die Einstellungs-Karte (Lautstärken, Tag-Nacht, Bewegung, Credits).
   * `opener` ist der auslösende Knopf; ihm gibt das Schliessen den Fokus zurück.
   */
  openSettings(opener?: HTMLElement): void;
  /** Öffnet die Menü-Karte (Speichern, Laden, Neue Insel, Hilfe); `opener` bekommt den Fokus zurück. */
  openMenu(opener: HTMLElement): void;
  /** Schaltet die Steuerstufe; zeigt bei Fehlschlag selbst den Grund. */
  setTax(level: TaxLevel): void;
  /** Liefert den aktiven Auftrag ab; zeigt selbst Meldung bzw. Grund. */
  deliverOrder(): void;
}

function gameButton(label: string, onClick: (btn: HTMLButtonElement) => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = label;
  btn.addEventListener('click', (ev) => {
    if (blurAfterClick(ev.detail)) btn.blur();
    onClick(btn);
  });
  return btn;
}

/** Schnellschalter Stumm und Button Einstellungen; Werte kommen aus und gehen an `actions`. */
function renderSoundControls(box: Element, actions: HudActions): void {
  const initial = actions.settings();
  const mute = document.createElement('button');
  mute.className = 'btn';
  mute.textContent = 'Stumm';
  const syncMute = (muted: boolean): void => {
    mute.classList.toggle('active', muted);
    mute.setAttribute('aria-pressed', String(muted));
  };
  syncMute(initial.muted);
  mute.addEventListener('click', () => {
    mute.blur();
    const muted = !actions.settings().muted;
    actions.setMuted(muted);
    syncMute(muted);
  });
  const settingsBtn = gameButton('Einstellungen', (btn) => actions.openSettings(btn));
  const menuBtn = gameButton('Menü', (btn) => actions.openMenu(btn));
  box.append(mute, settingsBtn, menuBtn);
}

/** Steuerregler: drei Buttons (nie `disabled`) und der Sperrhinweis. */
function renderTaxControls(box: Element, actions: HudActions): void {
  const label = document.createElement('span');
  label.textContent = 'Steuer';
  box.appendChild(label);
  for (const level of TAX_IDS) {
    const btn = gameButton(TAX_LEVELS[level].name, () => actions.setTax(level));
    btn.dataset.tax = level;
    btn.title = taxTooltip(level);
    box.appendChild(btn);
  }
  const lock = document.createElement('span');
  lock.className = 'tax-lock';
  lock.dataset.field = 'tax-lock';
  box.appendChild(lock);
}

/** Baut die Kopfzeile beim ersten Aufruf auf und aktualisiert danach nur die Werte (Spec L2). */
export function updateHud(header: HTMLElement, state: GameState, actions: HudActions): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-balance" data-field="balance"></span>' +
      '<span class="pop-chips"></span><span class="chip" data-field="goal"></span>' +
      '<span class="hud-money" data-field="money"></span><span class="hud-tax"></span>' +
      '<span class="hud-speed"></span><span class="hud-sound"></span></div>' +
      '<div class="stock-row"></div>';
    const popBox = header.querySelector('.pop-chips');
    for (const tier of TIER_IDS) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.field = `pop-${tier}`;
      chip.title = tierTooltip(tier);
      popBox?.appendChild(chip);
    }
    const stockRow = header.querySelector('.stock-row');
    for (const good of GOOD_IDS) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.good = good;
      chip.dataset.field = `stock-${good}`;
      stockRow?.appendChild(chip);
    }
    const lock = document.createElement('span');
    lock.className = 'tax-lock';
    lock.dataset.field = 'tax-lock';
    stockRow?.appendChild(lock);
    const speedBox = header.querySelector('.hud-speed');
    for (const s of SPEEDS) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = s.label;
      btn.dataset.speed = String(s.value);
      if (s.value === 2 || s.value === 4) btn.title = speedTooltip(s.value);
      btn.addEventListener('click', () => {
        btn.blur();
        actions.setSpeed(s.value);
        updateHud(header, state, actions);
      });
      speedBox?.appendChild(btn);
    }
    const taxBox = header.querySelector('.hud-tax');
    if (taxBox) renderTaxControls(taxBox, actions);
    const soundBox = header.querySelector('.hud-sound');
    if (soundBox) renderSoundControls(soundBox, actions);
  }
  const { world } = state;
  const bal = balanceText(world.stats);
  const balEl = setField(header, 'balance', bal.text);
  if (balEl) {
    if (balEl.title !== bal.title) balEl.title = bal.title;
    balEl.classList.toggle('negative', world.stats.taxes - world.stats.upkeep < 0);
  }
  const pop = populationByTier(world);
  for (const tier of TIER_IDS) {
    const chip = setField(header, `pop-${tier}`, `${TIERS[tier].name} ${pop[tier]}`);
    const hide = popChipHidden(world, tier);
    if (chip && chip.hidden !== hide) chip.hidden = hide;
  }
  const goal = goalTexts(goalView(world));
  const goalEl = setField(header, 'goal', goal.chip);
  if (goalEl && goalEl.title !== goal.title) goalEl.title = goal.title;
  setField(header, 'money', `Geld ${world.money}`)?.classList.toggle('negative', world.money < 0);
  const balance = goodsBalance(world);
  for (const good of GOOD_IDS) {
    const b = balance[good];
    const chip = setField(
      header,
      `stock-${good}`,
      `${GOODS[good].name} ${world.stock[good]} ${trendArrow(b.net)}`,
    );
    if (chip) {
      const hide = stockChipHidden(world, good);
      if (chip.hidden !== hide) chip.hidden = hide;
      chip.classList.toggle('negative', b.net <= -TREND_EPS);
      const tip = stockTooltip(world, good);
      if (chip.title !== tip) chip.title = tip;
    }
  }
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-tax .btn')) {
    btn.classList.toggle('active', btn.dataset.tax === world.taxLevel);
  }
  const left = world.taxLockedUntil - world.tick;
  setField(header, 'tax-lock', left > 0 ? `Steuer wieder änderbar in ${formatGameTime(left)}` : '');
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}

/** Legt den Meldungsstapel oben rechts in `#game` an: Auftrag und Krisenkarte (Spec L2). */
export function renderNoticeStack(
  gameEl: HTMLElement,
  world: World,
  deliver: () => void,
): HTMLElement {
  const stack = document.createElement('div');
  stack.className = 'notice-stack';
  const order = document.createElement('span');
  order.className = 'order-card';
  renderOrder(order, world, { deliver });
  const crisis = document.createElement('span');
  crisis.className = 'card card--crisis';
  crisis.dataset.field = 'crisis-card';
  crisis.hidden = true;
  stack.append(order, crisis);
  gameEl.appendChild(stack);
  updateNoticeStack(stack, world);
  return stack;
}

/** Aktualisiert Auftrag und Krisenkarte; eine leere Krisenkarte ist verborgen. */
export function updateNoticeStack(stack: HTMLElement, world: World): void {
  const orderEl = stack.querySelector<HTMLElement>('.order-card');
  if (orderEl) updateOrder(orderEl, world);
  const crisis = crisisCardText(crisisView(world), world);
  const crisisEl = setField(stack, 'crisis-card', crisis.text);
  if (crisisEl) {
    crisisEl.hidden = crisis.text === '';
    if (crisis.kind === null) delete crisisEl.dataset.kind;
    else crisisEl.dataset.kind = crisis.kind;
    if (crisis.level === null) delete crisisEl.dataset.level;
    else crisisEl.dataset.level = crisis.level;
  }
}

/** Bedürfnisse und Dienste einer Stufe; `onlyNew` lässt weg, was die Stufe darunter schon braucht. */
function tierNeeds(tier: Tier, onlyNew: boolean): string[] {
  const t = TIERS[tier];
  const prev = onlyNew && tier > 1 ? TIERS[(tier - 1) as Tier] : null;
  const goods = GOOD_IDS.filter((g) => g in t.needs && !(prev && g in prev.needs)).map(
    (g) => GOODS[g].name,
  );
  const services = t.services
    .filter((s) => !(prev && prev.services.includes(s)))
    .map((s) => BUILDING_DEFS[SERVICE_BUILDING[s]].name);
  return [...goods, ...services];
}

export function tierTooltip(tier: Tier): string {
  return `${TIERS[tier].name}: Einwohner der Stufe ${tier} · brauchen ${tierNeeds(tier, false).join(', ')}`;
}

export function tierPath(): string {
  return TIER_IDS.map((t) =>
    t === 1 ? TIERS[t].name : `${TIERS[t].name} (brauchen ${tierNeeds(t, true).join(', ')})`,
  ).join(' → ');
}

/** Stufen-Chip verborgen: niemand auf der Stufe und die Stufe noch gesperrt (Spec M8 14.1, ruhige Kopfzeile). */
export function popChipHidden(world: World, tier: Tier): boolean {
  return populationByTier(world)[tier] === 0 && tierLock(world, tier) !== null;
}

/** Glas-Chip verborgen, solange die Glashütte gesperrt und kein Glas im Lager ist (Spec M8 14.1, Änderung S11). */
export function stockChipHidden(world: World, good: GoodId): boolean {
  return good === 'glass' && buildLock(world, 'glassworks') !== null && world.stock.glass === 0;
}

export function balanceText(stats: { taxes: number; upkeep: number }): {
  text: string;
  title: string;
} {
  const pm = (x: number): number => perMinute(x, UPKEEP_INTERVAL);
  return {
    text: `Bilanz ${signedNum(pm(stats.taxes - stats.upkeep))} / min`,
    title: `Steuern +${pm(stats.taxes)} / min · Unterhalt −${pm(stats.upkeep)} / min`,
  };
}

export function stockTooltip(world: World, good: GoodId): string {
  const b = goodsBalance(world)[good];
  const pm = (x: number): number => perMinute(x, GOODS_BALANCE_TICKS);
  return (
    `${GOODS[good].name} ${world.stock[good]} / ${STORAGE_CAP} · ${signedNum(pm(b.net))} / min ` +
    `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)`
  );
}

export function speedTooltip(n: 1 | 2 | 4): string {
  return `Spielzeit läuft ${n}× so schnell`;
}
