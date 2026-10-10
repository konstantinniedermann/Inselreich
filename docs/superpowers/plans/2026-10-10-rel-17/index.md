# REL-17 Implementation Plan — Index (UI-PROBLEM-SPRUNG)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `.`/`,` springt zum nächsten/vorigen Problem und öffnet dessen Panel (I-042); das Abriss-Werkzeug zieht Wege in einem Zug ab und warnt, wenn ein Abriss Gebäude vom Kontor trennt (I-041).

**Architecture:** siehe Abschnitt «Architektur». **Tech Stack:** TypeScript, Vitest, Canvas 2D, keine Laufzeit-Abhängigkeit.

**Spec:** keine Spec-Datei (Stufe leicht). Grundlage: Kurzdesign `lead-design` im Handoff `.studio/handoffs/2026-10-10-lead-design-UI-PROBLEM-SPRUNG.md`, angenommen in R449 (Entscheide 1–4); Auswahl R448.

Prozessstufe leicht · Meilenstein REL-17 · Paket UI-PROBLEM-SPRUNG · Planbasis `main` @ `9a3483a1` · Format E-010: dieser Index, [ak.md](ak.md) (AK-R17-01…20 mit Zuordnung zum Kurzdesign) und je Task eine Datei ≤ 10 KB. Arbeiter und Reviewer lesen nur ihre Task-Datei und die dort genannten AK aus `ak.md`.

**blocked-by: REL-16-Merge.** Die Umsetzung startet erst, wenn REL-16 auf `main` liegt (R449, Dateimatrix E-019); der Worktree zweigt danach von `main` ab.

## Global Constraints

- Kein Sim-Code: `git diff main -- src/sim/ src/render/ src/audio/` bleibt leer (kein Spielwert, keine `SAVE_VERSION`, keine Migration, keine Baseline); `tests/sim/` byte-gleich zu `main`. `src/sim/` wird nur gelesen (`houseDiagnosis`, `missingInputs`, `needsConnection`, `b.state`, `b.connected`).
- Nichts aus dem Problem-Sprung landet im Spielstand oder in `GameState`-Feldern, die gespeichert werden; der Cursor lebt in der `startGame`-Closure.
- `src/ui/problems.ts` ist rein und DOM-frei (wie `islandJump.ts`), kein Kamera-Parameter; `tests/ui/imports.test.ts` bleibt grün (keine Zyklen).
- `src/ui/hints.ts` (REL-16) wird **nicht** geändert, nur `unconnectedIds`/`newlyConnected` wie bisher von `app.ts` genutzt.
- TOOL-TESTLOCK (R380): in den Tasks nur gezielte Läufe (`npx vitest run <Dateien>`), kein `make test`/`make check`; je Code-Task `npx tsc --noEmit` und `make lint` Exit 0 (R398); `make check` einmal durch den Controller am Ende. Exit-Codes per `; echo EXIT=$?`, nie in eine Pipe.
- Code-Änderungen mit Edit/Write, nicht per sed/perl; Commit-Präfixe `feat:`/`test:`/`refactor:`/`docs:`; vor jedem Doku-Commit `make docs-check` Exit 0; kein Rebase, `main` per Merge holen.

## Architektur

