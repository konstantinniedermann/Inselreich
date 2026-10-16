# Werkzeug-Bündel 7 (TOOL-BUENDEL-7) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Restpunkte aus `testrun`/`log`/`model` beheben, Präfix-Regel für Freigaben (R528 (3)), `make docs-check` erkennt zerrissene Markdown-Tabellen, Ampelzeile «Produktivanteil nach Phase» (R523 V3).

**Spec:** keine (Werkzeug-Paket). Grundlage: `docs/beobachtungen.md` Bündel TOOL-BUENDEL-7, R523 V3, R528.

Prozessstufe leicht (Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB in [`2026-10-11-tool-buendel-7/`](2026-10-11-tool-buendel-7/)) · Paket TOOL-BUENDEL-7 · Meilenstein ohne · Plan: `lead-tech`, sonnet (E-054, Werkzeug-Paket) · Umsetzung darf vor M13-Ende laufen (R505, R528).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`): nur Python-Stdlib, Bash, Git.
- Unverändert: `src/`, `docs/studio/` (inkl. `rulings.md`, R471), `.claude/`, `tools/studio/guard.py`. Ruling-Wortlaut nur als «Entwurf an L0» im Controller-Bericht.
- Messwerkzeuge und Hooks werfen nie; Hooks lassen bei eigenem Fehler zu (fail-open).
- **Test zuerst, Rot-Beleg (R395):** je neuem Test ein roter Lauf (`EXIT=1`) im Task-Bericht. Umsetzer fahren nur gezielte Dateien (`python3 -m unittest tools.studio.tests.test_<x>`, Aufruf wie `make studio-test` ihn zeigt); `make studio-test`, `studio-lint`, `docs-check`, `lint` nur der Controller (Testsperre, R380). Exit-Codes `…; echo EXIT=$?`, nie in eine Pipe.
- **Werkzeug-Paket-Pflicht:** `make studio-test` grün; Echtlauf gegen jede externe API (hier: `git`/Dateisystem echt in T01/T04, Ereignislager `events_file()` echt in T02, `python3 tools/studio/metrics.py` auf echten Logs in T03/T05; `gh`/CI/Pages werden nicht berührt, im Bericht vermerken), Ausgabe im Bericht.
- Steht ein Push an (R464), startet kein Testlauf; Controller fragt L0 vor dem ersten Lauf.
- Prüfschritte nicht zur Budgetersparnis streichen, Mehrbedarf melden (R392). Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push, main per Merge.

## Architektur (≤ 15 Zeilen)

- **T01:** `testrun.parse_names` liefert bei Sammelfehlern (vitest «FAIL file» ohne `>`-Teil, unittest `ImportError`-Blöcke) den Dateinamen statt einer leeren Liste; `_stop_group` blockt SIGINT/SIGTERM/SIGHUP ab dem ersten Moment mit `signal.pthread_sigmask` (Fallback `_ignore_interrupts`), schliesst das Fenster vor `_ignore_interrupts()`.
- **T02:** `log._package_exists` vergleicht die geparste ID statt Rohtext `"id"` (JSON-Escape `\uXXXX` bei nicht-ASCII).
- **T03:** `model.py`: `lead_phases` und `budget_key` rufen immer zuerst `claim_budgets()` (kein Zustand nur im `result`-Pfad, Z. 1214). Präfix-Regel (B2, R532): **eine** gemeinsame Funktion für die Freigabe-Namen (Paket-ID → Namen inkl. Präfixe bis `-`, exakt vor Präfix, längster zuerst) in `model.py`; `budgetwarn.package_names` (heute Kopie) und `model._grant_names` nutzen sie beide. `modelguard.py` ruft `budgetwarn.check` und bleibt unverändert.
- **T04:** neu `tools/studio/tablecheck.py` (unmaskiertes `|` in Code-Span, abweichende Spaltenzahl; auch eingerückte und zitierte `>`-Tabellen) + `make docs-check` ruft es nach Prettier, Exit = Maximum beider. Bestands-Treffer behebt T04 als eigener `docs:`-Commit (B3, R532).
- **T05:** `efficiency.py`: Lead-Instanzen mit Phase `plan-`/`design-` zählen in `produktiv` zur Klasse «Design/Spec/Plan»; `gate-` **nicht** (Gates sind Steuerung, B4). Mehrfachzählung gewollt: ein Plan-/Design-Lead steht in `steuerung` (Roh) und in `produktiv`; `produktiv` ≤ 1 bleibt Invariante (Test). Ampelzeile zeigt «davon Plan x % · Design y %». `steuerung`/`steuerung_bereinigt` unverändert.

## Datei-Ownership (ein Worktree, Parallelität 1 → Strang seriell)

Worktree `.worktrees/tool-b7`, Branch `tool/b7`. Berührt `src/` und `tests/` (TS) nicht: kein Konflikt mit den laufenden Strängen I-049-Sim und I-048-Sim (nur `src/`, `tests/`). Gemeinsame Datei einzig `Makefile` (T04, Absatz `docs-check`); Merge `git merge-tree --write-tree main tool/b7` vorher.

| Task | Titel                                 | Dateien (Eigentum)                                                                                                   | blocked-by          |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- |
| T01  | testrun: Sammelfehler, Ctrl-C-Fenster | `tools/studio/testrun.py`, `tools/studio/tests/test_testrun.py`                                                      | —                   |
| T02  | log: `_package_exists` nicht-ASCII    | `tools/studio/log.py`, `tools/studio/tests/test_log.py`                                                              | —                   |
| T03  | model: Reihenfolge, Präfix-Regel      | `tools/studio/model.py`, `tools/studio/tests/test_model.py`, `tools/studio/tests/test_budgetwarn.py` (nur falls rot) | —                   |
| T04  | docs-check: zerrissene Tabellen       | neu `tools/studio/tablecheck.py`, `tools/studio/tests/test_tablecheck.py`, `Makefile` (Absatz `docs-check`)          | —                   |
| T05  | Produktivanteil nach Phase            | `tools/studio/efficiency.py`, `tools/studio/tests/test_efficiency.py`                                                | T03 (`lead_phases`) |

Doku: `docs/arc42.md` (Abschnitt Werkzeuge/Budget-Hook, nur bei Änderung der Beschreibung) und `docs/studio/` bleiben unberührt (Handbuch-Folgen: `studio-coach` nach dem Merge). D1-Doku im Umsetzer-Briefing ausdrücklich erlauben (E-017): nur `docs/arc42.md`.

## Budgetantrag (Nachtrag R532)

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-7-umsetzung
Pakete: 1 Strang T01–T05 (ein Umsetzer, seriell)
Formel: 1 × 2 + 3 Task-Reviews + 1 Final-Review = 6 → × 1,3 → 8
Beantragt: 8 Starts, Parallelität 1 (R532 B1)
```

- Start 1: `tech-sim-engineer` (sonnet) T01–T05 (≈ 110 Tools; Briefing: «Werkzeug-Paket, `tools/studio/`, kein `src/`»)
- Starts 2–4: `qa-code-reviewer` (sonnet) Task-Reviews nach T01/T02, nach T03, nach T04/T05
- Start 5: `qa-code-reviewer` (opus) Final-Review über `tool/b7` (≈ 35)
- Starts 6–8: Puffer; Fix-Runden per SendMessage (zählen nicht)

Controller-Ein-Umsetzer-Regel (E-037): L0 briefet den Umsetzer direkt oder der Lead läuft auf sonnet.

## Entscheide (R532)

Präfix-Regel wie R528 (3) und T04 als Stdlib-Skript bestätigt; B1–B6 eingearbeitet (Index, T01–T05). Abgenommen ohne erneutes Review (Stichprobe L0).
