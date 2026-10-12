# Werkzeug-Bündel 9 (TOOL-BUENDEL-9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Die vertagten Werkzeug-Aufgaben aus R565 (P2, P5, V3) und R570 umsetzen: Timeout `terrain.test.ts`, Ampel-Umstellung (Session-Minuten, bereinigte Steuerungszeile), Flake-Zeile nur im gewählten Zeitraum, Entscheid zur Sieg-Tick-Grenze, Handbuch-Abschnitt «Live-Ampel».

**Spec:** keine (Werkzeug-Paket). Grundlage: R565 (P2, P5, V3), R570, `docs/beobachtungen.md` (Last-Flake `terrain.test.ts`; Gate-Ensemble Sieg-Tick-Grenze), Retro `docs/studio/retros/2026-10-12-m13.md`.

Prozessstufe leicht · Paket TOOL-BUENDEL-9 · Meilenstein M14 · Plan: `lead-tech`, sonnet (E-054, Werkzeug-Paket) · Umsetzung im Worktree `.worktrees/tool-b9`, Branch `tool/b9` (legt L0/Controller an, nicht der Plan). Gemeinsames Gate Spec + Plan (kombiniert).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`): Python-Stdlib, Bash, Git, vorhandenes Vitest.
- Erlaubt: `tools/studio/`, `tools/studio/tests/`, `tests/render/terrain.test.ts` (nur T01), `tests/sim/controller.ts` und `tests/sim/ensemble.test.ts` (nur T04, nach L0-Entscheid), `docs/studio/STUDIO.md` (nur T05, Abschnitt Live-Ampel; Handbuch-Minor-Regel beachten), `docs/beobachtungen.md`. Unverändert: `src/`, `vite.config.ts`, `.claude/`, `tools/studio/guard.py`. Ruling-Wortlaut nur als «Entwurf an L0» im Bericht.
- Messwerkzeuge und Hooks werfen nie; Hooks lassen bei eigenem Fehler zu (fail-open).
- **Test zuerst, Rot-Beleg (R395):** je neuem Test ein roter Lauf (`EXIT=1`) im Bericht. Umsetzer fahren nur gezielte Dateien (`python3 -m unittest tools.studio.tests.test_<x>; echo EXIT=$?`, `npx vitest run <Datei>; echo EXIT=$?`); `make studio-test`, `studio-lint`, `docs-check`, `lint`, `check` nur der Controller (Testsperre R380). Exit-Codes nie in eine Pipe.
- **Keine Lockerung** der Ampel-Schwellen ausser der von R565 P5 angeordneten Session-Minuten-Grenze (gelb > 10); **keine künstliche Last** (R539). Steht ein Push an (R464), startet kein Testlauf.
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`; kein Rebase, kein Force-Push.

## Überschneidung mit M14-E1 (geprüft)

`git diff --name-only main...HEAD` in `.worktrees/m14-e1`: berührt `src/`, `README.md`, `docs/arc42.md`, Specs und `tests/{sim,ui,render}/…`, aber **nicht** `tests/render/terrain.test.ts`, `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts`, `tools/`, `docs/studio/` (einzige Nähe: `tests/sim/islandTraits-controller.test.ts`, andere Datei). **Keine Dateiüberschneidung: T01–T03, T05 können parallel zu M14-E1 laufen und vor dessen Merge gemergt werden.** T04 (Grenzwert) setzt voraus, dass `ensemble.test.ts` auf M14-E1 nicht angefasst wird (ist so); lockert die Grenze nur, kann M14-E1 nichts brechen. Einzige Reihenfolge-Empfehlung: T04 nach dem Merge M14-E1, damit der Ensemble-Lauf auf dem endgültigen Stand die neue Grenze bestätigt (Messung R570: identisch zur Basis, daher kein harter Block).

## Tasks

| Task | Titel                                                             | Dateien (Eigentum)                                                                                                                                   | AK        | blocked-by                        | Schätzung |
| ---- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------- | --------- |
| T01  | Timeout `terrain.test.ts` anheben (R565 P2)                       | `tests/render/terrain.test.ts`                                                                                                                       | AK-TB9-01 | —                                 | ≈ 15      |
| T02  | Ampel: Session-Minuten gelb > 10, `steuerung` bereinigt (R565 P5) | `tools/studio/actions.py`, `tools/studio/efficiency.py`, `tools/studio/tests/test_actions.py`, `tools/studio/tests/test_efficiency.py`               | AK-TB9-02 | —                                 | ≈ 40      |
| T03  | Flake-Zeile nur im Zeitraum (R565 V3)                             | `tools/studio/efficiency.py` (`flake_suspects`), `tools/studio/metrics.py`, `tools/studio/testrun.py`, Tests `test_efficiency.py`, `test_testrun.py` | AK-TB9-03 | T02 (gleiche Datei)               | ≈ 40      |
| T04  | Sieg-Tick-Grenze im Ensemble (R570), nach L0-Entscheid            | `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts`, `docs/beobachtungen.md`                                                                     | AK-TB9-04 | L0-Gate, M14-E1-Merge (empfohlen) | ≈ 15      |
| T05  | Doku: Abschnitt «Live-Ampel» im Handbuch, Stand-Sätze nachführen  | `docs/studio/STUDIO.md`, `docs/beobachtungen.md`                                                                                                     | AK-TB9-05 | T02                               | ≈ 10      |

