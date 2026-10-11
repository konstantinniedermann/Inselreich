# T04 — `make docs-check` erkennt zerrissene Tabellen (AK-TB7-06)

**Dateien:** neu `tools/studio/tablecheck.py`, neu `tools/studio/tests/test_tablecheck.py`, `Makefile` (nur Absatz `docs-check`, Z. 38; `.PHONY` unverändert).

**Anlass:** Ein unmaskiertes `|` in einem Code-Span einer Tabellenzelle teilt die Zelle in GFM; Prettier meldet das nicht (Datei bleibt «formatiert»), die Tabelle ist zerrissen.

**AK-TB7-06:** `python3 tools/studio/tablecheck.py [Pfade…]` (Standard: alle `*.md` unter `docs/`, `README.md`, `.claude/`) liest Markdown, ignoriert Zeilen in Codeblöcken (```), erkennt Tabellen (Kopfzeile + Trennzeile `| --- |`) und meldet je Verstoss `Datei:Zeile: Grund`: (1) Datenzeile hat nach Aufteilung an unmaskierten `|` (nicht `\|`, ausserhalb und innerhalb von Code-Spans, Code-Span-Pipes zählen als Trenner wie in GFM) mehr Zellen als der Kopf; (2) Zelle endet mit offenem Backtick. Exit 0 ohne Verstoss, 1 sonst; wirft nie bei unlesbarer Datei (meldet Hinweis, Exit 0 für diese Datei). `make docs-check` = `npx prettier --check .` danach `python3 tools/studio/tablecheck.py` (beide laufen, Gesamt-Exit = Maximum).

## Schritte

- [ ] **Rot (R395):** Tests mit Textfixtures im Test: gültige Tabelle → keine Meldung; `| a | \`x|y\` |`unter Kopf mit 2 Spalten → Meldung mit Zeilennummer; maskiertes`\\|`→ keine; Tabelle in Codeblock → keine; Zeile ausserhalb Tabelle mit`|`→ keine; kürzere Datenzeile (weniger Zellen) → keine Meldung (GFM füllt auf).`python3 -m unittest tools.studio.tests.test_tablecheck; echo EXIT=$?`→`EXIT=1` (Modul fehlt).
- [ ] **Grün:** Modul in Stdlib (`re`, `pathlib`, `sys`), `main(argv) -> int`; Lauf grün.
- [ ] **Makefile:** `docs-check` wie oben, `make docs-check; echo EXIT=$?`.
- [ ] **Echtlauf (Pflicht):** `python3 tools/studio/tablecheck.py` über das echte Repo: Treffer im Bericht auflisten. Echte Treffer in `docs/` **nicht** im Paket beheben, ausser Trivialfix (Maskierung `\|`, eigener Commit `docs:`); sonst in `docs/beobachtungen.md` melden. Ohne Behebung wäre `make docs-check` rot: Treffer vor dem Makefile-Commit klären (Befund an Controller, Lauf nie rot lassen).
- [ ] `ruff check tools/studio/tablecheck.py; echo EXIT=$?`.

**Commit:** `feat: docs-check erkennt zerrissene Markdown-Tabellen (TOOL-BUENDEL-7)`
