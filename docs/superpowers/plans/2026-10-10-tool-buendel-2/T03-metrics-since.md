# T03 · `metrics.py --since`, Ausgabe in den Worktree, Testschalter-Kommentare

Strang `py` · Worktree `.worktrees/b2-py` · Branch `tool/b2-py` · Umsetzer `tech-sim-engineer` (sonnet), **gebündelt mit T02** (nach T02, eigene Commits) · AK-TB2-05, 06, 07 · Grundlage R438 V4 a, Retro `docs/studio/retros/2026-10-10-release-rel14-prozess.md` V4, R434 (Studio-Session = Start- bis Ende-Routine), `docs/beobachtungen.md` („`metrics.py --session latest` schreibt ins Hauptcheckout“, „Testschalter in `paths.py` ohne Kommentar“), Index-Entscheid E3 · Grösse M (≈ 30 Tools)

**Files:**

- Modify: `tools/studio/metrics.py` (`main`, `build`, `summarize`, `render` Kopf, neue Helfer `_parse_since`, `_cost_delta`), `tools/studio/efficiency.py` (`scan`, `_compute`, `compute`: Parameter `since`), `tools/studio/paths.py` (neu `worktree_root`, `worktree_docs_dir`; Kommentare)
- Test: `tools/studio/tests/test_metrics.py`, `tools/studio/tests/test_efficiency.py` (Klasse `SinceTest`), `tools/studio/tests/test_paths.py`
- Nicht ändern: `usage.py` (Transkript-Kosten werden mit `--since` nicht genutzt, s. u.), `model.py` (Filter passiert vor `build_state`), `docs/studio/`

## Teil A · `--since <ISO>` (AK-TB2-05)

**CLI:** `--since` gilt mit `--session` und `--efficiency` (mit `--milestone` → argparse-Fehler, Exit 2). Wert: ISO 8601 mit Offset oder `Z` (`2026-10-10T06:30:00Z`); ohne Offset = Ortszeit (`.astimezone()`); ungültig → `parser.error(...)` (Exit 2). Helfer `_parse_since(text) -> datetime` (aware, UTC).

**Wirkung:**

1. **Events:** `events = [e for e in events if model.parse_ts(e.get("ts")) >= since.timestamp()]` **vor** `model.build_state` (Grenze inklusiv). Für die Kosten (Punkt 3) wird die ungefilterte Liste zusätzlich behalten.
2. **Transkripte:** `efficiency.scan(path, since=None)` überspringt Aufrufe (`_add_call`) und Lesevorgänge (`_collect_tools`) aus Einträgen mit `timestamp` < `since`; der **erste Prompt** wird immer gelesen (Rolle/Persona/Paket einer vor `since` gestarteten Instanz bleiben erkennbar). Einträge ohne Zeitstempel zählen mit. Instanzen ohne Aufrufe ab `since` entfallen (bestehende Regel `if not calls: return None`). `compute(mains, persona_models=None, phases=None, since=None)` reicht `since` an alle `scan`-Aufrufe.
3. **Kosten (E3):** Mit `--since` nutzt `_session_cost` **nicht** das Transkript-`cost-state` (kumulativ, ohne Zeit). Stattdessen: letzter `session_cost`-Stand der Session aus allen Events (`kind: usage`, Feld `session_cost`) minus letzter Stand mit `ts < since`; `_cost_delta(after, before)` zieht rekursiv Zahlen ab (Dicts feldweise, `None` bleibt `None`, fehlt `before` → `after`). Fehlt `after` → `None` („nicht erfasst“).
4. **Kennung:** mit `--since` `S-<Tag von since, Ortszeit>-<sid[:8]>` statt Tag des Session-Starts. `summarize(..., since=None)` legt `since` (ISO) im Rohwert ab; `render` nennt im Kopfblock eine Zeile `- Ab: <since ISO> (Studio-Session, R434)` nur, wenn gesetzt.
5. **`--efficiency --since`:** `compute(..., since=)`; `idle_gaps` über gefilterte Events; `actions.render(since=since)` statt `_session_start(events)`.

**Tests zuerst (rot):**

