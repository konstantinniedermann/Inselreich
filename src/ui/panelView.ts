import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { LEVELS } from '../sim/defs/levels';
import { TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { buildingUpkeep, cycleOf, upkeepOf, utilization } from '../sim/levels';
import { isSupplied } from '../sim/population';
import { missingInputs } from '../sim/queries';
import { upgradeBuilding } from '../sim/upgrade';
import { functionLock } from '../sim/unlocks';
import type { Building, BuildingDefId, Tier, World } from '../sim/types';
import { costLine } from './dom';
import { friendlyReason } from './hints';
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
      cost: string;
      fee: string;
      reasons: string[];
      ok: boolean;
      key: string;
    }
  | { kind: 'locked'; title: string; gains: GainRow[]; lock: string }
  | { kind: 'max'; title: 'Höchste Stufe' };

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
  const text = stateInfo(b, world.tick, missingInputs(world, b)).text;
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

export function statTiles(b: Building): StatTile[] {
  const def = BUILDING_DEFS[b.defId];
  if (b.house) return [];
  const cycle = cycleOf(b);
  const tiles: StatTile[] = [];
  const perMin = cycle === undefined ? '' : `${perMinute(1, cycle)} / min`;
  if (def.produces && cycle !== undefined) {
    const good = GOODS[def.produces].name;
    tiles.push({
      key: 'output',
      label: TILE_LAYOUT.output.label,
      value: perMin,
      sub:
        b.outageUntil !== undefined
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
      value: def.consumes.length > 1 ? `je ${perMin}` : perMin,
      sub: goodList(def.consumes),
    });
  tiles.push({
    key: 'upkeep',
    label: TILE_LAYOUT.upkeep.label,
    value: `${perMinute(buildingUpkeep(b), UPKEEP_INTERVAL)} / min`,
    sub: 'Geld',
  });
  return tiles;
}

export function houseTiles(b: Building): StatTile[] {
  if (!b.house) return [];
  return [
    {
      key: 'inhabitants',
      label: TILE_LAYOUT.inhabitants.label,
      value: `${b.house.inhabitants} / ${TIERS[b.house.tier].maxInhabitants}`,
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
export function upgradeGain(b: Building, to: 2 | 3): GainRow[] {
  const next = LEVELS[b.defId]?.[to - 2];
  if (next === undefined) return [];
  const rows: GainRow[] = [];
  const cycle = cycleOf(b);
  if (cycle !== undefined)
    rows.push(
      gainRow('output', 'Ausstoss', perMinute(1, cycle), perMinute(1, next.cycle), ' / min'),
    );
  rows.push(
    gainRow(
      'upkeep',
      'Unterhalt',
      perMinute(upkeepOf(b), UPKEEP_INTERVAL),
      perMinute(next.upkeep, UPKEEP_INTERVAL),
      ' / min',
    ),
  );
  return rows;
}

export function upgradeCard(world: World, b: Building): UpgradeCard | null {
  if (LEVELS[b.defId] === undefined) return null;
  const level = b.level ?? 1;
  if (level >= 3) return { kind: 'max', title: 'Höchste Stufe' };
  const to = (level + 1) as 2 | 3;
  const gains = upgradeGain(b, to);
  const lock = functionLock(world, level === 1 ? 'upgrade2' : 'upgrade3');
  if (lock !== null) return { kind: 'locked', title: `Ausbau zu Stufe ${to}`, gains, lock };
  const v = upgradeView(world, b);
  if (v === null) return null;
  return {
    kind: 'next',
    title: v.title,
    gains,
    cost: v.cost,
    fee: v.fee,
    reasons: v.reasons,
    ok: v.ok,
    key: UPGRADE_KEY_LABEL,
  };
}

/** Aufstiegs-Karte des Wohnhauses; `null` für Gebäude ohne Haus. */
export function riseCard(
  _world: World,
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
      TIERS[t].maxInhabitants,
      next.maxInhabitants,
      '',
    ),
  };
}

export function progressView(b: Building): { pct: number; label: string } | null {
  if (cycleOf(b) === undefined) return null;
  const pct = progressPct(b);
  return { pct, label: `Fortschritt ${pct} %` };
}

export interface UpgradeView {
  title: string;
  cost: string;
  fee: string;
  preview: string;
  reasons: string[];
  ok: boolean;
}

/**
 * Ausbau-Abschnitt des Betriebs-Panels (Spec 7); `null`, wenn der Betrieb nicht ausbaubar oder die Stufe noch
 * nicht freigeschaltet ist. Die Gründe stammen aus einem Probelauf von `upgradeBuilding` auf einer Kopie.
 */
export function upgradeView(world: World, b: Building): UpgradeView | null {
  const levels = LEVELS[b.defId];
  if (levels === undefined) return null;
  const lvl = b.level ?? 1;
  if (lvl >= 3)
    return { title: 'Höchste Stufe', cost: '', fee: '', preview: '', reasons: [], ok: false };
  if (functionLock(world, lvl === 1 ? 'upgrade2' : 'upgrade3') !== null) return null;
  const next = levels[lvl - 1]!;
  const probe = {
    ...world,
    islands: world.islands.map((isl) => ({ ...isl, stock: { ...isl.stock } })),
    buildings: { ...world.buildings, [b.id]: { ...b } },
  };
  const r = upgradeBuilding(probe, b.id);
  const out = `${perMinute(1, cycleOf(b) ?? 1)} → ${perMinute(1, next.cycle)}`;
  const upkeep = `${perMinute(upkeepOf(b), UPKEEP_INTERVAL)} → ${perMinute(next.upkeep, UPKEEP_INTERVAL)}`;
  return {
    title: `Ausbau zu Stufe ${lvl + 1}`,
    cost: `Kosten ${costLine(next.cost)}`,
    fee: `Gebühr ${next.fee.amount} ${GOODS[next.fee.good].name}`,
    preview: `Ausstoss ${out} / min · Unterhalt ${upkeep} / min`,
    reasons: r.ok
      ? []
      : [`✗ ${friendlyReason(world, r.reason, { cost: next.cost, island: b.island })}`],
    ok: r.ok,
  };
}

/** Fortschrittsbalken in Prozent, bezogen auf den Zyklus der Stufe. */
export function progressPct(b: Building): number {
  return Math.min(100, Math.round((b.progress / (cycleOf(b) ?? 1)) * 100));
}

/** Knopf «Stilllegen» / «Wieder anfahren»; nur für Betriebe mit Erzeugung (U-11). */
export function pauseButton(b: Building): { text: string; title: string } | null {
  if (BUILDING_DEFS[b.defId].produces === undefined) return null;
  return {
    text: b.paused === true ? 'Wieder anfahren' : 'Stilllegen',
    title: 'Halber Unterhalt, keine Erzeugung',
  };
}
