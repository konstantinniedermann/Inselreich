# Plan UI-AUFRAEUM-2 · Kopplung über Anzeigetexte lösen (Kurzplan, Stufe leicht)

Owner `lead-tech` · Quelle: `docs/beobachtungen.md` Zeile 109, Zeile 50/56 (`stateText`), R559; Gate **R563** (OK mit Auflagen, eingearbeitet).
Umsetzung **erst nach dem Merge von M14-E1** (Überschneidung `inspect.ts`).
Spielerlebnis: Anzeigetexte lassen sich ändern, ohne dass Banner, Pause oder Kostenmeldung still brechen.
**Reines Refactoring:** kein sichtbarer Wechsel für Spieler (Ausnahme Randfall T01), keine neue Abhängigkeit (ADR-001), kein Save-Eingriff, `src/sim/` und Spielwerte unberührt.

## Architektur (Kurzdesign)

Anzeige-Entscheide hängen heute am Text. Neu tragen Einträge eine **Kennung**: `LogEntry` (`crisisLog.ts`) optional `tag?: 'monument-done'`, der Pause-Eintrag aus `monumentView.ts` `paused: boolean`. Die Kosten eines Abschnitts liefert **eine** Funktion `monumentStageCost(m)` in `monumentView.ts`.

## Befund → Task (vollständig, nichts gestrichen)

| Befund                                      | Task | Fundort heute                                                                         |
| ------------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| kein DOM-Test `rest-monument`               | T00  | Zeile `rest-monument` in `inspect.ts:1125/1181`; Pausenzweig `monumentSection.ts:104` |
| Abschluss-Banner am Text erkannt            | T01  | `app.ts:1437` `e.text === MONUMENT_DONE_TEXT`                                         |
| Pausenzustand aus Knopftext                 | T01  | `monumentSection.ts:104` `e.text === 'Bau fortsetzen'`                                |
| `stage`-Sprung ergibt einen Chronik-Eintrag | T01  | `monumentView.ts:~260` `cur.stage > prev.stage`                                       |
| Kosten doppelt                              | T02  | `monumentView.ts:66,226` und `app.ts:~730`                                            |
| «Abreissen» als Literal                     | T03  | Neuzählung per grep vor T03 (u. a. `inspect.ts:204`, `hints.ts:361`)                  |
| `stateText` ohne Aufrufer                   | T03  | `texts.ts:112`, Re-Export `inspect.ts:82`                                             |
| `isSaveChord` zieht `sim/defs` mit          | T03  | `isSaveChord` in `hotkeys.ts:62`; `modal.ts:3` importiert `hotkeys` (→ `sim/defs`)    |
| `RESERVE_TICKS = 1000` neben Sim-800        | T03  | `balance-monument.test.ts:48` vs. `defs/monument.ts:19`                               |

## Tasks (Test-first; Umsetzer `tech-ui-engineer`, ein Strang, sequenziell)

**T00 · Charakterisierung `rest-monument` (DOM-Fakes).** Kein jsdom/happy-dom: Fake-Elemente nach dem Muster `tests/render/fakeCtx.ts`, neu `tests/ui/fakeDom.ts`. Test belegt Pause an/aus (`dataset.paused`), Abschlusszeile, `setText`/`setHidden`. Grün vor dem Umbau; Ersatz für den Rot-Beleg ist der Mutationsbeleg (Knopftext und `paused`-Quelle mutieren, Test wird rot; im Report, R395/R410). AK-1.

**T01 · Kennungen statt Texte.** Rot zuerst: (a) Sprung 0→2 liefert zwei Einträge, **nur der letzte mit Toast**; Pin: Sprung = 1 genau ein Eintrag wie heute, `prev.stage = -1` kein Eintrag; (b) Abschluss-Eintrag trägt `tag: 'monument-done'`; (c) Pause-Eintrag trägt `paused`; (d) T00 bleibt grün, wenn der Knopftext geändert wird. Dann `app.ts`, `monumentSection.ts`, `monumentView.ts`, `crisisLog.ts`. AK-2, AK-3, AK-4. Randfall (Sprung > 1: Laden oder Test) ist die einzige sichtbare Wirkung, im Normalspiel nie.

**T02 · Eine Kostenquelle.** Rot: `monumentStageCost` fehlt; Wert gleich `MONUMENT_STAGES[stage].money`, 0 bei fertigem oder fehlendem Denkmal. `monumentView.ts` und `app.ts` nutzen sie. Zusätzlich Test des Fehlerpfads `startMonumentStage` bei zu wenig Geld: Meldung unverändert (Textvergleich gegen den heutigen Wortlaut). AK-5, AK-6.

**T03 · Konstanten und Importe (gebündelt, `inspect.ts` zuletzt).**

