# T01 · Dashboard-Server: Dauerlast messen und beheben

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer A `tech-sim-engineer` (sonnet) · AK-TB4-01, AK-TB4-02 · Grundlage Beobachtung «Dashboard-Server läuft dauerhaft auf 100 % CPU», Retro V3 · Grösse M (≈ 30 Tools)

**Files:**

- Modify: `tools/studio/server.py` (Handler, `send_state`; ggf. `make_server`)
- Test: `tools/studio/tests/test_server.py` (neue Tests in `ServerTest`, Hilfsmethoden der Klasse nutzen; Datei erst Kopf und Z. 14–70 lesen)
- Nicht ändern: `model.py`, `studio_docs.py`, `dashboard/`

**Befund bisher:** Prozess seit 2026-10-01 mit 334 CPU-Minuten; 102 % direkt nach Neustart mit offenem Dashboard-Tab; `.studio/server.log` mit `BrokenPipeError` in `socketserver.write`. Zwei Kandidaten, **messen vor Beheben** (Schritt 1):

- (a) Dauerlast durch Polling: Jeder `/api/state`-Abruf ruft `build_state(self.store.events(), …)` über alle Events und `bundle(self.docs, self.agents)` über alle Doku-Dateien. Mit grossem Ereignislager ist das pro Abruf teuer; der Tab ruft mehrfach pro Sekunde ab.
- (b) Schleife nach abgebrochener Verbindung: `wfile.write` wirft `BrokenPipeError`, die `except Exception` in `route` fängt sie, ruft `send_error(500)` auf dem toten Socket (wirft erneut, im Server-Thread unbehandelt).

## Schritt 1 · Messen (kein Commit)

- [ ] Server mit echtem `.studio` starten (`make studio`), Dashboard-Tab **nicht** öffnen: `ps -o %cpu,time -p $(cat .studio/server.pid)` zweimal im Abstand 10 s → Leerlauf-CPU notieren.
- [ ] 20 Abrufe in Folge messen: `python3 -c "import time,urllib.request as u; t=time.time(); [u.urlopen('http://127.0.0.1:8765/api/state').read() for _ in range(20)]; print((time.time()-t)/20)"` → Sekunden je Abruf notieren. Dazu `wc -l .studio/events.jsonl` und Dateigrösse.
- [ ] Ergebnis in den Task-Bericht (Zahlen, welche Hypothese stimmt). Ist je Abruf > 0,15 s: (a) bestätigt; ist der Leerlauf ohne Abrufe > 5 %: (b) oder eine dritte Ursache, dann `py-spy`/`sample <pid> 3` (macOS) ansehen und die Schleife benennen. `make studio-stop` danach.

## Schritt 2 · Test zuerst (rot): abgebrochene Verbindung (AK-TB4-02)

- [ ] In `ServerTest`: `test_client_abort_keeps_server_responsive` — Roh-Socket auf den Testserver, `GET /api/state` senden, Socket sofort mit `SO_LINGER` (1, 0) schliessen (Reset) ohne zu lesen; danach normaler `urlopen`-Abruf antwortet 200 **und** `sys.stderr`/Handler-Fehlerausgabe bleibt leer (`unittest.mock.patch.object(ThreadingHTTPServer, "handle_error")` zählt Aufrufe: erwartet 0).
- [ ] Rot erwartet, wenn (b) zutrifft (`handle_error` wird gerufen). Trifft es nicht zu, Test trotzdem behalten (Regression) und im Bericht «vorher schon grün» vermerken.

## Schritt 3 · Beheben

- [ ] In `Handler.route`: `except (BrokenPipeError, ConnectionResetError): return` **vor** `(ValueError, OSError)` (BrokenPipe ist ein OSError); `send_error` im `except Exception` selbst in `try/except OSError: pass` kapseln.
- [ ] Trifft (a) zu (Schritt 1): Zustandscache im Handler-Konstruktor-Argument `cache` (ein `dict` aus `make_server`, geteilt zwischen Handlern, mit `threading.Lock`): Schlüssel `(session, heartbeats, events_path.stat().st_mtime_ns, events_path.stat().st_size)`, Wert `(clock.monotonic-Zeit, body_bytes)`; Treffer, wenn Schlüssel gleich und Alter ≤ 2 s. `limits` und `bundle` bleiben im Cache (gleiche 2 s); Uhr über `clock` (nicht `time`), `make studio-lint` prüft das. Test zuerst (rot): `test_state_cached_within_two_seconds` (zwei Abrufe, `build_state` per `mock.patch("server.build_state", wraps=…)` nur einmal gerufen; nach Anhängen eines Events an die Datei wieder gerufen) und `test_cache_key_includes_session`.
- [ ] `make studio-lint` Exit 0, `make studio-test` Exit 0.

## Schritt 4 · Nachmessen und Commit

- [ ] Messung aus Schritt 1 wiederholen, mit Tab offen (oder 5 Abrufe/s per Skript): CPU < 5 %. Zahlen in den Bericht (AK-TB4-01).
- [ ] `git add tools/studio/server.py tools/studio/tests/test_server.py && git commit -m "fix: Dashboard-Server ohne Dauerlast, Abbruch einer Verbindung bleibt still"`
