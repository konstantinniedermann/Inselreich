# Plan UI-HAEPPCHEN-H · I-147 Zweiter Autosave-Platz «Davor» + I-146 Wirkkreis bei Auswahl (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-22-ui-haeppchen-h-design.md` (`design/ui-haeppchen-h` @ `acf7d5ef`, AK-H1 bis H24), Gate OK R807 (F1 bis F7). Plan gegen main `43482a4a`, ohne Testläufe (Testsperre ORT-A/UI-G). Task-Dateien in [`2026-10-22-ui-haeppchen-h/`](2026-10-22-ui-haeppchen-h/).
Spielerwirkung: P1 lädt nach einem Fehlklick einen Stand von vor 2 bis 4 Minuten («Autosave davor»). P2 zeigt bei ausgewählter Kapelle, Schule, Feuerwache und Bad den Wirkkreis.
**Kein Save** (`SAVE_VERSION`, Slot-Format, `types.ts` ohne Diff; ein zusätzlicher Browser-Schlüssel `inselreich.save.auto.last`, kein Spielstand), **kein Spielwert**, keine Abhängigkeit (ADR-001), kein ADR (F1 bis F7 stehen in R807). **Kein `src/sim/`-Diff.**

## Entscheide des Plans

- **P-1 Zwei Stränge, zwei Branches, zwei Worktrees** (Dateien disjunkt, Bedingungen verschieden): Strang 1 = P1 (`feat/ui-haeppchen-h-p1`, `.worktrees/ui-haeppchen-h-p1`), Strang 2 = P2 (`feat/ui-haeppchen-h-p2`, `.worktrees/ui-haeppchen-h-p2`). Beide ab `plan/ui-haeppchen-h`, vor Start `git merge main`. Getrennte Branches, damit P1 früh nach main geht und P2 auf ORT-A wartet.
- **P-2 Startbedingungen (R807 F7):** P1 darf starten, wenn UI-HAEPPCHEN-G nach main gemergt ist (`app.ts` `loadSlotPaused`, Slot-Typ; Ladepfad von I-148). P2 startet erst nach dem ORT-A-Merge nach main (`renderer.ts`, `overlays.ts`); Stadtplanung-Merge ist für P2 **nicht** Bedingung, aber wünschenswert (P-5).
- **P-3 `saveAuto` teilt sich in zwei Zugriffe:** periodisch `saveAuto(world)` (schreibt in `otherAuto`, setzt Zeiger) und `saveAutoNewest(world)` (schreibt in `newestAuto`, Zeiger unverändert) für `pagehide`. `autosaveOnHide(world, write = saveAutoNewest)` behält die injizierbare Signatur (bestehender Test bleibt grün). Reine Helfer `newestAuto(storage)` und `otherAuto(storage)` über `StorageLike`, damit `startChoices`/`menu` sie ohne Welt nutzen (Test mit Fake-`StorageLike`).
- **P-4 `hasAuto`/`slot === 'auto'`-Stellen:** die Umsetzung sucht per `rg "'auto'" src/ui` alle Vergleiche mit dem Slot (`startCard.ts`, `menu.ts`, `app.ts`) und stellt sie auf `newestAuto`/«irgendein Autosave» um (Spec Regeln 5 bis 7). Liste im Bericht.
- **P-5 P2 und `OverlayPlan.rings` (Befund aus `git diff main...feat/stadtplanung`):** Stadtplanung erweitert `OverlayPlan` um `rings` und `overlayPlan`/`drawPlacementOverlay` (Ringzeichner am Ende von `drawPlacementOverlay`). Folge für P2: `selectionPlan` liefert `{ circle, coverage: null, highlight: [], rings: [] }`, **falls** das Feld beim Start von P2 in main steht; sonst ohne `rings`. Der Umsetzer prüft `rg "rings" src/render/overlays.ts` vor dem Schreiben. `drawOverlayCircle` wird aus dem Kreis-Teil gelöst, der Ringzeichner bleibt unberührt (AK-H21).
- **P-6 Auswahl-Block in `renderer.ts`:** ORT-A hat dort 11 Zeilen umgebaut (`render()`, Hunk `@@ -1129,11 +1199`, Auswahl bei `selB`/`sel`). P2 liest den Block nach dem ORT-A-Merge neu und fügt genau einen Aufruf `drawSelectionCircle` vor der gelben Umrandung ein, mit Bedingung «kein Bau-Werkzeug» (`hover.tool.kind !== 'build'`); die Funktion selbst steht in `overlays.ts`, nicht im Renderer (kleiner Hunk).
- **P-7 Render-Anteil von P2 macht `tech-ui-engineer`** (zwei kleine Dateien, ein Aufruf im Renderer; Spec nennt beide Personas). `art-rendering-engineer` nur, falls ORT-A den Auswahl-Block grundlegend umbaut (Umsetzer meldet dann `blocked`).

