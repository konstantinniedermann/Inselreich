# Retro meilenstein release-rel16-17 — 2026-10-10

- Datum: 2026-10-10
- Art: meilenstein (Release-Retro nach R127/R316) für zwei Releases in einem Push
- Auslöser: Push REL-16, REL-17, HOTFIX-CI-01 und TOOL-BUENDEL-3 `c282def0..a9f5336e`, CI 38055866019 grün, Pages 38056273377 grün (R463); Vorfälle `meilenstein:REL-16`, `meilenstein:REL-17`; L0-Schwerpunkte Push-Dauer 36 min mit zweimal Exit 2, Push über die Session-Grenze, Doppelarbeit zwischen parallelen Strängen, Ineffizienzen aus Logs
- Datenbasis: `docs/studio/rulings.md` R449–R463, `.studio/events.jsonl` (2026-10-10 08:40–13:37 UTC, `spawn`/`spawned`/`heartbeat`/`agent_stop`/`message`/`test_*`/`ci`, per Skript gefiltert), Transkript des Push-Integrators `a5740a3` (Session 5a00a316, 23 Tool-Aufrufe, Zeiten je Aufruf), Bash-Befehle aller übrigen Subagenten der Session 5a00a316 im Fenster 13:00–13:29 (Suche nach `vitest`, `make test|check|lint`, `tsc`, `prettier`), Handoffs `.studio/handoffs/2026-10-10-lead-tech-UI-REL16-umsetzung.md`, `…-UI-PROBLEM-SPRUNG-umsetzung.md`, `docs/beobachtungen.md` (Abschnitte REL-16, REL-17, TOOL-BUENDEL-3, Dashboard-Server, Budget-Zuordnung), `Makefile` Z. 32–33, 79–82, `tools/zeitreserve/reporter.ts` Z. 31, `tools/zeitreserve/check.ts` Z. 28, `docs/studio/STUDIO.md` Z. 367, 427–430, 463–465, R421, `gh run list --workflow CI --limit 8`, `git log c282def0..a9f5336e --first-parent`, `python3 tools/studio/metrics.py --efficiency` (43 Sessions). Zeiten in UTC (Event-Log), `git log` ist Ortszeit (+2 h). „HB“ = Heartbeat-Events. Nicht doppelt: Last bis 13 in der Parallelphase, Controller-Übergabe TOOL-BUENDEL-3, Doku-Konflikt `beobachtungen.md`, fehlendes `check-ci-perf` im Merge-Lauf und die Session-Ampel von 2cfa57e0 stehen in der [Kurz-Retro 2cfa57e0](2026-10-10-session-2cfa57e0-ende.md) (R459) und werden hier nicht neu bewertet.

## Befunde

### B1 · Lieferkette REL-16 und REL-17: lokal schnell, live erst 4 h später (Pflicht)

