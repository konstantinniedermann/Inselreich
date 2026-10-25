# Plan LEBEN-STRASSE · schönere Figuren, angeglichenes Lauftempo (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-22-leben-strasse-design.md` (`design/leben-strasse` @ `90c74b60`, AK-T1 bis T10, AK-V1 bis V12 = 22 AK), Gate OK R820 (Designfragen 1 bis 3 nach Empfehlung). Plan ohne Testläufe (Testsperre). Task-Dateien in [`2026-10-22-leben-strasse/`](2026-10-22-leben-strasse/).
Spielerwirkung: Spaziergänger und Träger gehen bei 1× gleich schnell, schneller (sublinear) bei 2×/4×, stehen in der Pause; Figuren haben Kopf, Rumpf, Beine, Blickrichtung, Schritt aus der Strecke; Träger mit Last sind erkennbar.
**Nur `src/render/` (+ eine Zeile `src/ui/app.ts`)**: kein Sim-, Save-, Baseline-, Spielwert-Diff, keine Abhängigkeit (ADR-001), kein ADR (R820). `git diff main -- src/sim` bleibt leer (AK-T10).

## Architektur (Entscheide des Plans)

- **P-1 Neue reine Module:** `src/render/pace.ts` (`paceFactor`, Gehuhr `walkClock`, Konstanten `SPEED_*`, `STRIDE`) und `src/render/walkerLook.ts` (Farbsätze, Variation, Luminanzprüfung). Beide DOM-frei, ohne Welt-Schreibzugriff.
- **P-2 Tempo kommt über `tickClock`:** `tickClock(world, timeMs, speed?)` bekommt ein optionales drittes Argument; `TickClock` wird um `tickMs` (nominal `TICK_MS / speed`, sonst gemessen) und `speed` erweitert, `fast = speed === 4` (ohne `speed` bisherige Messung `FAST_TICK_MS`). So bleibt `errandsFrom(world, range, clock, reduce)` unverändert, und der Renderer reicht nur `fx.speed` durch. Alte Aufrufer ohne `speed` verhalten sich wie `speed = 1`.
- **P-3 Posen tragen `step` und `dir`:** `WalkerPose` und `ErrandPose` erhalten `step` (kumulierte Weglänge in Kacheln) und `dir` (-1/+1, Bildrichtung); `step` ist Eingang der Schrittphase (`φ = 2π·step/STRIDE`, Spec P2). `walkerAt` nimmt `walkMs` (Gehuhr) statt `timeMs`.
- **P-4 Zwei Stränge, Worktrees disjunkt:** Strang 1 `feat/leben-strasse` (`.worktrees/leben-strasse`, ab `plan/leben-strasse`): T01 → T02 → T03 → T05. Strang 2 `feat/leben-strasse-look` (`.worktrees/leben-strasse-look`, ab `plan/leben-strasse`): T04 (nur neue Datei `walkerLook.ts` + Test, kein Konflikt). Vor T05 holt Strang 1 Strang 2 per `git merge feat/leben-strasse-look`. **Kein Rebase** (Dauerregel).
- **P-5 Anbindung nach ORT-A (R820):** T06/T07 starten erst, wenn ORT-A nach main gemergt ist; erster Schritt `git merge main` im Worktree `.worktrees/leben-strasse` (kein Rebase). Erwarteter Textkonflikt: `renderer.ts` Block ≈ 802 bis 816 (Deko-Zeichnung von ORT-A neben `drawWalker`); mechanisch lösbar, Ergebnis im Bericht. `limits.ts` bleibt unberührt.
- **P-6 Wartet ORT-A noch,** endet der Lauf nach T05 mit `waiting`; T01 bis T05 sind in sich vollständig testbar (Posen, Zeichner gegen `fakeCtx`), ohne dass der Renderer `speed` kennt (Standard 1).
- **P-7 Bestehende Tests nachziehen, nicht lockern:** `tests/render/errands.test.ts` und `life.test.ts` bekommen die neuen exakten Werte (Phasenfenster-Erwartungen werden durch Weg-/Tempo-Erwartungen ersetzt, die Erwartung wird aus `SPEED_*`/`paceFactor`/Weglänge gerechnet, nicht aus „passt-irgendwie“-Toleranzen). Jede Änderung einer Erwartung steht im Bericht mit Grund.

## Dateimatrix (Ownership)

