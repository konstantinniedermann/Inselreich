import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { UPKEEP_INTERVAL, totalUpkeep } from '../sim/economy';
import type { GameState } from './app';

const SPEEDS: { value: GameState['speed']; label: string }[] = [
  { value: 0, label: '⏸' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

/** Baut das HUD beim ersten Aufruf auf und aktualisiert danach nur die Werte. */
export function updateHud(header: HTMLElement, state: GameState): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-money"></span><span class="hud-upkeep"></span>' +
      '<span class="hud-tick"></span><span class="hud-speed"></span></div>' +
      '<div class="stock-row"></div><div class="hud-seed"></div>';
    const stockRow = header.querySelector('.stock-row');
    for (const good of GOOD_IDS) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.good = good;
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
        updateHud(header, state);
      });
      speedBox?.appendChild(btn);
    }
  }
  const set = (sel: string, text: string): void => {
    const el = header.querySelector(sel);
    if (el && el.textContent !== text) el.textContent = text;
  };
  const { world } = state;
  set('.hud-money', `Geld: ${world.money}`);
  header.querySelector('.hud-money')?.classList.toggle('negative', world.money < 0);
  const upkeep = totalUpkeep(world);
  set('.hud-upkeep', `Unterhalt ${upkeep > 0 ? '−' : ''}${upkeep} / ${UPKEEP_INTERVAL} Ticks`);
  for (const good of GOOD_IDS)
    set(`.chip[data-good="${good}"]`, `${GOODS[good].name} ${world.stock[good]}`);
  set('.hud-tick', `Tick: ${world.tick}`);
  set('.hud-seed', `Karte: ${world.seed}`);
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}