1. **Problem-Liste (A, T01):** `problemList(world, anchor)` sammelt Probleme in vier Klassen (Kurzdesign „Problem-Klassen“), sortiert nach Klasse, Anker-Insel zuerst, übrige Inseln nach Index, Abstand des Sprungpunkts zu `jumpTarget(world, insel)`, Gebäude-ID. `problemStep(world, cursor, activeIsland, dir)` liefert das nächste/vorige Problem samt „n von m“ und neuem Cursor; `cutOffIds`/`newlyCut` liefern die Menge „nicht angebunden“ für Klasse 1 und die Trenn-Warnung (eine Quelle).
2. **Anker gegen Pendeln (Entscheid E3):** „Aktive Insel zuerst“ mit der Insel zum Tastendruck würde nach jedem Inselwechsel neu sortieren und zwischen zwei Inseln pendeln. Der Cursor merkt die Anker-Insel des Umlaufs und die Insel nach dem Sprung (`landed`); weicht die aktive Insel beim nächsten Druck ab (Spieler hat selbst geschwenkt), beginnt ein neuer Umlauf ab der dann aktiven Insel.
3. **Sprung (B, T02):** `hotkeyAction` liefert `problemNext`/`problemPrev`; `app.ts` bricht eine laufende Zeigeraktion ab (E6), zentriert per `centerOn` auf die Footprint-Mitte in Archipel-Kacheln, öffnet `setPanel({ kind: 'inspect', id })` **ohne** Werkzeugwechsel (E1), ruft `refresh()` (aktive Insel folgt) und zeigt eine ersetzende Meldung über `replaceMessage('problem', …)` in `messages.ts` (E7).
4. **Abriss-Zug (C, T03):** `isDragPaintTool` nimmt `demolish` auf; trifft der Druck eine Gebäudehülle, bleibt es ein Einzelabriss (kein Zug). Im Zug pickt `input.ts` die Bodenkachel (`strokePickTool`) und meldet jede Kachel mit `dragging: true`; `app.ts` ruft dort nur `removeRoad`, überspringt Gebäude und leere Kacheln still und wertet am `dragEnd` die Trenn-Warnung bzw. den reinen Klick auf leeren Boden aus (`strokeEndNotice`, E5). Klang je Kachel `sound.play('demolish')`, schon gedrosselt (`THROTTLE_MS.demolish` 80 ms, `src/audio/sound.ts`), kein Eingriff in `src/audio/`.
5. **Doku (D, T04):** README (Tastentabelle, Abriss, „Wann eine Aktion wirkt“), arc42 (Ebene 2 `src/ui/`, Ziel je Werkzeug), Beobachtungen, Entwurf der Release-Notiz für `state.md` (trägt L0 ein).

## Strang, Worktree, Datei-Ownership

Ein Strang, ein Umsetzer (`tech-ui-engineer`), ein Worktree `.worktrees/rel-17`, Branch `feat/rel-17-problem-sprung` (von `main` nach dem Merge von REL-16).

Dateien (alle exklusiv beim einen Umsetzer):

- T01: `src/ui/problems.ts` (neu), `tests/ui/problems.test.ts` (neu), `src/ui/hover.ts` (nur `export` vor `HOUSE_TITLES`)
- T02: `src/ui/hotkeys.ts`, `tests/ui/hotkeys.test.ts`, `src/ui/messages.ts`, `src/ui/app.ts` (Sprung-Teil)
- T03: `src/ui/input.ts`, `tests/ui/input.test.ts`, `src/ui/app.ts` (Abriss-Teil); `problems.ts` nur lesen
- T04: `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`
- T05, T06: keine (Browser-Lauf mit Ablage `.studio/qa/REL-17/`, Review)

T02 und T03 teilen `src/ui/app.ts` und laufen deshalb nacheinander im selben Baum mit demselben Umsetzer (SendMessage). **Berührungspunkte mit REL-16** (Plan `docs/superpowers/plans/2026-10-10-rel-16/`, T01/T02): REL-16 ändert in `app.ts` `showRoadFailure` (Z. ~754, neuer optionaler Parameter `at`), den Bau-Fehler (Z. ~853), den Aufruf nach `placeRoad` (Z. ~861) und `dispose` (Z. ~1294–1318); dazu `hints.ts` (`ReasonCtx.at`) und `hud.ts`. REL-17 ändert in `app.ts` Importe, das Umfeld von `jumpToIsland` (Z. 420–426, neuer `jumpToProblem`), die Zug-Flags (Z. 749–752, **neben** `showRoadFailure`), `onHotkey` (Z. 771–791), den `dragEnd`-Zweig (Z. 836) und den Abriss-Zweig (Z. 877–884, **drei Zeilen unter** dem `placeRoad`-Aufruf); `dispose`, `hints.ts`, `hud.ts` bleiben unberührt. Nebeneinanderliegende Hunks → Stapeln nötig, deshalb blocked-by; der Abriss-Pfad nutzt `showRoadFailure` ohne `at`, verträglich mit der neuen Signatur.

