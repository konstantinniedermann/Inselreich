# T01 — Reserve `tests/ui/time.test.ts` (AK-TB6-01)

**Datei:** `tests/ui/time.test.ts` (nur der Test „AK-UX-13 kein Text enthält „Tick“ …“, ≈ Z. 48–69). Kein `src/`, keine `vite.config.ts`-Änderung (die Datei enthält keinen Wandzeit-Aufruf und kommt nicht in `ZEITTESTS`).

**Anlass:** REL-18-Push: `tests/ui/time.test.ts` 906 ms lokal; Runner-Schätzung × 3 = 2718 ms > 50 % von 5000 ms (Vitest-Standard-Timeout) → `zeitreserve-push` rot (Retro REL-18, Tabelle Z. 21). Regel: `tools/zeitreserve/rule.ts` (`CI_FACTOR` 4, `RUNNER_FACTOR` 3, `MAX_TIMEOUT_SHARE` 0,5).

**AK-TB6-01:** Der Test AK-UX-13 läuft je Szenario als eigener Fall (`it.each(Object.entries(SCENARIOS))`) plus ein Fall für die szenariounabhängigen Texte (`tooltipLines`, `taxEffect`). Die Menge der geprüften Texte ist gleich (gleiche Werkzeuge, Gebäude, Steuerstufen, Szenarien, Tick +0 und +300, gleiche Regex `/Tick/`). Jeder Fall erfüllt `Dauer × 8 ≤ Timeout` (lokal) und `Dauer × 6 ≤ Timeout` (Runner-Schätzung), gemessen nach R392; wo nötig mit eigenem Timeout als drittem Argument (`{ timeout: … }`), aufgerundet auf volle 5000 ms.

## Schritte

- [ ] **Messen vor dem Umbau (R392):** auf `main` im Hauptcheckout bzw. im Worktree vor dem ersten Commit: `npx vitest run tests/ui/time.test.ts --reporter=verbose; echo EXIT=$?` dreimal; Dauer des AK-UX-13-Falls und `uptime` (1-min-Load) je Lauf im Bericht.
- [ ] **Rot-Beleg (R395):** Es entsteht kein neuer Test, sondern eine Aufteilung. Rot-Beleg ist die Reserve-Rechnung: aus der Messung `Dauer × 6 > 0,5 × 5000`? Rechnung im Bericht. Liegt die Messung in Ruhe darunter, trotzdem aufteilen (Messwert REL-18 unter Last) und das im Bericht nennen.
- [ ] **Umbau:** Szenario-Schleife in `it.each` überführen; Text-Sammlung je Fall wie bisher (`for (let i = 0; i <= 300; i++)`, Texte nur bei 0 und 300). Gemeinsamer Teil (Werkzeuge, Gebäude, Steuerstufen) als eigener Fall. Testnamen beginnen weiter mit `AK-UX-13`.
- [ ] **Messen nach dem Umbau (R392):** dieselbe Datei direkt nach der Main-Messung, dreimal, gleiche Ausgabe; je Fall Dauer; Timeout so wählen, dass AK-TB6-01 mit dem höchsten der drei Werte gilt. Tabelle „Fall · Dauer main · Dauer Branch · Timeout“ im Bericht.
- [ ] **Prüfen:** `npx vitest run tests/ui/time.test.ts; echo EXIT=$?` grün; `npx eslint tests/ui/time.test.ts` und `npx prettier --check tests/ui/time.test.ts`.

**Commit:** `test: Zeitreserve AK-UX-13 je Szenario aufgeteilt (R488 V1)`

## Hinweise

- Kein Abschwächen: keine weniger Ticks, keine weniger Szenarien. Wenn ein einzelnes Szenario allein > 1000 ms braucht, Timeout setzen statt weiter aufteilen.
- `baseline.json` (Altlasten) wird **nicht** ergänzt (Regel in `rule.ts`: nur kleiner).
