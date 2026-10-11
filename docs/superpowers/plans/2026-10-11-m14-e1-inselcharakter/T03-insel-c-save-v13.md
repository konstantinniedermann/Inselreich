# T03 · Insel C «Weidenau», Save v13 atomar, Pins nachführen (TDD)

Strang SIM · Worktree `.worktrees/m14-e1` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M14E1-01 (Rest), -03/-04
(Weidenau), -11, -15 (C), -19, -20, -21, -24a, -24h, -32 (Liste) · Auflagen Tech-B2, Tech-B3 (Migration), Tech-B5,
Tech-B6, R501 · blocked-by T02 · ≈ 75 Tools · Entscheidungen E3, E4, E5, E6 · Anhang 02 A, B, D

**Zweck:** C anlegen und den Versionssprung **in einem Commit** (Def, Gelände, Version, Migration, Rückfaltung,
Pin-Nachführung); dazwischen wären 77 Bestandstests rot (Messprobe E5).

## Files

- Modify: `src/sim/defs/sea.ts` (`IslandKind` + `'C'`, `ISLANDS[2]` nach Spec §4), `src/sim/islands.ts` (`clipRim`
  und `fallbackTerrain`: Gebirge-zu-Gras für `'A'` und `'C'`, Gebirgsblock nur `'B'`; Tech-B5 — Bedingung über eine
  Konstante `GRASS_ONLY_KINDS: readonly IslandKind[] = ['A', 'C']` in `sea.ts`), `src/sim/types.ts` (`version: 13`),
  `src/sim/world.ts` (`version: 13`), `src/sim/save.ts` (`SAVE_VERSION = 13`, `migrateV12ToV13` in der Kette nach
  `migrateV11ToV12`), `tests/sim/helpers.ts` (`V12_WORLD_KEYS`, `V12_ISLAND_KEYS`, `foldBackToV12`, Kette `>= 12`).
- Create: `tests/sim/save-v13.test.ts`; erweitern: `islandTraits.test.ts`, `islands-c.test.ts`, `helpers.test.ts`.
- Modify **Pins nach E5** (Ownership-Ausnahme Testdateien in `tests/render/`, `tests/ui/`): Gruppe C vollständig,
  Gruppe D nur mit dem Ruling aus dem Gate Plan (Entwurf R-c2) und Kommentar `M14-E1: bewusst neu gepinnt (R<nnn>)`.

## Schritte

- [ ] 0. `grep -n "migrateV11ToV12\|SAVE_VERSION\|isValidIslands\|isValidForeign" src/sim/save.ts`;
      `grep -n "foldBackToV1[01]\|version === 12" tests/sim/helpers.ts`; `grep -rn "toBe(12)\|version: 12" tests/`;
      Insel-Bezüge für Anhang 02 D Regel 3 bestätigen: `grep -n "island\b\|port\|route" src/sim/types.ts`.
- [ ] 1. Rote Tests:
  - `islandTraits.test.ts`: AK-01 (`ISLANDS.length === 3`, `ISLANDS[2]` tief gleich Spec §4), AK-03 Weidenau
    (Zuckerrohr und Schäferei 25/15/10, Gewürzplantage 50), AK-04 Weidenau 24, **AK-11 nach E6**.
  - `islands-c.test.ts`: AK-15 Seed 963 (`onStage` meldet für C Stufe 3; ohne Landüberlappung, Lücke ≥
    `ISLAND_GAP_MIN`, Seeweg 0–3) und `forceLastStage: 'C'` für Seeds 1, 3, 7, 13, 42; A und B gleich der
    T01-Fixture `m14e1-ab-hashes.json`.
  - `save-v13.test.ts`: AK-20 (Anhang 02 F), AK-21 (Vorversion aus `foldBackToV12(serialize(w))`, Seed 3, Kontor II
    und Steinbruch auf der Felsbucht → `islands[3]` tief gleich `createWorld(3).islands[3]` inkl. Schlüsselfolge
    `JSON.stringify`, Inseln 0–2, Gebäude, Schiffe, Geld gleich, `version` 13); **Tech-B3:** gespeicherte A um
    `ox + 3` verschoben → C ohne Überlappung mit dem gespeicherten A, Lücke ≥ `ISLAND_GAP_MIN`, kein Wurf.
    **Tech-B2** prüft das Review: `save.ts` importiert weder `createWorld` noch `world.ts`-Fabriken
    (`grep -n "from './world'" src/sim/save.ts`).
  - `helpers.test.ts`: AK-24a (`foldBackToV12(serialize(createWorld(3)))` → `JSON.stringify` gleich der
    v12-Form auf der Basis; Pin-Wert als FNV-1a-Hash und Länge, auf der Basis gemessen), AK-24h.
- [ ] 2. `npx vitest run tests/sim/islandTraits.test.ts tests/sim/islands-c.test.ts tests/sim/save-v13.test.ts
tests/sim/helpers.test.ts; echo EXIT=$?` → rot.
- [ ] 3. Umsetzen nach E3, E4: Def, Gelände, Version, Migration (eingefrorenes Literal, Lagevergleich), Rückfaltung
      (Positivliste, Unberührt-Prüfung Anhang 02 D Regel 3, Ausgabe ohne Umordnen).
- [ ] 4. Pins nach E5: Gruppe A und B müssen ohne Diff grün werden (sonst Stopp, Meldung). Gruppe C mechanisch:
      Versionspins 12 → 13; Längen und Kind-Listen aus `ISLANDS` statt Literal; `seaGolden` Lanes und Ticks um die
      C-Einträge **ergänzen** (gemessen, `0-1`, `0-2`, `1-2` und `hash` unverändert — AK-19); `reserve-bitgleich` über
      `foldBackToV12` falten (GOLD unverändert; geht das nicht, Gruppe D); `renderer` R3 `islandsDrawn` =
      `1 + ISLANDS.length`; `islandJump` vier Einträge, Index 3 «Weidenau». Gruppe D erst mit Ruling.
- [ ] 5. Grün: alle Dateien aus E5 plus `npx vitest run tests/sim tests/ui tests/render; echo EXIT=$?`.
- [ ] 6. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`. Ein Commit `feat: Insel C Weidenau, Save v13
(M14-E1 T03)`; Gruppe-D-Pins als zweiter Commit `test: Render-Pins M14-E1 nachgeführt (R<nnn>)`.

## Hinweise

- AK-11 (E6): `world.crisis` als Sturm-Literal (`from` ≤ Starttick, `until` ≥ Start + 600), Krisenstufe `off`, damit
  kein zweiter Sturm zieht; beide Plantagen angebunden, Lager leer; Vergleich je Tick in einer Schleife.
- `CHAIN_HASHES`, `V6_FORMS`, `e0Pins.ts`, `e1Pins.ts`, `seePins.ts`: kein Diff (AK-18). Rot → Stopp.
- Testzeit: `save-v13.test.ts` je Test < 200 ms; `islands-c.test.ts` Seed 963 und fünf Pin-Seeds < 200 ms je Test.
