# TASTEN-KOMFORT — Plan

Spec: `docs/superpowers/specs/2026-10-08-tasten-komfort-spec.md` (Gate OK, R338). Worktree `.worktrees/tasten`, Branch `feat/tasten-komfort`.
L0-Entscheide: OF-1 Leertaste schliesst Info-Panel nicht; OF-2 kontor2 wie Kontor; OF-3 Pause-Tooltip «Pause / weiter (P oder Leertaste antippen)»; OF-4 Cmd+Klick Hauptweg (README).

## Architektur (nur `src/ui/`)
Reine DOM-freie Helfer zuerst (`spaceTap.ts`, `pipette.ts`, Erweiterungen `hotkeys.ts`, `input.ts`-Funktionen), danach dünne Verdrahtung
in `input.ts`/`app.ts`, dann Panel/Tooltips/README. Keine Änderung an `src/sim/`, kein Save, keine Dependency, keine ADR nötig (Umkehrbarkeit billig).

## Ownership
Ein Umsetzer (`tech-ui-engineer`), seriell T1→T4 im selben Baum. Dateien: `src/ui/{spaceTap,pipette,hotkeys,input,app,inspect,hud}.ts`,
`tests/ui/*`, `README.md`. Nicht anfassen: `src/sim/`, `src/render/`.

## Tasks
| Task | Titel | Datei | AK | blocked-by | Modell |
|---|---|---|---|---|---|
| T1 | Helfer Leertaste + Umschalt+U | T01-helfer-ac.md | 01-09, 15-18 | – | sonnet |
| T2 | Helfer Pipette | T02-helfer-pipette.md | 10-14, 19 | T1 | sonnet |
| T3 | Verdrahtung input/app | T03-verdrahtung.md | 20-27, 29-32 | T1, T2 | sonnet |
| T4 | Panel, Tooltips, README | T04-panel-doku.md | 28, 30, 33, 34 | T3 | sonnet |

Review: je Task `qa-code-reviewer` (sonnet), nach T4 Final-Review auf opus über die Branch; Browser-Check `qa-playtester` nach T3 und T4 (AK-TK-21..33).
Budget: 4 Umsetzer + 4 Reviews + 2 Browser-Checks (bündelbar) ≈ 10 Starts; ≤ 120 Tools, ≤ 2 parallel (praktisch seriell wegen Dateien).
