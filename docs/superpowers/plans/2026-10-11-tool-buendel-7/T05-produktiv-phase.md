# T05 — Ampelzeile «Produktivanteil nach Phase» (AK-TB7-07)

**Dateien:** `tools/studio/efficiency.py` (`EXEMPT_PHASES` Z. 100, Klassenanteile `share` ≈ Z. 500–560, `produktiv` Z. 559, Ampelzeile Z. 760–770), `tools/studio/tests/test_efficiency.py`. Quelle der Phase: Instanz-Feld `phase` (bereits vorhanden, `_exempt_reason`); keine Abhängigkeit von T03.

**Anlass:** R523 V3: Plan-/Design-Leads zählen zu Design/Spec/Plan; die Rohzeile Steuerung war zum Teil Messartefakt.

**AK-TB7-07:** In `produktiv` zählen Kosten von Lead-Instanzen mit Phase `plan-`/`design-` zur Klasse «Design/Spec/Plan» in `produktiv`; `gate-` zählt **nicht** (Gates sind Steuerung, B4). **Mehrfachzählung gewollt:** diese Kosten stehen weiter in `steuerung` (Roh) und `steuerung_bereinigt` (wertgleich, Regressionstest gegen vorhandene Fixtures) und zusätzlich in `produktiv`; `produktiv` + Rest ist deshalb keine Summe 100 %, aber `produktiv` ≤ 1 (Test). Ein Lead mit `Budget: keins` ohne Phase zählt nicht zu `produktiv`. Die Ampelzeile zeigt Detail «davon Plan x % · Design y %» (Schwellen gelb < 25 %, rot < 15 % unverändert). Ohne Phase (alte Logs): Verhalten wie bisher, kein Fehler.

## Schritte

- [ ] **Ist feststellen:** `grep -n 'Design/Spec/Plan' tools/studio/efficiency.py`; klären, ob Phasen-Leads heute schon dort landen (Klassifizierung in `role_class`/Aggregation). Befund im Bericht; Umfang der Änderung folgt daraus (kleinster Eingriff, YAGNI).
- [ ] **Rot (R395):** Test mit drei Lead-Instanzen (Phase `plan-X`, `design-Y`, `gate-Z`) plus Umsetzer, bekannte Kosten: erwartet `produktiv` = (Umsetzer + Plan + Design) / Gesamt (Gate nicht) und Detailanteile; zweiter Test: Lead ohne Phase, auch mit `Budget: keins`, zählt nicht dazu; Invariante `produktiv` ≤ 1 auch bei Instanzen, die in `steuerung` und `produktiv` stehen; dritter: `steuerung_bereinigt` unverändert gegenüber vorherigem Stand. `python3 -m unittest tools.studio.tests.test_efficiency; echo EXIT=$?` → `EXIT=1`.
- [ ] **Grün:** minimal umsetzen, Detailtext in der Ampelzeile; `effort._RED`/`NO_FINDING`-Kopplung (Z. 65) nicht brechen: `python3 -m unittest tools.studio.tests.test_effort tools.studio.tests.test_ampel; echo EXIT=$?`.
- [ ] **Echtlauf (Pflicht):** Effizienzbericht auf den echten Logs (Aufruf `make studio-metrics` oder `python3 tools/studio/metrics.py`, laut Makefile), Ampelzeile vorher/nachher im Bericht.
- [ ] `ruff check tools/studio/efficiency.py; echo EXIT=$?`.

**Commit:** `feat: Ampelzeile Produktivanteil nach Phase (R523 V3)`

## Abschluss (Controller)

`make studio-test; echo EXIT=$?`, `make studio-lint; echo EXIT=$?`, `make docs-check; echo EXIT=$?`, Task-Reviews (sonnet, nach T01/T02, T03, T04/T05) und Final-Review (opus) über `tool/b7`, Bericht mit Exit-Codes und Echtlauf-Ausgaben; `git merge-tree --write-tree main tool/b7` vor Übergabe an `production-integrator`.
