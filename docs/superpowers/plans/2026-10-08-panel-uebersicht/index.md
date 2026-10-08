# PANEL-UEBERSICHT — Plan

Spec: `docs/superpowers/specs/2026-10-08-panel-uebersicht-spec.md` (+ Anhänge; Gate OK, R340). Worktree `.worktrees/panel`, Branch `feat/panel-uebersicht`.
L0-Entscheide: Ausbau-Karte vor Freischaltung mit Sperrgrund; Stufe Text + Pips; Kacheln; Gewinn Vorher→Nachher + Delta; Panel 280 px; kein Ist-Ausstoss.

## Architektur (nur `src/ui/`, `src/style.css`)

Neues reines Modul `src/ui/panelView.ts` (nur `World`/`Building` rein, Ansichtsdaten raus; setzt bestehende Abfragen aus `inspect.ts`,
`texts.ts`, `time.ts` zusammen). `inspect.ts` baut das Gerüst (drei Zonen head/stats/upgrade) einmal je Auswahl und aktualisiert per
`setField` ohne Knoten-Neuerzeugung (G-3). Kachel-Struktur hängt nur an `defId` (`statKeys`). Kein Sim-/Save-/Defs-Eingriff, keine Dependency, kein ADR.
Zirkularität: `panelView.ts` importiert `upgradeView`/`progressPct`/`utilizationText` aus `inspect.ts`; wenn das einen Importzyklus ergibt,
diese reinen Funktionen unverändert exportiert lassen und `panelView` nur Typen/Funktionen importieren lassen, die `inspect` zur Laufzeit nicht beim Laden braucht (Funktionsaufrufe erst zur Laufzeit sind zyklusfest in ESM).

## Ownership

Ein Umsetzer (`tech-ui-engineer`), seriell T1→T4 im selben Baum. Dateien: `src/ui/panelView.ts`, `src/ui/inspect.ts`, `src/style.css`,
`tests/ui/panelView.test.ts`, `tests/ui/contrast.test.ts`, `README.md`, `docs/arc42.md`. `tests/ui/inspect.test.ts`: nur lesen (AK-PU-18).
Nicht anfassen: `src/sim/`, `src/render/` (lead-art, PERF-L57), `src/ui/trade.ts`, `src/ui/hover.ts`.

## Tasks

| Task | Titel                              | Datei                | AK                       | blocked-by | Modell |
| ---- | ---------------------------------- | -------------------- | ------------------------ | ---------- | ------ |
| T1   | `panelView.ts` rein, TDD           | T01-panelview.md     | 01-17                    | –          | sonnet |
| T2   | Gerüst Betrieb + Kopf Amtsstube/Kontor | T02-geruest-a-c.md | 18, 22-26, 28, 29, 32  | T1         | sonnet |
| T3   | Wohnhaus Teil B                    | T03-wohnhaus.md      | 27                       | T2         | sonnet |
| T4   | CSS, ARIA, Tests, README, arc42    | T04-css-doku.md      | 19, 20, 30, 31, 33       | T3         | sonnet |

Review: ein Final-Review `qa-code-reviewer` (opus) über die Branch (Freigabe L0: statt Review je Task); Browser-Check `qa-playtester` nach T4 (AK-PU-22..32, 1280×720 und 1920×1080).
Budget: 3 Umsetzer-Aufrufe (T1; T2+T3; T4), 1 Review, 1 Browser-Check, je 1 Fix-Runde Reserve; gesamt ≤ 120 Tools, ≤ 2 parallel (praktisch seriell, gleiche Dateien).
Gate je Task: `make lint` und `npx vitest run tests/ui` grün; am Ende `make check` (zeitreserve darf bei Load > 4 nur warnen).
