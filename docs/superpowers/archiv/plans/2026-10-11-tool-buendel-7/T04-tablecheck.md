# T04 — `make docs-check` erkennt zerrissene Tabellen (AK-TB7-06)

**Dateien:** neu `tools/studio/tablecheck.py`, neu `tools/studio/tests/test_tablecheck.py`, `Makefile` (nur Absatz `docs-check`, Z. 38; `.PHONY` unverändert).

**Anlass:** Ein unmaskiertes `|` in einem Code-Span einer Tabellenzelle teilt die Zelle in GFM; Prettier meldet das nicht (Datei bleibt «formatiert»), die Tabelle ist zerrissen.

**AK-TB7-06:** `python3 tools/studio/tablecheck.py [Pfade…]` (Standard: alle `*.md` unter `docs/`, `README.md`, `.claude/`) liest Markdown, ignoriert Zeilen in Codeblöcken (```), erkennt Tabellen (Kopfzeile + Trennzeile `| --- |`) und meldet je Verstoss `Datei:Zeile: Grund`: (1) Datenzeile hat nach Aufteilung an unmaskierten `|` (nicht `\|`, ausserhalb und innerhalb von Code-Spans, Code-Span-Pipes zählen als Trenner wie in GFM) mehr Zellen als der Kopf; (2) Zelle endet mit offenem Backtick. Exit 0 ohne Verstoss, 1 sonst; wirft nie bei unlesbarer Datei (meldet Hinweis, Exit 0 für diese Datei). Tabellen zählen auch eingerückt (bis 3 Leerzeichen und in Listen) und zitiert (`> | a | b |`, Präfix `>` wird abgezogen). Offener Backtick: ungerade Zahl unmaskierter Backticks in der Zelle. `make docs-check` (B3): `npx prettier --check . ; a=$$?; python3 tools/studio/tablecheck.py ; b=$$?; exit $$((a>b?a:b))` (beide laufen, Gesamt-Exit = Maximum).

## Schritte

- [ ] **Rot (R395):** Tests mit Textfixtures im Test: gültige Tabelle → keine Meldung; `| a | \`x|y\` |`unter Kopf mit 2 Spalten → Meldung mit Zeilennummer; maskiertes`\\|`→ keine; Tabelle in Codeblock → keine; Zeile ausserhalb Tabelle mit`|`→ keine; kürzere Datenzeile (weniger Zellen) → keine Meldung (GFM füllt auf); eingerückte Tabelle (2 Leerzeichen, in Listenpunkt) mit zerrissener Zeile → Meldung; zitierte Tabelle `> |…` mit zerrissener Zeile → Meldung; Backtick-Regel: ungerade Backticks in Zelle → Meldung, gerade → keine.`python3 -m unittest tools.studio.tests.test_tablecheck; echo EXIT=$?`→`EXIT=1` (Modul fehlt).
- [ ] **Grün:** Modul in Stdlib (`re`, `pathlib`, `sys`), `main(argv) -> int`; Lauf grün.
- [ ] **Makefile:** `docs-check` wie oben, `make docs-check; echo EXIT=$?`.
- [ ] **Echtlauf (Pflicht):** `python3 tools/studio/tablecheck.py` über das echte Repo: Treffer im Bericht auflisten. Bestands-Treffer behebt T04 selbst (B3, R532): Maskierung `\|` in den gefundenen Dateien, auch in `docs/studio/retros/` und `docs/superpowers/plans/`, **als eigener `docs:`-Commit** vor dem Makefile-Commit. Erlaubt ist nur diese Formatierung (kein Inhalt, keine Ausnahmeliste); Treffer, die kein reines Maskieren sind, gehen in `docs/beobachtungen.md`. Danach muss `make docs-check` Exit 0 liefern.
- [ ] `ruff check tools/studio/tablecheck.py; echo EXIT=$?`.

**Commits:** (1) `docs: Tabellen-Pipes in Code-Spans maskiert (TOOL-BUENDEL-7)`, (2) `feat: docs-check erkennt zerrissene Markdown-Tabellen (TOOL-BUENDEL-7)`
