# T12 · Final-Review TOOL-BUENDEL-3 (`qa-code-reviewer`, opus)

Strang – · Branch `tool/b3-py` (enthält `tool/b3-qa` nach T10) · Prüfer `qa-code-reviewer` (Kopfzeile `Modell: opus (Final-Review)`) · AK-TB3-01…19 · blocked-by T10 (inkl. vollem `make check` durch Controller 2) · Grösse M (≈ 50 Tools) · ändert keinen Code

**Warum ein eigenes Final-Review nur für TOOL:** REL-16 (Strang `ui`) ist ein Ein-Paket-Release; sein `opus`-Review läuft im Release-Lauf von `lead-qa` über den Kandidaten (R444, R429, Index E2). TOOL-BUENDEL-3 geht über Gate Merge und braucht das Final-Review in diesem Budget (Präzedenz TOOL-BUENDEL-2 T07). Ein gemeinsames Review über beide Branches würde zwei Gates an einen Start binden und REL-16 auf die längere TOOL-Kette warten lassen.

**Kontext:** nur dieser Task, die Task-Dateien T05–T11 dieses Plans und die AK-Liste im Index (Abschnitt „AK-Liste“, Zeilen AK-TB3-…). Diff: `git diff main...tool/b3-py`. Grosse Dateien abschnittsweise lesen.

## Prüfschritte

- [ ] **1. Umfang:** `git diff --stat main...tool/b3-py` — nur Dateien aus der Ownership der Stränge `py` und `qa` (Index); kein `src/`, kein `tests/` ausser `tests/tools/`, kein `.claude/`, kein `guard.py`, keine `STUDIO.md`/`VERFASSUNG.md`.
- [ ] **2. Je AK** (TB3-01…19) Testname oder Nachweis aus den Task-Berichten nachvollziehen; Rot-Belege vorhanden (Ledger `.superpowers/sdd/tool-buendel-3/ledger.md`).
- [ ] **3. Hooks werfen nie:** `modelguard.py` mit kaputter Eingabe, ohne Event-Datei, mit `deny`-Fall und mit Budget-Warnung je einmal per Pipe aufrufen (`…; echo EXIT=$?`), stdout höchstens ein JSON-Objekt.
- [ ] **4. Wrapper:** `make studio-test` Exit und Testanzahl gegen T09-Bericht; `CI=true make studio-test` schreibt kein Event (`wc -l` der Event-Datei vor/nach im Temp-`STUDIO_HOME`).
- [ ] **5. Uhr:** `make studio-lint` Exit 0, Warnzahl gegen T09; `frozen(` nur in `clock.py` und Tests.
- [ ] **6. Doku (deckt T10 ab):** arc42 „Studio-Werkzeuge“, ADR-014 Nachtrag, E-055 stimmen mit dem Code; arc42-Diff nur im eigenen Abschnitt; `make docs-check` Exit 0.
- [ ] **7. Voller Lauf:** Ergebnis `make check` aus T10 Schritt 6 im Ledger (Exit 0, `uptime`); selbst nur nachholen, wenn er fehlt oder der Stand danach geändert wurde.
- [ ] **8. Grundsätze:** keine neue Abhängigkeit, Testschalter als „nur für Tests (R378)“ kommentiert, Commit-Präfixe der Konvention, KISS (Module ≤ 80 bzw. ≤ 50 Zeilen wie geplant, Abweichung begründet).

## Bericht

Urteil OK / BEDENKEN [Liste] / ZURÜCK [Grund] je Task T05–T11, Gesamturteil, Exit-Codes aller selbst gelaufenen Prüfungen (`…; echo EXIT=$?`), Befunde ausserhalb Scope getrennt. Bereit für Gate Merge TOOL-BUENDEL-3.
