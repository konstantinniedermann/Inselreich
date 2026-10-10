# T05 · Restpunkte R457 (1)(2)(3)(4)(6)(7)

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer A `tech-sim-engineer` (sonnet) · AK-TB4-09 … AK-TB4-12 · blocked-by T04 (Reihenfolge) · Grundlage Beobachtung «TOOL-BUENDEL-3 (R457): Restpunkte» · Grösse M (≈ 30 Tools), vier kleine Commits

**Files:**

- Modify: `tools/studio/hook.py` (nur `stamp`, Z. ≈ 235), `tools/studio/testrun.py`, `tools/studio/budgetwarn.py`, `tools/studio/modelguard.py`, `tools/studio/clock.py` (nur Kommentar)
- Test: `tests/test_hook.py`, `tests/test_testrun.py`, `tests/test_budgetwarn.py`, `tests/test_modelguard.py`, `tests/test_metrics.py` (nur `TickingClock`, Z. ≈ 278)
- Nicht ändern: `guard.py`; ADR-014 gehört T07.

Je Punkt: Test zuerst (rot, soweit es einen Verhaltensunterschied gibt), dann Fix, `make studio-lint` + `make studio-test` Exit 0, eigener Commit.

## (1) `hook.py` an der Uhr vorbei — AK-TB4-09

`stamp()` nutzt `time.strftime(…, time.gmtime())`. Auf `clock.now()` umstellen (`clock.now().strftime("%Y%m%d-%H%M%S")`; `clock` ist in `tools/studio` importierbar, Muster: `server.py`). Test zuerst: `with clock.frozen(datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)): assert hook.stamp() == "20260102-030405"` (rot, solange `gmtime` die echte Zeit liefert). Zusatz: `clock.py --check` meldet danach `time.gmtime` in `hook.py` nicht mehr; die Erkennung von `time.monotonic` als zulässig ist **keine** Aufgabe (nur Kommentar in `clock.py` «monotonic ist zulässig und wird von --check nicht gemeldet», falls die Prüfung sie schon ausnimmt; sonst Ausnahme in einer Zeile ergänzen und testen: `test_clock.py`).

## (2) `TickingClock` fragil — AK-TB4-10

In `test_metrics.py` zählt `TickingClock` Sekunden hoch und wirft ab dem 60. `now()`-Aufruf `ValueError`. Ersetzen durch `clock.frozen(callable)` mit `start + timedelta(seconds=n)` (kein Sekundenüberlauf). Test: der vorhandene HOTFIX-Test bleibt grün, zusätzlich ein Aufruf mit 100 `now()`-Aufrufen. Testanzahl unverändert + 1.

## (3) `testrun.py` bei Ctrl-C — AK-TB4-10

Bei `KeyboardInterrupt` (SIGINT) heute Traceback; Exit bei Signal ist `256 − N` statt `128 + N`. Test zuerst (`test_testrun.py`, vorhandene Stub-Befehle des Moduls nutzen): Kindprozess endet per Signal 2 → Rückgabecode 130 (`128 + 2`) statt 254; `main()` fängt `KeyboardInterrupt` und gibt 130 ohne Traceback zurück (Kind beenden, Ereignis wie bei Abbruch). Umsetzen: `returncode < 0` → `128 + (-returncode)` an der Stelle, die den Code weitergibt (Z. ≈ 108 `return proc.returncode, lines`).

## (4) `budgetwarn` importiert Privates — AK-TB4-11

`from modelguard import SKIP_TYPES, _header, _persona`. In `modelguard.py` die Namen **öffentlich** machen (`header`, `persona`; alle Verwendungen im Modul und in Tests anpassen, `grep -rn "_header\|_persona" tools/studio`), `budgetwarn.py` importiert `header`, `persona`. Verhalten unverändert; kein neuer Test nötig, vorhandene bleiben grün (Umbenennung, im Commit so benennen).

## (6) ADR-014 — nicht hier

ADR-014 «Konsequenzen» (veralteter Modus `warn`) ändert **T07** (Doku-Task). AK-TB4-11 gilt erst nach T07 als erfüllt.

## (7) `clock.py` 63 statt ≤ 50 Zeilen — AK-TB4-12

Die Plan-Grenze (≤ 50) widersprach der Spec (TOOL-BUENDEL-3). Keine Codeänderung; der Befund wird in T07 aus `beobachtungen.md` entfernt mit dem Vermerk «Grenze war Planfehler». Hier nur prüfen: `wc -l tools/studio/clock.py` im Bericht nennen.

## Zurückgestellt: (5) Flake-Matching

Siehe Index «Zurückgestellt». Nicht anfassen.

**Commits:** `fix: hook stamp über gemeinsame Uhr`, `test: TickingClock durch clock.frozen ersetzt`, `fix: testrun Exit 128+N und ruhiger Abbruch`, `refactor: modelguard header/persona öffentlich`.
