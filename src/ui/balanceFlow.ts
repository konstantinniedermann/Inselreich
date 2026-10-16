import { UPKEEP_INTERVAL } from '../sim/economy';
import { perMinute, signedNum } from './time';

/** Ab diesem Minutenwert zeigt der Chip die Kurzform «12,3k» (UI-Konstante, keine Spielregel). */
export const SHORT_FROM = 10000;

type Flow = { taxes: number; upkeep: number };

const MINUS = '−';

/** Minutenwert, nie NaN, nie negativ, nie -0. */
const pm = (x: number): number => {
  const v = perMinute(x, UPKEEP_INTERVAL);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

/** Ein Teil des Chips: ganze Zahl, ab SHORT_FROM abgeschnitten (nie aufgerundet) mit Dezimalkomma und «k». */
function part(x: number): string {
  const v = pm(x);
  if (v >= SHORT_FROM) return `${(Math.floor(v / 100) / 10).toFixed(1).replace('.', ',')}k`;
  return String(Math.floor(v));
}

/** Chip-Text «+Einnahmen / −Unterhalt»; hängt nur von den Stats ab, nicht von Tempo oder Pause. */
export function flowText(stats: Flow): string {
  return `+${part(stats.taxes)} / ${MINUS}${part(stats.upkeep)}`;
}

/** Tooltip-Kopf und aria-label: Netto, Steuern, Unterhalt mit vollen Zahlen. */
export function flowLabel(stats: Flow): string {
  const net = signedNum(pm(stats.taxes) - pm(stats.upkeep));
  return `Bilanz ${net} / min · Steuern +${pm(stats.taxes)} / min · Unterhalt ${MINUS}${pm(stats.upkeep)} / min`;
}

/** Tooltip: Bilanz-Zeile, darunter Steuern und Unterhalt. */
export function flowTitle(stats: Flow): string {
  const net = signedNum(pm(stats.taxes) - pm(stats.upkeep));
  return `Bilanz ${net} / min\nSteuern +${pm(stats.taxes)} / min · Unterhalt ${MINUS}${pm(stats.upkeep)} / min`;
}
