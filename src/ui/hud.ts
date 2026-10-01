import { CRISIS_LEVELS } from '../sim/defs/crises';
import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { citizens, populationByTier } from '../sim/population';
import { crisisView, goodsBalance } from '../sim/queries';
import type { CrisisLevel, TaxLevel, Tier } from '../sim/types';
import type { GameState } from './app';
import { setField } from './dom';
import type { SaveInfo, Slot } from './storage';
import { CRISIS_LEVEL_IDS, type Settings } from './settings';
import { renderOrder, updateOrder } from './order';
import { crisisCardText } from './crisis';
import { logLine, type LogEntry } from './crisisLog';

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

/** Zeitfenster, in dem ein zweiter Klick auf Neu bzw. Laden bestätigt (Millisekunden). */
const NEW_CONFIRM_MS = 3000;

/** Spielstand-Aktionen, die `app.ts` bereitstellt (das HUD kennt keinen Speicher). */
export interface HudActions {
  save(): void;
  /** Lädt den Slot; ohne Angabe den einzigen bzw. (bei keinem ladbaren) zeigt den Grund. */
  load(slot?: Slot): void;
  /** Ladbare Speicherplätze (kaputte fehlen). */
  listSaves(): SaveInfo[];
  /** Setzt das Tempo (merkt das letzte laufende für die Taste P). */
  setSpeed(speed: GameState['speed']): void;
  /** Aktuelle Einstellungen für die Ton-Regler. */
  settings(): Settings;
  setMuted(muted: boolean): void;
  /** Öffnet die Einstellungs-Karte (Lautstärken, Tag-Nacht, Bewegung, Credits). */
  openSettings(): void;
  /** Speichert die Krisenstufe für das nächste „Neu"; meldet selbst. */
  setCrisisLevel(level: CrisisLevel): void;
  /** Wahr, sobald ein Laden Fortschritt verwerfen würde (dann verlangt Laden einen zweiten Klick). */
  hasProgress(): boolean;
  restart(): void;
  /** Schaltet die Steuerstufe; zeigt bei Fehlschlag selbst den Grund. */
  setTax(level: TaxLevel): void;
  /** Liefert den aktiven Auftrag ab; zeigt selbst Meldung bzw. Grund. */
  deliverOrder(): void;
}

function gameButton(label: string, onClick: (btn: HTMLButtonElement) => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    btn.blur();
    onClick(btn);
  });
  return btn;
}

/** Aufräumfunktionen (Bestätigungs-Timer) je HUD-Element. */
const cleanups = new WeakMap<HTMLElement, () => void>();

/** Stoppt die Bestätigungs-Timer von Neu und Laden; beim Beenden des Spiels aufrufen. */
export function disposeHud(header: HTMLElement): void {
  cleanups.get(header)?.();
  cleanups.delete(header);
}

/**
 * Button mit Zwei-Klick-Bestätigung: der erste Klick zeigt `confirmLabel` für NEW_CONFIRM_MS, der
 * zweite Klick darin führt `run` aus. Ist `needsConfirm()` falsch, läuft `run` sofort.
 */
function confirmButton(
  label: string,
  confirmLabel: string,
  needsConfirm: () => boolean,
  run: () => void,
): { btn: HTMLButtonElement; dispose: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const btn = gameButton(label, () => {
    if (timer === null && needsConfirm()) {
      btn.textContent = confirmLabel;
      timer = setTimeout(() => {
        timer = null;
        btn.textContent = label;
      }, NEW_CONFIRM_MS);
      return;
    }
    if (timer !== null) clearTimeout(timer);
    timer = null;
    btn.textContent = label;
    run();
  });
  return {
    btn,
    dispose: () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}

/** Beschriftung eines Speicherplatzes in der Laden-Auswahl. */
function slotLabel(info: SaveInfo): string {
  return `${info.slot === 'auto' ? 'Autosave' : 'Gespeichert'} — Tick ${info.tick}`;
}

/** Zeit, nach der die Laden-Auswahl von selbst wieder verschwindet (Millisekunden). */
const CHOICE_MS = 10000;

/** Auswahl „Krisen: aus · mild · normal" (M6 13.1); gilt erst ab „Neu". */
function renderCrisisSelect(actions: HudActions): HTMLElement {
  const label = document.createElement('label');
  label.className = 'crisis-select';
  label.title = "gilt ab ‚Neu'";
  label.append('Krisen: ');
  const sel = document.createElement('select');
  sel.setAttribute('aria-label', 'Krisenstufe (gilt ab Neu)');
  for (const id of CRISIS_LEVEL_IDS) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = CRISIS_LEVELS[id].name;
    sel.appendChild(o);
  }
  sel.value = actions.settings().crisisLevel;
  sel.addEventListener('change', () => {
    actions.setCrisisLevel(sel.value as CrisisLevel);
    sel.blur();
  });
  const hint = document.createElement('small');
  hint.textContent = "gilt ab ‚Neu'";
  label.append(sel, hint);
  return label;
}