## Konflikt- und Merge-Reihenfolge (geprüft mit `git diff main...<branch>`)

| Datei                                          | UI-G                                          | Stadtplanung                                | ORT-A                                   | H                                                                                 | Befund                                                                                                                                                                                                                                    |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/app.ts`                                | 2 Zeilen (Import, Aufruf in `loadSlotPaused`) | 7 Hunks, u. a. Z. ≈ 496 in `loadSlotPaused` | 3 Hunks (Z. ≈ 170, 1528 bis 1531, 1717) | P1: Import, `saveAuto`-Stelle Z. ≈ 1756, `onPageHide`, `newIslandPrompt`-Argument | **Nähe, kein Zeilenkonflikt erwartet**: H-Hunks liegen im Autosave-Block (≈ 1752), G/Stadtplanung in `loadSlotPaused` (≈ 496); ORT-A-Hunk 1528 bis 1531 liegt direkt neben `startChoices` (Z. ≈ 1523): möglicher Kontextkonflikt, trivial |
| `src/ui/storage.ts`, `menu.ts`, `startCard.ts` | kein Diff                                     | kein Diff                                   | kein Diff                               | nur P1                                                                            | keiner                                                                                                                                                                                                                                    |
| `src/render/overlays.ts`                       | –                                             | `rings`, Ringzeichner (28 Zeilen)           | – (kein Diff)                           | nur P2                                                                            | Konflikt-Nähe am Ende von `drawPlacementOverlay` (Kreis-Auslagerung neben Ringschleife); P-5                                                                                                                                              |
| `src/render/renderer.ts`                       | –                                             | kein Diff                                   | 112 Zeilen, `render()` Auswahl-Hunk     | nur P2                                                                            | P2 wartet auf ORT-A (Ruling R806/R807)                                                                                                                                                                                                    |
| `README.md`                                    | 3 Zeilen                                      | –                                           | –                                       | P1 und P2, je eigener Abschnitt                                                   | getrennte Abschnitte (Speichern/Laden bzw. Radiusanzeige), Textkonflikt unwahrscheinlich                                                                                                                                                  |

**Reihenfolge-Vorschlag:** UI-G → P1 (frei von Stadtplanung/ORT-A bis auf `app.ts`-Nähe); ORT-A → P2 (Stadtplanung davor oder danach; wer später mergt, löst `overlays.ts` per `git merge main`, kein Rebase). Jeder H-Strang hält den `app.ts`-Diff in einem **eigenen Commit** (nur P1).

## Dateimatrix (Ownership)

| Datei                                                                                                                                  | T01 | T02 | T04          | T05 | T07          |
| -------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ------------ | --- | ------------ |
| `src/ui/storage.ts`, `tests/ui/storage.test.ts`                                                                                        | ja  |     |              |     |              |
| `src/ui/menu.ts`, `src/ui/startCard.ts`, `tests/ui/menu.test.ts`, `tests/ui/startCard.test.ts`                                         |     | ja  |              |     |              |
| `src/ui/app.ts` (eigener Commit)                                                                                                       |     | ja  |              |     |              |
| `src/render/overlays.ts`, `src/render/renderer.ts` (Auswahl-Aufruf), `tests/render/overlays.test.ts`, `tests/render/renderer*.test.ts` |     |     |              | ja  |              |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md`                                                                 |     |     | ja (P1-Teil) |     | ja (P2-Teil) |

