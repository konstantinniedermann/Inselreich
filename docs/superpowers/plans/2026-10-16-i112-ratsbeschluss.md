# Plan I-112 «Ratsbeschluss» (Stufe voll, V3)

Stand: Gate Plan OK mit Auflagen B-1 bis B-5 eingearbeitet (R713, R711); R-3, R-4, R-5 sind entschieden, keine offene Variante mehr.
Owner `lead-tech` · Quelle: Spec `docs/superpowers/specs/2026-10-16-i112-ratsbeschluss.md` (17 AK), Anhang 01 §2/§9, Ruling R706 (V3, R-1, R-2).
Plan gegen main `21f37b82`, ohne Testläufe (Plan-Paket). Task-Dateien in [`2026-10-16-i112-ratsbeschluss/`](2026-10-16-i112-ratsbeschluss/).
Spielerwirkung: je Stufe 2/3/4 eine einmalige Wahl «schnellere Kette» (A) gegen «Form der Stadt» (B), sichtbar über die Kopfzeilen-Marke «Rat».

## Architektur (≤ 15 Zeilen)

- Neues Sim-Modul `src/sim/council.ts` (Blatt: importiert nur `./types`, `./defs/*`): Lese-Helfer `serviceRadiusOf(world, defId)`,
  `maxInhabitantsOf(world, tier)`, `councilCycle(world, defId, cycle)`; Zustand `tickCouncil`, Aktion `decree`, Grund `decreeReason`.
- Werte nur in `src/sim/defs/council.ts` (`COUNCIL`, 6 Einträge, Hebel als Daten `{ kind, defId | tier, value }`, Texte).
- Weltfeld `council: Record<2 | 3 | 4, null | 'open' | 'A' | 'B'>` (`types.ts`, `world.ts`), JSON-fähig (ADR-002).
- Takt: `levels.ts` bekommt `effectiveCycle(world, island, defId, cycle) = islandCycle(…, councilCycle(…))`; `cycleOf` nutzt ihn.
  Reihenfolge Beschluss → Inselvorteil, beide ganzzahlig abgerundet, mindestens 1.
- Tick: `tickCouncil(world)` direkt nach `tickPopulation` in `step` (Häuser haben dann ihre Stufe); schreibt nur `council`.
- Ohne gefassten Beschluss liefern alle Helfer exakt den Def-Wert → Balancing-Baseline bitgleich (R-1).
- UI: reine Helfer in `src/ui/council.ts` (`councilBadge`, `councilCards`, `councilOpened`), DOM-Karte `src/ui/councilCard.ts`,
  Marke in der Kopfzeile (`hud.ts`), Verdrahtung in `app.ts`, Taste `Umschalt + R`.

## Entscheide des Plans

- **P-1 Refactor vorn (Auflage R706 a):** T01 stellt alle Leser auf die Helfer um, bevor es den Rat gibt (reiner Umbau, bitgleich);
  ein Wächter-Test `tests/sim/leverReads.test.ts` scannt `src/` auf direkte Lesezugriffe. Fundstellen-Liste: T01-Datei.
- **P-2 Öffnen per Abtastung, nicht per Ereignis:** `tickCouncil` setzt je Tick `council[n] = 'open'` für alle n ≤ höchste Hausstufe,
  solange `null`; früher Ausstieg, wenn kein `null` mehr. Deckt Aufstieg, Szenarien mit gesetzten Häusern und Migration gleich ab.
- **P-3 Offene Frage 2 (Handoff) entschieden:** kein Sonderfall. `tickPopulation` wächst nur bei erfüllten Bedürfnissen bis `houseCap`
  und schrumpft sonst um 1 je Takt; das neue Maximum fliesst nur über `houseCap`/`tierCap` ein. Zusatzeinwohner ohne Ware wachsen
  nicht (bestätigt die Annahme in Anhang §9). Test in T04 (AK 7).
- **P-4 Offene Frage 3 entschieden:** Beschliessen in der Pause ist erlaubt, wie bei Edikten: `setEdict` und der UI-Aufruf in `app.ts`
  prüfen kein Tempo. `decree` prüft ebenfalls kein Tempo; Wirkung im nächsten verarbeiteten Tick, Anzeigen sofort.
