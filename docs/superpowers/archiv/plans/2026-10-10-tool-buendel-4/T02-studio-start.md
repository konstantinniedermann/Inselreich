# T02 · `make studio`: Bereitschaftsprüfung mit Wartezeit, zweiter Aufruf erkennt Server

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer A `tech-sim-engineer` (sonnet) · AK-TB4-03, AK-TB4-04 · blocked-by T01 (gleicher Baum, danach) · Grösse S (≈ 15 Tools)

**Files:**

- Modify: `tools/studio/start.sh` (Schleife Z. 41–48 und `running`)
- Create: `tools/studio/tests/test_start.py`
- Nicht ändern: `Makefile` (Ziele `studio`, `studio-stop`), `server.py`

**Befund:** Die Bereitschaftsprüfung ruft `/api/state` mit `timeout=1` bis zu 20 × 0,25 s ab. Der erste Abruf rechnet den ganzen Zustand und überschreitet bei grossem Lager die 1 s; die Schleife meldet «startet nicht», obwohl der Server kurz danach läuft. Ein zweiter Aufruf findet bei totem `server.pid`-Eintrag den Prozess nicht und scheitert mit `Address already in use`.

- [ ] **Step 1: Test zuerst (rot)** — `test_start.py` (`unittest`, `subprocess`, Temp-`STUDIO_HOME`, freier Port aus `socket.bind(("127.0.0.1", 0))` als `STUDIO_PORT`, beides «nur für Tests»; `start.sh stop` in `tearDown`):
  - `test_start_reports_ready`: `bash start.sh` → Exit 0, Ausgabe enthält die URL, `urlopen` auf `/` antwortet 200.
  - `test_second_start_reports_running`: zweimal `bash start.sh` → beide Exit 0, zweite Ausgabe enthält «läuft bereits».
  - `test_running_server_without_pid_file`: Server starten, `server.pid` löschen, erneut `start.sh` → Exit 0, «läuft bereits», **kein** zweiter Prozess (`Address already in use` fehlt in der Ausgabe).
  - `test_dead_process_reports_failure_fast`: Port mit einem Fremd-Socket belegen, der **nicht** HTTP spricht (`listen`, kein `accept`-Handler) → `start.sh` endet mit Exit 1 und der Meldung «startet nicht», in < 20 s.
- [ ] **Step 2:** `python3 -m unittest tools/studio/tests/test_start.py` (aus `tools/studio` mit `-t` wie `make studio-test`) → Rot (Test 1 evtl. grün).
- [ ] **Step 3: Umsetzen** in `start.sh`:
  - Hilfsfunktion `answers() { python3 -c "import urllib.request,sys; urllib.request.urlopen('${URL}', timeout=3)" 2>/dev/null; }` (`/` ist statisch und billig).
  - Vor dem Start: `if running || answers; then echo "Studio-Dashboard läuft bereits: $URL"; exit 0; fi`.
  - Schleife bis 15 s (60 × 0,25 s): jedes Mal erst `kill -0 $(cat "$PID_FILE")` — tot → sofort Fehler mit Verweis auf `server.log`; sonst `answers` → Erfolg.
  - Timeout ohne Antwort, Prozess lebt: Meldung «Studio-Dashboard antwortet noch nicht (Prozess läuft, PID …) — später `make studio` erneut» auf stderr, Exit 1.
- [ ] **Step 4:** Test grün; `make studio-lint`, `make studio-test` Exit 0 (`shellcheck` nicht vorhanden, nicht nötig).
- [ ] **Step 5:** `git add tools/studio/start.sh tools/studio/tests/test_start.py && git commit -m "fix: make studio wartet auf Bereitschaft und erkennt laufenden Server"`
