# Werkzeug-Bündel 2 (TOOL-BUENDEL-2) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle offenen Studio-Werkzeug-Punkte in einem Paket: E-049 nach Freigabephase (TOOL-E049-PHASE), `zeitreserve-push` nur nach `loadStart`, `metrics.py --since`, `studio-lint` grün mit gepinntem Ruff und die Werkzeug-Beobachtungen aus `docs/beobachtungen.md` (Liste R439).

**Architecture:** siehe Abschnitt «Architektur». **Tech Stack:** Python 3 (Standardbibliothek, unittest, Ruff über `uvx`), TypeScript/ESM für `tools/zeitreserve` und `tools/testlock` (Node mit Type-Stripping, Vitest), Shell für `tools/githooks/pre-commit`. Keine neue Abhängigkeit.

**Spec:** keine Spec-Datei (Werkzeug-Paket, R439). Grundlage: R433 V2 + Retro `docs/studio/retros/2026-10-09-session-c64c0775-ende.md` V2; R438 V3, V4 a + Retro `docs/studio/retros/2026-10-10-release-rel14-prozess.md` V3, V4; `docs/studio/experimente.md` E-049; `docs/beobachtungen.md` Einträge vom 2026-10-09/10 zu TOOL-BUENDEL, R429-Risiko, Retro c64c0775, TOOL-AKTIVIERUNG.

Prozessstufe voll (Format) · Paket TOOL-BUENDEL-2 · Meilenstein TOOL · Planbasis `main` @ `bef61fb`, Umsetzungsbasis aktueller `main` · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB im Ordner [`2026-10-10-tool-buendel-2/`](2026-10-10-tool-buendel-2/). Arbeiter und Task-Reviewer lesen nur ihre Task-Datei(en) und die genannten AK-IDs (Liste unten). Gebündelte Tasks (T01+T04, T02+T03) laufen im selben Umsetzer-Start mit je eigenem Commit und werden zusammen reviewt (Präzedenz R428).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard` nie umgehen). Der Ruff-Pin ist eine Werkzeug-Version des schon genutzten `uvx ruff`, kein neues Paket.
- `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `docs/studio/STUDIO.md`, `docs/studio/templates/`, `.claude/`, `src/`, `tools/studio/hook.py`, `tools/studio/effort.py`, `tools/studio/dashboard/` bleiben **unverändert**.
- Messwerkzeuge werfen nie (`efficiency.compute` → `None`, Hooks lassen zu); Rohzeile, `THRESHOLDS`, `LIGHT_LABELS` in `efficiency.py` unverändert.
- Testschalter (`STUDIO_HOME`, `STUDIO_DOCS`, `ZEITRESERVE_FAKE_*`, `TESTLOCK_PS_FIXTURE`) nur in Tests gesetzt und im Code als „nur für Tests“ kommentiert (R378).
- Ab T01: `make studio-lint` Exit 0 auf dem ganzen `tools/studio` (nicht nur eigene Dateien); TS/MD/JSON: `make lint` Exit 0.
- Grosse Dateien nur abschnittsweise lesen (`efficiency.py` 960 Z., `test_model.py` 2382 Z.; R420 V3).
- Exit-Codes immer `…; echo EXIT=$?`, nie in eine Pipe. `make check` nur über die Testsperre; Exit 3 = später erneut, `waiting` loggen.
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push; Trailer der Session.

## Review Focus

