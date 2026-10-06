import { HOME } from '../sim/world';
import { islandName } from '../sim/islands';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { SERVICE_BUILDING, populationByTier } from '../sim/population';
import { crisisView, goalView, goodsBalance } from '../sim/queries';
import { effectiveTaxLevel, townhallActive } from '../sim/townhall';
import { functionLock, goodUnlocked, isUnlocked } from '../sim/unlocks';
import type { GoodId, TaxLevel, Tier, UnlockId, World } from '../sim/types';
import type { GameState } from './app';
import { blurAfterClick, setField } from './dom';
import type { Settings } from './settings';
import { renderOrder, updateOrder } from './order';
import { crisisCardText } from './crisis';
import { taxEffect } from './guide';
import { goalTexts } from './goal';
import type { IconId } from './icons';
import { islandList } from './islandJump';
import { iconChip } from './messages';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from './time';

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

/** Tooltip einer Steuerstufe: Wirkung in Klartext (`taxEffect`, alles aus `TAX_LEVELS`). */
export function taxTooltip(level: TaxLevel): string {
  return taxEffect(level);
}

/** Symbol-Chip der Kopfzeile: Symbol, sichtbarer Wert und zugänglicher Name (= bisheriger Text, Spec 14). */
export interface ChipView {
  icon: IconId;
  text: string;
  label: string;
}

/** Lager-Chip: Symbol des Guts, „{Bestand} {Pfeil}"; `label` ist der bisherige Text „{Gut} {Bestand} {Pfeil}". */
export function chipView(world: World, good: GoodId, island: number = HOME): ChipView {
  const text = `${world.islands[island]!.stock[good]} ${trendArrow(goodsBalance(world, island)[good].net)}`;
  return { icon: good, text, label: `${GOODS[good].name} ${text}` };
}

/** Einwohner-Chip einer Stufe: Stufen-Symbol und Zahl. */
export function popChipView(world: World, tier: Tier): ChipView {
  const n = String(populationByTier(world)[tier]);
  return { icon: `tier-${tier}`, text: n, label: `${TIERS[tier].name} ${n}` };
}

export function moneyView(world: World): ChipView {
  return { icon: 'money', text: String(world.money), label: `Geld ${world.money}` };
}

const BALANCE_PREFIX = 'Bilanz ';

/** Bilanz: Waage und Wert; `label` ist der bisherige Text. */
export function balanceView(world: World): ChipView {
  const { text } = balanceText(world.stats);
  return { icon: 'balance', text: text.slice(BALANCE_PREFIX.length), label: text };
}

/** Steuer-Knopf: Steuer-Symbol und Stufenname, oder `null` ohne aktive Amtsstube. */
export function taxView(world: World): ChipView | null {
  const label = taxButtonText(world);
  return label === null
    ? null
    : { icon: 'tax', text: TAX_LEVELS[effectiveTaxLevel(world)].name, label };
}

/** Rolle eines Chips: ein Knopf bleibt Knopf (sein `aria-label` ist gültig), alles andere braucht `img`. */
export function chipRole(tagName: string): 'img' | null {
  return tagName === 'BUTTON' ? null : 'img';
}

/** Kontostand; läuft je Frame (Spec 7), ohne Interpolation. */
export function updateMoney(header: HTMLElement, world: World): void {
  setChip(header, 'money', moneyView(world))?.classList.toggle('negative', world.money < 0);
}

/** Mindestabstand (ms) zwischen zwei Aktualisierungen der Bilanz-Anzeige. */
export const BALANCE_REFRESH_MS = 500;
/** Ist die Bilanz-Anzeige wieder fällig? */
export const balanceDue = (nowMs: number, lastMs: number): boolean =>
  nowMs - lastMs >= BALANCE_REFRESH_MS;
const balanceShownAt = new WeakMap<HTMLElement, number>();

/**
 * Setzt Symbol, Wert und `aria-label` eines `data-field`-Elements. Der Symbol-Chip entsteht einmal; danach
 * ändert sich nur der Wert. Gibt das Element zurück.
 */