Nicht angefasst: `src/sim/`, `src/audio/`, `src/style.css`, `src/ui/hud.ts`, `docs/studio/`, Specs. T03 und T06 (Browser-Check) ändern keine Datei.

## Tasks

| Task | Titel                                                                  | Datei                     | AK-IDs                     | Strang | blocked-by    | Modell | Tools | Persona            |
| ---- | ---------------------------------------------------------------------- | ------------------------- | -------------------------- | ------ | ------------- | ------ | ----- | ------------------ |
| T01  | P1: Zeiger, `newestAuto`/`otherAuto`, `saveAuto`, `pagehide`, Probleme | `T01-autosave-platz.md`   | H1 bis H3, H5, H6, H8, H10 | 1      | UI-G gemergt  | sonnet | 45    | `tech-ui-engineer` |
| T02  | P1: Ladeliste, Startkarte, «Neue Insel», `app.ts`-Anbindung            | `T02-liste-startkarte.md` | H4, H7, H9                 | 1      | T01           | sonnet | 45    | `tech-ui-engineer` |
| T03  | P1: Browser-Check und Grössenmessung (`qa-playtester`)                 | `T03-playtest-p1.md`      | H11 bis H13                | 1      | T02           | sonnet | 30    | `qa-playtester`    |
| T04  | P1: Doku (D1, E-017)                                                   | `T04-doku-p1.md`          | –                          | 1      | T03           | sonnet | 15    | `tech-ui-engineer` |
| T05  | P2: `selectionPlan`, `drawOverlayCircle`, Auswahl-Aufruf               | `T05-wirkkreis.md`        | H14 bis H21                | 2      | ORT-A gemergt | sonnet | 45    | `tech-ui-engineer` |
| T06  | P2: Browser-Check (`qa-playtester`)                                    | `T06-playtest-p2.md`      | H23, H24                   | 2      | T05           | sonnet | 25    | `qa-playtester`    |
| T07  | P2: Doku (D1, E-017)                                                   | `T07-doku-p2.md`          | –                          | 2      | T06           | sonnet | 10    | `tech-ui-engineer` |

