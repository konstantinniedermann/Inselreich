# NU-1 · Controller-Briefing und Prüfpflichten (wörtlich übernehmen)

Zu [`index.md`](index.md).

## Controller-Briefing

- **Delta-Review nach ZURÜCK oder BEDENKEN: immer frischer Start (opus), nie Fortsetzung desselben Reviewers per `SendMessage` (R673, R774, E-077).**
- Controller auf `sonnet`, höchstens 4 Tasks je Instanz, Übergabe per Ledger bei 200k Kontext oder nach 6 Starts (R167, R190): Instanz 1 T00–T03, Instanz 2 T04–T06 und T07-Start, Instanz 3 T08, T09, T10, Instanz 4 T11, Final-Review, Abschluss.
- Vor dem Start von B: `.studio/limits.json` (Ampel) und `uptime`; bei gelb oder rot kein Start.
- Arbeiter- und Reviewer-Briefings: nur Task-Datei und AK-IDs (plus Spec-Abschnitt laut Task-Kopf); Zeile «Melde dein Ergebnis per SendMessage an ‹agentId des Controllers›, nie an main» (R879).

## Prüfpflichten (Umsetzer-Briefing)

- **Testsperre (R380): Last ≤ 4 nötig** (1-min-Load) und kein fremder `vitest`/`make check`-Lauf (`make messfenster`), sonst `waiting`. Messläufe vorher bei main anmelden (E-080).
- **Rot zuerst:** je neuem Test Lauf vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe), im Ledger.
- **Teilbeleg je Task (R810):** gezielte Tests (Befehl in der Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Nie `make check` je Task.
- **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` grün in T03, T05, T06, T09; `git diff main -- tests/sim/balance.test.ts` leer.
- Keine Uhr in neuen Tests; Zahlen aus den Defs oder gegen Anhang 02; **kein Versionsliteral**; Dateien > 30 KB nur abschnittsweise (`save.ts` 42 KB, `inspect.ts` 45 KB, `app.ts` 72 KB, `renderer.ts` 44 KB, `hud.ts` 36 KB, `scenarios.ts` 41 KB); Suche mit `rg <muster> <pfad>`.
- Gezielt stagen, Präfixe `feat:`/`test:`/`docs:`; kein Rebase, kein `reset --hard`, kein Force-Push; main per Merge.
- `make docs-check; echo EXIT=$?` Exit 0 vor jedem Commit unter `docs/` oder `README.md`.
