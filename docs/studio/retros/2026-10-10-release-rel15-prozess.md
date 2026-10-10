# Retro meilenstein release-rel15 — 2026-10-10

- Datum: 2026-10-10
- Art: meilenstein (Release-Retro nach R127/R316), gebündelt mit der Ad-hoc-Retro „CI auf main fehlgeschlagen“ (R446 (4))
- Auslöser: Push REL-15 und Werkzeug-Bündel 2 `9eb99e77..c282def0`, CI 38038270428 rot, Pages 38038481954 grün (R446); Vorfälle `meilenstein:REL-15`, `ci:38038270428`; L0-Schwerpunkte Lieferkette, CI rot, Lastwarten im Push-Gate, Pages trotz roter CI
- Datenbasis: `docs/studio/rulings.md` R437–R446, `.studio/events.jsonl` (2026-10-10 06:30–08:45 UTC, per Skript gefiltert), `.studio/archiv/briefings/20261010-082829-production-integrator-FxLYT2iE.md`, Transkripte des Push-Integrators `aa6ed99` und der Bündel-/REL-15-Agenten (Bash-Befehle per Skript gezählt), Transkripte `ca427887`, `e51712dd`, `29c3791b` (Suche nach `FAIL: test_second_run_overwrites`), `git log 9eb99e77..c282def0`, `tools/studio/metrics.py` Z. 184, 270–271, 409, `tools/studio/tests/test_metrics.py` Z. 49–57, 230–239, `Makefile` Z. 17–23, 78–81, `docs/studio/STUDIO.md` Z. 276–284, 368–369, 432, Commit `de86dd92`, `docs/beobachtungen-archiv.md` Z. 555, Retro M11 B6 (`2026-10-03-meilenstein-m11.md` Z. 47–51), `gh run list --workflow CI --limit 40`, `python3 tools/studio/metrics.py --efficiency` (42 Sessions). Zeiten in UTC (Event-Log), `git log` ist Ortszeit (+2 h). „HB“ = Heartbeat-Events. Nicht doppelt: Budgetzählung „lead-qa 4 von 2“, Reviewer-Umschaltung des Worktrees, `*-E`-Dateien und L0-Startkontext im neuen Gespräch stehen in der Kurz-Retro `2026-10-10-session-c64c0775-b-ende.md` (R443) und werden hier nicht bewertet.

## Befunde

### B1 · Lieferkette REL-15: Kurzdesign bis lokaler Merge 44 min, bis live 2 h 06 min (Pflicht)

| Abschnitt                                         | Zeit (UTC)        | Dauer    | Warten / Übergabe / Doppelarbeit                                                                       |
| ------------------------------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| Kurzdesign `lead-design` (11 HB)                  | 06:31:46–06:33:11 | 1,4 min  | parallel zum Push-Gate REL-14 und TOOL-AKTIVIERUNG; R435                                               |
| Plan `lead-tech` (80 HB)                          | 06:33:43–06:46:50 | 13,1 min | –                                                                                                      |
| Kombiniertes Gate `lead-qa` (7 HB)                | 06:47:02–06:47:54 | 0,9 min  | R437 06:48:10; Nacharbeit B1–B5 in den Strängen                                                        |
| Strang UI (Controller `a032e09`, sonnet)          | 06:48:22–06:59:43 | 11,4 min | Arbeiter-Ende → nächster Controller-Zug je 0 s (V1 R438 wirkt)                                         |
| Strang See (Controller `a50fe96`, sonnet)         | 06:48:33–07:05:08 | 16,6 min | kritischer Pfad: Playtest T07 07:00:38–07:02:37, danach `make check` 07:02:48–07:04:54                 |
| Kandidat `production-integrator`                  | 07:05:26–07:09:42 | 4,3 min  | `make check` + `check-ci-perf`                                                                         |
| Release-Check `lead-qa` (Final-Review ‖ Playtest) | 07:09:57–07:15:05 | 5,1 min  | Final-Review opus 2,2 min, Playtest 4,4 min (kritischer Pfad); ein `lead-qa`-Start                     |
| R440 → Merge lokal                                | 07:15:28–07:16:03 | 0,6 min  | –                                                                                                      |
| Warten auf Push                                   | 07:16:03–08:28:29 | 72 min   | Bündel bis Merge 47,7 min (R441 E7, gewollt), Ende-Routine 6,6 min, Nutzer-Pause 16,7 min, Start 1 min |
| Push-Gate Integrator `aa6ed99`                    | 08:28:29–08:33:02 | 4,6 min  | siehe B4                                                                                               |
| CI (rot) ‖ Pages                                  | 08:33:07–08:37:25 | 4,3 min  | siehe B3, B5                                                                                           |

