# T18 Save-Nachzug vor dem Final-Review Etappe 2

Persona `tech-sim-engineer` (Fortsetzung A2 per `SendMessage`) · Strang A2 · Tools ≈ 20 · AK-AL-35, 36 (erneut) · blocked-by T17 · **Last ≤ 4 nötig** (voller Lauf der berührten Tests).

Zweck (R909, Plan P-1): Die Save-Nummer entsteht aus der Merge-Reihenfolge. Hat main seit T12 `SAVE_VERSION` erhöht (SEERECHT, INSELPROBEN, GV S1, FLAECHE FL-3, HAFEN, I-210, I-214), zieht dieser Task nach. Läuft erneut (Umsetzer per `SendMessage`, kein neuer Start), wenn main zwischen Final-Review und Merge-Gate nochmals erhöht; das Delta prüft dann ein **frischer** `opus`-Reviewer-Start (Diff seit dem geprüften Stand), nie eine Fortsetzung per `SendMessage` (R673, R905, R931, R942).

## Schritte

- [ ] `git fetch` entfällt (lokal); `git log --oneline HEAD..main -- src/sim/save.ts; echo EXIT=$?`. Leer → nur Zeiten messen (letzter Schritt), kein Commit.
- [ ] Sonst `git merge --no-edit main` (kein Rebase). Konflikt in `save.ts` nach Symbol lösen: alle Migrationsschritte von main bleiben in ihrer Reihenfolge; der AUSBAU-Schritt wird zum **letzten** Schritt `migrateV<m>ToV<m+1>` mit m = `SAVE_VERSION` von main, `SAVE_VERSION = m + 1`. Inhalt des Schritts unverändert (nur `version`).
- [ ] Hat ein anderes Paket den Inhalt geändert (neues Feld mit eigener Migration), bleibt Variante A gültig, weil AUSBAU nichts am Inhalt ändert; `save-ausbau.test.ts` erzeugt den Vorgängerstand aus `serialize` und deckt das ab. Prüfen: `npx vitest run tests/sim/save-ausbau.test.ts; echo EXIT=$?` → 0.
- [ ] `npx vitest related --run src/sim/save.ts; echo EXIT=$?` → 0; `npx vitest run tests/sim/balance.test.ts <Baseline-Liste> tests/sim/balance-upgrade.test.ts tests/sim/balance-ausbau.test.ts; echo EXIT=$?` → 0.
- [ ] **Zeiten nachher (R392/R905, Last ≤ 4, `make messfenster` vorher):** Vergleichsbasis ist **nicht** T00 allein (main hat sich durch SEERECHT, I-210 u. a. bewegt), sondern der in diesem Task gemergte main-Stand ohne AUSBAU-Diff: `git worktree list` zuerst, dann `git worktree add --detach .worktrees/ausbau-base-2 $(git merge-base main HEAD); echo EXIT=$?` (nach dem Merge oben = gemergter main-Commit; Hash ins Ledger), dort `npm ci` nur falls `node_modules` fehlt. Dieselben zwei `vitest related`-Befehle wie T00 Wand an Wand, abwechselnd Basis/Branch, je Seite `--outputFile=.studio/qa/ausbau-logik/zeit-{basis2,nach2}-{sim,ui}.json`. Vergleichstabelle (Datei, Basis, nach, Δ %, T00 als Referenzspalte) im Bericht; neue Tests > 500 ms oder Bestand > +50 % gegen die Basis → an den Controller. Worktree `ausbau-base-2` danach entfernen (`git worktree remove`).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit** (nur bei Merge): `fix: Save-Version AUSBAU-LOGIK an main angeglichen (AUSBAU-LOGIK T18)`.
