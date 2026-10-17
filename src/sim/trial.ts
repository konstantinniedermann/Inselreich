// Leser der Meisterprüfung (I-132): Sperrgründe, ohne die Welt zu ändern.
import { TIERS } from './defs/tiers';
import {
  TRIALS,
  TRIAL_DURATION_TICKS,
  TRIAL_FAIL_POP_PCT,
  TRIAL_MAX_MERCHANTS,
  TRIAL_MIN_MERCHANTS,
} from './defs/trials';
import { merchants, populationByTier } from './population';
import type { Result, TrialId, World } from './types';
import { fail, ok } from './types';

export const TRIAL_REASONS = {
  unknown: 'Unbekannte Auflage',
  noGoal: 'Erst nach dem Wahlziel (Denkmal)',
  running: 'Eine Auflage läuft schon',
  passed: 'Bereits bestanden',
  debt: 'Kasse im Minus',
  notActive: 'Keine Auflage aktiv',
  few: (n: number) => `Erst ab ${TRIAL_MIN_MERCHANTS} ${TIERS[4].name}n (jetzt ${n})`,
  many: (n: number) => `Höchstens ${TRIAL_MAX_MERCHANTS} ${TIERS[4].name} (jetzt ${n})`,
} as const;

/** Einwohner aller Häuser, alle Inseln. */
export function trialPopulation(world: World): number {
  return Object.values(populationByTier(world)).reduce((a, b) => a + b, 0);
}

/** Grund, warum die Auflage `id` jetzt nicht startet, sonst `null`. Ändert die Welt nie. */
export function trialStartBlock(world: World, id: unknown): string | null {
  if (typeof id !== 'string' || !Object.hasOwn(TRIALS, id)) return TRIAL_REASONS.unknown;
  if (!world.monumentDone) return TRIAL_REASONS.noGoal;
  if (world.trial.active !== null) return TRIAL_REASONS.running;
  if (world.trial.passed.some((p) => p.id === (id as TrialId))) return TRIAL_REASONS.passed;
  if (world.money < 0) return TRIAL_REASONS.debt;
  const n = merchants(world);
  if (n < TRIAL_MIN_MERCHANTS) return TRIAL_REASONS.few(n);
  if (n > TRIAL_MAX_MERCHANTS) return TRIAL_REASONS.many(n);
  return null;
}

/** Sperrgrund für Zukauf während einer aktiven Auflage, sonst `null`. */
export function trialBuyBlock(world: World): string | null {
  const { active } = world.trial;
  return active === null ? null : `Auflage ${TRIALS[active].name}: kein Zukauf`;
}

/** Startet die Auflage `id`, wenn `trialStartBlock` nichts sperrt; sonst `{ ok: false, reason }` ohne Weltänderung. */
export function startTrial(world: World, id: unknown): Result {
  const why = trialStartBlock(world, id);
  if (why !== null) return fail(why);
  world.trial.active = id as TrialId;
  world.trial.ticks = 0;
  world.trial.e0 = trialPopulation(world);
  return ok;
}

/** Bricht die laufende Auflage ab: kein Eintrag, `e0` bleibt stehen. */
export function abortTrial(world: World): Result {
  if (world.trial.active === null) return fail(TRIAL_REASONS.notActive);
  world.trial.active = null;
  world.trial.ticks = 0;
  return ok;
}

/** Ein Schritt der Auflage: nicht bestanden unter der Schwelle, sonst zählen und bei Ablauf als bestanden eintragen. */
export function tickTrial(world: World): void {
  const t = world.trial;
  if (t.active === null) return;
  if (trialPopulation(world) * 100 < t.e0 * TRIAL_FAIL_POP_PCT) {
    t.active = null;
    t.ticks = 0;
    return;
  }
  t.ticks += 1;
  if (t.ticks === TRIAL_DURATION_TICKS) {
    t.passed.push({ id: t.active, tick: world.tick });
    t.active = null;
    t.ticks = 0;
  }
}
