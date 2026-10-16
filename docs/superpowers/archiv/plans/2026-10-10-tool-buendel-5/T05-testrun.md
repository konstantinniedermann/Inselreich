# T05 — `testrun`: Eskalation, Abbruch-Ereignis, ungetrackte Dateien (AK-TB5-09 … AK-TB5-11)

**Dateien:** `tools/studio/testrun.py` (`_diff_hash` ≈ Z. 63, `_run` ≈ Z. 100–117, `main`), `tools/studio/tests/test_testrun.py`. Konsumenten von `kind` per Grep prüfen (`efficiency.py`, `metrics.py`, `model.py`); Änderungen dort nur falls ein unbekannter `kind` crasht (dann melden, nicht stillschweigend erweitern).

**AK-TB5-09:** Ignoriert das Kind SIGTERM, wird es nach 5 s (Konstante) per SIGKILL beendet; `testrun` kehrt zurück (Exit 128+SIGINT bei Ctrl-C).
**AK-TB5-10:** Ctrl-C schreibt ein Ereignis `kind: test_aborted` (Felder `suite`, `commit`, `diff`, `ts`, `session_id`), vor dem Weiterwerfen, nie `test_failed`; `flake_suspects` ignoriert es.
**AK-TB5-11:** `_diff_hash` ändert sich, wenn eine ungetrackte Datei entsteht oder sich in Grösse/`mtime_ns` ändert; ohne Änderung stabil. Inhalte werden nicht gelesen. Sammelfehler-Namen sind **nicht** Teil dieses Tasks (gestrichen, Index).

## Schritte

- [ ] **Test zuerst:** `test_sigterm_ignoring_child_is_killed` (Kindbefehl `python3 -c` mit `signal.signal(SIGTERM, SIG_IGN)` und Schlaf; Frist per Monkeypatch auf 0,3 s), `test_keyboard_interrupt_records_aborted`, `test_diff_hash_sees_untracked_file` (Temp-Git-Repo wie bestehende Tests).
- [ ] **Umsetzung:** `_run`: `terminate()`, `wait(timeout=GRACE)`, bei `TimeoutExpired` `kill()` + `wait()`; Prozessgruppe nur, wenn der Test zeigt, dass Enkel überleben (`start_new_session=True`, `os.killpg`), sonst Kind allein, Entscheid im Bericht. `KeyboardInterrupt`-Zweig ruft `_record_aborted(suite)` (nutzt `build_event`-Grundfelder, schluckt alle Fehler). `_diff_hash`: `git ls-files -o --exclude-standard -z`, Eintrag `name\0size\0mtime_ns` in den Hash mischen; Fehler = bisheriges Verhalten.
- [ ] **Prüfen:** `test_testrun`, `make studio-lint`; kein Gesamtlauf.

**Commit:** `fix: testrun eskaliert auf SIGKILL, meldet Ctrl-C-Abbruch und sieht ungetrackte Dateien`

## Nacharbeit Gate Plan (R478, B1, B2, B3, B10; ersetzt die Zeile «Prozessgruppe nur, wenn der Test zeigt»)

- [ ] **B1 Prozessgruppe verbindlich:** Rot-Test: Kind startet Enkel (SIGTERM-ignorierend); nach Eskalation sind Kind **und** Enkel tot. Umsetzung `start_new_session=True` + `os.killpg` (Eskalation SIGTERM -> Frist -> SIGKILL auf die Gruppe). Der `KeyboardInterrupt`-Zweig ruft ebenfalls `killpg` (Ctrl-C erreicht die neue Gruppe nicht mehr). Test: Ctrl-C-Pfad tötet den Enkel. Fallback «nur Kind» nur mit Begründung -> Controller -> L0.
- [ ] **B2 ohne feste Schlafzeit:** `test_sigterm_ignoring_child_is_killed` und der Ctrl-C-Test: Kind meldet Bereitschaft (Handler gesetzt) per Datei/Pipe, erst dann `terminate` bzw. Interrupt. Zusätzlich Test Exit-Code 128+SIGINT (AK-TB5-09) und: die Testsperre wird nach Abbruch/Kill freigegeben.
- [ ] **B3 `test_aborted`:** Test, dass ein Lager mit `test_aborted` durch `build_state`, `flake_suspects` (`efficiency.py` ≈ Z. 697) und Metriken (`metrics.py` ≈ Z. 408) dasselbe Ergebnis liefert wie ohne das Ereignis. Test: `_record_aborted` schluckt Schreibfehler und maskiert den `KeyboardInterrupt` nicht. **Eigentum:** B fasst `model.py`, `efficiency.py`, `metrics.py` nicht an (gehören A bzw. dem Controller); Befund -> Controller -> L0.
- [ ] **B10 Diff-Hash:** Test, dass ignorierte Dateien (`.gitignore`) nicht einfliessen. Im Bericht erwähnen: ungetrackte Dateien verändern die Flake-Vergleichsbasis einmalig.
