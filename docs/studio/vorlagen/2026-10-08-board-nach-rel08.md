# Board-Vorlage nach REL-08

Entscheidungsvorlage von lead-production an L0 (Auftrag R349, state.md Punkte 4 und 5). Stand 2026-10-08. Nur Lesen
und Vorlage; keine Pakete angelegt, kein Budget freigegeben. Tool-Schätzungen sind grob, Budget bleibt Gate Plan.

## 1. M12 E5/E6: planen oder abschliessen

**Empfehlung: M12 abschliessen und die Meilenstein-Retro ansetzen (studio-coach); E5 und E6 nicht planen.**

- E5 und E6 sind in Spec §9 ausdrücklich „Kann“, streichbar in der Reihenfolge E6, dann E5. Alle Muss-Teile E0–E4 samt
  drittem Ziel sind live (REL-05); das Board führt `M12` bereits als `done`.
- E6 (Händlerschiff, I-006) verlangt Save v10, Migration, eigenen Zufallsstrom und offen **F-P7** (Werte, Prüfung
  durch design-economy-designer). Das ist neues Sim-Risiko ohne Nutzerwunsch, während der Nutzerwunsch bei den
  REL-05-Fehlern liegt (Fahrlinie, Kontor-II-UX).
- E5 (Seekarte, Gründungsfahrt) ist reine UI/Render, hängt aber an einer sauberen Fahrlinie (SEE-F1) und an der Kontor-UX
  (SEE-F2); danach lässt sich E5 besser beurteilen. Als Ideen-Eintrag (IDEEN-Runde) weiterführen, nicht als M12-Rest.
- Die REL-05-Folgepakete sind Fehlerbehebung, kein M12-Umfang; sie laufen als Board-Pakete ohne Meilenstein weiter.

Kosten des Wartens: keine; Kosten der Planung: Spec-AK (Anhang 04), Plan, Gate Plan für Kann-Teile.

## 2. Gereihte Liste für REL-09 (höchstens 6)

Ownership nach Datei geprüft (Pfade aus Beobachtungen und Rulings, nicht neu im Code verifiziert). Studioweit ≤ 5
Arbeiter (R241), Messungen nur bei 1-min-Load ≤ 4 (R329). UI-Pakete mit Browser-Abnahme 150 Tools (E-048).

| #   | Paket                                                                                                                        | Owner     | Tools (grob)       | Hängt ab von                           | Dateien (Kern)                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ | -------------------------------------- | --------------------------------------------------------------- |
| 1   | SEE-F2-UX: Heimatkontor-Klick zu Schiffen, `nextStep` bei offenem drittem Ziel, „Spielstand aus neuerer Version“, `shipsKey` | lead-tech | 150 (UI, Browser)  | –                                      | `src/ui/` (u. a. `inspect.ts`, `app.ts`)                        |
| 2   | SEE-F1-FAHRLINIE: nur Wasser, Tiefwasser, Hindernisse meiden, flüssige Pose                                                  | lead-tech | 90                 | –                                      | `src/sim/islands.ts` (`seaLanes`), Schiffspose in `src/render/` |
| 3   | ART-WALD-RAUTEN: Rautenkanten, Schaum-Raster, zugleich Meeresfelsen wie Boote ansehen                                        | lead-art  | 100 (Perf-Messung) | –                                      | `src/render/terrain.ts` und Nachbarn                            |
| 4   | SEE-F3-SCHIFFSKONTRAST: Rumpf/Segel-Kontrast, Mindestbreite bei Zoom ≤ 0,25                                                  | lead-art  | 40                 | nach 2, falls dieselbe Schiffsdatei    | `src/render/` (Schiffszeichner)                                 |
| 5   | UI-PANEL-AUFRAEUMEN: Importzyklus `panelView.ts`↔`inspect.ts`, Duplikat `TILE_LAYOUT`, Bauleisten-Höhe                       | lead-tech | 60 (UI, Browser)   | nach 1 (gleiche Datei `inspect.ts`)    | `src/ui/panelView.ts`, `inspect.ts`, `buildMenu.ts`, CSS        |
| 6   | ART-L8-SELTEN: `RARE_CAP`, Lichtungen, Kiefernküste, Boden-Deko neben Neubau                                                 | lead-art  | 60                 | nach 3 (Messung, gleiche Render-Linie) | `src/render/decor.ts`, `forest.ts`                              |

