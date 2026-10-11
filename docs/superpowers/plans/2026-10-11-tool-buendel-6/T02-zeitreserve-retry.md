# T02 — `zeitreserve`: markierte Dateien und Nachmessung (AK-TB6-02 … AK-TB6-04)

**Dateien:** `tools/zeitreserve/reporter.ts` (`REPORT_PATH` Z. 9, Schreiben Z. 57), `tools/zeitreserve/check.ts` (`main`, Z. 60–106; `PUSH` Z. 29), `tools/zeitreserve/rule.ts` (nur neue reine Funktionen exportieren, bestehende Regeln unverändert), `tools/zeitreserve/README.md`, `tests/tools/zeitreserve.test.ts`, Fixtures unter `tests/tools/`.

**Idee:** `make check` misst alle Tests unter der Last, die gerade herrscht. Ist `loadStart` > 4, gilt heute die ganze Messung als „nicht belastbar“ (Exit 2) und der volle `make check` wird wiederholt. Höhere Last macht Tests nur langsamer. Ein Test **ohne** Verstoss und **ohne** Warnung unter Last hat in Ruhe erst recht Reserve. Nachgemessen werden müssen nur die markierten Testdateien.

**AK-TB6-02 (markieren):** `check.ts --push --marked <pfad>` schreibt eine JSON-Liste der Testdateien (sortiert, ohne Doppelte), in denen mindestens ein Test unter der lokalen Regel oder der Runner-Schätzung (E-043) einen **Verstoss oder eine Warnung** hat (Altlasten aus `baseline.json` ausgenommen). Die Datei wird geschrieben bei Exit 0, Exit 1 und **Exit 2 wegen `loadStart` > 4**. Bei unlesbarer Messung, falschem Commit oder altem Format wird eine vorhandene Markierungsdatei gelöscht (niemand liest eine alte Liste). Die Bewertung (Exit 0/1/2) bleibt ohne `--retry` bit-gleich wie heute.

**AK-TB6-03 (Nachmessung):** Der Reporter schreibt nach `process.env.ZEITRESERVE_OUT`, sonst nach `REPORT_PATH`. `check.ts --push --retry <pfad>` liest Hauptmessung und Nachmessung und bewertet die **zusammengeführte** Messung:

- Exit 2, wenn Haupt- oder Nachmessung einen anderen Commit als HEAD hat, die Nachmessung `loadStart` > 4 hat, oder eine Datei aus der Markierungsliste der Hauptmessung in der Nachmessung fehlt.
- Zusammengeführt: Zeiten der nachgemessenen Dateien ersetzen die der Hauptmessung; alle anderen Zeiten stammen aus der Hauptmessung.
- Die Hauptmessung darf `loadStart` > 4 haben (dann gilt die Monotonie-Begründung oben); jede Datei der Hauptmessung mit Markierung muss nachgemessen sein.
- Danach die übliche strenge Bewertung (lokal und Runner) über die zusammengeführte Menge: Exit 0 oder 1.
- Ausgabe: eine Zeile `zeitreserve-push: Nachmessung <n> Dateien, loadStart <x>, Hauptmessung loadStart <y>`.

**AK-TB6-04 (Rückwärts):** Ohne `--marked`/`--retry` und ohne `ZEITRESERVE_OUT` ändert sich keine Ausgabe und kein Exit-Code (alle bestehenden Tests in `tests/tools/zeitreserve.test.ts` unverändert grün).

## Schritte

- [ ] **Test zuerst** in `tests/tools/zeitreserve.test.ts` (Muster der bestehenden Tests: `ZEITRESERVE_FAKE_HEAD`, `ZEITRESERVE_FAKE_LOAD`, Fixture-Dateien im Temp-Ordner), je Fall ein Test:
  1. `--marked` bei `loadStart` 6: Exit 2, Liste enthält genau die Dateien mit Verstoss/Warnung (Fixture mit einer Datei 2500 ms, einer 1200 ms, einer 100 ms → zwei markiert).
  2. `--marked` bei falschem Commit: Exit 2, keine Markierungsdatei.
  3. `--retry`: Hauptmessung `loadStart` 6, Nachmessung `loadStart` 2 mit den beiden Dateien in Reserve → Exit 0.
  4. `--retry`: Nachmessung `loadStart` 5 → Exit 2; Nachmessung ohne eine markierte Datei → Exit 2; Nachmessung mit anderem Commit → Exit 2.
  5. `--retry`: Nachmessung mit einer Datei weiter ohne Reserve → Exit 1, Meldung nennt den Test.
  6. Reporter: mit `ZEITRESERVE_OUT` landet die Messung in der anderen Datei, `.studio/zeitreserve.json` bleibt unberührt (Reporter direkt mit Fake-Ergebnissen aufrufen, falls die bestehenden Tests das so tun; sonst über eine reine Hilfsfunktion `reportPath(env)`).
- [ ] **Rot-Beleg (R395):** `npx vitest run tests/tools/zeitreserve.test.ts; echo EXIT=$?` → `EXIT=1`, Ausgabe im Bericht.
- [ ] **Umsetzung:** Markierung als reine Funktion in `rule.ts` (`markedFiles(timings, baseline, scale): string[]`, nutzt `findViolations`/`findWarnings` für beide Faktoren); Zusammenführen als reine Funktion (`mergeRetry(main, retry, marked)` → `{ measurement } | { problem }`); `check.ts` nur Argumente, Datei-I/O und Ausgabe. `measurementProblem` bleibt unverändert.
- [ ] **Doku:** `tools/zeitreserve/README.md` Absatz „Push-Gate“: `--marked`, `--retry`, `ZEITRESERVE_OUT`, Monotonie-Begründung in einem Satz; Verweis auf `make push-check` (T03).
- [ ] **Prüfen:** `npx vitest run tests/tools/zeitreserve.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `npx eslint tools/zeitreserve tests/tools/zeitreserve.test.ts`, `npx prettier --check tools/zeitreserve tests/tools`.

**Commit:** `feat: zeitreserve markiert Dateien und bewertet eine gezielte Nachmessung (R488 V1)`

## Hinweise

- `ZEITRESERVE_OUT` ist kein Umgehungsweg: `--push` ohne `--retry` liest immer `REPORT_PATH`. Im README festhalten (wie R378 für Fake-Variablen).
- Die Nachmessung wird mit `npx vitest run <dateien> --reporter=default --reporter=./tools/zeitreserve/reporter.ts` erzeugt (T03); `ZEITTESTS`-Dateien laufen in Vitest in eigenem Projekt — prüfen, dass Datei-Filter beide Projekte treffen (`vite.config.ts` Z. 28–36), Befund im Bericht.
