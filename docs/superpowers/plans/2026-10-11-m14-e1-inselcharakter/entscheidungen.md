# M14-E1 · Entscheidungen [Tech], Pin-Inventar, Risiken

Gehört zum [Index](../2026-10-11-m14-e1-inselcharakter.md). Quellen: Spec, Anhänge 01–04, R500, R501, R554, Gate-Berichte
(Tech-B1–B13, QA-B1–B11), Messprobe (E5).

## E1 Zyklus-Leseort (Tech-B1, Spec R1.8, R1.4)

- `cycleOf(world: World, b: Building): number | undefined` in `src/sim/levels.ts` (bisher `cycleOf(b)`).
- Neu daneben, rein: `traitOf(world, island, defId): IslandTrait | undefined` — erster Trait der Insel-Def (Def-Reihenfolge)
  mit `defId` in `TRAIT_BUILDINGS[t]`; Heimat (`kind 'home'`) nie (R1.6); höchstens ein Trait je Betrieb (R1.2).
- `islandCycle(world, island, defId, cycle): number` = `traitOf` ? `Math.max(1, Math.floor(cycle × TRAIT_CYCLE_PCT / 100))`
  : `cycle` (Rundung R1.4: abrunden, Untergrenze 1; heute alle Zyklen gerade, AK-M14E1-02).
  `cycleOf` ruft `islandCycle`; die Bauleiste (Stufe 1 ohne Gebäude) und die Ausbau-Vorschau (`panelView.ts`,
  «x → y / min») rufen `islandCycle` mit dem Def- bzw. `LEVELS`-Zyklus. Der Faktor steht damit an genau einer Stelle.
- `TRAIT_BUILDINGS: Partial<Record<IslandTrait, readonly BuildingId[]>>` (Traits ohne Wirkung ohne Eintrag, Anhang 03 A).
- Die rund 14 Aufrufer in `production.ts`, `flow.ts`, `ui/hover.ts`, `ui/panelView.ts`, `render/ring.ts`,
  `render/errands.ts` ändert **T01 rein mechanisch** mit (Ownership-Ausnahme, Tech-B1); UI-Logik kommt erst in T06.

## E2 Ersatzregel Insel C (Tech-B4, Spec R3.4)

- Stufe 1 und 2 unverändert. **Stufe 3** (neu, ohne Zufall, für jede Def, praktisch nur C):
  1. Suche: Richtungen `k = 0 … FALLBACK_DIRECTIONS − 1`, Abstand `t = dMax + j × FALLBACK_FAR_STEP` für
     `j = 1 … FALLBACK_FAR_STEPS`; erste Lage mit Lücke ≥ `ISLAND_GAP_MIN`, `spanOk` und `lanesClear` (ohne Band).
  2. Konstruktiv (kann nicht scheitern): `ox = max(ox + width aller platzierten) + ISLAND_GAP_MIN`,
     `oy = round(Heimatanker y) − anchor.y`. Lücke ≥ `ISLAND_GAP_MIN` zu jeder Insel gilt per Bau; C liegt ausserhalb
     des Archipel-Rechtecks, also kreuzt C keinen bestehenden Seeweg (Seewege `0-1`, `0-2`, `1-2` und deren `d` bleiben).
     **Gelockert** (Spec R3.4 Punkt 3): `lanesClear` für die Seewege von C und `ARCHIPEL_SPAN_MAX`. Der Seeweg 0–3
     existiert immer (`seaLanes` bildet alle Paare).
- Konstanten in `src/sim/defs/sea.ts`: `FALLBACK_FAR_STEP = 4`, `FALLBACK_FAR_STEPS = 10` (Suche bis `dMax + 40`).
- Testhook in `generateForeignIslands(seed, home, opts)`: `forceLastStage?: IslandKind` (Stufen 1, 2 und 3.1 werden
  übersprungen, die Züge von Stufe 1 aber **gezogen** wie bei `failShapes`, damit spätere Züge gleich bleiben) und
  `onStage?: (kind: IslandKind, stage: 1 | 2 | 3) => void` (Signal R3.4 Punkt 5).
- Export `fitIsland(placed: readonly LaneIsland[], shape: IslandShape, def: IslandDef): PlacedIsland` = Stufe 3 allein
  (für die Migration, E3).

## E3 Migration v12 → v13 (Tech-B2, Tech-B3, Anhang 02 B)

- `migrateV12ToV13(raw)` wirft nie (`try`/`catch`, dann `version = 13`). Nur bei genau 3 Inseln und gültiger Heimat-Lage
  (`ox`, `oy`, `width`, `height`, `anchor` aus `islands[0]`, **gespeichert**, nicht neu berechnet).