function setChip(root: HTMLElement, field: string, v: ChipView): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!el) return null;
  let value = el.querySelector<HTMLElement>('.chip-value');
  if (!value || el.dataset.icon !== v.icon) {
    value = document.createElement('span');
    value.className = 'chip-value';
    el.replaceChildren(iconChip(v.icon), value);
    el.dataset.icon = v.icon;
  }
  if (value.textContent !== v.text) value.textContent = v.text;
  const role = chipRole(el.tagName);
  if (role !== null && el.getAttribute('role') !== role) el.setAttribute('role', role);
  if (el.getAttribute('aria-label') !== v.label) el.setAttribute('aria-label', v.label);
  return el;
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
  /** Öffnet die Hilfe-Karte; `opener` bekommt beim Schliessen den Fokus zurück. */
  openHelp(opener: HTMLElement): void;
  /** Wählt die erste aktive Amtsstube und öffnet ihr Info-Panel (Spec 11.8). */
  openTownhall(): void;
  /** Liefert den aktiven Auftrag ab; zeigt selbst Meldung bzw. Grund. */
  deliverOrder(): void;
  /** Springt mit der Kamera zur Insel `index` (Knopf „Inseln", M12 E2). */
  jumpToIsland(index: number): void;
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
  const helpBtn = gameButton('Hilfe', (btn) => actions.openHelp(btn));
  const settingsBtn = gameButton('Einstellungen', (btn) => actions.openSettings(btn));
  const menuBtn = gameButton('Menü', (btn) => actions.openMenu(btn));
  box.append(mute, helpBtn, settingsBtn, menuBtn);
}

/** Baut die Kopfzeile beim ersten Aufruf auf und aktualisiert danach nur die Werte (Spec L2). */
export function updateHud(header: HTMLElement, state: GameState, actions: HudActions): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-balance" data-field="balance"></span>' +
      '<span class="pop-chips"></span><span class="chip" data-field="goal"></span>' +
      '<span class="hud-money" data-field="money"></span>' +
      '<span class="hud-tax" hidden><button class="btn" data-field="tax" type="button"></button></span>' +
      '<span class="hud-islands" hidden><button class="btn" data-field="islands" type="button" aria-haspopup="true" aria-expanded="false">Inseln</button>' +
      '<ul class="island-list" role="menu" hidden></ul></span>' +
      '<span class="hud-speed"></span><span class="hud-sound"></span></div>' +
      '<div class="stock-row"><span class="island-name" data-field="island-name" hidden></span></div>';
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
    const taxBtn = header.querySelector<HTMLButtonElement>('[data-field="tax"]');
    taxBtn?.addEventListener('click', (ev) => {
      if (blurAfterClick(ev.detail)) taxBtn.blur();
      actions.openTownhall();
    });
    const soundBox = header.querySelector('.hud-sound');
    if (soundBox) renderSoundControls(soundBox, actions);
    bindIslandMenu(header, state, actions);
  }
  const { world } = state;
  const nowMs = performance.now();
  if (balanceDue(nowMs, balanceShownAt.get(header) ?? -Infinity)) {
    balanceShownAt.set(header, nowMs);
    const balEl = setChip(header, 'balance', balanceView(world));
    if (balEl) {
      const tip = balanceTooltip(world);
      if (balEl.title !== tip) balEl.title = tip;
      balEl.classList.toggle('negative', world.stats.taxes - world.stats.upkeep < 0);
    }
  }
  for (const tier of TIER_IDS) {
    const chip = setChip(header, `pop-${tier}`, popChipView(world, tier));
    const hide = popChipHidden(world, tier);
    if (chip && chip.hidden !== hide) chip.hidden = hide;
  }
  const goal = goalTexts(goalView(world));
  const goalEl = setField(header, 'goal', goal.chip);
  if (goalEl && goalEl.title !== goal.title) goalEl.title = goal.title;
  updateMoney(header, world);
  const island = state.activeIsland;
  const prefix = stockPrefix(world, island);
  const nameEl = header.querySelector<HTMLElement>('[data-field="island-name"]');
  if (nameEl) {
    const text = prefix === null ? '' : `${prefix} ·`;
    if (nameEl.textContent !== text) nameEl.textContent = text;
    if (nameEl.hidden !== (prefix === null)) nameEl.hidden = prefix === null;
  }
  const seafaring = functionLock(world, 'seafaring') === null;
  const islandsBox = header.querySelector<HTMLElement>('.hud-islands');
  if (islandsBox) {
    if (islandsBox.hidden === seafaring) islandsBox.hidden = !seafaring;
    // `.hud-islands` setzt `display: flex`; das Attribut allein verbirgt es nicht
    const display = seafaring ? '' : 'none';
    if (islandsBox.style.display !== display) islandsBox.style.display = display;
    if (!seafaring) closeIslandMenu(islandsBox);
  }
  const balance = goodsBalance(world, island);
  for (const good of GOOD_IDS) {
    const b = balance[good];
    const chip = setChip(header, `stock-${good}`, chipView(world, good, island));
    if (chip) {
      const hide = stockChipHidden(world, good, island);
      if (chip.hidden !== hide) chip.hidden = hide;
      chip.classList.toggle('negative', b.net <= -TREND_EPS);
      const tip = stockTooltip(world, good, island);
      if (chip.title !== tip) chip.title = tip;
    }
  }
  const tax = taxView(world);
  const taxBox = header.querySelector<HTMLElement>('.hud-tax');
  if (taxBox) {
    const hide = tax === null;
    if (taxBox.hidden !== hide) taxBox.hidden = hide;
    // `.hud-tax` setzt `display: flex`; das Attribut allein verbirgt es nicht (style.css gehört nicht zu U1)
    const display = hide ? 'none' : '';
    if (taxBox.style.display !== display) taxBox.style.display = display;
    if (tax !== null) setChip(header, 'tax', tax);
  }
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}

