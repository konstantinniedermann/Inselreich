> **Task-ID:** Task 4 (Paket M10-S2) — Teil 3 von 3
> **AK-IDs:** AK-S2-01 … -17, AK-S1-14 (c2), AK-F1-09 (b), `RF-2`, `PLAN-B9`, BG-1
> **blocked-by:** Task 2, Task 3
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T04a-amtsstube.md](T04a-amtsstube.md) · [T04b-amtsstube.md](T04b-amtsstube.md) · **T04c-amtsstube.md** (diese)

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/sim/townhall.test.ts tests/sim/imports.test.ts -t "M10"` →
      FAIL (`Cannot find module '../../src/sim/townhall'`; `PLAN-B9` FAIL „ENOENT townhall.ts"). **Vor der Umsetzung
      grün erlaubt:** keiner.
- [ ] **Schritt 3: Typen und Defs.** `types.ts`: `BuildingDefId` + `'townhall'` (am Ende), `BuildingState` +
      `'noService'`, `BuildingDef.requiresService?: ServiceId`, `BuildingDef.maxCount?: { n: number; reason: string }`.
      `defs/buildings.ts` am **Ende** von `BUILDING_DEFS`:

```ts
  townhall: {
    id: 'townhall',
    name: 'Amtsstube',
    w: 2,
    h: 2,
    cost: cost(200, 15, 2, 5),
    upkeep: 20,
    category: 'public',
    flammable: true,
    maxCount: { n: 1, reason: 'Es gibt schon eine Amtsstube' },
    site: [],
  },
```

und bei `toolmaker` `requiresService: 'school',`. `defs/unlocks.ts`: U3 `buildings: ['townhall']`.

- [ ] **Schritt 4: `src/sim/townhall.ts`** (Blatt, B9):

```ts
import { FUNCTION_ENTRY } from './defs/unlocks';
import type { Building, GoodId, TaxLevel, Tier, World } from './types';

const townhalls = (w: World): Building[] =>
  Object.values(w.buildings).filter((b) => b.defId === 'townhall');

/** Spec 5.1: eine Amtsstube steht, ist angebunden und ohne Ausfall (wie serviceAvailable, ohne Radius). */
export function townhallActive(w: World): boolean {
  return townhalls(w).some((b) => b.connected && b.outageUntil === undefined);
}
/** Grund für alle Amtsstuben-Aktionen ohne Wirkung (Spec 5.1). */
export function townhallReason(w: World): 'Braucht eine Amtsstube' | 'Amtsstube wirkt nicht' {
  return townhalls(w).length === 0 ? 'Braucht eine Amtsstube' : 'Amtsstube wirkt nicht';
}
/** Spec 5.2: gespeicherte Stufe nur mit aktiver Amtsstube, sonst „normal". */
export function effectiveTaxLevel(w: World): TaxLevel {
  return townhallActive(w) ? w.taxLevel : 'normal';
}
/** Spec 5.3: wirkt nur mit freier Ausgabesperre (U5) und aktiver Amtsstube; leer → sofort false (bitgleich). */
export function goodLockActive(w: World, tier: Tier, good: GoodId): boolean {
  return (
    w.goodLocks.some((l) => l.tier === tier && l.good === good) &&
    w.unlocked.includes(FUNCTION_ENTRY.goodLocks) &&
    townhallActive(w)
  );
}
/** Spec 5.4: wirkt nur mit aktiver Amtsstube; leer → sofort false. */
export function upgradeStopActive(w: World, tier: Tier): boolean {
  return w.upgradeStops.includes(tier) && townhallActive(w);
}
```

- [ ] **Schritt 5: Wirkung.**
  - `population.ts`: Import aus `./townhall`. `upgradeStatus` (Wartezeit), `houseCap` (Belegung), `totalTaxes`
    (Prozent): `TAX_LEVELS[world.taxLevel]` → `TAX_LEVELS[effectiveTaxLevel(world)]` (drei Stellen; `grep -n