- `generateForeignIslands(seed, homeLayout)` liefert A′, B′, C′. Sind `ox`, `oy`, `width`, `height`, `anchor` von A′ und B′
  gleich den gespeicherten Inseln 1 und 2, wird C′ übernommen; sonst `fitIsland([home, A, B gespeichert], C′-Form, def)`.
- Datensatz als **eingefrorenes Literal** der v12-Inselschlüssel in `createWorld`-Folge: `kind, width, height, tiles,
kontorId, stock, ox, oy, anchor, reserve` (`stock` über `GOOD_IDS` wie `addForeignIslands`, `reserve` `{ wood 0,
stone 0 }`). Nie `createWorld`, nie `foreignIslands` aus `world.ts`.
- `migrateV7ToV8` erzeugt über `generateForeignIslands` schon A, B **und** C; die v13-Migration ist dann ein No-op
  (AK-M14E1-22). `addSpiceToIslands` (v8 → v9) und `migrateV11ToV12` (`reserve`) laufen über alle Inseln (Tech-B8).

## E4 Rückfaltung `foldBackToV12` (Anhang 02 D)

`tests/sim/helpers.ts`: `V12_WORLD_KEYS` (= `V11_WORLD_KEYS` + `monument`, `monumentDone`, `buyPct`; Folge aus
`createWorld` @ `9113e574`, eingefroren), `V12_ISLAND_KEYS` (= `V11_ISLAND_KEYS` + `reserve`). Regeln 1–5 aus Anhang 02 D.
Kette: `foldBackToV11` ruft bei `version === 13` zuerst `foldBackToV12`; jede Kettenstelle mit `version === 12`
prüft künftig `>= 12` (Tech-B7). Insel-C-Bezüge: `buildings[*].island`, `ships[*].port`/`to`/`route.a`/`route.b`,
`crisis.tile.island`, `order` (falls Inselbezug) — Feldnamen in T03 Schritt 0 per `grep` bestätigen.

## E5 Pin-Inventar (Spec §6.2, Tech-B6) — gemessen

Messprobe: Kopie von `main` @ `9113e574` im Scratchpad, nur `ISLANDS[2]` (Soll §4), Traits, `quarries 3`, `clipRim`
für C, **ohne** Migration und Rückfaltung; voller Lauf `npx vitest run`: 3536 Tests, 77 rot in 14 Dateien.

- **Gruppe A — grün durch Migration v13, kein Testdiff:** `save.test.ts` (Save v9 V01–V15, AK-E3-06/07, AK-Z3-09,
  Fixture `see-route-start-v9`, AK-T18), `goal3.test.ts` (z3-Fixture, 2), `unlocks.test.ts` AK-E2-09,
  `ui/storage.test.ts` (Lade-Meldung v8), `buyPct-save.test.ts` AK-ZK-17 (2), `save-v11.test.ts` und
  `save-v12.test.ts` («alle Fixtures v1 bis v9»).
- **Gruppe B — grün durch `foldBackToV12` in der Kette, kein Testdiff:** `save.test.ts` T00 «Rezept = Fixture v8»,
  AK-T24 (2), Hash in `seaGolden.test.ts`; `CHAIN_HASHES`, `V6_FORMS` (in der Probe schon grün).
- **Gruppe C — Testdiff ohne Wertänderung:** Versionspins 12 → 13 (`save.test.ts`, `save-v11.test.ts`, `save-v12.test.ts`,
  `buyPct*.test.ts`, `scenario-saves.test.ts`, `unlocks.test.ts`, `tests/tools/renderqa.test.ts`, `helpers.ts`;
  `grep -rn "toBe(12)\|version: 12"`), `save.test.ts` AK-E1-05 (Länge `1 + ISLANDS.length`) und AK-M12-B5 Kette v1–v7
  (Kind-Liste aus `ISLANDS`), `islands-gen.test.ts` AK-E1-01 (Kind-Liste), AK-E1-02 und AK-E1-04 (Seewege 3 → 6),
  `seaGolden.test.ts` (Lanes und Ticks: Einträge mit 3 **zusätzlich**, `0-1`, `0-2`, `1-2` unverändert; AK-M14E1-19),
  `reserve-bitgleich.test.ts` (Zustand vor dem Hash über `foldBackToV12` falten, `GOLD` bleibt), `render/renderer.test.ts`
  R3 `islandsDrawn` 3 → 4 (`1 + ISLANDS.length`), `ui/islandJump.test.ts` (vier Einträge, AK-M14E1-32),
  `ui/islandCard.test.ts` (Felsbucht nach Anhang 03 A, T01).
