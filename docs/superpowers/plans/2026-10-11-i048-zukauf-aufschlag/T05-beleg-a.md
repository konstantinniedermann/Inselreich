# T05 — Beleg Schritt A (bitgleich), Gate Merge I048-SIM (Controller SIM)

**Wer:** Controller des Strangs I048-SIM (`lead-tech`, sonnet). **Voraussetzung:** Die Reviews von T02 und T03 haben das Urteil OK.

**AK:** AK-ZK-13 ist ein **Prozessbeleg** an Commit A (qa B4, R505 (3)). Dauerhaft sichert ihn AK-ZK-08.

## Schritte

- [ ] **`main` holen:** `git merge main; echo EXIT=$?` (kein Rebase). Konflikte entstehen erwartbar mit I-049-Sim in `save.ts` und `helpers.ts`. Der Controller löst sie nicht selbst; er ruft den T02/T03-Arbeiter per SendMessage. Ist I-049-Sim jetzt auf `main`, ergänzt der Arbeiter den Test der fremden `foldBackToV11`-Regeln (`reserve` ≠ 0 wirft, `monument` wirft, alle neutral → v11-Form; Prod-B4). Danach Save-Regel aus T01 erneut prüfen; bei einem Release seit `M` Stopp an L0.
- [ ] **Voller Lauf über die Testsperre** (kein Push offen):
  ```bash
  make check; echo EXIT=$?
  ```
  Erwartet wird Exit 0. Die Testzahl kommt ins Ledger.
- [ ] **Diff-Beleg** (R505 (3), QA-B2). Diese Befehle müssen leere Ausgabe liefern:
  ```bash
  git diff --stat main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts; echo EXIT=$?
  git diff --diff-filter=MDR --stat main -- tests/sim/fixtures/; echo EXIT=$?
  git diff -U0 main -- tests/sim/save.test.ts tests/sim/save-v11.test.ts tests/sim/save-v12.test.ts | grep -E '^[+-][^+-]' | grep -vE 'expect\(SAVE_VERSION\)\.toBe\((12|13)\);'; echo EXIT=$?
  ```
  Die Pipe im dritten Befehl ist der vorgegebene Prüfbefehl. Ihr Exit-Code sagt nichts aus; massgeblich ist die **leere Ausgabe**. Wegen der geteilten v12 bleibt sie normalerweise leer. Neue Fixture-Dateien sind erlaubt und werden aufgelistet: `git diff --diff-filter=A --name-only main -- tests/sim/fixtures/`.
- [ ] **`balance-monument`** (Liste §6) läuft im vollen Lauf mit. Seine Datei bleibt unverändert: `git diff --stat main -- tests/sim/balance-monument.test.ts`.
- [ ] **Beleg ins Ledger:** Exit-Code und Testzahl von `make check`, die Diff-Ausgaben wörtlich und der Hash von Commit A (`git rev-parse HEAD`). Commit A ist die Spalte «vorher» in T06.
- [ ] Ist ein Balancing-, Hash- oder Rezept-Test rot, ist die Mechanik nicht bitgleich: **kein Gate**. Dann Fix-Runde mit dem T02-Arbeiter.
- [ ] **Final-Review SIM:** `qa-code-reviewer` mit Modell opus über `feat/i048-sim` gegen `main`. Danach Bericht an L0 «bereit fürs Gate Merge I048-SIM». Den Merge nach `main` macht nach dem L0-Gate `production-integrator` (Prod-B6). Kein Release (R505).

**Ergebnis:** I048-SIM liegt auf `main`. Der Strang UI (T04) wartet auf (4) I-049-UI.
