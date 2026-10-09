# T4 Final-Review (`qa-code-reviewer`, opus)

Plan-Index: [../2026-10-09-steuer-je-stufe.md](../2026-10-09-steuer-je-stufe.md). Gestartet von Controller-Instanz 2 nach T3. Ergebnis an `lead-qa`; Urteil OK / BEDENKEN / ZURÜCK.

**Umfang:** `git diff main...feat/steuer-je-stufe` gegen Spec `docs/superpowers/specs/2026-10-09-steuer-je-stufe-design.md`, Anhang 01, Anhang 02 (geht vor), R412, R414, R415.

## Prüfpunkte

- [ ] **Alle 42 AK** (AK-T01–T42) einzeln mit Fundstelle (Testname bzw. T3-Screenshot); Zusätze aus Anhang 02 (QA-a … QA-i, TECH-B1, TECH-B2, TECH-H-R7.4, TECH-H-§6, P-1, P-2) eingeschlossen.
- [ ] **Baseline:** `tests/sim/balance.test.ts` grün und `git diff main -- tests/sim/balance.test.ts tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/fixtures/` leer (AK-T22, T23); in Pin-Dateien höchstens die Umstellung auf `foldBackToV9`, kein geänderter Pin-Wert (AK-T25).
- [ ] **Save:** `SAVE_VERSION === 10`, Kette v1 → v10, Abweisen statt Absturz (AK-T19, T20), Rundlauf und Weiterlauf nach Laden (AK-T17 + QA-h).
- [ ] **Determinismus:** kein RNG-Zugriff in neuen Pfaden, `src/sim/` DOM-frei, Aktionen werfen nie (AK-T16).
- [ ] **DRY (P-2):** ziel(t) nur in `taxTarget`, Menge C nur in `taxChangeSet`; kein zweiter Code dafür in `src/ui/`.
- [ ] **Schnitt T1a:** Verhalten in T1a bitgleich (Review-Urteil T1a im Ledger).
- [ ] **Doku:** README «Steuern und Steuerregler» und `docs/arc42.md` nach Spec §9; `make docs-check` Exit 0.
- [ ] **Commits:** Präfixe nach Konvention; keine Secrets; keine neue Abhängigkeit.
- [ ] **R392:** Zeiten vorher/nachher aus den Task-Berichten; kein bestehender Test > 500 ms oder > +50 %.
