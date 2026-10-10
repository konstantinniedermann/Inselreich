# T08 · Rote Testläufe als `test_failed`-Event, Ampelzeile Flake-Verdacht (R450 V1)

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` B (sonnet, Start durch Controller 2) · AK-TB3-09…12 · Grundlage R450 V1, Retro `docs/studio/retros/2026-10-10-release-rel15-prozess.md` V1 (Z. ~90–98) · Grösse M (≈ 30 Tools) · blocked-by T06+T07 (Review OK) · Prüfregel V3

**Files:**

- Create: `tools/studio/testrun.py`, `tools/studio/tests/test_testrun.py`
- Modify: `Makefile` (Ziele `test` Z. 25–26 und `studio-test` Z. 49–50; T07 hat `zeittests` geändert, nicht anfassen)
- Modify: `tools/studio/efficiency.py` (`THRESHOLDS`, `LIGHT_LABELS` je **ein neuer** Schlüssel `flake`; neue reine Funktion `flake_suspects`; `_lights` ein Eintrag), `tools/studio/metrics.py` (Zweig `--efficiency` Z. ~473–488 und die Stelle, an der `--session` `efficiency.compute` aufruft, Z. ~437–440)
- Test: `tools/studio/tests/test_efficiency.py`, `tools/studio/tests/test_metrics.py` (nur neue Fälle)

## Teil A · Wrapper `testrun.py` (AK-TB3-09, 10)

Aufruf: `python3 tools/studio/testrun.py --suite <studio|vitest> [--skip-exit 3] -- <befehl …>`.

- Startet den Befehl (`subprocess.Popen`, `stderr` nach `stdout` zusammengeführt), schreibt jede Zeile sofort nach `stdout` (kein Puffern bis zum Ende), merkt sich die Zeilen, gibt **denselben Exit** zurück.
- Testnamen aus der Ausgabe: unittest `^(FAIL|ERROR): (\S+) \((.+)\)$` → `<Klasse>.<test>`; Vitest `^\s*FAIL\s+(?:\|[^|]+\|\s+)?(tests/\S+\.test\.ts)(?:\s+>\s+(.+?))?\s*$` → `<datei> > <name>` (Vitest-Zusammenfassung „Failed Tests“). Höchstens 50 Namen, je ≤ 200 Zeichen, ohne Duplikate, Reihenfolge wie gefunden.
- Event über `paths.append_event` (`source: "make"`): Exit ≠ 0 → `kind: "test_failed"` mit `suite`, `names`, `exit`, `commit` (`git rev-parse --short HEAD`), `diff` (die ersten 12 Zeichen von SHA-1 über `git diff HEAD --binary`; leer bei sauberem Baum), `load` (`os.getloadavg()[0]`, gerundet 0,1); Exit = 0 → `kind: "test_passed"` mit `suite`, `commit`, `diff`. `--skip-exit 3`: Testsperre-Abbruch (Exit 3) schreibt **kein** Event.
- **Warum `diff`:** Ein Rot, das der Umsetzer vor dem Commit behebt, hätte sonst denselben Commit wie das spätere Grün und erschiene als Flake. Gleicher Stand = gleicher `commit` **und** gleicher `diff`.
- `CI` gesetzt (`os.environ.get("CI")` nicht leer) → kein Event. Jeder Fehler beim Event (git fehlt, Datei schreibgeschützt) → eine Zeile `testrun: Event nicht geschrieben (<grund>)` auf `stderr`, Exit bleibt der des Befehls. `testrun.py` selbst wirft nie.
- Makefile: `test:` → `@python3 tools/studio/testrun.py --suite vitest --skip-exit 3 -- node $(TESTLOCK) npm test`; `studio-test:` → `python3 tools/studio/testrun.py --suite studio -- python3 -m unittest discover -s tools/studio/tests -t tools/studio`. Hilfetexte um „rot → Event `test_failed` (R450 V1)“ ergänzen.

**Tests zuerst (rot)** `test_testrun.py` (Befehle sind kleine `python3 -c`-Skripte, `STUDIO_HOME` = Temp-Ordner, `CI` im Test entfernt bzw. gesetzt):

- `test_exit_and_output_pass_through`: Befehl druckt zwei Zeilen und endet mit 4 → Exit 4, beide Zeilen in der Ausgabe.
- `test_unittest_names_parsed` / `test_vitest_names_parsed`: reine Parser-Funktion gegen eingebettete Beispielausgaben (unittest `FAIL: test_x (test_mod.Klasse.test_x)`, Vitest ` FAIL  |parallel| tests/ui/a.test.ts > Block > Fall`), Duplikate einmal.
- `test_failed_event_fields`, `test_passed_event`, `test_skip_exit_writes_nothing`, `test_ci_writes_nothing`, `test_event_error_keeps_exit` (`STUDIO_HOME` auf eine Datei statt Ordner).
- Lauf `make studio-test; echo EXIT=$?` → rot (Modul fehlt).

## Teil B · Ampelzeile (AK-TB3-11, 12)

- `efficiency.flake_suspects(events) -> list[str]` (rein): Testnamen, für die ein `test_failed` mit (`suite`, `commit`, `diff`) existiert **und** danach (Zeitstempel `ts`) ein `test_passed` mit denselben drei Werten. Sortiert, ohne Duplikate.
- `THRESHOLDS["flake"] = {"gelb": 1, "rot": 3, "op": ">="}`, `LIGHT_LABELS["flake"] = "Tests rot, beim gleichen Stand später grün (Flake-Verdacht)"` (Index E5). `_lights`: neuer Eintrag mit `data.get("flakes")`: `None` (keine Test-Events im Zeitraum) → „nicht gemessen“; sonst Anzahl, Regeltext `gelb ≥ 1, rot ≥ 3`; bei ≥ 1 eine Detailzeile darunter `  - Flake-Verdacht: <name>, …` (höchstens 10 Namen).
- `metrics.py`: nach `efficiency.compute(...)` `data["flakes"] = efficiency.flake_suspects(events)` setzen, wenn `data` nicht `None` und `events` mindestens ein `test_failed`/`test_passed` enthält; sonst `None`. `events` ist schon nach `--since` gefiltert. Gleiches im `--session`-Pfad.
- Bestehende Einträge, Schwellen, Labels und die Reihenfolge der alten Zeilen bleiben (AK-TB3-12); `effort.ampel_incidents` liest `LIGHT_LABELS` und deckt die neue Zeile ohne Änderung ab — prüfen, dass `tools/studio/tests/test_ampel.py` grün bleibt.

**Tests zuerst (rot):** `test_flake_suspects_same_state_later_green`, `test_flake_needs_same_diff` (anderer `diff` → kein Verdacht), `test_flake_green_before_red_not_counted`, `test_lights_flake_not_measured_without_events`, `test_lights_flake_yellow_and_names`; in `test_metrics.py` ein Fall `--efficiency` mit zwei Test-Events in der Szenario-Datei → Zeile mit „Flake-Verdacht“ in der Ausgabe.

## Prüfen (V3) und Commits

```bash
make studio-test; echo EXIT=$?          # läuft jetzt selbst über testrun.py
make studio-lint; echo EXIT=$?
make lint; echo EXIT=$?
H=$(mktemp -d); STUDIO_HOME=$H python3 tools/studio/testrun.py --suite studio -- python3 -c "import sys; print('FAIL: test_a (m.K.test_a)'); sys.exit(1)"; echo EXIT=$?; cat $H/events.jsonl   # Exit 1, ein test_failed mit Namen m.K.test_a
```

Kein `make test` in dieser Task (V3); den Vitest-Zweig belegt der Parser-Test und der volle Lauf in T10.

Commits: `feat: test_failed-Event für rote Testläufe (R450 V1)` und `feat: Ampelzeile Flake-Verdacht (R450 V1)`, je mit Session-Trailer.

## Abnahme (Reviewer)

- AK-TB3-09…12 mit Testnamen und Rot-Beleg; Wrapper reicht Exit in allen Fällen durch; `CI=true` belegt; keine neue Abhängigkeit.
- Hinweis: Ab diesem Commit schreibt jeder `make studio-test` im Worktree ein Event ins echte Log (`paths.studio_home()` = `.studio/` des Hauptrepos); das ist gewollt (Messgrösse V1). Probe-Aufrufe mit Absicht-Rot nur mit `STUDIO_HOME=$(mktemp -d)`.
