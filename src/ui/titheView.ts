// titheView.ts — rein, DOM-frei: Texte und Zahlen zum Zehnt (I-223). Alles aus Defs und Sim-Abfragen.
import { GOODS } from '../sim/defs/goods';
import {
  TITHE_CARRY_DIVISOR,
  TITHE_GOODS,
  TITHE_GOOD,
  TITHE_UNITS_PER_100,
} from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/defs/timing';
import { moneyTaxes, titheSplit } from '../sim/population';
import type { StepReport } from '../sim/tick';
import { townhallActive, townhallReason } from '../sim/townhall';
import type { TitheGood, TitheTier, World } from '../sim/types';
import { cashReach } from './cashReach';
import { formatGameTime, perMinute, signedNum } from './time';

export const TITHE_TEXT: Record<TitheTier, string> = {
  1: 'Zehnt der Pioniere: Ihre ganze Steuer kommt als Werkzeug ins Lager, nicht als Geld.',
  2: 'Zehnt der Siedler: Ein Zehntel ihrer Steuer kommt als Stein ins Lager.',
};
export const TITHE_LOCK_NOTE = 'Nach dem Umschalten bleibt der Zehnt 3 Minuten, wie er ist.';
export const TITHE_OVERFLOW_NOTE = 'Ist das Lager voll, verfällt der Rest.';

export const titheTooltip = (tier: TitheTier): string =>
  `${TITHE_TEXT[tier]} ${TITHE_OVERFLOW_NOTE}`;

export function titheLockText(w: World, tier: TitheTier): string {
  return w.tick < w.titheLockedUntil[tier]
    ? `wieder änderbar in ${formatGameTime(w.titheLockedUntil[tier] - w.tick)}`
    : '';
}

const decimal = (n: number): string => String(n).replace('.', ',');

export function titheFlowText(w: World, tier: TitheTier): string {
  if (!w.titheOn[tier]) return '';
  if (!townhallActive(w)) return `Zehnt ruht: ${townhallReason(w)}`;
  const split = titheSplit(w);
  const g = TITHE_GOOD[tier];
  const geld = Math.floor((split.money[tier] * 3) / 100);
  const ware =
    Math.floor(((split.tithe[g] * 600 * TITHE_UNITS_PER_100[g]) / TITHE_CARRY_DIVISOR) * 10) / 10;
  return `${geld} / min · ${decimal(ware)} ${GOODS[g].name} / min`;
}

export function titheConfirmLines(w: World, tier: TitheTier): string[] {
  const taxes = moneyTaxes({ ...w, titheOn: { ...w.titheOn, [tier]: true } });
  const reach = cashReach(w.money, taxes, w.stats.upkeep);
  const lines = [TITHE_TEXT[tier], TITHE_LOCK_NOTE];
  if (reach !== null) {
    lines.push(`Nach dem Umschalten: ${reach.text}`);
    lines.push('Im Minus kannst du nicht bauen und nicht zukaufen.');
  } else {
    const rate = signedNum(perMinute(taxes - w.stats.upkeep, UPKEEP_INTERVAL));
    lines.push(`Nach dem Umschalten: Kasse bleibt im Plus (${rate} / min).`);
  }
  if (w.trial.active !== null)
    lines.push('Auflage läuft: kein Zukauf. Mit leerer Kasse kannst du auch nicht bauen.');
  return lines;
}

export interface TitheLossState {
  sum: Record<TitheGood, number>;
}

export const newTitheLossState = (): TitheLossState => ({
  sum: Object.fromEntries(TITHE_GOODS.map((g) => [g, 0])) as Record<TitheGood, number>,
});

export function collectTitheLoss(
  s: TitheLossState,
  r: Pick<StepReport, 'titheLost'>,
  tick: number,
): string[] {
  for (const g of TITHE_GOODS) s.sum[g] += r.titheLost[g] ?? 0;
  if (tick % UPKEEP_INTERVAL !== 0) return [];
  const out: string[] = [];
  for (const g of TITHE_GOODS) {
    if (s.sum[g] > 0) out.push(`Lager voll: ${s.sum[g]} ${GOODS[g].name} verfallen`);
    s.sum[g] = 0;
  }
  return out;
}
