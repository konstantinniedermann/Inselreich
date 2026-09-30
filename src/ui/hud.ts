import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { citizens, populationByTier } from '../sim/population';
import type { Tier } from '../sim/types';
import type { GameState } from './app';
import { setField } from './dom';

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

/** Zeitfenster, in dem ein zweiter Klick auf „Neu" den Neustart bestätigt (Millisekunden). */
const NEW_CONFIRM_MS = 3000;

/** Spielstand-Aktionen, die `app.ts` bereitstellt (das HUD kennt keinen Speicher). */
export interface HudActions {
  save(): void;
  load(): void;
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

/** Stoppt den Bestätigungs-Timer von „Neu"; beim Beenden des Spiels aufrufen. */
export function disposeHud(header: HTMLElement): void {
  cleanups.get(header)?.();
  cleanups.delete(header);
}

/** Speichern, Laden und Neu; „Neu" verlangt einen zweiten Klick innert NEW_CONFIRM_MS. */
function renderGameButtons(box: Element, actions: HudActions): () => void {
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;
  const newBtn = gameButton('Neu', (btn) => {
    if (confirmTimer === null) {
      btn.textContent = 'Wirklich neu?';
      confirmTimer = setTimeout(() => {
        confirmTimer = null;
        btn.textContent = 'Neu';
      }, NEW_CONFIRM_MS);
      return;
    }
    clearTimeout(confirmTimer);
    confirmTimer = null;
    btn.textContent = 'Neu';
    actions.restart();
  });
  box.append(
    gameButton('Speichern', () => actions.save()),
    gameButton('Laden', () => actions.load()),
    newBtn,
  );
  return () => {
    if (confirmTimer !== null) clearTimeout(confirmTimer);
    confirmTimer = null;
  };
}

/** Baut das HUD beim ersten Aufruf auf und aktualisiert danach nur die Werte. */
export function updateHud(header: HTMLElement, state: GameState, actions: HudActions): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-money" data-field="money"></span>' +
      '<span class="hud-balance"><span data-field="balance"></span> ' +
      '<span data-field="net"></span></span>' +
      '<span class="hud-tick" data-field="tick"></span><span class="hud-speed"></span>' +
      '<span class="hud-game"></span></div>' +
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
        state.speed = s.value;
        updateHud(header, state, actions);
      });
      speedBox?.appendChild(btn);
    }
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
