import { BUILDING_DEFS } from '../sim/defs/buildings';
import { LEVELS } from '../sim/defs/levels';
import { levelChecks, levelChipDetail, levelChipText, type LevelCheckId } from '../sim/levelChecks';
import type { Building, World } from '../sim/types';

/**
 * Ausbau-Checkliste, Zustandschip und Tooltip für die Ausbau-Karte (Spec R9, Anhang 02 N3 und N5).
 * DOM-frei. Die Texte stammen unverändert aus `src/sim/levelChecks.ts`; die UI ergänzt nur ✓/✗.
 */

export interface ChecklistRow {
  id: LevelCheckId;
  ok: boolean;
  text: string;
}

export type ChecklistView =
  | { kind: 'max'; text: 'Höchste Stufe erreicht' }
  | {
      kind: 'list';
      title: string;
      rows: ChecklistRow[];
      canUpgrade: boolean;
      /** Text der ersten ✗-Zeile; null, wenn alle Zeilen ✓ sind. */
      tooltip: string | null;
    };

/** `null` für Betriebe ohne Ausbaustufen (Wohnhaus, Dienste). */
export function checklistView(world: World, b: Building): ChecklistView | null {
  const levels = LEVELS[b.defId];
  if (levels === undefined) return null;
  const level = b.level ?? 1;
  if (level >= 1 + levels.length) return { kind: 'max', text: 'Höchste Stufe erreicht' };
  const to = level + 1;
  const rows = levelChecks(world, b, to).map(({ id, ok, text }) => ({ id, ok, text }));
  return {
    kind: 'list',
    title: `Ausbau auf Stufe ${to} — ${BUILDING_DEFS[b.defId].name}`,
    rows,
    canUpgrade: rows.every((r) => r.ok),
    tooltip: rows.find((r) => !r.ok)?.text ?? null,
  };
}

/** Zustandschip «Läuft wie Stufe k: …» mit Tooltip aus den verletzten Dauerzeilen; `null` ohne Drosselung. */
export function chipView(world: World, b: Building): { text: string; tooltip: string } | null {
  const text = levelChipText(world, b);
  if (text === null) return null;
  return { text, tooltip: levelChipDetail(world, b).join('\n') };
}