- **P-5 Save (R674):** `SAVE_VERSION` Arbeitsannahme **17**, endgültig = main + 1 beim Merge (Gate Merge prüft; Erweiterung 1 kann
  Nummern nehmen). Ältere Stände werden **migriert** (v16 → v17, R711 R-4), nicht abgewiesen. **Spec §4 und AK 9 sind durch R711 R-4 ersetzt**
  (die Spec bleibt unverändert, T09 ändert sie nicht); Abweisen bleibt nur für `version + 1` und ein kaputtes `council`.
- **P-6 Takt bei ausgebauten Betrieben (R711 R-3):** proportional, `floor(Stufentakt × Wert ÷ 50)`, `÷ 50` über `BUILDING_DEFS[defId].cycle`
  (nie hart); Reihenfolge Beschluss → Inselvorteil, Untergrenze 1.
- **P-7 Balancing (R-1):** Controller (`tests/sim/controller.ts`, `merchantsController.ts`) importiert `decree` nie (Wächter-Test);
  `balance.test.ts` bekommt nur eine Zusicherung auf `world.council` am Ende des bestehenden Laufs (kein zweiter Lauf, keine Zahl ändert sich).
- **P-8 Zeitmessung R392:** T00 misst die berührten Test-Dateien vorher, T08 nachher. Abnahme: kein bestehender Test > 500 ms
  oder > +50 % gegenüber `zeit-vor.json`; Abweichung → Befund an L0 vor dem Final-Review.

## Blocker

- Keine Ruling-Blocker mehr (R-3, R-4, R-5 durch R711 entschieden).
- Kein Paket-Blocker auf main bekannt; T00 holt main per `git merge main` (kein Rebase) und sucht die Einhängepunkte neu.

## Dateimatrix (Ownership)

