import type { Building, Monument, World } from '../sim/types';
import { project, type Pt } from './isoBase';
import { BOWL_Z1, type MonumentImageStage } from './monumentSprite';

// monumentStage.ts — Bildstufe des Denkmals aus dem ganzzahligen Sim-Zustand (M13-E2 T09, Anhang 06 A).
// Reine Abfrage: liest `world.monument`, schreibt nie in die Welt. Keine Anteils-Schwellen.

/** (stage, running) → Bildstufe 0…4: Baugrund, Sockel, Terrassen, Schaft, Fertig. */
export function monumentImageStage(m: Pick<Monument, 'stage' | 'running'>): MonumentImageStage {
  if (m.stage <= 0) return m.running ? 1 : 0;
  if (m.stage === 1) return 2;
  if (m.stage === 2) return 3;
  return 4;
}

/** Bildstufe eines Gebäudes: 0 für alles ausser dem Denkmal; Denkmal aus `world.monument` (null → 0). */
export function imageStageOf(world: World, b: Building): MonumentImageStage {
  if (b.defId !== 'monument' || !world.monument) return 0;
  return monumentImageStage(world.monument);
}

/** Bildpunkt (Weltpixel) der Schalenmitte des Denkmals: Anker für das Aufflammen. */
export function monumentBowlPoint(b: Pick<Building, 'x' | 'y'>): Pt {
  const q = project(b.x + 1.5, b.y + 1.5);
  return { x: q.x, y: q.y - BOWL_Z1 };
}
