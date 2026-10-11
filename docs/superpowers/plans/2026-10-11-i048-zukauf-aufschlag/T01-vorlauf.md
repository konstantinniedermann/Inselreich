# T01 — Vorlauf: Voraussetzung, Save-Weiche, Testzeiten auf main (Controller)

**Wer:** Controller (`lead-tech`, sonnet), kein Arbeiter-Start. **Ergebnis:** Ledger `.superpowers/sdd/i048/ledger.md` mit Fall der Weiche, Basis-Commit und Testzeiten. **Kein Testlauf, solange ein Push ansteht (R464).**

## Schritte

- [ ] **Voraussetzung M13-E2-SIM:** `git log --first-parent --oneline main | grep -i "m13-e2"`. Gesucht ist der Merge-Commit `M` von M13-E2-SIM. Ausserdem `git show main:src/sim/save.ts | grep -n "SAVE_VERSION ="`, erwartet `12`. Fehlt der Merge: Status `blocked` («wartet auf M13-E2-SIM»), nicht weiterarbeiten.
- [ ] **Schnittstellen aus M13-E2 notieren** (Ledger, je eine Zeile mit Fundstelle): die Denkmal-Zukauf-Funktion `buyMonumentUnit` und `monumentBuyBlock` in `src/sim/trade.ts` (M13-E2-Plan T04) und ob sie `buyPrice(w, g, 1)` ruft; `migrateV11ToV12`, `isValidV12Fields` (oder die tatsächlichen Namen); `foldBackToV11` in `tests/sim/helpers.ts` samt Positivliste. Ausserdem: Entfernt sie `buyPct` (alle 100) schon (E2 AK-22)? Dann ergänzt T02 nur das Werfen bei ≠ 100. Ausserdem die Reihenfolge in `step` (`src/sim/tick.ts`): Erwartet wird `tickEconomy` → `tickMonument` → `tickMarket`. Weicht sie ab, melden; T02 passt dann nur die Erwartung in AK-ZK-29 an. Zuletzt prüfen, ob `tests/sim/fixtures/save-v11.json` oder eine v12-Fixture-Datei existiert.
- [ ] **Save-Weiche (R487 P-4, R490 B3):** Liegt seit `M` ein Release (Pages-Deploy)?
  ```bash
  gh run list --workflow pages.yml --status success --limit 30 --json headSha,createdAt > <scratch>/pages.json; echo EXIT=$?
  # je headSha: git merge-base --is-ancestor <M> <headSha> && echo "RELEASE nach M: <headSha>"
  ```
  Ausserdem `docs/studio/state.md` lesen (Zeile «REL-… live»). **Fall v12** = kein Release enthält `M`. **Fall v13** = mindestens eines enthält `M`. Im Ledger festhalten: Fall, `M`, geprüfte Runs. Bei Zweifel Entscheid von L0 einholen (`decision`), nicht raten. **Fall v13 → vor T02 Meldung an L0.** Rot würden dann auch Versionszeilen in E2-Tests (`save-v12.test.ts` AK-M13E2-01/-24/-26, `save-v11.test.ts` ≈ Z. 47); ihr Nachziehen braucht das Ruling zu Entscheid 3.
- [ ] **I-049-Stand:** Ist I-049-Sim schon auf `main`? Dann sind `Island.reserve` und `dropZeroReserve` vorhanden. Gilt dort der Fall A (v12 geteilt), bleibt I-048 im Fall v12, sofern weiterhin kein Release vorliegt.
- [ ] **Worktree:** `git worktree add .worktrees/i048 -b feat/i048 main`. Basis-Commit ins Ledger. `npm ci` im Worktree, falls `node_modules` fehlt.
- [ ] **Testzeiten auf main (E-052, R392): erster Umsetzungsschritt.** Gemessen wird im neuen Worktree (Stand = `main`), über die Testsperre:
  ```bash
  node tools/testlock/testlock.ts npx vitest related --run \
    src/sim/trade.ts src/sim/save.ts src/sim/world.ts src/sim/types.ts \
    src/sim/defs/goods.ts src/sim/defs/timing.ts src/sim/defs/edicts.ts \
    src/ui/trade.ts src/ui/edictView.ts src/ui/app.ts \
    --reporter=json --outputFile=<scratch>/i048-main-times.json; echo EXIT=$?
  ```
  Ins Ledger kommen alle Testdateien mit Dauer > 200 ms, absteigend sortiert (Datei, ms). Erwartet sind vorn die `balance*`-Tests, `save.test.ts`, `scenario-saves.test.ts`, `seaGolden.test.ts`. Dieselbe Dateiliste dient im Abschluss für den A/B-Vergleich main/Branch.
- [ ] **Gate-Nacharbeit einlesen:** Ist das Gate Plan mit Nacharbeit (B-Punkten) beschlossen, trägt der Controller sie am Ende der betroffenen Task-Datei als Abschnitt «Nacharbeit Gate Plan» ein, bevor er den ersten Arbeiter startet (Commit `docs:` auf `feat/i048`). Rulings zu den drei Entscheidungspunkten im Index (Klasse S, Messbasis AK-ZK-15, AK-ZK-13-Diff) kommen ins Ledger.
- [ ] **Paket-Board:** `python3 tools/studio/log.py package --id I048 --title "I-048 Zukauf-Aufschlag" --owner lead-tech --status active --milestone M13` (als eigener Bash-Aufruf).

## Briefing-Hinweise für die Arbeiter (gilt für T02–T08)

- Arbeiter bekommen nur ihre Task-Datei, die AK-IDs und die Spec-Abschnitte, die dort genannt sind, dazu den Ledger-Auszug (Fall der Weiche, Namen aus M13-E2). Den ganzen Plan bekommen sie nicht.
- Kopfzeilen `Persona:`, `Paket: I048-<Strang>`, `Budget: keins, keine Agenten starten`. Feste Regeln und Logging-Block wörtlich aus `docs/studio/templates/briefing.md`.
- Im Briefing steht: «Volle Läufe nur der Controller; du fährst gezielte Dateien.»
