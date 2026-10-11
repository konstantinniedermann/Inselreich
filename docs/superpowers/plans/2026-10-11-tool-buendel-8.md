# Werkzeug-Bündel 8 (TOOL-BUENDEL-8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Steuerungs-Vorfall liest die bereinigte Ampelzeile (R538 V1), Quellcode-Diagnose des Last-Flakes in `terrain.test.ts`/`save.test.ts` (ohne Code-Fix), `testrun` zeichnet Fehlermeldungen auf (T05), `design-m14-e1` im Phasenformat nachtragen und `KNOWN_MISMATCH` entfernen (E-060 Vorarbeit, R520), Randfälle aus TOOL-BUENDEL-7 entscheiden.

**Spec:** keine (Werkzeug-Paket). Grundlage: Retro `docs/studio/retros/2026-10-11-ampel-adhoc.md` (B1, V1), `docs/beobachtungen.md` (zwei Einträge 2026-10-11), R520.

Prozessstufe leicht · Paket TOOL-BUENDEL-8 · Meilenstein ohne (Werkzeug, spielfremd; Nachtrag R539) · Plan: `lead-tech`, sonnet (E-054, Werkzeug-Paket) · Umsetzung im Worktree `.worktrees/tool-b8`, Branch `tool/b8` (wird von L0/Controller angelegt, nicht vom Plan).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`): Python-Stdlib, Bash, Git, vorhandenes Vitest.
- Erlaubt: `tools/studio/`, `tools/studio/tests/`, `Makefile`, `docs/studio/` (nur Werkzeug-Zeilen, kein Handbuch-Inhalt), Unverändert: `src/` (auch `src/render/`), `tests/` (TS), `vite.config.ts`, `.claude/`, `tools/studio/guard.py`. Ruling-Wortlaut nur als «Entwurf an L0» im Bericht.
- Messwerkzeuge und Hooks werfen nie; Hooks lassen bei eigenem Fehler zu (fail-open).
- **Test zuerst, Rot-Beleg (R395):** je neuem Test ein roter Lauf (`EXIT=1`) im Task-Bericht. Umsetzer fahren nur gezielte Dateien (`python3 -m unittest tools.studio.tests.test_<x>; echo EXIT=$?`); `make studio-test`, `studio-lint`, `docs-check`, `lint` nur der Controller (Testsperre, R380). Exit-Codes nie in eine Pipe.
- **Werkzeug-Paket-Pflicht:** `make studio-test` grün; Echtlauf auf echten Daten (T01: echte Metrik-Dateien, T02: Fixture mit echtem Budget-Hook-Pfad), Ausgabe im Bericht.
- Steht ein Push an (R464), startet kein Testlauf; Controller fragt L0 vor dem ersten Lauf. Kein Rebase, kein Force-Push, main per Merge. Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`.
- **Keine Lockerung** von Schwellen (R170 ≤ 2,3 usw.); **keine künstliche Last, keine Busy-Loops** (R539).
- Prüfschritte nicht zur Budgetersparnis streichen, Mehrbedarf melden (R392).

## Architektur (≤ 15 Zeilen)

