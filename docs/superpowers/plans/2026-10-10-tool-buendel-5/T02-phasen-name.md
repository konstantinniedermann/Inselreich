# T02 — Phasenzuordnung über die Kopfzeile `Paket:` (AK-TB5-03, AK-TB5-04)

**Dateien:** `tools/studio/model.py` (`budget_key` ≈ Z. 776–805, `claim_budgets`, `lead_phases`, `_package_token` Z. 174), `tools/studio/tests/test_model.py` (Klasse am Ende). blocked-by T01 (gleiche Funktion).

**Kontext:** Handbuch 1.45: Freigabe-Phase `plan-<paket>` / `design-<paket>` / `gate-<paket>`, die Kopfzeile `Paket:` der Lead-Instanz nennt dieselbe ID. `budget_key` matcht schon über Namensmenge `{Paket, _package_token(Paket)}`; `claim_budgets` (→ `lead_phases` → Metriken, Effizienz) ordnet nur nach Zeit zu.

**AK-TB5-03:** Hat ein Lead `Paket: plan-X` (oder `plan-X — Zusatz`) und gibt es die Freigabe `plan-X`, gehört sie diesem Lead, auch wenn eine zeitlich frühere freie Freigabe derselben Rolle vorhanden ist; `lead_phases[lead] == "plan-X"`. `plan-X-b` bindet `plan-X` nicht.
**AK-TB5-04:** Ohne Namenstreffer ist das Verhalten bit-gleich zu heute (alle bestehenden Budget-/Claims-Tests unverändert grün, keine Anpassung bestehender Erwartungen).

## Schritte

- [ ] **Test zuerst:** `test_claim_prefers_name_over_time` (zwei Freigaben `plan-A` zuerst, `plan-B` später, Lead B mit `Paket: plan-B` startet nach beiden → heute bekommt der erste startende Lead A… Fixture so bauen, dass die Zeitregel die falsche Zuordnung liefert; rot), `test_claim_name_needs_delimiter`, `test_claim_without_name_unchanged`.
- [ ] **Umsetzung:** Helfer `_grant_names(lead_node, child=None) -> set[str]` (aus `budget_key` herausgelöst, dort wiederverwendet). `claim_budgets`: Durchgang 1 über Freigaben, deren `phase` in der Namensmenge eines passenden Leads (Rolle gleich, `session_id` passt, `started >= since`) liegt, bindet diesen Lead; Durchgang 2 wie bisher mit `taken`.
- [ ] **Auswirkung beziffern:** `build_state` alt/neu auf der Echtdaten-Kopie (Scratchpad) vergleichen: Anzahl abweichender `lead_phases`-Einträge im Bericht (Erwartung: wenige, nur Instanzen mit Präfix-Kopfzeile).
- [ ] **Prüfen:** gezielte Tests, `make studio-lint`, Exit-Codes nennen.

**Commit:** `fix: lead_phases ordnet Freigaben zuerst über die Kopfzeile Paket zu`