function closeIslandMenu(box: HTMLElement): void {
  const list = box.querySelector<HTMLElement>('.island-list');
  const btn = box.querySelector<HTMLElement>('[data-field="islands"]');
  if (list && !list.hidden) list.hidden = true;
  btn?.setAttribute('aria-expanded', 'false');
}

/**
 * Knopf „Inseln": Klick 1 baut die Liste beim Öffnen auf (nicht je Tick), Klick 2 auf einen Eintrag springt und
 * schliesst sie. Ein Klick daneben oder Esc schliesst ebenfalls.
 */
function bindIslandMenu(header: HTMLElement, state: GameState, actions: HudActions): void {
  const box = header.querySelector<HTMLElement>('.hud-islands');
  const btn = box?.querySelector<HTMLButtonElement>('[data-field="islands"]');
  const list = box?.querySelector<HTMLElement>('.island-list');
  if (!box || !btn || !list) return;
  const close = (): void => closeIslandMenu(box);
  btn.addEventListener('click', (ev) => {
    if (blurAfterClick(ev.detail)) btn.blur();
    if (!list.hidden) return close();
    list.replaceChildren(
      ...islandList(state.world).map((e) => {
        const li = document.createElement('li');
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'btn';
        item.setAttribute('role', 'menuitem');
        item.dataset.island = String(e.index);
        item.textContent = e.label;
        item.addEventListener('click', () => {
          item.blur();
          close();
          actions.jumpToIsland(e.index);
        });
        li.appendChild(item);
        return li;
      }),
    );
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('pointerdown', (ev) => {
    if (!list.hidden && ev.target instanceof Node && !box.contains(ev.target)) close();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !list.hidden) close();
  });
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

/** Freischalt-Eintrag, ab dem der Einwohner-Chip einer Stufe erscheint (reine Zuordnung, kein Spielwert); Stufe 1 immer. */
const POP_CHIP_UNLOCK: Readonly<Partial<Record<Tier, UnlockId>>> = { 2: 'U3', 3: 'U5', 4: 'U6' };

/** Stufen-Chip verborgen: niemand auf der Stufe und der Eintrag noch nicht frei (Spec 11.3). */
export function popChipHidden(world: World, tier: Tier): boolean {
  const entry = POP_CHIP_UNLOCK[tier];
  return populationByTier(world)[tier] === 0 && entry !== undefined && !isUnlocked(world, entry);
}

/** Lager-Chip verborgen, solange das Gut nicht frei ist und nichts im Lager liegt (Spec 11.3). */
export function stockChipHidden(world: World, good: GoodId, island: number = HOME): boolean {
  return !(goodUnlocked(world, good) || world.islands[island]!.stock[good] > 0);
}

/**
 * Inselname vor den Lager-Chips: erst mit `seafaring` (D-143), davor `null` (die Leiste zeigt dann stets die
 * Heimat, ohne Namen).
 */
export function stockPrefix(world: World, island: number): string | null {
  return functionLock(world, 'seafaring') === null ? islandName(world, island) : null;
}

/** Steuer-Knopf der Kopfzeile (wirksame Stufe) oder `null` ohne aktive Amtsstube (Spec 11.8). */
export function taxButtonText(world: World): string | null {
  return townhallActive(world) ? `Steuer ${TAX_LEVELS[effectiveTaxLevel(world)].name}` : null;
}

/** Tooltip der Bilanz: Steuern und Unterhalt; ohne aktive Amtsstube die Zeile zur Steuer (Spec 11.8). */
export function balanceTooltip(world: World): string {
  const base = balanceText(world.stats).title;
  return townhallActive(world)
    ? base
    : `${base}\nSteuer: ${TAX_LEVELS[effectiveTaxLevel(world)].name} (keine Amtsstube)`;
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

export function stockTooltip(world: World, good: GoodId, island: number = HOME): string {
  const b = goodsBalance(world, island)[good];
  const pm = (x: number): number => perMinute(x, GOODS_BALANCE_TICKS);
  return (
    `${GOODS[good].name} ${world.islands[island]!.stock[good]} / ${STORAGE_CAP} · ${signedNum(pm(b.net))} / min ` +
    `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)`
  );
}

export function speedTooltip(n: 1 | 2 | 4): string {
  return `Spielzeit läuft ${n}× so schnell`;
}
