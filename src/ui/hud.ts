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

/** Baut das HUD beim ersten Aufruf auf und aktualisiert danach nur die Werte. */
export function updateHud(header: HTMLElement, state: GameState): void {
  if (!header.querySelector('.hud-row')) {
    header.innerHTML =
      '<div class="hud-row"><span class="hud-money" data-field="money"></span>' +
      '<span class="hud-balance" data-field="balance"></span>' +
      '<span class="hud-tick" data-field="tick"></span><span class="hud-speed"></span></div>' +
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
        updateHud(header, state);
      });
      speedBox?.appendChild(btn);
    }
  }
  const { world } = state;
  setField(header, 'money', `Geld: ${world.money}`)?.classList.toggle('negative', world.money < 0);
  const { taxes, upkeep } = world.stats;
  const taxSign = taxes > 0 ? '+' : '';
  const upkeepSign = upkeep > 0 ? '−' : '';
  setField(
    header,
    'balance',
    `Steuern ${taxSign}${taxes} · Unterhalt ${upkeepSign}${upkeep} / ${UPKEEP_INTERVAL} Ticks`,
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