"TAX_LEVELS\[world.taxLevel\]" src/sim` danach leer). `consume`: nach dem Zweig `!house.supplied`:

```ts
if (goodLockActive(world, house.tier, good)) {
  const demand = (house.demand[good] ?? 0) + (house.inhabitants * rate) / 100;
  house.demand[good] = Math.min(demand, 1); // wie leeres Lager (Spec 5.3)
  house.satisfied[good] = false;
  continue;
}
```

`upgradeStatus`: direkt nach dem M8-Sperrgrund `if (upgradeStopActive(world, house.tier)) reasons.push('Aufstieg in der Amtsstube angehalten');`;
in der Schleife über `newNeeds(current, next)`: `if (goodLockActive(world, next.tier, g)) reasons.push(\`${GOODS[g].name} für ${next.name} gesperrt\`); else if (world.stock[g] < 1) …` (bisheriger Satz).

- `production.ts` `tickProduction`: nach der Anbindungsprüfung, vor Sturm und Input:

```ts
const svc = def.requiresService;
if (svc !== undefined && !serviceAvailable(world, b, svc)) {
  b.state = 'noService'; // kein Fortschritt, keine Entnahme; Unterhalt läuft weiter (Spec 5.5)
  continue;
}
```

(Import `serviceAvailable` aus `./population`; Schleifenform an den Bestand anpassen.)

- `tax.ts`: `setTaxLevel` nach Spec 5.2 (unbekannt → `'Ungültige Stufe'`; `!townhallActive` →
  `townhallReason`; gleich → `'Stufe bereits aktiv'`; Sperrzeit → `'Sperrzeit'`), neu:

```ts
export function setGoodLock(world: World, tier: number, good: string, locked: boolean): Result {
  const lock = functionLock(world, 'goodLocks');
  if (lock !== null) return fail(lock);
  if (!townhallActive(world)) return fail(townhallReason(world));
  if (
    (tier !== 1 && tier !== 2 && tier !== 3 && tier !== 4) ||
    !GOOD_IDS.includes(good as GoodId) ||
    !Object.hasOwn(TIERS[tier].needs, good)
  )
    return fail('Ungültige Sperre');
  const rest = world.goodLocks.filter((l) => !(l.tier === tier && l.good === good));
  world.goodLocks = (locked ? [...rest, { tier, good: good as GoodId }] : rest).sort(
    (a, b) => a.tier - b.tier || GOOD_IDS.indexOf(a.good) - GOOD_IDS.indexOf(b.good),
  );
  return ok;
}

export function setUpgradeStop(world: World, tier: number, stopped: boolean): Result {
  if (!townhallActive(world)) return fail(townhallReason(world));
  if ((tier !== 1 && tier !== 2 && tier !== 3 && tier !== 4) || TIERS[tier].upgradeCost === null)
    return fail('Ungültige Stufe');
  const rest = world.upgradeStops.filter((t) => t !== tier);
  world.upgradeStops = (stopped ? [...rest, tier] : rest).sort((a, b) => a - b);
  return ok;
}
```

- `placement.ts` `canPlace`: direkt nach der Sperrprüfung
  `const max = def.maxCount; if (max !== undefined && Object.values(world.buildings).filter((b) => b.defId === defId).length >= max.n) return fail(max.reason);`
  (keine Abfrage der Id `townhall`).
- `unlocks.ts` `nextUnlocks`: `taxBlocks: effectiveTaxLevel(w) === 'high' && (u.trigger.kind === 'tierWish' || u.trigger.kind === 'tierReached')`
  (Import aus `./townhall`).
- Ausnahmen: `src/render/sprites.ts` `SILHOUETTES.townhall` = Rückfall wie `public`-Gebäude ohne eigene Form (Muster
  M8 `bathhouse`); `src/ui/hotkeys.ts` `i: { kind: 'build', defId: 'townhall' }` (nach `o`); `src/ui/texts.ts`
  `stateInfo` für `noService`: `Braucht eine ${BUILDING_DEFS[SERVICE_BUILDING[def.requiresService!]].name} in Reichweite`,
  `ok: false`; `src/ui/hints.ts` `REASON_TABLE` + zwei Zeilen (oben); `overlays.ts` nur, falls `tsc` einen
  unvollständigen `switch` meldet (Kartenzeichen wie `waitingInput`, Spec 5.5).
- Tests T-8, T-10 (`placeTownhall` in die Steuer-Testwelten von `taxes.test.ts`/`population.test.ts`), AK-S1-01
  Zeile U3; `tests/sim/scenarios.ts` `galerie` + Amtsstube (über `unlockAll`, angebunden, Lage im Bericht).
- [ ] **Schritt 6: Grün prüfen.** `npx vitest run`; `npx tsc --noEmit`; `make check`;
      `grep -rn "taxLevel\]" src/sim` zeigt nur `townhall.ts`-fremde Stellen ohne `TAX_LEVELS[world.taxLevel]`.
- [ ] **Schritt 7: BG-1** vollständig (AK-S2-14: AK-S1-16 und AK-S1-17 grün nach S2); Testzählbefehl.
- [ ] **Schritt 8: Commit.** `git add src tests && git commit -m "feat: M10-S2 Amtsstube, wirksame Steuer, Ausgabesperre, Werkzeugmacher braucht Schule (Spec 5)"`

---
