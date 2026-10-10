# UI-GUT-CHIP (I-043) Implementation Plan — Index (Gut-Chip zeigt Erzeuger und Verbraucher)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Ziel:** Klick auf einen Lager-Chip markiert alle Erzeuger und Verbraucher-Betriebe des Guts auf der aktiven Insel, springt zum ersten (Panel offen, Meldung M1) und lässt `.`/`,` die Liste durchgehen. Reiner UI-Zustand: Sim, Save, Spielwerte unberührt.

**Grundlage:** Kurzdesign `.studio/handoffs/2026-10-10-lead-design-UI-GUT-CHIP.md`, Ruling **R461** (Fragen 1–4 wie empfohlen), Abnahmekriterien wörtlich in [ak.md](ak.md). Prozessstufe **leicht** (Plan in einem Gate mit Spec) · Paket UI-GUT-CHIP · Planbasis `main` @ `1b723334` · Experiment E-054 (Plan auf sonnet). Arbeiter und Reviewer lesen nur ihre Task-Datei und die dort genannten AK in `ak.md`.

## Global Constraints

- **Reihenfolge:** Umsetzung erst **nach dem Merge des M13-E1-UI-Strangs** (`feat/m13-e1-ui`; T09–T12 ändern `problems.ts`, `texts.ts`, `hover.ts`, `app.ts`, `inspect.ts`, Tests). Abzweig des Worktrees danach von `main`. Zeilennummern im Plan gelten für `1b723334` und **driften**; jede Task-Datei beginnt mit dem Pflicht-Schritt 0 „Zeilenstände nach M13-E1-Merge prüfen“ (`grep -n` der genannten Symbole, `git log --oneline 1b723334..main -- <Dateien>`).
- `src/sim/` und `tests/sim/` bleiben **unverändert** (nur lesen: `BUILDING_DEFS`, `goodsBalance`, `missingInputs`, `buildLock`, `populationByTier`, `TIERS`). Kein Save-Feld, keine `SAVE_VERSION`, keine Spielwerte, keine Laufzeit-Abhängigkeit, kein ADR (ein Mechanismus, kein Bestand). Darstellungswerte (Farbe, `MAX_FOCUS_MARKS`) stehen in `src/render/`.
- **Ein Sprung-Mechanismus:** gemeinsamer Helfer aus `problemStep` in `src/ui/problems.ts` (T01); kein zweiter Umlauf. Der Gut-Fokus liefert Einträge mit `key`, `sort`, `id`, `at`, `island` und ruft denselben generischen Helfer `stepList`.
- Sim-Aktionen werfen nie; `src/render/` schreibt nie in die Welt, `src/audio/` unberührt. Desktop-first ab 1280 px, schmaler nur „stürzt nicht ab“. Render-Hervorhebung nur sichtbarer Gebäude, ≤ 40 (`MAX_FOCUS_MARKS`).
- TOOL-TESTLOCK (R380): in Tasks nur gezielte Läufe `npx vitest run <Dateien>`, je Task `npx tsc --noEmit` und `make lint` Exit 0; `make test`/`make check` nur der Controller (am Ende). Exit-Codes `; echo EXIT=$?`, nie in eine Pipe. Code mit Edit/Write, nicht per sed/perl. Commit-Präfixe `feat:`/`test:`/`refactor:`/`docs:`; vor Doku-Commits `make docs-check`. Kein Rebase.
- **Test-first:** je Task erst der rote Test (Lauf zeigt Rot), dann die Umsetzung. Bestehende Tests ändern nur, wo die Task-Datei es nennt (T01: Importpfad; T04: `stockTooltip`-Erwartung).

## Architektur (≤ 15 Zeilen)

