# T06 · Doku: ADR-014, arc42, README, Beobachtungen (D1, E-017)

Strang `py` · Worktree `.worktrees/buendel-py` · Branch `tool/buendel-py` · Umsetzer `tech-sim-engineer` (sonnet) · AK-TB17 · blocked-by: Reviews OK von T02, T03, T04, T05 (Namen und Verhalten stehen fest)

**Files (ausdrücklich erlaubt, E-017):**

- Create: `docs/adr/ADR-014-studio-riegel.md`
- Modify: `docs/arc42.md`, `README.md`, `docs/beobachtungen.md`
- Nicht ändern: `docs/studio/` (Handbuch, Vorlagen, Experimente gehören dem studio-coach; siehe Entscheid E3 im Index), `docs/adr/` bestehende ADRs

Kontext nur aus: dieser Datei, den Commits der drei Branches (`git log main..tool/buendel-py`, `main..tool/buendel-guard`, `main..tool/buendel-ts`; die anderen Branches nur lesen, nie auschecken), `docs/adr/ADR-011-asset-pipeline.md` als Formatvorlage.

## Schritt 1 · ADR-014 „Studio-Riegel ausserhalb des Verfassungs-Guards“

Abschnitte wie die bestehenden ADRs (Status, Kontext, Entscheidung, Alternativen, Konsequenzen). Inhalt:

- **Kontext:** R417 V2 (Formatfehler in Doku-Commits), R420 V1 (10 von 13 Lead-/Coach-Starts über der Modelltabelle, Retro `docs/studio/retros/2026-10-09-session-fb37ceac-ende.md` B1), ADR-001 (keine Laufzeit-Abhängigkeit), Verfassung §1.3 (`guard.py` geschützt).
- **Entscheidung 1 — Git-Hook:** Versionierter Ordner `tools/githooks/` und `git config core.hooksPath tools/githooks` (`make hooks`), relativer Pfad = Hook aus dem jeweiligen Worktree. Ein Prettier-Lauf über die gestagten Pfade (`tools/studio/precommit.py`), Ablehnung als Event `commit_rejected`. Grenzen: prüft den Arbeitsbaum (nicht den Index bei `git add -p`); `git commit --no-verify` umgeht ihn (Briefing-Regel, nicht technisch); CI prüft weiter mit `make lint`.
- **Entscheidung 2 — Modell-Guard:** eigener PreToolUse-Hook `tools/studio/modelguard.py` statt Erweiterung von `guard.py`: Die Modellregel ist Handbuch-Recht und muss vom Team änderbar bleiben; `guard.py` schützt Verfassungsrecht. Basis Persona-Frontmatter, Ausnahmen nur aus der Tabelle `STUDIO.md` § Modellwahl (keine zweite Liste), Kopfzeile `Modell: <alias> (<Einsatz>)`. Modus laut Gate-Ruling (`deny` oder `warn`, Konstante `MODE`).
- **Alternativen:** husky/lint-staged (neue Abhängigkeit, ADR-001 ✗); Prettier je Datei aus dem Index (`git show :pfad | prettier --stdin-filepath`; ein Prozess je Datei, zu langsam); Check nur in `make lint` (kommt zu spät); `guard.py` erweitern (Verfassungsweg, Arbeiter können die Datei nicht schreiben); Modellliste je Persona im Code (Doppelpflege); nur warnen (erreicht den Aufrufer nicht).
- **Konsequenzen:** `make hooks` einmal je Klon; die Testsuite pinnt das Tabellenformat (`test_modelguard.py`), eine Formatänderung der Tabelle macht `make studio-test` rot; abgelehnte Starts erscheinen als `spawn`-Event ohne Kind, wie bisher bei `guard.py`-Ablehnungen.

## Schritt 2 · arc42

`grep -n "Testsperre\|guard\|tools/studio" docs/arc42.md` — an den Stellen zu Entwicklung/Werkzeugen und Studio-Hooks je ein Satz:

- Git-Hook `pre-commit` (Prettier auf gestagten Dateien, `make hooks`, Ereignis `commit_rejected`).
- Modell-Guard als zusätzlicher PreToolUse-Hook (Ereignis `model_guard`, ADR-014).
- Testsperre: Hinweis auf verwaiste Vitest-Prozesse (PPID 1, ≥ 30 min), beendet nichts.
- Dashboard: Knoten ohne `agent_start` und ohne `spawned` melden keinen Inaktiv-Vorfall und sind nach 600 s ausgeblendet.
- Metriken: Zeile „Steuerungsanteil bereinigt“ (E-049).

Mermaid nur, wenn ein bestehendes Diagramm die Hooks zeigt; dann Knoten ergänzen, kein `\n` in Labels.

## Schritt 3 · README

Im Abschnitt „Entwicklung“ nach `make install`: `make hooks     # Git-Hook aktivieren: Prettier-Check der gestagten Dateien beim Commit` (Ausrichtung wie die Nachbarzeilen).

## Schritt 4 · Beobachtungen

`docs/beobachtungen.md` nach der Anleitung in der Datei selbst: Eintrag „Smoke-Etikett Save v9“ (`tools/render-qa/smoke.mjs:466`) und Paket-Kandidat „TOOL-STUDIO-HYGIENE (Erweiterung)“ als erledigt durch TOOL-BUENDEL austragen (Form wie andere erledigte Einträge). Neue Befunde aus T01–T05 (aus den Task-Berichten im Ledger `.superpowers/sdd/tool-buendel/ledger.md`) als neue Einträge.

## Schritt 5 · Prüfung und Commit

```bash
make docs-check; echo EXIT=$?
make conflicts; echo EXIT=$?
```

Beide Exit 0 (Prettier-Hook ab hier aktiv, falls `core.hooksPath` gesetzt ist; sonst `docs-check` genügt).

```bash
git add docs/adr/ADR-014-studio-riegel.md docs/arc42.md README.md docs/beobachtungen.md
git commit -m "docs: ADR-014 Studio-Riegel, arc42, README und Beobachtungen zum Werkzeug-Bündel"
```

DoD: AK-TB17; jede Aussage der Doku stimmt mit dem Code der drei Branches überein (das Final-Review T07 prüft es).