| Abschnitt                                              | Zeit (UTC)        | Dauer     | Warten / Übergabe / Doppelarbeit                                                                 |
| ------------------------------------------------------ | ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| Plan REL-16 + TOOL-BUENDEL-3, ein `lead-tech` opus     | 08:41:56–09:02:48 | 20,9 min  | ein Plan für zwei Pakete (114 HB), parallel zu Kurzdesign/Plan REL-17 und Brainstorming M13      |
| Kurzdesign REL-17 `lead-design`                        | 08:44:04–08:47:28 | 3,4 min   | R449                                                                                             |
| Plan REL-17 `lead-tech` opus                           | 08:48:36–09:04:04 | 15,5 min  | 73 HB                                                                                            |
| Gates Plan (`lead-qa`, je ein Start)                   | 09:03:34–09:05:33 | je ≈ 1min | R451, R453 BEDENKEN, Nacharbeit im Strang                                                        |
| Strang REL-16 (Controller `a0d5521`, sonnet)           | 09:05:27–09:14:20 | 8,9 min   | ein Umsetzer per Fortsetzung für T01–T03; Arbeiter-Ende → Controller-Zug je ≤ 1 s                |
| Release-Check REL-16 (Final-Review opus ‖ Playtest)    | 09:14:51–09:19:00 | 4,1 min   | ein `lead-qa`-Start; Playtest 3,7 min kritisch                                                   |
| R454 → Merge lokal REL-16                              | 09:20:45–09:23:18 | 2,5 min   | –                                                                                                |
| REL-17 wartet auf REL-16-Merge (Dateimatrix `app.ts`)  | 09:05:33–09:23:59 | 18,4 min  | gewollt (R449, R453); Controller startete 41 s nach Merge-Ende                                   |
| Strang REL-17 (Controller `ad08f9d`, sonnet)           | 09:23:59–09:40:19 | 16,3 min  | ein Umsetzer per Fortsetzung für T01–T04, 0 Lücken                                               |
| Release-Check REL-17 (Final-Review opus ‖ Playtest)    | 09:41:16–10:00:29 | 19,2 min  | Playtest 18,6 min kritisch (51 HB), Final-Review 3,7 min                                         |
| Auflage R458 (Doku-Konflikt) → Merge lokal REL-17      | 10:02:19–10:08:57 | 6,6 min   | Controller-Fortsetzung 3,4 min, Integrator 2,9 min (Konflikt: Kurz-Retro 2cfa57e0 B3)            |
| Ende-Routine 2cfa57e0 (Metriken, Kurz-Retro, state.md) | 10:10:11–10:47:18 | 37 min    | letzte Events der Session                                                                        |
| Pause bis neues Gespräch (`session_end` „clear“)       | 10:47:18–12:57:39 | 2 h 10min | Nutzer; kein Agent aktiv, keine Rechenzeit                                                       |
| Push-Gate Integrator `a5740a3` bis Push                | 12:59:56–13:28:55 | 29,0 min  | siehe B2; REL-15: 4,6 min                                                                        |
| CI (grün) → Pages (grün)                               | 13:28:49–13:35:38 | 6,8 min   | CI 6 min 07 s, im Rahmen der grünen Läufe der Vortage (4 min 51 s bis 6 min 00 s, `gh run list`) |

- Beobachtung: Plan bis lokaler Merge dauerte bei REL-16 41 min, bei REL-17 vom Kurzdesign an 1 h 25 min, davon 18,4 min gewolltes Warten auf REL-16. In beiden Strängen wurde ein Umsetzer per Fortsetzung durch alle Tasks geführt (Event-Log `message`/`agent_start` 09:08:46, 09:29:59, 09:32:31, 09:35:30), jedes Arbeiter-Ende folgte der Controller-Zug in derselben Sekunde. Vom lokalen Merge bis live vergingen bei REL-16 4 h 12 min, bei REL-17 3 h 27 min. Davon entfallen 2 h 10 min auf die Pause des Nutzers und 29 min auf das Push-Gate.
- Deutung: In der Lieferkette bis zum lokalen Merge gibt es keinen Engpass und keine Übergabe mit Informationsverlust. Die 18,4 min Block von REL-17 haben die Zeit bis live nicht verlängert, weil der Push ohnehin in der Folgesession lag (B3). Der einzige echte Ausreisser ist das Push-Gate (B2).

### B2 · Push-Gate 29 min statt ≈ 5 min: der parallele M13-E1-Strang lief mitten in die Messung (Pflicht)

Zeitachse aus dem Transkript `a5740a3`, ergänzt um die Testläufe der anderen Agenten:

