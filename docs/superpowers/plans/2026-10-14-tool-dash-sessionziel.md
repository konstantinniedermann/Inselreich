# Plan TOOL-DASH-SESSIONZIEL: «Jetzt in Arbeit» und «Ziel heute» im Dashboard

Owner `lead-tech` · Stufe leicht, Werkzeug-Paket (kein Save, kein Spielwert, keine Dependency, kein ADR) · Auftrag R648 · Branch `tool/dash-sessionziel`, Worktree `.worktrees/tool-dash-sessionziel`.
Phase A = dieser Plan. Phase B (Umsetzung) erst nach L0-Freigabe; bis dahin keine Testläufe (R464).

## Architektur

Logik in Python (unittest-testbar, JS hat in diesem Repo keine Testschiene), JS nur Darstellung.

- `tools/studio/releases.py`:
  - `goal_stage(item) -> int | None`: `goalStage` nur gültig als ganze Zahl 1..5 (kein bool, keine Strings/Kommazahlen), sonst `None`.
  - `normalize_goals(data) -> list[str]`: läuft über `all_items`, entfernt ungültige `goalStage` aus dem Item und liefert Warntexte (`«<pkg>: goalStage ungültig (<wert>) ignoriert»`); `load()` ruft es auf und legt `data["goal_warnings"]` an (leere Liste ok). Kein Crash bei Nicht-dict-Items.
  - `goal_progress(data, session_pkgs) -> {"total", "reached", "pkgs"}`: nur Items mit gültigem `goalStage` UND `inSession` (gleiche Regel wie `inSession` in releases.js: gleich oder Präfix `<pkg>-`, klein geschrieben); erreicht = `stage >= goalStage`.
  - `working_now(tree) -> list[dict]`: Pakete der gewählten Session mit mindestens einem Knoten im Status `active`/`delegated`/`waiting`/`blocked` (`model.LIVE`) und gesetztem `package`; je Paket `{"package", "owner" (Rolle des obersten Knotens mit diesem Paket, Tiefe zuerst), "agents": [{"role","status"}] (alle Live-Knoten des Pakets, ohne Duplikate, ohne Owner), "status"}`. Quelle ist derselbe `state["tree"]` wie bei `session_packages`.
- `tools/studio/server.py::add_releases`: `data["working_now"] = releases.working_now(tree)`, `data["goal_progress"] = ...`. Ist `data` None, steht «Jetzt» trotzdem in `state["working_now"]` (Kopfzeile funktioniert ohne releases.json).
- `tools/studio/dashboard/releases.js`: Kopfzeile `rv-now` über der Karte (je Paket Owner, Agenten-Chips, Status; leer: «Gerade arbeitet niemand»), Zähler «n von m Paketen am Tagesziel»; im `itemRow` hinter dem Ist-Balken eine gestrichelte Zielmarke `rv-goal` von `stage+1` bis `goalStage` mit Beschriftung «Ziel heute»; `stage >= goalStage` → Haken `✓ Ziel erreicht` statt Marke. Warnungen aus `goal_warnings` als kleine Zeile unter der Kopfzeile. Signatur für das Neuzeichnen enthält `working_now`. Filter «nur Pakete von heute (S)» unverändert. Nur `el`/`textContent`, kein `innerHTML`.
- Dashboard-CSS (Datei beim Umsetzen lokalisieren, vermutlich `index.html`): Präfix `rv-`, bestehende Farb-Tokens, desktop-first.
- `docs/studio/releases.json`: Pflegeregel um `goalStage` ergänzen (nur Doku-Satz in der vorhandenen Pflegeregel unter `docs/studio/`, Ort in T04 finden); L0 trägt die Werte pro Session ein.

## Task-Tabelle

| Task | Titel                                             | Datei                                                          | Strang | blocked-by | Modell | Tools |
| ---- | ------------------------------------------------- | -------------------------------------------------------------- | ------ | ---------- | ------ | ----- |
| T01  | Ziel-Logik und Validierung (Test zuerst rot)      | releases.py, test_releases.py                                  | A      |            | sonnet | ~25   |
| T02  | `working_now` und Server-Verdrahtung (Test rot)   | releases.py, server.py, test_releases.py, test_server.py       | A      | T01        | sonnet | ~30   |
| T03  | Darstellung: Kopfzeile, Zielmarke, Haken (JS+CSS) | releases.js, CSS                                               | A      | T02        | sonnet | ~30   |
| T04  | Pflegeregel `goalStage`, Browser-Check            | docs/studio (Pflegeregel), `.studio/qa/tool-dash-sessionziel/` | A      | T03        | sonnet | ~25   |

TDD: Je Python-Task zuerst den Test schreiben und **rot zeigen** (Ausgabe im Task-Bericht, Lücke aus R647). Ablauf je Task: Umsetzer (`tech-sim-engineer` für T01/T02 als Python-Arbeiter, `tech-ui-engineer` für T03) -> `qa-code-reviewer`. T04: `qa-playtester` Echtlauf auf freiem Port (`--port`), Screenshots; Pflegeregel macht der Controller selbst (Doku, D1-Dateien im Briefing erlaubt). Letzter Review über die ganze Branch auf `model: opus` = Final-Review. Gates: `make studio-test`, `make studio-lint`, Exit-Codes im Bericht.

## Testfälle (Auszug, Mindestumfang)

- T01: `goalStage` 3 ok; 0, 6, 2.5, "3", True, None, fehlend -> `None`/ignoriert, Warnung nur bei vorhandenem, aber ungültigem Wert; `load()` mit kaputtem Item liefert Daten + `goal_warnings`; `goal_progress` zählt nur Session-Pakete, erreicht bei `stage == goalStage` und `>`, Präfixregel `I-047` trifft `I-047-x`.
- T02: `working_now` mit Lead (active) + Kind-Arbeiter (delegated) + fremdem Paket + idle-Knoten + leerem `package` -> ein Eintrag je Paket, Owner = oberster Knoten; leerer Baum -> `[]`; `/api/state` enthält `working_now` auch ohne gültige releases.json.

## Datei-Ownership (ein Strang, seriell)

| Datei                                                                 | T01 | T02 | T03 | T04 |
| --------------------------------------------------------------------- | --- | --- | --- | --- |
| `tools/studio/releases.py`, `tools/studio/tests/test_releases.py`     | ja  | ja  |     |     |
| `tools/studio/server.py`, `tools/studio/tests/test_server.py`         |     | ja  |     |     |
| `tools/studio/dashboard/releases.js`, Dashboard-CSS                   |     |     | ja  |     |
| Pflegeregel unter `docs/studio/`, `.studio/qa/tool-dash-sessionziel/` |     |     |     | ja  |

## Budgetantrag (Phase B)

Pakete 4 × 2 (Umsetzer + Review) = 8, + 1 Playtest-Check, + 1 Final-Review (opus) = 10; Puffer 30 % = 13. Der Auftrag nennt 3 Starts; T01+T02 laufen in einem Python-Umsetzer (SendMessage-Fortsetzung zählt nicht), T03 ein UI-Umsetzer, Reviews T01+T02 gebündelt, Final-Review opus, Playtest: realistisch 5 bis 6 Starts. Antrag: 6 Starts, Parallelität 1 (seriell wegen gemeinsamer Dateien).

## Risiken

- Zielwerte stehen nur in `releases.json`, die L0 pflegt; ohne `goalStage` bleibt die Karte unverändert (rückwärtskompatibel).
- Paketzuordnung Tree-Knoten <-> Release-Item läuft über Namensregel (Präfix); Ausreisser zeigt die Kopfzeile trotzdem (sie hängt nur am Tree, nicht am Item).