- Beobachtung: Vom Kurzdesign bis zum lokalen Merge vergingen 44 min (REL-14: 45 min). Beide Stränge liefen parallel. Der UI-Strang war 5,4 min vor dem See-Strang fertig, das ist im Plan so angelegt. Die Arbeiter wurden ohne Polling abgewartet: In allen Strängen folgte auf das `agent_stop` eines Arbeiters der nächste Controller-Zug in derselben Sekunde (Event-Log 06:50:56, 06:51:25, 06:52:30, 07:02:37 usw.). REL-14 hatte noch 8,4 min Leerlauf (Retro REL-14 B2). Von den 72 min bis zum Push entfielen 47,7 min auf das Werkzeug-Bündel, das nach R441 E7 mit REL-15 hinausgehen sollte. Die Ende-Routine (Kurz-Retro 08:04:10–08:09:46) und die Pause des Nutzers bis „mach weiter“ (08:27:29) machten den Rest aus. Die Studio-Session-Grenze lief über ein neues Gespräch (`session_end` „clear“ 08:27:13), so wie R438 V4 b es vorsieht.
- Deutung: In der Lieferkette gibt es keinen Engpass, und es gab weder Doppelarbeit noch eine Übergabe mit Informationsverlust. Das Warten auf den Push ist gewollt (R335, R441 E7) und kostet keine Rechenzeit. Das doppelte `check-ci-perf` (Kandidat 07:08, Push-Gate 08:32) ist wie bei REL-14 B1 zu klein für eine Regel.

### B2 · Werkzeug-Bündel 2: Plan bis Merge 58 min; acht volle `make check` auf Werkzeug-Code, einer rot durch Last (Pflicht)

| Abschnitt                         | Zeit (UTC)        | Dauer    | Befund                                                                                      |
| --------------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------- |
| Plan `lead-tech` (55 HB)          | 07:05:55–07:17:45 | 11,8 min | parallel zu Kandidat und Release-Check REL-15, ohne Lastkonflikt im Kandidaten              |
| Gate Plan `lead-qa`               | 07:18:00–07:19:05 | 1,1 min  | R441 BEDENKEN B1–B4; Nacharbeit `6635793f` 07:19:50, 22 s nach dem Start von Controller 1   |
| Controller 1 `a0420e0` (T01–T05)  | 07:19:28–07:48:49 | 29,3 min | T01+T04 `make check` rot „Last-Timeouts“ (07:32:42), Wiederholung 07:33:53–07:36:06 seriell |
| Controller 2 `a515466` (T06, T07) | 07:49:04–08:00:04 | 11,0 min | Wechsel nach 6 Arbeiter-Starts (`STUDIO.md` Z. 280), 15 s Lücke; Final-Review opus 3,6 min  |
| R442 → Merge lokal                | 08:00:23–08:03:42 | 3,3 min  | `make check` + `make studio-test` auf main                                                  |

- Beobachtung (Doppelarbeit): Laut den Bash-Befehlen der Transkripte lief `make check` (je ≈ 135 s) auf Bündel-Code achtmal: T05 07:21, T01+T04 07:24 (rot), Controller 1 07:33, T02+T03 07:43, T06 07:50 (dazu `make test`), Merge 08:00 und Push-Gate 08:29. Hinzu kommen 20 Aufrufe von `make studio-test` durch Arbeiter und Reviewer. Der Diff des Bündels liegt nur in `tools/`, `tests/tools/`, `Makefile` und `docs/`. Kein Spielcode ist betroffen, R446 nennt „Fehler nur im Studio-Werkzeug“. Der eine Last-Rot hat 2,2 min seriellen Leerlauf erzeugt, denn T02+T03 warteten auf die Wiederholung im selben Worktree. Seine Ursache ist plausibel, aber nicht belegt: Der `make check` von T05 im Strang `ts` startete um 07:21 und endete kurz vor dem Lauf von T01+T04.
- Beobachtung (Instanzwechsel): Der Wechsel folgte der Grenze „nach 6 Arbeiter-Starts“ bei einem Budget von 12 Starts (R441). Er war damit planbar und ist kein V2-Fall (R438, Blocker).
- Deutung: Bei Werkzeug-Paketen ist der volle `make check` je Task meist Doppelarbeit. Er prüft 2875 Spieltests, die der Diff nicht berührt, erzeugt Last und löst dadurch selbst Rot-Läufe aus. Verfassung §7.1/§7.2 verlangt den vollen Lauf vor Merge und Push. Diese beiden Läufe bleiben, auf Task-Ebene ist es kein Verfassungsschritt. 5-Why: 8 Läufe ← jeder Task-DoD nennt `make check` ← das Plan-Muster kennt nur „make check grün“ ← es unterscheidet nicht nach Diff-Bereich ← **für Werkzeug-Pakete fehlt eine schmale Task-Prüfung** (Hebel V3).

