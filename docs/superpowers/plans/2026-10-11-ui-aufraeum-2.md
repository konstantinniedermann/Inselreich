# Plan UI-AUFRAEUM-2 · Kopplung über Anzeigetexte lösen (Kurzplan, Stufe leicht)

Owner `lead-tech` · Quelle: `docs/beobachtungen.md` Zeile 109 (Board), Zeile 50/56 (`stateText`), R559 · Umsetzung **nach Release M13**.
Spielerlebnis: Anzeigetexte lassen sich ändern, ohne dass Banner, Pause oder Kostenmeldung still brechen.
**Reines Refactoring:** kein sichtbarer Wechsel für Spieler, keine neue Abhängigkeit, kein Save-Eingriff, `src/sim/` unberührt, Spielwerte unverändert.

## Architektur (Kurzdesign)

Anzeige-Entscheide hängen heute am Text. Neu tragen die Einträge eine **Kennung** statt den Wortlaut zu vergleichen:
`LogEntry` (`crisisLog.ts`) bekommt optional `tag?: 'monument-done'`; der Pause-Eintrag aus `monumentView.ts` bekommt `paused: boolean`.
Die Kosten eines Abschnitts liefert **eine** Funktion `monumentStageCost(m)` in `monumentView.ts`. Ein Wortlaut ändert danach nur den Text.

## Befund → Task (Zuordnung vollständig)

| Befund (Zeile 109 / 50)                          | Task | Vorbefund heute (per grep belegt)                                                        |
| ------------------------------------------------ | ---- | ---------------------------------------------------------------------------------------- |
| Abschluss-Banner am Text erkannt                 | T01  | `app.ts:1437` `e.text === MONUMENT_DONE_TEXT`                                            |
| Pausenzustand aus Knopftext                      | T01  | `monumentSection.ts:104` `e.text === 'Bau fortsetzen'`                                   |
| `stage`-Sprung ergibt einen Chronik-Eintrag      | T01  | `monumentView.ts:~260` `cur.stage > prev.stage` ein Eintrag, auch bei Sprung > 1         |
| kein DOM-Test `rest-monument`                    | T00  | `tests/ui/monumentView.test.ts` prüft nur die reine Sicht                                |
| Kosten doppelt (`monumentView.ts`/`app.ts`)      | T02  | `monumentView.ts:66,226` und `app.ts:~730` je `MONUMENT_STAGES[stage].money`             |
| «Abreissen» sechsmal als Literal                 | T03  | Zählung vor T03 per grep neu (`inspect.ts:204`, `hints.ts:361`, `app.ts:949`)            |
| `stateText` ohne Aufrufer (R559)                 | T03  | `texts.ts:112` Definition, `inspect.ts:82` Re-Export, sonst 0 Treffer                    |
| `isSaveChord` in `modal.ts` zieht `sim/defs` mit | T04  | `modal.ts:3` → `hotkeys.ts:2-3` importiert `BUILDING_DEFS`, `unlocks`                    |
| `RESERVE_TICKS = 1000` neben Sim-800             | T05  | `balance-monument.test.ts:48` vs. `MONUMENT_RESERVE_TICKS = 800` (`defs/monument.ts:19`) |

Gestrichen: nichts. Alle Anzeigetexte bleiben byte-gleich.

## Tasks (Test-first; Umsetzer `tech-ui-engineer`, ein Umsetzer, sequenziell)

**T00 · Charakterisierung `rest-monument` (DOM).** Neuer Test `tests/ui/monumentSection.dom.test.ts`: Monument-Sektion rendern, Pause umschalten, Abschlusszeile prüfen; zeichnet das heutige Verhalten auf (grün vor dem Umbau, **kein** Rot-Beleg möglich; stattdessen Mutationsbeleg: Knopftext testweise ändern → Test muss rot werden, im Report nennen, R395/R410). AK-1.

