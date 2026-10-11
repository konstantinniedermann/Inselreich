# Werkzeug-Bündel 6 (TOOL-BUENDEL-6) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `make push-check` statt Hand-Kette, Actions-Prognose und Produktivanteil in der Ampel, Merge-Treiber für reine Anhänge in `docs/beobachtungen.md`, Budget-Hook blockt statt zu warnen.

**Spec:** keine (Werkzeug-Paket). Grundlage: R488 V1/V2/V4 (Retro `docs/studio/retros/2026-10-10-rel-18-prozess.md`), R497 (E-059, E-060 in `experimente.md`), STUDIO.md „Merges“ (R429).

Prozessstufe leicht (Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB in [`2026-10-11-tool-buendel-6/`](2026-10-11-tool-buendel-6/)) · Paket TOOL-BUENDEL-6 · Meilenstein ohne · Planbasis `main` @ `eef88dc1` · Plan: `lead-tech`, opus · **Nachtrag R503** (QA-B1–B9, D1–D4 entschieden, Parallelität 2) in T02, T03, T04, T05, T07. **Umsetzung erst nach Push REL-19 (R464) und Abnahme des Nachtrags.**

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`): nur Python-Stdlib, Node ohne Pakete, Bash, Git.
- Unverändert: `src/`, `docs/studio/` (inkl. `rulings.md`, R471), `.claude/`, `tools/studio/guard.py`, `tools/testlock/`. Handbuch-/Persona-Folgen: `studio-coach` nach dem Merge (unten).
- Messwerkzeuge und Hooks werfen nie; Hooks lassen bei eigenem Fehler zu (fail-open). Einzige gewollte Sperre: T07.
- **Test zuerst, Rot-Beleg (R395):** je neuem Test ein roter Lauf (`EXIT=1`) im Task-Bericht. Umsetzer fahren nur gezielte Dateien; `make studio-lint`, `studio-test`, `lint`, `push-check` nur der Controller (Testsperre, R380). Exit-Codes `…; echo EXIT=$?`, nie in eine Pipe.
- **Steht ein Push an (R464), startet kein Testlauf**; der Controller fragt L0 vor dem ersten Lauf.
- Prüfschritte nicht zur Budgetersparnis streichen, Mehrbedarf melden (R392). Ruling-Wortlaut nur als „Entwurf an L0“ im Controller-Bericht.
- **Werkzeug-Paket-Pflicht:** `make studio-test` grün; Echtlauf gegen jede externe API (hier `gh api …/billing/usage` in T04; `git` echt in T06), Ausgabe im Bericht.
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push, main per Merge.

## Architektur (≤ 15 Zeilen)

- **T01:** `tests/ui/time.test.ts` AK-UX-13 je Szenario aufteilen (`it.each`), Prüfinhalt gleich, eigenes Timeout nach Messung (R392).
- **T02:** `tools/zeitreserve/`: Reporter schreibt bei `ZEITRESERVE_OUT` in eine andere Datei; `check.ts --push --marked <f>` schreibt die Dateien mit Verstoss oder Warnung (beide Regeln) **auch bei Exit 2**; `--retry <f>` berechnet die Liste rein neu (B2) und ersetzt deren Zeiten durch die Nachmessung (Commit = HEAD, `loadStart` ≤ 4). Annahme Monotonie.
- **T03:** `tools/studio/pushcheck.py` + `make push-check`: schnelle Vorprüfungen → Load ≤ 3 abwarten (≤ 10 min) → genau ein `make check-push` (= `check` ohne lockeres `zeitreserve`, B3) → `check.ts --push --marked` → bei Exit 2 (oder Exit 1 mit `loadStart` > 3) einmal nur markierte Dateien nachmessen → `check-ci-perf` → Arbeitsbaum unverändert (B5) → Schlusszeile, Ereignis `push_check` (M3).
- **T04:** `actions.py`: Prognosezeile Konto zum Monatsende = verbraucht + Tagesrate (letzte 3 volle Tage) × Resttage, gelb > 1600, rot > 1900; Repo-Zeile Info ohne Farbe.
- **T05:** `efficiency.py`: Zeile Produktivanteil = Klassenanteil Umsetzer + Design/Spec/Plan, gelb < 25 %, rot < 15 %; Umsetzeranteil erzeugt nur Befund/Vorfall, wenn Produktivanteil gelb/rot.
- **T06:** `tools/studio/merge_append.py` als Git-Merge-Treiber (`git merge-file --diff3 -p`), löst nur Konfliktblöcke mit leerer Basis (erst ours, dann theirs); `.gitattributes`, `make merge-driver`.
- **T07:** `modelguard._budget_warn` gibt bei fehlender Freigabe `permissionDecision: deny` aus (Schalter `BUDGET_MODE`); Abgleich Paket ↔ Phase wie `model._grant_names`.

## Datei-Ownership (R503: Parallelität 2)

Strang **A** (T01–T03): `.worktrees/b6a`, Branch `tool/b6a`. Strang **B** (T04–T07): `.worktrees/b6b`, Branch `tool/b6b`.

- **A · T01:** `tests/ui/time.test.ts`
- **A · T02:** `tools/zeitreserve/check.ts`, `reporter.ts`, `rule.ts` (nur neue Exporte), `README.md`; `tests/tools/zeitreserve.test.ts`, Fixtures `tests/tools/`
- **A · T03:** neu `tools/studio/pushcheck.py`, `tests/test_pushcheck.py`; `Makefile` (Absatz `check`/`check-run`/`check-push`/`push-check`); `docs/arc42.md` (Push-Gate ≈ Z. 605)
- **B · T04:** `tools/studio/actions.py`, `tests/test_actions.py`
- **B · T05:** `tools/studio/efficiency.py`, `effort.py` (nur `ampel_incidents`), `tests/test_efficiency.py`, `tests/test_effort.py`
- **B · T06:** neu `tools/studio/merge_append.py`, `tests/test_merge_append.py`, neu `.gitattributes`, `Makefile` (eigener Absatz `merge-driver` am Dateiende)
- **B · T07:** `modelguard.py`, `budgetwarn.py`, `tests/test_modelguard.py`, `tests/test_budgetwarn.py`, `tests/fixtures/budget_pairs.json`; `docs/arc42.md` (Hook ≈ Z. 596)

D1-Doku im Umsetzer-Briefing ausdrücklich erlauben (E-017). Gemeinsam berührt nur `Makefile` und `docs/arc42.md`, in getrennten Absätzen. Merge seriell A vor B, je Branch vorher `git merge-tree --write-tree main <branch>`. **T07 (Strang B) wird erst gemergt, wenn alle laufenden Stränge Freigaben im Phasenformat haben** (R503, Prod-B4; Prüfung T07 Hinweise).

## Budgetantrag (R503)

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-6-umsetzung
Pakete: A Push-Gate T01–T03 · B Ampel/Merge/Hook T04–T07
Formel: 2 × 2 + 0 QA-Checks + 1 Final-Review = 5 → × 1,3 → 7; R503: 8
Beantragt: 8 Starts, Parallelität 2
```