Summe ≈ 120 Tools Umsetzung, ein Umsetzer, seriell (T02 und T03 teilen `efficiency.py`). Ownership: ein Worktree, kein anderer Strang berührt diese Dateien.

## T01 — Timeout in `terrain.test.ts` (AK-TB9-01, R565 P2)

**Bedingung (Beobachtungs-Eintrag «Last-Flake»):** Anheben erst, wenn ein `test_failed`-Ereignis mit `messages` «timed out» vorliegt. Stand 2026-10-12: `grep '"test_failed"' .studio/events.jsonl | grep -i "timed out"` → **0 Treffer**; die Bedingung ist formal nicht erfüllt, R565 P2 ordnet das Anheben aber ausdrücklich ins Bündel (Belege: 5 rote Läufe mit wechselnden Tests bei Load 8,5–17,4, plus zwei Integrator-Timeouts bei Load ≈ 30). **Entscheid L0 im Gate** (Empfehlung: anheben, siehe Entscheide).

- [ ] Prüfen: Treffer im Lager? Ja → Test benennen. Nein → Ausnahme laut L0-Entscheid.
- [ ] **Rot:** kein sinnvoller roter Test (reine Timeout-Konstante). Ersatz: `grep -n` auf die `it(…)`-Blöcke ohne dritten Parameter in den R170-/patchGrid-Blöcken (Z. ≈ 215–1240) als Vorher-Beleg im Bericht.
- [ ] **Grün:** je betroffenem Test ein Timeout-Parameter (Muster: Zeile ≈ 1266, «≥ 8 × Laufzeit unter Last», R270/R318), Kommentar «Timeout: …» je Block angleichen. Vitest-Default (5 s) und `vite.config.ts` bleiben. Lauf `npx vitest run tests/render/terrain.test.ts; echo EXIT=$?` → 0.
- [ ] `npx eslint tests/render/terrain.test.ts; echo EXIT=$?`.

**Commit:** `test: Timeouts in terrain.test.ts angehoben (R565 P2)`

## T02 — Ampel-Umstellung (AK-TB9-02, R565 P5)

**Dateien:** `tools/studio/actions.py` (`SESSION_LIMITS = (8, 15)` Z. 25), `tools/studio/efficiency.py` (`steuerung`-Zeile Z. ≈ 764–771 und `THRESHOLDS["steuerung"]` Z. 40), Tests.

- [ ] **Rot (R395):** (1) `test_actions.py`: 10 Minuten → grün, 11 → gelb, 15 → gelb, 16 → rot; Regeltext `(gelb > 10, rot > 15)`. (2) `test_efficiency.py`: Daten mit `steuerung` roh 0,66, `steuerung_bereinigt` 0,30 → Zeile `steuerung` grün; roh 0,66 / bereinigt 0,60 → rot; `steuerung_bereinigt` fehlt (Altdaten) → Rückfall auf roh; die Rohzeile erscheint zusätzlich als Info-Zeile ohne Ampelfarbe. Lauf `EXIT=1`.
- [ ] **Grün:** `SESSION_LIMITS = (10, 15)`; `steuerung`-Ampelzeile bewertet `data["steuerung_bereinigt"]` (Schwellen unverändert 0,40/0,50), Rohwert als Info («roh x %, nur Info»). Ausgabe und Parser `effort.parse_ampel_session` bleiben kompatibel (T01 aus TOOL-BUENDEL-8 liest die bereinigte Zeile bereits; Doppelzählung prüfen: `ampel_incidents` darf aus der neuen Zeile keinen zweiten Vorfall erzeugen, Test).
- [ ] **Echtlauf:** `python3 tools/studio/actions.py` und `python3 tools/studio/metrics.py --efficiency` auf echten Daten, Ausgabe im Bericht (Zeile `steuerung` nennt bereinigten Wert, Rohzeile als Info).
- [ ] `ruff check tools/studio; echo EXIT=$?`.

**Commit:** `fix: Ampel nutzt bereinigte Steuerungszeile, Session-Minuten gelb ab > 10 (R565 P5)`

