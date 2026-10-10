# Retro meilenstein release-rel14 — 2026-10-10

- Datum: 2026-10-10
- Art: meilenstein (Release-Retro nach R127/R316)
- Auslöser: Push REL-14 und Werkzeug-Bündel `46153c6..9eb99e7`, CI 38031718801, Pages 38031921572 (R436); Vorfall `meilenstein:REL-14`; L0-Schwerpunkte Lieferkette, R434, Push-Gate 1.37, Laufzeit `zeittests`/`zeitreserve-push`
- Datenbasis: `docs/studio/rulings.md` R427–R436 (R421–R426 nur als Bezug), `.studio/events.jsonl` (Session `c64c0775` ab 2026-10-09 19:50, per Skript gefiltert), `.studio/archiv/briefings/20261010-063107-lead-production-J7HnD6DM.md` und `…-063510-production-integrator-wQ929Fwu.md`, Transkripte der Controller `a289c5`, `a97a0f`, `ac5cff`, `a7d6b9` und des Integrators `a580b7` (Claude-Projektordner, `subagents/`), `git log 46153c6..9eb99e7`, `Makefile` Z. 17–35, 76–79, `tools/zeitreserve/check.ts`, `tools/zeitreserve/rule.ts` Z. 116–149, `.worktrees/integrate/.studio/zeitreserve.json`, `docs/studio/STUDIO.md` Z. 46, 60–69, 276–277, 362, 454–456, `python3 tools/studio/metrics.py --efficiency` (Historie, 40 Sessions) und `--sessions 1`. Zeiten in UTC (Event-Log); `git log` ist Ortszeit (+2 h). „HB“ = Heartbeat-Events, Näherung für Tool-Aufrufe. Nicht doppelt: Budgetzählung „lead-tech 3 von 1“, Schätzung in Tools und Handoff-Namen (Kurz-Retro `2026-10-09-session-c64c0775-ende.md`, R433 V3) werden nur zitiert.

## Befunde

### B1 · Lieferkette REL-14: Kurzdesign bis lokaler Merge 45 min, bis live 10 h 46 min (Pflicht)

| Abschnitt                                         | Zeit (UTC)        | Dauer      | Warten / Übergabe / Doppelarbeit                                                                                                         |
| ------------------------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Kurzdesign `lead-design`                          | 19:58:15–20:00:25 | 2 min      | R424 um 20:00:49                                                                                                                         |
| Plan `lead-tech` (opus, 77 HB)                    | 20:01:08–20:13:25 | 12 min     | parallel zu Plan Werkzeug-Bündel und Push-Gate REL-13                                                                                    |
| Kombiniertes Gate `lead-qa` (sonnet, 6 HB)        | 20:13:44–20:14:26 | 0,7 min    | R427 20:14:44; Nacharbeit durch den Controller ohne Zweitprüfung                                                                         |
| T01 ‖ T02 mit Reviews                             | 20:16:11–20:20:19 | 4 min      | T01 1,5 min, T02 3,3 min, Reviews je ≤ 0,5 min                                                                                           |
| T03 (T01-Arbeiter fortgesetzt) + Review, T04      | 20:20:24–20:24:55 | 4,5 min    | T03 seriell nach T01 (gleicher Worktree), T04 Browser-Check 2 min                                                                        |
| Controller-Bericht an L0                          | 20:24:55–20:29:04 | 4 min      | –                                                                                                                                        |
| Kandidat (`lead-production` → Integrator)         | 20:29:28–20:33:05 | 3,6 min    | `make check` 131 s                                                                                                                       |
| Release-Check `lead-qa` (Final-Review ‖ Playtest) | 20:33:30–20:42:05 | 8,6 min    | Final-Review opus 1,8 min, Playtest 6,8 min (kritischer Pfad), `check-ci-perf` 53 s; **ein** `lead-qa`-Start                             |
| R430 → Merge lokal                                | 20:42:05–20:43:19 | 1,2 min    | nur `tsc`, `lint`, `conflicts`                                                                                                           |
| Warten auf Push (R335, Session-Ende)              | 20:43:19–06:31:07 | 9 h 48 min | Nutzer abwesend; L0-Schlussturn 21:20:31–22:57:23 97 min ohne Tool-Aufruf (Ursache unbelegt, Einzelfall, ohne Wirkung auf die Lieferung) |
| Lastwarten `lead-production` (Load 26 → 3,5)      | 06:31:18–06:35:10 | 3,9 min    | Time Machine (Bericht `lead-production`)                                                                                                 |
| Push-Gate Integrator                              | 06:35:10–06:39:53 | 4,7 min    | siehe B4                                                                                                                                 |
| CI + Pages                                        | 06:39:57–06:44:17 | 4,3 min    | grün beim ersten Versuch                                                                                                                 |

