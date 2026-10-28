import { maxInhabitantsOf } from '../sim/council';
import { BUILDING_DEFS, PAUSED_UPKEEP_PCT } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { LEVELS } from '../sim/defs/levels';
import { TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { buildingUpkeep, cycleOf, effectiveCycle, utilization } from '../sim/levels';
import { isSupplied } from '../sim/population';
import { missingInputs, reservedInputs } from '../sim/queries';
import type { Building, BuildingDefId, Tier, World } from '../sim/types';
import { balanceAfterUpgrade, balanceLine } from './balancePreview';
import { checklistView, type ChecklistRow } from './levelChecklist';
import { goodList, stateInfo } from './texts';
import { formatGameTime, perMinute, signedNum } from './time';

/** Reine Ansichts-Helfer des Info-Panels (Spec PANEL-UEBERSICHT §4): DOM-frei, ohne Seiteneffekt. */

export type Tone = 'ok' | 'warn' | 'bad';
export const TONE_SYMBOL: Record<Tone, string> = { ok: '✓', warn: '!', bad: '✗' };
export const UPGRADE_KEY_LABEL = 'Umschalt+U';

export interface Chip {
  text: string;
  tone: Tone;
  label: string;
}
export interface Pips {
  level: number;
  max: number;
  label: string;
}
export type StatKey = 'output' | 'utilization' | 'input' | 'upkeep' | 'inhabitants';
export interface StatTile {
  key: StatKey;
  label: string;
  value: string;
  sub: string | null;
}
export interface GainRow {
  key: 'output' | 'upkeep' | 'inhabitants';
  label: string;
  before: number;
  after: number;
  delta: string;
  text: string;
}
export type UpgradeCard =
  | {
      kind: 'next';
      title: string;
      gains: GainRow[];
      /** Checkliste aus der Sim-Textquelle (`levelChecks`); ✓/✗ je Zeile. */
      rows: ChecklistRow[];
      ok: boolean;
      /** Text der ersten ✗-Zeile für den Knopf-Tooltip; null, wenn alles ✓. */
      tooltip: string | null;
      key: string;
      /** «Bilanz danach: a → b / min» (Unterhalt der nächsten Stufe, Edikt inklusive). */
      balance: string;
    }
  | { kind: 'max'; title: 'Höchste Stufe erreicht' };

const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Ton des Zustands; gleiche Prüfreihenfolge wie `stateInfo` (Anhang 01 A.1). */
export function stateTone(b: Building): Tone {
  if (b.outageUntil !== undefined) return 'bad';
  if (b.paused === true) return 'warn';
  if (!b.connected) return 'bad';
  if (BUILDING_DEFS[b.defId].produces === undefined) return 'ok';
  const state = b.state;
  switch (state) {
    case 'ok':
    case 'notConnected':
      return 'ok';
    case 'waitingInput':
    case 'waitingReserve':
    case 'storageFull':
    case 'paused':
      return 'warn';
    case 'burning':
    case 'noForest':
    case 'noService':
      return 'bad';
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}

export function stateChip(world: World, b: Building): Chip {
  const text = stateInfo(b, world.tick, missingInputs(world, b), reservedInputs(world, b)).text;
  return { text, tone: stateTone(b), label: `Zustand: ${text}` };
}

/** Versorgungs-Chip des Wohnhauses (Radius von Kontor/angebundenem Markt, REL-14); sonst `null`. */
export function supplyChip(world: World, b: Building): Chip | null {
  if (!b.house) return null;
  return isSupplied(world, b)
    ? {
        text: 'Im Versorgungsradius',
        tone: 'ok',
        label: 'Kontor oder Marktplatz in Reichweite: Waren kommen an',
      }
    : {
        text: 'Ausserhalb der Versorgung',
        tone: 'bad',
        label: 'Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren',
      };
}

export function levelPips(b: Building): Pips | null {
  const levels = LEVELS[b.defId];
  if (levels === undefined) return null;
  const level = b.level ?? 1;
  const max = levels.length + 1;
  return { level, max, label: `Stufe ${level} von ${max}` };
}

export function tierPips(b: Building): Pips | null {
  if (!b.house) return null;
  const level = b.house.tier;
  const max = Object.keys(TIERS).length;
  return { level, max, label: `${TIERS[level].name}, Stufe ${level} von ${max}` };
}

/** Beschriftung und Unterzeile je Kachel; einzige Quelle der Etiketten (`statTiles`, `houseTiles`, Gerüst in `inspect`). */
export const TILE_LAYOUT: Record<StatKey, { label: string; sub: boolean }> = {
  output: { label: 'Ausstoss', sub: true },
  utilization: { label: 'Auslastung', sub: false },
  input: { label: 'Verbrauch', sub: true },
  upkeep: { label: 'Unterhalt', sub: true },
  inhabitants: { label: 'Einwohner', sub: false },
};

/** Struktur der Kennzahl-Kacheln je Typ, unabhängig von Stufe, Zustand und Brand (G-3). */
export function statKeys(defId: BuildingDefId): StatKey[] {
  const def = BUILDING_DEFS[defId];
  if (defId === 'house') return [];
  const keys: StatKey[] = [];
  const cycle = def.cycle !== undefined;
  if (def.produces && cycle) keys.push('output');
  if (def.produces) keys.push('utilization');
  if (def.consumes && cycle) keys.push('input');
  keys.push('upkeep');
  return keys;
}

export function statTiles(world: World, b: Building): StatTile[] {
  const def = BUILDING_DEFS[b.defId];
  if (b.house) return [];
  const cycle = cycleOf(world, b);
  const tiles: StatTile[] = [];
  const stopped = b.paused === true;
  const perMin = cycle === undefined ? '' : `${perMinute(1, cycle)} / min`;
  if (def.produces && cycle !== undefined) {
    const good = GOODS[def.produces].name;
    tiles.push({
      key: 'output',
      label: TILE_LAYOUT.output.label,
      value: stopped ? 'Stillgelegt' : perMin,
      sub: stopped
        ? null
        : b.outageUntil !== undefined
          ? `${good} · ruht, Betrieb brennt`
          : `${good} · alle ${formatGameTime(cycle)}`,
    });
  }
  const u = utilization(b);
  if (u !== null)
    tiles.push({
      key: 'utilization',
      label: TILE_LAYOUT.utilization.label,
      value: `${Math.floor(u / 10)} %`,
      sub: null,
    });
  if (def.consumes && cycle !== undefined)
    tiles.push({
      key: 'input',
      label: TILE_LAYOUT.input.label,
      value: stopped ? 'Stillgelegt' : def.consumes.length > 1 ? `je ${perMin}` : perMin,
      sub: stopped ? null : goodList(def.consumes),
    });
  tiles.push({
    key: 'upkeep',
    label: TILE_LAYOUT.upkeep.label,
    value: `${perMinute(buildingUpkeep(world, b), UPKEEP_INTERVAL)} / min`,
    sub: 'Geld',
  });
  return tiles;
}

export function houseTiles(world: World, b: Building): StatTile[] {
  if (!b.house) return [];
  return [
    {
      key: 'inhabitants',
      label: TILE_LAYOUT.inhabitants.label,
      value: `${b.house.inhabitants} / ${maxInhabitantsOf(world, b.house.tier)}`,
      sub: null,
    },
  ];
}

function gainRow(
  key: GainRow['key'],
  label: string,
  before: number,
  after: number,
  unit: string,
): GainRow {
  return {
    key,
    label,
    before,
    after,
    delta: signedNum(round1(after - before)),
    text: `${before} → ${after}${unit}`,
  };
}

/** Gewinn des Ausbaus auf Zielstufe `to` (2 oder 3): Ausstoss und Unterhalt je Minute. */
export function upgradeGain(world: World, b: Building, to: 2 | 3): GainRow[] {
  const next = LEVELS[b.defId]?.[to - 2];
  if (next === undefined) return [];
  const rows: GainRow[] = [];
  const cycle = cycleOf(world, b);
  if (cycle !== undefined)
    rows.push(
      gainRow(
        'output',
        'Ausstoss',
        perMinute(1, cycle),
        perMinute(1, effectiveCycle(world, b.island, b.defId, next.cycle)),
        ' / min',
      ),
    );
  rows.push(
    gainRow(
      'upkeep',
      'Unterhalt',
      perMinute(buildingUpkeep(world, b), UPKEEP_INTERVAL),
      perMinute(
        b.paused === true ? Math.ceil((next.upkeep * PAUSED_UPKEEP_PCT) / 100) : next.upkeep,
        UPKEEP_INTERVAL,
      ),
      ' / min',
    ),
  );
  return rows;
}

export function upgradeCard(world: World, b: Building): UpgradeCard | null {
  const v = checklistView(world, b);
  if (v === null) return null;
  if (v.kind === 'max') return { kind: 'max', title: v.text };
  const to = ((b.level ?? 1) + 1) as 2 | 3;
  return {
    kind: 'next',
    title: v.title,
    gains: upgradeGain(world, b, to),
    rows: v.rows,
    ok: v.canUpgrade,
    tooltip: v.tooltip,
    key: UPGRADE_KEY_LABEL,
    balance: balanceLine(balanceAfterUpgrade(world, b)),
  };
}

/** Aufstiegs-Karte des Wohnhauses; `null` für Gebäude ohne Haus. */
export function riseCard(
  world: World,
  b: Building,
): { title: string; gain: GainRow | null } | null {
  if (!b.house) return null;
  const t = b.house.tier;
  const next = TIERS[(t + 1) as Tier] as (typeof TIERS)[Tier] | undefined;
  if (next === undefined || TIERS[t].upgradeCost === null)
    return { title: 'Höchste Stufe', gain: null };
  return {
    title: `Aufstieg zu ${next.name}`,
    gain: gainRow(
      'inhabitants',
      'Einwohner höchstens',
      maxInhabitantsOf(world, t),
      maxInhabitantsOf(world, next.tier),
      '',
    ),
  };
}

export function progressView(world: World, b: Building): { pct: number; label: string } | null {
  if (cycleOf(world, b) === undefined) return null;
  const pct = progressPct(world, b);
  return { pct, label: `Fortschritt ${pct} %` };
}

/** Fortschrittsbalken in Prozent, bezogen auf den Zyklus der Stufe. */
export function progressPct(world: World, b: Building): number {
  return Math.min(100, Math.round((b.progress / (cycleOf(world, b) ?? 1)) * 100));
}

/** Knopf «Stilllegen» / «Wieder anfahren»; nur für Betriebe mit Erzeugung (U-11). */
export function pauseButton(b: Building): { text: string; title: string } | null {
  if (BUILDING_DEFS[b.defId].produces === undefined) return null;
  return {
    text: b.paused === true ? 'Wieder anfahren' : 'Stilllegen',
    title: `Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet), keine Erzeugung`,
  };
}
