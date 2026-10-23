# T01 · Typ, Defs, Fahrzeit-Helfer, `decree` mit Umrechnung

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-SR-1 bis AK-SR-4, AK-SR-5 (Umrechnung, ohne Rückruf), Step 0 Seed-Suche (R828 B3) · blocked-by: – · Worktree `.worktrees/seerecht` (`feat/seerecht` ab `plan/seerecht`, vorher `git merge main`) · Spec §3.1–§3.4, §5 (nur `isSide`)

## Dateien

- ändern: `src/sim/types.ts`, `src/sim/defs/council.ts`, `src/sim/islands.ts`, `src/sim/council.ts`, `tests/sim/council.test.ts`, `tests/sim/seaHelpers.ts`, `tests/sim/seePins.ts` (neue Pins `SEED_D30`, `SEED_D35`, ggf. Versatz)
- nur Typ-Anpassung, Verhalten gleich (Zeilen-Okay R828 N4): `tests/ui/council.test.ts`, `tests/ui/councilCard.test.ts` (nur falls `tsc` dort wegen `CouncilSide` mit `'C'` fällt; keine Erwartung ändern), `src/ui/council.ts` (nur `const sides = ['A', 'B'] as const` statt `CouncilSide[]`; Zeile 46 bleibt, drei Karten und Liste erst in T04), `src/ui/app.ts` **nur** Zeile ≈ 633 (`COUNCIL[tier][side]?.name ?? side`), kein Import-Diff
- nicht ändern: `src/sim/defs/sea.ts`, `src/sim/save.ts` (T05), `ships.ts`/`routeBalance.ts` (T02), Render/UI-Leser

## Interfaces

- Produces (von T02–T05 genutzt):
  - `types.ts`: `CouncilSide = 'A' | 'B' | 'C'`; `CouncilLever` um `{ kind: 'seaTileTicks'; value: number }`
  - `defs/council.ts`: `export type CouncilSides = Readonly<Record<'A' | 'B', CouncilDef>> & { readonly C?: CouncilDef }`; `COUNCIL: Readonly<Record<CouncilTier, CouncilSides>>`; `COUNCIL[4].C = { name: 'Seerecht', text: <Kartentext Spec §3.1 wörtlich>, lever: { kind: 'seaTileTicks', value: 8 } }`; `COUNCIL_NOTE = 'Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen.'`
  - `islands.ts`: `travelTicks(d: number, perTile = SHIP_TICKS_PER_SEA_TILE): number`; `laneTicks(islands, a, b, perTile = SHIP_TICKS_PER_SEA_TILE): number` (gleiche Rechnung, Faktor aus Parameter)
  - `council.ts`:
    - `seaTileTicks(world: Pick<World, 'council'>): number` (Hebel `seaTileTicks`, sonst `SHIP_TICKS_PER_SEA_TILE`)
    - `travelTicksOf(world: Pick<World, 'council'>, d: number): number` = `travelTicks(d, seaTileTicks(world))`
    - `laneTicksOf(world: Pick<World, 'islands' | 'council'>, a: number, b: number): number` = `laneTicks(world.islands, a, b, seaTileTicks(world))` (genau **ein** `laneTicks`-Aufruf, `ships-rng.test.ts` zählt ihn)
    - `isCouncilSide(tier: CouncilTier, side: unknown): side is CouncilSide` (String und `COUNCIL[tier][side] !== undefined`)
    - `councilSides(tier: CouncilTier): CouncilSide[]` (Reihenfolge A, B, C; nur vorhandene)
  - `tests/sim/seaHelpers.ts`: `laneWorld(d: number): { w: World; island: number }` — Welt mit Kontor auf `island` (≥ 1), `laneTicks(w.islands, 0, island) === SHIP_TICKS_PER_SEA_TILE * d`, deterministisch aus den Pins von Step 0 (keine Suche zur Laufzeit); wirft mit Klartext, wenn der Pin nicht mehr passt.

## Verhalten

1. `activeLever(world, kind, key?)`: überspringt `null`/`'open'`, liest `COUNCIL[t][side]` (C nur auf 4 vorhanden), vergleicht `key` nur bei Hebeln mit `defId`/`tier`; `seaTileTicks` ohne Schlüssel.
2. `decreeReason`: `isSide` wird `isCouncilSide(tier, side)` (nach `isTier`); Reihenfolge der Gründe unverändert («Ungültige Stufe», «Ungültige Seite», «Beschluss nicht offen», «Schon beschlossen»).
3. `decree`: `alt = seaTileTicks(world)` vor dem Setzen, `neu` danach; bei `neu !== alt` für jedes Schiff mit `to !== null` (auch `homing`): `left = Math.max(1, Math.ceil((left * neu) / alt))`. Liegende Schiffe, Hafen, Ziel, Ladung, Route unverändert. Abgewiesenes `decree` rechnet nichts. Kein Literal 8/10.
4. Kopfkommentar `council.ts`: Fahrzeit als vierter Hebel im einzigen Leseort ergänzen.

