# T00 · Basis-Check vor dem ersten Start (Controller, kein Arbeiter)

Controller (sonnet) im Hauptrepo · keine AK · blocked-by Release M13 (R554) · ≈ 8 Tools · kein Start im Budget

**Zweck:** Der Plan ist auf `main` @ `9113e574` geschrieben (R554). Vor T01 prüft der Controller, ob das noch gilt,
und zieht sonst Zahlen und Basis nach (eine Zeile im Ledger, kein neuer Plan).

## Schritte

- [ ] 1. `git log --oneline 9113e574..main -- src tests` → leer? Dann Basis bleibt `9113e574`. Sonst neuer Basis-Commit
      = `main`-Spitze nach dem Release; im Ledger vermerken und in `rahmen.md` (AK-18) ersetzen.
- [ ] 2. `grep -n "SAVE_VERSION =" src/sim/save.ts` → 12? Sonst «Vorversion»/«neu» in allen Task-Dateien ersetzen
      (Namen `migrateV12ToV13`, `foldBackToV12`, `save-v13.test.ts`, `save-v12-felsbucht.json`).
- [ ] 3. **QA-B2 (B3-Eingaben):** `git diff adb7e28e main -- src/sim/defs/goods.ts src/sim/defs/buildings.ts
src/sim/defs/levels.ts src/sim/defs/sea.ts src/sim/defs/tiers.ts src/sim/defs/timing.ts`. Stand `9113e574`: nur
      `BUY_RISE = 0`, `BUY_CAP`, `BUY_RECOVERY_INTERVAL` und die Denkmal-Def; Preise, Zyklen, Unterhalt, `SHIP`
      unverändert → B3 (Anhang 01) gilt rechnerisch weiter. Ist `BUY_RISE` > 0 (I-048 Schritt B gemergt) oder ändert sich ein
      Preis, Zyklus oder Unterhalt: Entwurf an L0 «B3 neu rechnen (`design-economy-designer`), Rangfolge P1 > P2 > P3
      prüfen», Umsetzung trotzdem starten (die Rangfolge ist Playtest-Kriterium, kein Test).
- [ ] 4. `UNLOCK_NOTICE` (`src/ui/goal.ts`) lesen und den Bestandstext im Ledger festhalten (AK-31, Präfix).
- [ ] 5. Worktree `.worktrees/m14-e1` mit Branch `feat/m14-e1` von der Basis anlegen; `npm ci` nur falls
      `node_modules` fehlt. `make check` einmal auf der Basis (Exit-Code ins Ledger, Testlock beachten).
- [ ] 6. Testzeiten aus [testzeiten.md](testzeiten.md) übernehmen; ist die Basis neu, die Messung für T01 und T03
      wiederholen (Load ≤ 4).

**Ergebnis:** Ledger-Eintrag «T00: Basis `<hash>`, v12 → v13, B3-Eingaben unverändert/geändert, UNLOCK_NOTICE …».
