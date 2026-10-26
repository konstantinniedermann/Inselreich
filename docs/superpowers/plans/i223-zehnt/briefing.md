# Plan I-223 · Controller-Briefing und Prüfpflichten

Zurück zum [Index](index.md). Beide Blöcke wörtlich in die Briefings übernehmen.

## Controller-Briefing (wörtlich übernehmen)

- **Delta-Review nach ZURÜCK oder BEDENKEN: immer frischer Start (opus), nie Fortsetzung desselben Reviewers per `SendMessage` (R673, R774, E-077).**
- Controller auf `sonnet`, höchstens 4 Tasks je Instanz, Übergabe per Ledger bei 200k Kontext oder nach 6 Starts (R167, R190): Instanz 1 T00–T03 (startet B nach T02-Review OK), Instanz 2 T04-Abnahme, Merge B → A, T05, T06, Instanz 3 T07, T08, Final-Review, Abschluss.
- Vor dem Start von B: `.studio/limits.json` (Ampel) und `uptime`; bei gelb oder rot kein Start.
- Arbeiter- und Reviewer-Briefings: nur Task-Datei und AK-IDs; Zeile «Melde dein Ergebnis per SendMessage an ‹agentId des Controllers›, nie an main» (R879).

## Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380, R920 V1): Last ≤ 4 nötig** (1-min-Load) und kein fremder `vitest`/`make check`-Lauf (`make messfenster`), sonst `waiting`.
- **Rot zuerst:** je neuem Test Lauf vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe), im Ledger. Ausnahme Regressionspins (AK-ZE-01/25 vor der Änderung, P-9): grün vor und nach.
- **Teilbeleg je Task:** gezielte Tests (Befehl in der Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Nie `make check` je Task.
- **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` grün in T02 und T06; `git diff main -- tests/sim/balance.test.ts tests/sim/seaGolden.test.ts` leer.
- Keine Uhr in neuen Tests; Zahlen aus den Defs oder gegen die Spec-Werte; kein Versionsliteral; Dateien > 30 KB nur abschnittsweise (`save.ts` 42 KB, `inspect.ts` 45 KB, `app.ts`); Suche mit `rg <muster> <pfad>`.
- Gezielt stagen, Präfixe `feat:`/`test:`/`docs:`; kein Rebase, kein `reset --hard`, kein Force-Push; main per Merge.
- `make docs-check; echo EXIT=$?` Exit 0 vor jedem Commit unter `docs/` oder `README.md`.
