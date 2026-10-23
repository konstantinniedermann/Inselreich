import { buildCoverage, type Coverage } from '../sim/coverage';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { TIERS, TIER_IDS } from '../sim/defs/tiers';
import { SERVICE_BUILDING, isSupplied, serviceAvailable } from '../sim/population';
import type { Diagnosis } from '../sim/queries';
import type { Building, GoodId, ServiceId, Tier, World } from '../sim/types';

/**
 * Wachstumsbremse je Stufe für den Einwohner-Chip (I-170): was den Häusern einer Stufe auf der Insel fehlt,
 * genau eine Ursache je Haus. DOM-frei, schreibt nie in die Welt.
 */

export interface BrakeCause {
  cause: Diagnosis;
  n: number;
}

export interface GrowthBrake {
  /** Häuser der Stufe auf der Insel (ohne brennende). */
  houses: number;
  /** Ursachen in Rangfolge: Versorgung, Waren (`GOOD_IDS`), Dienste (Stufenreihenfolge); nur n > 0. */
  causes: BrakeCause[];
  /** Häuser ohne Mangel. */
  free: number;
  /** Platz für die Lärm-Zählung (Stadtplanung); bis dahin leer. */
  noise: { houses: number; loss: number };
}

const isBurning = (b: Building): boolean => b.outageUntil !== undefined || b.state === 'burning';

/** Rang einer Ursache innerhalb der Stufe `tier` (kleiner = früher). */
function rankOf(tier: Tier, c: Diagnosis): number {
  if (c.kind === 'supply') return 0;
  if (c.kind === 'good') return 1 + GOOD_IDS.indexOf(c.good);
  return 1 + GOOD_IDS.length + TIERS[tier].services.indexOf(c.service);
}

/** Die erste Ursache eines Hauses oder `null` (gleiche Rangfolge wie `houseDiagnosis`). */
function firstCause(world: World, b: Building, cov: Coverage): Diagnosis | null {
  const house = b.house!;
  if (!isSupplied(world, b, cov)) return { kind: 'supply' };
  const tier = TIERS[house.tier];
  for (const good of GOOD_IDS) {
    if (good in tier.needs && house.satisfied[good] !== true) return { kind: 'good', good };
  }
  for (const service of tier.services) {
    if (!serviceAvailable(world, b, service, cov)) return { kind: 'service', service };
  }
  return null;
}

const causeKey = (c: Diagnosis): string =>
  c.kind === 'good' ? `good:${c.good}` : c.kind === 'service' ? `service:${c.service}` : 'supply';

/** Alle Stufen in einem Durchlauf über die Gebäude, mit einmal gebauter Coverage. */
export function growthBrakes(
  world: World,
  island: number,
  cov: Coverage = buildCoverage(world),
): Record<Tier, GrowthBrake> {
  const acc = {} as Record<Tier, { brake: GrowthBrake; byKey: Map<string, BrakeCause> }>;
  for (const t of TIER_IDS) {
    acc[t] = {
      brake: { houses: 0, causes: [], free: 0, noise: { houses: 0, loss: 0 } },
      byKey: new Map(),
    };
  }
  for (const b of Object.values(world.buildings)) {
    if (!b.house || b.island !== island || isBurning(b)) continue;
    const slot = acc[b.house.tier];
    slot.brake.houses += 1;
    const cause = firstCause(world, b, cov);
    if (cause === null) {
      slot.brake.free += 1;
      continue;
    }
    const key = causeKey(cause);
    const hit = slot.byKey.get(key);
    if (hit) hit.n += 1;
    else slot.byKey.set(key, { cause, n: 1 });
  }
  for (const t of TIER_IDS) {
    acc[t].brake.causes = [...acc[t].byKey.values()].sort(
      (a, b) => rankOf(t, a.cause) - rankOf(t, b.cause),
    );
  }
  return Object.fromEntries(TIER_IDS.map((t) => [t, acc[t].brake])) as Record<Tier, GrowthBrake>;
}

function causeText(c: BrakeCause): string {
  const d = c.cause;
  if (d.kind === 'supply') return `${c.n} ausserhalb der Versorgung`;
  if (d.kind === 'good') return `${c.n} ohne ${GOODS[d.good as GoodId].name}`;
  return `${c.n} ohne ${BUILDING_DEFS[SERVICE_BUILDING[d.service as ServiceId]].name}`;
}

/**
 * Tooltip-Zeilen unter dem Stufentext. Leer ohne Häuser. `parkShown` ist für die Lärm-Zeile reserviert
 * (Stadtplanung, T05) und wirkt noch nicht.
 */
export function brakeLines(brake: GrowthBrake, parkShown: boolean): string[] {
  void parkShown;
  const n = brake.houses;
  if (n === 0) return [];
  if (brake.free === n) return [n === 1 ? 'Das Haus ohne Mangel' : `Alle ${n} Häuser ohne Mangel`];
  // stabile Sortierung: Gleichstand behält die Rangfolge
  const sorted = [...brake.causes].sort((a, b) => b.n - a.n);
  const parts = sorted.slice(0, 3).map(causeText);
  const rest = sorted.slice(3).reduce((s, c) => s + c.n, 0);
  if (rest > 0) parts.push(`${rest} weitere`);
  if (brake.free > 0) parts.push(`${brake.free} ohne Mangel`);
  return [`${n === 1 ? '1 Haus' : `${n} Häuser`}: ${parts.join(' · ')}`];
}
