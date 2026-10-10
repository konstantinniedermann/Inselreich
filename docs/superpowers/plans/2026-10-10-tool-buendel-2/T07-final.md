# T07 · Final-Review über das Bündel

Rolle `qa-code-reviewer` · Modell **opus** (Briefing-Kopfzeile `Modell: opus (Final-Review über die Branch)`, Tabelle STUDIO.md Modellwahl) · alle AK-TB2-01…13 · blocked-by T06

**Gegenstand:** `tool/b2-py` gegen `main` (enthält nach T06 auch `tool/b2-ts`). Diff **je Datei** lesen (R420 V3): `git diff main...tool/b2-py --stat`, dann `git diff main...tool/b2-py -- <datei>`. Die Ruff-Fixes aus T01 (16 Dateien) nur stichprobenartig (3 Dateien) plus Punkt 5.

## Prüfpunkte

1. **AK-Abdeckung:** je AK-TB2-01…13 die belegende Testfunktion bzw. den Echtlauf aus dem Ledger `.superpowers/sdd/tool-buendel-2/ledger.md` nennen; fehlt ein Beleg → BEDENKEN. AK-TB2-07 und AK-TB2-12 haben begründete Ausnahmen (Kommentar ohne Test; Mutationsprobe statt Rot-Beleg).
2. **Sperrdateien:** `git diff main...tool/b2-py -- tools/studio/guard.py docs/studio/VERFASSUNG.md docs/studio/STUDIO.md docs/studio/templates .claude tools/studio/hook.py tools/studio/effort.py tools/studio/dashboard src` ist leer.
3. **E-049 (Review Focus 1, 2):** Zuordnung nur über `claim_budgets` (keine zweite Logik in `efficiency.py`, kein `import model` dort); Rohzeile, `THRESHOLDS`, `LIGHT_LABELS`, `CLASSES` unverändert; bereinigte Zeile ohne Ampel-Präfix; Gegenprobe roh = bereinigt + herausgerechnet und Doppelzählung im Test (`test_phase_and_budget_none_counted_once`, `test_parallel_leads_get_own_phase`).
4. **`--since` (Review Focus 3):** Grenze inklusiv, Prompt vor `since` bleibt lesbar, Kosten als Differenz, Kennung; `--since` mit `--milestone` abgelehnt; lesende Pfade bleiben beim Hauptrepo, nur der Ausgabeort folgt dem Worktree.
5. **Ruff (Review Focus 5):** `make studio-lint` Exit 0 selbst nachprüfen; Testanzahl vorher/nachher laut Bericht gleich; jede verbliebene `# noqa` hat eine Begründung; Makefile-Pin `uvx ruff@0.17.0`, kein neues Paket.
6. **zeitreserve (Review Focus 4):** `--push` ohne Prüfung der aktuellen Last; Exit 2 nur über `measurementProblem`; Modus ohne `--push` unverändert; Kopfkommentar stimmt mit `rule.ts` Z. 141 überein.
7. **Hooks werfen nie:** `pre-commit` ohne `python3` → Exit 0; `precommit.record` und `modelguard` lassen bei Fehlern zu; die gierige Klammer lässt einen falschen Einsatz nicht durch.
8. **Testschalter** (`STUDIO_HOME`, `STUDIO_DOCS`, `ZEITRESERVE_FAKE_*`, `TESTLOCK_PS_FIXTURE`) nur in Tests gesetzt und im Code als „nur für Tests“ markiert (R378).
9. **Doku (T06):** arc42, `experimente.md` (nur E-049, nur angehängt), `beobachtungen.md` (11 Vermerke, nichts gelöscht) und der Makefile-Hilfetext stimmen mit dem Code überein.
10. **Prüfläufe:** `make check` Exit 0 laut Bericht T06; selbst nur gezielt nachprüfen: `make studio-test`, `make studio-lint`, `npx vitest run tests/tools/zeitreserve.test.ts tests/tools/testlock.test.ts`, je `; echo EXIT=$?`, nie in eine Pipe.
11. **Konfliktprobe gegen aktuellen `main`:** `git merge-tree --write-tree main tool/b2-py; echo EXIT=$?` → 0.

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK**, Befunde mit Datei:Zeile, Schweregrad und Empfehlung; Befunde ausserhalb des Scopes als Vorschlag für `docs/beobachtungen.md`. Kein Report-Dateipfad: der Schlussbericht ist der Report. Keinen Code ändern.