**Parallel (getrennte Dateien):** Welle 1 = 1, 2 und 3 (UI / Sim+Schiffsrender / Terrain). Welle 2 = 4, 5, 6 nach den
jeweiligen Vorgängern. Vor dem Start der Wellen: Konflikt-Probe `git merge-tree`, `git worktree list`, fremde
Heartbeats (R329). 2 und 4 teilen vermutlich die Schiffsdatei: erst Briefing-Abgleich der Dateilisten, sonst seriell.
3 und 6 messen Perf: Messläufe nur einzeln und bei Load ≤ 4, Zahl der Hintergrund-Läufe nennen (E-037, Punkt 3 state.md).

**Nicht aufgenommen, mit Grund:**

- I-024 bleibt geparkt (Wirtschaftsentscheid, Dominanzrisiko; erst Playtest zu Pipette und `Umschalt+U`).
- TOOL-RENDERQA-NACHZUG: Werkzeug, niedrige Dringlichkeit; als Beifang in ART-WALD-RAUTEN möglich (Perf-Skripte).
- E-046/E-047/E-048 laufen laut R349 separat (Werkzeug, Handbuch), nicht in dieser Liste.
- **Frist-Hinweis:** CI-ACTIONS-NODE (`ubuntu-latest` wechselt am 2026-10-19 auf Ubuntu 26) steht nicht in
  state.md „Fortsetzung“; L0 prüfen, ob der Punkt erledigt ist, sonst vor REL-09 als kleines Paket ergänzen
  (nicht verifiziert).
- WIRT-SENKEN-01, SIM-INSEL-KONSISTENZ, RENDER-PERF-01: bleiben in der Beobachtungsliste; kein Nutzerwunsch.

Tool-Summe der sechs Pakete: rund 500 Tools Arbeit ohne QA/Final-Review; das Budget je Paket bleibt Sache von
lead-tech/lead-art im Gate Plan (Formel Pakete × 2 + QA + 1 Final-Review, + 30 %).

## 3. Beobachtungen: Trivial-Fixes

Trivial heisst: gleiche Datei im Paketumfang, Minuten, kein neuer Testaufwand. Aufnahme als eigener Commit im Paket.

| Beobachtung                                                              | Urteil                                                                                               | In Paket               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------- |
| Duplikat `TILE_LAYOUT` (`inspect.ts`/`panelView.ts`)                     | trivial                                                                                              | 5                      |
| Konsolen-Warnung `willReadFrequently` (`terrain.ts`)                     | trivial (Canvas-Option)                                                                              | 3                      |
| `favicon.ico` 404                                                        | trivial (Link im `index.html`)                                                                       | 5 oder jeder UI-Strang |
| Einwohner sinken bei Häusern ohne Weg                                    | Absicht der Sim vermutet; zum Schliessen kurz gegen `src/sim/` prüfen                                | –                      |
| Meeresfelsen wie Boote                                                   | **nicht trivial**: Bildbefund, braucht Browserblick                                                  | 3                      |
| Bauleisten-Höhe (Karte -36 px)                                           | **nicht trivial**: Layoutentscheid, Browser                                                          | 5                      |
| Importzyklus `panelView.ts`↔`inspect.ts`                                 | nicht trivial (Auslagern)                                                                            | 5                      |
| Doppelte Höhenprüfung `fauna.ts`/`massif.ts`                             | nicht trivial (Export), erst bei nächstem Eingriff in `massif.ts`                                    | –                      |
| Fuchs-Laufweg, DPR-Wechsel `app.ts:1051`                                 | nicht jetzt; bei Eingriff in `fauna.ts` bzw. `app.ts` (Paket 1 berührt `app.ts`, DPR dort mitprüfen) | 1                      |
| Gischt-Sichtprüfung                                                      | kein Fix; beim nächsten Galerie-Lauf (Paket 3) mitsehen                                              | 3                      |
| `perf.test.ts` AK-E0-15a lastabhängig, Zeitreserve-Runner doppelt auf CI | Werkzeug/Test, gehört zum Werkzeug-Paket, nicht REL-09                                               | –                      |

Hinweis: Der Importzyklus ist in `docs/beobachtungen.md` nicht als Eintrag auffindbar (nur in R-Ruling vom 2026-10-08
und in state.md); beim nächsten Pflegegang dort eintragen, sonst geht der Beleg verloren.