| Datei                                                                                   | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T10 |
| --------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/render/pace.ts`, `tests/render/pace.test.ts`                                       | ja  |     |     |     |     |     |     |     |
| `src/render/life.ts`, `tests/render/life.test.ts`                                       |     | ja  |     |     | ja  |     |     |     |
| `src/render/errands.ts`, `tests/render/errands.test.ts` (`errandsGraph.test.ts` prüfen) |     |     | ja  |     | ja  |     |     |     |
| `src/render/walkerLook.ts`, `tests/render/walkerLook.test.ts`                           |     |     |     | ja  |     |     |     |     |
| `src/render/renderer.ts` (nur benannte Zeilen), `tests/render/renderer*.test.ts`        |     |     |     |     |     | ja  |     |     |
| `src/ui/app.ts` (eine Zeile, eigener Commit)                                            |     |     |     |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`                                                            |     |     |     |     |     |     |     | ja  |

Nicht angefasst: `src/sim/`, `src/render/limits.ts`, `src/audio/`, `src/style.css`, `docs/studio/`, Specs. T08 und T09 ändern keine Datei (Fix-Runden gehen als Änderung an T01/T05 zurück).

## Tasks

| Task | Titel                                                                    | Datei                       | AK-IDs                                  | Strang | blocked-by           | Modell | Tools | Persona                  |
| ---- | ------------------------------------------------------------------------ | --------------------------- | --------------------------------------- | ------ | -------------------- | ------ | ----- | ------------------------ |
| T01  | `pace.ts`: `paceFactor`, Gehuhr, Konstanten                              | `T01-pace.md`               | T1, T2                                  | 1      | –                    | sonnet | 30    | `art-rendering-engineer` |
| T02  | Spaziergänger: `walkerAt` mit `walkMs`, `step`/`dir`, Pause              | `T02-spaziergaenger.md`     | T3, T7 (Teil), T8, V5 (Teil), V6 (Teil) | 1      | T01                  | sonnet | 35    | `art-rendering-engineer` |
| T03  | Träger: Tempo, Ankunfts-Verankerung, `tickClock(speed)`, Ein-/Ausblenden | `T03-traeger.md`            | T4 bis T9, V5, V6 (Teil)                | 1      | T01                  | sonnet | 45    | `art-rendering-engineer` |
| T04  | `walkerLook.ts`: Farbsätze, Variation, Luminanz-Messung (AK-V8)          | `T04-look.md`               | V8, V9                                  | 2      | –                    | sonnet | 35    | `art-rendering-engineer` |
| T05  | Zeichner: `drawWalker` neu, Last-Zeichner, Zoomstufen, `reduceMotion`    | `T05-zeichner.md`           | V1 bis V4, V6, V7, V10                  | 1      | T02, T03, T04        | sonnet | 50    | `art-rendering-engineer` |
| T06  | Anbindung `renderer.ts`: `RenderFx.speed`, Gehuhr, `dir`/`step`          | `T06-anbindung-renderer.md` | T7, T9 (Lauf)                           | 1      | T05, ORT-A gemergt   | sonnet | 25    | `art-rendering-engineer` |
| T07  | Anbindung `app.ts`: `speed` neben `timeMs`                               | `T07-anbindung-app.md`      | –                                       | 1      | T06                  | sonnet | 10    | `tech-ui-engineer`       |
| T08  | Browser-Check, Abstimmung der Tempofaktoren (`qa-playtester`)            | `T08-playtest.md`           | V12                                     | 1      | T07                  | sonnet | 35    | `qa-playtester`          |
| T09  | Perf-Messung 40 Figuren (ruhiges Lastfenster)                            | `T09-perf.md`               | V11                                     | 1      | T08, ruhiges Fenster | sonnet | 20    | `qa-playtester`          |
| T10  | Doku: arc42, README «Leben» (D1, E-017)                                  | `T10-doku.md`               | –                                       | 1      | T08                  | sonnet | 15    | `tech-ui-engineer`       |

Nur Lauf (kein eigener Test): AK-T10 (`git diff main -- src/sim` leer, `SAVE_VERSION` unverändert, `tests/sim/balance.test.ts` grün) im Abschluss.

## AK-Zuordnung (22 AK)

| AK                         | Beleg                                                                          | Task      |
| -------------------------- | ------------------------------------------------------------------------------ | --------- |
| T1, T2                     | `tests/render/pace.test.ts`                                                    | T01       |
| T3, T7, T8 (Spaziergänger) | `tests/render/life.test.ts`                                                    | T02       |
| T4 bis T9                  | `tests/render/errands.test.ts` (T9 zusätzlich Bestandstests)                   | T03       |
| T8 (gesamt)                | beide Testdateien, `JSON.stringify(world)` vor/nach                            | T02, T03  |
| T10                        | Lauf im Abschluss                                                              | Abschluss |
| V8, V9                     | `tests/render/walkerLook.test.ts`                                              | T04       |
| V1 bis V4, V6, V7          | `tests/render/life.test.ts`, `errands.test.ts` (fakeCtx)                       | T05       |
| V5                         | `life.test.ts` und `errands.test.ts`                                           | T02, T03  |
| V10                        | Bestandstests Tiefensortierung/Schatten grün                                   | T05       |
| V11                        | `tools/render-qa/perf.mjs`                                                     | T09       |
| V12                        | Galerie `tools/render-qa/galerie.mjs`, Screenshots `.studio/qa/LEBEN-STRASSE/` | T08       |

