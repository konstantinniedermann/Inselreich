// upkeepRank.ts — rein: Betriebe nach Unterhalt (I-062). Liest die Sim, schreibt nie; kein zweiter Rechenweg:
// Zeilenwerte sind `buildingUpkeep`, die Fusszeile ist `world.stats.upkeep`.
import { SHIP } from '../sim/defs/sea';
import { activeEdictDef } from '../sim/edicts';
import { buildingUpkeep, utilization } from '../sim/levels';
import type { BuildingDefId, World } from '../sim/types';

/** So viele Betriebe zeigt die Karte; der Rest steht als «und n weitere». */
export const UPKEEP_LIST_MAX = 20;

export interface UpkeepRow {
  id: number;
  island: number;
  defId: BuildingDefId;
  /** Wirksamer Unterhalt je 100 Ticks (Stillgelegte: halber Wert). */
  upkeep: number;
  /** Auslastung in Promille; `null` ohne Erzeugung. */
  util: number | null;
  paused: boolean;
}

/** Betriebe (ohne Häuser und Gebäude ohne Unterhalt) nach Unterhalt absteigend, dann Auslastung aufsteigend, dann ID. */
export function upkeepRanking(world: World): UpkeepRow[] {
  const rows: UpkeepRow[] = [];
  for (const b of Object.values(world.buildings)) {
    if (b.house) continue;
    const upkeep = buildingUpkeep(b);
    if (upkeep === 0) continue; // Kontor u. Ä.: kein Beitrag, nur Rauschen in der Liste
    rows.push({
      id: b.id,
      island: b.island,
      defId: b.defId,
      upkeep,
      util: utilization(b),
      paused: b.paused === true,
    });
  }
  const u = (r: UpkeepRow): number => r.util ?? Infinity;
  return rows.sort((a, b) => b.upkeep - a.upkeep || u(a) - u(b) || a.id - b.id);
}

export interface UpkeepSummary {
  /** Die ersten `UPKEEP_LIST_MAX` Zeilen. */
  shown: UpkeepRow[];
  /** Anzahl und Unterhalt der übrigen Betriebe. */
  more: number;
  moreUpkeep: number;
  /** Schiffe als eine Zeile; `null` ohne Schiffe. */
  ships: { count: number; upkeep: number } | null;
  /** Wirkung des Edikts Sparen (≤ 0): `stats.upkeep` − Zeilensumme; 0 ohne sparendes Edikt. */
  edict: number;
  /** Fusszeile: `world.stats.upkeep`. */
  total: number;
}

export function upkeepSummary(world: World): UpkeepSummary {
  const rows = upkeepRanking(world);
  const rest = rows.slice(UPKEEP_LIST_MAX);
  const count = world.ships.length;
  const ships = count > 0 ? { count, upkeep: count * SHIP.upkeep } : null;
  const sum = rows.reduce((n, r) => n + r.upkeep, 0) + (ships?.upkeep ?? 0);
  const saving = (activeEdictDef(world)?.upkeepPct ?? 100) < 100;
  return {
    shown: rows.slice(0, UPKEEP_LIST_MAX),
    more: rest.length,
    moreUpkeep: rest.reduce((n, r) => n + r.upkeep, 0),
    ships,
    edict: saving ? world.stats.upkeep - sum : 0,
    total: world.stats.upkeep,
  };
}
