# T01b · Prettier-Check: Hook-Datei, `make hooks`, Echtlauf (TOOL-PRETTIER-HOOK)

Strang `py` · Worktree `.worktrees/buendel-py` · Branch `tool/buendel-py` · Umsetzer `tech-sim-engineer` (sonnet), **im selben Start nach [T01a](T01a-precommit.md)** · AK-TB01, TB05, TB06 · Grundlage R417 V2

**Files:**

- Create: `tools/githooks/pre-commit` (Modus 100755)
- Modify: `Makefile` (Ziel `hooks`, `.PHONY`)

**Interfaces:** Consumes `tools/studio/precommit.py` aus T01a (`main()` liefert Exit 0/1). Produces `make hooks` (T06 dokumentiert es).

## Schritt 1 · Hook-Datei und Make-Ziel

`tools/githooks/pre-commit`, danach `chmod +x tools/githooks/pre-commit`:

```sh
#!/bin/sh
# Prettier-Check der gestagten Dateien (R417 V2, TOOL-PRETTIER-HOOK); aktiv nach `make hooks`.
# Grenzen: Prettier liest den Arbeitsbaum, nicht den Index (Teilstaging mit `git add -p`);
# `git commit --no-verify` umgeht den Hook (Briefing-Regel, nicht technisch); CI prüft mit `make lint`.
root=$(git rev-parse --show-toplevel) || exit 0
[ -f "$root/tools/studio/precommit.py" ] || exit 0
exec python3 "$root/tools/studio/precommit.py"
```

`Makefile`: `hooks` in `.PHONY` ergänzen und nach `install` einfügen:

```make
hooks: ## Git-Hooks aktivieren (core.hooksPath=tools/githooks: Prettier-Check beim Commit, R417)
	git config core.hooksPath tools/githooks
```

## Schritt 2 · Grün und Echtlauf

- `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_precommit.py'; echo EXIT=$?` → 0.
- `git ls-files -s tools/githooks/pre-commit` zeigt `100755`.
- `make -n hooks; echo EXIT=$?` → zeigt `git config core.hooksPath tools/githooks`, Exit 0 (Ausgabe ins Protokoll; `make hooks` selbst **nicht** ausführen, R428).
- **Echtlauf** (Werkzeug-Pflichtzeile R375; nie `git config` setzen, nur `-c`): im Worktree `printf 'const  a=1\n' > probe-hook.ts && git add probe-hook.ts && git -c core.hooksPath=tools/githooks commit -m probe; echo EXIT=$?` → Exit 1 mit Meldung; danach `git restore --staged probe-hook.ts && rm probe-hook.ts`. Ausgabe in den Bericht.
- **Laufzeit (AK-TB05):** 30 formatierte Dateien in `probe-zeit/` kopieren (z. B. `cp src/sim/*.ts probe-zeit/` bis 30), `git add probe-zeit`, dreimal `time python3 tools/studio/precommit.py; echo EXIT=$?`, Median < 3 s in den Bericht (Planmessung lead-tech: Prettier allein 0,34 s für 30 Dateien bei Load 3,2; Worktrees verlinken `node_modules`); dann `git restore --staged probe-zeit && rm -r probe-zeit`. `git status` danach sauber.

## Schritt 3 · Prüfungen und Commit

```bash
make studio-test; echo EXIT=$?
make studio-lint; echo EXIT=$?
make lint; echo EXIT=$?
make conflicts; echo EXIT=$?
make check; echo EXIT=$?
```

Alle Exit 0 (`make check` über die Testsperre; Exit 3 = belegt, später erneut, Lauf > 4 min im Hintergrund, E-037).

```bash
git add tools/githooks/pre-commit Makefile
git commit -m "feat: Git-Hook pre-commit und make hooks (R417 V2)"
```

DoD (T01a + T01b): AK-TB01–TB06 belegt; Rot-Beleg je neuem Testfall; Echtlauf und Laufzeit im Bericht; `make studio-test` grün.