- Starts 1–2 parallel: `tech-sim-engineer` (sonnet) A (≈ 85 Tools) und B (≈ 95 Tools)
- Starts 3–4: `qa-code-reviewer` (sonnet) Review A (≈ 15) bzw. B (≈ 20), je nach Fertigstellung
- Start 5: `qa-code-reviewer` (opus) Final-Review über `tool/b6a` und `tool/b6b` (≈ 40)
- Starts 6–8: Puffer; Fix-Runden per SendMessage (zählen nicht)

**Controller:** je Strang ein `lead-tech` (sonnet, ≤ 4 Tasks, R167), Ledger `.superpowers/sdd/tool-buendel-6/ledger-<a|b>.md`. Gesamtläufe nur über die Testsperre (seriell). Controller A fährt am Ende **einmal `make push-check`** (Echtlauf T03, im Hintergrund, E-037), Controller B `make studio-lint`, `make studio-test`. Kein UI → kein `qa-playtester`.

**Schätzung:** Arbeiter ≈ 235 Tools + 2 Controller ≈ 50 Tools = **≈ 285 Tools**, ÷ 6 ≈ **48 min** Summe, parallel ≈ 30 min Wanduhr (B 16 + Review 3 + Final 7 + Läufe ≈ 4).

## Task-Tabelle

