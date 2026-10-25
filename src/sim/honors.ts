// Meisterstücke (I-186): reine Prüfung, welche Stücke ein Schritt neu freischaltet.
// Ohne Uhr, ohne Zufall, wirft nie. Schwellen nur aus defs/honors.ts.
import {
  HONOR_IDS,
  HONOR_SWIFT_CITIZEN_TICK,
  HONOR_SWIFT_MERCHANT_TICK,
  type HonorId,
} from './defs/honors';
import { TRIAL_IDS } from './defs/trials';
import type { TrialId, World } from './types';

export interface HonorRun {
  seed: number;
  unlockMode: 'stepwise' | 'all';
}

export interface HonorMarks {
  won: boolean;
  wonMerchants: boolean;
  wonSpice: boolean;
  monumentDone: boolean;
  kontors: number;
  passed: Readonly<Partial<Record<TrialId, number>>>;
}

export function honorMarks(world: World): HonorMarks {
  const passed: Partial<Record<TrialId, number>> = {};
  for (const p of world.trial.passed) passed[p.id] = (passed[p.id] ?? 0) + 1;
  return {
    won: world.won,
    wonMerchants: world.wonMerchants,
    wonSpice: world.wonSpice,
    monumentDone: world.monumentDone,
    kontors: world.islands.filter((i) => i.kontorId !== null).length,
    passed,
  };
}

function sum(passed: HonorMarks['passed']): number {
  return TRIAL_IDS.reduce((n, id) => n + (passed[id] ?? 0), 0);
}

function isNewHonor(
  id: HonorId,
  prev: HonorMarks,
  now: HonorMarks,
  world: World,
  swift: boolean,
): boolean {
  const storm = world.crisisLevel === 'normal';
  const wonNow = now.won && !prev.won;
  const merchantsNow = now.wonMerchants && !prev.wonMerchants;
  switch (id) {
    case 'citizenTown':
      return wonNow;
    case 'swiftFound':
      return swift && wonNow && world.tick <= HONOR_SWIFT_CITIZEN_TICK;
    case 'swiftTrade':
      return swift && merchantsNow && world.tick <= HONOR_SWIFT_MERCHANT_TICK;
    case 'stormTrade':
      return storm && merchantsNow;
    case 'spiceTown':
      return now.wonSpice && !prev.wonSpice;
    case 'realm':
      return prev.kontors < world.islands.length && now.kontors === world.islands.length;
    case 'monument':
      return now.monumentDone && !prev.monumentDone;
    case 'stormTrial':
      return storm && sum(now.passed) > sum(prev.passed);
    default: {
      const trial = id.slice('trial:'.length) as TrialId;
      return (now.passed[trial] ?? 0) > (prev.passed[trial] ?? 0);
    }
  }
}

/** Neu erreichte Stücke seit `prev`, in `HONOR_IDS`-Reihenfolge. `world.tick` ist der Tick nach dem step. */
export function newHonors(prev: HonorMarks, world: World, run: HonorRun | null): HonorId[] {
  const now = honorMarks(world);
  const swift = run !== null && run.seed === world.seed && run.unlockMode === 'stepwise';
  return HONOR_IDS.filter((id) => isNewHonor(id, prev, now, world, swift));
}