1. **Phasen-Zuordnung (T02):** Instanz-Schlüssel `<sid>:<agent_id>` aus dem Transkriptpfad trifft den Lead-Knoten im Modell; zwei parallele Leads derselben Rolle bekommen je ihre Freigabe. Test: `test_parallel_leads_get_own_phase`.
2. **Gegenprobe E-049:** roh = bereinigt + herausgerechnet exakt; eine Instanz mit Phase `plan-*` **und** `Budget: keins` zählt einmal. Test: `test_phase_and_budget_none_counted_once`.
3. **`--since` an der Grenze:** Aufruf mit Zeitstempel genau auf `since` zählt mit; Prompt einer vor `since` gestarteten Instanz bleibt lesbar (Rolle bleibt). Test: `test_since_boundary_inclusive`.
4. **zeitreserve `--push` bei hoher aktueller Last:** Verstoss gibt Exit 1 (nicht 2), passende Messung Exit 0. Test: `--push bei aktueller Last 9: harte Prüfung`.
5. **Ruff-Fix ohne Verhaltensänderung (T01):** `fromisoformat` ohne `.replace("Z", …)` liefert dieselben Zeitstempel; Testanzahl von `make studio-test` vor/nach gleich.

## Architektur (≤ 15 Zeilen)

- **E-049 nach Phase:** `model.build_state` gibt zusätzlich `lead_phases: {"<sid>:<agent_id>": phase}` aus — die Umkehrung der bestehenden Freigabe-Zuordnung `claim_budgets` (keine zweite Zuordnungslogik). `metrics.py` reicht sie an `efficiency.compute(…, phases=…)`; Lead-Instanzen mit Phase `plan-`, `design-`, `gate-` (Präfix, ohne Gross/klein) oder `Budget: keins` werden aus der bereinigten Zeile herausgerechnet, mit Aufschlüsselung je Grund. Rohzeile und Klassen bleiben (E1).
- **`--since`:** `metrics.py --session … --since <ISO>` und `--efficiency --since …` filtern Events (`ts ≥ since`), Transkript-Aufrufe und Lesevorgänge (`efficiency.scan(path, since)`), Session-Kosten als Differenz kumulativer Stände (E3).
- **Ausgabeort:** `paths.worktree_docs_dir()` = `docs/studio` des Worktrees, aus dem `metrics.py` läuft (`STUDIO_DOCS` übersteuert).
- **zeitreserve:** `check.ts --push` bewertet nur die Messung (`measurementProblem`: Commit = HEAD, `loadStart` ≤ 4, neues Format); die aktuelle 1-min-Last entscheidet nur noch ohne `--push`.
- **Kleinkram:** `model.MANUAL_SESSION` wie `CI_SESSION` ohne eigene Session; `pre-commit` prüft `python3` vor dem `exec`; `modelguard` liest die Kopfzeilen-Klammer bis zur letzten `)`.

## Datei-Ownership (zwei Stränge, je eigener Worktree und Branch)

| Strang | Branch / Worktree                | Tasks                           | Umsetzer            | Dateien                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | -------------------------------- | ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `py`   | `tool/b2-py`, `.worktrees/b2-py` | T01+T04, T02+T03, T06 (seriell) | `tech-sim-engineer` | T01: `Makefile` (nur Ziel `studio-lint`), die 16 von Ruff gemeldeten Dateien unter `tools/studio/`. T04: `tools/studio/model.py`, `tools/studio/precommit.py`, `tools/githooks/pre-commit`, `tools/studio/modelguard.py`, Tests `test_model.py`, `test_precommit.py`, `test_modelguard.py`. T02/T03: `tools/studio/efficiency.py`, `metrics.py`, `model.py`, `paths.py`, Tests `test_efficiency.py`, `test_metrics.py`, `test_paths.py`. T06: siehe T06 |
| `ts`   | `tool/b2-ts`, `.worktrees/b2-ts` | T05                             | `tech-ui-engineer`  | `tools/zeitreserve/check.ts`, `tests/tools/zeitreserve.test.ts`, `tests/tools/testlock.test.ts`                                                                                                                                                                                                                                                                                                                                                         |

**Vermerk R441 B3:** T06 hat abweichend von der Regel «je Task ein Review» kein eigenes Task-Review; das Final-Review T07 deckt T06 ausdrücklich ab. **Nacharbeit R441:** B1 (T02/T03), B2 (T04/T06), B4 (T04) in den Task-Dateien eingearbeitet; E7 abgelehnt, Start sofort.

