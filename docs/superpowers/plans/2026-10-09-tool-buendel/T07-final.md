# T07 · Final-Review über drei Branches

Rolle `qa-code-reviewer` · Modell **opus** (Briefing-Kopfzeile `Modell: opus (Final-Review)`, Tabelle STUDIO.md Modellwahl) · alle AK-TB01–TB17 · blocked-by T06

**Gegenstand:** `tool/buendel-py` (T01, T03, T05, T06), `tool/buendel-guard` (T02), `tool/buendel-ts` (T04), je gegen `main`. Diff **je Datei** lesen (R420 V3): `git diff main...<branch> --stat`, dann `git diff main...<branch> -- <datei>`.

## Prüfpunkte

1. **AK-Abdeckung:** je AK-TB01–TB17 die belegende Testfunktion bzw. den Echtlauf aus dem Task-Bericht (Ledger `.superpowers/sdd/tool-buendel/ledger.md`) nennen; fehlt ein Beleg → BEDENKEN.
2. **Verfassungsschutz:** `git diff main...tool/buendel-guard -- tools/studio/guard.py docs/studio/VERFASSUNG.md` leer; `.claude/settings.json` nur Zusätze, Guard-Einträge byte-gleich (AK-TB13).
3. **Fehlerrichtung der Hooks:** `precommit.py` und `modelguard.py` werfen nie; jeder unerwartete Fehler lässt zu; Ablehnung nur bei Prettier-Befund bzw. Modell über der Tabelle.
4. **Review Focus des Index** (fünf Punkte) je mit Testname bestätigt: teilweise gestagte Datei (dokumentierte Grenze), `-z`-Liste, Kopfzeile in Briefing-Form, bestätigter Knoten ohne `agent_start`, Waisen-Hinweis bei Abbruch.
5. **Keine Doppelpflege:** keine Modell- oder Einsatzliste im Code ausser dem Parser; die Tabelle in `STUDIO.md` ist unverändert.
6. **E-049:** Rohzeile, `THRESHOLDS`, `LIGHT_LABELS` unverändert; neue Zeile ohne Ampel-Präfix; Gegenprobe roh = bereinigt + herausgerechnet im Test.
7. **Testschalter** (`TESTLOCK_PS_FIXTURE`, `STUDIO_HOME`, `STUDIO_DOCS`) nur in Tests gesetzt und im Code als „nur für Tests“ markiert (R378).
8. **Doku (T06):** ADR-014, arc42, README und Beobachtungen stimmen mit dem Code überein; keine Änderung unter `docs/studio/`.
9. **Prüfläufe:** je Branch `make check` Exit 0 laut Task-Bericht; selbst nur gezielt nachprüfen (`make studio-test`, `npx vitest run tests/tools/testlock.test.ts tests/tools/renderqa.test.ts`), je `; echo EXIT=$?`, nie in eine Pipe.
10. **Konfliktprobe:** `git merge-tree --write-tree main tool/buendel-py tool/buendel-guard` bzw. paarweise für alle drei Branches, Exit 0.

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK** je Branch, Befunde mit Datei:Zeile, Schweregrad und Empfehlung; Befunde ausserhalb des Scopes als Vorschlag für `docs/beobachtungen.md`. Kein Report-Dateipfad: der Schlussbericht ist der Report. Kein Code ändern.
