# T03 — `make push-check` ersetzt die Push-Kette (AK-TB6-05 … AK-TB6-08, R503 B1/B3/B5)

**Dateien:** neu `tools/studio/pushcheck.py`, neu `tools/studio/tests/test_pushcheck.py`, `Makefile` (Ziele `push-check`, `check-push`, Variable `CHECK_PUSH_STEPS`; nur der Absatz um `check`/`check-run`), `docs/arc42.md` (Absatz Push-Gate ≈ Z. 605), `tools/zeitreserve/README.md` (Absatz Push-Gate). Grundlage: R488 V1, R503, STUDIO.md „Merges“ (R429), Retro REL-18 V1.

**Warum Python:** Ablauf mit Warten, Exit-Codes und Ereignis; mit `make studio-test` testbar (Runner, Load, Uhr, Schlaf injizierbar), Muster `testrun.py`. Uhr nur über `clock.py` (R450 V2).

**B3 (beim Nachtrag durch Lesen geprüft):** `make check-run` enthält das lockere Ziel `zeitreserve` (`check.ts` ohne `--push`, Z. 29–30: `VERDICT = loadVerdict(LOAD)` mit der **aktuellen** Last nach Vitest). Liegt diese ≤ 4, ist es streng: ein Test ohne Reserve gibt Exit 1, `check-run` bricht vor `studio-test`/`build` ab, und die Nachmessung käme nie zum Zug. Liegt sie > 4, nur Warnung. **Festlegung:** `push-check` ruft nicht `make check`, sondern `make check-push` = dieselben Schritte **ohne** `zeitreserve` unter der Testsperre; die strenge Bewertung macht `push-check` selbst (Schritt 4). Makefile DRY: `CHECK_PUSH_STEPS := conflicts lint zeittests test studio-test build pages-limit`, `check-run: $(CHECK_PUSH_STEPS) zeitreserve` (Inhalt von `make check` gleich, `zeitreserve` läuft zuletzt), `check-push: ## make check ohne lockeres zeitreserve, nur für push-check (R503 B3)` → `@node $(TESTLOCK) $(MAKE) $(CHECK_PUSH_STEPS)`.

**Ablauf (Konstanten oben):** `LOAD_WAIT = 3.0`, `WAIT_MAX_S = 600`, `POLL_S = 15`, `RETRY_LOAD = 3.0`, `MARKED = .studio/zeitreserve-marked.json`, `RETRY_OUT = .studio/zeitreserve-retry.json`.

0. HEAD und `git status --porcelain --untracked-files=no` merken (B5).
1. Vorprüfungen, Abbruch beim ersten Fehler: `make conflicts`, `npx tsc --noEmit`, `make lint`, `make zeittests`. `make` meldet jeden Rezeptfehler als Exit 2; `pushcheck.py` übersetzt in Exit 1 (Exit 2 nur „kein ruhiges Fenster/nicht belastbar“).
2. Warten bis 1-min-Load (`os.getloadavg()[0]`) ≤ `LOAD_WAIT`; je 60 s eine Zeile; nach `WAIT_MAX_S` Exit 2.
3. `MARKED` und `RETRY_OUT` **löschen** (B1), dann genau **ein** `make check-push`. Exit ≠ 0 mit `testlock: ABBRUCH` in der Ausgabe → Exit 3; sonst rot → Exit 1. Ausgabe durchreichen und mitlesen.
4. `node tools/zeitreserve/check.ts --push --marked MARKED` direkt (nicht über `make`, sonst ginge 1 vs. 2 unter). `loadStart` liest `pushcheck.py` aus `.studio/zeitreserve.json`.
5. Nachmessung **höchstens einmal**, wenn Schritt 4 Exit 2 (Last) **oder** Exit 1 bei `loadStart` > `RETRY_LOAD`. Fehlt `loadStart`, ist Exit 1 endgültig (B6). D1: Exit 2 und `MARKED` **existiert, ist eine gültige JSON-Liste und leer** → Exit 0 ohne Nachlauf; fehlt die Datei oder ist sie ungültig → Exit 2 (B1). Sonst Load-Warten wie 2, dann `ZEITRESERVE_OUT=RETRY_OUT node tools/testlock/testlock.ts npx vitest run <markierte Dateien> --reporter=default --reporter=./tools/zeitreserve/reporter.ts`, dann `check.ts --push --retry RETRY_OUT` (die Liste berechnet T02 selbst neu, B2).
6. `make check-ci-perf`.
7. HEAD und `git status --porcelain --untracked-files=no` erneut: HEAD bewegt oder getrackte Dateien verändert → Exit 1 „Arbeitsbaum verändert, neu starten“ (B5). Schlusszeile `push-check: EXIT=<n> · geprüfter Hash <HEAD> · check-push 1× · Nachmessung <0|1> (<k> Dateien) · <m:ss>` und Ereignis `push_check` über `paths.append_event` (`ts`, `session_id` wie `log.py` (`CLAUDE_CODE_SESSION_ID`, sonst `manual`), `head`, `exit`, `full_checks`, `retry_files`, `duration_s`, `steps` = `{name, exit, s}`); Schreibfehler schlucken.

