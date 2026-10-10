# Werkzeug-Bündel 5 (TOOL-BUENDEL-5) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Dashboard ohne veralteten Stand (`build_state` schnell), Budget-Phasen über die Kopfzeile `Paket:` statt nach Zeit, kein überschriebener Board-Titel, ehrliches `make studio`, robuster Testlauf-Abbruch.

**Spec:** keine (Werkzeug-Paket). Grundlage: R475, `docs/beobachtungen.md` (Abschnitte «TOOL-BUENDEL-4: `build_state` …», «`testrun` sendet nur SIGTERM …», «`start.sh` meldet …», «Board-Titel durch `log.py package` überschrieben», «TOOL-BUENDEL-3 (R457): Restpunkt Flake-Matching»), Handbuch 1.45 (Phasenpräfix, R471/R473).

Prozessstufe voll (Format) · Paket TOOL-BUENDEL-5 · Meilenstein TOOL · Planbasis `main` @ `9e714327` · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB in [`2026-10-10-tool-buendel-5/`](2026-10-10-tool-buendel-5/). Plan von `lead-tech` auf sonnet.

## Bewertung der Kandidaten (nach Nutzen)

| Rang | Kandidat                      | Nutzen                                                                                                                                                                        | Urteil                                                                                                                                 |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | (a) `build_state` schnell     | Dashboard bis 80 s veraltet; 2,7 s bei 67k Events, davon `claim_budgets` ≈ Hälfte (`sorted(nodes)` je Freigabe, `budget_view` ruft es je Abruf)                               | **T01**                                                                                                                                |
| 2    | (f) `lead_phases` nach Name   | Handbuch 1.45 verlangt `Paket:` = Phasen-ID; `budget_key` matcht schon nach Name, `claim_budgets` (speist `lead_phases`, Metriken, Effizienz) rein zeitlich → zwei Wahrheiten | **T02**, Antwort auf die Prüffrage: **ja, möglich** (`_package_token` + Präfix `plan-`/`design-`/`gate-` genügt), Zeit bleibt Rückfall |
| 3    | (e) Board-Titel               | Stiller Datenverlust, Handbuch-Befehle tragen immer `--title`                                                                                                                 | **T03** (klein, ändert nur `log.py`)                                                                                                   |
| 4    | (d) `start.sh` fremder Server | Falsche Meldung «läuft bereits»                                                                                                                                               | **T04** (mit Throttle-Rücknahme aus T01, gleiche Datei `server.py`)                                                                    |
| 5    | (b) `testrun` Eskalation      | Nur bei Kind, das SIGTERM ignoriert; selten, aber hängt die Testsperre                                                                                                        | **T05**                                                                                                                                |
| 6    | (c) Flake-Matching            | Teilweise gestrichen, s. u.                                                                                                                                                   | **T05** nur ungetrackte Dateien                                                                                                        |

**Gestrichen:** (c) Sammelfehler-Namen: Sammelfehler haben kein einheitliches Format (vitest, unittest, ruff), ein Parser ohne Fixture rät; Flake-Verdacht ist eine Heuristik mit geringer Wirkung (Ampel `flake` gelb ab 1). Rückfall «leere `names`» bleibt, wird in `docs/beobachtungen.md` mit dieser Begründung behalten. Ebenfalls nicht im Bündel: Worktree-`start.sh` ohne `STUDIO_HOME` (so gewollt, Beobachtung bleibt).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard` nie umgehen); nur Python-Standardbibliothek und Bash.
- `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `STUDIO.md`, `docs/studio/templates/`, `.claude/`, `src/` bleiben **unverändert**; Messwerkzeuge werfen nie, Hooks lassen im Zweifel zu.
- Jeder Task: Test zuerst rot (pytest/unittest unter `tools/studio/tests`), dann grün; `make studio-lint` Exit 0 (ganzer Ordner) vor jedem Commit, danach `make studio-test`.
- `model.py` (≈ 54 KB) und `test_model.py` (≈ 2400 Z.) nur abschnittsweise lesen.
- **Steht ein Push an (R464 V1), startet kein Testlauf.** Gesamtläufe (`make test`, `make check`) nur der Controller über die Testsperre; Umsetzer fahren nur gezielte Dateien. Exit-Codes `…; echo EXIT=$?`, nie in eine Pipe.
- Kein Task ändert `docs/studio/rulings.md` (R471); T06 liefert den Wortlaut als «Entwurf an L0».
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push.

## Review Focus

