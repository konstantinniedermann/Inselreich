# Retro Studio-Session 2026-10-10 (2cfa57e0)

- Datum: 2026-10-10
- Art: session
- Auslöser: Session-Ende der Studio-Session 2cfa57e0 (R444–R458, Handbuch 1.41/1.42); L0-Auftrag Kurz-Retro, Hinweis aus R450 (Last bis 13 in der Parallelphase) und R457 (Controller-Übergabe)
- Datenbasis: `python3 tools/studio/metrics.py --efficiency` (Historie 42 Sessions), `docs/studio/metriken/S-2026-10-10-2cfa57e0.md` (Session: 47 Agenten, 1245 Aufrufe, 265,9 min), `docs/studio/rulings.md` R444–R458, `.studio/events.jsonl` (Session 2cfa57e0, per Skript: `spawn`, `budget`, `test_failed`, `tool`), Archiv-Berichte `.studio/archiv/berichte/20261010-09*`/`-10*` (Integrator, lead-qa, lead-tech). Zeiten UTC. Nicht befragt (Kurz-Retro ohne Agentenstart). Nicht doppelt: [Prozess-Retro REL-15](2026-10-10-release-rel15-prozess.md) (R450).

## Ergebnis der Session

- Beobachtung: Push REL-15 (R446), HOTFIX-CI-01 (R447), BEOB-AUSW-04 (R444), Ideen-Runde IDEEN-05 breit (R445, R448), REL-16 (R454), TOOL-BUENDEL-3 (R457) und REL-17 (R458) lokal gemergt, nicht gepusht; M13: Brainstorming (R452), Spec mit Nacharbeit (R455, R456), Plan fertig, Gate Plan offen. Qualität: 12 Ergebnisse, Erstabnahme 100 %, Review-Runden 1,00, Nacharbeit 0, 1 Fehlschlag auf main (der CI-Flake aus R446), 1 Eskalation (Metrik-Datei, Abschnitt Qualität).
- Deutung: Vier Lieferungen und eine Designstrecke in 266 min ohne Nacharbeit. Der Aufwand sitzt in Plan und Steuerung (B6), nicht in der Umsetzung.

## Befunde

### B1 · Last in der Parallelphase: Muster über drei Sessions, aber ohne Abbruch

- Beobachtung: Push-Vorprüfung Last 26 (Time Machine) und `make check` bei Last ≈ 11 mit Timeouts in [session-c64c0775-b B6](2026-10-10-session-c64c0775-b-ende.md); jetzt Last bis 13 und Hotfix-Merge bei 7,9 (R450). In dieser Session ein `test_failed` (`tests.test_clock`, Last 2,0, 09:26:35, Event-Log), kein Flake-Verdacht laut Ampel (0). Spätere Merge-Prüfungen liefen bei Last 3,3–4,0 (Integrator-Berichte `…094408…`, R457). Die Regel „Last ≤ 4 vor `make check`“ steht seit 1.42 im Push-Ablauf, nicht im Merge-Ablauf.
- Deutung: Dritte Session mit Last über 7 in der Parallelphase; die Folge war bisher ein Wiederholungslauf, kein Fehlurteil. Der rote Test bei Last 2,0 ist ein Rot-Beleg aus der Entwicklung, kein Lastfall. Kein neuer Hebel: Obergrenze 8 Agenten (R424) und Lastwarten (R394) bestehen. Messauftrag unten (M1).

### B2 · Controller-Übergabe TOOL-BUENDEL-3 (R457): ADR-007-Muster, Einzelfall

- Beobachtung: Controller 1 endete wartend, der Bericht von Controller 2 erreichte L0; Controller 2 mergte `tool/b3-qa` selbst, weil der Umsetzer es per Persona ablehnte (R457). Kein Schaden, Ergebnis wurde abgenommen.
- Deutung: Das Verhalten ist in [lernen.md](../lernen.md) (Zeile 1, Systembenachrichtigung statt Rückgabewert) beschrieben; ein Fall mit zwei Controllern ist kein neues Muster. Nur beobachten.

