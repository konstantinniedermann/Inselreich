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

## Nacharbeit Gate Plan (R478, B4)

Der Test `test_claim_prefers_name_over_time` lautet neu: Freigaben `plan-A` (t1) und `plan-B` (t2); Lead A (`Paket: plan-A`) startet nach t2, Lead B (`Paket: plan-B`) startet nach t2 und vor Lead A. Zeitregel allein gäbe Lead B die Freigabe `plan-A` (rot); erwartet: `lead_phases[B] == "plan-B"`, `lead_phases[A] == "plan-A"`.

- [ ] **Weitere Tests:** zwei Leads mit gleichem `Paket:` (der zuerst startende bindet, der zweite fällt auf Durchgang 2 zurück); Namenstreffer mit falscher `session_id` bzw. `started < since` bindet nicht (bleibt in Durchgang 2).
- [ ] **Wirkungstest auf Fixture:** Test, der Wirkung auf Metriken/Effizienz (`lead_phases`-abhängige Ausgabe) auf einer Fixture mit Präfix-Kopfzeile zeigt (alt: Zeitzuordnung falsch, neu: richtig).
- [ ] **Echtdaten-Differenz als Liste** `(Lead, alt, neu)` im Bericht (Kopie im Scratchpad, `build_state` alt/neu).
- [ ] **Stopp-Kriterium:** weicht ein Lead **ohne** Präfix-Kopfzeile ab, oder sind es **> 10** Einträge: **Stopp, Meldung an Controller -> L0** (R478), kein Weiterbau.