1. **Ergebnisgleichheit (T01):** `build_state` liefert vor/nach der Optimierung dasselbe JSON auf einer Fixture mit mehreren Leads, Freigaben und Kindern (`test_build_state_unchanged_by_optimization`). Ein Zeit-Assert wäre flaky; stattdessen Aufrufzähler (`claim_budgets` genau einmal je `build_state`).
2. **Name vor Zeit (T02):** `Paket: plan-X` bindet die Freigabe `plan-X` auch dann, wenn zeitlich eine andere Freigabe näher läge; `plan-X-b` trifft `plan-X` nicht; ohne Namenstreffer bleibt das heutige Zeitverhalten bit-gleich (alle bestehenden `test_model`-Budgettests unverändert grün).
3. **Titel (T03):** zweiter `package`-Aufruf mit anderem Titel ändert das Board nicht, `--retitle` schon; neues Paket ohne `--title` bleibt Fehler.
4. **Fremder Server (T04):** Ein Nicht-Studio-HTTP-Server am Port ergibt weder «läuft bereits» noch Absturz, sondern klare Meldung «Port belegt (kein Studio-Dashboard)», Exit 1.
5. **Eskalation (T05):** Kind, das SIGTERM ignoriert, ist nach der Frist tot (SIGKILL); Ctrl-C schreibt ein Ereignis mit `kind: test_aborted`.

## Architektur (≤ 15 Zeilen)

- **T01:** `claim_budgets` sortiert Knoten einmal vorab (nach Rolle gruppiert) statt je Freigabe; `budget_view` und `lead_phases` teilen ein Ergebnis je `_Builder` (Cache, ungültig sobald ein Start-/Budget-Ereignis kommt, oder einmal in `result()`). `build_state` sortiert die Events nur, wenn sie nicht schon aufsteigend sind (Lager ist append-only). Erst messen (cProfile-Lauf auf 67k-Events-Kopie, im Task-Bericht), dann ändern.
- **T02:** `claim_budgets` in zwei Durchgängen: (1) Freigabe, deren `phase` ∈ {Paket der Lead-Instanz, `_package_token(Paket)`} → diesem Lead (dieselbe Namensmenge wie `budget_key`, als gemeinsamer Helfer `_grant_names`); (2) der Rest wie heute nach Zeit. Keine Änderung der Kopfzeilenregeln.
- **T03:** `log.py package`: bei bestehender `package_id` im Ereignislager (zeilenweise, Vorfilter auf die ID, kein Voll-Parse) wird `title` nicht ins Ereignis geschrieben (Hinweis auf stderr), ausser `--retitle`. `model.on_package` setzt Titel nur bei vorhandenem Feld — bleibt unverändert.
- **T04:** `server.py` Route `/api/ping` → `{"studio": true}` (billig, Host-Prüfung bleibt); `start.sh`: `answers()` prüft `/api/ping`-Inhalt. Fremder Server → Meldung, kein Start. Drosselung (30-Fache, max. 90 s) auf Messwert aus T01 absenken (Ziel ≤ 5 s Verzug), Konstante mit Kommentar.
- **T05:** `testrun._run`: Eskalation `terminate()` → `wait(timeout=5)` → `kill()`; `KeyboardInterrupt` schreibt vor dem Weiterwerfen ein `test_aborted`-Ereignis (nicht `test_failed`, damit `flake_suspects` es ignoriert; Konsumenten von `kind` prüfen). `_diff_hash` bezieht ungetrackte Dateien ein: `git ls-files -o --exclude-standard -z`, Hash über Name + Grösse + `mtime_ns` (kein Inhalt lesen, billig).

## Datei-Ownership (ein Worktree `.worktrees/b5`, Branch `tool/b5`)

Zwei Umsetzer **nacheinander** (nie zwei gleichzeitig im Baum), beide `tech-sim-engineer` (Python/Bash), Fix-Runden per SendMessage.

| Umsetzer | Tasks    | Dateien                                                                                                                                                                                                      |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A        | T01, T02 | `tools/studio/model.py` (`build_state`, `_Builder.claim_budgets/budget_view/lead_phases`), `tools/studio/tests/test_model.py` (neue Klasse am Dateiende), neu `tools/studio/tests/fixtures/` nur falls nötig |
| A        | T04      | `tools/studio/server.py`, `tools/studio/start.sh`, `tests/test_server.py`, `tests/test_start.py`                                                                                                             |
| B        | T03      | `tools/studio/log.py`, `tests/test_log.py`                                                                                                                                                                   |
| B        | T05      | `tools/studio/testrun.py`, `tests/test_testrun.py`                                                                                                                                                           |
| B        | T06      | `docs/beobachtungen.md` (erledigte Abschnitte entfernen, Rest mit Begründung), `docs/arc42.md` nur falls ein Satz zu `start.sh`/Dashboard-Drosselung dort steht; Wortlaut-Entwurf im Bericht                 |

**Wahlweise parallel** (nur wenn kein Push läuft): A in `.worktrees/b5`, B in `.worktrees/b5b` (Branch `tool/b5b`); Dateien sind disjunkt (A: model/server/start, B: log/testrun/Doku). Vor dem Merge `b5b` in `tool/b5` einlesen (`git merge`, kein Rebase). Empfehlung: seriell, spart ≈ 8 min nicht den Merge-Aufwand wert, ausser Leerlauf-Deckel (R475) verlangt es.

Berührung mit anderen Strängen: keine `src/`-, `tests/`-(TS)-Dateien; Konfliktgefahr nur `docs/beobachtungen.md` (T06 zuletzt, `main` vorher einlesen).