1. **T01 Umbau:** `HOUSE_TITLES` nach `texts.ts`; `src/ui/problems.ts` exportiert `stepList(list, cursor, activeIsland, dir)` (reiner Umlauf mit Cursor/Rückfall); `problemStep` ruft ihn. Verhalten unverändert.
2. **T02 `src/ui/goodFocus.ts` (neu):** `focusList(world, island, good): FocusEntry[]` (`key`, `sort`, `id`, `island`, `at`, `role`), Texte M1/M2/M3, `producerNames`. Importiert `problems.ts` (Typ, `stepList`), `texts.ts`, `islandJump.ts`; nie `hover.ts`.
3. **T03 gleiche Datei:** `FocusState = { good, island } | null`, reiner Reducer `focusReduce(state, event)`; `runFocusToggle(deps, good)` und `runFocusStep(deps, dir)` mit Deps-Objekt wie `ProblemJumpDeps` (Fakes im Test); eigener Cursor `FocusCursor`, getrennt vom Problem-Cursor.
4. **T04 HUD:** Lager-Chips `<button type="button">` in `hud.ts`, `aria-pressed`, `:focus-visible`, Klick → `HudActions.toggleGoodFocus(good)`; `stockTooltip` bekommt die zweite Zeile (Zahlen aus `focusList`/`populationByTier`).
5. **T05 Render:** `src/render/focusMarks.ts` (neu) `drawFocusMarks(ctx, frame…)`; `RenderFx.focus?`; Aufruf in `render()` vor der Auswahl-Kontur; Farbe `signalFocus` in `palette.ts`.
6. **T06 Verdrahtung `app.ts`:** Zustand `focus`/`focusCursor` in der Closure; `.`/`,` und `Esc`; Löschen bei Inselwechsel (`refresh`), Neue Insel, Laden; `fx.focus`; Chip-`blur()` nach Mausklick; Meldung `replaceMessage('gut', …)`.
7. **T07 Doku, T08 Browser-Lauf, T09 Branch-Review (opus)** als letzter Schritt nach allen Browser-Fixes (R462 B1).

## Worktree und Datei-Ownership

Ein Strang, ein Worktree `.worktrees/ui-gut-chip`, Branch `feat/ui-gut-chip`, Abzweig von `main` **nach dem M13-E1-UI-Merge**. Ein Arbeiter zugleich, Tasks seriell (T01 → T08); T02/T03 und T05 teilen keine Datei, werden aber nicht parallel gefahren (ein Baum).

| Task | Dateien (exklusiv)                                                                                                                                                                    | Von M13-E1-UI vorher geändert (Zeilenstände prüfen)                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| T01  | `src/ui/problems.ts`, `src/ui/texts.ts`, `src/ui/hover.ts`, `tests/ui/problems.test.ts` (nur ergänzen), `tests/ui/hover.test.ts` (nur Importpfad), `tests/ui/focusStep.test.ts` (neu) | `problems.ts` (T12: `isCutOff`), `texts.ts` (T12: `stateInfo`), `hover.ts` (T12: `troubleLine`), deren Tests |
| T02  | `src/ui/goodFocus.ts` (neu), `tests/ui/goodFocus.test.ts` (neu)                                                                                                                       | `texts.ts` (`stateInfo` Vorrang „Stillgelegt“)                                                               |
| T03  | `src/ui/goodFocus.ts`, `tests/ui/goodFocus.test.ts`                                                                                                                                   | —                                                                                                            |
| T04  | `src/ui/hud.ts`, `src/style.css`, `tests/ui/hud.test.ts`                                                                                                                              | `src/style.css` (T10, T12), `inspect.ts` nicht berührt                                                       |
| T05  | `src/render/focusMarks.ts` (neu), `src/render/palette.ts`, `src/render/renderer.ts`, `tests/render/focusMarks.test.ts` (neu)                                                          | — (Render-Dateien nicht im M13-E1-UI-Strang)                                                                 |
| T06  | `src/ui/app.ts`                                                                                                                                                                       | `app.ts` (T10 `setEdict`, T12 `setPaused`; `tradeCtx`)                                                       |
| T07  | `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`                                                                                                                                 | `README.md`, `docs/arc42.md` (M13-E1 T13)                                                                    |
| T08  | keine (Ablage `.studio/qa/ui-gut-chip/`; Fixes im Umsetzer-Baum)                                                                                                                      | —                                                                                                            |
| T09  | keine (Review `git diff main...HEAD`)                                                                                                                                                 | —                                                                                                            |

`tests/ui/imports.test.ts` prüft Importgrenzen: nach T02 laufen lassen (neue Datei `goodFocus.ts` darf `sim` lesen, kein DOM).

## Tasks

