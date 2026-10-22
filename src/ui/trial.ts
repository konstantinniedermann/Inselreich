import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { TICK_MS } from '../sim/defs/timing';
import { TRIALS, TRIAL_DURATION_TICKS, TRIAL_FAIL_POP_PCT } from '../sim/defs/trials';
import { goodsBalance } from '../sim/flow';
import { trialPopulation, trialStartBlock } from '../sim/trial';
import type { GoodId, TrialState, World } from '../sim/types';
import type { MonumentChip } from './monumentView';
import { GOODS_BALANCE_TICKS, formatClock, perMinute, signedNum } from './time';

// Reine, DOM-freie Helfer der Meisterprüfung (I-132): Chip, Vorschau, Gründe, Chronik, Meldungen, Kartenmodell.
// Nur Lesen der Welt; Zahlen und Namen stammen aus den Defs.

/** Gleitkomma-Toleranz wie flow.ts, kein Spielwert. */
const DEFICIT_EPS = 1e-9;
const MS_PER_MINUTE = 60000;

const ID = 'selfSupply' as const;
const NAME = TRIALS[ID].name;
const DURATION = formatClock(TRIAL_DURATION_TICKS);

export const TRIAL_ABORT_MESSAGE = 'Meisterprüfung abgebrochen';
export const TRIAL_FIRE_HINT = 'Feuerwachen schützen Kapelle, Schule und Bad';

export function trialChip(world: World): MonumentChip | null {
  if (!world.monumentDone) return null;
  const t = world.trial;
  if (t.active !== null) {
    const name = TRIALS[t.active].name;
    return {
      chip: `${name} ${formatClock(t.ticks)} / ${DURATION}`,
      title: `Meisterprüfung ${name}: Einwohner nicht unter ${TRIAL_FAIL_POP_PCT} % von ${t.e0} — Klick für Details`,
      fillPct: Math.floor((t.ticks * 100) / TRIAL_DURATION_TICKS),
    };
  }
  if (t.passed.length > 0) {
    return {
      chip: 'Meisterprüfung ✓',
      title: `Meisterprüfung bestanden: ${TRIALS[t.passed[0]!.id].name}`,
      fillPct: 100,
    };
  }
  return {
    chip: 'Meisterprüfung',
    title: 'Meisterprüfung: freiwillige Auflage — Klick für Details',
    fillPct: 0,
  };
}

export interface DeficitLine {
  good: GoodId;
  perMin: number; // < 0, eine Nachkommastelle
}

/** Fehlmengen je Gut über alle Inseln (nominale Bilanz ohne Zukauf). */
export function selfSupplyPreview(world: World): DeficitLine[] {
  const balances = world.islands.map((_, i) => goodsBalance(world, i));
  const out: DeficitLine[] = [];
  for (const good of GOOD_IDS) {
    const sum = balances.reduce((a, b) => a + b[good].net, 0);
    if (sum >= -DEFICIT_EPS) continue;
    const perMin = perMinute(sum, GOODS_BALANCE_TICKS);
    if (perMin < 0) out.push({ good, perMin });
  }
  return out;
}

export function selfSupplyText(lines: readonly DeficitLine[]): string {
  if (lines.length === 0) return 'Deine Ketten decken den Bedarf';
  return lines.map((l) => `${GOODS[l.good].name} ${signedNum(l.perMin)} / min`).join(', ');
}

export function trialStartReason(world: World): string | null {
  return trialStartBlock(world, ID);
}

export function trialChronicleLine(world: World): string | null {
  if (!world.monumentDone) return null;
  const t = world.trial;
  if (t.active !== null) {
    return `Meisterprüfung: ${TRIALS[t.active].name} läuft (${formatClock(t.ticks)} / ${DURATION})`;
  }
  const p = t.passed[0];
  if (p !== undefined) {
    return `Meisterprüfung: ${TRIALS[p.id].name} bestanden (bei Spielzeit ${formatClock(p.tick)})`;
  }
  return 'Meisterprüfung: offen';
}

/** Meldung beim Ende einer laufenden Auflage; Start und Abbruch meldet der Klick-Handler. */
export function trialTransition(prev: TrialState | null, next: TrialState): string | null {
  if (prev === null || prev.active === null || next.active !== null) return null;
  const name = TRIALS[prev.active].name;
  return next.passed.length > prev.passed.length
    ? `Meisterprüfung bestanden: ${name}`
    : `Meisterprüfung ${name} nicht bestanden: Einwohner unter ${TRIAL_FAIL_POP_PCT} %`;
}

export function trialStartMessage(): string {
  return `Meisterprüfung begonnen: ${NAME} — ${DURATION} ohne Zukauf`;
}

export type TrialAction =
  { kind: 'start'; reason: string | null } | { kind: 'abort' } | { kind: 'none' };

export interface TrialCardView {
  name: string;
  rule: string;
  condition: string;
  preview: string;
  fireHint: string;
  status: string | null;
  action: TrialAction;
}

export function trialCardView(world: World, preview: readonly DeficitLine[]): TrialCardView {
  const t = world.trial;
  let status: string | null = null;
  let action: TrialAction;
  if (t.active !== null) {
    status = `Läuft: ${formatClock(t.ticks)} / ${DURATION} · Einwohner ${trialPopulation(world)} von ${t.e0}`;
    action = { kind: 'abort' };
  } else if (t.passed.length > 0) {
    status = `Bestanden (bei Spielzeit ${formatClock(t.passed[0]!.tick)})`;
    action = { kind: 'none' };
  } else {
    action = { kind: 'start', reason: trialStartReason(world) };
  }
  return {
    name: NAME,
    rule: TRIALS[ID].rule,
    condition: `${(TRIAL_DURATION_TICKS * TICK_MS) / MS_PER_MINUTE} Minuten, Einwohner nicht unter ${TRIAL_FAIL_POP_PCT} % des Starts`,
    preview: selfSupplyText(preview),
    fireHint: TRIAL_FIRE_HINT,
    status,
    action,
  };
}
