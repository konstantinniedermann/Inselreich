> **Task-ID:** Task 1 (Paket M10-S1A) — Teil 4 von 5
> **AK-IDs:** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1`
> **blocked-by:** Gate Plan, Gate Merge M8
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T01a-freischalt-modell.md](T01a-freischalt-modell.md) · [T01b-freischalt-modell.md](T01b-freischalt-modell.md) · [T01c-freischalt-modell.md](T01c-freischalt-modell.md) · **T01d-freischalt-modell.md** (diese) · [T01e-freischalt-modell.md](T01e-freischalt-modell.md)

- [ ] **Schritt 5: `src/sim/unlocks.ts`** (neu; Importe nur `./defs/*`, `./population`, `./types` — B9):

```ts
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
    taxBlocks: false, // Task 4: effectiveTaxLevel(w) === 'high' && (tierWish | tierReached)
  }));
}
```

- [ ] **Schritt 6: Welt, Tick, Save.**
  - `src/sim/world.ts`: `createWorld(seed, opts: { crisisLevel?: CrisisLevel; unlockAll?: boolean } = {})`;
    `version: 5`; nach `crisis: null` die Felder `unlocked: opts.unlockAll === true ? [...UNLOCK_IDS] : ['U0']`,
    `goodLocks: []`, `upgradeStops: []` (Import `UNLOCK_IDS` aus `./defs/unlocks`, nicht aus `./unlocks`).
  - `src/sim/tick.ts`: Import `tickUnlocks` aus `./unlocks`; letzte Zeile in `step` `tickUnlocks(world);` (Kommentar:
    „letzter Aufruf: Bitgleichheit, Spec 4.3, ADR-005-Nachtrag"); Doc-Kommentar von `step` um „Freischaltung" ergänzen.
  - `src/sim/save.ts`: `SAVE_VERSION = 5`; neu

```ts
/** v4 → v5 (Spec 8.2): Platzhalter; die echte Freischaltung setzt deserialize nach isWellFormed (deriveUnlocks). */
export function migrateV4ToV5(raw: Record<string, unknown>): void {
  raw.unlocked = ['U0'];
  raw.goodLocks = [];
  raw.upgradeStops = [];
  raw.version = 5;
}
```

In `deserialize` nach `if (raw.version === 3) migrateV3ToV4(raw);`:
`const fromV4 = raw.version === 4; if (fromV4) migrateV4ToV5(raw);` — danach wie heute Versions- und
Strukturprüfung; im bestehenden `try` nach `recomputeConnectivity(world)`:
`if (fromV4) world.unlocked = deriveUnlocks(world);`. `isWellFormed` prüft zusätzlich (Spec 8.2):

```ts
function isUnlockList(v: unknown): boolean {
  if (!Array.isArray(v) || !v.includes('U0')) return false;
  let last = -1;
  for (const id of v) {
    const i = UNLOCK_IDS.indexOf(id as UnlockId);
    if (i <= last) return false; // unbekannt (−1), doppelt oder falsche Reihenfolge
    last = i;
  }
  return true;
}
function isGoodLockList(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  let last = -1;
  for (const e of v) {
    if (!isObject(e)) return false;
    const tier = e.tier;
    if (tier !== 1 && tier !== 2 && tier !== 3 && tier !== 4) return false;
    const gi = GOOD_IDS.indexOf(e.good as GoodId);
    if (gi < 0 || !Object.hasOwn(TIERS[tier].needs, e.good as string)) return false;
    const key = tier * 100 + gi;
    if (key <= last) return false; // doppelt oder unsortiert
    last = key;
  }
  return true;
}
function isUpgradeStopList(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  let last = 0;
  for (const t of v) {
    if (t !== 1 && t !== 2 && t !== 3 && t !== 4) return false;
    if (TIERS[t].upgradeCost === null || t <= last) return false;
    last = t;
  }
  return true;
}
```

- [ ] **Schritt 7: Grün prüfen, bestehende Tests nachführen (T-1, T-2, T-3).**

```bash
npx vitest run tests/sim/unlocks.test.ts tests/sim/save.test.ts      # alle M10-Tests grün
npx vitest run 2>&1 | tail -15                                         # rote bestehende Tests: nur T-1/T-2/T-3 anpassen
npx tsc --noEmit && make check                                         # grün
```

Vor der Umsetzung grün erlaubt: keiner (alle neuen Tests importieren neue Module).