**T01 · Kennungen statt Texte.** Rot zuerst: (a) `monumentEvents` mit Sprung 0→2 liefert zwei Einträge «Abschnitt 1 fertig», «Abschnitt 2 fertig»; (b) Eintrag trägt `tag: 'monument-done'`; (c) Pause-Eintrag trägt `paused`; (d) DOM-Test aus T00 bleibt grün, wenn der Knopftext zu «X» geändert wird. Dann `app.ts` (Tag statt `===`), `monumentSection.ts` (`e.paused`), `monumentView.ts`, `crisisLog.ts`. AK-2, AK-3, AK-4. Randfall: der Mehrfach-Eintrag bei Stage-Sprung ist die einzige sichtbare Wirkung, nur bei Sprung > 1 (Laden/Test), im Normalspiel nie; als Ruling-Hinweis an L0 melden.

**T02 · Eine Kostenquelle.** Rot: `monumentStageCost` fehlt (Import-Fehler); Test: Wert gleich `MONUMENT_STAGES[stage].money`, 0 bei fertigem/fehlendem Denkmal. `monumentView.ts` und `app.ts` (`startMonumentStage`-Fehlerpfad) nutzen sie. AK-5.

**T03 · «Abreissen»-Konstante und `stateText`.** Rot: Test `tests/ui/texts.test.ts` verlangt `DEMOLISH_VERB` aus `texts.ts`, und eine Quelltext-Prüfung (`grep`-Test über `src/ui/*.ts`: 0 Literale `Abreissen` ausser in `texts.ts` und Kommentaren). `stateText` in `texts.ts` und Re-Export `inspect.ts:82` entfernen; `stateInfo` bleibt (hat Aufrufer). AK-6, AK-7. **Berührt `inspect.ts`** (siehe Überschneidung).

**T04 · `isSaveChord` entkoppeln.** Rot: Test, dass `modal.ts` weder `hotkeys` noch `sim/` importiert (Quelltext-Prüfung auf `import`-Zeilen). `isSaveChord` samt `Mods` nach `src/ui/saveChord.ts` (DOM- und sim-frei), `hotkeys.ts` importiert es, `input.ts` und `modal.ts` zeigen darauf; vorhandene Tests der Taste bleiben grün. AK-8.

**T05 · `RESERVE_TICKS`.** Prüfung vor Änderung: ist 1000 bewusste Sicherheit (Lauf-C-Grenzen 6720 ± 30 %)? Wenn ja: Konstante mit Begründungskommentar und `MONUMENT_RESERVE_TICKS`-Bezug dokumentieren, Wert **nicht** ändern. Wenn aus Versehen: auf `MONUMENT_RESERVE_TICKS` umstellen, nur wenn `balance-monument` und `balance` grün bleiben; sonst Wert behalten und als Befund melden (kein Spielwert-Ruling im Refactoring). AK-9. Kein Rot-Beleg (Konstante); Begründung im Report.

**T06 · Doku.** `docs/arc42.md` Modulliste um `saveChord.ts` (falls dort UI-Dateien einzeln stehen); `docs/beobachtungen.md` Zeile 50 und 109 auf «erledigt» setzen. README unverändert (keine Bedienung geändert). Owner `lead-tech`, D1-Dateien ausdrücklich erlaubt (E-017).

## Abnahmekriterien

AK-1 DOM-Test `rest-monument` existiert und beweist Pause-Umschalten und Abschluss. AK-2 Abschluss-Banner hängt am Tag, nicht am Text. AK-3 Pausenzustand hängt an `paused`. AK-4 Stage-Sprung gibt je Abschnitt einen Eintrag. AK-5 Eine Kostenfunktion, `MONUMENT_STAGES[…].money` nur dort. AK-6 Kein «Abreissen»-Literal ausserhalb `texts.ts`. AK-7 `stateText` und Re-Export weg, `grep stateText src tests` = 0. AK-8 `modal.ts` importiert weder `hotkeys` noch `sim/`. AK-9 `RESERVE_TICKS` begründet oder angeglichen, Balancing grün. AK-10 Kein Wortlaut ändert sich (Textvergleichs-Pins grün).

## Datei-Ownership (ein Strang, Worktree `.worktrees/ui-aufraeum-2`, Branch `refactor/ui-aufraeum-2`)

