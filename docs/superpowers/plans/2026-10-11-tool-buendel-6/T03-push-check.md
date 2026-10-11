# T03 — `make push-check` ersetzt die Push-Kette (AK-TB6-05 … AK-TB6-08)

**Dateien:** neu `tools/studio/pushcheck.py`, neu `tools/studio/tests/test_pushcheck.py`, `Makefile` (Ziel `push-check` mit `##`-Hilfe), `docs/arc42.md` (Absatz Push-Gate ≈ Z. 605), `tools/zeitreserve/README.md` (Absatz Push-Gate). Grundlage: R488 V1, STUDIO.md „Merges“ (Ablauf R429, ≈ Z. 377), Retro REL-18 Abschnitt V1.

**Warum Python:** Ablaufsteuerung mit Warten, Exit-Codes und Ereignis; mit `make studio-test` testbar (Runner, Load, Uhr, Schlaf injizierbar), Muster wie `testrun.py`. Uhr nur über `clock.py` (R450 V2).

**Ablauf (Konstanten oben im Modul):** `LOAD_WAIT = 3.0`, `WAIT_MAX_S = 600`, `POLL_S = 15`, `RETRY_LOAD = 3.0`.

1. Vorprüfungen, schneller Abbruch beim ersten Fehler: `make conflicts`, `npx tsc --noEmit`, `make lint`, `make zeittests`. Achtung: `make` meldet **jeden** Rezeptfehler als Exit 2; `pushcheck.py` übersetzt Fehlschläge von Make-Zielen in Exit 1 (Exit 2 ist für „kein ruhiges Fenster/nicht belastbar“ reserviert).
2. Warten, bis der 1-min-Load (`os.getloadavg()[0]`) ≤ `LOAD_WAIT`; je 60 s eine Fortschrittszeile; nach `WAIT_MAX_S` Exit 2 „kein ruhiges Fenster (Load x)“.
3. Genau **ein** `make check` (schreibt die Messung). Exit ≠ 0 und Ausgabe enthält `testlock: ABBRUCH` (Sperre belegt oder Load > 8, R375) → Exit 3 „Testsperre, später erneut“; sonst rot → Exit 1. Ausgabe wird durchgereicht und zugleich gelesen.
4. `node tools/zeitreserve/check.ts --push --marked .studio/zeitreserve-marked.json` (T02) direkt, nicht über `make zeitreserve-push` (sonst ginge Exit 1 vs. 2 im Make-Exit 2 unter).
5. Nachmessung **höchstens einmal**, wenn Schritt 4 Exit 2 (Last) meldete **oder** Exit 1 bei `loadStart` der Messung > `RETRY_LOAD`: Leere Markierungsliste bei Exit 2: kein Nachlauf, Ergebnis nach Entscheid D1 unten. Sonst Load-Warten wie Schritt 2, dann `ZEITRESERVE_OUT=.studio/zeitreserve-retry.json npx vitest run <markierte Dateien> --reporter=default --reporter=./tools/zeitreserve/reporter.ts` unter der Testsperre (`node tools/testlock/testlock.ts …`), dann `check.ts --push --retry .studio/zeitreserve-retry.json`.
6. `make check-ci-perf`.
7. Schlusszeile auf stdout: `push-check: EXIT=<n> · geprüfter Hash <HEAD> · make check 1× · Nachmessung <0|1> (<k> Dateien) · <m:ss>` und Ereignis `push_check` über `paths.append_event` (Felder `ts`, `session_id` wie `log.py` (`CLAUDE_CODE_SESSION_ID`, sonst `manual`), `head`, `exit`, `full_checks`, `retry_files`, `duration_s`, `steps` = Liste `{name, exit, s}`); Schreibfehler schlucken.

HEAD wird zu Beginn gelesen; ändert er sich bis Schritt 7, Exit 1 „HEAD bewegt, neu starten“ (Retro REL-18: gepusht wurde ein anderer Hash als geprüft).

**AK-TB6-05:** Vorprüfungen in der Reihenfolge oben; erster Fehler beendet mit Exit 1 ohne `make check`. Load-Warten mit Obergrenze, Exit 2 bei Zeitablauf.
**AK-TB6-06:** Pro Aufruf genau ein `make check`; bei Exit 2 (Last) oder Exit 1 mit `loadStart` > 3 genau eine Nachmessung nur der markierten Dateien; nie ein zweiter voller Lauf. Exit 1 bei `loadStart` ≤ 3 ist endgültig.
**AK-TB6-07:** `make check-ci-perf` läuft nach grüner Zeitreserve; rot → Exit 1. Schlusszeile und Ereignis `push_check` wie oben; `make push-check; echo EXIT=$?` gibt den Exit-Code von `pushcheck.py` weiter.
**AK-TB6-08:** Testsperre belegt → Exit 3 mit Meldung, kein Warten in der Sperre; HEAD bewegt → Exit 1.