**Parallelität:** `py` und `ts` teilen keine Datei → Welle 1: T01+T04 ‖ T05. Welle 2: T02+T03 (nach Review OK T01+T04, gleicher Baum). Welle 3: T06 (nach T02+T03 und T05 Review OK; holt `tool/b2-ts` per `git merge --no-ff` in `tool/b2-py`, damit der Integrator eine Branch merged). Höchstens **2 Arbeiter zugleich**. `Makefile` ändern nacheinander T01 (`studio-lint`) und T06 (Hilfetext `zeitreserve-push`), nie gleichzeitig.

## Budgetantrag (Formel Handbuch 1.39)

Pakete (Umsetzer-Starts) = 4 (T01+T04, T05, T02+T03, T06) → 4 × 2 + 0 QA-Checks + 1 Final-Review = **9**; + 30 % = 11,7 → **12 Starts**, Parallelität **2**. Kein UI → kein `qa-playtester`. Fix-Runden per SendMessage zählen nicht.

| Start | Rolle                                   | Modell | Zweck                                        | Tools (Schätzung) |
| ----- | --------------------------------------- | ------ | -------------------------------------------- | ----------------- |
| 1–2   | `tech-sim-engineer`, `tech-ui-engineer` | sonnet | T01+T04 ‖ T05 (Welle 1)                      | 35 + 20           |
| 3–4   | `qa-code-reviewer` ×2                   | sonnet | Reviews T01+T04, T05                         | 2 × 10            |
| 5     | `tech-sim-engineer`                     | sonnet | T02+T03 gebündelt                            | 60                |
| 6     | `qa-code-reviewer`                      | sonnet | Review T02+T03                               | 12                |
| 7     | `tech-sim-engineer`                     | sonnet | T06 Doku + Zusammenführung                   | 20                |
| 8     | `qa-code-reviewer`                      | opus   | T07 Final-Review über `tool/b2-py`           | 50                |
| 9–12  | Puffer                                  | –      | nur nach Meldung an L0 vor dem Überschreiten | –                 |

**Controller:** Instanz 1 (`lead-tech`, sonnet) führt Welle 1 und 2 (Starts 1–6) und übergibt per Ledger `.superpowers/sdd/tool-buendel-2/ledger.md` und einem Satz Status; Instanz 2 (`lead-tech`, sonnet, ohne eigene `log.py budget`-Zeile, R433 V3 b) führt T06 und T07 (Starts 7–8). **Schätzung gesamt:** Arbeiter ≈ 227 Tools + 2 Controller ≈ 70 Tools = **≈ 300 Tools ≈ 50 min** (Tools ÷ 6, R433); Wandzeit ≈ 45 min.

## Task-Tabelle

| ID  | Titel                                             | Datei                                                                  | AK-IDs        | Strang | blocked-by                     | Modell |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------- | ------------- | ------ | ------------------------------ | ------ |
| T00 | Worktrees anlegen (Controller)                    | dieser Index                                                           | –             | alle   | Gate Plan (E7 abgelehnt, R441) | sonnet |
| T01 | studio-lint grün, Ruff gepinnt                    | [T01-studio-lint.md](2026-10-10-tool-buendel-2/T01-studio-lint.md)     | AK-TB2-01     | py     | T00                            | sonnet |
| T02 | E-049 nach Freigabephase                          | [T02-e049-phase.md](2026-10-10-tool-buendel-2/T02-e049-phase.md)       | AK-TB2-02…04  | py     | T01+T04 (Review OK)            | sonnet |
| T03 | `metrics.py --since`, Ausgabe in den Worktree     | [T03-metrics-since.md](2026-10-10-tool-buendel-2/T03-metrics-since.md) | AK-TB2-05…07  | py     | mit T02 gebündelt (nach T02)   | sonnet |
| T04 | Hook-Kleinkram: manual, python3, Klammern         | [T04-hook-fixes.md](2026-10-10-tool-buendel-2/T04-hook-fixes.md)       | AK-TB2-08…10  | py     | mit T01 gebündelt (nach T01)   | sonnet |
| T05 | zeitreserve nur `loadStart`, testlock `ps`-Fehler | [T05-ts.md](2026-10-10-tool-buendel-2/T05-ts.md)                       | AK-TB2-11, 12 | ts     | T00                            | sonnet |
| T06 | Doku, Beobachtungen, Zusammenführung              | [T06-doku.md](2026-10-10-tool-buendel-2/T06-doku.md)                   | AK-TB2-13     | py     | T02+T03, T05 (Review OK)       | sonnet |
| T07 | Final-Review über das Bündel                      | [T07-final.md](2026-10-10-tool-buendel-2/T07-final.md)                 | alle          | –      | T06                            | opus   |

