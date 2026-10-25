# T00 · Testzeiten der berührten bestehenden Tests vorab messen (Controller)

Ausführer: Controller `lead-tech` (I1, `sonnet`), kein Arbeiter-Start · ≈ 10 Tools · keine AK · blocked-by: Seerecht auf main (P-1), Testsperre frei (R380); muss vor T02 laufen (T01 darf per Frühstart vorher fertig sein, Gate-Plan B8) · Worktree `.worktrees/stadtrecht` (`feat/stadtrecht` ab `plan/stadtrecht`)

Warum nicht schon im Plan: Beim Plan lag die 1-min-Load bei 5,2 (Testsperre R380 verlangt ≤ 4), und `vitest related` auf `world.ts`/`types.ts`/`save.ts` umfasst fast die ganze Suite. Vor allem wäre eine Messung auf main `ec144e82` wertlos: Stadtplanung, Inselproben und Seerecht ändern genau diese Dateien vorher.

## Steps

- [ ] `git worktree list` prüfen (R329); Worktree anlegen: `git worktree add -b feat/stadtrecht .worktrees/stadtrecht plan/stadtrecht`, dann im Worktree `git merge main` (kein Rebase). `git log -1 main` und `rg -n "SAVE_VERSION =" src/sim/save.ts` im Ledger festhalten (Grundlage P-3).
- [ ] Prüfen, dass Seerecht auf main ist: `rg -n "seaTileTicks" src/sim/council.ts` liefert Treffer; sonst `blocked` an L0.
- [ ] Testsperre: `uptime` (1-min-Load ≤ 4), kein anderer `vitest`/`make check`-Lauf.
- [ ] Messung mit Hintergrund-Bash (Lauf > 4 min möglich, E-037), Ausgabe in eine Datei im Scratchpad:
      `npx vitest related --run src/sim/council.ts src/sim/edicts.ts src/sim/save.ts src/sim/world.ts src/ui/council.ts src/ui/councilCard.ts src/ui/taxView.ts src/ui/guide.ts src/ui/inspect.ts --reporter=verbose > <scratchpad>/t00-related.txt 2>&1; echo EXIT=$?`
- [ ] Aus der Ausgabe je Datei die Dauer notieren; im Ledger `.superpowers/sdd/stadtrecht/ledger.md` die zehn langsamsten Dateien und die Summe. Diese Werte sind die Vergleichsbasis «Zeitreserve» der Tasks T01–T06.
- [ ] `make zeittests; echo EXIT=$?` einmal als Ausgangswert.
- [ ] Prüfen, ob eine der Dateien in `.studio/zeitreserve-marked.json` steht; falls ja, im Ledger vermerken (Merge-Gate nutzt `make zeitreserve-gate`).

## Ergebnis

Ledger-Eintrag «T00»: Basis-Commit, `SAVE_VERSION` auf main, Messwerte, Exit-Codes. Kein Commit im Repo.