- Beobachtung: Vom Kurzdesign bis zum lokalen Merge vergingen 45 min (I-028/REL-13: 6 h 08 min bis live, Retro REL-13 B4). Der Release-Check lief in einem `lead-qa`-Start ohne separates Gate Merge (Sinn von R429 V3, obwohl REL-14 zwei Pakete hatte). Doppelarbeit: `make check-ci-perf` lief im Release-Check (20:41, 53 s) und im Push-Gate (06:38:59, 52 s). Dazwischen änderten sich unter `src/` und `tests/` nur zwei Dateien ohne Perf-Budget (`git diff --stat a04b79d 9eb99e7 -- src tests`: u. a. `tests/tools/testlock.test.ts`, +68 Zeilen). Volle `make check` auf REL-14-Code: Kandidat und Push-Gate. Dazu kommen je Strang des Werkzeug-Bündels einer (R432) und einer nach dessen Merge.
- Deutung: In der Lieferkette selbst gibt es keinen Engpass mehr. Die 9 h 48 min Wartezeit bis zum Push sind gewollt (R335, Nutzer abwesend) und kosten keine Rechenzeit. Das doppelte `check-ci-perf` kostet 53 s je Release. Es ist zu klein für eine Regel und wird hier nur festgehalten. Die zwei `make check` folgen aus Verfassung §7.1/§7.2 (Retro REL-13 B4) und sind kein Hebel für L0.

### B2 · Werkzeug-Bündel: drei Controller-Instanzen, eine davon vermeidbar, 8,4 min Leerlauf durch Polling (Pflicht)

| Abschnitt                                | Zeit (UTC)        | Dauer   | Befund                                                                                        |
| ---------------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------- |
| Gate Plan `lead-qa` ‖ `lead-production`  | 20:18:16–20:20:10 | 1,9 min | R428 20:20:34                                                                                 |
| Controller 1 `a97a0f` (T01, T02, T04)    | 20:20:48–20:31:10 | 10 min  | Ende nach 6 Arbeiter-Starts (`STUDIO.md` Z. 276–277), Kontext max. 132k                       |
| Controller 2 `ac5cff` (T03+T05)          | 20:31:31–20:42:08 | 11 min  | Ende, weil T06 blocked-by Merge REL-14 (R428 prod B4); Kontext max. 74k                       |
| Merge REL-14 lokal (Blocker gelöst)      | 20:43:19          | –       | 71 s nach dem Ende von Controller 2                                                           |
| Controller 3 `a7d6b9` (T06, T07, Fix)    | 20:43:47–21:03:53 | 20 min  | Neustart 99 s nach Controller 2; Leerlauf 20:50:21–20:58:43; Cache-Write 246k bei 72k Kontext |
| Gate Merge R432 → Merge der drei Stränge | 21:03:53–21:10:16 | 6,4 min | ein `make check`                                                                              |