| ID  | Titel                                  | Datei                                        | AK ([ak.md](ak.md))       | blocked-by       | Modell | Grösse   |
| --- | -------------------------------------- | -------------------------------------------- | ------------------------- | ---------------- | ------ | -------- |
| T01 | Umlauf-Helfer, `HOUSE_TITLES` umziehen | [T01-umlauf.md](T01-umlauf.md)               | GC-04, 16 (Import)        | M13-E1-UI-Merge  | sonnet | S ≈ 20   |
| T02 | `focusList`, Meldungen M1/M2/M3        | [T02-focuslist.md](T02-focuslist.md)         | GC-01, 02, 03, 05 (Text)  | T01              | sonnet | M ≈ 25   |
| T03 | Fokus-Zustand und Sprungablauf         | [T03-ablauf.md](T03-ablauf.md)               | GC-05, 06, 07, 08, 09, 12 | T02              | sonnet | M ≈ 25   |
| T04 | Chip als Knopf, Tooltip-Zeile          | [T04-chip-tooltip.md](T04-chip-tooltip.md)   | GC-10, (14)               | T03              | sonnet | M ≈ 25   |
| T05 | Render: Konturen                       | [T05-render.md](T05-render.md)               | GC-11, (13)               | T03              | sonnet | M ≈ 25   |
| T06 | Verdrahtung in `app.ts`                | [T06-verdrahtung.md](T06-verdrahtung.md)     | GC-07, (13–15)            | T04, T05         | sonnet | M ≈ 35   |
| T07 | Doku README, arc42, Beobachtungen      | [T07-doku.md](T07-doku.md)                   | GC-16                     | T06              | sonnet | S ≈ 15   |
| T08 | Browser-Lauf am Kandidaten             | [T08-browser.md](T08-browser.md)             | GC-13, 14, 15             | T07              | sonnet | 1 Lauf   |
| T09 | Branch-Review opus (Final-Review)      | [T09-branch-review.md](T09-branch-review.md) | alle, GC-16               | T08 (alle Fixes) | opus   | 1 Review |

Je Task: Umsetzer `tech-ui-engineer` (T05 darf `art-rendering-engineer` sein, Empfehlung: `tech-ui-engineer`, da `src/render/` laut Persona mitgemeint) → `qa-code-reviewer` (sonnet, Urteil OK/BEDENKEN/ZURÜCK) → Fix-Runde per SendMessage bis OK. **Reihenfolge (R462 B1):** T01–T07 je mit sonnet-Review. Danach T08 (`qa-playtester`, ein Lauf). Fixes aus T08 im selben Baum (Umsetzer + sonnet-Review des Fix-Diffs, Teil-Wiederholung des Browser-Laufs). **Erst danach** T09: `qa-code-reviewer` mit `model: opus` über die ganze Branch (`git diff main...HEAD`); er gilt als Final-Review (Stufe leicht) und sieht alle Fix-Commits. Kein Fix nach T09 ohne neuen Delta-Review.

**Controller (R167, R190):** `lead-tech` auf sonnet, ≤ 4 Tasks je Instanz: **A** T01–T04, **B** T05–T09 samt Abschluss (Rulings, Handoff, `make check`, „bereit zum Merge-Gate“). Übergabe per Ledger `.superpowers/sdd/ui-gut-chip/ledger.md` und einem Satz Status.

## Review Focus

1. Genau **ein** Umlauf: `stepList` wird von `problemStep` und `goodFocus` gerufen; kein zweiter Cursor-/Rückfall-Code (AK-GC-04).
2. `problems.ts` importiert nichts aus `hover.ts`; `HOUSE_TITLES` in `texts.ts` (AK-GC-16).
3. Fokus ist reiner UI-Zustand: `JSON.stringify(world)` vor/nach gleich, kein Feld in `serialize` (AK-GC-12).
4. Problem-Cursor bleibt beim Fokus unberührt; `.`/`,` ohne Fokus verhalten sich wie REL-17 (AK-GC-08).
5. Renderer prüft nur sichtbare Gebäude des Fokus-Frames, ≤ `MAX_FOCUS_MARKS`, Form (durchgezogen/gestrichelt) statt nur Farbe, `focus: null` zeichnet nichts (AK-GC-11).
6. Chip-Knopf: `aria-pressed`, kein Tastaturfokus nach Mausklick (Leertaste-Schwenken), Leertaste/`.`/`,`/`Esc` bei Tastaturfokus auf dem Chip, verborgene Chips nicht klickbar (AK-GC-14).
7. Sim unberührt (R462 B6): `git diff --stat main...HEAD -- src/sim tests/sim src/ui/storage.ts` leer; `make check` grün (Controller, mit `balance.test.ts`).
8. Palette (R462 B3): `signalFocus` in `SIGNAL_NAMES` oder eigener ΔE-Test; CSS-Wert = Palette-Wert getestet.

