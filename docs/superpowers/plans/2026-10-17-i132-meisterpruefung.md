# Plan I-132 «Meisterprüfung», Variante S «Eigenversorgung» (Stufe voll)

> **Für Arbeiter:** Umsetzung mit superpowers:subagent-driven-development; Schritte als Checkbox (`- [ ]`). Jeder Arbeiter bekommt nur seine
> Task-Datei und die AK-IDs, nie den ganzen Plan oder die ganze Spec.

Stand: Entwurf für Gate Plan; Plan-Prüfung qa-code-reviewer (BEDENKEN, 3 mittel, 5 niedrig) eingearbeitet. Owner `lead-tech` · Plan gegen main `04d88e38` (SAVE_VERSION 17), ohne Testläufe (Plan-Paket).
Quelle: Spec [`2026-10-16-i132-meisterpruefung.md`](../specs/2026-10-16-i132-meisterpruefung.md) (20 AK), Anhang 01 §2, §6, §8; Rulings R745 (E1–E4), R711 R-4.
Task-Dateien in [`2026-10-17-i132-meisterpruefung/`](2026-10-17-i132-meisterpruefung/).

**Ziel:** Nach dem Denkmal startet der Spieler freiwillig die Auflage «Eigenversorgung» (Zukauf gesperrt) und hält seine Stadt 15 Minuten
über 70 % der Starteinwohner; Lohn ist ein Eintrag in der Inselchronik. Spielerwirkung: ein scheiterbares Ziel für das Kaufleute-Spiel.

## Architektur (≤ 15 Zeilen)

- Werte nur in `src/sim/defs/trials.ts` (neu): `TRIALS` (ein Eintrag `selfSupply`), `TRIAL_DURATION_TICKS` 9000, `TRIAL_MIN_MERCHANTS` = `WIN_MERCHANTS`,
  `TRIAL_MAX_MERCHANTS` 150, `TRIAL_FAIL_POP_PCT` 70.
- Weltfeld `trial: TrialState = { active: TrialId | null; ticks; e0; passed: { id; tick }[] }` (`types.ts`, `world.ts`), JSON-fähig (ADR-002).
- Neues Sim-Modul `src/sim/trial.ts`: Leser `trialPopulation`, `trialStartBlock`, `trialBuyBlock` (T01); Aktionen `startTrial`, `abortTrial`,
  Schritt `tickTrial` (T02). Importiert nur `./types`, `./defs/*`, `./population`; kein RNG, keine Uhr.
- Sperre A1 an genau zwei Stellen in `trade.ts`: `buy` und `monumentBuyBlock` (damit `buyMonumentUnit`) fragen zuerst `trialBuyBlock`.
- Tick: `tickTrial(world)` direkt nach `tickPopulation` in `step`; bei `active === null` früher Rücksprung → Baseline bitgleich (E4).
- Save: `SAVE_VERSION` 18 (= main + 1, R745), `migrateV17ToV18` setzt Startwerte (R711 R-4), `isValidTrial` in `isWellFormed`.
- UI rein (DOM-frei) in `src/ui/trial.ts`: `trialChip`, `selfSupplyPreview`, `trialStartReason`, `trialChronicleLine`, `trialTransition`,
  `trialCardView`. DOM-Karte `src/ui/trialCard.ts` (Muster `councilCard.ts`), Verdrahtung in `hud.ts` (Ziel-Chip klickbar), `app.ts`
  (Meldungen per Zustandsvergleich, Esc), `inspect.ts` (Chronikzeile), `ui/trade.ts` und `monumentView.ts` (Grund der Sperre).

## Entscheide des Plans

- **P-1 Leser vor Aktionen:** T01 liefert neben Defs und Save die reinen Leser `trialStartBlock`/`trialBuyBlock`; dadurch kann der UI-Strang
  (T03) parallel zu T02 laufen. `startTrial` ruft `trialStartBlock` (eine Quelle für Sim-Grund und blassen Knopf, AK 17).
- **P-2 Zeitanzeige:** Fortschritt statt Restzeit, `formatClock(ticks) / formatClock(TRIAL_DURATION_TICKS)` → «Eigenversorgung 3:20 / 15:00».
- **P-3 Meldungen per Zustandsvergleich** (Spec §3.3): `trialTransition(prev, next)` meldet nur «bestanden» und «nicht bestanden». Start und
  Abbruch meldet der Klick-Handler selbst und gleicht danach `prevTrial` ab; so verwechselt der Vergleich einen Abbruch nie mit «nicht bestanden».
  Nach dem Laden ist `prevTrial` der geladene Stand (keine Meldung für Altes, wie `prevCouncil`).
- **P-4 Ziel-Chip wird `<button>`** (`data-field="goal"` bleibt): Klick öffnet die Auflagen-Karte, solange `trialChip(world) !== null`, sonst wirkungslos.
  Kein neues Kopfzeilen-Element (Kopfzeile bei 1280 px einzeilig mit Rats-Marke, AK 19). Keine eigene Taste (YAGNI).