- **T01 (R538 V1):** `effort.parse_ampel_session` liest zusätzlich die bereinigte Zeile (`- Steuerungsanteil bereinigt (E-049 …): x %, Bewertung rot|gelb|grün …`). Steht `steuerung` roh in `red` und die Bewertung der bereinigten Zeile ist **nicht** `rot`, wird `steuerung` aus `red` entfernt. Fehlt die Zeile (23 von 29 Metrik-Dateien, vor E-049) oder ist sie «nicht gemessen», gilt die Rohzeile wie bisher (Rückfall, Messbarkeit gewahrt). `ampel_incidents`, Schwellen, Rohzeile in den Metrik-Dateien und Vorfalltext bleiben. Gelb bereinigt löst bewusst keinen Vorfall aus (Retro V1: «nur bei bereinigt rot»).
- **T02 (E-060 Vorarbeit):** `design-m14-e1` ist im Fixture `tools/studio/tests/fixtures/budget_pairs.json` mit Freigaben `design-m13-e2 … design-m14-richtung` belegt, die Paketphase `design-m14-e1` fehlt. Nachtrag: die Phase `design-m14-e1` wird dem Eintrag als Freigabe hinzugefügt (so hätte der Lead nach Handbuch 1.45 loggen müssen). `KNOWN_MISMATCH` und sein Zweig in `RealPairsTest` entfallen. `BUDGET_MODE` bleibt `"warn"` (Umschalten per eigenem L0-Ruling, nicht hier).
- **T03 (Flake):** Befund aus `.studio/events.jsonl` (`test_failed`, Commit `dcae12eb`/`b569a8f2`, Load 8,5–17,4): fünf rote Läufe, **verschiedene** Tests in `terrain.test.ts` (gridBands AK-E1-11, Dünen H-R12b, patchGrid AK-R1-01, zweimal R170 Kantenenergie, einmal `save.test.ts`). Die Werte sind deterministisch (feste Seeds 3, 5, 12588, kein `Math.random`/`Date.now` in den Test-Rechnungen; `performance.now` nur in zwei Zeittests mit Budget). Wechselnde Testnamen bei konstantem Load sprechen für **Zeitüberschreitung** (Vitest-Standard 5 s, z. B. patchGrid ohne eigenes Timeout, Zeile ≈ 746), nicht für Zahlenabweichung. Hypothese H1, unbelegt; die Meldung steht nicht im Ereignislager.
- **T05 (R539):** `testrun.build_event` ergänzt bei rotem Lauf `messages` (Name → erste Fehlerzeile, ≤ 200 Zeichen); `names` bleibt, Dashboard kompatibel. Liefert den Beleg für die Flake-Ursache beim nächsten Fall.
- **T04:** Doku-Abschluss und Randfall-Entscheid (siehe unten).

## Datei-Ownership (ein Worktree, ein Umsetzer, seriell)

Berührt `src/` und `tests/` nicht: kein Konflikt mit I-049-UI und Integrator-Merges auf main. Gemeinsame Dateien mit anderen Strängen: keine (`docs/beobachtungen.md` hat den Merge-Treiber E-059).

| Task | Titel                                        | Dateien (Eigentum)                                                                                               | blocked-by | Schätzung |
| ---- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| T01  | Ampel-Vorfall liest bereinigte Zeile         | `tools/studio/effort.py`, `tools/studio/tests/test_ampel.py`                                                     | —          | ≈ 35      |
| T02  | design-m14-e1 nachtragen, KNOWN_MISMATCH weg | `tools/studio/tests/test_budgetwarn.py`, `tools/studio/tests/fixtures/budget_pairs.json`                         | —          | ≈ 15      |
| T03  | Terrain-/Save-Flake: Quellcode-Diagnose      | keine Codeänderung (Text in T04)                                                                                 | —          | ≈ 15      |
| T05  | testrun: Fehlermeldung im test_failed        | `tools/studio/testrun.py`, `tools/studio/tests/test_testrun.py`                                                  | —          | ≈ 30      |
| T05  | testrun: Fehlermeldung im test_failed        | `tools/studio/testrun.py`, `tools/studio/tests/test_testrun.py`                                                  | —          | ≈ 30      |
| T04  | Beobachtungen abschliessen, Randfälle        | `docs/beobachtungen.md` (Einträge schliessen/ergänzen), `docs/arc42.md` nur falls Werkzeug-Beschreibung abweicht | T01–T03    | ≈ 10      |

Summe ≈ 105 Tools Umsetzung. Parallelität 1, seriell (R539): ein Umsetzer, ein Worktree. Keine künstliche Last in keinem Task.

## T01 — Steuerungs-Vorfall liest bereinigte Zeile (AK-TB8-01)

**Dateien:** `tools/studio/effort.py` (`parse_ampel_session`, neue Konstante neben `_RED`, Z. 27), `tools/studio/tests/test_ampel.py`.

- [ ] **Rot (R395):** Tests in `AmpelParserTest` mit Textbausteinen (`- erzeugt:`/`Datenbasis`-Zeilen wie in den vorhandenen Tests, dazu Zeile `- ROT: Steuerungsanteil (L0 + Leads): 66.2 % (…)`):
  1. roh rot + bereinigt `Bewertung grün` → `"steuerung" not in red`;
  2. roh rot + bereinigt `Bewertung gelb` → nicht in `red`;
  3. roh rot + bereinigt `Bewertung rot` → in `red`;
  4. roh rot ohne bereinigte Zeile → in `red` (Rückfall);
  5. roh rot + bereinigte Zeile «nicht gemessen» (Bewertung ohne rot/gelb/grün) → in `red` (Rückfall, Ausgabe von `efficiency.NOT_MEASURED`);
     5b. andere rote Kennzahlen (`cache_write_5m`) bleiben bei 1–2 unberührt;
  6. zwei Sessions mit Fall 1 ergeben über `effort.ampel_incidents` **keinen** `steuerung`-Vorfall; mit Fall 3 einen.
     Dazu echte Dateien aus `docs/studio/metriken/`: `S-2026-10-11-dc50be15` und `S-2026-10-10-f52039fc` ohne `steuerung`, `S-2026-10-09-c64c0775` (bereinigt 69,6 % rot) mit `steuerung`. Lauf `python3 -m unittest tools.studio.tests.test_ampel; echo EXIT=$?` → `EXIT=1`.
