# T01 Last und Worker im Testereignis (R750 V1)

Datei: `tools/studio/testrun.py`, Test `tools/studio/tests/test_testrun.py`.

- `test_passed` und `test_failed` tragen `load` (1-min-Last, gemessen VOR dem Start des Kommandos, eine Nachkommastelle) und, nur bei `suite == "vitest"`, `workers` (int).
- `workers`: Ist Last >= `LOAD_CAP` (= 8, Konstante) und `VITEST_MAX_WORKERS` nicht schon gesetzt, setzt testrun `VITEST_MAX_WORKERS=str(WORKER_CAP)` (= 4) in der Umgebung des Kindes; `workers` = 4. Sonst `workers` = bereits gesetzter Wert, sonst `max(1, os.cpu_count() - 1)` (Vitest-Standard).
- Die Last wird in `main` einmal vor `_run` gelesen und an `build_event` gereicht (das bisherige `load` am Ende bei test_failed entfällt zugunsten des Startwerts). `os.getloadavg` kann OSError werfen: dann `load` weglassen und nichts begrenzen.
- Bestehende Aufrufer (`build_event(suite, code, lines)`) und Tests anpassen; testrun wirft nie.
  AK: (1) Test rot zuerst: passed-Event hat load und workers; (2) Last 9.0 -> Kind sieht VITEST_MAX_WORKERS=4, Event workers=4; (3) Last 3.0 -> Variable unverändert, workers = Standard; (4) vorgesetztes VITEST_MAX_WORKERS=2 bleibt; (5) studio-Suite: kein `workers`-Feld.
  Echtlauf: `python3 tools/studio/testrun.py --suite vitest -- npx vitest run tests/sim/rng.test.ts` (oder eine kleine Testdatei) und die letzte Zeile aus `.studio/events.jsonl` zeigen; einmal mit `uptime` Last, einmal Fake per Unit-Test.
