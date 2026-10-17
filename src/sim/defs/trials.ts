// Spielwerte der Auflagen (I-132, Spec §3.1). Änderung nur per Ruling;
// der Balancing-Test muss grün bleiben.
import type { TrialDef, TrialId } from '../types';
import { WIN_MERCHANTS } from './tiers';

export const TRIAL_IDS: readonly TrialId[] = ['selfSupply'];

export const TRIALS: Readonly<Record<TrialId, TrialDef>> = {
  selfSupply: {
    name: 'Eigenversorgung',
    short: 'Kein Zukauf am Kontor',
    rule: 'Kein Zukauf an den Kontoren und für das Denkmal. Verkauf, Aufträge, Stammkunde, Fernangebot, Schiffe und Bauen bleiben frei.',
  },
};

export const TRIAL_DURATION_TICKS = 9000;
export const TRIAL_MIN_MERCHANTS = WIN_MERCHANTS;
export const TRIAL_MAX_MERCHANTS = 150;
export const TRIAL_FAIL_POP_PCT = 70;
