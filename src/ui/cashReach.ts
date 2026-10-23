import { TICK_MS, UPKEEP_INTERVAL } from '../sim/defs/timing';
import { TREND_EPS, reachView, secToTicks } from './reach';
import { formatGameTime, perMinute, signedNum } from './time';

/** Kassen-Reichweite für den Geld-Chip (I-168): wann das Geld bei gleichbleibender Bilanz ausgeht; DOM-frei. */

export interface CashReach {
  /** Satz für Tooltip und `aria-label`. */
  text: string;
  level: 'ok' | 'warn' | 'alarm';
}

const NOTE = '(ohne Handel und Aufträge)';
/** Rundung der Anzeige in Sekunden Spielzeit. */
const ROUND_S = 10;

/** `taxes` und `upkeep` sind die Werte aus `world.stats` (je `UPKEEP_INTERVAL` Ticks). */
export function cashReach(money: number, taxes: number, upkeep: number): CashReach | null {
  const net = taxes - upkeep;
  if (net > -TREND_EPS) return null;
  const rate = signedNum(perMinute(net, UPKEEP_INTERVAL));
  const view = reachView(money, net, Infinity);
  if (money <= 0) return { text: `Kasse ist leer bei ${rate} / min ${NOTE}`, level: view.level };
  const exact = (view.ticks * TICK_MS) / 1000;
  const sec = Math.max(ROUND_S, Math.round(exact / ROUND_S) * ROUND_S);
  return {
    text: `Kasse leer in ≈ ${formatGameTime(secToTicks(sec))} bei ${rate} / min ${NOTE}`,
    level: view.level,
  };
}