## Budgetantrag (Formel Handbuch 1.39)

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-5-umsetzung
Pakete:
- TOOL-BUENDEL-5-A model/server/start: T01, T02, T04 (nein)
- TOOL-BUENDEL-5-B log/testrun/Doku: T03, T05, T06 (nein)
Formel: 2 × 2 + 0 QA-Checks + 1 Final-Review = 5 → × 1,3 = 6,5 → aufgerundet 7
Parallelität: 1 (wahlweise 2, siehe Ownership)
Beantragt: 7 Starts, Parallelität 1
```

| Start | Rolle               | Modell | Zweck                                                                   | Tools (Schätzung) |
| ----- | ------------------- | ------ | ----------------------------------------------------------------------- | ----------------- |
| 1     | `tech-sim-engineer` | sonnet | T01, T02, T04; je Task ein Commit                                       | 70                |
| 2     | `qa-code-reviewer`  | sonnet | Review T01+T02+T04                                                      | 14                |
| 3     | `tech-sim-engineer` | sonnet | T03, T05, T06                                                           | 50                |
| 4     | `qa-code-reviewer`  | sonnet | Review T03+T05+T06                                                      | 12                |
| 5     | `qa-code-reviewer`  | opus   | Final-Review über `tool/b5`                                             | 35                |
| 6–7   | Puffer              | –      | Fix-Runden gehen per SendMessage (zählen nicht); nur nach Meldung an L0 | –                 |

**Controller:** ein `lead-tech` (sonnet), höchstens 4 Tasks je Instanz (R167): Instanz 1 steuert A (T01, T02, T04), Instanz 2 steuert B (T03, T05, T06); Übergabe per Ledger `.superpowers/sdd/tool-buendel-5/ledger.md`. Kein UI → kein `qa-playtester`, kein Coach-Start (keine Handbuchzeile betroffen).

**Schätzung:** Arbeiter ≈ 181 Tools + 2 Controller ≈ 50 Tools = **≈ 230 Tools**; ÷ 4 ≈ **58 min** seriell (A 18 → Review 4 → B 13 → Review 3 → Final 9 + Übergaben); parallel ≈ 45 min.

## Task-Tabelle

| ID  | Titel                                                                           | Datei                                                              | AK-IDs                | Strang | blocked-by | Modell |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------- | ------ | ---------- | ------ |
| T01 | `build_state`: messen, `claim_budgets` einmal, kein Doppel-Sortieren            | [T01-build-state.md](2026-10-10-tool-buendel-5/T01-build-state.md) | AK-TB5-01, AK-TB5-02  | tool   | –          | sonnet |
| T02 | Phasenzuordnung über `Paket:` (Name vor Zeit)                                   | [T02-phasen-name.md](2026-10-10-tool-buendel-5/T02-phasen-name.md) | AK-TB5-03, AK-TB5-04  | tool   | T01        | sonnet |
| T03 | `log.py package`: Titel nur neu oder `--retitle`                                | [T03-board-titel.md](2026-10-10-tool-buendel-5/T03-board-titel.md) | AK-TB5-05, AK-TB5-06  | tool   | –          | sonnet |
| T04 | `/api/ping`, `start.sh` erkennt Fremdserver, Drosselung absenken                | [T04-ping-start.md](2026-10-10-tool-buendel-5/T04-ping-start.md)   | AK-TB5-07, AK-TB5-08  | tool   | T01        | sonnet |
| T05 | `testrun`: SIGKILL-Eskalation, `test_aborted`, ungetrackte Dateien im Diff-Hash | [T05-testrun.md](2026-10-10-tool-buendel-5/T05-testrun.md)         | AK-TB5-09 … AK-TB5-11 | tool   | –          | sonnet |
| T06 | Doku: `beobachtungen.md` bereinigen, Entwurf an L0                              | [T06-doku.md](2026-10-10-tool-buendel-5/T06-doku.md)               | AK-TB5-12             | tool   | T01–T05    | sonnet |

## Risiken

1. **Optimierung ändert Ergebnis** (Reihenfolge-Abhängigkeit von `claim_budgets`): Schutz durch Golden-Test vor dem Umbau (zuerst Test auf altem Code grün, dann Umbau).
2. **T02 verschiebt Zuordnungen** in alten Daten (Metriken/Effizienz rechnen mit `lead_phases`): Test über echte Fixture; Auswirkung auf archivierte `S-*.md` nur bei Neuberechnung; im Bericht beziffern.
3. **Eskalation SIGKILL** lässt Enkelprozesse (vitest-Worker) übrig: Prozessgruppe (`start_new_session` + `killpg`) prüfen, sonst nur Kind; Entscheid des Umsetzers im Bericht.
4. **`test_aborted` als neuer `kind`:** `efficiency`/`metrics`/`model` müssen unbekannte Arten ignorieren (Grep im Task).
5. Testläufe während eines Pushs verboten (R464); Merge-Zeitpunkt nach `zeitreserve-push` Exit 0.