### B3 · CI rot: ein Sekunden-Flake, seit 10 Tagen im Code, fünfmal lokal gesehen und nie benannt (Pflicht, Ad-hoc)

- Beobachtung (Fehler): `test_second_run_overwrites` (`test_metrics.py` Z. 230–239) erzeugt dieselbe Session-Datei zweimal und vergleicht die beiden Fassungen ohne die Zeilen mit „erzeugt“. Der Zeitstempel `created` (`metrics.py` Z. 409, Sekundenauflösung) steht aber zweimal in der Datei: in der Zeile „- erzeugt:“ (Z. 184) und im JSON-Block (Z. 270–271, `"created": …`). Beide Stellen und der Test stammen aus demselben Commit `6fd39675` (2026-09-30). Der Test schlägt fehl, sobald zwischen den beiden Aufrufen eine Sekundengrenze liegt. Die Wahrscheinlichkeit dafür entspricht ungefähr der Laufzeit eines `metrics.main`-Aufrufs geteilt durch 1 s. Auf dem langsameren Runner liegt sie plausibel höher (nicht gemessen).
- Beobachtung (Push-Gate): `make check` lief im Push-Gate einschliesslich `studio-test` grün (Transkript `aa6ed99`, 08:29:31–08:31:58, EXIT=0). Allein in dieser Lieferkette riefen die Agenten ≈ 30-mal `make check` oder `make studio-test` auf. Alle Läufe waren grün, ausser dem Last-Rot aus B2.
- Beobachtung (frühere Signale): `FAIL: test_second_run_overwrites` steht in drei älteren Transkripten: `ca427887` (`production-studio-ops`, 2026-10-02), `e51712dd` (`lead-tech`, 2026-10-05, mit `grep` auf den Test, der Bericht meldet danach „beide grün“) und `29c3791b` (`lead-tech`, 2026-10-08). Am 2026-10-03 gab es eine Beobachtung „`studio-test` einmal flaky an einem Zeitstempelvergleich (Sekundenwechsel)“ ohne Testnamen. Retro M11 B6 nahm sie auf: „Beim nächsten Rot Testname sichern.“ Die Zeile stand als datierte Zeile unter „Ausgewertet 2026-09-30“ am Dateiende. Mit BEOB-AUSW-01/-03 ging sie ungeprüft ins Archiv (`beobachtungen-archiv.md` Z. 555). Seit R287/R288 (2026-10-06) liegt „Offen“ am Dateiende, und heute steht keine datierte Zeile mehr in einem Ausgewertet-Abschnitt (per Skript geprüft).
- Antwort auf die Prüffrage: Das Push-Gate konnte den Flake nicht verhindern. Ein einzelner grüner Lauf beweist bei einem Zufallsfehler im Prozentbereich nichts, und mehr lokale Läufe würden ihn nur zufällig treffen. Der Test fällt lokal selten aus: 5 belegte Rot-Läufe in 9 Tagen, der Nenner ist nicht gezählt.
- Deutung: Muster. 5-Why: CI rot ← der Test vergleicht Ausgaben mit einer Wanduhr-Sekunde ← der Filter deckt nur eine von zwei Fundstellen ab ← die Studio-Werkzeuge lesen die Uhr direkt (12 Aufrufe von `datetime.now`/`time.time` in `tools/studio/*.py`), und für Python gibt es kein Gegenstück zu `make zeittests` (`Makefile` Z. 17–23 prüft nur `tests/**/*.ts`) ← fünf lokale Rot-Läufe führten zu keinem Testnamen, weil Agenten einen roten, danach grünen Lauf als „grün“ melden ← **ein Flake hinterlässt keine Spur, die ohne Disziplin entsteht. Der Auftrag „Testname sichern“ (M11 B6) hatte keinen Mechanismus.** Das Archivieren der Zeile vom 2026-10-03 ist ein Einzelfall aus der Zeit vor R287/R288 und strukturell geschlossen. Dafür gibt es keinen Vorschlag. Der Fix des Tests läuft als HOTFIX-CI-01 und ist nicht Teil dieser Retro.