- Beobachtung (Instanzwechsel): Controller 2 endete um 20:42:08 mit „Die Meldung ‚REL-14 auf main gemergt‘ kam nicht“. L0 startete um 20:43:47 eine neue Instanz, obwohl das Handbuch die Fortsetzung erlaubt („Kontext unter 60k oder seit dem letzten Aufruf weniger als 5 min“, `STUDIO.md` Z. 67–68). Hier lagen 99 s dazwischen.
- Beobachtung (Leerlauf): Das Final-Review T07 (`a718d4`) war um 20:50:04 fertig, `agent_stop` folgte um 20:50:24. Controller 3 fragte ab 20:50:14 per Schleife das Alter von `tasks/a718d46fce8da445d.output` ab (`stat -f %m $f`, 50 × 10 s, Abbruch bei Alter < 20 s). Die Datei ist ein Symlink (`ls -la` im Ergebnis 20:58:43). `stat` ohne `-L` liest das Datum des Symlinks (22:46 Ortszeit), die Bedingung wurde nie wahr. Die Schleife lief bis zum Timeout, die Fix-Runde startete um 20:58:58. Alle 16 Arbeiter-Starts der vier Controller in dieser Session übergaben `"run_in_background": "false"` als Zeichenkette, und alle 16 meldeten „Async agent launched“. Die Vordergrund-Regel (`STUDIO.md` Z. 46, `lead-tech.md` Z. 69) war damit in keinem Fall wirksam. Polling auf `tasks/*.output` steht in Transkripten von drei `lead-tech`-Instanzen aus drei Sessions (`9b13950a`, `e51712dd`, `c64c0775`).
- Wirkung: 1 vermeidbarer Lead-Start (Startkontext `lead-tech` ≈ 29k laut Ampel, dazu Neuorientierung im Handoff), 8,4 min Wanduhr auf dem kritischen Pfad des Bündels. Der Cache lief ab (5-min-Fenster): 246k Cache-Write in einer Instanz mit 72k Höchstkontext.
- Deutung: Muster. 5-Why zum Leerlauf: Fix-Runde 8,4 min zu spät ← Polling-Schleife lief bis zum Timeout ← die Bedingung prüfte das Datum des Symlinks ← der Controller pollte überhaupt, weil der Arbeiter im Hintergrund lief ← die Vordergrund-Regel greift nicht (Zeichenkette statt Boolean, oder das Werkzeug startet Subagenten ohnehin asynchron; das ist nicht geklärt) ← **die Regel beschreibt einen Startmodus, den niemand prüft, und es gibt keine Regel für das Warten auf asynchrone Arbeiter.** Die Benachrichtigung beim Ende des Arbeiters weckt den Controller ohnehin: `a289c5` wurde so 6-mal ohne Polling fortgesetzt. 5-Why zum Instanzwechsel: neue Instanz ← L0 wendet die Ausnahme „< 5 min“ nicht an ← der Normalfall in E-042 ist „neuer Lead“, die Fortsetzung ist die Ausnahme ← der Controller meldet einen Blocker wie einen Abschluss (Zwischenbericht, `done`) ← **E-042 unterscheidet nicht zwischen „fertig“ und „wartet auf ein Ereignis in Minuten“.** Die Abhängigkeit T06 → Merge REL-14 bestand nur wegen der Anhänge an `docs/beobachtungen.md` und `.gitignore` (R427, R428). Ein Union-Merge für reine Anhang-Dateien würde sie auflösen. Das ist ein Nebenweg, kein Vorschlag hier.

### B3 · R434 neue Studio-Session im selben Gespräch: wirksam, aber teurer L0-Kontext und nicht messbar wie verlangt (Pflicht)

