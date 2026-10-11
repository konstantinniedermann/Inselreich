# T03 — `model.py`: Reihenfolge und Präfix-Regel (AK-TB7-04, -05)

**Dateien:** `tools/studio/model.py`, `tools/studio/budgetwarn.py` (`package_names` Z. 49, heute Kopie von `_grant_names`), `tools/studio/model.py` (`_grant_names` Z. 181, `budget_key` Z. 786, `lead_phases` Z. 816, `claim_budgets` Z. 820, `compute_claims`, Aufruf Z. 1214 und `budget_view`), `tools/studio/tests/test_model.py`, `tools/studio/tests/test_budgetwarn.py`. `modelguard.py` ruft nur `budgetwarn.check` (Z. 108) und bleibt unverändert.

**AK-TB7-04:** `lead_phases()` und `budget_key()` liefern dasselbe Ergebnis, egal ob zuvor `result`/`budget_view` lief: beide rufen `claim_budgets()` selbst (idempotent, Cache über `claims_valid`).
**AK-TB7-05 (R528 (3), Präfix-Regel):** Hat ein Lead das Paket `X-<Suffix>` und es gibt keine Freigabe genau dieser Phase, bindet die Freigabe `X` (Präfix bis zum letzten passenden `-`, längster Treffer gewinnt). Exakte Freigabe geht vor. `X-T01` und `X-T02` binden beide `X`, solange `X` nicht von einem anderen Lead geclaimt ist (parallele Controller derselben Rolle nehmen den Namenstreffer vor der Zeitregel). Kein Präfix ohne `-` (`XY` bindet nicht `X`).

**AK-TB7-05b (B2, R532):** Es gibt genau **eine** Funktion für die Freigabe-Namen (Paket-ID → Namen: ID, Token, Präfixe bis `-`); `model._grant_names` und `budgetwarn.package_names` nutzen sie beide, keine zweite Kopie. Hook und Metrik bleiben dadurch gleich streng. Rot-Test in `test_budgetwarn.py`: Freigabe `X` bindet `X-T01`, aber nicht `XY-T01`; exakte Freigabe `X-T01` geht vor `X`.

## Schritte

- [ ] **Rot (R395):** Tests (a) Reihenfolge: gleiche Ereignisse, einmal `lead_phases()` vor `budget_view()`, einmal danach; erwartet identisch und nicht leer, heute leer im ersten Fall. (b) Präfix: Freigabe `Phase: M13-E2`, Lead mit `Paket: M13-E2-T01` → `budget_key` = Freigabe `M13-E2`; (c) exakte Freigabe `M13-E2-T01` und Präfix `M13-E2` vorhanden → exakte; (d) `M13-E2` vs. `M13-E22-T01` → keine Bindung; (e) längster Treffer bei `A` und `A-B`. Lauf `python3 -m unittest tools.studio.tests.test_model; echo EXIT=$?` → `EXIT=1`.
- [ ] **Grün:** `claim_budgets()` am Anfang von `budget_key` und `lead_phases`; `_grant_names` ergänzt die Präfixe aller `-`-Teilstücke der Paket-ID (nach Länge absteigend) — Rangfolge exakt > Präfix wird in `budget_key`/`compute_claims` über die Reihenfolge der Namen gesichert (Liste statt Menge, oder zweiter Durchlauf `by_name` exakt vor Präfix). Lauf grün.
- [ ] **Hook (B2):** Rot-Test in `test_budgetwarn.py` (siehe AK-TB7-05b), dann `budgetwarn.package_names` auf die gemeinsame Funktion umstellen (Import aus `model`, wie bisher `_package_token`). Querprüfung: `python3 -m unittest tools.studio.tests.test_budgetwarn tools.studio.tests.test_modelguard tools.studio.tests.test_metrics; echo EXIT=$?`. Das Hook-Verhalten darf nicht lockerer werden ausser durch die Präfix-Regel; Abweichungen als «Entwurf an L0» melden.
- [ ] **Echtlauf (Pflicht):** `python3 tools/studio/metrics.py` (Aufruf laut Dateikopf) auf den echten Logs vorher/nachher; Anzahl Leads ohne Freigabe (`lead_phases`) im Bericht, erwartet gleich oder kleiner.
- [ ] `ruff check tools/studio/model.py; echo EXIT=$?`.

**Commit:** `fix: model Claims unabhängig von Aufrufreihenfolge, Präfix-Regel für Freigaben (R528)`
