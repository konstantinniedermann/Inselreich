// Spielwerte der Meisterstücke (I-186, Spec §2.2). Änderung nur per Ruling (R-EB-1);
// die Schwellen hängen an den Pins 6750 und 11 500 in tests/sim/balance-merchants.test.ts.
import type { TrialId } from '../types';
import { TRIALS, TRIAL_IDS } from './trials';

export type HonorId =
  | 'citizenTown'
  | 'swiftFound'
  | 'swiftTrade'
  | 'stormTrade'
  | 'spiceTown'
  | 'realm'
  | 'monument'
  | 'stormTrial'
  | `trial:${TrialId}`;

export interface HonorDef {
  name: string;
  condition: string;
}

/** Tempo-Schwellen in Ticks nach dem step (Spielzeit 15:00 und 30:00). */
export const HONOR_SWIFT_CITIZEN_TICK = 9000;
export const HONOR_SWIFT_MERCHANT_TICK = 18000;

const FIXED_IDS = [
  'citizenTown',
  'swiftFound',
  'swiftTrade',
  'stormTrade',
  'spiceTown',
  'realm',
  'monument',
  'stormTrial',
] as const;

export const HONOR_IDS: readonly HonorId[] = [
  ...FIXED_IDS,
  ...TRIAL_IDS.map((id): HonorId => `trial:${id}`),
];

const FIXED_HONORS: Readonly<Record<(typeof FIXED_IDS)[number], HonorDef>> = {
  citizenTown: { name: 'Bürgerstadt', condition: 'Erstes Ziel erreichen' },
  swiftFound: { name: 'Flinke Gründung', condition: 'Erstes Ziel bis Spielzeit 15:00' },
  swiftTrade: { name: 'Kaufmannseile', condition: 'Handelsstadt bis Spielzeit 30:00' },
  stormTrade: { name: 'Sturmfest', condition: 'Handelsstadt mit Krisen «normal»' },
  spiceTown: { name: 'Gewürzstadt', condition: 'Drittes Ziel erreichen' },
  realm: { name: 'Inselreich', condition: 'Auf jeder Fremdinsel ein Kontor' },
  monument: { name: 'Denkmal', condition: 'Das Denkmal vollenden' },
  stormTrial: {
    name: 'Meister im Sturm',
    condition: 'Eine Meisterprüfung mit Krisen «normal» bestehen',
  },
};

function trialHonors(): Record<`trial:${TrialId}`, HonorDef> {
  const out = {} as Record<`trial:${TrialId}`, HonorDef>;
  for (const id of TRIAL_IDS) {
    out[`trial:${id}`] = {
      name: `Meisterprüfung «${TRIALS[id].name}»`,
      condition: `Die Auflage «${TRIALS[id].name}» bestehen`,
    };
  }
  return out;
}

export const HONORS: Readonly<Record<HonorId, HonorDef>> = { ...FIXED_HONORS, ...trialHonors() };
