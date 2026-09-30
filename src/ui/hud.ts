import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { citizens, populationByTier } from '../sim/population';
import type { Tier } from '../sim/types';
import type { GameState } from './app';
import { setField } from './dom';
import type { SaveInfo, Slot } from './storage';
import type { Settings } from './settings';

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
  setVolume(volume: number): void;
  /** Wahr, sobald ein Laden Fortschritt verwerfen würde (dann verlangt Laden einen zweiten Klick). */
  hasProgress(): boolean;
  restart(): void;
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

/** Stumm-Schalter und Lautstärkeregler; Werte kommen aus und gehen an `actions`. */
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
  const vol = document.createElement('input');
  vol.type = 'range';
  vol.min = '0';
  vol.max = '1';
  vol.step = '0.05';
  vol.value = String(initial.volume);
  vol.setAttribute('aria-label', 'Lautstärke');
  vol.addEventListener('input', () => actions.setVolume(Number(vol.value)));
  // Nach dem Ziehen den Fokus abgeben, damit die Hotkeys wieder greifen
  vol.addEventListener('pointerup', () => vol.blur());
  box.append(mute, vol);
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
    const soundBox = header.querySelector('.hud-sound');
    if (soundBox) renderSoundControls(soundBox, actions);
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
  for (const good of GOOD_IDS) {
    setField(header, `stock-${good}`, `${GOODS[good].name} ${world.stock[good]}`);
  }
  setField(header, 'tick', `Tick: ${world.tick}`);
  setField(header, 'seed', `Karte: ${world.seed}`);
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}
