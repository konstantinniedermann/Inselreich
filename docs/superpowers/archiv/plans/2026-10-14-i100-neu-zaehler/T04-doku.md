# T04 Doku (README, arc42)

Persona `tech-ui-engineer`, Modell sonnet, blocked-by T02, Schätzung ~10 Tools. Dateien (nur diese, D1 ausdrücklich erlaubt): `README.md`, `docs/arc42.md`.

- [ ] **README:** im Abschnitt zum Ereignis-Log ein Satz: «Ereignisse zeigt ungelesene Meldungen als (n neu), ab 10 (9+ neu); Aufklappen setzt den Zähler zurück.» Spielwerte unverändert.
- [ ] **arc42:** bei den UI-Bausteinen: `logUnread` ist reiner UI-Zustand neben `eventLog`, kein Teil des Spielstands; Helfer `isNotable`/`nextUnread`/`unreadLabel` in `crisisLog.ts`.
- [ ] **Prüfen:** `make docs-check; echo EXIT=$?` = 0; vor dem Commit `git merge main` (UI-AUFRAEUM-3 ändert README/arc42 in anderen Abschnitten). Commit `docs: Neu-Zähler (I-100)`.
- [ ] **Review** durch `qa-code-reviewer`; der letzte Review der Branch läuft auf opus als Final-Review.
