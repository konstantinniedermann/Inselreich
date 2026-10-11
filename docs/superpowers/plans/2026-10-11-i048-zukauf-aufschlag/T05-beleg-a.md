# T05 — Beleg Schritt A (bitgleich), Merge `feat/i048-ui` (Controller)

**Wer:** Controller (`lead-tech`, sonnet), Instanz 2. Kein Arbeiter-Start. **Voraussetzung:** T02, T03 und T04 haben je ein Review mit Urteil OK.

**AK:** AK-ZK-13. Das ist ein **Prozessbeleg** am Commit A (qa B4). Dauerhaft sichert die Bitgleichheit AK-ZK-08.

## Schritte

- [ ] **Zusammenführen:** Im Baum `.worktrees/i048`: `git merge --no-ff feat/i048-ui -m "feat: I-048 UI-Strang zusammengeführt (Schritt A)"; echo EXIT=$?`. Bei Konflikten wird nicht selbst gelöst, sondern der UI-Arbeiter per SendMessage gerufen (eigene Dateien sind disjunkt, Konflikte sind also nicht zu erwarten). Danach `git worktree remove .worktrees/i048-ui`; die Branch bleibt.
- [ ] **`main` holen:** Hat sich `main` seit T01 bewegt, folgt `git merge main` (kein Rebase). Danach wird die Save-Weiche erneut geprüft (Verfahren T01). Ein Release seit dem Merge von M13-E2-SIM bei Fall v12 bedeutet: Stopp, Meldung an L0 (Wechsel auf v13 ≈ 10 Tools, T02/T03 per SendMessage nacharbeiten).
- [ ] **Voller Lauf über die Testsperre** (kein Push offen, R464):
  ```bash
  make check; echo EXIT=$?
  ```
  Erwartet ist Exit 0. Die Testzahl kommt ins Ledger.
- [ ] **Diff-Beleg** (Spec §6, AK-ZK-13; Filter nach der Entscheidung von L0 im Gate Plan, Empfehlung im Index Punkt 3):
  ```bash
  git diff --stat main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts; echo EXIT=$?
  git diff --diff-filter=MDR --stat main -- tests/sim/fixtures/; echo EXIT=$?
  git diff -U0 main -- tests/sim/save.test.ts; echo EXIT=$?
  ```
  Soll: Die ersten zwei Ausgaben sind leer. Bei `save.test.ts` ist die Ausgabe im Fall v12 leer; im Fall v13 bestehen alle `+`/`-`-Zeilen nur aus `expect(SAVE_VERSION).toBe(12|13);`. Neue Dateien (`save-v11.json`, ggf. `save-v12.json`) sind erlaubt und werden aufgelistet: `git diff --diff-filter=A --name-only main -- tests/sim/fixtures/`.
- [ ] **`balance-monument`** gehört zur Liste in §6. Der Test wird im Lauf oben mitgeprüft; seine Datei darf sich gegenüber `main` nicht ändern: `git diff --stat main -- tests/sim/balance-monument.test.ts`.
- [ ] **Beleg ins Ledger und später in den Bericht:** Exit-Code und Testzahl von `make check`, die drei Diff-Ausgaben wörtlich, Commit-Hash «Commit A» (`git rev-parse HEAD`). Dieser Commit ist der Bezugspunkt für die Tabelle «vorher» in T06.
- [ ] Ist ein Balancing-Test, Hash-Pin oder Rezept-Test rot: **kein** Weitergehen nach B. Dann ist die Mechanik nicht bitgleich. Fix-Runde mit dem T02-Arbeiter (SendMessage), Befund ins Ledger.

**Ergebnis:** Commit A ist belegt. T06 darf starten, sobald L0 im Gate Plan über Klasse S entschieden hat (Index, Entscheidungsbedarf 1).