### B4 · Push-Gate: Lastwarten vor `make check` war richtig, keine Abweichung von Handbuch 1.40 (Pflicht)

- Beobachtung (Transkript `aa6ed99`): Um 08:28:32 betrug die Last 5,17. Der Integrator liess zuerst `tsc`, `lint`, `zeittests` und `conflicts` laufen (21 s, Last danach 4,64). Danach wartete er in einer Schleife bis Last ≤ 4 (08:28:58–08:29:28, 30 s, Endwert 3,85). Es folgten `make check` 08:29:31–08:31:58, `zeitreserve-push` mit Exit 0 im ersten Lauf („Last vor dem Lauf (Messung): 3.6“, 2875 Tests), `check-ci-perf` 53 s und der Push 08:33:02. Vom Integrator-Start bis zum Push vergingen 4 min 33 s (REL-14: 4 min 43 s).
- Beobachtung (Regeltext): Handbuch 1.40 (`de86dd92`) hat das Warten **nach** `make check` vor `zeitreserve-push` gestrichen. Das Warten **vor** `make check` stand im Briefing (Schritt 3: „vorher `uptime`: 1-min-Load ≤ 4“). Es folgt aus R394: Liegt `loadStart` über 4, endet der Lauf mit Exit 2, und `make check` muss wiederholt werden (≈ 135 s). Das Handbuch nennt nur diesen Wiederholungsweg (Z. 368), den billigeren Warteschritt nicht. R329 (Z. 432) betrifft Ruckel-Messungen und ist hier nicht einschlägig.
- Beobachtung (Nebenkosten): Zwei vermeidbare Aufrufe gab es. Ein Glob `/private/tmp/claude-501/*/*/scratchpad/check.log` las die `check.log` einer fremden Session (8ef9d27f, 2446 Tests statt 2875). Der Integrator merkte es selbst („Ausgabe zu breit“). Ein `cat` von `zeitreserve.json` sprengte die Ausgabe. Der Bericht nennt die richtige Zahl.
- Deutung: Der Integrator hat richtig gehandelt. Die 30 s Warten waren billiger als ein zweiter `make check`. Die Regel steht aber nur im Briefing von L0, nicht im Handbuch. Fehlt der Satz im Briefing, nimmt der Integrator den teuren Weg (Halbsatz in V4). Der Glob über fremde Scratchpads ist ein Einzelfall, dafür gibt es keinen Vorschlag.

### B5 · Pages trotz roter CI: gedeckt, aber vom Integrator allein entschieden (Pflicht)

- Beobachtung: CI endete um 08:36:32 rot (`studio-test`, `Makefile:50`). Der Integrator las `.github/workflows/pages.yml` (08:36:40). Der Pages-Build baut selbst und führt keine Tests aus. Um 08:36:43 löste er Pages aus, um 08:37:25 war es grün. Im Briefing stehen nebeneinander „CI rot nach dem Push → nichts reparieren, Lauf-ID und Fehlermeldung melden“ und Schritt 7 „Release: `gh workflow run Pages`“. `STUDIO.md` Z. 368–369 sagt „CI rot → Behebung hat Vorrang, Ad-hoc-Retro“ und regelt Pages bei roter CI nicht. R446 hat die Entscheidung nachträglich gedeckt.
- Deutung: Inhaltlich richtig: Der Fehler lag ausserhalb des ausgelieferten Artefakts (`dist` enthält kein `tools/studio`), und das Push-Gate war lokal grün. Hätte der Integrator angehalten, wäre ein L0-Ruling und ein zweiter Integrator-Start nötig gewesen (≈ 14 Tools), ohne dass sich etwas verbessert. Riskant wäre derselbe Reflex bei einem roten Spieltest (`src/`, `tests/sim/`). Dann ginge ein möglicherweise defektes Spiel live. Dafür braucht es keine neue Regel. Ein Halbsatz im Push-Ablauf reicht, der die Fallunterscheidung festhält, die der Integrator heute selbst getroffen hat (V4).