- (a) `DEMOLISH_VERB` in `texts.ts`; Rot: Test auf die Konstante, dazu je Fundort ein Textvergleichs-Pin (Liste nach Neuzählung), Wortlaut byte-gleich.
- (b) `stateText` und Re-Export `inspect.ts:82` entfernen (`stateInfo` bleibt); `grep stateText src tests` = 0.
- (c) `isSaveChord` mit `Mods` nach `src/ui/saveChord.ts` (sim- und DOM-frei); `hotkeys.ts`, `input.ts`, `modal.ts` zeigen darauf. Rot: **Verhaltenstest**, `saveChord.ts` ist ohne `hotkeys` importierbar und liefert die bestehenden Tastenfälle (Strg/Cmd+S, nicht mit Alt/Umschalt); bestehende Tasten-Tests bleiben grün.
- (d) `RESERVE_TICKS` **nur kommentieren** (Begründung 1000 neben Sim-800, Bezug auf `MONUMENT_RESERVE_TICKS`); Angleichen nur per eigenem Ruling. Kein Rot-Beleg.
- AK-7, AK-8, AK-9, AK-10. Nach M14-E1 starten; `inspect.ts` als letzte Datei.

**T04 · Doku (Lead).** `docs/arc42.md` (`saveChord.ts`, falls UI-Dateien einzeln stehen), `docs/beobachtungen.md` Zeilen 50 und 109 auf erledigt. README unverändert. D1 erlaubt (E-017).

## Abnahmekriterien

AK-1 DOM-Test `rest-monument` mit Pause/Abschluss. AK-2 Banner hängt am Tag. AK-3 Pause hängt an `paused`. AK-4 Stage-Sprung: Eintrag je Abschnitt, nur der letzte mit Toast; Pins grün. AK-5 Eine Kostenfunktion. AK-6 Fehlerpfad-Meldung unverändert. AK-7 `DEMOLISH_VERB` und Pin je Fundort. AK-8 `stateText` weg. AK-9 `isSaveChord` ohne `hotkeys` importierbar. AK-10 `RESERVE_TICKS` kommentiert, Wert unverändert, Balancing grün. AK-11 Kein Anzeigetext ändert sich.

## Datei-Ownership (Worktree `.worktrees/ui-aufraeum-2`, Branch `refactor/ui-aufraeum-2`)

| Dateien                                                                                                                                           | Task     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `src/ui/monumentView.ts`, `monumentSection.ts`, `crisisLog.ts`, `tests/ui/fakeDom.ts`, `tests/ui/monument*.test.ts`                               | T00–T02  |
| `src/ui/app.ts` (Banner ~1437, `startMonumentStage` ~721–730)                                                                                     | T01, T02 |
| `src/ui/texts.ts`, `hints.ts`, `saveChord.ts` (neu), `hotkeys.ts`, `modal.ts`, `input.ts`, `tests/ui/` Pins, `tests/sim/balance-monument.test.ts` | T03      |
| `src/ui/inspect.ts` (zuletzt)                                                                                                                     | T03      |
| `docs/arc42.md`, `docs/beobachtungen.md`                                                                                                          | T04      |

Nicht anfassen: `src/sim/`, `src/render/`, Spielwerte, `docs/studio/rulings.md`.

## Überschneidung und Reihenfolge

Mit M14-E1 nur `inspect.ts` (T06 dort, T03 hier). **Reihenfolge: M14-E1 mergen, dann UI-AUFRAEUM-2** (R563); main per Merge holen (§6.3).

## Pflichtpunkte

- **Testzeiten** vorher/nachher (R392, E-052): `make test` vor T00 und nach T03, berührte Dateien einzeln.
- **Rot-Beleg** je neuem Test (R395, R410); Ersatz für T00 und T03(d) wie oben.
- Exit-Codes (`…; echo EXIT=$?`): `npx tsc --noEmit`, `make lint`, `make test`, `make zeittests`, `make conflicts`, `make docs-check` alle 0; Balancing grün.
- **Browser-Check** `qa-playtester` 1 Lauf (Denkmal-Panel: Abschnitt, anhalten/fortsetzen, Banner; `.studio/qa/ui-aufraeum-2/`).
- Review je Task `qa-code-reviewer`; **Final-Review `opus`**; nach ZURÜCK Delta-Review per SendMessage (R553).

## Budgetantrag

4 Tasks (T00–T03) × 2 = 8; Playtester 1; Final-Review 1; Summe 10; + 30 % = **13 Starts** (R563). T04 macht der Lead. Fix-Runden per SendMessage. Parallelität 1. Aufwand ≈ 200 Tools. Modelle: Umsetzer, Reviewer, Playtester `sonnet`; Final `opus`. Ein Umsetzer: L0 kann direkt briefen (E-037).

## Risiken

(1) Konflikt in `inspect.ts`: durch Reihenfolge und „zuletzt“ entschärft. (2) Fake-DOM bildet nur die genutzten Felder nach, bewusst klein halten. (3) Randfall-Toast bei Sprung > 1 nur im Ladefall.