- Beobachtung (Wirkung): „mach weiter“ um 06:30:22, REL-14 live um 06:44:17, also nach 14 min. Ohne R434 hätte der Push dieser Claude-Session (REL-13, 20:05) die Grenze aus R335 schon verbraucht. REL-14 wäre frühestens mit REL-15 live gegangen. Der Push lief per Hash `9eb99e7:main`. Die vier L0-Commits während des Push-Gates (`c649660`, `4cab58b`, `e19b61a`, `f407f97`, 06:32:53–06:33:55) gingen nicht mit, ohne dass ein Nachtrag nötig war. Damit hat R429 V2 die Lücke aus Retro REL-13 B2 geschlossen.
- Beobachtung (Risiko R335): R335 ist ein Nutzerentscheid wegen des Minutenverbrauchs (R333). Es gab zwei Pushes in 10 h 35 min unter derselben Claude-Session-ID (20:05 und 06:39), je CI 3 min 25 s und Pages ≈ 45 s. `docs/studio/warteschlange.md` hat keinen Eintrag zu R434/R335. Der Handbuch-Minor folgte im selben Zug (`STUDIO.md` Z. 454–456, `c649660`).
- Beobachtung (Kosten L0): Die erste L0-Antwort der neuen Studio-Session las 241k Kontext und schrieb 215k in den Cache neu (06:30:34). Der Cache war über Nacht abgelaufen. Danach lief jede L0-Nachricht auf ≥ 241k, bis 283k (06:48:37, Ampel gelb > 250k). Ein frisches Gespräch startet bei ≈ 60k (Ampel, Start-Kontext L0).
- Beobachtung (Messbarkeit): R434 verlangt Metriken „ab dem Zeitpunkt dieses Rulings“. `metrics.py` kennt nur `--session`, `--milestone`, `--efficiency` und `--sessions` (`--help`). `--efficiency --sessions 1` mischt beide Studio-Sessions (50 Agenten, 959 Aufrufe).
- Deutung: In der Sache positiv, das Missbrauchsrisiko für R335 ist gering. Die Ende-Routine kostet ≈ 10 min und einen `studio-coach`-Start (21:10–21:20), eine Session-Grenze ist also nicht billig zu haben. Zwei echte Kosten bleiben. Erstens trägt L0 den Kontext der Vorsession mit: rund 4-mal so viel je Nachricht wie bei einem frischen Gespräch, solange die Session läuft. Zweitens ist die eigene Wirkung von R434 nicht messbar, weil das Werkzeug die Grenze nicht kennt. Das verletzt den Massstab „kein Vorschlag verschlechtert die Messbarkeit seiner eigenen Wirkung“. R434 präzisiert einen Nutzerentscheid. Für die Rangfolge ist das zulässig, der Nutzer sollte aber davon wissen (Kenntnis, kein Vorbehalt).

### B4 · Push-Gate nach Handbuch 1.37: 4,7 min, ein Testlauf; der Lastabbruch ist vorhersehbar; keine Prüflücke bei < 0,2 s (Pflicht)

- Beobachtung (Ablauf, Transkript `a580b7`): `tsc` 4 s, `lint` 16 s, `zeittests` 0,086 s, `conflicts`, `make check` 06:35:44–06:37:59 (≈ 135 s, Load beim Start 2,81). Danach `zeitreserve-push` um 06:38:01: Exit 2 „nicht belastbar, Last 6.5 > 4“ nach 0,187 s. Schleife bis Load ≤ 4 (06:38:05–06:38:55), zweiter Lauf um 06:38:56 grün (2864 Tests, 0 ohne Reserve). `check-ci-perf` 52 s, Push 06:39:53. Integrator-Start bis Push 4 min 43 s (REL-13: ≈ 8 min). Ein voller Vitest-Lauf (REL-13: zwei). Kein L0-Nachtrag. R429 V2 ist im ersten von drei Push-Gates erfüllt.
- Beobachtung (Abbruch): Die Messdatei `.worktrees/integrate/.studio/zeitreserve.json` (geschrieben 06:37 vom Testschritt in `make check`) hat `commit` = `9eb99e7` = HEAD, `loadStart` 2,6, `loadMax` 8,9. `check.ts --push` prüft zwei Lasten: die Last der Messung (`measurementProblem`, `rule.ts` Z. 141–149: bewertet wird nach R394 nur die Last vor dem Lauf) und zusätzlich die aktuelle 1-min-Last beim Aufruf (`check.ts` Z. 52–57). Die aktuelle Last liegt direkt nach `make check` regelmässig über 4, weil `make check` sie selbst erzeugt (hier 6,5). Das Briefing schreibt deshalb „warten bis Last ≤ 4“ vor.
- Antwort auf die Prüffrage < 0,2 s: korrekt, keine Prüflücke. `make zeittests` ist eine statische grep-Prüfung (`Makefile` Z. 17–23) und startet keine Tests. `make zeitreserve-push` startet ebenfalls keine Tests. Es liest die gespeicherte Messung und prüft Commit = HEAD und `loadStart` ≤ 4. Dann rechnet es die 2864 Zeiten gegen Faktor 4 und den Runner-Faktor 3. Die 0,187 s waren der Exit-2-Pfad, der grüne Lauf brauchte ≈ 1 s.
- Deutung: 5-Why zum Abbruch: Exit 2 ← aktuelle Last 6,5 ← die eigene `make check` hatte sie gerade hochgetrieben ← `--push` bewertet neben der Messung auch die Last beim Aufruf ← die Prüfung stammt aus der Zeit, als die Messung keine Last enthielt (R353). Mit `loadStart` (R394) kam der neue Schritt hinzu, und der alte blieb stehen ← **dasselbe Muster wie Retro REL-13 B4: Ein Schritt wird ergänzt, ohne den Vorgänger zu streichen.** Die aktuelle Last beeinflusst eine reine Dateiauswertung nicht. Kosten je Push-Gate ≈ 1 min Wanduhr und 2–3 Tool-Aufrufe, bei jedem Push-Gate, weil `make check` immer vorausgeht. Nebenbefund: Der Kopfkommentar von `check.ts` (Z. 2–3: „Last > 4 während des Laufs“) widerspricht `rule.ts` Z. 141 (ausserhalb Scope, Bericht).