## Tasks

| ID  | Titel                                       | Datei                                  | AK (`ak.md`)     | Strang | blocked-by    | Modell | Grösse         |
| --- | ------------------------------------------- | -------------------------------------- | ---------------- | ------ | ------------- | ------ | -------------- |
| T01 | Reiner Helfer `problems.ts` (TDD)           | [T01-problems.md](T01-problems.md)     | 01–07            | UI     | REL-16-Merge  | sonnet | M (≈ 25 Tools) |
| T02 | Tasten `.`/`,`, Sprung, ersetzende Meldung  | [T02-sprung.md](T02-sprung.md)         | 08–11            | UI     | T01           | sonnet | S (≈ 20 Tools) |
| T03 | Abriss-Zug und Trenn-Warnung                | [T03-abriss-zug.md](T03-abriss-zug.md) | 12–16            | UI     | T01, T02      | sonnet | M (≈ 25 Tools) |
| T04 | Doku und Release-Notiz-Entwurf              | [T04-doku.md](T04-doku.md)             | 17               | UI     | T03           | sonnet | S (≈ 10 Tools) |
| T05 | Browser-Check am Kandidaten (Release-Check) | [T05-browser.md](T05-browser.md)       | 10, 11, 13–16,18 | –      | T04, Kandidat | sonnet | 1 Lauf         |
| T06 | Final-Review `opus` über den Kandidaten     | [T06-final.md](T06-final.md)           | 01–20            | –      | T05           | opus   | 1 Review       |

Reihenfolge: T01 → T02 → T03 → T04 im Strang (Umsetzer `tech-ui-engineer` → `qa-code-reviewer` sonnet → Fix-Runde per SendMessage bis OK; T02–T04 setzen Umsetzer und Reviewer per SendMessage fort). Danach `git merge main` im Worktree, `make check` einmal durch den Controller, `log.py result`, Häppchen release-reif. T05 und T06 laufen im Release (Gate Merge Release, Schritte 3 und 4) am Kandidaten (Entscheid E9).

## Review Focus

1. Zwei Inseln mit Problemen: `.` läuft alle m Probleme genau einmal durch und kehrt zu „Problem 1 von m“ zurück, ohne zwischen den Inseln zu pendeln (T01-Test, T05 Schritt 4).
2. Wegzug quer über eine Strasse mit Haus und Weberei: nur Wegkacheln fallen weg, Erstattung 2 Geld je Kachel, Gebäude stehen (T03, T05 Schritt 6).
3. Druck auf eine Gebäudehülle mit Abriss: genau dieses Gebäude fällt, kein Zug, kein Weg daneben (T03).
4. Weg zur Weberei weg (Zug oder ein Klick): genau eine Meldung „Abriss trennt 1 Gebäude vom Kontor“, danach führt `.` zur Weberei (T03, T05 Schritt 7).
5. `.` mitten in einem Weg- oder Abriss-Zug: der Zug endet, keine Linie über die Karte (T02, T05 Schritt 8).
6. Bauwerkzeug `R` aktiv, `.`: Werkzeug bleibt `R`, Panel offen, Bauleiste und Panel überdecken sich nicht bei 1280 × 720 (T05 Schritt 1).

## Budgetantrag

Formel (Handbuch, Budget): Pakete T01–T04 × 2 = 8 + QA-Check T05 = 1 + Final-Review T06 = 1 → 10; + 30 % = 13 → **13 Starts**, geteilt nach E9: **lead-tech 11** (T01–T04 mit dem ganzen Puffer), **lead-qa 2** im Release-Start (T05, T06). Geplant sind **4 Starts**: Umsetzer und Reviewer (2, Fortsetzung per SendMessage), `qa-playtester` und `qa-code-reviewer` opus (2, im lead-qa-Start). Parallelität: 1 Arbeiter zugleich im Strang, 1 Browser. **Schätzung:** ≈ 315 Tools, ≈ 53 min (Controller ≈ 40, Umsetzer 4 Tasks ≈ 80, Reviewer 4 × ≈ 10, Fix-Runden ≈ 20, Playtester ≈ 50, Final-Review ≈ 55, lead-qa ≈ 30; Richtwerte M7, Minuten = Tools ÷ 6).