- **P-5 Vorschau gedrosselt:** `selfSupplyPreview` summiert `goodsBalance` über alle Inseln; die offene Karte rechnet sie beim Öffnen und
  danach höchstens alle 100 Sim-Ticks neu, geschlossen gar nicht (Heiss-Pfad).
- **P-6 Reihenfolge in `buy`:** Sperrgrund der Auflage direkt nach «Unbekannte Insel», vor «Kein Kontor» (Spieler sieht die Ursache).
- **P-7 Gründe (Texte)** stehen als `TRIAL_REASONS` in `src/sim/trial.ts` (Texte, keine Spielwerte); Zahlen darin aus den Defs. Nur der
  Sperrgrund ist von der Spec wörtlich vorgegeben: «Auflage Eigenversorgung: kein Zukauf».
- **P-8 Zeitmessung (R392):** T00 misst vorher, T05 nachher. Abnahme: kein bestehender Test > 500 ms neu und keiner > +50 % (ab Vorwert ≥ 100 ms);
  der neue Lauftest `trial-run.test.ts` hat eigene Timeouts und muss `make zeitreserve` bestehen. Verletzung → Befund an L0 vor dem Final-Review.

## Global Constraints (gelten für jeden Task)

- `src/sim/` DOM-frei, deterministisch; kein `Math.random`, kein `Date`/`performance` in `trial.ts`. Sim-Aktionen werfen nie, liefern `{ ok, reason }`.
- Spielwerte nur in `src/sim/defs/trials.ts`; `TRIAL_MIN_MERCHANTS` liest `WIN_MERCHANTS` aus `defs/tiers.ts` (kein zweiter Wert 60).
- Keine neue Abhängigkeit; `dep-guard` nie umgehen. Kein Rebase, kein `reset --hard`, kein Force-Push; main per Merge.
- Rot-Beleg-Pflicht: jeder neue Test läuft vor der Umsetzung rot; die FAIL-Zeile steht im Bericht. Exit-Codes mit `; echo EXIT=$?`, nie in einer Pipe.
- Balancing-Tests (`tests/sim/balance*.test.ts`) bleiben grün, keine Zahl ändert sich.
- UI desktop-first ab 1280 px; Karte kein Modal, Spiel läuft weiter.

## Review Focus (nicht von der Spec ausgesprochen, je mit Test im genannten Task)

1. Ids wie `'toString'`, `'__proto__'`, `'constructor'`, `undefined`, `42` an `startTrial` → «Unbekannte Auflage», kein Wurf (T02, `Object.hasOwn`).
2. Kaputte `trial`-Formen im Save (`null`, Array, `passed` mit Nicht-Objekt, `ticks` 1.5) → «Beschädigter Spielstand», kein Wurf (T01).
3. Laden mitten in der Auflage: keine Meldung «bestanden/nicht bestanden» nach dem Laden, Chip zählt ab `ticks` weiter (T03 `trialTransition(null, …)`, T04).
4. Bewaffneter Abbruch-Knopf (erster Klick), die Auflage endet und wird neu gestartet: der alte Bewaffnungszustand darf die neue Auflage nicht mit
   einem Klick abbrechen; er fällt bei jedem Wechsel der Knopfart zurück (T04, DOM-Test).
5. Kauf auf einer Insel ohne Kontor während der Auflage → Grund der Auflage, nicht «Kein Kontor» (T02, P-6).

## Dateimatrix (Ownership)

| Datei                                                                                                                                                                        | T01 | T02 | T03 | T04 | T06 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- |
| `src/sim/defs/trials.ts` (neu), `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`                                                                                    | ja  |     |     |     |     |
| `src/sim/trial.ts` (neu)                                                                                                                                                     | ja  | ja  |     |     |     |
| `tests/sim/trial-save.test.ts` (neu), `tests/sim/helpers.ts`, Tests mit Faltkette (siehe T01)                                                                                | ja  |     |     |     |     |
| `tests/sim/trial.test.ts` (neu)                                                                                                                                              | ja  | ja  |     |     |     |
| `src/sim/trade.ts`, `src/sim/tick.ts`, `tests/sim/trial-run.test.ts` (neu), `tests/sim/balance.test.ts`, `tests/sim/balance-monument.test.ts`                                |     | ja  |     |     |     |
| `src/ui/trial.ts` (neu), `tests/ui/trial.test.ts` (neu; T04 ergänzt nach T03 einen Test)                                                                                     |     |     | ja  |     |     |
| `src/ui/trialCard.ts` (neu), `tests/ui/trialCard.test.ts` (neu), `src/ui/hud.ts`, `src/ui/app.ts`                                                                            |     |     |     | ja  |     |
| `src/ui/inspect.ts`, `src/ui/trade.ts`, `src/ui/monumentView.ts`, `src/style.css`, betroffene `tests/ui/*` (u. a. `trade`, `hud`, `monumentView`, Ergänzung `trial.test.ts`) |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, Spec-Kopf (Plan-Verweis)                                                                                                 |     |     |     |     | ja  |