- [ ] **Grün:** `_ADJUSTED = re.compile(r"^- Steuerungsanteil bereinigt \(E-049[^\n]*?Bewertung (rot|gelb|grün)", re.MULTILINE)`; nach dem Aufbau von `red`: Treffer mit Gruppe ≠ `rot` → `red.discard("steuerung")`. Kommentar mit Verweis R538 V1/E-049. Lauf grün.
- [ ] **Echtlauf (Pflicht, Messgrösse der Retro):** Skript im Scratchpad liest alle `docs/studio/metriken/S-*.md` über `model.load_ampel_sessions` und gibt `ampel_incidents(...)` einmal mit dem Stand von `main` (Parser per `git show main:tools/studio/effort.py` in ein Scratch-Modul geladen) und nachher aus. Erwartung: kein verpasster Fall (`S-2026-10-09-c64c0775` bleibt rot), Vorfälle ≤ 1 je 5 Sessions. **Abweichung vom Retro-Text:** nur 6 von 29 Dateien tragen die bereinigte Zeile (statt «letzte 10»); die Rückrechnung deckt diese 6 ab, der Rest läuft über den Rückfall. Ausgabe in den Bericht.
- [ ] `ruff check tools/studio/effort.py tools/studio/tests/test_ampel.py; echo EXIT=$?`.

**Commit:** `fix: Steuerungs-Vorfall liest die bereinigte Ampelzeile (R538 V1)`

## T02 — `design-m14-e1` nachtragen, `KNOWN_MISMATCH` entfernen (AK-TB8-02)

**Dateien:** `tools/studio/tests/test_budgetwarn.py` (Z. 184–204), `tools/studio/tests/fixtures/budget_pairs.json`.

- [ ] **Rot (R395):** `KNOWN_MISMATCH` und den `if … in KNOWN_MISMATCH`-Zweig in `RealPairsTest.test_pairs_from_handbook_1_45_are_allowed` streichen (Kommentar «Echte Abweichung nach 1.45 …» mit). Lauf `python3 -m unittest tools.studio.tests.test_budgetwarn; echo EXIT=$?` → `EXIT=1`, Meldung nennt `design-m14-e1`.
- [ ] **Grün:** im Fixture dem Eintrag `design-m14-e1` die Phase `"design-m14-e1"` anhängen (Reihenfolge der Freigaben wie geloggt, die Nachtrags-Freigabe zuletzt). Lauf grün.
- [ ] **Echtlauf (Pflicht):** `python3 -c` mit `budgetwarn.check` und `budgetwarn.warning` für ein Paar `lead-design`/`design-m14-e1` gegen die Fixture-Freigaben: beide `None`. Außerdem `grep -n 'BUDGET_MODE' tools/studio/modelguard.py` zeigt weiter `"warn"`; **Umschalten nicht Teil dieses Bündels** (Entwurf an L0: Ruling «E-060 `deny`», Bedingung nur eine Session läuft, R520).
- [ ] `ruff check tools/studio/tests/test_budgetwarn.py; echo EXIT=$?`.

**Commit:** `test: design-m14-e1 im Phasenformat nachgetragen, KNOWN_MISMATCH entfernt (R520)`

## T03 — Terrain-/Save-Flake: Quellcode-Diagnose ohne Code-Fix (AK-TB8-03, R539)

**Dateien:** keine Codeänderung. Ergebnis als Beobachtungs-Text in `docs/beobachtungen.md` (T04).

**Keine künstliche Last, keine Busy-Loops, keine Lastreproduktion** (R539: kollidiert mit parallelen Strängen, R329, TOOL-TESTLOCK). Auch kein Vitest-Lauf unter Last.

