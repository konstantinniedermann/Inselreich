# T02 — `log.py`: `_package_exists` mit nicht-ASCII-IDs (AK-TB7-03)

**Dateien:** `tools/studio/log.py` (`_package_exists` Z. 244, `_is_package_line`), `tools/studio/tests/test_log.py`.

**Anlass:** Ereignisse werden mit `ensure_ascii` geschrieben (`"Ä"` als `Ä`). Die Vorprüfung `needle = f'"{package_id}"' in line` findet eine ID wie `Köder-1` nie, `package_known` ist dann immer falsch (Paket gilt bei jedem Aufruf als neu).

**AK-TB7-03:** `_package_exists(id)` ist wahr, wenn eine Paketzeile mit genau dieser ID im Lager steht, unabhängig von der Kodierung (ASCII und nicht-ASCII). Eine ID gilt nur bei exakter Übereinstimmung (`Köder-1` nicht für `Köder-10`). Fehler beim Lesen bleiben «neu» (`False`). Keine Änderung am Dateiformat.

## Schritte

- [ ] **Rot (R395):** Test: Lager (temporäre `events_file()`, wie die vorhandenen Tests im Modul) mit einer Paketzeile `{"type":"package","id":"Köder-1",…}` einmal `ensure_ascii=True` und einmal `False` geschrieben; erwartet `True`. Lauf `python3 -m unittest tools.studio.tests.test_log; echo EXIT=$?` → `EXIT=1`.
- [ ] **Rot (R395), Gegenprobe:** Lager enthält `Köder-1`; `_package_exists("Köder-10")` ist `False` und `_package_exists("Köder")` ist `False` (Vorfilter darf nicht auf Teilstrings anspringen); für ASCII ebenso `T1` gegen `T10`.
- [ ] **Grün:** Vorfilter ersetzen durch `needle in line or json.dumps(package_id) in line` (beide Kodierungen), die Prüfung in `_is_package_line` bleibt massgeblich. Lauf grün; bestehende ASCII-Tests unverändert grün.
- [ ] **Echtlauf (Pflicht):** `python3 tools/studio/log.py package --id "Zä-T99" --title x --owner lead-tech --status open` zweimal gegen ein Scratch-Lager (`STUDIO_EVENTS`/Variable laut `events_file()`), Ausgabe zeigt beim zweiten Mal «bekannt»; danach Scratch-Lager löschen, **nie** das echte Lager beschreiben.
- [ ] `ruff check tools/studio/log.py; echo EXIT=$?`.

**Commit:** `fix: log _package_exists findet nicht-ASCII-IDs (TOOL-BUENDEL-7)`
