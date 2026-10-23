# T01 · `pushgate.py`: Push nach main nur nach Exit 0 (V1)

Strang A · Test-first (`make studio-test`, neue Datei `tools/studio/tests/test_pushgate.py`).

**Aufgabe:** Neues Modul `tools/studio/pushgate.py` nach dem Muster von `waitguard.py` (Datei-Kopf, `MODE = "deny"` mit Rückfall `"warn"`, Fehler lassen zu, Funktion `bash_reason(payload, cwd) -> str | None`, `main()` liest stdin und gibt bei Abweisung das PreToolUse-Deny-JSON aus wie `guard.main`). Segmente und Wörter aus `guard.segments(command)` übernehmen (importieren, nicht kopieren; `guard.py` selbst bleibt unverändert).

**Regel:** Ein Bash-Segment `git [globale Optionen] push …`, das nach `main` pusht, wird abgewiesen, wenn nicht gilt: das letzte Ereignis `kind == "push_check"` in `paths.events_file()` mit `head == <aufgelöster Hash>` hat `exit == 0`. (D1 ist enthalten: `pushcheck.main` schreibt bei D1 `exit: 0`, `d1: true`; ein Exit 2 ohne D1 bleibt 2 und sperrt.)

**«Push nach main» erkennen:** Refspec `X:main`, `X:refs/heads/main`, bare `main` (Quelle = Ziel = main), `HEAD:main`. Ohne Refspec nur, wenn der aktuelle Branch im `cwd` `main` heisst (`git rev-parse --abbrev-ref HEAD`). Optionen (`-u`, `--no-verify`, `--follow-tags` …) und das Remote-Wort überspringen. Force- und Löschformen bleiben Sache von `guard.py`.

**Hash auflösen:** `git -C <cwd> rev-parse --verify --quiet <X>^{commit}` (Timeout 3 s, `subprocess.run`, Liste statt Shell) auf die volle 40-stellige Form; so sind Kurzformen, `HEAD`, `HEAD~0`, Branchnamen und Tags gleich behandelt. Nicht auflösbar bei erkanntem main-Push → Abweisung «Hash nicht auflösbar». Vergleich nur voll gegen voll.

**Ereignis lesen:** von hinten in Blöcken (höchstens 4 MB) nach dem letzten passenden `push_check`; kaputte Zeilen überspringen; Datei fehlt → keine Freigabe durch Ereignis.

**Meldung:** `Push nach main abgewiesen: letzter push_check für <Kurzhash> ist Exit <n|fehlt> (R844, Verfassung §7.2). Zuerst «make push-check; echo EXIT=$?» für genau diesen Hash; bei Exit ≠ 0 an L0 melden, nicht pushen.`; Suffix wie bei `waitguard`. Ein Ereignis `guard_block` mit `rule: "push-gate"` schreiben, wie `guard._log_block` (Fehler schlucken).

**Tests (alle rot vor der Umsetzung):** Exit 0 für Hash = erlaubt; Exit 1, 2, fehlendes Ereignis = abgewiesen; Ereignis für anderen Hash = abgewiesen; zuerst Exit 1, später Exit 0 für denselben Hash = erlaubt; zuerst Exit 0, später Exit 1 für denselben Hash = abgewiesen; Kurzhash, `HEAD`, `HEAD:main`, `refs/heads/main`, `git -C x push origin abc123:main`; Push auf `feat/x` = erlaubt; `git push` ohne Refspec auf Branch `feat/x` = erlaubt, auf `main` = geprüft; zusammengesetzt `make push-check; git push origin HEAD:main` = abgewiesen; `echo "git push origin main"` (Text, kein Befehl) = erlaubt. Git-Aufrufe in den Tests gegen ein Temp-Repo (`git init`), `STUDIO_HOME` auf Temp setzen (R378).