### B5 · Positiv

- REL-14 und Werkzeug-Bündel sind live, CI und Pages beim ersten Versuch grün. R429 V1 wirkt: R429–R436 enthalten alle die Felder „Regelbezug“ und „Kosten bei Irrtum“ (8 von 8). In R427–R436 gibt es keine Guard-Sperre aus einem Briefing. Das Aufräumen von see-f3 (R436) lief ohne `--force` in 10 s. R420 V3 wirkt: Die grösste gelesene Datei der Session ist 26,4 KB (Historie 66,7 KB). Push-Gate, REL-15-Kurzdesign, REL-15-Plan und TOOL-AKTIVIERUNG liefen parallel ohne Lastkonflikt im Gate (Load beim Start von `make check` 2,81).

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 40 Sessions) und `--sessions 1` (Session `c64c0775` gesamt, beide Studio-Sessions gemischt, siehe B3). Die Session-Zeilen hat die Kurz-Retro c64c0775 bewertet. Hier steht nur der Beitrag von REL-14 und Bündel.

| Kennzahl          | Historie / Session | Ampel       | Befund / Ursache                                                                                                                                                                                                                 | Hebel oder Messauftrag mit Frist                                                                  |
| ----------------- | ------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Steuerungsanteil  | 51,1 % / 75,1 %    | rot / rot   | Beobachtung: Die Arbeiter in REL-14 brauchten 1,5–3,3 min (T01 20 HB, T02 12 HB). Dagegen standen zwei opus-Pläne (77 und 69 HB), 4 Controller-Instanzen und L0. Bei Stufe leicht ist Steuerung strukturell teurer als Umsetzung | V2 (ein Lead-Start weniger je Blocker), E-054 eingereiht (R433), E-049 läuft; kein weiterer Hebel |
| Umsetzeranteil    | 23,3 % / 5,4 %     | grün / rot  | dieselbe Ursache                                                                                                                                                                                                                 | Messauftrag R433 (2026-10-23) bleibt                                                              |
| Cache-Write 5 min | 29,0 % / 21,1 %    | rot / gelb  | Beobachtung: 8,4 min Polling-Leerlauf (B2) und 215k Neuschreibung beim L0-Start nach der Nacht (B3)                                                                                                                              | V1, V4; Messauftrag R433 (2026-11-19) bleibt                                                      |
| L0-Kontext Max    | 774k / 283k        | rot / gelb  | Beobachtung: Die neue Studio-Session startete mit 241k L0-Kontext (B3)                                                                                                                                                           | V4                                                                                                |
| opus-Anteil       | 71,8 % / 73,2 %    | gelb / gelb | Beobachtung: Plan REL-14 und Plan Bündel auf opus (R422), zwei Final-Reviews auf opus (R427, R428), L0                                                                                                                           | E-054 (Pläne Stufe leicht auf sonnet), eingereiht (R433); kein weiterer Hebel                     |
| Grösste Datei     | 66,7 KB / 26,4 KB  | gelb / grün | Historienwert; in dieser Session wirkt R420 V3                                                                                                                                                                                   | keiner nötig                                                                                      |
| übrige Zeilen     | –                  | grün        | –                                                                                                                                                                                                                                | –                                                                                                 |

## Befragung der Leads

- Nicht befragt (Release-Retro, ein Start). Quellen: Ruling-Texte, Event-Log, archivierte Briefings und Transkripte.

## Vorschläge

