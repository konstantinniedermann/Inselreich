import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { SERVICE_BUILDING, citizens, populationByTier } from '../sim/population';
import { crisisView, goodsBalance } from '../sim/queries';
import type { GoodId, TaxLevel, Tier, World } from '../sim/types';
import type { GameState } from './app';
import { blurAfterClick, setField } from './dom';
import type { Settings } from './settings';
import { renderOrder, updateOrder } from './order';
import { crisisCardText } from './crisis';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from './time';

const TIER_IDS = Object.keys(TIERS).map(Number) as Tier[];

const SPEEDS: { value: GameState['speed']; label: string }[] = [
  { value: 0, label: '⏸' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

/** Zahl mit ausdrücklichem Vorzeichen: „+12", „−33", „±0" (typografisches Minus wie beim Unterhalt). */
function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return '±0';
}

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

/** Tooltip einer Steuerstufe: Steuer, Wartezeit bis zum Aufstieg und Belegung (alles aus `TAX_LEVELS`). */
export function taxTooltip(level: TaxLevel): string {
  const t = TAX_LEVELS[level];
  const wait = t.upgradeWait === null ? 'kein Aufstieg' : `Aufstieg nach ${t.upgradeWait} Ticks`;
  return `Steuer ${t.pct} % · ${wait} · Belegung ${Math.round(t.occupancy * 100)} %`;
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

/** Baut das HUD beim ersten Aufruf auf und aktualisiert danach nur die Werte. */
export function updateHud(header: HTMLElement, state: GameState, actions: HudActions): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-money" data-field="money"></span>' +
      '<span class="hud-balance"><span data-field="balance"></span> ' +
      '<span data-field="net"></span></span>' +
      '<span class="hud-tick" data-field="tick"></span><span class="hud-speed"></span>' +
      '<span class="hud-sound"></span></div>' +
      '<div class="pop-row"></div><div class="stock-row"></div>' +
      '<div class="ctrl-row"><span class="hud-tax"></span><span class="order-card"></span>' +
      '<span class="card card--crisis" data-field="crisis-card"></span></div>' +
      '<div class="hud-seed" data-field="seed"></div>';
    const popRow = header.querySelector('.pop-row');
    for (const tier of TIER_IDS) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.field = `pop-${tier}`;
      popRow?.appendChild(chip);
    }
    const goal = document.createElement('span');
    goal.className = 'chip';
    goal.dataset.field = 'goal';
    popRow?.appendChild(goal);
    const stockRow = header.querySelector('.stock-row');
    for (const good of GOOD_IDS) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.good = good;
      chip.dataset.field = `stock-${good}`;
      stockRow?.appendChild(chip);
    }
    const speedBox = header.querySelector('.hud-speed');
    for (const s of SPEEDS) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = s.label;
      btn.dataset.speed = String(s.value);
      btn.addEventListener('click', () => {
        btn.blur();
        actions.setSpeed(s.value);
        updateHud(header, state, actions);
      });
      speedBox?.appendChild(btn);
    }
    const taxBox = header.querySelector('.hud-tax');
    if (taxBox) renderTaxControls(taxBox, actions);
    const orderEl = header.querySelector<HTMLElement>('.order-card');
    if (orderEl) renderOrder(orderEl, state.world, { deliver: actions.deliverOrder });
    const soundBox = header.querySelector('.hud-sound');
    if (soundBox) renderSoundControls(soundBox, actions);
  }
  const { world } = state;
  setField(header, 'money', `Geld: ${world.money}`)?.classList.toggle('negative', world.money < 0);
  const { taxes, upkeep } = world.stats;
  const taxSign = taxes > 0 ? '+' : '';
  const upkeepSign = upkeep > 0 ? '−' : '';
  setField(header, 'balance', `Steuern ${taxSign}${taxes} · Unterhalt ${upkeepSign}${upkeep}`);
  const net = taxes - upkeep;
  setField(header, 'net', `= ${signed(net)} / ${UPKEEP_INTERVAL} Ticks`)?.classList.toggle(
    'negative',
    net < 0,
  );
  const pop = populationByTier(world);
  for (const tier of TIER_IDS) setField(header, `pop-${tier}`, `${TIERS[tier].name} ${pop[tier]}`);
  setField(header, 'goal', `Bürger-Ziel ${citizens(world)} / ${WIN_CITIZENS}`);
  const balance = goodsBalance(world);
  for (const good of GOOD_IDS) {
    const b = balance[good];
    const chip = setField(
      header,
      `stock-${good}`,
      `${GOODS[good].name} ${world.stock[good]} ${balanceLabel(b.net)}`,
    );
    if (chip) {
      chip.classList.toggle('negative', b.net <= -TREND_EPS);
      const tip = `Erzeugung ${b.produced.toFixed(1)} · Verbrauch ${b.consumed.toFixed(1)} je 100 Ticks`;
      if (chip.title !== tip) chip.title = tip;
    }
  }
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-tax .btn')) {
    btn.classList.toggle('active', btn.dataset.tax === world.taxLevel);
  }
  const left = world.taxLockedUntil - world.tick;
  setField(header, 'tax-lock', left > 0 ? `Sperre noch ${left} Ticks` : '');
  const orderEl = header.querySelector<HTMLElement>('.order-card');
  if (orderEl) updateOrder(orderEl, world);
  const crisis = crisisCardText(crisisView(world), world);
  const crisisEl = setField(header, 'crisis-card', crisis.text);
  if (crisisEl) {
    if (crisis.kind === null) delete crisisEl.dataset.kind;
    else crisisEl.dataset.kind = crisis.kind;
    if (crisis.level === null) delete crisisEl.dataset.level;
    else crisisEl.dataset.level = crisis.level;
  }
  setField(header, 'tick', `Tick: ${world.tick}`);
  setField(header, 'seed', `Karte: ${world.seed}`);
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
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
