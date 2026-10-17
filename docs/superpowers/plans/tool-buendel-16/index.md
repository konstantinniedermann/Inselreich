# Plan TOOL-BUENDEL-16 (Werkzeug, Stufe leicht)

Ziel: R755 V1 (kein `inaktiv:` für studio-director/lead-qa bei lebenden Kindern oder langem Make-Lauf), R757 (Worker-Deckel greift vor der Testlock-Grenze), stdout-Rauschen in `test_aufraeumen`.
Architektur: reine Python-Änderungen in `tools/studio/`; kein Sim-, Save- oder Spielwert-Bezug.

Datei-Ownership (ein Umsetzer, ein Worktree `.worktrees/tool-b16`, Branch `tool/buendel-16`):

- T1: `tools/studio/model.py` (`view`), `tools/studio/tests/test_model.py` (ggf. `effort.py`, `hook.py`)
- T2: `tools/studio/testrun.py`, `tools/studio/tests/test_testrun.py`
- T3: `tools/studio/tests/test_aufraeumen.py`

| Task | Titel                           | Datei          | Strang | blocked-by | Modell |
| ---- | ------------------------------- | -------------- | ------ | ---------- | ------ |
| T1   | inaktiv-Ausnahme für L0/lead-qa | T1-inaktiv.md  | A      | -          | sonnet |
| T2   | Worker-Deckel ab Last 6         | T2-deckel.md   | A      | -          | sonnet |
| T3   | Rauschen test_aufraeumen        | T3-rauschen.md | A      | -          | sonnet |

Reihenfolge T2, T3, T1 (T1 ist der unsicherste). Budget: 3 Starts = 1 Umsetzer, 1 Reviewer (opus, gesamter Diff), 1 Reserve (Fix-Runde/frischer Delta-Review).
Prüfung: `make studio-test`, `make studio-lint`, `make docs-check`, je Testfall Rot-Beleg.
