# TOOL-BUENDEL-15 (Werkzeug, Stufe leicht)

Ziel: R750 V1 (Last/Worker im Testereignis, Worker-Deckel), R744 (toter Code in guard.py), R753 (push-check-Hinweise).

Architektur (Kurz): Nur `tools/studio/` und Makefile bleiben unberührt, ausser dass `testrun.py` die Werte setzt (kein Makefile-Eingriff nötig).
Eigentümer: ein Umsetzer (`tech-sim-engineer`, sonnet), Reihenfolge T01 → T02 → T03, danach ein `qa-code-reviewer`.

| Task | Titel                         | Datei                   | Blocked-by | Modell |
| ---- | ----------------------------- | ----------------------- | ---------- | ------ |
| T01  | Last und Worker im Ereignis   | T01-last-worker.md      | -          | sonnet |
| T02  | guard.py toten Code entfernen | T02-guard-aufraeumen.md | -          | sonnet |
| T03  | Testausgabe ohne Fehlalarm    | T03-hinweise.md         | -          | sonnet |

Befund R753 (Ursache): Die Hinweise «Ereignis nicht geschrieben (voll)» und «Lastprotokoll fehlgeschlagen (voll)» sind kein echter Schreibfehler. Sie stammen aus absichtlichen Fehlertests in `tools/studio/tests/test_pushcheck.py` (`OSError("voll")`), deren stderr beim `studio-test`-Lauf im push-check-Log erscheint (Beleg: Sub-Agent-Protokoll des Integrators, Zeilen 709/759 des Logs). Das Produktionsverhalten stimmt: das Ereignis `push_check` wurde geschrieben.

Worker-Deckel: Vitest nutzt `max(1, CPU-1)` = 9 Worker auf 10 Kernen. Bei Last >= 8 setzt `testrun.py` `VITEST_MAX_WORKERS=4` für den Kindprozess (Alternative 2: 2 Worker, zu langsam für 4361 Tests; Alternative 6: halbiert die Last kaum).