| Zeit (UTC)        | Integrator                                                                                                                                    | Gleichzeitig im Repo (Bash-Befehle anderer Agenten)                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 13:00:01–13:00:23 | `tsc`, `lint`, `zeittests`, `conflicts` Exit 0                                                                                                | Gates M13-E1 (`lead-qa`, `lead-production`), Kurzdesign I-043, kein Testlauf                                              |
| 13:00:24–13:06:26 | `uptime` 5,21; Warteschleife `sleep 60` bis ≤ 4 (4,95 … 5,76 → 3,80)                                                                          | L0 startet Controller A M13-E1 (13:03:05) und Plan UI-GUT-CHIP (13:05:47); weiterhin kein Testlauf bis 13:07:20           |
| 13:06:29–13:09:06 | `make check` Exit 0, `uptime` beim Start 3,66                                                                                                 | T02 `a8c4180`: `npx vitest run tests/sim/save*.test.ts` 13:07:20, 13:08:00, 13:08:30; `make lint` 13:09:02                |
| 13:09:08–13:10:03 | `make zeitreserve-push` → `testlock: ABBRUCH, 1-min-Load 8.50 > 8` (Exit 2 #1); `check-ci-perf` Exit 0                                        | Reviewer T02 `ac685e5`: `tsc` 13:10:06                                                                                    |
| 13:10:05–13:10:51 | wartet bis 3,69, dann `zeitreserve-push` → „nicht belastbar, Last vor dem Lauf 7.4 > 4 (Ende 11.0)“ (Exit 2 #2)                               | Controller A prüft `ps aux \| grep vitest` und `uptime` (13:09:53, 13:11:14), sieht die Sperre frei                       |
| 13:10:54–13:28:41 | `sleep 90`, Warteschleife bis ≤ 3 (13,64 · 8,23 · … · 2,84), dann `make check` und `zeitreserve-push` Exit 0 (Messung 3,1); Load danach 7,78  | Controller A `make test` voll 13:11:21–13:13:04 (`test_passed` 461bfa67); T03/T04/T05/T09 und Reviewer: `vitest` je Datei |
| 13:20:55–13:21:20 | 5 Aufrufe Reibung: Bash-Grenze 600 s → Hintergrund; `sleep 400` blockiert; `Monitor` im Subagenten nicht verfügbar; `timeout` fehlt auf macOS | –                                                                                                                         |
| 13:28:44–13:35:45 | Push per Hash, CI beobachtet, Pages ausgelöst, Abschluss                                                                                      | –                                                                                                                         |

- Beobachtung (Ursache des 7,4): `loadStart` wird nicht beim Start von `make check` gemessen, sondern beim Erzeugen des Vitest-Reporters (`tools/zeitreserve/reporter.ts` Z. 31). `check-run` lässt davor `conflicts`, `lint` (ESLint und Prettier über das Repo) und `zeittests` laufen (`Makefile` Z. 82). In diesen ≈ 40 s startete T02 drei gezielte Vitest-Läufe im Worktree `m13-e1-sim`. Das `uptime` von 3,66 beim Start von `make check` sagte deshalb nichts über `loadStart`. `make check` gibt `loadStart` nicht aus, sichtbar wird der Wert erst im folgenden `zeitreserve-push`.
- Beobachtung (zweimal Exit 2): Der erste Exit 2 war nicht die Bewertung nach R394, sondern der Lastabbruch der Testsperre um `zeitreserve-push` (`Makefile` Z. 33, `node $(TESTLOCK) …`; Grenze 8 laut `STUDIO.md` Z. 427–430). `zeitreserve-push` liest nur `.studio/zeitreserve.json` und bewertet seit R438 V3 die aktuelle Last nicht (`Makefile` Z. 32: „aktuelle Last zählt nicht“). Der zweite Exit 2 war die richtige Bewertung der Messung mit 7,4. Das Warten davor (46 s, 1 Aufruf) konnte daran nichts ändern, denn die gespeicherte Messung ändert sich durch Warten nicht. Erst danach nahm der Integrator den richtigen Weg (neuer `make check`).
- Beobachtung (Grundlast): Zwischen 13:00 und 13:07 lief im Repo kein Testlauf, die Last lag trotzdem bei 4,4–5,8. L0 hat zum Session-Start notiert, dass der Dashboard-Server dauerhaft einen Kern belegt (`docs/beobachtungen.md`, Abschnitt Dashboard-Server; ≈ +1 Load). Der Rest der Grundlast ist aus den Logs nicht zuzuordnen.
- Beobachtung (Regeltext): Handbuch 1.42 verlangt „Load ≤ 4 vor `make check` abwarten“ (`STUDIO.md` Z. 367), R460 verlangt „Last ≤ 4 vor jedem vollen `make check`“ und „Gate Merge erst, wenn main gepusht ist (Push läuft)“. Keine Regel hält Testläufe anderer Stränge aus dem Fenster des Push-Gates fern. R421 hat das einmal ad hoc so entschieden („Das Werkzeug-Bündel startet erst nach grünem Push-Gate“). Die Testsperre schützt nur den einzelnen Lauf. In den Wartepausen des Integrators war sie frei, und der volle `make test` von Controller A lief genau dort.
- Kosten: 29 min statt ≈ 5 min bis zum Push (REL-15: 4,6 min). Ein `make check` mit ≈ 2,6 min war wertlos, etwa 21 min Warten, 23 statt ≈ 14 Tool-Aufrufe (9 vermeidbar: wertloser `make check`, zwei `zeitreserve-push` mit Exit 2, Warten ohne Wirkung, 5 Aufrufe Reibung). Die Tokenkosten sind klein (Integrator-Kontext Median 16k, Ampel), der Schaden ist die Wartezeit bis live.
- Deutung: Muster, kein Einzelfall. Der Push liegt nach R335 jetzt regelmässig am Anfang einer Session, und am Anfang startet L0 die neuen Stränge (B3). 5-Why: 29 min ← zwei volle Läufe und ≈ 21 min Lastwarten ← `loadStart` 7,4 und danach Last bis 13,6 ← der M13-E1-Strang lief mit Vitest und `make test` im Push-Fenster ← L0 startete Controller A um 13:03, während das Push-Gate lief ← **das Push-Gate ist keine geschützte Phase: Die Sperre gilt je Lauf, die Abfolge Warten → `make check` → `zeitreserve-push` hat Lücken, und die Startreihenfolge zum Session-Beginn regelt nichts dazu** (Hebel V1). Zwei Werkzeug-Schwächen kamen dazu: Die Testsperre um `zeitreserve-push` widerspricht R438 V3, und `make check` zeigt `loadStart` nicht an (Hebel V2). Die Dashboard-Grundlast verlängerte das erste Warten (Hebel V3). Die Reibung beim Warten im Subagenten ist eine Wissenslücke ohne Eintrag in `lernen.md` (Hebel V4).

### B3 · Zwei Releases in einem Push über die Session-Grenze: gewollt, kostet nur Wartezeit (Pflicht)

- Beobachtung: Session 2cfa57e0 hatte ihren einen Push nach R335 schon zu Beginn verbraucht (REL-15, R446, CI 38038270428 08:33). REL-16 (09:23), TOOL-BUENDEL-3 (09:44) und REL-17 (10:08) blieben deshalb nach R454, R457 und R458 lokal liegen, „Push mit der nächsten Studio-Session“. Die Folgesession 5a00a316 startete den Push 2 min 17 s nach `session_start` (12:57:39 → 12:59:56). Ein Push am Ende von 2cfa57e0 hätte REL-16/17 ≈ 2 h 10 min früher live gebracht, das ist genau die Pause des Nutzers. Er hätte aber einen zweiten CI-Lauf (≈ 6 Actions-Minuten bei roter Monatsampel, Retro REL-15) und ein zweites Push-Gate gekostet.
- Deutung: Die Verzögerung kostet keine Rechenzeit und keine Tokens. Sie fiel in eine Zeit, in der der Nutzer ohnehin nicht spielte. Die Ende-Routine sollte deshalb **nicht** pushen, R335 bleibt richtig. Kostspielig ist nur die Folge, die B2 zeigt: Der Push rutscht an den Session-Anfang, genau dorthin, wo L0 die Umsetzung startet. Kein eigener Vorschlag; V1 entschärft diesen Zusammenstoss.

### B4 · Parallele Stränge REL-16 / TOOL-BUENDEL-3 / REL-17: keine Doppelarbeit, ein vermeidbarer Block ohne Folgen

- Beobachtung: REL-16 und TOOL-BUENDEL-3 bekamen einen gemeinsamen Plan (eine opus-Instanz, 20,9 min). Die beiden Stränge liefen danach mit getrennten Controllern ohne gemeinsame Dateien. Die vollen Läufe lagen seriell: TOOL-BUENDEL-3 `make check` 09:31–09:34, REL-17 ab 09:37 (Event-Log `agent_stop` „warte auf das Ende des `make check`“). REL-17 war auf Paketebene bis zum REL-16-Merge blockiert. T01 (`src/ui/problems.ts`, neue reine Datei, Handoff UI-PROBLEM-SPRUNG) berührt `app.ts` nicht und hätte um 09:06 starten können. Der Studio-Deckel ≤ 8 (R424) war zwischen 09:07 und 09:10 mit 6–7 aktiven Agenten fast voll (Spawn-Liste: 2 Controller, 3 Umsetzer, Spec-Autor, Reviewer).
- Deutung: Keine Doppelarbeit. Ein Block auf Task-Ebene hätte REL-17 lokal um bis zu 18 min früher fertig gemacht, aber wegen des Pushs in der Folgesession 0 min früher live. Zudem hätte er den Deckel überschritten. Einzelfall, kein Vorschlag.

### B5 · Aus den Logs: Messbarkeit der Budgets und eine Lese-Lücke beim Controller

- Beobachtung: (a) Controller A M13-E1 prüfte vor seinem `make test` zweimal die laufenden Prozesse und die Last (13:09:53, 13:11:14). Er handelte also lastbewusst, wusste aber nicht, dass ein Push-Gate lief. Das Briefing und R460 nannten nur „Push läuft“ als Bedingung für das Gate Merge. (b) Die Budget-Zuordnung über die Kopfzeile `Paket: M13-E1 — UI-Strang …` meldete „lead-tech 2 von 1“ (L0-Eintrag Budget-Zuordnung). Damit ist die Ampelzeile für parallele Controller eines Pakets falsch rot.
- Deutung: (a) gehört zu B2/V1: Eine Startregel braucht kein zusätzliches Wissen im Briefing. (b) ist ein Werkzeugfehler, der die Messbarkeit der Budgets verschlechtert. Er ist von L0 schon als Kandidat für das Werkzeug-Bündel eingetragen, deshalb kein eigener Vorschlag. Er passt in dasselbe Bündel wie V2.

### B6 · Positiv

- Die Controller führten je Strang einen Umsetzer per Fortsetzung durch alle Tasks, mit 0 Polling-Lücken (R438 V1 hält). Jeder Release hatte einen `lead-qa`-Start (R429 V3: REL-16 `a11bb50`, REL-17 `a096a5c`). Im Push-Gate liefen kein `make test`, der Push per Hash und `check-ci-perf` mit Exit-Code (R429 V2, R459 V2). Der HOTFIX-CI-01 wirkt: CI ist grün. Die sechs L0-Commits nach `a9f5336e` gingen korrekt nicht mit (`ahead 6`). Der Integrator erkannte den Lastabbruch selbst, ohne Rückfrage an L0.

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 43 Sessions). Die Session 2cfa57e0 hat die Kurz-Retro R459 bewertet, die Session 5a00a316 läuft noch. Hier steht der Beitrag von REL-16/17 und Push.

| Kennzahl                 | Historie           | Ampel      | Befund / Ursache                                                                                                                                                                       | Hebel oder Messauftrag mit Frist                                   |
| ------------------------ | ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Steuerungsanteil         | 51,7 % (ber. 44,9) | rot (gelb) | Beobachtung: Beide Release-Pläne liefen auf opus (REL-16+TB3 114 HB, REL-17 73 HB); Controller und Release-Checks sind schlank (Controller 6–25 HB)                                    | E-054 (Pläne auf sonnet) läuft seit R459/R461; kein weiterer Hebel |
| Cache-Write 5 min        | 28,7 %             | rot        | Beobachtung: Das Push-Gate wartete ≈ 21 min. Seine Warteschleifen liegen innerhalb eines Bash-Aufrufs, deshalb gibt es keine Neuschreibung je Pause. Die Pause des Nutzers ist gewollt | V1 kürzt die Wartezeit; Messauftrag R433 (2026-11-19) bleibt       |
| L0-Kontext Max           | 774k               | rot        | Historienwert (Kurz-Retro 2cfa57e0 B6: Session-Max 304k)                                                                                                                               | Messauftrag R443 V2 (2026-10-23) bleibt                            |
| opus-Anteil              | 71,4 %             | gelb       | Beobachtung: 2 Pläne, 1 Kurzdesign und 2 Final-Reviews auf opus für zwei S-Releases                                                                                                    | E-054; kein weiterer Hebel                                         |
| Grösste Datei            | 66,7 KB            | gelb       | Historienwert, kein Beitrag dieser Releases                                                                                                                                            | keiner nötig                                                       |
| Budget-Ampel (Zuordnung) | –                  | –          | B5 (b): falsches Rot „2 von 1“ bei parallelen Controllern                                                                                                                              | Werkzeug-Kandidat (L0-Eintrag), mit V2 bündeln                     |
| übrige Zeilen            | –                  | grün       | –                                                                                                                                                                                      | –                                                                  |

## Befragung der Leads

- Nicht befragt (Release-Retro, ein Start). Quellen: Ruling-Texte, Event-Log, Handoffs und Transkripte.

## Vorschläge

Höchstens 4, nach Hebel sortiert. Eintrag in `experimente.md` erst nach einem Ruling.

### V1 · Push-Gate zuerst: keine Testläufe anderer Stränge bis `zeitreserve-push` Exit 0

- Hypothese: Der Abschnitt „Session-Start“ in `STUDIO.md` (und das Push-Muster in R335/R421) bekommt einen Satz: „Liegt ein Push an, startet L0 bis `make zeitreserve-push` Exit 0 keine Umsetzer und keinen Controller; Gates, Kurzdesigns und Pläne ohne Testläufe dürfen parallel laufen.“ Das macht die Ausnahme aus R421 zur Regel. Es braucht kein neues Werkzeug und kein neues Wissen im Briefing. Das lastkritische Fenster dauert ruhig ≈ 5 min (REL-15: 4,6 min).
- Erwartete Einsparung: hier ≈ 21 min Wartezeit bis live, ein voller `make check` (≈ 2,6 min Rechenzeit) und ≈ 9 Integrator-Aufrufe. Dafür startet der erste Controller ≈ 5–8 min später. Im Gegenzug entfällt für die Umsetzer das Risiko, dass `make test` an der Sperre scheitert.
- Messgrösse: Integrator-Start → `zeitreserve-push` Exit 0 ≤ 8 min, und zweiter `make check` = 0 in den nächsten 3 Push-Gates (Ausgang 29 min, 1 zweiter Lauf).
- Messbarkeit: Event-Log (`spawn` des Integrators, erster `spawn` eines Umsetzers) und `test_passed` mit Commit = Push-Hash, ohne Transkript lesbar.
- Rückfall: Satz streichen; Push wieder parallel zum Strang-Start.
- Aufwand: klein (studio-coach, Handbuch-Minor ein Satz; L0 hält sich beim nächsten Start daran).
- Betroffene Regel: `STUDIO.md` Session-Start und Merge/Push (Z. 367, 463–465), R335, R421, R460 Auflage 5.

### V2 · Werkzeug: `zeitreserve-push` ohne Lastabbruch, `make check` zeigt `loadStart`

- Hypothese: (a) `zeitreserve-push` läuft ohne die Testsperre (`Makefile` Z. 33), denn es liest nur die Messdatei, und R438 V3 schliesst die aktuelle Last schon aus. (b) `make check` gibt am Ende eine Zeile `zeitreserve: loadStart <x>` aus, bei > 4 mit dem Zusatz „für Push nicht belastbar, `make check` ruhig wiederholen“. Der Integrator sieht den Wert dann nach dem Lauf statt erst nach dem nächsten Schritt. Streichen und Sichtbarmachen, keine neue Prüfung.
- Erwartete Einsparung: je Fall ein Exit 2 durch die Sperre (hier ≈ 1 min und 1 Aufruf) und ein Warten ohne Wirkung (46 s, 1 Aufruf). Wichtiger ist, dass das Muster „Last war bei Start ok, Messung trotzdem ungültig“ ohne Raten erkennbar wird.
- Messgrösse: Exit 2 mit `testlock: ABBRUCH` in `zeitreserve-push` = 0, und `zeitreserve-push`-Aufrufe je Push-Gate = 1 in den nächsten 3 Push-Gates (Ausgang 1 bzw. 3).
- Messbarkeit: Integrator-Bericht (Exit-Codes sind nach R459 V2 Pflicht) und Transkript.
- Rückfall: Sperre wieder um `zeitreserve-push`; Ausgabezeile entfernen.
- Aufwand: klein (lead-tech, ≈ 10 Tools, eine Makefile-Zeile, eine Ausgabe im Reporter); passt ins nächste Werkzeug-Bündel zusammen mit dem Dashboard-Fix und der Budget-Zuordnung.
- Betroffene Regel: `Makefile` Z. 32–33, `tools/zeitreserve/`, R394, R438 V3, `STUDIO.md` Z. 427–430.

### V3 · Dashboard-Server-Fix vor dem nächsten Push-Gate, mit Grundlast-Messung

- Hypothese: Der L0-Eintrag „Dashboard-Server 100 % CPU“ wird im nächsten Werkzeug-Bündel als erster Task umgesetzt und nicht nur „vorgezogen“ notiert. Bis dahin beendet der Integrator den Server vor dem Push-Gate nicht selbst, denn es ist ein fremder Prozess. L0 stoppt ihn per `make studio-stop`, wenn er nicht gebraucht wird. Die Grundlast ohne Testlauf lag hier bei 4,4–5,8, also über der Grenze 4.
- Erwartete Einsparung: ≈ 1 Load-Punkt Dauerlast. Hier hätte das erste Warten (6 min) wahrscheinlich ≤ 1 min gedauert (nicht belegt, die übrige Grundlast ist unbekannt). Es wirkt auf jede Perf- und Ruckel-Messung (R329).
- Messgrösse: `uptime` beim Start des Push-Gates ohne laufenden Testlauf ≤ 3,5 in den nächsten 3 Push-Gates (Ausgang 5,21); CPU des Servers im Leerlauf < 5 %.
- Messbarkeit: erstes `uptime` im Integrator-Transkript und `ps -o %cpu` auf den Server-Prozess.
- Rückfall: keiner nötig (Fehlerbehebung).
- Aufwand: klein bis mittel (lead-tech, Ursache im Ereignis-Strom von `tools/studio/server.py` suchen).
- Betroffene Regel: keine; Werkzeug `tools/studio/server.py`.

### V4 · Eine Zeile in `lernen.md`: lange Wartezeiten im Subagenten

- Hypothese: `lernen.md` bekommt die Falle: „Im Subagenten gibt es kein `Monitor`, auf macOS kein `timeout`, `sleep` mit nachfolgendem Befehl wird blockiert, und Bash bricht nach 600 s in den Hintergrund ab. Läufe über ≈ 9 min startet man mit `run_in_background: true` und wartet auf die Benachrichtigung. Warteschleifen bleiben unter 9 min.“ Damit entfallen fünf Fehlversuche je Fall.
- Erwartete Einsparung: hier 5 Aufrufe; die Falle trifft jede Rolle mit langen Läufen (Integrator, Playtester, Controller).
- Messgrösse: `tool_use_error` mit „No such tool available: Monitor“ oder „timeout: command not found“ in Subagenten-Transkripten = 0 bis 2026-11-10 (Ausgang 2 in diesem Push-Gate).
- Messbarkeit: Transkripte per Skript durchsuchbar, wie in dieser Retro.
- Rückfall: Zeile streichen.
- Aufwand: sehr klein (studio-coach, eine Zeile).
- Betroffene Regel: `docs/studio/lernen.md`; die Persona `production-integrator` bleibt unverändert.

Empfehlung: V1 annehmen, denn er beseitigt die Wurzelursache aus B2 ohne Werkzeug. V2 und V3 mit der Budget-Zuordnung (B5 b) als nächstes Werkzeug-Bündel annehmen, V3 als erster Task. V4 annehmen, er kostet fast nichts. Für B3 (Push über die Session-Grenze) und B4 (Block auf Paketebene) gibt es bewusst keinen Vorschlag.

## Bewertung laufender Experimente

- R438 V3 (`zeitreserve-push` bewertet nur `loadStart`): 2 von 3 Push-Gates. Exit 2 = 2, davon 1 durch die Testsperre (Widerspruch zu V3, siehe V2) und 1 durch eine echte Messung bei 7,4. Die Ursache liegt ausserhalb der Regel (B2).
- Handbuch 1.42 / R450 V4 (a) „Load ≤ 4 vor `make check`“: eingehalten (3,66), reicht aber nicht, weil `loadStart` erst ≈ 40 s später gemessen wird (B2). (b) „Pages bei roter CI“: nicht eingetreten, CI war grün.
- R429 V2 (Push-Gate ohne `make test`, Push per Hash): 3 von 3 erfüllt.
- R429 V3 (ein `lead-qa`-Start je Ein-Paket-Release): REL-16 und REL-17 je ein Start, ohne Release-Fund nach dem Push.
- R459 V2 / E-058 (Integrator-Briefing nennt `make check` und `check-ci-perf` mit Exit-Code): im Push-Gate erfüllt (`check-ci-perf` Exit 0, 341 Tests).
- R438 V1 (kein Polling): 0 Lücken in 3 Strängen (REL-16, REL-17, TOOL-BUENDEL-3).

## Änderungen an lernen.md

- keine (Sache des studio-coach nach einem Ruling; Vorschlag V4)
