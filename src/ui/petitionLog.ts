// petitionLog.ts — DOM-freie Texte der Bittschrift: Chronik, Panelzeilen, Wirkungs-Chip (I-210, Anhang 05).
// Werte nur über die Abfragen der Sim (`overcrowdCap`, `petitionCycle`, `storageCap`); hier wird nichts gerechnet.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { FRUGAL_PCT, PETITIONS, type PetitionDef } from '../sim/defs/petitions';
import { TIERS } from '../sim/defs/tiers';
import { bellActive, overcrowdCap, petitionCycle, storageCap } from '../sim/petitionEffect';
import { petitionCost, type PetitionEvent } from '../sim/petitions';
import { houseCap } from '../sim/population';
import type { Building, GoodId, PetitionEffectEntry, World } from '../sim/types';
import { HOME } from '../sim/world';
import type { LogEntry } from './crisisLog';
import { formatClock, formatGameTime } from './time';

const name = (g: GoodId): string => GOODS[g].name;

function effectUntil(world: World, e: PetitionEvent): number | null {
  const hit = world.petitions.effects.find(
    (x) => x.id === e.id && x.answer === 'yes' && x.until > e.drawnAt,
  );
  return hit?.until ?? null;
}

function askText(world: World, e: PetitionEvent): string {
  const def = PETITIONS[e.id];
  const cost = petitionCost(world, { id: e.id, drawnAt: e.drawnAt, amount: e.amount ?? 0 });
  const parts = (Object.entries(cost) as [GoodId, number][]).map(([g, n]) => `${n} ${name(g)}`);
  return `Bittschrift ${def.name}: Bitte um ${parts.length === 0 ? 'Aufnahme' : parts.join(', ')}`;
}

function endedText(def: PetitionDef, e: PetitionEvent): string {
  if (def.reward.kind === 'storage') {
    const lost = (Object.entries(e.spoiled ?? {}) as [GoodId, number][])
      .map(([g, n]) => `${n} ${name(g)} verdorben`)
      .join(', ');
    return lost === '' ? 'Der Speicher ist abgebaut' : `Der Speicher ist abgebaut, ${lost}`;
  }
  return `${def.name}: Wirkung ist abgelaufen`;
}

/** Log-Einträge der Ereignisse eines Schritts, in Reihenfolge der Ereignisse. */
export function petitionLogEntries(events: readonly PetitionEvent[], world: World): LogEntry[] {
  const tick = world.tick;
  return events.map((e): LogEntry => {
    const def = PETITIONS[e.id];
    switch (e.kind) {
      case 'drawn':
        return { text: askText(world, e), toast: 'info', tick };
      case 'thanks': {
        const until = effectUntil(world, e);
        const base = def.thanks.replace(/\.$/, '');
        return {
          text: until === null ? base : `${base} (Wirkung bis ${formatClock(until)})`,
          toast: 'info',
          tick,
        };
      }
      case 'lament':
        return { text: def.lament, toast: null, tick };
      case 'timeout':
        return { text: 'Keine Antwort: abgelehnt', toast: 'info', tick };
      case 'lapsed': {
        const b = def.anchor === null ? 'Der Ort' : `Die ${BUILDING_DEFS[def.anchor].name}`;
        return {
          text: `${b} steht nicht mehr: ${def.name} fällt aus, die Gabe ist verloren`,
          toast: 'info',
          tick,
        };
      }
      case 'ended':
        return { text: endedText(def, e), toast: null, tick };
    }
  });
}

/** Laufende Wirkungen (Frist nicht erreicht); liest nur. */
function activeEffects(world: World): PetitionEffectEntry[] {
  return world.petitions.effects.filter((e) => e.until > world.tick);
}

const overcrowdCapOf = (world: World, b: Building): number =>
  overcrowdCap(world, b.island, b.house!.tier, houseCap(world, b.house!));
/** Zyklus-Anteil in Prozent, wie ihn die Sim auf einen Basiswert 100 anwendet. */
const cyclePct = (world: World, b: Building): number =>
  petitionCycle(world, b.island, b.defId, 100);
const storageCapOf = (world: World, g: GoodId): number => storageCap(world, HOME, g);

/** Panelzeilen eines Gebäudes; `[]` ohne Wirkung. */
export function effectLines(world: World, b: Building): string[] {
  const out: string[] = [];
  const list = activeEffects(world);
  if (list.length === 0) return out;
  if (b.house !== undefined && b.island === HOME) {
    const base = houseCap(world, b.house);
    const eff = overcrowdCapOf(world, b);
    if (eff > base) {
      const e = list.find(
        (x) =>
          x.answer === 'yes' &&
          PETITIONS[x.id].reward.kind === 'overcrowd' &&
          (PETITIONS[x.id].reward as { tiers: readonly number[] }).tiers.includes(b.house!.tier),
      );
      if (e !== undefined)
        out.push(
          `${b.house.inhabitants} / ${base} (${PETITIONS[e.id].name} bis ${formatClock(e.until)})`,
        );
    }
    if (bellActive(world, b)) {
      const bell = list.find(
        (x) => x.answer === 'yes' && PETITIONS[x.id].reward.kind === 'upgradeWait',
      );
      if (bell !== undefined) out.push(`Glockenweihe bis ${formatClock(bell.until)}`);
    }
    const needs = TIERS[b.house.tier].needs;
    for (const e of list) {
      const g = PETITIONS[e.id].no;
      if (e.answer === 'no' && needs[g] !== undefined)
        out.push(`Genügsam: ${name(g)}bedarf −${FRUGAL_PCT} % bis ${formatClock(e.until)}`);
    }
  }
  const e = list.find((x) => {
    const r = PETITIONS[x.id].reward;
    return (
      x.answer === 'yes' &&
      r.kind === 'cycle' &&
      r.building === b.defId &&
      (!r.homeOnly || b.island === HOME)
    );
  });
  if (e !== undefined) {
    const pct = cyclePct(world, b);
    if (pct < 100) out.push(`Bittschrift: Zyklus ${pct} % bis ${formatClock(e.until)}`);
  }
  if (b.defId === 'kontor' && b.island === HOME) {
    const s = list.find((x) => x.answer === 'yes' && PETITIONS[x.id].reward.kind === 'storage');
    if (s !== undefined) {
      const goods = Object.keys(GOODS) as GoodId[];
      const cap = Math.max(...goods.map((g) => storageCapOf(world, g)));
      if (cap > STORAGE_CAP) out.push(`Lager ${cap} (Speicher bis ${formatClock(s.until)})`);
    }
  }
  return out;
}

/** Chip der laufenden Wirkungen: Zahl und kürzeste Restzeit; `title` mit allen Einträgen. */
export function effectsChip(world: World): { label: string; title: string } | null {
  const list = activeEffects(world);
  if (list.length === 0) return null;
  const soonest = Math.min(...list.map((e) => e.until));
  const title = list
    .map((e) =>
      e.answer === 'no'
        ? `Genügsam bei ${name(PETITIONS[e.id].no)}: noch ${formatGameTime(e.until - world.tick)}`
        : `${PETITIONS[e.id].name}: noch ${formatGameTime(e.until - world.tick)}`,
    )
    .join('\n');
  return {
    label: `Wirkungen ${list.length} · noch ${formatGameTime(soonest - world.tick)}`,
    title,
  };
}