### B6 · Positiv

- R438 V1 wirkt: 0 Polling-Lücken in 2 Paketen, alle Controller beendeten ihren Zug mit „warte auf die Benachrichtigung“. R438 V3 wirkt: `zeitreserve-push` endete im ersten Lauf mit Exit 0, ohne Lastabbruch. R438 V4 a (`--since`, `0719d9c4`) und V4 b (neues Gespräch) sind umgesetzt. R429 V2 ist im Push-Gate 2 von 3 erfüllt: ein Vitest-Lauf, Push per Hash, 0 Nachträge. Die 4 L0-Commits nach `c282def0` gingen korrekt nicht mit (`ahead 4`). Plan TOOL-BUENDEL-2 lief parallel zu Kandidat und Release-Check REL-15, ohne den Kandidaten zu stören.

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 42 Sessions). Die Session-Werte der Lieferkette (c64c0775-b) hat die Kurz-Retro R443 bewertet (Steuerung roh 68,7 %, bereinigt 37,6 %). Hier steht nur der Beitrag von REL-15 und Bündel.

| Kennzahl                   | Historie           | Ampel      | Befund / Ursache                                                                                                                                                                               | Hebel oder Messauftrag mit Frist                                                            |
| -------------------------- | ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Steuerungsanteil           | 51,3 % (ber. 45,3) | rot (gelb) | Beobachtung: REL-15 hatte 6 Lead-Instanzen (Kurzdesign, Plan, Gate, 2 Controller, Release-Check) auf 11 Arbeiter-Starts. Strukturell bei Stufe leicht (Retro REL-14)                           | E-054 (Pläne auf sonnet) erster Kandidat für den nächsten Platz (R443); kein weiterer Hebel |
| Cache-Write 5 min          | 28,9 %             | rot        | Beobachtung: kein Polling-Leerlauf mehr (B1, B6); die grössten Pausen sind die Nutzer-Pause (16,7 min) und das Warten auf den Push. Beides ist gewollt                                         | Messauftrag R433 (2026-11-19) bleibt; kein neuer Hebel                                      |
| L0-Kontext Max             | 774k               | rot        | Historienwert, neues Gespräch ab 08:27 (R438 V4 b)                                                                                                                                             | Messauftrag R443 V2 (2026-10-23) bleibt                                                     |
| opus-Anteil                | 71,6 %             | gelb       | Beobachtung: 2 Final-Reviews auf opus (REL-15, T07), L0                                                                                                                                        | E-054; kein weiterer Hebel                                                                  |
| Grösste Datei              | 66,7 KB            | gelb       | Historienwert                                                                                                                                                                                  | keiner nötig                                                                                |
| Actions-Minuten Inselreich | 955 (Monat)        | rot        | Beobachtung: +21 seit 934 (Retro e90e097e); dieser Push kostete CI 3 min 20 s und Pages 26 s. Der Hotfix braucht einen weiteren CI-Lauf. Der hohe Monatswert stammt aus der Zeit vor R333–R335 | kein neuer Hebel; V1/V2 senken das Risiko roter CI-Läufe mit Wiederholung                   |
| Actions-Minuten Konto      | 1225 / 2000        | gelb       | wie oben                                                                                                                                                                                       | E-046 weiter beobachten                                                                     |
| übrige Zeilen              | –                  | grün       | –                                                                                                                                                                                              | –                                                                                           |

## Befragung der Leads

- Nicht befragt (Release-Retro, ein Start). Quellen: Ruling-Texte, Event-Log, Briefing und Transkripte.

## Vorschläge

Höchstens 4, nach Hebel sortiert. Eintrag in `experimente.md` erst nach einem Ruling.

### V1 · Rote Testläufe automatisch mit Namen festhalten

