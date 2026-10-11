import type { MonumentGood, MonumentStageDef } from '../types';

// Spielwerte des Denkmals (M13-E2, Spec §4). Änderung nur per Ruling (P-5).

export const MONUMENT_GOODS: readonly MonumentGood[] = ['stone', 'tools', 'glass', 'spice'];

export const MONUMENT_STAGES: readonly MonumentStageDef[] = [
  { name: 'Sockel', money: 4000, goods: { stone: 200, tools: 80, glass: 60, spice: 40 } },
  { name: 'Terrassen', money: 6000, goods: { stone: 200, tools: 80, glass: 140, spice: 100 } },
  {
    name: 'Schaft und Feuerschale',
    money: 8000,
    goods: { stone: 200, tools: 80, glass: 160, spice: 100 },
  },
];

export const MONUMENT_PULL_TICKS = 10;
export const MONUMENT_RESERVE_MIN = 20;
export const MONUMENT_RESERVE_TICKS = 800;
export const MONUMENT_UNLOCK = 'wonMerchants' as const;