- [ ] **Diagnose, nur Lesen/grep:** `tests/render/terrain.test.ts` und `tests/sim/save.test.ts` (AK-S1-14, Z. ≈ 624 und 730): `grep -n "Math.random\|Date.now\|performance.now\|setTimeout" …`, dazu `tests/render/terrain.test.ts` `rasterStats` (Z. ≈ 563–660) und `src/render/terrain.ts` (nur lesen). Je Test festhalten: eigenes Timeout vorhanden (z. B. 60_000 beim R170-Block, keines bei patchGrid ≈ 746), Setup-Kosten (`createWorld`, `paintAll`, `village`), Zufalls-/Zeitquelle ja/nein.
- [ ] **Belege einordnen:** fünf rote Läufe im Lager (Load 8,5–17,4, verschiedene Tests, Wiederholung grün) plus Meldung des Integrators: zwei Timeouts unter Load ≈ 30 in genau R170 Kachelraster und AK-S1-14, Wiederholung grün. Zusammen stützen sie Hypothese H1 (Wandzeit-Überschreitung unter Fremdlast, kein Wert-Fehler); sie bleibt Hypothese, bis T05 eine aufgezeichnete Meldung liefert.
- [ ] **Ergebnis:** Beobachtungs-Text mit Befund je Datei und Empfehlung: Fix (z. B. `testTimeout` in `vite.config.ts` oder `vi.setConfig`) erst als eigenes Häppchen, wenn ein `test_failed`-Ereignis mit Meldung die Ursache belegt; dann ist auch `vite.config.ts` zulässig. **Schwellen bleiben unverändert.**

**Commit:** keiner (Text geht in T04).

## T04 — Beobachtungen und Randfälle (AK-TB8-04)

**Dateien:** `docs/beobachtungen.md`, `docs/arc42.md` (nur falls Beschreibung Ampel/Budget-Hook abweicht).

Entscheid zu den Randfällen des Eintrags «Budget-Hook `warning()` und `tablecheck` Randfälle (TOOL-BUENDEL-7)»:

| Randfall                                                   | Entscheid                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warning()` Phasenname/Gross-Kleinschreibung               | Bereits erledigt: `_matches` vergleicht `casefold`, `_phase` trimmt; `test_phase_case_insensitive` (Z. 78) deckt es. Kein Code, Eintrag schliessen.                                                                                                                                                                              |
| `tablecheck._open_backtick` meldet ersten ungepaarten Lauf | Weglassen: Absicht ist eine Heuristik «jede ungepaarte Backtick-Folge in Tabellenzelle ist verdächtig» (strenger als CommonMark, im Repo 0 Treffer, `test_unmatched_run_length_is_reported` hält es fest). Ein Angleichen an CommonMark würde Verstösse verschweigen. Kosten bei Irrtum: ein Fehlalarm, per Maskierung behebbar. |
| `testrun` Ctrl-C-Fenster nur per Mock                      | Weglassen: ein Test mit echten Signalen ist zeitabhängig (Race zwischen Signal und `pthread_sigmask`) und erzeugte selbst Flake; das Fenster ist durch `pthread_sigmask` ab dem ersten Moment geschlossen (T01 von B7). Beobachtung bleibt als «nur Mock» stehen.                                                                |

- [ ] Eintrag «Randfälle (TOOL-BUENDEL-7)» auf obige drei Entscheide kürzen (Datum, Ergebnis); Eintrag «Last-Flake `terrain.test.ts`» je nach T03 schliessen oder mit Messreihe und Folgeempfehlung ergänzen. Keine Folgeissues.
- [ ] `make docs-check; echo EXIT=$?` (Controller).

**Commit:** `docs: Beobachtungen TOOL-BUENDEL-8 abgeschlossen`

## T05 — `testrun` schreibt Fehlermeldungen ins `test_failed`-Ereignis (AK-TB8-05, R539)

**Dateien:** `tools/studio/testrun.py` (`parse_names`, `build_event`), `tools/studio/tests/test_testrun.py`. Schätzung ≈ 30 Tools.

**Format (kompatibel):** `names` bleibt unverändert (Liste, von `efficiency.py` Z. ≈ 715 und `metrics.py` gelesen). Neu zusätzlich `messages`: Objekt Name → erste Fehlerzeile, auf ≤ 200 Zeichen gekürzt, höchstens `MAX_NAMES` Einträge. Fehlt eine Meldung, fehlt der Schlüssel für diesen Namen; ältere Ereignisse ohne `messages` bleiben gültig.

- [ ] **Rot (R395):** Tests mit Beispielausgabe (Zeilenlisten): (1) vitest-Block `FAIL file > a > b` gefolgt von `Error: Test timed out in 5000ms.` → `messages[name] == "Error: Test timed out in 5000ms."`; (2) `AssertionError: expected 2.4 to be less than or equal to 2.3` → gekürzte erste Zeile; (3) Meldung > 200 Zeichen wird auf 200 gekürzt; (4) unittest `FAIL: test_x (mod.Cls)` gefolgt von `AssertionError: …`; (5) rotes Ereignis ohne erkennbare Meldung → `names` wie bisher, `messages` leer oder fehlend; (6) `build_event` mit Code 0 hat weder `names` noch `messages`; (7) `names` für alte Eingaben unverändert (bestehende Tests grün). Lauf `python3 -m unittest tools.studio.tests.test_testrun; echo EXIT=$?` → `EXIT=1`.
- [ ] **Grün:** `parse_messages(lines, suite)` (Fehlerzeile = erste Zeile nach der Namenszeile, die mit `\w*(Error|Exception)\b` oder `Test timed out` beginnt, vor dem nächsten Namen); `build_event` setzt `event["messages"]` nur bei Code ≠ 0 und nicht leer. Wirft nie (gleiche Regel wie `parse_names`).
- [ ] **Echtlauf (Pflicht):** `python3 tools/studio/testrun.py` (Aufruf wie `make studio-test` ihn zeigt) auf einen absichtlich roten Scratch-Test **mit Scratch-Lager** (`events_file()`-Umgebung wie in `test_log`), Ereigniszeile zeigt `messages`; Scratch danach löschen, nie das echte Lager beschreiben. Dashboard-Kompatibilität: `python3 tools/studio/metrics.py` auf echten Logs läuft ohne Fehler, `efficiency`-Tests grün (Controller: `make studio-test`).
- [ ] `ruff check tools/studio/testrun.py tools/studio/tests/test_testrun.py; echo EXIT=$?`.

**Commit:** `feat: testrun schreibt Fehlermeldungen ins test_failed-Ereignis (R539)`

## Budgetantrag

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-8-umsetzung
Pakete: 1 Strang T01–T05 (ein Umsetzer, seriell)
Formel: 1 × 2 + 2 Task-Reviews + 1 Final-Review = 5 → × 1,3 → 7
Beantragt: 7 Starts, Parallelität 1
```

