# T01 — `testrun.py`: Sammelfehler und Ctrl-C-Fenster (AK-TB7-01, -02)

**Dateien:** `tools/studio/testrun.py` (`parse_names` Z. 47, `_stop_group` Z. 145–170, `_ignore_interrupts` Z. 171), `tools/studio/tests/test_testrun.py`.

**AK-TB7-01:** Meldet ein Lauf einen Sammelfehler (vitest `FAIL tests/x.test.ts` ohne `>`-Teil; unittest `ERROR: …ImportError`/`_FailedTest`), liefert `parse_names` den Dateinamen bzw. Modulnamen statt `[]`. Bestehende Fälle bleiben unverändert (Reihenfolge, Duplikate, `MAX_NAMES`, `MAX_NAME_LEN`).
**AK-TB7-02:** Zwischen Beginn von `_stop_group` und dem Setzen von `SIG_IGN` kann kein zweites SIGINT/SIGTERM/SIGHUP den Abbau unterbrechen: Signale werden zuerst mit `signal.pthread_sigmask(SIG_BLOCK, …)` blockiert (wo vorhanden, sonst bisheriges Verhalten), `_ignore_interrupts()` setzt danach `SIG_IGN`, im `finally` Maske und Handler zurück; das SIGKILL läuft in jedem Fall.

## Schritte

- [ ] **Rot (R395):** Test `parse_names` mit echter Vitest-Sammelfehler-Zeile (aus `tests/fixtures` oder eine kurze Beispielausgabe `FAIL  tests/ui/foo.test.ts [ tests/ui/foo.test.ts ]`) und unittest-Import-Fehler (`ERROR: tests.test_x (unittest.loader._FailedTest.tests.test_x)`): erwartet Name, heute `[]`. Lauf `python3 -m unittest tools.studio.tests.test_testrun; echo EXIT=$?` → `EXIT=1` im Bericht.
- [ ] **Grün:** `_vitest_name`/`_unittest_name` erweitern (gleiche Regex-Stelle, Datei ohne `>` zulässig, nur wenn die Zeile mit `FAIL`/`ERROR` beginnt, sonst bleiben Erfolgszeilen unberührt). Lauf grün.
- [ ] **Rot:** Test AK-TB7-02 mit `unittest.mock.patch("signal.pthread_sigmask")` und Aufrufprotokoll: erwartet, dass der erste Aufruf (SIG_BLOCK der drei Signale) vor `signal.signal(…, SIG_IGN)` liegt und im `finally` `SIG_SETMASK` mit der alten Maske folgt. Rot, dann umsetzen (Hilfsfunktion `_block_interrupts()` → alte Maske oder `None`), grün.
- [ ] **Echtlauf Sammelfehler (Pflicht):** Scratchpad-Datei `broken_test.py` mit `import gibt_es_nicht`; `python3 tools/studio/testrun.py --suite studio -- python3 -m unittest broken_test; echo EXIT=$?` (cwd = Scratchpad, `CI` ungesetzt, Lager auf Scratch umbiegen wie in `test_testrun.py`); das erzeugte Ereignis hat nicht-leeres `names`. Ausgabe im Bericht.
- [ ] **Echtlauf Ctrl-C (Pflicht, fester Ablauf):** `python3 tools/studio/testrun.py --suite studio -- sh -c 'sleep 300 & sleep 300' & W=$!`; `sleep 2`; `kill -INT $W`; `sleep 0.2`; `kill -INT $W`; `sleep 8` (GRACE plus Reserve); dann `ps -o pid,pgid,command | grep 'sleep 300' | grep -v grep` ist leer und `wait $W; echo EXIT=$?` liefert 130. Befehl, Wartezeiten und Ausgabe im Bericht.
- [ ] `python3 -m unittest tools.studio.tests.test_testrun` und `ruff check tools/studio/testrun.py`, Exit-Codes nennen.

**Commit:** `fix: testrun Sammelfehler-Namen und Signalfenster (TOOL-BUENDEL-7)`

## Hinweise

- Windows-/Nicht-Hauptthread-Pfad bleibt fail-open (`AttributeError`/`ValueError` abfangen).