/**
 * Speichern, Laden und Neu; Neu immer, Laden nur bei Fortschritt mit zweitem Klick. Gibt es zwei
 * ladbare Speicherplätze, folgt auf „Laden" eine Auswahl mit beiden Ständen.
 */
function renderGameButtons(box: Element, actions: HudActions): () => void {
  const choice = document.createElement('span');
  choice.className = 'load-choice';
  let choiceTimer: ReturnType<typeof setTimeout> | null = null;
  const closeChoice = (): void => {
    if (choiceTimer !== null) clearTimeout(choiceTimer);
    choiceTimer = null;
    choice.replaceChildren();
  };
  const openChoice = (saves: SaveInfo[]): void => {
    closeChoice();
    for (const info of saves) {
      choice.appendChild(
        gameButton(slotLabel(info), () => {
          closeChoice();
          actions.load(info.slot);
        }),
      );
    }
    choice.appendChild(gameButton('Abbrechen', closeChoice));
    choiceTimer = setTimeout(closeChoice, CHOICE_MS);
  };
  const runLoad = (): void => {
    const saves = actions.listSaves();
    if (saves.length >= 2) openChoice(saves);
    else actions.load(saves[0]?.slot);
  };
  const load = confirmButton('Laden', 'Wirklich laden?', actions.hasProgress, runLoad);
  const fresh = confirmButton('Neu', 'Wirklich neu?', () => true, actions.restart);
  box.append(
    renderCrisisSelect(actions),
    gameButton('Speichern', () => actions.save()),
    load.btn,
    fresh.btn,
    choice,
  );
  return () => {
    closeChoice();
    load.dispose();
    fresh.dispose();
  };
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
  const settingsBtn = gameButton('Einstellungen', () => actions.openSettings());
  box.append(mute, settingsBtn);
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

/** Ereignis-Log (M6 13.4): Kopf mit Einklappen, Liste neuester oben; Standard offen. */
function renderEventLog(box: HTMLElement): void {
  const toggle = document.createElement('button');
  toggle.className = 'btn';
  toggle.dataset.field = 'log-toggle';
  const list = document.createElement('ul');
  list.className = 'event-log';
  list.dataset.field = 'event-log';
  const sync = (): void => {
    const collapsed = list.classList.contains('event-log--collapsed');
    toggle.textContent = collapsed ? 'Ereignisse ▸' : 'Ereignisse ▾';
    toggle.setAttribute('aria-expanded', String(!collapsed));
  };
  toggle.addEventListener('click', () => {
    toggle.blur();
    list.classList.toggle('event-log--collapsed');
    sync();
  });
  sync();
  box.append(toggle, list);
}

/** Schreibt die Log-Einträge in die Liste; nur bei Änderung. Ohne Einträge ist die Box verborgen. */
function updateEventLog(box: HTMLElement, entries: readonly LogEntry[]): void {
  box.hidden = entries.length === 0;
  const list = box.querySelector<HTMLElement>('[data-field="event-log"]');
  if (!list) return;
  const key = entries.map(logLine).join('\n');
  if (list.dataset.key === key) return;
  list.dataset.key = key;
  list.replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement('li');
      li.className = 'event-log__item';
      li.textContent = logLine(e);
      return li;
    }),
  );
}

/** Baut das HUD beim ersten Aufruf auf und aktualisiert danach nur die Werte. */
export function updateHud(header: HTMLElement, state: GameState, actions: HudActions): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-money" data-field="money"></span>' +
      '<span class="hud-balance"><span data-field="balance"></span> ' +
      '<span data-field="net"></span></span>' +
      '<span class="hud-tick" data-field="tick"></span><span class="hud-speed"></span>' +
      '<span class="hud-sound"></span><span class="hud-game"></span></div>' +
      '<div class="pop-row"></div><div class="stock-row"></div>' +
      '<div class="ctrl-row"><span class="hud-tax"></span><span class="order-card"></span>' +
      '<span class="card card--crisis" data-field="crisis-card"></span></div>' +
      '<div class="log-box"></div>' +
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
    const logBox = header.querySelector<HTMLElement>('.log-box');
    if (logBox) renderEventLog(logBox);
    const gameBox = header.querySelector('.hud-game');
    if (gameBox) cleanups.set(header, renderGameButtons(gameBox, actions));
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
  const logBox = header.querySelector<HTMLElement>('.log-box');
  if (logBox) updateEventLog(logBox, state.eventLog);
  setField(header, 'tick', `Tick: ${world.tick}`);
  setField(header, 'seed', `Karte: ${world.seed}`);
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}