**T00 (Controller):** `git worktree list`, `git status` (R329), dann `git worktree add .worktrees/b2-py -b tool/b2-py main` und `git worktree add .worktrees/b2-ts -b tool/b2-ts main`. Kein `src/` → keine R392-Basismessung.

## AK-TB2-01…13 (Nummern zur Bestätigung im Gate)

| AK        | Inhalt                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-TB2-01 | `make studio-lint` Exit 0; Makefile ruft `uvx ruff@0.17.0`; `make studio-test` grün mit gleicher Testanzahl wie vorher.                                                                           |
| AK-TB2-02 | Lead-Instanz mit zugeordneter Freigabephase `plan-*`, `design-*`, `gate-*` wird herausgerechnet; ohne Zuordnung zählt sie zur Steuerung; Zuordnung = `claim_budgets` (`lead_phases`).             |
| AK-TB2-03 | Zeile „Steuerungsanteil bereinigt“ nennt herausgerechnet je Grund (Plan, Design, Gate, nur „Budget: keins“); roh = bereinigt + herausgerechnet; Rohzeile, Klassen, Schwellen, Labels unverändert. |
| AK-TB2-04 | `lead_stats.rows` und die Lead-Tabelle zeigen die Phase je Instanz (leer ohne Zuordnung).                                                                                                         |
| AK-TB2-05 | `--since <ISO>` (mit `--session` und `--efficiency`): Events, Aufrufe, Lesevorgänge, Kosten nur ab `since`; Kennung nach Tag von `since`; Kopf nennt `since`; ungültiger Wert → Exit 2.           |
| AK-TB2-06 | Ohne `--out` schreibt `metrics.py` nach `docs/studio/metriken` des Worktrees, aus dem es läuft; `STUDIO_DOCS` übersteuert; ausserhalb eines Repos wie bisher.                                     |
| AK-TB2-07 | `STUDIO_HOME` und `STUDIO_DOCS` in `paths.py` als „nur für Tests (R378)“ kommentiert.                                                                                                             |
| AK-TB2-08 | Abgelehnter Commit ohne `CLAUDE_CODE_SESSION_ID`: Event bleibt, erzeugt keine Session im Modell (`sessions`, `latest`).                                                                           |
| AK-TB2-09 | `tools/githooks/pre-commit` ohne `python3` im PATH: Exit 0 mit Hinweis auf stderr.                                                                                                                |
| AK-TB2-10 | Modell-Guard erkennt einen Einsatz mit eigenen Klammern in der Kopfzeile (`Modell: haiku (mechanische Prüfungen (…))`-Form).                                                                      |
| AK-TB2-11 | `check.ts --push`: aktuelle Last zählt nicht; Exit 2 nur bei Commit ≠ HEAD, `loadStart` > 4 oder altem Format; Kopfkommentar Z. 2–3 korrekt; ohne `--push` unverändert.                           |
| AK-TB2-12 | Testsperre mit `ps`-Fehler (Fixture fehlt): Befehl läuft, Exit durchgereicht, kein Waisen-Hinweis, kein Absturz.                                                                                  |
| AK-TB2-13 | E-049 in `experimente.md` angepasst, 11 Beobachtungs-Einträge erledigt bzw. begründet offen, Makefile-Hilfe `zeitreserve-push`, arc42 nachgeführt.                                                |