| ID  | Titel                                                          | Datei                                                     | AK-IDs                | Strang | blocked-by | Modell |
| --- | -------------------------------------------------------------- | --------------------------------------------------------- | --------------------- | ------ | ---------- | ------ |
| T01 | Reserve `time.test.ts`: AK-UX-13 je Szenario, Timeout gemessen | [T01](2026-10-11-tool-buendel-6/T01-time-reserve.md)      | AK-TB6-01             | A      | –          | sonnet |
| T02 | `zeitreserve`: markierte Dateien, Nachmessung zusammenführen   | [T02](2026-10-11-tool-buendel-6/T02-zeitreserve-retry.md) | AK-TB6-02 … AK-TB6-04 | A      | –          | sonnet |
| T03 | `make push-check` ersetzt die Push-Kette                       | [T03](2026-10-11-tool-buendel-6/T03-push-check.md)        | AK-TB6-05 … AK-TB6-08 | A      | T01, T02   | sonnet |
| T04 | Actions: Konto-Prognose zum Monatsende                         | [T04](2026-10-11-tool-buendel-6/T04-actions-prognose.md)  | AK-TB6-09, AK-TB6-10  | B      | –          | sonnet |
| T05 | Ampelzeile Produktivanteil                                     | [T05](2026-10-11-tool-buendel-6/T05-produktivanteil.md)   | AK-TB6-11, AK-TB6-12  | B      | –          | sonnet |
| T06 | E-059 Merge-Treiber `docs/beobachtungen.md`                    | [T06](2026-10-11-tool-buendel-6/T06-merge-append.md)      | AK-TB6-13 … AK-TB6-15 | B      | –          | sonnet |
| T07 | E-060 Budget-Hook blockt Lead-Starts ohne Freigabe             | [T07](2026-10-11-tool-buendel-6/T07-budget-block.md)      | AK-TB6-16 … AK-TB6-18 | B      | –          | sonnet |

## Review Focus

1. **Gate nicht aufgeweicht (T02/T03):** Kein Pfad meldet Exit 0, ohne dass jeder Test entweder in einer Messung mit `loadStart` ≤ 4 oder als unmarkiert unter höherer Last bestanden hat; Commit = HEAD; ein `check-push`, höchstens eine Nachmessung; D1 nur mit existierender, gültiger, leerer Liste (B1).
2. **Kein verlorener Eintrag (T06):** Konfliktblöcke mit Basisinhalt bleiben mit Marken stehen, Exit ≠ 0; Zeilenbilanz im Test.
3. **Keine Selbstaussperrung (T07):** „Budget: keins“, Nicht-Leads, Folge-Controller mit gleicher `Paket:`-Zeile und jeder Hook-Fehler lassen zu.

## Handbuch-Folgen (nach dem Merge, `studio-coach`, Handbuch-Minor)

- STUDIO.md „Merges“: Ablauf R429 durch **`make push-check`** ersetzen; Exit 0 pushbar, 1 rot, 2 kein ruhiges Fenster/nicht belastbar, 3 Testsperre; gepusht wird der Hash der Schlusszeile.
- `.claude/agents/production-integrator.md` Schritte 3–4 entsprechend; Merges: `make merge-driver` einmal je Klon (E-059), Konflikte mit Löschungen bleiben manuell (R303).
- Ampel-Abschnitt: Prognosezeile Actions und Regel „bei Rot höchstens ein Push je Tag“ (R488 V2); Produktivanteil und Bewertungsregel Umsetzeranteil (R488 V4).
- Budget-Abschnitt: Hook blockt statt zu warnen (E-060); `experimente.md` E-059/E-060 auf „laufend“ mit Startdatum; CHANGELOG.

## Risiken

1. **Monotonie-Annahme (T02/T03):** Schutz durch Markierung ab Warnschwelle (1000 ms), nicht erst ab Fehler.
2. **Selbstaussperrung (T07)** bei abweichenden Paketnamen: Rückfall `BUDGET_MODE = "warn"`; Meldung nennt den `log.py budget`-Befehl.
3. **Merge-Treiber-Pfad (T06):** relativer Pfad; Integrationstest mit echtem `git merge`, auch aus einem Worktree.
4. `push-check` dauert 6–8 min: im Hintergrund starten (E-037). Testläufe während eines anstehenden Pushs verboten (R464).