### B3 · Doku-Konflikt in `docs/beobachtungen.md`: wiederkehrend (E-031 Datenpunkt)

- Beobachtung: Konflikt beim Merge-Kandidaten REL-17, beide Seiten hängten am Dateiende an (R458, B1; Auflage kostete eine Controller-Fortsetzung plus Delta-Review durch L0). Frühere Fälle in `docs/studio/rulings.md`: Zeile 3286 (TOOL-E046-SESSION), Zeile 3861 (Konfliktprobe), dazu die Regel „löst der Eigentümer“ (Zeile 3447). Seit R303 gilt kein `merge=union` mehr (E-031: manuelle Auflösung ≤ 5 min).
- Deutung: Mindestens drei Fälle bei Strängen, die parallel Beobachtungen anhängen: Muster. Die Ursache ist das Anhängen am selben Dateiende zu verschiedenen Zeiten, nicht das Fehlen von `union`. Hebel V1.

### B4 · Integrator lässt `make check-ci-perf` aus: 3 von 3 Merge-Läufen

- Beobachtung: Die Berichte `…092327-production-integrator-abf20d69…` (REL-16), `…094408-production-integrator-a6107de7…` (TOOL-BUENDEL-3) und `…100907-production-integrator-ae727cd5…` (REL-17) schreiben je: `make check-ci-perf` nicht gelaufen, weil das Briefing es nicht verlangt. Die Persona `production-integrator` verlangt es im Merge-Ablauf (`.claude/agents/production-integrator.md` Z. 37), Handbuch Merge/Push (`STUDIO.md` Z. 356) ebenso. Rangfolge Handbuch/Persona > Briefing.
- Deutung: Muster über drei Pakete. Der Integrator folgt dem Briefing statt der Persona; das Briefing nennt nur `make check`. Gefahr: ein Perf-Budget-Test, der nur mit `CI=true` greift, fällt erst im Push-Gate auf (dort läuft er, R446). Hebel V2.

### B5 · Release-Notiz im REL-17-Handoff nicht gefunden (Einzelfall); Spec-Autor-Start durch L0 (Lücke)

- Beobachtung: (e) `lead-qa` fand den Entwurf weder im Handoff noch im Worktree und schrieb selbst einen Vorschlag (Bericht `…100151-lead-qa-a096a5c2…`); der Plan sah ihn in T04 vor (`docs/superpowers/plans/2026-10-10-rel-17/index.md` Z. 30), bei REL-16 stand er in `T03-doku-ui.md` und wurde gefunden. (f) `design-spec-author` wurde zum ersten Mal von `main` aus gestartet (Event 09:07:09, R452); die 11 früheren Starts (2026-09-30 bis 10-09) liefen über `lead-design`. `roster.md` Z. 34 führt den Spec-Autor unter `lead-design`; weder Handbuch noch `lead-design.md` regeln, wer ihn startet. Ergebnis: Gate Spec BEDENKEN (7, nicht blockierend), Nacharbeit abgenommen (R455, R456); Spec 39 633 Byte an der 40-KB-Grenze.
- Deutung: (e) ein Fall, kein Muster; das Auffangnetz des `lead-qa` hat gewirkt. (f) Der Direktstart spart einen Lead-Start (Metrik: `lead-design` 7 Agenten, 35 min), ist aber eine Abweichung vom Roster ohne Regel; ein Fall erlaubt kein Urteil gut/schlecht. Messauftrag M2.

### B6 · Steuerungsanteil und L0-Kontext: Session gegen Historie

