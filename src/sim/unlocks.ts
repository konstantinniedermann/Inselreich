import { BUILDING_DEFS, BUILDING_IDS } from './defs/buildings';
import { TIERS, WIN_CITIZENS } from './defs/tiers';
import {
  FUNCTION_ENTRY,
  FUNCTION_LABELS,
  ONLY_WITH_CRISES,
  UNLOCK_CHAIN,
  UNLOCK_IDS,
  UNLOCKS,
} from './defs/unlocks';
import { citizens, tierLock } from './population';
import { effectiveTaxLevel } from './townhall';
import type {
  Building,
  BuildingDefId,
  GoodId,
  Tier,
  UnlockDef,
  UnlockFunction,
  UnlockId,
  UnlockTrigger,
  World,
} from './types';

const DEF = Object.fromEntries(UNLOCKS.map((u) => [u.id, u])) as Record<UnlockId, UnlockDef>;
const housesOf = (w: World): Building[] =>
  Object.values(w.buildings).filter((b) => b.house !== undefined);
const houseCount = (w: World): number =>
  Object.values(w.buildings).filter((b) => b.defId === 'house').length;
const inOrder = (ids: Iterable<UnlockId>): UnlockId[] => {
  const s = new Set(ids);
  return UNLOCK_IDS.filter((id) => s.has(id));
};

export function isUnlocked(w: World, id: UnlockId): boolean {
  return w.unlocked.includes(id);
}

/** Text mit gefüllten Platzhaltern (Spec 4.5): {min} aus trigger.min, {max} aus TIERS[tier − 1], {WIN_CITIZENS}. */
export function unlockText(def: UnlockDef, field: 'lockText' | 'whenText'): string {
  const t = def.trigger;
  let s = def[field].replace('{WIN_CITIZENS}', String(WIN_CITIZENS));
  if (t.kind === 'houses') s = s.replace('{min}', String(t.min));
  if (t.kind === 'tierWish')
    s = s.replace('{max}', String(TIERS[(t.tier - 1) as Tier].maxInhabitants));
  return s;
}

/** Auslöser-Prädikate (Spec 4.2); tierWish ist für tier ≤ 3 gleich anyPlan des Controllers. */
function fulfilled(w: World, t: UnlockTrigger): boolean {
  switch (t.kind) {
    case 'start':
      return true;
    case 'houses':
      return houseCount(w) >= t.min;
    case 'tierWish':
      return housesOf(w).some((b) => {
        const h = b.house!;
        const full = h.inhabitants === TIERS[h.tier].maxInhabitants;
        return (full && h.tier < t.tier ? h.tier + 1 : h.tier) >= t.tier;
      });
    case 'tierReached':
      return housesOf(w).some((b) => b.house!.tier >= t.tier);
    case 'tierOpen':
      return tierLock(w, t.tier) === null;
  }
}

export function entryOfBuilding(defId: BuildingDefId): UnlockDef | null {
  return UNLOCKS.find((u) => u.buildings.includes(defId)) ?? null;
}

/** Sperrgrund eines nicht freien Eintrags; U6 nennt den M8-Grund (W3: Defs-Text, falls tierLock schon null ist). */
export function lockReason(w: World, def: UnlockDef): string {
  const t = def.trigger;
  if (t.kind === 'tierOpen') return tierLock(w, t.tier) ?? unlockText(def, 'lockText');
  return unlockText(def, 'lockText');
}

export function buildLock(w: World, defId: BuildingDefId): string | null {
  const e = entryOfBuilding(defId);
  return e === null || isUnlocked(w, e.id) ? null : lockReason(w, e);
}

export function goodLock(w: World, g: GoodId): string | null {
  const e = UNLOCKS.find((u) => u.goods.includes(g));
  return e === undefined || isUnlocked(w, e.id) ? null : lockReason(w, e);
}

export function goodUnlocked(w: World, g: GoodId): boolean {
  return goodLock(w, g) === null;
}

export function functionLock(w: World, f: UnlockFunction): string | null {
  const id = FUNCTION_ENTRY[f];
  return isUnlocked(w, id) ? null : lockReason(w, DEF[id]);
}

const shownWithCrises = (w: World, defId: BuildingDefId): boolean =>
  ONLY_WITH_CRISES[defId] !== true || w.crisisLevel !== 'off';

export function buildingShown(w: World, defId: BuildingDefId): boolean {
  return buildLock(w, defId) === null && shownWithCrises(w, defId);
}

export function triggeredUnlocks(w: World): UnlockId[] {
  const out = new Set<UnlockId>(['U0']);
  for (const u of UNLOCKS) {
    if (!fulfilled(w, u.trigger)) continue;
    out.add(u.id);
    const i = UNLOCK_CHAIN.indexOf(u.id);
    for (let j = 0; j < i; j++) out.add(UNLOCK_CHAIN[j]!);
  }
  return inOrder(out);
}

export function deriveUnlocks(w: World): UnlockId[] {
  const out = new Set<UnlockId>(triggeredUnlocks(w));
  for (const b of Object.values(w.buildings)) {
    const e = entryOfBuilding(b.defId);
    if (e !== null) out.add(e.id);
    if ((b.level ?? 1) >= 2) out.add(FUNCTION_ENTRY.upgrade2);
    if (b.level === 3) out.add(FUNCTION_ENTRY.upgrade3);
  }
  return inOrder(out);
}

/** Letzter Aufruf in step (Spec 4.3): nur Vereinigung, nie Entfernen; schreibt nur `unlocked`. */
export function tickUnlocks(w: World): void {
  const next = inOrder([...w.unlocked, ...triggeredUnlocks(w)]);
  if (next.length !== w.unlocked.length) w.unlocked = next;
}

export interface NextUnlock {
  id: UnlockId;
  names: string[];
  when: string;
  now: number | null;
  need: number | null;
  taxBlocks: boolean;
}

function progress(w: World, t: UnlockTrigger): { now: number | null; need: number | null } {
  if (t.kind === 'houses') return { now: houseCount(w), need: t.min };
  if (t.kind === 'tierWish') {
    const prev = (t.tier - 1) as Tier;
    let best = 0;
    for (const b of housesOf(w))
      if (b.house!.tier === prev) best = Math.max(best, b.house!.inhabitants);
    return { now: best, need: TIERS[prev].maxInhabitants };
  }
  if (t.kind === 'tierOpen') return { now: citizens(w), need: WIN_CITIZENS };
  return { now: null, need: null };
}

/** Spec 12.2: erster nicht freier Ketteneintrag und U1 (falls nicht frei), UNLOCKS-Reihenfolge. */
export function nextUnlocks(w: World): NextUnlock[] {
  const chainNext = UNLOCK_CHAIN.find((id) => !isUnlocked(w, id));
  return UNLOCKS.filter(
    (u) => !isUnlocked(w, u.id) && (u.id === chainNext || !UNLOCK_CHAIN.includes(u.id)),
  ).map((u) => ({
    id: u.id,
    names: [
      ...BUILDING_IDS.filter((id) => u.buildings.includes(id) && shownWithCrises(w, id)).map(
        (id) => BUILDING_DEFS[id].name,
      ),
      ...u.functions.flatMap((f) => FUNCTION_LABELS[f]),
    ],
    when: unlockText(u, 'whenText'),
    ...progress(w, u.trigger),
    taxBlocks:
      effectiveTaxLevel(w, 1) === 'high' &&
      (u.trigger.kind === 'tierWish' || u.trigger.kind === 'tierReached'),
  }));
}