- `test_efficiency.py`, `SinceTest`: Transkript mit Aufrufen um 06:00 und 07:00 (Feld `timestamp` am Eintrag; Helfer `assistant` ggf. um `ts=` erweitern) → mit `since=06:30` nur der zweite Aufruf (`calls == 1`); `test_since_boundary_inclusive` (Aufruf genau auf `since` zählt); `test_prompt_before_since_keeps_role` (Persona-Zeile im Prompt vor `since`, Aufruf danach → Rolle aus dem Prompt).
- `test_metrics.py`: `test_since_filters_events_and_names_file` (Events vor/nach `since`; Datei heisst `S-<since-Tag>-<sid8>.md`, Kopf enthält `Ab:`); `test_since_cost_is_delta` (zwei `usage`-Events mit `session_cost` vor/nach `since` → Differenz); `test_since_invalid_exit_2` (`main(["--session","latest","--since","gestern"])` → `SystemExit` Code 2); `test_since_with_milestone_rejected`.

## Teil B · Ausgabe in den Worktree (AK-TB2-06)

Ursache: Ohne `--out` schreibt `main` nach `paths.docs_dir() / "metriken"`, und `docs_dir()` löst über `repo_root()` immer das **Hauptrepo** auf — auch aus einem Worktree.

**Regel:** `paths.worktree_root(start: Path | None = None) -> Path | None` = erster Ordner ab `start or Path.cwd()` aufwärts mit `.git` (Datei **oder** Ordner); `None`, wenn keiner. `paths.worktree_docs_dir()` = `STUDIO_DOCS`-Override, sonst `worktree_root() / "docs" / "studio"`, sonst `docs_dir()`. `metrics.main` nutzt für den Default-Ausgabeort `worktree_docs_dir() / "metriken"`. Lesende Pfade (`docs_dir()` für `STUDIO.md`, `studio_home()`, Transkripte) bleiben beim Hauptrepo.

**Tests zuerst (rot)**, `test_paths.py`:

- `test_worktree_root_with_git_file`: Temp-Ordner `wt/` mit **Datei** `.git` (`gitdir: …`), Unterordner `wt/a/b` → `worktree_root(wt/a/b) == wt` (nicht das Hauptrepo).
- `test_worktree_docs_dir_override_and_fallback`: mit `STUDIO_DOCS` → Override; ohne `.git` darüber → `docs_dir()`.
- `test_metrics.py`: `test_default_out_is_worktree` — `os.chdir` in einen Temp-Worktree mit `.git`-Datei, `STUDIO_DOCS` **nicht** gesetzt, `docs_dir`/Events über `STUDIO_HOME` und Fixture; Datei landet unter `<tmp>/docs/studio/metriken/`. `os.chdir` im `addCleanup` zurücksetzen.

## Teil C · Kommentare (AK-TB2-07)

In `paths.py` bei `STUDIO_HOME` und `STUDIO_DOCS` je `# nur für Tests (R378)`. Kein Test (reiner Kommentar); im Bericht als Ausnahme von Test-first nennen.

## Prüfbefehle

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -k Since -k since -k worktree; echo EXIT=$?   # erst rot, dann grün
make studio-test >/dev/null 2>&1; echo EXIT=$?
make studio-lint; echo EXIT=$?
python3 tools/studio/metrics.py --session latest --since 2026-10-10T06:30:00Z --out /tmp/b2-metrik; echo EXIT=$?
```

Echtlauf nur mit `--out` in ein Temp-Verzeichnis (nie in `docs/studio/metriken/` des Hauptrepos); im Bericht Dateiname und die Zeilen `Ab:` und „Steuerungsanteil“ zitieren. Danach einmal `make check` über die Testsperre (Exit 3 = später erneut).

## Commits

`feat: metrics.py --since für Studio-Sessions (R438 V4 a)`, `fix: metrics.py schreibt in den aufrufenden Worktree`, `docs: Testschalter in paths.py kommentiert`; Trailer der Session.

## Bericht (gemeinsam mit T02)

Je AK: Testnamen, rot-vorher-Beleg, Echtlauf-Zitate, Exit-Codes, `git diff --stat main...HEAD`.
