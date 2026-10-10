# T06 · `efficiency.scan` nach `since`; `test_metrics` abgeschottet

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` A (sonnet, per SendMessage nach T05 fortgesetzt; mit T07 gebündelt, je eigener Commit, gemeinsames Review) · AK-TB3-05, 06 · Grundlage `docs/beobachtungen.md` „Ausgewertet 2026-10-10“ (Kandidaten `efficiency.scan` und `test_metrics.py`), TOOL-BUENDEL-2 T03/T07 · Grösse S (≈ 12 Tools) · Prüfregel V3

**Files:**

- Modify: `tools/studio/efficiency.py` (`scan` Z. ~193–225, `_collect_tools` Z. ~232–245; abschnittsweise lesen)
- Test: `tools/studio/tests/test_efficiency.py` (neue Fälle beim bestehenden `since`-Block; `grep -n "since" tools/studio/tests/test_efficiency.py`)
- Modify (nur Test): `tools/studio/tests/test_metrics.py` (`test_default_out_is_worktree`, Z. ~170–188). Stand nach HOTFIX-CI-01 (`e158a3a1`): die Datei patcht `metrics.datetime` mit einer springenden Uhr; das bleibt hier unverändert (T09 stellt es auf `clock` um).

## Teil A · Lesevorgang über die `since`-Grenze (AK-TB3-05)

**Ursache:** `scan` überspringt Einträge vor `since` vollständig (`if _before(entry, since): continue`), also auch das Merken der `tool_use`-Ziele in `pending`. Kommt das zugehörige `tool_result` erst ab `since`, findet `_collect_tools` kein Ziel und der Lesevorgang fehlt, obwohl sein Inhalt nach `since` in den Kontext kam.

**Regel:** Vor `since` werden nur `tool_use`-Ziele gemerkt (kein Lesevorgang, kein Aufruf); ab `since` zählt jedes `tool_result`, dessen `tool_use` bekannt ist. Umsetzung: `_collect_tools` teilen in `_remember_uses(content, pending)` und das Auswerten der Ergebnisse, oder ein Parameter `results: bool`; im `before`-Zweig nur das Merken aufrufen. Docstring von `scan` um den Satz ergänzen: „Ein Lesevorgang zählt, wenn sein Ergebnis ab `since` eintrifft.“

**Tests zuerst (rot):**

- `test_since_read_result_after_boundary_counts`: Transkript-Fixture (im Test als JSONL geschrieben, Muster der bestehenden `since`-Tests): Assistenten-Eintrag `tool_use` `Read` auf `docs/x.md` um 10:00, User-Eintrag `tool_result` mit 3000 Zeichen um 10:02, `since` = 10:01 → `reads == [{"path": "docs/x.md", "chars": 3000}]`. Rot vorher: `[]`.
- `test_since_read_before_boundary_is_skipped`: beide vor `since` → `[]` (grün vorher und nachher, Gegenprobe).
- `test_since_call_before_boundary_not_counted`: der `tool_use`-Eintrag mit `usage` vor `since` liefert keinen Aufruf (unverändert).

## Teil B · `repo_root` im Worktree-Test abschotten (AK-TB3-06)

**Ursache:** Der Test entfernt `STUDIO_DOCS`, damit der Standard-Ausgabeort greift. Danach liest `metrics.main` über `paths.docs_dir()` → `paths.repo_root()` die echte `docs/studio/STUDIO.md` und sucht Transkripte relativ zum echten Repo (`metrics.py` Z. ~408, 416, 437). Der Test hängt damit am echten Checkout.

**Regel:** Im Test `mock.patch.object(paths, "repo_root", lambda start=None: base)` mit `base = Path(self.tmp.name).resolve()` (Import `paths` im Test wie in `test_paths.py`). `worktree_docs_dir` nutzt `worktree_root` (aus dem `cwd`) und bleibt beim Worktree `wt`. Zusätzliche Assertion: Nach dem Lauf existiert `base / "docs" / "studio"` **nicht** als Schreibziel ausser unter `wt`, und `paths.docs_dir()` zeigt während des Laufs unter `base` (z. B. per kleinem Spion auf `studio_docs.read_version`, der den Pfad festhält und `startswith(str(base))` prüft).

**Rot-Beleg:** Die Spion-Assertion ist vor der Umlenkung rot (Pfad im echten Repo); im Bericht zitieren.

## Schritte

- [ ] Schritt 1: Tests Teil A und B schreiben, `make studio-test; echo EXIT=$?` → rot (genau die neuen Fälle).
- [ ] Schritt 2: Umsetzung Teil A (`efficiency.py`), Teil B ist nur Test.
- [ ] Schritt 3: Prüfen (V3):

```bash
make studio-test; echo EXIT=$?
make studio-lint; echo EXIT=$?
```

- [ ] Schritt 4: zwei Commits `fix: efficiency.scan zählt Lesevorgänge über die since-Grenze` und `test: test_metrics lenkt repo_root um`, je mit Session-Trailer.

## Abnahme (Reviewer)

- AK-TB3-05/06 mit Testnamen und Rot-Beleg; Rohzeile, `THRESHOLDS`, `LIGHT_LABELS` unverändert; Testanzahl `studio-test` gestiegen, nicht gesunken.