## Test- und Prüfpflichten (wörtlich in jedes Umsetzer-Briefing)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting` melden). ORT-A-Messungen haben Vorrang (T09 siehe dort).
- **Gezielt, nie `make check` je Task:** `npx vitest run tests/render/<datei>.test.ts …; echo EXIT=$?` (T01 `pace`; T02 `life`; T03 `errands errandsGraph`; T04 `walkerLook`; T05 `life errands walkerLook pace`; T06 `tests/render/renderer*.test.ts` nach `ls tests/render`). Je Task `npx tsc --noEmit; echo EXIT=$?` und `npx eslint <Dateien> && npx prettier --check <Dateien>; echo EXIT=$?`.
- **Rot zuerst:** Test vor der Umsetzung laufen lassen, rote Ausgabe (Exit ≠ 0) im Bericht.
- **Zeittests (R270):** neue Tests nutzen keine Uhr; `timeMs` ist Eingabe, nie `Date.now()`. Keine `Contract`-Literale (R679-2).
- **Abschluss (Controller, einmal):** `make check; echo EXIT=$?` bei freier Sperre, `balance.test.ts` grün, `git diff main -- src/sim` leer.

## Budget (Vorschlag für das Gate Plan)

**Gesamt 11 Starts, Parallelität 2** (T04 läuft neben T01 bis T03; T08/T09 seriell). Geplant **8**: (1) Umsetzer `art-rendering-engineer` Strang 1, T01 bis T03 und T05 nacheinander per `SendMessage` fortgesetzt; (2) Umsetzer Strang 2 (T04); (3) Task-Review `qa-code-reviewer` sonnet für T01 bis T04 (je Task Urteil, per `SendMessage` fortgesetzt); (4) Umsetzer T06; (5) Umsetzer `tech-ui-engineer` T07 (T10 per `SendMessage`); (6) Task-Review T05 bis T07 sonnet; (7) `qa-playtester` T08 (T09 per `SendMessage`); (8) Final-Review `qa-code-reviewer` **opus** über die ganze Branch. Reserve 3 für Fix-Runden ohne `SendMessage`-Weg. Rechnung: 8 × 1,3 = 10,4, aufgerundet 11. Delta-Review (R553) per `SendMessage` zählt nicht. Controller-Lead sonnet, 12 Tools Steuerung je Start.

## Risiken

- **Textkonflikt `renderer.ts`** mit ORT-A (P-5): klein, nach `git merge main` in T06 zu lösen.
- **Verankerung (T03)** ist der heikelste Teil (Fenster-Dehnung, kurzer Weg tritt spät auf): AK-T4 bis T6 rechnen Weg ÷ Zeit nach; Reviewer prüft Randfälle Weglänge < 0,5 Kacheln und 1-Kachel-Wege.
- **Tempofaktoren 1,6/2,4** sind Schätzwerte: Abstimmung in T08, Änderung nur in `pace.ts`, Test-Erwartungen lesen die Konstanten.
- **Perf (AK-V11)** ist Browser-Messung und braucht ein ruhiges Lastfenster (T09); die Messung kommt nach T08, nie parallel zu ORT-A-Messungen.

## Ruling-Entwürfe (für `docs/studio/rulings.md`, L0 entscheidet)

- **R821-E (Gate Plan LEBEN-STRASSE):** Plan freigegeben: zwei Stränge (`feat/leben-strasse`, `feat/leben-strasse-look`), Anbindung T06/T07 erst nach ORT-A-Merge per `git merge main` (kein Rebase); Budget 11 Starts (8 geplant, 3 Reserve), Parallelität 2; kein Sim-/Save-/Spielwert-Diff, kein ADR.
- **R822-E (Tempo über `tickClock`):** `tickClock(world, timeMs, speed?)` trägt das Spieltempo in den Renderer; `RenderFx.speed` optional, fehlend = 1; `fast` folgt `speed === 4`. Tempofaktoren `pace.ts` 0/1/1,6/2,4, Feinabstimmung in T08 ohne neues Ruling, solange Faktoren in `pace.ts` bleiben und f(1) = 1.
- **R823-E (Messfenster AK-V11):** Perf-Messung nur bei freier Testsperre und ohne laufende ORT-A-Messung; Mindestwert AK-V8 steht nach T04-Messung im Test (Konstante in `walkerLook.ts`).
