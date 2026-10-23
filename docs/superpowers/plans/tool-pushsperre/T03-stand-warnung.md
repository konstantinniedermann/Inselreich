# T03 · Stand-Warnung schärfen (V3, Hook-Teil)

Strang A · Test-first (`make studio-test`: `tools/studio/tests/test_stampcheck.py`, `test_hook.py`).

**Ist:** `stampcheck.stale_warning(docs)` vergleicht die höchste «R…»-Nennung in `rulings.md` (jede Fundstelle) mit der höchsten in der `Stand:`-Zeile von `state.md`; Schwelle `> 5`; `hook.start_context` hängt den Text am Kontextende an (E-065). Beim Start von R841 lag die Differenz bei 8.

**Änderung:**

1. `latest` = höchste Nummer aus **Überschriften** `^## R(\d+)\b` in `rulings.md`, nicht aus dem Fliesstext (Verweise wie «R127» in «Regelbezug» zählen nicht). Fehlt jede Überschrift, Rückfall auf bisherige Regel.
2. Schwelle von `5` auf `2` senken (Messgrösse der Retro: Abstand beim Start ≤ 5, heute 8; die Warnung soll vorher feuern; `make check` ruft `stampcheck.py` ebenfalls, dort bleibt es eine Warnung ohne Fehler, Exit 0).
3. Text in `start_context` an den **Anfang** des Kontexts (vor `build_context`-Text, nach der Rollenzeile ist nicht nötig): `PFLICHT: state.md hinkt N Rulings hinterher (Stand R<a>, rulings.md R<b>). Erste Handlung: state.md nachführen lassen (Platzfüller, R818), bevor Aufträge starten.` `build_context` bleibt unverändert, die Warnung wird in `hook.start_context` vorangestellt; `LIMIT` des Kontexts unverändert (Warnung zählt nicht dagegen, 1 Zeile).

**Tests (rot zuerst):** Verweis «R999» im Fliesstext mit Überschrift bis R840 → `latest` 840; Differenz 2 → keine Warnung, 3 → Warnung; `hook.start_context` mit Warnung beginnt mit «PFLICHT:»; fehlende Dateien → leer (bestehender Test bleibt grün); bestehende Tests an die Schwelle anpassen, nicht löschen.
Hinweis: Eine 8er-Differenz hätte schon heute gewarnt; ob die Zeile übersehen wurde oder fehlte, lässt sich aus dem Session-Kontext der Vorsession nicht belegen (Beobachtung, kein Teil dieses Tasks).