| Dateien                                                                                                           | Task     |
| ----------------------------------------------------------------------------------------------------------------- | -------- |
| `src/ui/monumentView.ts`, `src/ui/monumentSection.ts`, `src/ui/crisisLog.ts`, `tests/ui/monument*.test.ts`        | T00–T02  |
| `src/ui/app.ts` (nur Banner-Zweig ~1437, `startMonumentStage` ~721–730)                                           | T01, T02 |
| `src/ui/texts.ts`, `src/ui/inspect.ts` (Re-Export, `DEMOLISH_LABEL`), `src/ui/hints.ts`, `tests/ui/texts.test.ts` | T03      |
| `src/ui/saveChord.ts` (neu), `src/ui/hotkeys.ts`, `src/ui/modal.ts`, `src/ui/input.ts`                            | T04      |
| `tests/sim/balance-monument.test.ts`                                                                              | T05      |
| `docs/arc42.md`, `docs/beobachtungen.md`                                                                          | T06      |

Nicht anfassen: `src/sim/`, `src/render/`, Spielwerte, `docs/studio/rulings.md` (schreibt L0, R471).

## Überschneidung mit M14-E1 und Merge-Reihenfolge

`ownership.md` von M14-E1 weist `src/ui/inspect.ts` (T06), `buildMenu.ts`, `hover.ts`, `panelView.ts`, `islandCard.ts` dem Strang UI zu. Treffer mit diesem Plan: **`inspect.ts`** (T03: Re-Export Zeile 82, `DEMOLISH_LABEL`). `app.ts`, `monumentView/-Section`, `modal.ts`, `hotkeys.ts`, `texts.ts` und `balance-monument.test.ts` stehen dort nicht (grep: 0 Treffer). Empfehlung: **M14-E1 zuerst mergen, dann UI-AUFRAEUM-2** (nach M13, wie beschlossen); ein Refactoring mit kleinem Diff rebased/merged billiger auf ein grosses Feature als umgekehrt (§6.3). Läuft UI-AUFRAEUM-2 früher, T03 zuletzt und `inspect.ts` bis zum Merge von M14-E1 nicht anfassen (nur `texts.ts`-Teil).

## Pflichtpunkte je Task und am Ende

- **Testzeiten vorher/nachher** (R392, E-052): `make test` vor T00 und nach T05, Gesamt- und Einzelzeiten der berührten Dateien im Report; neue DOM-Tests unter 1 s je Datei.
- **Rot-Beleg** je neuem Test (R395, R410): Ausgabe des roten Laufs vor der Umsetzung im Report; für T00/T05 Ersatz wie oben.
- Am Ende je Exit-Code (`…; echo EXIT=$?`, keine Pipe): `npx tsc --noEmit`, `make lint`, `make test`, `make zeittests`, `make conflicts`, `make docs-check`: alle 0; Balancing-Test grün.
- **Browser-Check** `qa-playtester`: 1 kurzer Lauf (Denkmal-Panel: Abschnitt beginnen, Bau anhalten/fortsetzen, Abschlussbanner; Screenshots unter `.studio/qa/ui-aufraeum-2/`), weil Panel und Banner berührt sind. Alle Texte gleich wie vor dem Umbau.
- Review je Task `qa-code-reviewer` (sonnet); **Final-Review `opus`** über die Branch; nach ZURÜCK Fix-Runde und **Delta-Review** desselben Reviewers per SendMessage (R553), im Budget.

## Budgetantrag (`templates/budgetantrag.md`)

Formel `Tasks × 2 + QA-Checks + 1 Final-Review`: 6 Umsetzer-Tasks (T00–T05) × 2 = 12; QA-Checks 1 (Playtester); Final-Review 1; Summe 14; + 30 % = 18,2 → **19 Starts**. T06 macht der Lead selbst (Doku). Fix-Runden und Delta-Review per SendMessage (zählen nicht). Parallelität 1 (ein Baum, überlappende Dateien). Aufwand ≈ 250 Tools. Modelle: Umsetzer, Reviewer, Playtester `sonnet`; Final-Review `opus`. Hat das Paket genau einen Umsetzer, kann L0 den Umsetzer direkt briefen (E-037).

## Risiken

(1) Merge-Konflikt in `inspect.ts` mit M14-E1 T06, siehe Reihenfolge. (2) T05 könnte einen Spielwert berühren, daher Wert nie ändern ohne grünen Balancing-Test und Meldung. (3) Quelltext-Prüf-Tests (T03/T04) sind spröde: nur `import`-Zeilen und das Literal prüfen.