## Entscheid D1 (L0, Entwurf im Controller-Bericht)

Exit 2 wegen Last **mit leerer Markierungsliste**: Empfehlung **Exit 0 ohne Nachlauf** (alle Tests haben unter höherer Last Reserve; Monotonie). Alternative: Nachmessung der ganzen Suite = heutiger zweiter `make check`. Bis zum Ruling setzt der Umsetzer die Empfehlung als Konstante `ACCEPT_EMPTY_MARKED = True` um, Test für beide Werte.

## Schritte

- [ ] **Test zuerst** (`test_pushcheck.py`, Fake-Runner liefert Exit-Codes je Befehl, Fake-Load-Folge, Fake-Uhr/Schlaf, Temp-Ordner für Markierungs- und Ereignisdatei):
  1. Vorprüfung `make lint` rot (Fake-Exit 2) → Exit 1, `make check` nicht aufgerufen.
  2. Load 5, 4, 2,9 → wartet zweimal, dann `make check`; Load immer 5 → Exit 2 nach `WAIT_MAX_S`, kein `make check`.
  3. Exit 2 + Markierung `["tests/ui/a.test.ts"]` → genau ein Vitest-Aufruf mit genau dieser Datei und `ZEITRESERVE_OUT`, dann `--retry`; `make check` genau einmal.
  4. Exit 1 mit `loadStart` 2,5 → Exit 1, keine Nachmessung; Exit 1 mit `loadStart` 3,6 → eine Nachmessung.
  5. Exit 2 mit leerer Liste → Exit 0 (`ACCEPT_EMPTY_MARKED = True`) bzw. Exit 2 (False).
  6. `check-ci-perf` rot → Exit 1; `make check` Exit 2 mit `testlock: ABBRUCH` in der Ausgabe → Exit 3, ohne → Exit 1; HEAD bewegt → Exit 1.
  7. Ereignis `push_check` mit `full_checks == 1` und Schlusszeile im erwarteten Format; Ereignis-Schreibfehler ändert den Exit-Code nicht.
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_pushcheck; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung:** `pushcheck.py` mit `run(cmd, env=None) -> int`, `load() -> float`, `sleep(s)` als Parameter von `main(...)`; Ausgaben ungepuffert (`flush=True`), damit Hintergrund-Aufrufer (E-037) Fortschritt sehen. `Makefile`: `push-check: ## Push-Gate in einem Schritt (R488 V1): Vorprüfungen, Load ≤ 3 abwarten, make check, zeitreserve-push, gezielte Nachmessung, check-ci-perf` → `@python3 tools/studio/pushcheck.py`.
- [ ] **Doku:** `docs/arc42.md` Push-Gate-Absatz: `make push-check` als einziger Einstieg, Ablauf in einem Satz, Ereignis `push_check`; `tools/zeitreserve/README.md` Push-Gate-Absatz verweist darauf. STUDIO.md und Integrator-Persona **nicht** (studio-coach, Index).
- [ ] **Prüfen:** `python3 -m unittest tools.studio.tests.test_pushcheck; echo EXIT=$?`, `uvx ruff@0.17.0 check tools/studio/pushcheck.py tools/studio/tests/test_pushcheck.py`, `uvx ruff@0.17.0 format --check …`, `python3 tools/studio/clock.py --check tools/studio`. **Kein** `make push-check` durch den Umsetzer: den Echtlauf fährt der Controller einmal am Ende des Pakets (Index).

**Commit:** `feat: make push-check ersetzt die Push-Kette (R488 V1)`

## Hinweise

- Messgrösse M3 (R488): „volle `make check` je Push = 1 in 3 Pushes, Dauer ≤ 8 min bei ≥ 4 Agenten“ lässt sich aus `push_check`-Ereignissen zählen; keine Auswertung in diesem Task.
- `.studio/zeitreserve-*.json` liegen unter `.studio/` (per `.gitignore` Z. 11 ignoriert, geprüft beim Plan).