Nur Lauf (kein eigener Test): AK-H10 und AK-H22 (`git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `balance.test.ts` grün) im Abschluss je Strang.

## Budget (Vorschlag für das Gate Plan)

**Gesamt 11 Starts, Parallelität 2** (Strang 1 und 2 nur dann gleichzeitig, wenn ORT-A und UI-G gemergt sind; sonst 1). Geplant **9**: Strang 1 sechs (T01-Umsetzer 1, T01-Review sonnet 2, T02-Umsetzer 3, T02-Review 4, T03 `qa-playtester` 5, Final-Review `qa-code-reviewer` **opus** über die ganze Branch 6); Strang 2 drei (T05-Umsetzer 7, T05-Review als Final-Review **opus** 8, T06 `qa-playtester` 9; bei nur einem Umsetzer-Task gilt der opus-Review als Final-Review). **Reserve 2** für Fix-Runden ohne `SendMessage`-Weg; Delta-Review (R553) per `SendMessage` zählt nicht. T04, T07 und Fix-Runden per `SendMessage` an die jeweilige Umsetzer-Instanz (zählen nicht). Controller: Lead auf `sonnet` (Controller-Regel), pro Strang höchstens 4 Tasks je Instanz; 12 Tools Steuerung je Start.
Rechnung Strang 1: 6; Strang 2: 3; 9 × 1,3 aufgerundet = 11.

## Test- und Prüfpflichten (für jedes Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting` melden).
- **Gezielt, nie `make check` je Task:** T01 `npx vitest run tests/ui/storage.test.ts; echo EXIT=$?`. T02 `npx vitest run tests/ui/storage.test.ts tests/ui/menu.test.ts tests/ui/startCard.test.ts; echo EXIT=$?`. T05 `npx vitest run tests/render/overlays.test.ts tests/render/renderer*.test.ts; echo EXIT=$?` (Dateinamen vorher mit `ls tests/render` prüfen). Je Task `npx tsc --noEmit; echo EXIT=$?` (R398) und `npx eslint <Dateien> && npx prettier --check <Dateien>; echo EXIT=$?`.
- **Rot zuerst:** Test vor der Umsetzung laufen lassen, rote Ausgabe (Exit ≠ 0) im Bericht.
- **Zeittests (R270):** keine berührte Datei steht in `ZEITTESTS`; neue Tests nutzen keine Uhr. Spielzeiten in Erwartungen über `formatGameTime`/die vorhandene Formatierung, nie als Literal geraten.
- **Abschluss je Strang (Controller, einmal):** `make check; echo EXIT=$?` bei freier Sperre, `tests/sim/balance.test.ts` grün, `git diff main -- src/sim` leer.
- **Keine `Contract`-Literale** in neuen Tests (R679-2); Fake-`StorageLike` mit `getItem`/`setItem`/`removeItem` nach Vorbild der Bestandstests in `tests/ui/storage.test.ts`.

## AK-Zuordnung (24 AK)

| AK                    | Beleg                                                                   | Task           |
| --------------------- | ----------------------------------------------------------------------- | -------------- |
| H1 bis H3, H5, H6, H8 | `tests/ui/storage.test.ts`                                              | T01            |
| H4                    | `tests/ui/menu.test.ts`                                                 | T02            |
| H7, H9                | `tests/ui/startCard.test.ts` (H9: `newIslandPrompt`)                    | T02            |
| H10, H22              | Lauf: Byte-Gleichheit `serialize` im Test T01; Sim-Diff leer, `balance` | T01, Abschluss |
| H11 bis H13           | Browser-Check, Screenshots `.studio/qa/ui-haeppchen-h/`                 | T03            |
| H14 bis H21           | `tests/render/overlays.test.ts`, `tests/render/renderer*.test.ts`       | T05            |
| H23, H24              | Browser-Check                                                           | T06            |

## Ruling-Entwürfe (für `docs/studio/rulings.md`, L0 entscheidet)

- **R808-E (Gate Plan UI-HAEPPCHEN-H):** Plan freigegeben: zwei Stränge, getrennte Branches `feat/ui-haeppchen-h-p1`/`-p2`; P1 nach UI-G-Merge, P2 nach ORT-A-Merge; Budget 11 Starts (9 geplant, 2 Reserve), Parallelität 2 (1 solange ORT-A/UI-G nicht gemergt); kein Save, kein Spielwert, kein ADR.
- **R809-E (Autosave-Zugriffe):** periodisches Autosave schreibt in den Platz ausser dem Zeiger und setzt den Zeiger; `pagehide` schreibt in den neuesten Platz ohne Zeigerwechsel (`saveAutoNewest`); ein Zeigerfehler bleibt stumm (Rückfall Spielzeit-Regel).
- **R810-E (Merge-Reihenfolge):** UI-G vor P1; ORT-A vor P2; Stadtplanung unabhängig, wer später mergt löst `overlays.ts` bzw. `app.ts` per `git merge main`; `app.ts`-Diff von P1 in eigenem Commit; `selectionPlan` trägt `rings: []`, sobald `OverlayPlan.rings` in main steht.
- **R811-E (Quote-Messung):** T03 misst die Grösse beider Autosaves und des manuellen Standes; über 1 MB je Stand geht P1 vor dem Merge an L0 zurück (F4).