**AK-TB6-05:** Vorprüfungen in der Reihenfolge oben; erster Fehler → Exit 1 ohne `check-push`. Load-Warten mit Obergrenze, Exit 2 bei Zeitablauf.
**AK-TB6-06:** Je Aufruf genau ein `check-push`, nie `make check`; bei Exit 2 (Last) oder Exit 1 mit `loadStart` > 3 genau eine Nachmessung nur der markierten Dateien; Exit 1 bei `loadStart` ≤ 3 oder ohne `loadStart` ist endgültig. D1 nur mit existierender, gültiger, leerer Liste.
**AK-TB6-07:** `check-ci-perf` nach grüner Zeitreserve; rot → Exit 1. Schlusszeile und `push_check` wie oben; `make push-check; echo EXIT=$?` gibt den Code weiter.
**AK-TB6-08:** Testsperre belegt → Exit 3, kein Warten in der Sperre; HEAD oder getrackte Dateien verändert → Exit 1.

## Schritte

- [ ] **Test zuerst** (`test_pushcheck.py`; Fake-Runner mit Exit-Code und Ausgabe je Befehl, Fake-Load, Fake-Uhr/Schlaf, Temp-Ordner für `MARKED`, `RETRY_OUT`, Messung, Ereignisdatei; Fake-Git für HEAD/Status):
  1. `make lint` rot (Fake-Exit 2) → Exit 1, `check-push` nicht aufgerufen.
  2. Load 5, 4, 2,9 → zweimal warten, dann `check-push`; Load immer 5 → Exit 2, kein `check-push`.
  3. (B3) `check-push` Exit 0 bei einer Messung mit einem Test ohne Reserve; `check.ts --push` Exit 2 + Liste `["tests/ui/a.test.ts"]` → genau ein Vitest-Aufruf mit genau dieser Datei und `ZEITRESERVE_OUT`, dann `--retry`; `make check` **nie**, `check-push` genau einmal.
  4. (B3) wie 3, aber `check.ts --push` Exit 1: `loadStart` 2,5 → Exit 1, keine Nachmessung; 3,6 → eine Nachmessung; `loadStart` fehlt → Exit 1, keine Nachmessung (B6).
  5. (B1) Exit 2 und leere gültige Liste → Exit 0 (D1); Liste fehlt → Exit 2; Datei kein JSON → Exit 2.
  6. (B1) Veraltete `MARKED` mit `["alt.test.ts"]` vor dem Lauf, Fake-`check.ts` schreibt keine → Datei wurde vor `check-push` gelöscht (Reihenfolge im Runner-Protokoll) und Ergebnis Exit 2, nicht Nachmessung von `alt.test.ts`.
  7. (B5) Fake-Git-Status am Ende ≠ Beginn (getrackte Datei geändert) → Exit 1; nur ungetrackte Dateien neu → Exit 0.
  8. `check-ci-perf` rot → Exit 1; `check-push` Exit 2 mit `testlock: ABBRUCH` → Exit 3 (B6), ohne → Exit 1; HEAD bewegt → Exit 1.
  9. Ereignis `push_check` mit `full_checks == 1`, Schlusszeile im Format; Schreibfehler ändert den Exit nicht.
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_pushcheck; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung:** `main(run, load, sleep, git)` mit injizierbaren Funktionen; `flush=True` für Hintergrund-Aufrufer (E-037). `Makefile`: Variable, `check-run`, `check-push` wie oben, `push-check: ## Push-Gate in einem Schritt (R488 V1, R503)` → `@python3 tools/studio/pushcheck.py`.
- [ ] **Doku:** `docs/arc42.md` Push-Gate-Absatz (`make push-check` als Einstieg, `check-push` ohne lockeres `zeitreserve`, Ereignis `push_check`); `tools/zeitreserve/README.md` verweist darauf. STUDIO.md und Integrator-Persona **nicht** (studio-coach).
- [ ] **Prüfen:** `test_pushcheck`, Ruff (`uvx ruff@0.17.0 check` und `format --check` auf beide Dateien), `python3 tools/studio/clock.py --check tools/studio`, `make -n check-run` und `make -n check-push` (Trockenlauf, Reihenfolge im Bericht). **Kein** `make push-check` durch den Umsetzer; den Echtlauf fährt der Controller (Index).

**Commit:** `feat: make push-check ersetzt die Push-Kette (R488 V1, R503)`

## Hinweise

- **B4:** Die Vorprüfungen (Schritt 1) wiederholen Teile von `check-push` bewusst: schneller Abbruch vor dem Load-Warten (R398, R410).
- M3 (R488) lässt sich aus `push_check`-Ereignissen zählen; keine Auswertung hier.
- `.studio/zeitreserve-*.json` sind per `.gitignore` Z. 11 ignoriert.
