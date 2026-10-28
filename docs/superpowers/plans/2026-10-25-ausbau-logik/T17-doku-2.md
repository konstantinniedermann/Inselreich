# T17 Doku Etappe 2 (Stufe 4, Gleiches bauen, Persistenz)

Persona `tech-ui-engineer` (Fortsetzung Strang C2 per `SendMessage`) · arbeitet in A2 · Tools ≈ 20 · AK-AL-34 (Stufe-4-Teil) · blocked-by T16. Doku-Dateien ausdrücklich erlaubt (E-017). Kein eigener Task-Review; Prüfung im Final-Review Etappe 2 (Plan P-13).

**Files:** Modify `README.md`, `docs/spielwerte.md`, `docs/arc42.md`.

## Schritte

- [ ] **Rot-Beleg:** `rg -n "Stufe 4" docs/spielwerte.md; echo EXIT=$?` → im Abschnitt «Ausbau» kein Treffer (Exit 1 oder Treffer nur ausserhalb).
- [ ] **`docs/spielwerte.md` «Ausbau»:** Stufe 4 (Manufaktur) mit den ersten Kaufleuten (U7), Verleger im Arbeitsweg, Glas bei Werkstätten (Weberei/Werkzeugmacher 3, Brennerei/Glashütte 4), Fischer Stoff 3; Standortregeln Stufe 4 aus `src/sim/defs/levels.ts`; «Gleiches bauen» kostet Neubau + alle Stufen, kein Rabatt, kein Rückfall. Info-Panel-Satz «Stufe 1» bis «Stufe 3» → «bis Stufe 4».
- [ ] **`README.md`:** Stufe 4, «Gleiches bauen» und Pipette übernehmen die Stufe (Werkzeugname «Fischerhütte · Stufe 3»), rote Vorschau mit Grund.
- [ ] **`docs/arc42.md` Persistenz:** `SAVE_VERSION` dieses Pakets ohne Zahl beschreiben («Versionsschritt ohne Inhaltsänderung; `level` 4 und `'U7'` gültig»); Zahl nur dort, wo arc42 die Kette ohnehin tabellarisch führt — dann nach T18 eintragen. Bausteinsicht: `placeBuilding(…, level?)`, `levelChecksAt`, `levelCostSum`; Render `levelMarks*.ts` mit Anker-Parameter (Schnittstelle GEBAEUDE-VARIANZ, Plan P-11).
- [ ] **Grün:** AK-AL-34 vollständig: `rg -n "gegen Stoff|kostet Rum" README.md docs/spielwerte.md src/sim/defs/unlocks.ts; echo EXIT=$?` → Exit 1; Abschnitt «Ausbau» nennt vier Bedingungsarten und Stufe 4.
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] **Commit:** `docs: Ausbau Stufe 4 und Gleiches bauen in README, Spielwerten und arc42 (AUSBAU-LOGIK T17)`.
