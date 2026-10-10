# T09 · Gemeinsame Uhr für die Studio-Werkzeuge, Lint-Warnung (R450 V2)

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` B (sonnet, per SendMessage nach T08 fortgesetzt) · AK-TB3-13…15 · Grundlage R450 V2, Retro `docs/studio/retros/2026-10-10-release-rel15-prozess.md` V2 (Z. ~100–108), HOTFIX-CI-01 (`e158a3a1`, Test patcht `metrics.datetime`) · Grösse M (≈ 30 Tools) · blocked-by T08 (Review OK) · Prüfregel V3

**Files:**

- Create: `tools/studio/clock.py`, `tools/studio/tests/test_clock.py`
- Modify: `Makefile` (Ziel `studio-lint`, Z. 54–55, eine Befehlsstufe anhängen; Hilfetext)
- Modify (Umstellung, Index E6): `tools/studio/paths.py` (`now_iso`, Z. 78–80), `metrics.py` (Z. ~409, 410, 478), `log.py` (Z. ~161, 244), `actions.py` (Z. 41), `limits.py` (Z. 64), `hook.py` (Z. ~313, 356), `server.py` (Z. ~109, 118) — die letzten vier nur, soweit Regel 4 unten erfüllt
- Modify (nur Test): `tools/studio/tests/test_metrics.py` (HOTFIX-Uhr auf `clock` umstellen), weitere Tests nur, wenn eine Umstellung sie sonst bricht
- **Nicht ändern:** `tools/studio/guard.py` (verfassungsgeschützt; hat keinen direkten Uhraufruf), `tools/studio/tests/**` ausser den genannten

## Bestandsaufnahme (Planung, `grep -n "datetime\.now(\|time\.time(" tools/studio/*.py`)

12 Stellen in 8 Dateien: `actions.py:41`, `log.py:161`, `log.py:244`, `limits.py:64`, `hook.py:313`, `hook.py:356`, `metrics.py:409`, `metrics.py:410`, `metrics.py:478`, `paths.py:79`, `server.py:109`, `server.py:118`. `actions.py`, `limits.py` und `hook.py:356` haben schon einen `now`-Parameter (nur der Standardwert ist direkt).

## Regel

1. **`clock.py`** (≤ 50 Zeilen, Docstring „eine Uhr für tools/studio, R450 V2“):
   - `now() -> datetime` — zeitzonenbewusst UTC; `timestamp() -> float` = `now().timestamp()`.
   - `frozen(at)` — Kontextmanager **nur für Tests (R378)**, `at` ist ein `datetime` oder eine Funktion ohne Argument, die ein `datetime` liefert (für die springende Uhr des HOTFIX-Tests); stellt beim Verlassen den vorherigen Zustand wieder her (verschachtelbar).
   - Lokale Zeit bleibt Sache des Aufrufers: `clock.now().astimezone()`.
2. **Prüfung** `python3 tools/studio/clock.py --check <ordner>`: durchsucht `<ordner>/*.py` (nicht rekursiv, also ohne `tests/`), ausser `clock.py`, nach `datetime.now(` und `time.time(` (Zeilen, die mit `#` beginnen, ausgenommen). Je Fund `Warnung: direkter Uhraufruf <datei>:<zeile>: <code>` auf `stdout`, am Ende `clock: <n> direkte Uhraufrufe (nur Warnung, R450 V2)`; **Exit immer 0** (AK-TB3-14). Die Prüffunktion ist rein (`scan(folder) -> list[tuple[str, int, str]]`) und getestet.
3. **Makefile:** `studio-lint` = `$(RUFF) check tools/studio && $(RUFF) format --check tools/studio && python3 tools/studio/clock.py --check tools/studio`. Hilfetext „… und Warnung bei direktem Uhraufruf (R450 V2)“.
4. **Umstellung „soweit billig“:** Pflicht `paths.now_iso`, `metrics.py` (3), `log.py` (2) (AK-TB3-15). Die übrigen Stellen nur, wenn **kein** bestehender Test dafür umgebaut werden muss: vorher je Modul `grep -n "time.time\|datetime" tools/studio/tests/test_<modul>.py` — patcht ein Test `time.time` oder `<modul>.datetime`, bleibt die Stelle stehen und erscheint als Warnung (im Bericht mit Grund nennen). Die `now`-Parameter in `actions`, `limits`, `hook.limits_notice` bleiben; nur der Standardwert wird `clock.now()` bzw. `clock.timestamp()`.
5. **HOTFIX-Test:** `test_metrics.py` patcht heute `metrics.datetime` mit einer Uhr, die je Aufruf eine Sekunde springt, und filtert die Zeitstempelzeilen. Nach der Umstellung von `metrics.py` wirkt dieser Patch nicht mehr → auf `clock.frozen(<springende Funktion>)` umstellen; die Filter der Zeilen `erzeugt` und `"created"` bleiben. Der Test muss danach weiterhin rot werden, wenn man den Filter entfernt (kurze Mutationsprobe, verwerfen, Ausgabe zitieren).

## Schritte

- [ ] **Schritt 1: Ausgang messen.** `python3 -c` mit derselben Suche oder `grep -c` → 12; `make studio-test` einmal, Testanzahl notieren.
- [ ] **Schritt 2: Tests zuerst (rot)** `test_clock.py`: `test_now_is_utc_aware`, `test_frozen_fixed_and_restored`, `test_frozen_callable_advances`, `test_frozen_nested`, `test_scan_finds_direct_calls` (Temp-Ordner mit `a.py` mit `datetime.now(UTC)` und `time.time()`, `clock.py` und `tests/b.py` mit denselben Aufrufen → nur die zwei Funde aus `a.py`), `test_check_exit_zero_with_findings` (Subprozess, Exit 0, Warnzeilen und Summe). `make studio-test; echo EXIT=$?` → rot.
- [ ] **Schritt 3: `clock.py`** und Makefile-Stufe; `make studio-lint; echo EXIT=$?` → 0 mit 12 Warnzeilen (Ausgabe zitieren).
- [ ] **Schritt 4: Umstellung** nach Regel 4, je Modul: Import `import clock` (Modulstil wie `paths`), Aufruf ersetzen, betroffene Tests laufen lassen (`python3 -m unittest tools.studio.tests.test_<modul>` bzw. über `make studio-test`). HOTFIX-Test nach Regel 5.
- [ ] **Schritt 5: Prüfen (V3)**

```bash
make studio-test; echo EXIT=$?     # Testanzahl ≥ Ausgang + neue Fälle
make studio-lint; echo EXIT=$?     # Exit 0; Warnungen jetzt <n>, Liste im Bericht
make lint; echo EXIT=$?
```

- [ ] **Schritt 6: Commits** `feat: gemeinsame Uhr clock.py und Lint-Warnung (R450 V2)` und `refactor: Studio-Werkzeuge lesen die Zeit über clock`, je mit Session-Trailer.

## Abnahme (Reviewer)

- AK-TB3-13…15 mit Testnamen und Rot-Beleg; Warnungen vorher 12, nachher n mit Begründung je verbliebener Stelle.
- Kein Verhaltenswechsel: gleiche Zeitzonen (UTC bzw. `astimezone()` wie vorher), gleiche Formate (`now_iso` endet weiter auf `Z` mit Millisekunden).
- `frozen` ist als „nur für Tests (R378)“ kommentiert und wird im Produktivcode nicht benutzt (`grep -n "frozen(" tools/studio/*.py` nur in `clock.py`).