## Beobachtungen Z. 218–270: Zuordnung

| Punkt                                     | Ergebnis                | Ort      |
| ----------------------------------------- | ----------------------- | -------- |
| studio-lint rot (28 Altfehler)            | Fix                     | T01      |
| `paths.py` Testschalter ohne Kommentar    | Fix                     | T03      |
| Probe-Event `commit_rejected`             | bleibt bis Archiv (E5)  | T06      |
| Ampelzeile bereinigt im Dashboard         | bleibt Beobachtung (E5) | T06      |
| `metrics.py --session latest` im Worktree | Fix                     | T03      |
| Hook ohne `python3`                       | Fix                     | T04      |
| Schein-Session «manual»                   | Fix                     | T04      |
| Testlücke `ps`-Fehler                     | Fix (Test)              | T05      |
| Ampelzeile Persona-Starts typisiert       | bleibt Beobachtung (E5) | T06      |
| haiku-Zeile der Modelltabelle             | Fix (Parser)            | T04      |
| R429-Risiko `zeitreserve-push` Last > 4   | erledigt durch T05      | T05, T06 |

## Entscheide fürs Gate

- **E1 Rohzeile bleibt:** Phasen-Instanzen werden nur in der bereinigten Zeile herausgerechnet, nicht in die Klasse „Design/Spec/Plan“ umgehängt (Retro V2 nennt beides; Umhängen würde die Rohzeile und die Historie verschieben, E-049 „Messbarkeit“). Messgrösse „Klasse Design/Spec/Plan > 0“ wird zu „herausgerechnet Plan > 0 bei Plan-Instanzen“. Empfehlung: annehmen.
- **E2 Zuordnung über `claim_budgets`:** keine zweite Logik in `efficiency.py`; `--efficiency` baut dafür den Modellzustand (≈ +1 s). Grenze: Freigabe ohne Lead-Start in derselben Session oder vor `--since` → Instanz zählt zur Steuerung (konservativ). Empfehlung: annehmen.
- **E3 `--since`-Kosten:** Session-Kosten = letzter kumulativer Stand − letzter Stand vor `since` (Events `session_cost`); Transkript-`cost-state` ohne Zeit wird mit `--since` nicht genutzt. Kennung `S-<Tag von since>-<sid8>`. Alternative: Kosten mit `--since` „nicht erfasst“ (≈ 5 Tools billiger, verliert die Zahl). Empfehlung: Differenz.
- **E4 Ruff `0.17.0` pinnen und die 28 Befunde beheben** (22 automatisch, 6 FURB162 von Hand) statt einer älteren Version ohne diese Regeln. Voraussetzung Python ≥ 3.11 (`datetime.UTC`, `fromisoformat("…Z")`); CI ubuntu-24.04 hat 3.12, lokal 3.14. Aufwand ≈ 15 Tools Umsetzer. Empfehlung: annehmen.
- **E5 Bleibt Beobachtung:** (a) Ampelzeile „bereinigt“ im Dashboard erst nach Bewertung E-049 (sonst Vorfälle aus einer unbewerteten Messgrösse, `effort.py`); (b) Persona-Starts typisiert: Definition steht in `verbesserung.md` (studio-coach, Ruling), und typisierte Starts über der Frontmatter sind mit Kopfzeile erlaubt — Vorschlag an den Coach: Ampel aus `model_guard`-Events zählen; (c) Probe-Event: append-only-Log, erledigt beim nächsten `make studio-archive`. Empfehlung: annehmen.
- **E6 Handbuch:** STUDIO.md Z. 367 „warten, bis die Last ≤ 4“ und das Integrator-Briefing streicht der studio-coach nach dem Merge (STUDIO.md hier gesperrt). Empfehlung: Auftrag an studio-coach mit dem Merge.
- **E7 gestrichen (R441):** abgelehnt, Umsetzung startet sofort.