Höchstens 4, nach Hebel sortiert. Eintrag in `experimente.md` erst nach einem Ruling.

### V1 · Warten auf Arbeiter nur per Benachrichtigung; Vordergrund-Regel prüfen oder streichen

- Hypothese: Ein Controller beendet nach dem Start der Arbeiter seinen Zug und wartet auf die automatische Benachrichtigung. Er pollt keine `tasks/*.output`-Dateien (B2). Ein Satz in `STUDIO.md` Z. 46 und in `lead-tech.md` Z. 69 ersetzt die Vordergrund-Regel. Vorher eine Probe: Ein Start mit Boolean `false` statt Zeichenkette zeigt, ob ein Vordergrundstart überhaupt möglich ist. Wenn nicht, wird die Regel gestrichen statt ergänzt.
- Erwartete Einsparung: je Fall bis 8,4 min Wanduhr auf dem kritischen Pfad und eine Cache-Neuschreibung des Controller-Kontexts (hier ≈ 70k). Dazu entfällt eine Regel, die in 16 von 16 Starts nicht griff.
- Messgrösse: Lücken > 2 min zwischen `agent_stop` eines Arbeiters und dem nächsten Heartbeat seines Controllers = 0 in den nächsten 3 Controller-Paketen (Ausgang: 1 Lücke, 8,4 min). Transkripte mit Polling auf `tasks/*.output` = 0 (Ausgang: 3 `lead-tech`-Instanzen in 3 Sessions).
- Messbarkeit: Beides ist aus Event-Log und Transkripten per Skript zählbar, wie in dieser Retro.
- Rückfall: Vordergrund-Regel wieder im alten Wortlaut.
- Aufwand: klein (Probe ≈ 5 Tools; studio-coach: zwei Sätze).
- Betroffene Regel: `STUDIO.md` Vordergrund-Regel und lange Bash-Läufe (E-037), `.claude/agents/lead-tech.md` Z. 69–71.

### V2 · Controller mit Blocker meldet `waiting` und wird fortgesetzt, nicht ersetzt

- Hypothese: Endet ein Controller nur, weil er auf ein Ereignis wartet (Merge, Gate, Freigabe), meldet er `waiting` statt eines Zwischenberichts mit `done`. L0 setzt **denselben** Lead per `SendMessage` fort, sobald das Ereignis eintritt. Das ist der Normalfall der vorhandenen E-042-Ausnahme, keine neue Regel. Bei REL-14 hätte Controller 2 (74k) 99 s später weiterlaufen können (B2).
- Erwartete Einsparung: je Fall ein Lead-Start (Startkontext ≈ 29k) und die Neuorientierung über das Handoff.
- Messgrösse: neue Controller-Instanzen, deren Vorgänger < 5 min vorher mit einem Blocker endete, = 0 in den nächsten 5 Paketen mit mehr als einer Instanz (Ausgang 1 von 2 Wechseln im Bündel).
- Messbarkeit: `agent_stop` und `agent_start` je Paket-ID im Event-Log; der Status `waiting` steht dort ebenfalls.
- Rückfall: E-042 wie bisher.
- Aufwand: klein (studio-coach: ein Satz in `STUDIO.md` Z. 63–69 und in der Output-Style-Datei `projektleiter.md`).
- Betroffene Regel: E-042 (R319, R420), `STUDIO.md` Lead-Ablösung.

### V3 · `zeitreserve-push` bewertet nur die Last der Messung; Lastwarten nach `make check` entfällt

