# T05 — Doku (GE-8), D1 für diesen Umsetzer erlaubt (E-017)

**Dateien:** `docs/arc42.md` (Abschnitt Teststrategie/Qualität, eine Zeile bis ein kurzer Absatz). Nicht anfassen: `docs/studio/`, `README.md`, `CLAUDE.md`.

- [ ] Text: „Gate-Messung: `make gate-ensemble` fährt den Balancing-Controller mit 5 Phasen (0, 20, 40, 60, 80) und gibt Median, Min, Max und Urteil je Grenze aus; Einzelläufe reichen für Gates nicht (Seed ändert nur Fremdinseln). Nicht Teil von `make check`.“ Dazu Pfade `tests/sim/ensemble.ts`, `tests/sim/ensemble.test.ts`, Option `ColonyOptions.phase`.
- [ ] `make docs-check; echo EXIT=$?` → 0 (Controller).
- [ ] Commit `docs: Gate-Ensemble in arc42 (TOOL-GATE-ENSEMBLE T05)`.
- [ ] **Abschluss durch Controller:** Final-Review (opus, ganze Branch), Handoff `.studio/handoffs/<datum>-lead-tech-TOOL-GATE-ENSEMBLE.md`, Beobachtung „Seed wirkt nicht auf Heimkolonie“ als erledigt melden (Auswertung gehört L0/Beobachtungs-Skill, nicht dem Umsetzer).
