# ADR-014: Studio-Riegel ausserhalb des Verfassungs-Guards — Git-Hook und Modell-Guard

Status: angenommen · Datum: 2026-10-09 · Paket: TOOL-BUENDEL · Rulings R417 (V2), R420 (V1), R428

## Kontext

Zwei Regeln des Studios wurden bisher nur im Briefing gesagt und deshalb verletzt:

- **Formatfehler in Doku-Commits (R417 V2):** Doku-Commits gingen ohne `make docs-check` durch; die CI meldete den
  Prettier-Fehler erst nach dem Push.
- **Starts über der Modelltabelle (R420 V1):** 10 von 13 Lead- und Coach-Starts liefen mit einem stärkeren Modell,
  als die Tabelle in `docs/studio/STUDIO.md` (Abschnitt «Modellwahl») erlaubt (Retro
  `docs/studio/retros/2026-10-09-session-fb37ceac-ende.md`, B1).

Rahmen: ADR-001 verbietet neue Laufzeit-Abhängigkeiten, und `tools/studio/guard.py` ist nach Verfassung §1.3
geschützt; Arbeiter können die Datei nicht ändern, und die Modellregel ist Handbuch-Recht, nicht Verfassungsrecht.

## Entscheidung

1. **Git-Hook `pre-commit`:** Der versionierte Ordner `tools/githooks/` enthält den Hook; `make hooks` setzt
   `git config core.hooksPath tools/githooks`. Der Pfad ist relativ und gilt damit im jeweiligen Worktree. Der Hook
   ruft `tools/studio/precommit.py` auf: ein einziger Prettier-Lauf über alle gestagten Pfade. Eine Ablehnung (jeder
   Prettier-Exit ungleich 0, auch Exit 2 bei einem Syntaxfehler — bewusst: ein Commit, den Prettier nicht parsen
   kann, soll nicht durch) bricht den Commit mit Exit 1 ab und schreibt das Ereignis `commit_rejected` nach
   `.studio/events.jsonl`. Fehlt Prettier, scheitert `git` oder lässt sich eine Ausgabe nicht dekodieren, lässt der
   Hook den Commit zu.
   **Grenzen:** Prettier liest den Arbeitsbaum, nicht den Index (Teilstaging mit `git add -p` wird nicht erfasst);
   `git commit --no-verify` umgeht den Hook (Regel im Briefing, nicht technisch erzwungen); die CI prüft weiter mit
   `make lint`.
2. **Modell-Guard:** ein eigener PreToolUse-Hook `tools/studio/modelguard.py` (Matcher `Agent|Task` in
   `.claude/settings.json`) statt einer Erweiterung von `guard.py`. Basis ist das Frontmatter der Persona; Ausnahmen
   gelten nur aus der Tabelle in `STUDIO.md` § Modellwahl (keine zweite Liste im Code). Ein stärkeres Modell
   braucht die Kopfzeile `Modell: <alias> (<Einsatz>)` mit einem Einsatz aus der Tabelle. Befunde erscheinen als
   Ereignis `model_guard` mit dem Feld `mode`. Startzustand ist `MODE = "warn"` (nur Ereignis); das Umschalten auf
   `deny` folgt im Paket TOOL-AKTIVIERUNG, nachdem die Kopfzeilen-Syntax in `briefing.md` und `STUDIO.md` steht.
   Ein unbekannter Alias wird zugelassen und als Ereignis protokolliert; jeder Fehler im Hook lässt zu.
   **Rückweg:** `MODE = "warn"` zurücksetzen (eine Konstante), bei Fehlalarmen sofort.

## Alternativen

- **husky/lint-staged:** neue Abhängigkeit, ADR-001 verbietet sie.
- **Prettier je Datei aus dem Index** (`git show :pfad | prettier --stdin-filepath`): ein Prozess je Datei, zu
  langsam.
- **Check nur in `make lint`:** kommt zu spät, erst nach dem Commit.
- **`guard.py` erweitern:** Verfassungsweg; die Modellregel müsste das Team ohne Verfassungsänderung anpassen können.
- **Modellliste je Persona im Code:** Doppelpflege neben der Tabelle in `STUDIO.md`.
- **Nur warnen ohne Ereignis:** erreicht den Aufrufer nicht und lässt sich nicht auswerten.

## Konsequenzen

- `make hooks` ist einmal je Klon nötig (Worktrees teilen die Git-Konfiguration).
- Die Testsuite pinnt das Tabellenformat (`tools/studio/tests/test_modelguard.py`); eine Formatänderung der Tabelle
  in `STUDIO.md` macht `make studio-test` rot und muss den Parser mitführen.
- Der Guard läuft im Modus `deny` (`MODE` in `tools/studio/modelguard.py`, aktiv seit TOOL-AKTIVIERUNG, R428; Startzustand
  war `warn`) und lehnt abweichende Starts ab. Abgelehnte Starts erscheinen als `spawn`-Ereignis ohne Kind, wie bisher
  bei Ablehnungen durch `guard.py`.
- Der Hook `pre-commit` ersetzt nicht die CI-Prüfung und nicht die Pflichtzeile `make docs-check` im Briefing.

## Nachtrag 2026-10-10 (TOOL-BUENDEL-3)

- **Entscheidung:** Die Budget-Warnung (E-055, R443) läuft im Modell-Guard-Prozess (`budgetwarn.py`, aufgerufen
  aus `modelguard.py`), nicht in `hook.py`. Grund: Der Guard läuft nur bei `Agent|Task`, es braucht keine neue
  Hook-Zeile, und `hook.py` läuft bei jedem Werkzeugaufruf.
- **Modus:** Warnung statt Ablehnung (Ereignis `budget_warn`, Kontext und Systemmeldung). Fehlwarnungen sollen
  gemessen werden, bevor daraus ein Riegel wird (E-055, Gegenprobe).
- **Rückfall:** `git revert` des Zweigs.
- **Verweise:** R443, `docs/superpowers/plans/2026-10-10-rel-16/index.md` E3.
