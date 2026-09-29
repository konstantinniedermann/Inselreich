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
      '<div class="hud-row"><span class="hud-money"></span><span class="hud-tick"></span>' +
      '<span class="hud-speed"></span></div><div class="hud-seed"></div>';
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
  set('.hud-money', `Geld: ${state.world.money}`);
  set('.hud-tick', `Tick: ${state.world.tick}`);
  set('.hud-seed', `Karte: ${state.world.seed}`);
  for (const btn of header.querySelectorAll<HTMLButtonElement>('.hud-speed .btn')) {
    btn.classList.toggle('active', btn.dataset.speed === String(state.speed));
  }
}