- Beobachtung: Session roh 65,6 % rot, bereinigt 25,2 % grün; herausgerechnet 40,4 Punkte (Plan 32,8, Design 5,1, Gate 1,3, „Budget: keins“ 1,1); Gegenprobe 25,2 + 40,4 = 65,6 erfüllt (Metrik-Datei, Abschnitt Effizienz). Umsetzeranteil Session 5,7 % rot (Historie 22,8 % grün): 5 Umsetzer-Instanzen, Rollenklasse Design/Spec/Plan 13,9 %. L0-Kontext: Start 62k, Max 304k in dieser Session; der rote Wert 774k der Historie stammt aus einer früheren Session, nicht aus 2cfa57e0 (Rollentabelle der Metrik-Datei, Zeile L0).
- Deutung: Das L0-Notiz-Stichwort „774k in langer Session“ trifft für diese Session nicht zu; das neue Gespräch hat gewirkt (Vortags-Messauftrag V2: Start ≤ 60k knapp verfehlt, 62k, Anstieg 242k in 266 min). Der rote Rohwert kommt zur Hälfte aus Plan-Instanzen (32,8 von 65,6 Punkten); Datenpunkt 2 von 3 für E-049.

### B7 · Positiv

- Beobachtung: Drei Merge-Gates OK (R454, R457, R458 unter Auflage); Gate-Plan-/Spec-Befunde nie blockierend (R451, R453, R455); 16 `budget`-Zeilen zu 18 Lead-Starts im Event-Log (Differenz nicht Zeile für Zeile geprüft, Folgeinstanzen tragen keine eigene Zeile, R433 V3 b); Modell-Guard 0 abweichende Persona-Starts (Ampel).
- Deutung: Die Massnahmen aus den Vortags-Retros halten. Datenpunkt 1 von 3 für E-055 nur vorläufig: die zwei offenen Vorfälle der Metrik-Datei wurden nicht einzeln geprüft.

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 42 Sessions) und Abschnitt „Effizienz“ der Session-Datei (Werte in Klammern).

| Kennzahl                   | Historie (Session) | Ampel       | Befund / Ursache                                                                                     | Hebel oder Messauftrag mit Frist                                                               |
| -------------------------- | ------------------ | ----------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Steuerungsanteil roh       | 51,6 % (65,6 %)    | rot (rot)   | B6: Plan 32,8 Punkte; sechste Retro in Folge rot                                                     | E-054 starten, sobald E-050 bewertet ist (V4); Frist 2026-11-19                                |
| Steuerungsanteil bereinigt | 44,8 % (25,2 %)    | gelb (grün) | Historie gelb, Session grün; Gegenprobe erfüllt                                                      | E-049 Datenpunkt 2 von 3                                                                       |
| Umsetzeranteil             | 22,8 % (5,7 %)     | grün (rot)  | B6: Spec-/Plan-/Ideenlast, 5 Umsetzer-Instanzen                                                      | Messauftrag der Vorretro erfüllt; kein Hebel, Session ohne Umsetzungsschwerpunkt               |
| Cache-Write 5 min          | 28,7 % (20,2 %)    | rot (gelb)  | Session 22,9 → 23,1 → 20,2 %: fallend; Historie sinkt langsam; Instanz-Start- und Lese-Kontext (B7a) | E-057 (V3: grosse Dateien gezielt lesen), Pflichthebel R316; Frist 2026-11-19                  |
| Lead-Kontext Median        | 69k (65k)          | grün        | –                                                                                                    | –                                                                                              |
| L0-Kontext Max             | 774k (304k)        | rot (gelb)  | B6: Historienwert aus früherer Session; Session 304k, Start 62k                                      | Messauftrag: Wiederholung neues Gespräch, Start ≤ 65k, Max ≤ 350k; Frist 2026-10-23 (L0 liest) |
| opus-Anteil                | 71,7 % (74,4 %)    | gelb (gelb) | Spec-Autor, Pläne, Final-Reviews opus laut Tabelle                                                   | E-038 Datenpunkt 3 und E-054                                                                   |
| general-purpose auf opus   | 0 (0)              | grün        | –                                                                                                    | –                                                                                              |
| Grösste gelesene Datei     | 66,7 KB (48,2 KB)  | gelb (gelb) | Session: README 48,2 KB; vier Lese-Ergebnisse > 30 KB                                                | E-057 (V3)                                                                                     |
| Flake-Verdacht             | 0 (0)              | grün        | –                                                                                                    | –                                                                                              |