## Budgetantrag

```text
Lead: lead-tech
Phase: UI-GUT-CHIP
Pakete:
- T01 Umlauf-Helfer, HOUSE_TITLES (nein)
- T02 focusList, Meldungen (nein)
- T03 Fokus-Zustand, Sprungablauf (nein)
- T04 Chip als Knopf, Tooltip (ja)
- T05 Render-Konturen (ja)
- T06 Verdrahtung app.ts (ja)
- T07 Doku (nein)
Formel: 7 × 2 + 1 (QA-Check: ein Browser-Lauf T08) + 1 Final-Review (T09, opus, nach T08) = 16 → × 1,3 = 20,8 → aufgerundet 21
Parallelität: 1 (ein Strang, ein Worktree, seriell)
Bisher frei/verbraucht: —
Begründung Mehrbedarf: —
Beantragt: 21 Starts, Parallelität 1 (Budget bleibt 21, R462 B8; Stufe leicht: ganz bei lead-tech)
```

Geplant sind **16 Arbeiter-Starts** (7 Umsetzer, 7 sonnet-Reviewer, 1 Playtester, 1 opus-Branch-Review T09 = 16, dazu 1 Reserve) und 2 Controller-Instanzen (zählen nach R433 zum Paket) = 18–19 von 21.

**Schätzung** (Richtwerte `docs/studio/metriken/richtwerte.md`, Tools ÷ 4 für Minuten): Umsetzer 165 Tools (T01 20, T02 25, T03 25, T04 25, T05 25, T06 35, T07 10), Reviewer 7 × 8 + 25 Aufschlag opus = ≈ 80, Fix-Runden ≈ 30, Playtester ≈ 30, Controller 2 × 35 = 70 → **≈ 375 Tools, ≈ 95 min Summe**; seriell ≈ **Wandzeit 90–100 min**. Das Kurzdesign schätzte 80–100 Tools für den Umsetzer-Teil; hier stehen Tools aller Beteiligten.

## Entscheidungen für das Gate (mit Empfehlung)

- **E1 Generischer Umlauf-Helfer:** `stepList<T extends { key: string; sort: ProblemSort }>(listFor: (anchor: number) => readonly T[], cursor, activeIsland, dir)` in `problems.ts`; `problemStep` übergibt `(a) => problemList(world, a)`, der Fokus `() => focusList(…)`. Keine Schein-Klasse für Erzeuger/Verbraucher; Sortierschlüssel der Fokus-Einträge `[Rolle 0|1, 0, Abstand, ID]`. Empfehlung ja; Alternative: `focusList` als `Problem[]` mit `cls` 1/2 — weniger Typarbeit, aber Scheinklassen.
- **E2 Chip-Verdrahtung über `HudActions`:** `toggleGoodFocus(good)` statt Event-Delegation in `app.ts`, damit `hud.ts` keinen Fokus-Zustand kennt (gleiches Muster wie `jumpToIsland`). Empfehlung ja.
- **E3 Ein Browser-Lauf T08 am Ende** statt je UI-Task (wie R453 E9/M13-E1 E6). Spart ≈ 2 Starts; Risiko: UI-Befund spät → Fix-Runde im selben Baum. Empfehlung ja.
- **E4 Plan gegen `1b723334`, Zeilen driften:** Pflicht-Schritt 0 in jeder Task-Datei; der Controller prüft vor T01 `git merge-tree --write-tree main feat/ui-gut-chip` Exit 0. Info.
- **E5 Render-Umsetzer:** T05 mit `tech-ui-engineer` (Persona deckt `src/render/`); Alternative `art-rendering-engineer` (Render-Spezialist, aber eigene Briefing-Kosten). Empfehlung `tech-ui-engineer`.

## Ausgelagert

Häuser markieren, Warenfluss-Linien, Zähler-Knopf „⚠ n“, dauerhafte Ebene (I-045), Beobachtung (b) `unconnectedIds` vs. `cutOffIds` (T07 hält den Eintrag in `docs/beobachtungen.md` offen), Pulsieren.