Controller: `lead-tech` auf `sonnet`, eine Instanz für T01–T04 (≤ 4 Tasks, R167; 2 Arbeiter-Starts, R190).

## Entscheidungen für das kombinierte Gate

- **E1 Panel und Bauwerkzeug zugleich (Risiko aus dem Kurzdesign): geht.** Heute schliesst nur `selectTool` das Panel bei einem Werkzeug ≠ Auswahl (`app.ts` Z. 718); sonst hängt nichts daran: Auswahl-Rahmen kommt aus `selectedId`, die Hover-Karte ist bei Werkzeugen ohnehin aus (R435), `Umschalt+U` liest das offene Panel, `Esc` schliesst beides, ein Abriss des gezeigten Gebäudes schliesst das Panel über `refresh` (Z. 693 f.). Empfehlung: Werkzeug bleibt, nur `setPanel`; Layout-Probe in T05 Schritt 1. Alternative: Werkzeug auf Auswahl zurücksetzen (Design widerspricht).
- **E2 Meldungstexte** ([ak.md](ak.md), AK-R17-05): aus Hover-Zeile, Zustands-Chip und `diagnosisText`, keine neue Wortfamilie. Empfehlung: annehmen; `lead-design` kann im Gate Wortlaut ändern, ohne Plan-Folgen.
- **E3 Anker-Insel im Cursor** (Architektur 2): Empfehlung ja (sonst Pendeln zwischen zwei Inseln). Alternative: Insel-Reihenfolge nur nach Index (aktive Insel nicht zuerst, weicht vom Kurzdesign ab).
- **E4 Klasse 1 „nicht angebunden“** = `needsConnection(defId) && !connected`, also Betriebe **und** Dienste/Markt/Feuerwache; dieselbe Menge zählt die Trenn-Warnung. Amtsstube und Kontore nie. Empfehlung ja (sonst führt `.` nach der Warnung nicht zu jedem getrennten Gebäude).
- **E5 Klick mit Abriss auf leeren Boden:** heute Fehler „Hier liegt kein Weg“. Empfehlung: bleibt nur beim reinen Klick (Zug mit einer Kachel ohne Abriss, ausgewertet am Zugende), der Zug selbst ist still. Alternative: immer still (rote Vorschau genügt).
- **E6 `.`/`,` während eines Zugs** bricht ihn per `cancelPointerAction` ab (sonst zieht der nächste Move eine Linie zur neuen Kameraposition). Empfehlung ja.
- **E7 Ersetzende Meldung:** neue Funktion `replaceMessage(slot, text, kind)` in `messages.ts` (entfernt den Toast desselben Slots, ohne Dedupe), Browser-belegt, weil `tests/ui/` kein DOM hat. Empfehlung ja. Alternative: `showMessage` (Dedupe 3 s, bis 3 Toasts gestapelt, nicht ersetzend).
- **E8 Klang:** kein Drosseln nötig (`THROTTLE_MS.demolish` = 80 ms). Info, kein Entscheid.
- **E9 Browser-Lauf und Final-Review nur am Kandidaten** im `lead-qa`-Start (Ein-Paket-Release, R429 V3), statt zusätzlich am Branch. Empfehlung ja (spart ≈ 50 Tools); Risiko: UI-Befund erst am Kandidaten → Fix auf der Branch, Kandidat frisch. Alternative: T05 im Strang durch lead-tech (+1 Start, + ≈ 50 Tools).

## Ausgelagert (nicht REL-17)

Zähler-Knopf „⚠ n“ und klickbare Gut-Chips (I-043, R449 (3)); `storageFull` als Problem (bis I-035, R449 (2)); Speichern des Cursors; Sprung per Ereignis-Log auf Fremdinseln (T04 prüft und notiert nur).