- Hypothese: Im Modus `--push` bestimmt `loadStart` der Messung, ob streng geprüft wird (R394). Die Prüfung der aktuellen Last beim Aufruf (`check.ts` Z. 52–57) entfällt, ebenso der Schritt „warten bis Last ≤ 4“ im Push-Ablauf (`STUDIO.md` Z. 362, Briefing-Muster). Die Prüfschärfe bleibt gleich: Commit = HEAD, `loadStart` ≤ 4 und das alte Format sind weiterhin Exit 2.
- Erwartete Einsparung: je Push-Gate ≈ 1 min Wanduhr und 2–3 Tool-Aufrufe (B4: 06:38:01–06:38:56). Dazu entfällt ein Abbruch, der bei jedem Push-Gate zu erwarten ist.
- Messgrösse: Exit 2 „Last … > 4“ aus `zeitreserve-push` = 0 in den nächsten 3 Push-Gates; Integrator-Start → Push ≤ 4 min bei Load < 3 vor `make check` (Ausgang 4 min 43 s).
- Messbarkeit: Der Integrator-Bericht nennt die Schritte mit Zeiten. Die Messdatei bleibt unverändert.
- Rückfall: Commit zurücknehmen, Briefing-Schritt wieder einfügen.
- Aufwand: klein (lead-tech: ≈ 10 Zeilen in `tools/zeitreserve/check.ts` plus ein Testfall; studio-coach: ein Halbsatz im Push-Ablauf). Den Kopfkommentar `check.ts` Z. 2–3 im selben Zug korrigieren.
- Betroffene Regel: R338, R353, R394/R396, `STUDIO.md` Push-Ablauf (R429 V2).

### V4 · Studio-Session-Grenze messbar machen und den L0-Kontext nicht mitschleppen

- Hypothese: (a) `metrics.py` bekommt `--since <Zeitstempel>` (oder liest ein `session_start`-Event der Start-Routine), damit die Messung aus R434 möglich wird. (b) Der Schlussbericht der Ende-Routine empfiehlt dem Nutzer, die nächste Studio-Session in einem neuen Claude-Gespräch zu beginnen. R434 bleibt der Rückweg, wenn er im selben Gespräch weitermacht. (c) Ein Kenntnis-Eintrag in `warteschlange.md`: R434 präzisiert den Nutzerentscheid R335.
- Erwartete Einsparung: Ein frisches Gespräch startet bei ≈ 60k statt 241k L0-Kontext. Das sind ≈ 180k weniger Cache-Read je L0-Nachricht und eine Neuschreibung von ≈ 215k weniger beim Start (B3).
- Messgrösse: L0-Startkontext je Studio-Session ≤ 80k in 3 von 3 nächsten Sessions. Session-Metriken für jede Studio-Session getrennt erzeugbar (ja/nein). Pushes je 24 h ≤ 2 als Zweckkontrolle für R335 (Ausgang 2).
- Messbarkeit: (a) stellt sie erst her. Der L0-Kontext steht in den `usage`-Daten des Hauptprotokolls.
- Rückfall: (a) bleibt, (b) und (c) streichen.
- Aufwand: klein (lead-tech: `--since` ≈ 15 Tools; studio-coach: ein Satz in der Ende-Routine; L0: eine Zeile Warteschlange).
- Betroffene Regel: R434, R335, `STUDIO.md` Z. 454–456 und „Session-Start und -Ende“.

Empfehlung: V1 bis V4 annehmen. V1 zuerst, denn er streicht eine Regel, die nicht greift, und hat den grössten Wanduhr-Hebel. V3 lässt sich mit dem nächsten Werkzeug-Paket bündeln (TOOL-E049-PHASE, R433).

## Bewertung laufender Experimente

- R429 V1 (Ruling-Pflichtfelder): 8 von 8 Rulings seit Handbuch 1.37 vollständig, 0 Guard-Sperren aus Briefings. R431 korrigiert eine Sachannahme aus R426 (eigene `.gitignore` des Worktrees). Das ist ein Faktenirrtum, kein Regelwiderspruch.
- R429 V2 (Push-Gate ohne `make test`, Push per Hash): 1 von 3 Push-Gates, alle drei Messgrössen erfüllt (1 Vitest-Lauf, 4 min 43 s, 0 Nachträge).
- R429 V3 (ein `lead-qa`-Start je Ein-Paket-Release): REL-14 hatte zwei Pakete und brauchte trotzdem nur einen Start. 1 von 3, ohne Release-Fund nach dem Push.
- R420 V3 (Final-Review je Datei): grösste Datei der Session 26,4 KB, wirkt.
- R417 V2 / TOOL-PRETTIER-HOOK: aktiv seit `make hooks` (TOOL-AKTIVIERUNG, 06:33). Das einzige `commit_rejected` (20:24:12) fiel während T01 im Bündel an, also vor der Aktivierung. Die Bewertung beginnt mit REL-15.

## Änderungen an lernen.md

- keine (Sache des studio-coach nach einem Ruling)
