# T06 — E-059 Merge-Treiber für `docs/beobachtungen.md` (AK-TB6-13 … AK-TB6-15)

**Dateien:** neu `tools/studio/merge_append.py`, neu `tools/studio/tests/test_merge_append.py`, neu `.gitattributes`, `Makefile` (Ziel `merge-driver`). Nicht: `production-integrator.md`, `STUDIO.md`, `CHANGELOG.md`, `experimente.md` (studio-coach nach dem Merge). Grundlage: R497, `docs/studio/experimente.md` E-059 (≈ Z. 568), E-031 (`merge=union` verworfen: gestrichene Zeilen kehrten zurück).

**Aufruf durch Git:** `.gitattributes`: `docs/beobachtungen.md merge=beob-append`. `make merge-driver` setzt (idempotent, in `.git/config`, gilt für alle Worktrees):
`git config merge.beob-append.name "Beobachtungen: reine Anhänge selbst auflösen (E-059)"` und
`git config merge.beob-append.driver "python3 tools/studio/merge_append.py %O %A %B %L %P"`.
Ohne gesetzten Treiber fällt Git auf den normalen Text-Merge zurück (heutiges Verhalten) — im Test belegen.

**Verfahren:** `git merge-file -p --diff3 -L ours -L base -L theirs --marker-size=<L> <A> <O> <B>` liefert das Ergebnis mit Konfliktblöcken (`<<<<<<<` ours `|||||||` base `=======` theirs `>>>>>>>`). Jeder Block mit **leerem Basis-Teil** wird ersetzt durch ours-Zeilen, dann theirs-Zeilen. Blöcke mit Basis-Inhalt bleiben unverändert stehen. Ergebnis nach `%A` schreiben; Exit 0, wenn kein Block übrig ist, sonst Exit 1 (Git meldet dann Konflikt). Eigene Fehler (Ausnahme, `git` fehlt): `%A` unverändert lassen und Exit 1 (Git zeigt Konflikt, nichts geht verloren).

**AK-TB6-13:** Beide Seiten hängen am Dateiende (oder an derselben Stelle) unterschiedliche Abschnitte an → Ergebnis enthält Basis + ours-Zugang + theirs-Zugang in dieser Reihenfolge, keine Konfliktmarken, Exit 0. Identische Anhänge auf beiden Seiten erscheinen einmal (Git löst das bereits selbst; Test belegt es).
**AK-TB6-14:** Eine Seite löscht oder ändert eine Basiszeile, die andere ändert dieselbe Stelle → Block mit Basis-Teil bleibt mit Marken stehen, Exit 1; lösbare Blöcke derselben Datei sind aufgelöst. Gegenprobe Zeilenbilanz: Überschriften `^## ` im Ergebnis = Basis + Zugänge beider Seiten − Löschungen (wie E-059 Messgrösse); keine gestrichene Zeile kehrt zurück (Unterschied zu `merge=union`).
**AK-TB6-15:** Integrationstest mit echtem `git` in einem Temp-Repo: `.gitattributes` + `git config` wie oben (Treiberpfad auf das Modul im Repo zeigen lassen), zwei Branches mit Anhängen → `git merge` ohne Konflikt; dasselbe aus einem `git worktree` heraus (Treiber läuft im Wurzelverzeichnis des Arbeitsbaums); ohne `git config` → normaler Konflikt. `make merge-driver` zweimal hintereinander → gleiche Konfiguration (Prüfung im Bericht per `git config --get-regexp '^merge\.beob-append'`).

## Schritte

- [ ] **Test zuerst** (`test_merge_append.py`): reine Funktion `resolve(text: str, marker_size: int) -> tuple[str, int]` (Anzahl offener Blöcke) mit Fällen: ein Block Basis leer; zwei Blöcke, einer lösbar, einer nicht; Block mit Marken-Länge 9 (`%L`); Datei ohne Zeilenumbruch am Ende; CRLF bleibt erhalten. Dazu `main([...])` gegen Temp-Dateien und der Integrationstest AK-TB6-15 (`subprocess` mit `git`, `GIT_CONFIG_GLOBAL=/dev/null`, eigener `user.name`/`user.email` im Temp-Repo).
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_merge_append; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung:** `merge_append.py` nur Standardbibliothek; `resolve` rein; `main(argv)` ruft `git merge-file`, schreibt `%A`, gibt Exit-Code zurück, wirft nie. `Makefile`: `merge-driver: ## Merge-Treiber für docs/beobachtungen.md in .git/config setzen (E-059, einmal je Klon)`.
- [ ] **Echtlauf (Bericht):** Im Worktree `make merge-driver; echo EXIT=$?`, dann `git config --get-regexp '^merge\.beob-append'`. Beleg für die Wirkung ist der Integrationstest AK-TB6-15 (echtes `git merge`), nicht `git merge-tree`. Treiber-Konfiguration nach dem Echtlauf stehen lassen (wirkt erst mit `.gitattributes` auf main).
- [ ] **Prüfen:** Test, Ruff wie in T03; `node tools/conflicts/check.ts; echo EXIT=$?` bleibt 0.

**Commit:** `feat: Merge-Treiber löst reine Anhänge in docs/beobachtungen.md (E-059)`

## Hinweise

- `git merge-file` mit `--diff3` ist Teil von Git (keine Abhängigkeit). `-L`-Etiketten fest, damit `resolve` sie nicht raten muss; Marken-Länge aus `%L`.
- Messgrösse E-059 und Start des Experiments: studio-coach nach dem Merge (Index, Handbuch-Folgen).
