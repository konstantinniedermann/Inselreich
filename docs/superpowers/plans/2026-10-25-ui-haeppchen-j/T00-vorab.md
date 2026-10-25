# T00 · Vorab: Worktree, Basis, Testzeiten

Umsetzer `tech-ui-engineer` · ≈ 10 Tools · blocked-by: Gate Plan, Testsperre (R380)

1. Worktree `.worktrees/ui-haeppchen-j`, Branch `feat/ui-haeppchen-j` aus `plan/ui-haeppchen-j`; `git merge main` (kein Rebase); `git diff main --stat` gegen die Überschneidungen der Dateimatrix prüfen (UI-BEIPACK-FERN auf `app.ts`/`hud.ts`).
2. Testzeiten der berührten Tests **vorab** messen und im Bericht nennen: `npx vitest run tests/ui/messages.test.ts tests/ui/council.test.ts tests/ui/councilCard.test.ts --reporter=verbose; echo EXIT=$?` (je Datei Dauer). Dient als Vergleich nach T03 (keine Zeit-Assertion).
3. Prüfen: keine der drei Testdateien steht in `ZEITTESTS` (`vite.config.ts`); `make zeittests; echo EXIT=$?` als Basis.
4. Keine Dateiänderung, kein Commit.
