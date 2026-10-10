# T01 — `build_state` schneller (AK-TB5-01, AK-TB5-02)

**Dateien:** `tools/studio/model.py` (`build_state` ≈ Z. 1338, `_Builder.claim_budgets` ≈ Z. 810, `budget_view` ≈ Z. 1187), `tools/studio/tests/test_model.py` (neue Klasse am Dateiende). Nur diese Abschnitte lesen.

**AK-TB5-01:** `build_state` liefert auf einer Fixture (≥ 3 Leads derselben/verschiedener Rolle, ≥ 4 Freigaben, Kinder vor/nach Freigaben) dasselbe Ergebnis wie vor dem Umbau.
**AK-TB5-02:** `claim_budgets` läuft je `build_state` höchstens einmal; Knoten werden je Aufruf höchstens einmal sortiert; bereits aufsteigende Events werden nicht neu sortiert.

## Schritte

- [ ] **Messen:** Kopie des Ereignislagers (≈ 67k Events) im Scratchpad, `python3 -m cProfile -s cumtime` auf `build_state`; Top-5 im Bericht. Nicht ins Repo.
- [ ] **Test zuerst (Golden):** `test_build_state_unchanged_by_optimization` baut die Fixture und vergleicht gegen ein im Test eingebettetes Soll (zuerst auf altem Code erzeugen und einfügen, grün). Zweiter Test `test_claim_budgets_called_once` zählt Aufrufe per Wrapper auf `_Builder.claim_budgets` über `build_state` → rot (heute: `budget_view` ruft es, zusätzlich weitere Aufrufer prüfen).
- [ ] **Umsetzung:** `claim_budgets`: `nodes` und `budgets` einmal sortiert vor den Schleifen, Knoten nach Rolle in ein Dict gruppieren (innere Schleife läuft nur über die Rolle der Freigabe, Reihenfolge unverändert nach `started`). Ergebnis in `self.claims` lassen; ein Flag verhindert Doppelberechnung innerhalb `result()`. `build_state`: `ordered = events if _is_sorted(events) else sorted(...)` (Schlüssel `parse_ts` einmal je Event vorab berechnen, Paare sortieren).
- [ ] **Messen danach:** gleicher Profilerlauf, Wert im Bericht (Ziel ≤ 1,0 s bei 67k Events; Faktor angeben). Verfehlt er das Ziel: nächste Top-Funktion benennen, nicht raten.
- [ ] **Prüfen:** `python3 -m unittest tools.studio.tests.test_model` bzw. gezielt die neue Klasse und `make studio-lint`; Exit-Codes nennen.

**Commit:** `refactor: build_state sortiert einmal, claim_budgets einmal je Aufbau`