## Steps

- [ ] **Step 0 Seed-Suche (zuerst, R828 B3):** kurze Probe-Testdatei (`tests/sim/probe-seed.test.ts`, nicht committen, nach dem Lauf löschen; Lauf unter Testsperre): für Seeds 1–500 `createWorld(seed)` (wie `seaWorld`), je Fremdinsel i `d = laneTicks(w.islands, 0, i) / SHIP_TICKS_PER_SEA_TILE`; ersten Seed mit d 30 und ersten mit d 35 notieren (Insel-Index dazu). Ohne Fund: Inselversatz (`ox`/`oy` der Insel schrittweise ±1, höchstens 20 Schritte je Richtung, Insel bleibt ohne Überlappung) prüfen. Ergebnis als `SEED_D30`, `SEED_D35` (+ Insel, ggf. Versatz) in `tests/sim/seePins.ts` (Muster `SEED_D37`). **Findet sich weder per Seed noch per Versatz d 30 bzw. d 35: sofort `blocked` an den Controller mit Messwerten (vorkommende d je Seed, Versatz-Ergebnis), kein Ausweichen auf andere d** (AK-Zahlen sind Spec-Werte, Fixture-Ruling L0).
- [ ] **Test rot** in `tests/sim/council.test.ts`, neuer Block `describe('I-153 Seerecht')`; Z. 76 auf den neuen Notiz-Text (AK-SR-1/F1).
  - `AK-SR-1`: `Object.keys(COUNCIL[4])` = `['A','B','C']`, `COUNCIL[2]`/`[3]` = `['A','B']`; `COUNCIL[4].C` Name, Text wörtlich, `lever` `{ kind: 'seaTileTicks', value: 8 }`; `SHIP_TICKS_PER_SEA_TILE === 10`; `councilSides(4)` = `['A','B','C']`, `councilSides(2)` = `['A','B']`.
  - `AK-SR-2`: `council[4] = 'open'` → `decree(w, 4, 'C')` `{ ok: true }`, `council[4] === 'C'`; `decree(w, 4, 'A')` → `{ ok: false, reason: 'Schon beschlossen' }`, Wert `'C'`; `council[4] = null` → «Beschluss nicht offen».
  - `AK-SR-3`: Stufe 2 und 3 offen: `decree(w, 2, 'C')`, `decree(w, 3, 'C')`, `decree(w, 4, 'D')`, `decree(w, 4, null)` je «Ungültige Seite», `JSON.stringify(w)` vorher = nachher, `expect(() => …).not.toThrow()`.
  - `AK-SR-4`: ohne Beschluss, mit `council[4]` `'A'`/`'B'`, mit `council[2]`/`[3]` gesetzt: `seaTileTicks` 10, `travelTicksOf(w, 30)` 300, `laneTicksOf(w, 0, i)` = `laneTicks(w.islands, 0, i)` für alle i; mit `'C'`: 8, 240, `laneTicksOf(w, 0, island)` = 8 × d (über `laneWorld(30)`), `laneTicksOf(w, 2, 2)` = 0.
  - `AK-SR-5` (Teil): vier fahrende Schiffe (`shipLiteral` aus `seaHelpers`) mit `left` 350, 7, 2, 1 → nach `decree(w, 4, 'C')` 280, 6, 2, 1; liegendes Schiff `to`/`left` gleich; `homing`-Schiff `left` 100 → 80; Hafen, Ziel, `cargo`, `route` je `toEqual` vorher; zweites `decree` (abgewiesen) ändert kein `left`.
  - Review Focus 4: Schiff `left` 1, `decree`, ein `step` → Schiff liegt im Zielhafen (`to === null`, `port` = Ziel).
- [ ] **Lauf rot:** `npx vitest run tests/sim/council.test.ts; echo EXIT=$?` → Exit ≠ 0 (fehlende Exporte).
- [ ] **Umsetzen** nach Interfaces und Verhalten; Typfehler in `src/ui/council.ts`, `src/ui/app.ts` und Bestandstests (`council.test.ts` Z. 51/455) nur typseitig beheben.
- [ ] **Lauf grün:** `npx vitest run tests/sim/council.test.ts tests/sim/ships-rng.test.ts tests/ui/council.test.ts tests/ui/councilCard.test.ts; echo EXIT=$?` → 0; `npx tsc --noEmit; echo EXIT=$?` → 0; eslint/prettier auf alle geänderten Dateien → 0.
- [ ] **Commit:** `feat: Seerecht-Karte, Fahrzeit-Helfer und Umrechnung beim Beschluss (I-153 T01)`.

## Task-Review

Kein Literal 8/10 ausserhalb `defs/`; `laneTicksOf` ruft `laneTicks` genau einmal; `decree` generisch über `alt`/`neu`; `app.ts`-Diff eine Zeile, kein Import; `ui/council.ts` ohne Verhaltensänderung; `council.ts` importiert nur `types`, `defs/*`, `islands` (kein Zyklus: `islands.ts` importiert `council.ts` nicht).