- Hypothese: `make studio-test` (und `make test`) schreiben bei Exit ≠ 0 die Namen der fehlgeschlagenen Tests zusammen mit Commit, Zeit und Load als Event `test_failed` in `.studio/events.jsonl`. Dafür reicht ein Wrapper im Makefile-Ziel oder in `log.py`, ohne neue Abhängigkeit. `metrics.py --efficiency` zeigt eine Zeile „Tests rot und beim gleichen Commit später grün, je Testname“. Damit wird das Signal sichtbar, das fünfmal verloren ging (B3), ohne dass ein Agent daran denken muss. Der Auftrag „Testname sichern“ (M11 B6) entfällt dann.
- Erwartete Einsparung: Ein Flake wird beim zweiten lokalen Rot benannt statt erst durch einen CI-Rot nach dem Push. Das spart je Fall einen Hotfix-Strang (heute: lead-tech, Reviewer, Gate, Merge, ≈ 40 Tools), einen weiteren CI-Lauf (≈ 3,5 Actions-Minuten) und eine Ad-hoc-Retro.
- Messgrösse: Anteil der CI-Rot-Läufe, deren Testname vorher schon als `test_failed` im Log stand, = 100 % bis 2026-11-10 (Ausgang: 1 von 1 nicht erfasst). Flakes, die erst in CI gefunden werden, = 0.
- Messbarkeit: wird durch V1 erst hergestellt; abgleichbar mit `ci`-Events.
- Rückfall: Wrapper entfernen, Ampelzeile streichen.
- Aufwand: klein (lead-tech, ≈ 20 Tools); passt in TOOL-BUENDEL-3 (R444).
- Betroffene Regel: `Makefile` `studio-test`/`test`, `tools/studio/log.py`, Retro M11 B6, R446.

### V2 · Eine Uhr für die Studio-Werkzeuge, im Test eingefroren, per Lint erzwungen

- Hypothese: Die Studio-Werkzeuge lesen die Zeit nur noch über einen Helfer (z. B. `paths.now()` oder ein kleines `clock.py`). Die gemeinsame Test-Basis friert ihn ein. `make studio-lint` meldet jeden direkten Aufruf von `datetime.now(` oder `time.time(` in `tools/studio/*.py` ausserhalb des Helfers, analog zu `make zeittests` für TS. Das beseitigt die Klasse statt des Einzelfalls. HOTFIX-CI-01 repariert nur diesen einen Test.
- Erwartete Einsparung: keine weiteren Sekunden-Flakes in 546 Studio-Tests. Je vermiedenem Fall gilt dieselbe Einsparung wie bei V1.
- Messgrösse: direkte Uhraufrufe in `tools/studio/*.py` ausserhalb des Helfers = 0 (Ausgang 12). `test_failed`-Events (V1) mit Zeitstempelursache = 0 bis 2026-11-10.
- Messbarkeit: Lint-Prüfung zählt; V1 liefert die Rot-Läufe.
- Rückfall: Lint-Regel entfernen; der Helfer kann bleiben.
- Aufwand: mittel (lead-tech, ≈ 30 Tools für 12 Stellen und den Lint-Schritt). Alternative mit kleinem Aufwand: nur die Lint-Regel als Warnung, die Umstellung später.
- Betroffene Regel: `make studio-lint`, ZEITTESTS-Muster (`Makefile` Z. 17–23), Architektur „deterministisch“ sinngemäss für Werkzeuge.

### V3 · Werkzeug-Pakete prüfen je Task schmal, voll erst am Strang-Ende

- Hypothese: In Paketen, deren Diff `src/`, `public/`, `index.html` und `tests/` ausser `tests/tools/` nicht berührt, lautet die Task-DoD: `make studio-test`, `make studio-lint`, `npx tsc --noEmit`, `make lint` und bei TS-Werkzeugen `npx vitest run tests/tools`. Den vollen `make check` gibt es einmal am Strang-Ende (Final-Review), dann beim Merge und im Push-Gate (Verfassung §7.1/§7.2 unverändert). Der Plan-Schreiber setzt das in der Task-Vorlage. Es braucht keine neue Gate-Regel.
- Erwartete Einsparung: TOOL-BUENDEL-2 hätte 4–5 statt 8 volle Läufe gebraucht. Das sind ≈ 7–9 min Rechenzeit und je Task ≈ 1,5 min Wanduhr. Dazu kommen weniger Last-Rot-Läufe mit seriellem Warten (B2: 2,2 min).
- Messgrösse: volle `make check` je Werkzeug-Paket ≤ 4 in den nächsten 2 Werkzeug-Paketen (Ausgang 8). Last-Rot auf Task-Ebene = 0. Funde in Merge, Push-Gate oder CI, die ein voller Task-Lauf früher gefunden hätte, = 0.
- Messbarkeit: Bash-Befehle der Transkripte per Skript zählbar, wie in dieser Retro.
- Rückfall: Task-DoD wieder „`make check` grün“.
- Aufwand: klein (studio-coach: ein Satz im Plan-Abschnitt von `STUDIO.md` bzw. `templates/`; erster Einsatz TOOL-BUENDEL-3).
- Betroffene Regel: Plan-/Task-Vorlage, `STUDIO.md` Umsetzung (Z. 276–284), Verfassung §7 (unverändert).

