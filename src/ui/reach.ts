import { TICK_MS } from '../sim/defs/timing';
import { GOODS_BALANCE_TICKS } from './time';

/** Reichweite eines Guts: wann das Lager leer bzw. voll ist, bei gleichbleibender Bilanz; DOM-frei. */

/** Schwelle, unter der eine Bilanz als „ausgeglichen" gilt (gegen Gleitkomma-Rauschen). */
export const TREND_EPS = 0.05;

/** Sekunden Spielzeit bei 1× in Ticks (Darstellungsschwellen, keine Spielwerte). */
export function secToTicks(s: number): number {
  return Math.round((s * 1000) / TICK_MS);
}

const WARN_EMPTY = secToTicks(180);
const ALARM_EMPTY = secToTicks(60);
const WARN_FULL = secToTicks(60);

export interface ReachView {
  kind: 'empty' | 'full' | null;
  ticks: number;
  level: 'ok' | 'warn' | 'alarm';
}

/** `net` ist die Bilanz je 100 Ticks (`goodsBalance`). Voll erreicht nie die Stufe `alarm`. */
export function reachView(stock: number, net: number, cap: number): ReachView {
  if (net <= -TREND_EPS) {
    const ticks = (stock * GOODS_BALANCE_TICKS) / -net;
    const level =
      stock <= 0 || ticks <= ALARM_EMPTY ? 'alarm' : ticks <= WARN_EMPTY ? 'warn' : 'ok';
    return { kind: 'empty', ticks, level };
  }
  if (net >= TREND_EPS && stock < cap) {
    const ticks = ((cap - stock) * GOODS_BALANCE_TICKS) / net;
    return { kind: 'full', ticks, level: ticks <= WARN_FULL ? 'warn' : 'ok' };
  }
  return { kind: null, ticks: 0, level: 'ok' };
}