Nicht angefasst: übrige `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/`. **Parallele Pakete:** ORT-A C4 (`.worktrees/ort-a`) ändert
`src/ui/app.ts` nur im Importblock von `devProbes` und im DEV-Messhaken (`exposeDevProbe`, `render`-Aufruf); I-132 ändert `app.ts` an der
Rats-Karte (Erzeugung, Frame-Update, Esc) → getrennte Hunks, Merge-Reihenfolge egal; wer zweit mergt, lässt `make check` laufen. ORT-A-Fixtures
(`tools/render-qa/fixtures/*.json`, v16) laden über die Migrationskette weiter. TOOL-BUENDEL-15 (`tools/studio/`) ohne Überschneidung.

## Stränge und Worktrees

Strang S (Sim) `.worktrees/i132`, Branch `feat/i132` ab main, `plan/i132` hineingemergt: T00 → T01 → T02.
Strang U (UI) `.worktrees/i132-ui`, Branch `feat/i132-ui` ab `feat/i132` nach T01-OK: T03 (parallel zu T02, getrennte Dateien).
Danach in `feat/i132`: `git merge feat/i132-ui` (kein Rebase) → T04 → T05 (Browser) ∥ T06 (Doku) → Final-Review (opus).
Parallelität höchstens 2 Umsetzer; bei 1-min-Last ≥ 8 keine zweite Umsetzung mit Testlauf (R708 V2), dann seriell.

## Tasks

| Task | Titel                                                            | Datei                | AK                          | Strang | blocked-by | Modell | Tools |
| ---- | ---------------------------------------------------------------- | -------------------- | --------------------------- | ------ | ---------- | ------ | ----- |
| T00  | Worktree, main holen, Einhängepunkte, Zeitmessung vorher         | `T00-zeitmessung.md` | –                           | S      | Gate Plan  | sonnet | 10    |
| T01  | Defs, Weltfeld, Save v18 mit Migration, Leser                    | `T01-defs-save.md`   | 1, 2 (Gründe), 12, 13       | S      | T00        | sonnet | 45    |
| T02  | `startTrial`, `abortTrial`, Zukauf-Sperre, `tickTrial`, Baseline | `T02-regel-tick.md`  | 2–11, 14                    | S      | T01        | sonnet | 55    |
| T03  | UI-Helfer (rein)                                                 | `T03-ui-helfer.md`   | 15, 16, 17                  | U      | T01        | sonnet | 30    |
| T04  | Auflagen-Karte, Chip, Handel, Chronik, Meldungen                 | `T04-ui-karte.md`    | 17 (Abgleich), 18–20 (Code) | S      | T02, T03   | sonnet | 50    |
| T05  | Browser-Check 1280 px, Zeitmessung nachher (`qa-playtester`)     | `T05-browser.md`     | 18, 19, 20                  | –      | T04        | sonnet | 30    |
| T06  | Doku (D1, E-017), ohne Task-Review                               | `T06-doku.md`        | Spec §9 (T4 Doku)           | –      | T04        | sonnet | 15    |

Umsetzer: T01, T02 `tech-sim-engineer`; T03, T04 `tech-ui-engineer`; T06 `tech-ui-engineer` mit ausdrücklicher D1-Erlaubnis; T05 `qa-playtester`.
**T06 ohne Task-Review:** Absicherung durch `make docs-check` und das Final-Review (prüft README/spielwerte gegen `defs/trials.ts`).

## Prüfung je Task (gilt für jede Task mit `.ts`-Änderung, R395, R410)

`npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?` ·
gezielte Tests `npx vitest run <dateien>; echo EXIT=$?` · Rot-Beleg je neuem Test. `make check` am Strangende (T02, T04) und vor dem
Final-Review, nicht je Task. Doku-Commits: `make docs-check; echo EXIT=$?` = 0 vor dem Commit.

## Controller-Briefing (Pflichtzeilen)

- Controller auf `sonnet`, höchstens 4 Tasks je Instanz, Übergabe per Ledger spätestens bei 200k Kontext oder nach 6 Arbeiter-Starts (R167, R190).
- Je Task: Umsetzer → `qa-code-reviewer` (Task-Review, sonnet, nur Task-Datei und AK-IDs) → Fix-Runde per SendMessage bis OK.
- Delta-Review nach ZURÜCK oder BEDENKEN im Task-Review: frischer Start (R673, R708). Final-Review: frischer `qa-code-reviewer` auf `opus`
  über die ganze Branch, Ergebnis an `lead-qa`; nach ZURÜCK Delta-Review desselben Reviewers per SendMessage (R553).