| Datei                                                                                                                                                     | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T09 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/sim/council.ts` (neu)                                                                                                                                | ja  |     | ja  | ja  |     |     |     |     |
| `src/sim/defs/council.ts` (neu), `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`                                                                |     | ja  |     |     |     |     |     |     |
| `src/sim/{flow,population,unlocks,feast,crises,queries,levels}.ts`                                                                                        | ja  |     |     |     |     |     |     |     |
| `src/sim/tick.ts`                                                                                                                                         |     |     | ja  |     |     |     |     |     |
| `src/ui/{hover,buildMenu,panelView,inspect,guide,islandCard,taxView}.ts` (nur Leser-Zeilen)                                                               | ja  |     |     |     |     |     |     |     |
| `tests/sim/leverReads.test.ts` (neu) und von Signaturänderungen betroffene Tests (`tests/sim/`, `tests/ui/panelView.test.ts`, `tests/ui/taxView.test.ts`) | ja  |     |     |     | ja² |     |     |     |
| `tests/sim/council.test.ts` (neu)                                                                                                                         |     | ja  | ja  | ja  | ja  |     |     |     |
| `tests/sim/council-save.test.ts` (neu)                                                                                                                    |     | ja  |     |     |     |     |     |     |
| `tests/sim/balance.test.ts` (eine Zusicherung)                                                                                                            |     |     |     |     | ja  |     |     |     |
| `src/ui/council.ts` (neu), `tests/ui/council.test.ts` (neu), `src/ui/hotkeys.ts`                                                                          |     |     |     |     |     | ja  |     |     |
| `src/ui/councilCard.ts` (neu), `src/ui/hud.ts`, `src/ui/app.ts`, `index.html`, `src/style.css`                                                            |     |     |     |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, Spec-Verweis                                                                                          |     |     |     |     |     |     |     | ja  |

T04 ändert nur die Helfer-Rümpfe in `council.ts` (die Leser hängen seit T01 daran). ² nur `leverReads.test.ts` um
den Controller-Wächter ergänzen. Nicht angefasst: übrige `defs/`, `docs/studio/`, Specs, `src/render/` (liest über `cycleOf`/`placementZone` bereits richtig).

## Stränge und Worktrees

Strang S (Sim) `.worktrees/i112`, Branch `feat/i112` ab main, `plan/i112` hineingemergt: T00 → T01 → T02 → T03 → T04 → T05.
Strang U (UI) `.worktrees/i112-ui`, Branch `feat/i112-ui` ab `feat/i112` nach T03-OK: T06 → T07; parallel zu T04/T05 (getrennte Dateien).
Danach Controller: `git merge feat/i112-ui` in `feat/i112` (kein Rebase), dann T08 → T09 → Final-Review. Parallelität höchstens 2
Umsetzer; bei 1-min-Last ≥ 8 keine zweite Umsetzung mit Testlauf (R708 V2), dann seriell.

## Tasks

| Task | Titel                                                                 | Datei                   | AK                      | Strang | blocked-by | Modell | Tools |
| ---- | --------------------------------------------------------------------- | ----------------------- | ----------------------- | ------ | ---------- | ------ | ----- |
| T00  | Worktree, main holen, Einhängepunkte, Zeitmessung vorher (Controller) | `T00-zeitmessung.md`    | –                       | S      | Gate Plan  | sonnet | 10    |
| T01  | Lese-Helfer und Umstellung aller Leser, bitgleich                     | `T01-lese-helfer.md`    | Auflage a, AK 10 (Teil) | S      | T00        | sonnet | 55    |
| T02  | Defs, Weltfeld, Save (Migration v16 → v17)                            | `T02-defs-save.md`      | 1 (Teil), 9 (R-4), 10   | S      | T01        | sonnet | 40    |
| T03  | Öffnen und `decree`                                                   | `T03-oeffnen-decree.md` | 1, 2, 3, 4              | S      | T02        | sonnet | 35    |
| T04  | Wirkung der sechs Beschlüsse                                          | `T04-wirkung.md`        | 5, 6, 7, 17 (Sim-Teil)  | S      | T03        | sonnet | 45    |
| T05  | Determinismus und Baseline                                            | `T05-baseline.md`       | 8, 11                   | S      | T04        | sonnet | 20    |
| T06  | UI-Helfer, Taste, Hilfe                                               | `T06-ui-helfer.md`      | 12, 13                  | U      | T03        | sonnet | 30    |
| T07  | Rats-Karte, Marke, Hinweis                                            | `T07-ui-karte.md`       | 14–16 (Code)            | U      | T06        | sonnet | 45    |
| T08  | Browser-Check 1280 px, Zeitmessung nachher (`qa-playtester`)          | `T08-browser.md`        | 14, 15, 16, 17          | –      | T05, T07   | sonnet | 30    |
| T09  | Doku (D1, E-017), ohne Task-Review                                    | `T09-doku.md`           | Spec §10                | –      | T08        | sonnet | 15    |

**T09 ohne Task-Review:** Absicherung durch `make docs-check` und das Final-Review, das README und arc42 gegen `src/sim/defs/council.ts` prüft (B-7).

Umsetzer: T01–T05 `tech-sim-engineer` (T01 mit Ownership-Ausnahme für die UI-Leser-Zeilen, R711 R-5), T06, T07 und T09
`tech-ui-engineer` (T09 mit ausdrücklicher D1-Erlaubnis), T08 `qa-playtester`.

## Prüfung je Task (gilt für jede Task mit `.ts`-Änderung, R395, R410)

`npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?` ·
gezielte Tests `npx vitest run <dateien>; echo EXIT=$?` · Rot-Beleg je neuem Test (Lauf vor der Umsetzung, Ausgabe-Zeile im Bericht).
`make check` nur am Strangende (T05, T07) und vor dem Final-Review, nicht je Task. Exit-Codes nie in einer Pipe.

## Controller-Briefing (Pflichtzeilen)

- Controller auf `sonnet`, höchstens 4 Tasks je Instanz, Übergabe per Ledger spätestens bei 200k Kontext oder nach 6 Arbeiter-Starts (R167, R190).
- Je Task: Umsetzer → `qa-code-reviewer` (Task-Review, sonnet, nur Task-Datei und AK-IDs) → bei T06/T07 Check in T08 → Fix-Runde per SendMessage.
- **Delta-Review nach ZURÜCK oder BEDENKEN: immer frischer Start (opus), nie Fortsetzung desselben Reviewers (R673, R708).**
- Final-Review: frischer `qa-code-reviewer` auf `opus` über die ganze Branch, Ergebnis an `lead-qa`.
- Ändert ein Umsetzer eine Datei ausserhalb seiner Zeile der Dateimatrix: zurück an den Controller, nicht selbst erweitern.

## Schätzung Umsetzung (Starts)

Umsetzer 8 (T01–T07, T09; T08 ist QA) · Task-Reviews 7 (T01–T07) · Playtester 1 · Final-Review 1 (opus) · Delta-Reviews erwartet 2 (frisch, opus)
= **19**; mit 30 % Puffer aufgerundet **25 Arbeiter-Starts**, **Parallelität 2**. Dazu Controller-Instanzen (L0): **4** (≤ 6 Arbeiter-Starts je
Instanz). Wanduhr ≈ 4 bis 5 h. Rückfall V4 (nur Stufe 3) spart nur Tools in
T04/T08, keine Starts (Helfer, Save und UI bleiben gleich).

## Risiken

- **Leser-Umbau T01 (14 Dateien):** grösste Diff-Last; der Wächter-Test und die bitgleiche Suite fangen Vergessenes. Signaturen ändern sich
  (`upgradeDelta`, `unlockText`, `houseTiles`, `tierCap`, `tierTaxTooltip`, `inChapelRadius`): Aufrufer in Tests ziehen mit.
- **Save (R-4):** die Migration hält die bestehenden Kettentests grün; Tests, die `SAVE_VERSION` als Literal `16` festhalten, ziehen in T02 mit (`*-save.test.ts`, `inselmarkt`, `toolmaker`, `scenario-saves`).
- **Heiss-Pfad:** `serviceAvailable` läuft je Haus × Dienst × Quelle je Tick; der Helfer ist ein Feld- und Id-Vergleich (O(1)). T08 misst nach.
- **Stufe 2 A-lastig** (Spec §9): Werte-Frage nach Playtest (R-2), kein Plan-Risiko.

## AK-Zuordnung (Task · Test)

| AK     | Task      | Test                                                                                                                                          |
| ------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | T02, T03  | `council.test.ts` «AK-1 neue Welt»: `createWorld().council` alle `null`; `decree` je Stufe `ok: false` «nicht offen», `JSON.stringify` gleich |
| 2      | T03       | «AK-2»: Szenario mit gesetztem Haus Stufe 2 bzw. 3 bzw. 4, ein `step`; erwartete `council` je Fall                                            |
| 3      | T03       | «AK-3»: Abriss des einzigen Stufe-2-Hauses und Abstieg auf 1: `council[2]` bleibt `'open'` bzw. `'A'`                                         |
| 4      | T03       | «AK-4»: `decree` ok, zweites `ok: false` «schon beschlossen»; Stufe 1, 5, `'C'`, `undefined` → `ok: false`, kein Wurf                         |
| 5      | T04       | «AK-5 …» sechs Fälle (je Beschluss) plus Gegenseite und unentschieden = Def-Wert; Kapelle Abstand 12 ja / 14 nein, Fest ebenso                |
| 6      | T04       | «AK-6»: Weberei auf zweiter Insel und nach dem Beschluss gebaute: `cycleOf` = 40                                                              |
| 7      | T04       | «AK-7»: Haus 15 → 16 nur bei erfüllten Bedürfnissen; unerfüllt schrumpft es (P-3); `upgradeStatus` verlangt 16; `tierCap` hoch = 12           |
| 8      | T05       | «AK-8»: zwei Läufe gleicher Seed und Aktionsfolge mit `decree` → `serialize` gleich                                                           |
| 9      | T02       | «AK-9 (R-4)» in `council-save.test.ts`: Rundreise, Migration v16 → v17 (Fälle laut T02), `version + 1` und kaputtes `council` → abgewiesen    |
| 10     | T02 (T01) | «AK-10»: `COUNCIL` hat 6 Einträge mit Name, Text, Hebel, Wert; `leverReads.test.ts`: keine Hebel-Werte ausserhalb `defs/`                     |
| 11     | T05       | `balance.test.ts` grün, Zahlen unverändert, plus Zusicherung `council`; Wächter: Controller importiert `decree` nicht                         |
| 12, 13 | T06       | `tests/ui/council.test.ts` «AK-12», «AK-13»                                                                                                   |
| 14–16  | T07, T08  | Browser-Check, Screenshots `.studio/qa/i112/`                                                                                                 |
| 17     | T04, T08  | `council.test.ts` «AK-17»: `placementZone(w, 'chapel', …).radius` = 13 nach B; Browser-Screenshot Bau und Auswahl                             |