B7a: Das Cache-Write-Gewicht liegt nicht in Neuschreibungen (Session: 20 Stück > 20k über alle Rollen, Metrik-Datei Rollentabelle), sondern im Aufbau des Kontexts; vier Lese-Ergebnisse > 30 KB (README, `docs/ideen.md`, zwei Specs) landen in jedem lesenden Kontext. Das ist eine Deutung; die Messung in E-057 belegt oder widerlegt sie.

## Befragung der Leads

- Nicht befragt (Kurz-Retro ohne Agentenstart). Quellen: Archiv-Berichte, Ruling-Texte R444–R458, Event-Log.

## Vorschläge

Plätze: E-038, E-049, E-050 laufen (3 von 3). Reihenfolge der Wartenden: E-054 zuerst (Steuerung rot), dann E-056, E-057, E-058; keine zusätzliche Last für laufende Experimente.

### V1 · E-056 (wartet): Beobachtungs-Einträge erst im letzten Commit nach `git merge main`

- Hypothese: Wenn Stränge ihre Einträge in `docs/beobachtungen.md` erst als letzten Commit vor „bereit“ und nach `git merge main` schreiben, entstehen bei der Konfliktprobe (`git merge-tree`) keine Konflikte in dieser Datei (B3).
- Messgrösse: 0 Konflikte in `docs/beobachtungen.md` bei der Konfliktprobe in 3 Merges, die die Datei berühren (Ausgang: 3 Fälle, zuletzt R458); Gegenprobe: 0 verlorene Einträge.
- Zeitraum: 3 Merges, höchstens bis 2026-11-19. Rückfall: Zeile aus Briefing und Persona streichen, Eigentümer löst Konflikte wie bisher (R303).
- Dateien: `docs/studio/templates/briefing.md` (Pflichtzeile Doku), `.claude/agents/lead-tech.md`. Aufwand: S, ≈ 10 Tools. Regelbezug: E-031, R303, R458.

### V2 · E-058 (wartet): Integrator-Briefing nennt beide Prüfbefehle

- Hypothese: Wenn die Briefing-Pflichtzeile „Integrator“ `make check` und `make check-ci-perf` mit Exit-Code im Bericht nennt, läuft der Perf-Lauf in jedem Merge (B4).
- Messgrösse: 3 von 3 Integrator-Merge-Berichten nennen `make check-ci-perf` mit Exit-Code (Ausgang 0 von 3); Gegenprobe: Merge-Dauer des Integrators ≤ 8 min.
- Zeitraum: 3 Merges, höchstens bis 2026-11-19. Rückfall: Zeile streichen.
- Dateien: `docs/studio/templates/briefing.md`, Persona `production-integrator.md` (Klarstellung „Persona gilt auch, wenn das Briefing schweigt“). Aufwand: S, ≈ 8 Tools. Regelbezug: STUDIO.md Merge/Push, Rangfolge Verfassung > Handbuch > Persona > Briefing.
- Hinweis: Die Behebung ist schmal genug für ein Ruling ohne Platz (Vorlagenzeile wie E-052).

### V3 · E-057 (wartet): Grosse Dateien gezielt lesen

