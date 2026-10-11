# T01 — Vorlauf: Voraussetzung, Save-Regel, Testzeiten auf main (Controller SIM)

**Wer:** Controller des Strangs I048-SIM (`lead-tech`, sonnet). Er startet keinen Arbeiter. **Ergebnis:** Ledger `.superpowers/sdd/i048/ledger.md` mit Basis-Commit, Save-Stand und Testzeiten. **Kein Testlauf, solange ein Push ansteht (R464).**

## Schritte

- [ ] **Voraussetzung M13-E2-SIM** (R505 (1)): `git log --first-parent --oneline main | grep -i "m13-e2"` → Merge-Commit `M`. Mit `git show main:src/sim/save.ts | grep -n "SAVE_VERSION ="` muss `12` herauskommen. Fehlt der Merge: Status `blocked` («wartet auf M13-E2-SIM»).
- [ ] **Schnittstellen aus M13-E2 notieren** (Ledger, je eine Zeile mit Fundstelle):
  - `buyMonumentUnit` und `monumentBuyBlock` in `src/sim/trade.ts`; ruft `buyMonumentUnit` die Funktion `buyPrice(w, g, 1)` auf?
  - `migrateV11ToV12` und `isValidV12Fields` (oder die tatsächlichen Namen).
  - `foldBackToV11` samt Positivliste: Entfernt sie `buyPct` bei allen 100 schon (E2 AK-22)? Dann ergänzt T02 nur das Werfen.
  - Reihenfolge in `step`: erwartet `tickEconomy` → `tickMonument` → `tickMarket`.
  - Gibt es `tests/sim/fixtures/save-v11.json`?
- [ ] **Save-Regel (R505):** Save v12 wird geteilt. Prüfen, ob seit `M` ein Release lag:
  ```bash
  gh run list --workflow pages.yml --status success --limit 30 --json headSha,createdAt > <scratch>/pages.json; echo EXIT=$?
  # je headSha: git merge-base --is-ancestor <M> <headSha> && echo "RELEASE nach M: <headSha>"
  ```
  Lag kein Release vor (Normalfall), weiter mit v12. Lag eines vor, ist das der Rückfall (I-048 = v14 nach neuem Ruling): **Stopp, Status `blocked`**, Meldung an L0 vor T02. Ausgang ins Ledger. Dieselbe Prüfung wiederholt der Controller vor jedem Gate Merge (T05, Strang UI, Strang B).
- [ ] **I-049-Stand:** Ist I-049-Sim schon auf `main` (R505 (2))? Dann sind `Island.reserve` und `dropZeroReserve` vorhanden; ins Ledger notieren. Mergt I048-SIM nach I-049-Sim, prüft T02 die `reserve`-Regel mit (Prod-B4).
- [ ] **Worktree:** `git worktree add .worktrees/i048-sim -b feat/i048-sim main`. Basis-Commit ins Ledger, `npm ci`, falls nötig.
- [ ] **Testzeiten auf `main` (E-052, R392), erster Umsetzungsschritt:** Im neuen Worktree über die Testsperre:
  ```bash
  node tools/testlock/testlock.ts npx vitest related --run \
    src/sim/trade.ts src/sim/save.ts src/sim/world.ts src/sim/types.ts \
    src/sim/defs/goods.ts src/sim/defs/timing.ts src/sim/defs/edicts.ts \
    src/ui/trade.ts src/ui/edictView.ts src/ui/app.ts \
    --reporter=json --outputFile=<scratch>/i048-main-times.json; echo EXIT=$?
  ```
  Ins Ledger: alle Dateien > 200 ms mit Dauer. Das ist die Basis für den Abschluss-Vergleich (Schwelle je Datei +25 % oder +300 ms, QA-B7). Weil der Vergleich erst in Strang B stattfindet, misst der Controller B die Basis auf `main` kurz vor seinem Vergleich erneut. Dieser Wert gilt.
- [ ] **Nacharbeit aus dem Gate** (R505) ist in diesen Task-Dateien eingearbeitet. Neue Gate-Punkte trägt der Controller als Abschnitt «Nacharbeit Gate» in die betroffene Task-Datei ein, bevor er den Arbeiter startet.
- [ ] **Board:** `python3 tools/studio/log.py package --id I048 --title "I-048 Zukauf-Aufschlag" --owner lead-tech --status active --milestone M13` (eigener Bash-Aufruf).

## Briefing-Hinweise (T02–T08)

- Arbeiter bekommen nur ihre Task-Datei, die AK-IDs, die genannten Spec-Abschnitte und den Ledger-Auszug.
- Kopfzeilen `Persona:`, `Paket: I048-<Strang>`, `Budget: keins, keine Agenten starten`. Feste Regeln und Logging-Block wörtlich nach `docs/studio/templates/briefing.md`.
- «Volle Läufe fährt nur der Controller; du fährst gezielte Dateien. Ist ein neuer Test vor der Umsetzung schon grün, im Bericht als Regressionsschutz kennzeichnen (QA-B6).»
