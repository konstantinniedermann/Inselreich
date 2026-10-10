# T04 · Hook-Kleinkram: Schein-Session «manual», Hook ohne `python3`, Klammern im Einsatz

Strang `py` · Worktree `.worktrees/b2-py` · Branch `tool/b2-py` · Umsetzer `tech-sim-engineer` (sonnet), **gebündelt mit T01** (nach T01, je Teil ein Commit) · AK-TB2-08, 09, 10 · Grundlage `docs/beobachtungen.md` (TOOL-BUENDEL: Schein-Session «manual»; Git-Hook ohne `python3`; TOOL-AKTIVIERUNG: haiku-Zeile) · Grösse S (≈ 20 Tools)

**Files:**

- Modify: `tools/studio/model.py` (Konstante + eine Bedingung in `_Builder.apply`, um Z. 37 und 456), `tools/studio/precommit.py` (`record`, um Z. 68), `tools/githooks/pre-commit` (Mode 100755 bleibt), `tools/studio/modelguard.py` (Kopfzeilen-Klammer, Z. 22 und `reason`)
- Test: `tools/studio/tests/test_model.py` (nur neue Klasse am Dateiende anhängen; Datei hat 2382 Zeilen — nur Kopf mit Imports/Helfern und das Dateiende lesen), `tools/studio/tests/test_precommit.py`, `tools/studio/tests/test_modelguard.py`
- Nicht ändern: `guard.py`, `hook.py`, `docs/studio/STUDIO.md` (die haiku-Tabellenzeile bleibt wie sie ist), `.claude/settings.json`

## Teil A · Schein-Session «manual» (AK-TB2-08)

Ursache: `precommit.record` setzt ohne `CLAUDE_CODE_SESSION_ID` die session_id `"manual"`; `model._Builder.apply` legt für jede session_id ausser `CI_SESSION` eine Session an.

**Regel:** Neue Konstante `MANUAL_SESSION = "manual"  # Events ohne Claude-Session (Commit von Hand, precommit.py)` neben `CI_SESSION` in `model.py`. `apply` legt für `MANUAL_SESSION` keine Session an (wie `CI_SESSION`); das Event bleibt im Feed/Zähler. `precommit.record` importiert die Konstante **lazy** (`from model import MANUAL_SESSION` in `record`, wie schon `paths`) statt des String-Literals.

Tests zuerst (rot):

- `test_model.py`, neue Klasse `ManualSessionTest`: Events einer echten Session `s1` plus ein `commit_rejected` mit `session_id: "manual"` und **jüngerem** `ts` → `build_state(events, now, {}, "latest")["session"] == "s1"` und `"manual"` nicht in den Session-IDs des Zustands (`state["sessions"]`). Rot vorher: `latest` zeigt auf `manual`.
- `test_precommit.py`: `record` ohne `CLAUDE_CODE_SESSION_ID` (mit `STUDIO_HOME` auf ein Temp-Verzeichnis) schreibt `session_id == model.MANUAL_SESSION`.

## Teil B · Hook ohne `python3` (AK-TB2-09)

Ursache: `exec python3 …` endet ohne `python3` mit Exit 127 und blockiert den Commit, obwohl alle anderen Werkzeugfehler zulassen.

Neue Zeile vor dem `exec` in `tools/githooks/pre-commit`:

```sh
command -v python3 >/dev/null 2>&1 || { echo "pre-commit: python3 fehlt, Prettier-Check übersprungen (CI prüft mit make lint)." >&2; exit 0; }
```

Test zuerst (rot), `test_precommit.py`, neue Klasse `HookShellTest`:

- Temp-Verzeichnis `bin/` mit Symlink nur auf `git` (`shutil.which("git")`); `subprocess.run(["/bin/sh", str(hook)], cwd=repo_root(), env={"PATH": str(bin_dir), "HOME": …}, capture_output=True, text=True)` → `returncode == 0` und `"python3 fehlt"` in `stderr`. Rot vorher: 127.
- Gegenrichtung bleibt durch bestehende Tests gedeckt (Hook ruft `precommit.py`); zusätzlich `os.access(hook, os.X_OK)` prüfen (100755 nach der Änderung).
- Ist `/bin/sh` nicht vorhanden → `skipTest` mit Grund.

## Teil C · Klammern im Einsatz (AK-TB2-10)

Ursache: `PAREN = re.compile(r"\(([^)]*)\)")` schneidet bei `Modell: haiku (mechanische Prüfungen (Formatierung, Links, Listen abgleichen))` an der ersten `)` ab; der Einsatz passt dann nie. Wirkt heute nicht (haiku ist die unterste Stufe), trifft aber jede künftige Zeile mit Klammern.

**Regel:** Die Kopfzeilen-Klammer reicht von der **ersten `(` bis zur letzten `)`** der Zeile (`re.compile(r"\((.*)\)")`, gierig). Der Vergleich bleibt `given.startswith(_norm(use))`. Der Tabellenparser (`ROW`, `COMMA`) bleibt unverändert — er trennt Kommas in Klammern schon richtig.

Tests zuerst (rot), `test_modelguard.py`:

- `test_use_with_parentheses_in_header`: Tabelle aus Text mit zwei Zeilen (`opus` mit Einsatz `Final-Review (über die Branch)`, `sonnet` mit `Standard`), Persona-Frontmatter `sonnet`, Aufruf `model: "opus"`, Kopfzeile `Modell: opus (Final-Review (über die Branch))` → `reason(...)` ist `None`. Rot vorher: Grund-Text.
- `test_real_table_haiku_use_parses`: `model_table` auf das echte `docs/studio/STUDIO.md` → die `haiku`-Zeile hat genau einen Einsatz, der mit `mechanische Prüfungen (` beginnt und mit `)` endet (pinnt das Tabellenformat).
- Bestehender Test „falscher Einsatz → deny“ bleibt grün (Gegenprobe der Gier: `Modell: opus (Spiel) (Final-Review)` darf **nicht** zulassen, weil `given` mit `spiel` beginnt).

## Prüfbefehle

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -k ManualSession -k HookShell -k parentheses -k haiku; echo EXIT=$?
make studio-test >/dev/null 2>&1; echo EXIT=$?
make studio-lint; echo EXIT=$?
```

## Commits

Je Teil ein Commit: `fix: Commits von Hand ohne Schein-Session im Dashboard`, `fix: pre-commit lässt ohne python3 zu`, `fix: Modell-Guard liest Einsatz mit Klammern`; Trailer der Session. Danach `make check` einmal über die Testsperre (Exit 3 = später erneut).

## Bericht (gemeinsam mit T01)

Je Teil: Testname, rot-vorher-Beleg (Ausgabe-Zeile), Exit-Codes; `git diff --stat main...HEAD`.