### V4 · Push-Ablauf: zwei Halbsätze statt Briefing-Wissen

- Hypothese: Der Push-Ablauf in `STUDIO.md` (Z. 368–369) bekommt zwei Halbsätze. (a) „vor `make check` 1-min-Load ≤ 4 abwarten (sonst `loadStart` > 4 → Exit 2 → zweiter `make check`)“. (b) „CI rot nach dem Push: Pages trotzdem auslösen, wenn nur Studio-Werkzeuge rot sind (`studio-test`, `studio-lint`, Pfade `tools/`) und das Push-Gate lokal grün war. Ist ein Spieltest oder der Build rot, kein Pages, sondern melden.“ Beides beschreibt, was der Integrator heute richtig getan hat (B4, B5). Es kommt keine neue Prüfung hinzu.
- Erwartete Einsparung: je Fall ein L0-Ruling und ein zweiter Integrator-Start (≈ 14 Tools), wenn ein Briefing den Satz nicht enthält oder der Integrator vorsichtig anhält. Ein vermiedener zweiter `make check` spart ≈ 135 s.
- Messgrösse: Integrator-Neustarts wegen Pages-Entscheid = 0 und zweite `make check` wegen `loadStart` > 4 = 0 in den nächsten 3 Push-Gates (Ausgang 0/0). Pages nach rotem Spieltest = 0.
- Messbarkeit: Integrator-Bericht und `ci`-Events (CI-Ergebnis und Pages-Zeitpunkt).
- Rückfall: Halbsätze streichen; Pages-Entscheid wieder per Ruling.
- Aufwand: klein (studio-coach, Handbuch-Minor; L0 übernimmt (b) in das Briefing-Muster).
- Betroffene Regel: `STUDIO.md` Merge/Push (R429, R438 V3), R446 (2), R394.

Empfehlung: V1, V3 und V4 annehmen. V1 zuerst, denn er schliesst die Wurzelursache „Flake ohne Spur“ und macht V2 messbar. V2 annehmen, aber zuerst nur die Lint-Warnung (klein). Die Umstellung der 12 Stellen kommt mit TOOL-BUENDEL-3 oder später. V1 und V2 lassen sich mit TOOL-BUENDEL-3 bündeln (R444), V3 gilt ab dessen Plan.

## Bewertung laufender Experimente

- R438 V1 (kein Polling): 2 von 3 Controller-Paketen, 0 Lücken > 2 min zwischen Arbeiter-Ende und Controller-Zug (Ausgang 1 Lücke, 8,4 min). Jeder Controller-Zug endet mit „warte auf die Benachrichtigung“ (Event-Log).
- R438 V2 (Controller mit Blocker → `waiting`): kein Fall eingetreten, 0 von 5.
- R438 V3 (`zeitreserve-push` nur `loadStart`): 1 von 3 Push-Gates, Exit 2 „Last … > 4“ = 0. Integrator-Start → Push 4 min 33 s. Die Bedingung „Load < 3 vor `make check`“ war nicht erfüllt (5,17), der Datenpunkt ist deshalb nur bedingt vergleichbar.
- R429 V2 (Push-Gate ohne `make test`, Push per Hash): 2 von 3 erfüllt.
- R429 V3 (ein `lead-qa`-Start je Ein-Paket-Release): REL-15 mit einem Start für den Release-Check (`aaca227`), 2 von 3, ohne Release-Fund nach dem Push. Der CI-Rot stammt aus dem Bündel-Werkzeug, nicht aus REL-15.
- R417 V2 / TOOL-PRETTIER-HOOK: Bewertung beginnt mit REL-15. Der Hook ist aktiv, die Zählung von `commit_rejected` übernimmt die Kurz-Retro (R443).

## Änderungen an lernen.md

- keine (Sache des studio-coach nach einem Ruling)
