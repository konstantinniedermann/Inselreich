# T05 · `pushcheck.py`: rote Zeit-/Timeout-Dateien selbst wiederholen (V2)

Strang B · blocked-by: TOOL-MESSFENSTER auf main · Test-first (`make studio-test`, `tools/studio/tests/test_pushcheck.py`).

**Ist:** `sequence()` gibt bei rotem `check-push` sofort 1 (oder 3) zurück; `retry()` läuft nur aus `zeitreserve()`. Ereignis zeigt dann `retry_files: 0`, auch wenn von Hand wiederholt wurde (R815).

**Änderung:**

1. Neue Methode `Gate._red_time_files(output) -> list[str] | None`: liefert die roten Testdateien nur, wenn **alles** zutrifft: (a) der rote make-Schritt ist `test` (Zeile `make: *** [test]` o. ä. im Ausgabetext, Rest unklar → `None`); (b) die Zahl der aus `FAIL  tests/….test.ts` gelesenen Dateien gleicht «Test Files N failed» der vitest-Zusammenfassung (vollständig geparst, sonst `None`); (c) jede Datei steht in `ZEITTESTS` (Liste aus `vite.config.ts` lesen wie `make zeittests`: Zeilen `'tests/…test.ts'` zwischen `export const ZEITTESTS` und `];`) **oder** ihr FAIL-Block enthält `timed out`. Sonst `None` → Exit 1 wie bisher.
2. `sequence()`: nach `check-push`-Fehler (nicht Testsperre-Abbruch) `files = _red_time_files(output)`; wenn vorhanden `self.retry_source = "check-push"`, `code = self.retry(files)`; bei 0 die Schritte nach `test` nachholen: `node tools/testlock/testlock.ts make studio-test build pages-limit` (Rest aus `CHECK_PUSH_STEPS` nach `test`, als eigener Schritt `check-push-rest`; Exit ≠ 0 → 1, `ABBRUCH` → 3), dann weiter wie im Grünfall mit `self.zeitreserve()` und `check-ci-perf`. Bei `retry()` ≠ 0: dieser Code (1, 2, 3 wie dort).
3. `retry()` unverändert (setzt `retry_files = len(files)` und wartet auf `wait_quiet()`; Last-Schwelle 3.0 bleibt, Beobachtung siehe index.md). `retry_source` (`"zeitreserve"` im bisherigen Pfad, `"check-push"` neu, sonst `None`) ins Ereignis `push_check` und in die Schlusszeile: `Nachmessung 1 (N Dateien, aus check-push)`.
4. Ausgabe: je wiederholter Datei eine Zeile `push-check: wiederhole <Datei> einzeln (Last x)`.

**Tests (rot zuerst), Fake-Runner aus `Harness`:** (i) `check-push` rot mit nur `perf.test.ts` (ZEITTESTS), Nachmessung grün, Rest grün → Exit 0, `retry_files == 1`, `retry_source == "check-push"`, Schritt `check-push-rest` vorhanden; (ii) Nachmessung rot → Exit 1; (iii) rote Datei nicht in ZEITTESTS → Exit 1, keine Nachmessung, `retry_files == 0`; (iv) eine Zeitdatei und eine Nicht-Zeitdatei rot → Exit 1; (v) Zusammenfassung zählt mehr rote Dateien als geparst → Exit 1; (vi) Timeout-Meldung in Nicht-Zeitdatei → wird wiederholt; (vii) Last > 3 über die ganze Frist → Exit 2 und `retry_files` gesetzt; (viii) `testlock: ABBRUCH` beim check-push → Exit 3 ohne Wiederholung (bestehend); (ix) der Fake-Runner beantwortet `node tools/messfenster/lock.ts status` mit Exit 0 (nach dem MESSFENSTER-Merge nötig).
Handbuch: Absatz Push-Ablauf (STUDIO.md, D2) um «auch bei Exit 1 aus `check-push`, nur rote Zeit-/Timeout-Dateien, `retry_source`» ergänzen übernimmt `studio-coach` nach dem Merge.
