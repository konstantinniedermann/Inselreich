// Spielwerte des Ratsbeschlusses (I-112, Spec §3.1). Änderung nur per Ruling (R-2);
// der Balancing-Test muss grün bleiben.
import type { CouncilDef, CouncilTier } from '../types';

export const COUNCIL_TIERS = [2, 3, 4] as const;

/** Stufen 2 und 3 haben A und B, Stufe 4 zusätzlich C (Seerecht, I-153). */
export type CouncilSides = Readonly<Record<'A' | 'B', CouncilDef>> & { readonly C?: CouncilDef };

export const COUNCIL: Readonly<Record<CouncilTier, CouncilSides>> = {
  2: {
    A: {
      name: 'Webordnung',
      text: 'Webereien +25 % schneller. Spart ab 50 Einwohnern Webereien.',
      lever: { kind: 'cycle', defId: 'weaver', value: 40 },
    },
    B: {
      name: 'Glockenrecht',
      text: 'Kapellen reichen 3 Felder weiter. Spart Kapellen in weiten Städten.',
      lever: { kind: 'serviceRadius', defId: 'chapel', value: 13 },
    },
  },
  3: {
    A: {
      name: 'Brennrecht',
      text: 'Brennereien +25 % schneller.',
      lever: { kind: 'cycle', defId: 'distillery', value: 40 },
    },
    B: {
      name: 'Wohnordnung',
      text: 'Bürgerhäuser fassen 16 statt 15 Bürger.',
      lever: { kind: 'maxInhabitants', tier: 3, value: 16 },
    },
  },
  4: {
    A: {
      name: 'Glasrecht',
      text: 'Glashütten +67 % schneller.',
      lever: { kind: 'cycle', defId: 'glassworks', value: 30 },
    },
    B: {
      name: 'Hofrecht',
      text: 'Kaufmannshäuser fassen 22 statt 20 Kaufleute.',
      lever: { kind: 'maxInhabitants', tier: 4, value: 22 },
    },
    C: {
      name: 'Seerecht',
      text: 'Schiffe fahren 25 % schneller. Spart ab etwa 80 Kaufleuten ein Schiff auf langen Gewürzrouten.',
      lever: { kind: 'seaTileTicks', value: 8 },
    },
  },
};

export const COUNCIL_NOTE =
  'Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen.';
export const COUNCIL_OPEN_MESSAGE = 'Der Rat tagt: ein Beschluss steht an';