- Start 1: `tech-sim-engineer` (sonnet) T01–T05 (≈ 105 Tools; Briefing: die Grenzen aus «Global Constraints» **wörtlich** übernehmen, insbesondere «Erlaubt: `tools/studio/`, `tools/studio/tests/`, `Makefile`, `docs/studio/` (nur Werkzeug-Zeilen, kein Handbuch-Inhalt)», «`src/` unverändert», «keine künstliche Last»; D1-Doku `docs/arc42.md` ausdrücklich erlauben, E-017)
- Starts 2–3: `qa-code-reviewer` (sonnet) nach T01/T02 und nach T03/T04
- Start 4: `qa-code-reviewer` (opus) Final-Review über `tool/b8` (≈ 35)
- Starts 5–7: Puffer; Fix-Runden per SendMessage zählen nicht

Controller-Ein-Umsetzer-Regel (E-037): L0 briefet den Umsetzer direkt, oder der Lead läuft auf sonnet.

## Risiken

- **Flake-Ursache bleibt Hypothese** bis T05 eine aufgezeichnete Meldung liefert; Fix erst als eigenes Häppchen (dann `vite.config.ts` zulässig). Kosten: ein weiterer Flake-Zyklus.
- **T05 Meldungs-Parser** erkennt nicht jedes Ausgabeformat: dann fehlt `messages` für den Namen, `names` bleibt unverändert (Test 5).
- **T01 verdeckt echte Steuerungsprobleme** im Planteil (Retro V1 nimmt das hin; Rückfall = Revert eines Commits). Die Rohzeile bleibt sichtbar.
- **Retro-Messgrösse «10 Metrik-Dateien»** nicht erfüllbar (6 mit bereinigter Zeile); im Bericht ausgewiesen.
- **T02-Nachtrag** ist ein Fixture-Eintrag, kein Eintrag im echten Ereignislager (append-only, Session fremd).

## Entscheide

Offen für L0 (R539): (1) `BUDGET_MODE = "deny"` als eigenes Ruling nach T02, mit Echtlauf gegen Lagerdaten; (2) erledigt durch T05; (3) seriell, Budget 7, Parallelität 1.
