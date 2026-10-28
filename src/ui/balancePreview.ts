import { TIERS } from '../sim/defs/tiers';
import { totalUpkeep } from '../sim/economy';
import { houseCap, moneyTaxes, newHouseState } from '../sim/population';
import type { GoodId, Building, BuildingDefId, HouseState, World } from '../sim/types';
import { balanceText } from './hud';

/**
 * Bilanz-Vorschau (I-078): Nominalwerte je 100 Ticks (Geldanteil der Steuer (I-223: ohne Zehnt) − Unterhalt), inselübergreifend wie die Kopfzeile.
 * `afterMax` gibt es nur beim Wohnhaus (Steuer bei voller Belegung, „bis zu“).
 */
export interface BalancePreview {
  before: number;
  after: number;
  afterMax?: number;
}

/** Schlüssel des Probe-Gebäudes; kollidiert nie mit einer echten Id. */
const PROBE_ID = Number.MAX_SAFE_INTEGER;

const balanceOf = (w: World): number => moneyTaxes(w) - totalUpkeep(w);

/** Flache Probe-Welt mit einem Zusatz-Gebäude; die echte Welt (Gebäudetabelle, Häuser) bleibt unberührt. */
function withProbe(world: World, probe: Building): World {
  return { ...world, buildings: { ...world.buildings, [PROBE_ID]: probe } };
}

function probeBuilding(
  world: World,
  defId: BuildingDefId,
  island: number,
  house?: HouseState,
): Building {
  const idx = world.islands[island] !== undefined ? island : 0;
  const anchor = world.islands[idx]!.anchor;
  const b: Building = {
    id: PROBE_ID,
    defId,
    x: anchor.x,
    y: anchor.y,
    connected: true,
    progress: 0,
    state: 'ok',
    island: idx,
  };
  if (house !== undefined) b.house = house;
  return b;
}

/** Voll belegtes, voll versorgtes Haus der Einstiegsstufe (Stufe aus `newHouseState`, nicht fest verdrahtet). */
function fullHouse(world: World): HouseState {
  const h = newHouseState(world);
  const tier = TIERS[h.tier];
  const needs = Object.keys(tier.needs) as GoodId[];
  return {
    ...h,
    inhabitants: houseCap(world, h),
    supplied: true,
    satisfied: Object.fromEntries(needs.map((g) => [g, true])),
    services: Object.fromEntries(tier.services.map((s) => [s, true])),
  };
}

/** Bilanz vor und nach dem Bau von `defId` auf `island` (Heimat, wenn die Insel fehlt). */
export function balanceAfterBuild(
  world: World,
  defId: BuildingDefId,
  island: number = 0,
): BalancePreview {
  const before = balanceOf(world);
  if (defId === 'house') {
    const start = withProbe(world, probeBuilding(world, defId, island, newHouseState(world)));
    const full = withProbe(world, probeBuilding(world, defId, island, fullHouse(world)));
    return { before, after: balanceOf(start), afterMax: balanceOf(full) };
  }
  return { before, after: balanceOf(withProbe(world, probeBuilding(world, defId, island))) };
}

/** Bilanz vor und nach dem Ausbau von `b` um eine Stufe (Unterhalt der nächsten Stufe, Edikt Sparen inklusive). */
export function balanceAfterUpgrade(world: World, b: Building): BalancePreview {
  const before = balanceOf(world);
  const next: Building = { ...b, level: (b.level ?? 1) === 1 ? 2 : 3 };
  const w: World = { ...world, buildings: { ...world.buildings, [b.id]: next } };
  // Nominalwirkung: die Zielstufe läuft voll (keine Drosselung der Vorschau-Stufe), Unterhaltszeile und Delta stimmen überein.
  return { before, after: moneyTaxes(w) - totalUpkeep(w, next) };
}

/** `+120 / min` -> `+120`: gleiche Funktion wie der Bilanz-Chip (`balanceText`), kein zweiter Formatierer. */
function signedPerMin(n: number): string {
  return balanceText({ taxes: n, upkeep: 0 })
    .text.replace(/^Bilanz /, '')
    .replace(/ \/ min$/, '');
}

/** Zeile für Tooltip und Ausbau-Karte, z. B. «Bilanz danach: +120 → +95 / min». */
export function balanceLine(p: BalancePreview): string {
  const before = signedPerMin(p.before);
  const after = signedPerMin(p.after);
  if (p.afterMax !== undefined) {
    return `Bilanz danach: ${before} → bis zu ${signedPerMin(p.afterMax)} / min (Steuer bei voller Belegung)`;
  }
  if (p.after === p.before) return `Bilanz danach: gleich (${before} / min)`;
  return `Bilanz danach: ${before} → ${after} / min`;
}
