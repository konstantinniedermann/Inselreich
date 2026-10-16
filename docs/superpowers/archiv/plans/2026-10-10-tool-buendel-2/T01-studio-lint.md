# T01 · `studio-lint` grün, Ruff gepinnt

Strang `py` · Worktree `.worktrees/b2-py` · Branch `tool/b2-py` · Umsetzer `tech-sim-engineer` (sonnet), **gebündelt mit T04** (gleiche Instanz, T01 zuerst, eigene Commits) · AK-TB2-01 · Grundlage R439, `docs/beobachtungen.md` „TOOL-BUENDEL: `make studio-lint` auf main rot“, Index-Entscheid E4 · Grösse S (≈ 15 Tools)

**Files:**

- Modify: `Makefile` — nur das Ziel `studio-lint` (Z. 52–53); andere Ziele nicht anfassen (T06 ändert später den Hilfetext von `zeitreserve-push`).
- Modify: genau die Dateien, die `uvx ruff@0.17.0 check tools/studio` meldet (Stand Plan: `actions.py`, `efficiency.py`, `effort.py`, `graph.py`, `limits.py`, `log.py`, `metrics.py`, `model.py`, `paths.py`, `tests/fixtures/make_demo.py`, `tests/test_actions.py`, `tests/test_effort.py`, `tests/test_limits.py`, `tests/test_model.py`, `tests/test_persona_split.py`, `tests/test_rewrites.py`).
- Nicht ändern: `tools/studio/guard.py` (verfassungsgeschützt; meldet Ruff dort etwas, **stopp** und an den Controller — nicht beheben, nicht mit `# noqa` umgehen), `hook.py`, alles ausserhalb `tools/studio/` und `Makefile`.

**Befund (Stand Plan, Ruff 0.17.0, ohne Konfigurationsdatei):** 28 Fehler — 22 × UP017 (`timezone.utc` → `datetime.UTC`, automatisch behebbar), 6 × FURB162 (`fromisoformat(x.replace("Z", "+00:00"))` → `fromisoformat(x)`, als „unsafe“ markiert). Ab Python 3.11 liest `fromisoformat` das `Z` selbst; CI läuft auf ubuntu-24.04 (Python 3.12), lokal 3.14. `ruff format --check` ist schon grün.

## Schritt 1 · Ausgangslage festhalten (rot)

```bash
cd .worktrees/b2-py
uvx ruff@0.17.0 check tools/studio --statistics; echo EXIT=$?          # erwartet EXIT=1, 28 Fehler
make studio-test 2>&1 | tail -3; echo EXIT=$?                          # Testanzahl notieren ("Ran N tests")
```

Hinweis: `make studio-test … | tail` nur zum Ablesen der Testzahl; den Exit-Code danach separat mit `make studio-test >/dev/null 2>&1; echo EXIT=$?` belegen.

## Schritt 2 · Makefile pinnen

Im Ziel `studio-lint` beide Aufrufe auf die feste Version, ein Variablenname für beide:

```make
RUFF = uvx ruff@0.17.0

studio-lint: ## Ruff über tools/studio (gepinnt, via uvx; vor Commits an tools/studio, nicht Teil von check)
	$(RUFF) check tools/studio && $(RUFF) format --check tools/studio
```

`RUFF = …` direkt über dem Ziel. Kein neues Paket, keine Installation — `uvx` holt die Version in seinen Cache (`dep-guard` greift nur bei `pip/uv add/npm install`; schlägt er trotzdem an: stopp, an den Controller).

## Schritt 3 · Automatische Fixes (UP017)

```bash
uvx ruff@0.17.0 check tools/studio --fix; echo EXIT=$?
git diff --stat
```

Durchsehen: Import wird zu `from datetime import UTC, datetime` bzw. `datetime.UTC`; wo `timezone` danach ungenutzt ist, entfernt Ruff den Import (F401 prüfen). `GUARD_DATE` in `efficiency.py` u. ä. Konstanten bleiben gleichwertig.

## Schritt 4 · FURB162 von Hand

Die 6 Stellen einzeln ändern (nicht `--unsafe-fixes` pauschal). Je Stelle prüfen, ob die Eingabe auch ohne `Z` vorkommen kann (dann ist `fromisoformat` ohnehin gleich). Fallen ein Test oder eine Ausgabe anders aus → Stelle zurück, `# noqa: FURB162` **mit Begründung** im Kommentar und im Bericht nennen.

Gegenprobe Verhalten (einmal, im Bericht zitieren):

```bash
python3 -c "from datetime import datetime as d; a='2026-10-10T06:30:56.851Z'; print(d.fromisoformat(a)==d.fromisoformat(a.replace('Z','+00:00')))"
```

Erwartet: `True`.

## Schritt 5 · Grün belegen

```bash
make studio-lint; echo EXIT=$?          # 0
make studio-test >/dev/null 2>&1; echo EXIT=$?   # 0, Testzahl gleich wie in Schritt 1
```

## Schritt 6 · Commit

Ein Commit `refactor: Ruff 0.17.0 gepinnt, studio-lint-Altfehler behoben (UP017, FURB162)`, Trailer der Session. Danach T04 im selben Baum.

## Bericht (Teil des gemeinsamen Berichts T01+T04)

Vorher/nachher `ruff --statistics`, Testzahl vorher/nachher, Liste der FURB162-Stellen mit Urteil (geändert / `noqa` mit Grund), Exit-Codes.
