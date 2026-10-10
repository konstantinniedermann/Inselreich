# T06 · Doku, Beobachtungen, Zusammenführung (D1, E-017)

Strang `py` · Worktree `.worktrees/b2-py` · Branch `tool/b2-py` · Umsetzer `tech-sim-engineer` (sonnet) · AK-TB2-13 · blocked-by: Review OK T02+T03 und T05 · Kein eigener Task-Reviewer, das Final-Review T07 prüft T06 mit · Grösse S (≈ 20 Tools)

**Files (ausdrücklich erlaubt, E-017):**

- Modify: `docs/arc42.md` (Absatz Studio-Werkzeuge, um Z. 584–588), `docs/beobachtungen.md` (nur die Einträge der Tabelle unten), `docs/studio/experimente.md` (**nur** Abschnitt E-049; R433 V2 nennt die Datei als Teil des Pakets), `Makefile` (**nur** Hilfetext des Ziels `zeitreserve-push`, Z. 31)
- Nicht ändern: `docs/studio/STUDIO.md`, `docs/studio/templates/`, `docs/studio/rulings.md`, andere Experimente, `README.md` (keine Bedienung des Spiels betroffen), Code

Kontext nur aus: dieser Datei, `git log main..tool/b2-py` und `git log main..tool/b2-ts` (Commit-Texte), den Ledger-Einträgen T01–T05 in `.superpowers/sdd/tool-buendel-2/ledger.md`.

## Schritt 1 · Zusammenführung

```bash
git merge --no-ff tool/b2-ts -m "Merge branch 'tool/b2-ts' into tool/b2-py"; echo EXIT=$?
```

Konflikt ist nicht zu erwarten (getrennte Dateien). Tritt doch einer auf: `git merge --abort`, stopp, an den Controller (nicht selbst lösen).

## Schritt 2 · Makefile-Hilfetext

Ziel `zeitreserve-push`, nur der `##`-Text, sinngemäss: `Streng vor dem Push (R338): Messung mit Commit = HEAD und Last vor dem Lauf <= 4 (R394), sonst Exit 2 "nicht belastbar"; aktuelle Last zählt nicht (R438 V3); nach make test; mit Testsperre`. Rezept unverändert. Probe: `make help | grep zeitreserve-push; echo EXIT=$?` (hier ist die Pipe nur zum Ablesen; Exit separat ohne Pipe: `make help >/dev/null; echo EXIT=$?`).

## Schritt 3 · arc42

Den Absatz zu den Studio-Werkzeugen (`grep -n "Steuerungsanteil bereinigt" docs/arc42.md`) ergänzen, je ein Satz:

- Metriken: Die Zeile «Steuerungsanteil bereinigt» rechnet Lead-Instanzen mit Freigabephase `plan-`/`design-`/`gate-` (Zuordnung wie im Dashboard) oder „Budget: keins“ heraus und nennt den Anteil je Grund (E-049). `metrics.py --since <ISO>` verdichtet eine Studio-Session innerhalb eines Claude-Gesprächs (R434); ohne `--out` schreibt es in den Worktree, aus dem es läuft.
- `make zeitreserve-push` bewertet nur die Messung (Commit = HEAD, Last vor dem Lauf ≤ 4), nicht die aktuelle Last.
- `make studio-lint` nutzt eine gepinnte Ruff-Version (Makefile-Variable `RUFF`).

## Schritt 4 · experimente.md, E-049

Im Abschnitt E-049 eine Zeile **Anpassung umgesetzt** anhängen (nichts löschen): „Anpassung (R433 V2, TOOL-BUENDEL-2, `<Commit T02>`): herausgerechnet werden Lead-Instanzen mit Freigabephase `plan-*`/`design-*`/`gate-*` (Zuordnung `claim_budgets`) oder „Budget: keins“; die Zeile nennt den Anteil je Grund. Rohzeile und Klassen unverändert (Entscheid E1 im Plan); Messgrösse ‚Klasse Design/Spec/Plan > 0‘ gelesen als ‚herausgerechnet Plan > 0 bei Plan-Instanzen‘. Zählung der Datenpunkte beginnt mit der ersten Session nach dem Merge neu; Frist 2026-11-19 unverändert.“ Status-Kopfzeile des Abschnitts nicht ändern (gehört dem studio-coach).

## Schritt 5 · Beobachtungen

Je Eintrag eine Zeile `- **Erledigt (TOOL-BUENDEL-2, <Commit>):** …` bzw. `- **Bleibt (TOOL-BUENDEL-2):** …` an den bestehenden Eintrag anhängen (Format wie andere abgehakte Einträge der Datei, z. B. „Meeresfels“). Nichts löschen.

| Eintrag (Überschrift enthält)                            | Vermerk                                                                                                                                                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make studio-lint` auf main rot                          | Erledigt T01: Ruff 0.17.0 gepinnt, 28 Altfehler behoben.                                                                                                                                                              |
| Testschalter in `paths.py`                               | Erledigt T03.                                                                                                                                                                                                         |
| Probe-Event `commit_rejected`                            | Bleibt bis zum nächsten `make studio-archive`: Das Event-Log ist append-only, kein Eingriff; seit T04 erzeugt ein Event ohne Session keine Schein-Session.                                                            |
| Ampelzeile mit bereinigtem Steuerungsanteil              | Bleibt: Ampel erst nach Bewertung E-049 (sonst Vorfälle aus einer unbewerteten Messgrösse über `effort.py`). Trigger: E-049 übernommen.                                                                               |
| `metrics.py --session latest` schreibt ins Hauptcheckout | Erledigt T03 (`paths.worktree_docs_dir`).                                                                                                                                                                             |
| R429-Risiko `zeitreserve-push` … Last > 4                | Erledigt T05: `--push` bewertet nur `loadStart`; Handbuch-Schritt „warten, bis die Last ≤ 4“ streicht der studio-coach (Index E6).                                                                                    |
| Git-Hook blockiert den Commit ohne `python3`             | Erledigt T04.                                                                                                                                                                                                         |
| Schein-Session «manual»                                  | Erledigt T04 (`model.MANUAL_SESSION`).                                                                                                                                                                                |
| Testlücke bei `ps`-Fehler                                | Erledigt T05.                                                                                                                                                                                                         |
| Ampelzeile «Persona-Starts» zählt nur general-purpose    | Bleibt, an studio-coach: Definition in `verbesserung.md` (Ruling nötig); typisierte Starts über der Frontmatter sind mit Kopfzeile erlaubt. Vorschlag: Ampel aus `model_guard`-Events zählen. Trigger: nächste Retro. |
| haiku-Zeile der Modelltabelle                            | Erledigt T04 (Parser liest bis zur letzten Klammer).                                                                                                                                                                  |

## Schritt 6 · Prüfen und Commit

```bash
npx prettier --check docs/arc42.md docs/beobachtungen.md docs/studio/experimente.md; echo EXIT=$?
make docs-check; echo EXIT=$?
make check; echo EXIT=$?          # über die Testsperre; Exit 3 = später erneut
make studio-lint; echo EXIT=$?
```

Commit `docs: TOOL-BUENDEL-2 in arc42, E-049 und Beobachtungen nachgeführt`, Trailer der Session.

## Bericht

Merge-Commit, Doku-Commit, Exit-Codes, Liste der 11 Beobachtungs-Vermerke.