- **Gruppe D — Wert ändert sich, nicht faltbar, Ruling nötig (Entwurf R-c2):** `render/renderer.test.ts` AK-E1-10
  Heimat-Aufrufliste (Meer-Plan hängt über `seaContext` von allen Fremdinseln ab), `render/seaKorridor.test.ts` AK-K1b
  und AK-K2 (Hash der Meerflächen), `render/limits.test.ts` AK-E1-21 Archipel-Speicher ≈ 44,5 MB → ≈ 56,8 MB
  (`ARCHIPEL_EXTRA_BYTES` rechnet über `ISLANDS`; +12,3 MB für C, `ARCHIPEL_LAYER_SCALE` bleibt 2, lead-art B4).

## E6 AK-M14E1-11 Sturm (R501, am Code geprüft)

`TRAIT_BUILDINGS.fertile` enthält `canefarm` (Spec §4, Anhang 01 C), R1.3 nennt Weidenau 25 statt 50: **Fruchtbar
ändert den Zyklus.** Die Vorbedingung von AK-11 trifft nicht zu, es gilt der Vergleich nach Zyklus-Skalierung:
`production.ts` lässt im Sturm jeden Tick mit `tick % STORM_TICK_DIVISOR !== 0` aus, für beide Plantagen dieselben
Ticks. Prüfung je Tick: `state` gleich; `progress` steigt in denselben Ticks; `progressW === progressH % cycleW` mit
`cycleW = cycleOf(world, plantageW)`. Erwartung nach 600 Ticks ab `progress 0`: aktive Ticks
`n = |{t : t % STORM_TICK_DIVISOR === 0}|`, Ausstoss Heimat `floor(n / cycleH)`, Weidenau `floor(n / cycleW)`
(heute 300 → 6 und 12), im Test berechnet, kein neuer Wert.

## E7 Wertgrenzen (R553 V1)

| Grenze                                 | Grundlage                                                                                            | Läufe                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| AK-14 Stufe 3 ≤ 3 von 1000             | Seeds 1…1000                                                                                         | 1000 unabhängige Lagen      |
| AK-17 ≥ 3 Steinbruch-Plätze Felsbucht  | Seeds 1…300 (gemessen Min 13)                                                                        | 300                         |
| AK-16 ≥ 6 Plantagenplätze auf C        | Seeds 1…300 plus `failShapes`                                                                        | 301                         |
| AK-12 A/B bitgleich                    | Seeds 1…1000, 963, Pins                                                                              | 1006                        |
| Controller gründet nie auf B/C (QA-B3) | Seeds 3 und 963 (verschiedene Fremdinsel-Lagen; Heimkolonie seed-unabhängig, Beobachtung 2026-10-11) | 2                           |
| Balancing, Sieg-Ticks                  | unverändert, bitgleich (AK-18); E1 berührt die Heimat nicht                                          | keine neue Grenze           |
| B3-Rangfolge P1 > P2 > P3 (QA-B2)      | Rechnung [R], kein Lauf                                                                              | **Risiko mit Rückfall**, E8 |

## E8 Risiken und Rückfall

- **B3-Rangfolge (QA-B2):** Eingaben seit `adb7e28e` unverändert (Preise, Zyklen, Unterhalt, `SHIP`; neu nur
  `BUY_RISE = 0`, `BUY_RECOVERY_INTERVAL`, Denkmal-Def). Kippt sie nach I-048 Schritt B (`BUY_RISE` > 0) oder im
  Playtest: Entwurf an L0, Rückfall V-C (nur Glashütte ×2) oder `TRAIT_BUILDINGS` kürzen. Optional misst
  `plan-TOOL-GATE-ENSEMBLE` nach (nicht blockierend).
- **Stufe 3 konstruktiv:** Spanne über `ARCHIPEL_SPAN_MAX` nur bei erzwungener Stufe; T02 protokolliert die Spanne
  über Seeds 1…300 mit `forceLastStage: 'C'`. Rückfall: konstruktiv links statt rechts, gleiche Garantie.
- **Testzeit:** 1000-Seed-Läufe; Budget je Block in T05. Rückfall: Seeds 1…1000 nur über `generateForeignIslands` mit
  zwischengespeicherter Heimat-Lage je Seed statt `createWorld`.
- **Save-Version verschiebt sich** (Release-Fix an `main`): T00 zieht Zahlen und Basis-Commit nach (R554).