- Ändert ein Umsetzer eine Datei ausserhalb seiner Zeile der Dateimatrix: zurück an den Controller, nicht selbst erweitern.
- `SAVE_VERSION` 18 ist Arbeitsannahme; Gate Merge prüft main + 1 (R674). Ändert main vorher die Version, zieht der Controller Migration und Tests nach.

## Budgetvorschlag Umsetzung (Starts)

Umsetzer 5 (T01–T04, T06) · Task-Reviews 4 (T01–T04) · Playtester 1 (Nachprüfung per SendMessage) · Final-Review 1 (opus) · Delta-Reviews
erwartet 2 (Task-Ebene, frisch) = **13**; mit 30 % Puffer aufgerundet **17 Arbeiter-Starts**, **Parallelität 2** (nur T02 ∥ T03 und T05 ∥ T06).
Controller-Instanzen: **3** (I: T00–T02 · II: T03, T04 · III: T05, T06, Final-Review). Wanduhr ≈ 3 h.

## Risiken

- **Faltkette der Tests:** `foldBackToV13/V12/V11` werfen bei unbekannten Weltschlüsseln; `trial` muss dort wie `council` entfernt werden (T01),
  sonst brechen Kettentests und `balance-crises`. Bestehende Aufrufer `foldBackCouncil(json(w))` brauchen `foldBackTrial` davor.
- **Lauftest K'-arm (T02):** baut den Referenzstand wie `balance-monument.test.ts` (dort `beforeAll` 15 s) und läuft 9000 Ticks; Laufzeit im Bericht,
  `make zeitreserve` muss grün sein, sonst Timeout nach V3 (R712) anheben und melden.
- **Obergrenze 150** ist geschätzt (Spec §10, Playtest-Trigger) — Wert in den Defs, kein Plan-Risiko.

## AK-Zuordnung (Task · Test)

| AK  | Task     | Test                                                                                                                                    |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | T01      | `trial.test.ts` «AK-1 neue Welt»                                                                                                        |
| 2   | T01, T02 | `trial.test.ts` «AK-2 (Gründe)» über `trialStartBlock` (T01), «AK-2 (Aktion)» `startTrial` unverändert, kein Wurf (T02, Review Focus 1) |
| 3   | T02      | «AK-3 Start 60 und 150»                                                                                                                 |
| 4   | T02      | «AK-4 Sperre» (Heimat- und Fremdkontor, `buyMonumentUnit`, `sell`, `buyShip`, Review Focus 5)                                           |
| 5   | T02      | «AK-5 Abbruch»                                                                                                                          |
| 6   | T02      | «AK-6 Zählen» (`tickTrial`-Schleife) und `trial-run.test.ts` «AK-6 K'-arm mit Sollzufuhr besteht»                                       |
| 7   | T02      | «AK-7 Grenzfall 70 %» und `trial-run.test.ts` «AK-7 K'-arm ohne Zufuhr scheitert»                                                       |
| 8   | T02      | «AK-8 Zähler = step-Aufrufe» und Quell-Scan ohne Uhr                                                                                    |
| 9   | T02      | «AK-9 Neustart»                                                                                                                         |
| 10  | T02      | «AK-10 Denkmal abgerissen»                                                                                                              |
| 11  | T02      | «AK-11 Determinismus» (a: gleiche Hashes; b: Welt ohne `trial` gleich mit und ohne Auflage, Krisen `normal`)                            |
| 12  | T01      | `trial-save.test.ts` «AK-12 …» Rundreise, Migration v17 → v18, Kette ab `save-v11`, Abweisen (Review Focus 2)                           |
| 13  | T01      | `trial.test.ts` «AK-13 Defs» und Literal-Scan                                                                                           |
| 14  | T02      | `balance.test.ts` Zusicherung `trial` = Startwerte; Wächter: Controller-Dateien enthalten `startTrial` nicht                            |
| 15  | T03      | `tests/ui/trial.test.ts` «AK-15 trialChip»                                                                                              |
| 16  | T03      | «AK-16 selfSupplyPreview»                                                                                                               |
| 17  | T03, T04 | «AK-17 trialStartReason» Texte (T03); «AK-17 Abgleich mit startTrial» nach dem Merge (T04)                                              |
| 18  | T04      | `trialCard.test.ts` (Aufbau, Esc-Handle) · T05 Screenshot                                                                               |
| 19  | T04      | `trial.test.ts`/Handel: Knopf blass mit Grund · T05 Screenshot Kopfzeile einzeilig                                                      |
| 20  | T04      | `trialCard.test.ts` Abbruch zweiter Klick, Review Focus 4 · T05 Meldung «nicht bestanden», Chronikzeile                                 |