## T03 — Flake-Zeile nur im Zeitraum, Arbeitsbaum mitschreiben (AK-TB9-03, R565 V3)

**Ist:** `flake_suspects(events)` gruppiert nach `(suite, commit, diff)`; `metrics.py` Z. 409 übergibt alle Ereignisse, `--sessions N` (Z. 470) schränkt nur die Transkripte ein. `testrun` schreibt `diff` als Hash von `git diff HEAD` plus untracked (Z. 115), aber **nicht, in welchem Arbeitsbaum** der Lauf lief; derselbe Commit in zwei Worktrees mit leerem Diff gilt als «gleicher Stand» (Fehlalarm).

- [ ] **Rot (R395):** (1) `flake_suspects(events, since=…)` zählt nur Paare, deren grüner Lauf im Zeitraum liegt; rote Läufe davor mit grünem danach zählen nicht. (2) Ereignisse mit unterschiedlichem `tree` (neues Feld, Pfad des Arbeitsbaums, relativ zum Repo-Wurzelnamen, z. B. `.worktrees/tool-b9`) bilden verschiedene Zustände; Ereignisse ohne `tree` (Altlager) verhalten sich wie bisher. (3) `testrun.build_event` schreibt `tree` (Wirft nie; Fehler → Feld fehlt). (4) `metrics.py --efficiency --sessions N` übergibt den Beginn der ältesten gewählten Session als `since`; ohne `--sessions` unverändert (alle). Lauf `EXIT=1`.
- [ ] **Grün:** Parameter `since: datetime | None = None` in `flake_suspects` (Zeitfilter über `_event_time`), `_test_state` um `event.get("tree")` erweitern, `testrun._base_event` ergänzt `tree`, `metrics.py` reicht den Beginn durch (Quelle: wie `efficiency.compute(since=…)` bereits den Zeitpunkt kennt, wiederverwenden statt neu ableiten).
- [ ] **Echtlauf:** `python3 tools/studio/metrics.py --efficiency --sessions 1` und ohne `--sessions` auf echten Logs; Flake-Zahl im engen Zeitraum ≤ Gesamtzahl, Ausgabe im Bericht. Echtes Lager nur lesen.
- [ ] `ruff check tools/studio; echo EXIT=$?`.

**Commit:** `fix: Flake-Zeile zählt nur im gewählten Zeitraum und trennt Arbeitsbäume (R565 V3)`

## T04 — Werte-Frage Sieg-Tick-Grenze (AK-TB9-04, R570) — L0 entscheidet im Gate

Messlage: Ensemble Seed 3, Phasen 0/20/…/80 (und 10…90 nach Härtung), Sieg-Tick Median 7250, Spanne 6650–7900, 4/5 ≤ 7500; `WIN_TICK_LIMIT = 7500` (`tests/sim/controller.ts:18`), genutzt von `balance.test.ts`, `balance-crises.test.ts`, `ensemble.test.ts` (`LIMIT_WIN_TICK`). `MAX_TICKS` 9000. Phase 0 (Referenz) siegt bei 6750.

| Option             | Inhalt                                                                                                                                                                                  | Wirkung                                                                                                     | Kosten bei Irrtum                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A                  | `WIN_TICK_LIMIT` global 7500 → 8250 (= Maximum 7900 + 350 Luft, so viel Luft wie die Beobachtung zu D-I048-B-GRENZE heute nennt)                                                        | Ensemble ohne AUSREISSER; aber auch `balance.test.ts` verliert Schärfe (Phase 0: 1500 Ticks Luft statt 750) | Wirtschaftsregression bis +1500 Ticks fällt im Einzellauf nicht mehr auf                       |
| **B (Empfehlung)** | **Neue Konstante nur fürs Ensemble** `ENSEMBLE_WIN_TICK_LIMIT = 8250` in `tests/sim/controller.ts`, `ensemble.test.ts` nutzt sie; `WIN_TICK_LIMIT` 7500 bleibt für die Einzellauf-Gates | Ensemble misst die Streuung des Test-Spielers ehrlich (Median + Spanne), Einzellauf-Gates bleiben scharf    | zwei Konstanten (kleine Mehrkosten); Rücknahme = eine Zeile                                    |
| C                  | Grenze 7500 behalten, Controller-Pfad Phasen 60/70 verbessern (früherer Sieg)                                                                                                           | keine Werteänderung                                                                                         | Controller-Arbeit mit Risiko für Phase 0/20/40 (bitgleich, R568), Aufwand ≈ 60 Tools, ungewiss |
| D                  | Grenze je Phase                                                                                                                                                                         | genau, aber mehr Werkzeug und Pflege                                                                        | unverhältnismässig (YAGNI)                                                                     |