- Hypothese: Wenn Briefings für Dateien über 30 KB (README, `docs/ideen.md`, Specs, Pläne) den benötigten Abschnitt oder Zeilenbereich nennen und Personas Teillesen (`offset`/`limit`) vorschreiben, sinken die Lese-Ergebnisse > 30 KB und mit ihnen der Cache-Write-Anteil (B7a, Ampelzeilen „Cache-Write“ und „Grösste Datei“).
- Messgrösse: Lese-Ergebnisse > 30 KB je Session ≤ 2 (Ausgang 4, Metrik-Datei „Grösste Lese-Ergebnisse“) und Cache-Write-5-min-Anteil der Session ≤ 18 % (Ausgang 20,2 %) über 3 Sessions; Gegenprobe: Review-Runden im Mittel ≤ 1,5 und Erstabnahme ≥ 90 %.
- Messbarkeit: Die Liste der grössten Lese-Ergebnisse und die Kostenart bleiben unverändert.
- Zeitraum: 3 Sessions, höchstens bis 2026-11-19. Rückfall: Zeile streichen.
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/lead-*.md` (nur nach Ruling). Aufwand: M, ≈ 15 Tools. Regelbezug: R316, STUDIO.md Delegation.

### V4 · Bewertung E-050 und Platzvergabe (Empfehlung)

- E-050 Datenpunkt 3 von 3: 0 Umsetzer-Neuschreibungen > 20k in 5 Umsetzer-Instanzen (tech-ui 3, tech-sim 2; Metrik-Datei Rollentabelle), Review-Runden 1,00. Zeitraum erreicht, Schwelle ≤ 0,2 in allen drei Datenpunkten erfüllt. Einschränkung unverändert: kurze Läufe, die 40k-Schwelle greift kaum. Empfehlung: **behalten** (Ruling), der Platz geht an E-054.

### M1 · Messauftrag (kein Platz): Last bei Merge-Läufen

- Messgrösse: Anzahl `make check`-Läufe mit `loadStart` > 4 und Zahl der Wiederholungen in der nächsten Session (Quelle `.studio/zeitreserve.json`-Ergebnisse in Integrator-Berichten); Schwelle ≤ 1 Wiederholung. Frist 2026-10-23, Aufwand 0 Tools (Lesen). Greift die Schwelle nicht, in der Folge-Retro Hebel „Merge-Ablauf wartet auf Last ≤ 4“ prüfen.

### M2 · Messauftrag (kein Platz): Spec-Autor-Start

- Messgrösse: Beim nächsten Spec-Autor-Start Weg (L0 oder `lead-design`) im Ruling nennen; verglichen werden Gate-Spec-Befunde (Ausgang 7, nicht blockierend) und Lead-Start-Kosten. Eine Regel erst nach zwei Fällen. Frist 2026-11-19, Aufwand 0 Tools.

Empfehlung: V4 annehmen (E-050 behalten, E-054 starten); V1 und V3 annehmen (warten); V2 als Vorlagenzeile ohne Platz umsetzen; M1 und M2 annehmen.

## Bewertung laufender Experimente

- E-038 (Starts über der Tabelle ≤ 1, opus ≤ 60 %, Steuerung ≤ 40 %, 3 Sessions): Datenpunkt 3: 0 Starts über der Tabelle (Ampel: 0 abweichend), opus 74,4 % (verfehlt), Steuerung bereinigt 25,2 % (erfüllt), Review-Runden 1,00. Opus-Schwelle in den letzten beiden Datenpunkten verfehlt; Ursache Plan-/Spec-/Review-Starts laut Tabelle: Urteil per Ruling, Empfehlung **angepasst** (opus-Schwelle in E-054 verfolgen).
- E-049 (bereinigt mit Wert, Gegenprobe): Datenpunkt 2 von 3: 25,2 + 40,4 = 65,6 erfüllt.
- E-050: siehe V4.
- E-055 (Budget-Warnung): Datenpunkt 1 von 3 (B7), Fehlwarnungen nicht geprüft.
- R424 (Obergrenze 8): Spitze nicht ausgewertet (Skript zählte nur Spawns, kein belastbarer Wert); Last siehe B1.

## Änderungen an lernen.md

- neu: Integrator-Briefing nennt beide Prüfbefehle (B4) · Anhängen an `docs/beobachtungen.md` am Dateiende erzeugt Konflikte (B3) · Historienzeile der Ampel gegen die Session-Zeile lesen (L0-Kontext 774k, B6) · zusammengeführt: die beiden Budget-Zeilen; Zeile 1 gekürzt.