Ableitungsregel für B: Grenze = Ensemble-Maximum auf `main` gerundet auf 50 + 350 (Luft wie heute). Wird die Regel genehmigt, steht sie als Kommentar neben der Konstante, damit eine Neumessung dieselbe Zahl neu ableitet.

- [ ] **Rot:** je nach Entscheid. Für B: Test in `ensemble.test.ts` («GE-n: Ensemble-Grenze ≥ Maximum der Messung») bzw. Verdikt `AUSREISSER` für 7900 entfällt, `WIN_TICK_LIMIT` bleibt 7500 (Balance-Test unverändert grün).
- [ ] **Grün/Echtlauf:** `make gate-ensemble` (Controller, Testsperre) auf `main` + Branch; Median/Spanne/Verdikt im Bericht. Beobachtung «Sieg-Tick-Grenze 7500 meldet Phasen 60/70 als AUSREISSER» schliessen, Controller-Stillstand-Eintrag «Streuung offen» auf erledigt.
- [ ] `npx eslint tests/sim/controller.ts tests/sim/ensemble.test.ts; echo EXIT=$?`.

**Commit:** `test: Ensemble-Grenze Sieg-Tick aus Messung abgeleitet (R570)`

## T05 — Doku: Abschnitt «Live-Ampel» (AK-TB9-05)

`docs/studio/STUDIO.md` verweist an mehreren Stellen auf die Live-Ampel (Z. 193, 380), ein eigener Abschnitt fehlt (Coach-Hinweis nach R565). Handbuch-Inhalt ist Sache des `studio-coach`/Handbuch-Minor (R565): **T05 ist nur eine Doku-Aufgabe**, benannt, nicht ausgebaut; der Umsetzer schreibt höchstens einen Entwurf (≤ 15 Zeilen: Aufruf `python3 tools/studio/actions.py`, Ampelzeilen, Schwellen, Push-Takt-Verweis R565 P4, Erscheinen der bereinigten Steuerungszeile) in den Bericht, und der Coach übernimmt ihn. Nach T02 die Stand-Sätze in Z. 193 («bis zur Werkzeug-Umstellung», «steht noch auf 8») streichen — nur diese zwei Satzteile, keine inhaltliche Handbuch-Änderung.

- [ ] `make docs-check; echo EXIT=$?` (Controller).

**Commit:** `docs: Stand-Sätze Live-Ampel nach Werkzeug-Umstellung (R565 P5)`

## Budgetantrag

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-9-umsetzung
Pakete: 1 Strang T01–T05 (ein Umsetzer, seriell)
Formel: 1 × 2 + 2 Task-Reviews + 1 Final-Review = 5 → × 1,3 → 7 (aufgerundet)
Beantragt: 7 Starts, Parallelität 1
```

- Start 1: `tech-sim-engineer` (sonnet) T01–T05 (≈ 120 Tools; Briefing mit den Grenzen aus «Global Constraints» wörtlich; Ein-Umsetzer-Regel E-037: L0 briefet direkt oder Lead auf sonnet)
- Starts 2–3: `qa-code-reviewer` (sonnet) nach T01–T03 und nach T04–T05
- Start 4: `qa-code-reviewer` (opus) Final-Review über `tool/b9`
- Starts 5–7: Puffer; Fix-Runden per SendMessage zählen nicht

## Risiken

- **T01 ohne Beleg:** Die Bedingung der Beobachtung («timed out» im Lager) ist nicht erfüllt; Anheben ist dann eine Vorsichtsmassnahme. Kosten bei Irrtum: ein zu langer Timeout versteckt eine echte Verlangsamung; abgefedert durch die `performance.now`-Zeittests (`make zeittests`).
- **T02/T03 teilen `efficiency.py`:** daher seriell. T03 ändert die Ereignisform (`tree`); Altlager bleibt lesbar (Test 2).
- **T04 ist eine Werteänderung der Testgrenze:** nur nach L0-Entscheid, Einzellauf-Gates bleiben bei Option B unberührt.
- **Push-Sperre R464:** Steht ein Push an, startet kein Testlauf; Plan ohne Testläufe darf parallel laufen.

## Entscheide

Offen für L0 im kombinierten Gate: (1) T01 anheben ohne «timed out»-Beleg (Empfehlung: ja, R565 P2 ist ausdrücklich, Kosten niedrig); (2) T04 Option A/B/C/D (Empfehlung **B**, Grenze 8250 nur im Ensemble); (3) T05 nur als Entwurf an den `studio-coach` (Empfehlung: ja, kein Handbuch-Inhalt im Werkzeug-Paket); (4) Reihenfolge: T01–T03, T05 sofort, T04 nach Merge M14-E1; (5) seriell, Budget 7, Parallelität 1.
