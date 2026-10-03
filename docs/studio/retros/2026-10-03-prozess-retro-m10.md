# Prozess-Retro M10 — 2026-10-03

- Datum: 2026-10-03
- Art: meilenstein (Prozess-Aussensicht, R127)
- Auslöser: Release M10, Merge 268fa23, Pages grün
- Datenbasis: `.superpowers/sdd/m10/ledger.md`, `docs/studio/rulings.md` R164–R188, `docs/studio/metriken/M10.md`, `docs/studio/experimente.md` (E-015), `docs/studio/retros/2026-10-02-prozess-retro-m8.md`, `git log`

## Beobachtung

- B1 UI-Tasks seriell. R182 plante „Parallelität 2" für die UI-Welle; das Ledger (Abschnitt M10-UI T06–T09) hält „seriell im selben Baum, Parallelität 1" fest, Grund Dateiüberschneidung (`hud.ts`, `hotkeys`, `inspect`, `settings`, Bestandstests). R184 nahm das nachträglich an. Schon in Stufe 1 galt dasselbe: Branch `feat/m10-forest` wurde ab f811e28 statt ab T1 gebildet (Überschneidung `queries.test.ts`, Ledger M10-S1B). Der Plan sah also zweimal eine Parallelität vor, die an gemeinsamen Dateien scheiterte. UI-Strecke T06–T09: 8 Starts, 4 Implementierer und 4 Reviewer, 2 Runden bei T06 und T08; lead-tech 159 min und 763 Tool-Aufrufe von 288 min Gesamtdauer (`metriken/M10.md`).
- B2 QA nachgelagert. Ledger: „QA-U1/U2 nicht vor T08/T09 abgewartet (lead-qa prüft nachträglich)". lead-qa: 7 Agenten, 47,8 min, 277 Tool-Aufrufe. Die Fehler aus T08/T09 (Fix 7140878 `role=img`, 12:36) wurden erst im Final-Review entdeckt, die Fix-Runde folgte um 13:03–13:13 (`git log` feat/m10-ui).
- B3 Final-Review ZURÜCK (R186). Zwei Ursachen: (a) Regression: Fix 7140878 (T09) setzte `role=img` auch auf den Steuer-Knopf, der damit seine Button-Semantik verlor; behoben in 2607afa. R184 hält fest: Fixes T08/T09 ohne erneuten Reviewer-Lauf, R136 verletzt, Nachprüfung erst im Final-Review. Der Fix-Test 2607afa prüft nur die Funktion `chipRole`, nicht das DOM-Attribut (Ledger: „DOM-Attribut = QA"). (b) D1 (README, arc42 §5/§8, Hauptspec-Verweise) fehlte.
- B4 Ownership-Lücke D1. Ledger: „D1 vom Controller geschrieben, Implementierer lehnte Doku ausserhalb Ownership ab". Die Doku-Aufgabe stand nicht als Task im Plan. Dasselbe Muster zeigte sich bei M8: `M8-D1` kam erst nach der Technik (Retro M8 B3, Commit 1f91e2f 19:16) und erzwang dort eine zweite Doku-Runde. Bei M10 hatten T02 (f811e28) und T06–T09 Doku teils mitgeführt, aber nicht vollständig; in der Nachprüfung blieb ein weiterer Doku-Punkt (arc42 `migrateV4ToV5`, BEDENKEN niedrig, Commit 1659e3a).
- B5 Parallelbetrieb M11-Design. R184 startete lead-design parallel (nur Doku, `docs/m11-design`), lead-design 46,6 min, ≥ 275k Output. Ergebnis: Gate Brainstorming (R185) und Spec-Gate BEDENKEN (R187) mit vier blockierenden Punkten, darunter „M10 AK-F1-05 rot durch P2". R185 hängt die Umsetzung an Gate Merge M10 (A10). Kosten bei Irrtum laut R184: Nachführen des Vorschlags nach M10-Befunden. M10 Final-Review ZURÜCK änderte K3, was M11 nicht berührte; Nachführkosten sind in den Quellen nicht ausgewiesen.
- B6 Zusätzliche Fremdtest-Anpassungen. Pro Task fand der Implementierer Bestandstests, die der Plan nicht nannte (T02 Abweichung 3, T04 Abweichung 1, T09 Abweichungsliste „nicht in orga-12 gelistet"). Jede wurde im Review als „zwingend" bestätigt.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/M10.md`, Abschnitt Effizienz (4 Sessions, 145 Agenten).

| Kennzahl                                             | Wert    | Ampel | Befund / Ursache                                                                                        |
| ---------------------------------------------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil (L0 + Leads)                        | 62,2 %  | rot   | D1 – Leads schreiben Doku und Fix-Runden selbst; lead-tech 12 Instanzen, 549k Kontext-Max; siehe V1, V2 |
| Umsetzeranteil                                       | 12,4 %  | gelb  | Spiegelbild des Steuerungsanteils                                                                       |
| Cache-Write 5 min                                    | 25,8 %  | rot   | 19 Neuschreibungen > 20k bei lead-tech; lange Controller-Sitzungen, Pausen über 5 min; siehe V3         |
| L0-Kontext Max                                       | 404k    | gelb  | Eine Hauptsession über Stufe 2, UI, QA, Merge und M11-Design                                            |
| opus-Anteil                                          | 73,2 %  | gelb  | Leads und Final-Review auf opus; kein Einzelbefund                                                      |
| Grösste gelesene Datei                               | 59,0 KB | gelb  | M10-Spec; R185 verlangt für M11 ≤ 40 KB, Auflage ist gesetzt                                            |
| Lead-Kontext Median / Persona-Starts general-purpose | 76k / 0 | grün  | –                                                                                                       |

Bei den zwei roten Zeilen folgt je ein Vorschlag (V1 bzw. V3). Hinweis: Das Kostengewicht ist eine Schätzung, die Metrik zählt 4 Sessions, M10 lief aber über zwei Sessions und zwei Tage.

## Befragung der Leads

Nicht erreichbar, Ledger `.superpowers/sdd/m10/ledger.md` und Rulings gelesen.

## Deutung

- B1 (5-Why): Warum seriell? Dateiüberschneidung. Warum Überschneidung? Der Plan schnitt T06–T09 nach Funktion (Hud, Hilfe, Hover, Chips), aber alle berühren `hud.ts`, `hotkeys`, Bestandstests. Warum nicht erkannt? R182 prüfte Parallelität anhand der Task-Liste, nicht anhand der Ownership-Tabelle je Datei. Wurzel: Der Parallelitätsfaktor wurde als Plan-Annahme gesetzt statt aus der Dateimatrix abgeleitet. Der Plan-Schnitt war damit falsch, aber weniger in den Tasks als in der Zusage. Seriell war hier sogar günstig (keine Merge-Konflikte, Ledger zeigt keine); die Kosten liegen nur im Zeitplan. Der Fehler wiederholte sich in Stufe 1, also ein Muster.
- B2: Kosten sind nicht gemessen, aber bestimmbar: Die Regression aus T09 lebte 27 min (12:36 bis 13:03) und hätte bei QA nach T09 statt nach allen Tasks früher gefunden werden können. Frühes QA nach jedem Task hätte jedoch 4 statt 1 QA-Starts bedeutet (QA 7 Agenten schon jetzt). Billiger ist eine gezielte Prüfung, nicht mehr QA.
- B3 (5-Why): Warum Regression? Fix an einem Chip-Muster griff auf Elemente über, für die es nicht galt. Warum nicht bemerkt? Kein Reviewer-Lauf nach dem Fix (R136), und der Test prüft nur die Hilfsfunktion. Warum kein Lauf? Fix-Runden gelten per SendMessage als „kein Start" im Budget, der Reviewer ist nicht automatisch Teil der Fix-Runde. Wurzel: Fix-Runde und Nachprüfung sind zwei Schritte ohne Zwangskopplung. E-015 zielt genau darauf („Nachprüfung nach Review-BEDENKEN") und läuft nur als Vorschlag, Start `–`. In M10 hat sich die Lücke wiederholt (Wirkung der Messung gegen Ausgangswert 2 von 4: M10 weist erneut 1 Paket aus).
- B4: Wurzel ist, dass Doku-Nachführung nicht als Task mit Eigentümer im Plan steht, sondern implizit am Lead hängt. Zweiter Fall nach M8, also Muster. Streichen ginge nicht (Doku ist Pflicht laut `CLAUDE.md`), aber den Implementierer von der Doku zu trennen ist der Auslöser: Er kennt die Änderung am besten und darf sie nicht beschreiben.
- B5: Nutzen: M11-Spec lag fertig, als M10 gemergt wurde; die Wartezeit auf den Merge entfiel. Risiko: Die Spec bekam Befunde nach (AK-Kollision mit M10 AK-F1-05), ein Teil davon wäre bei fertigem M10 nicht entstanden. Der Netto-Nutzen bleibt vermutlich positiv, weil nur Doku betroffen ist, ist aber nicht belegt; der Mehraufwand der Nachführung wurde nicht erfasst. Die Spec-Grösse (Auflage ≤ 40 KB) ist ein Beispiel für gelernte Disziplin aus der gelben Ampelzeile.
- B6: Fremdtest-Anpassungen sind vorhersehbar, wenn ein Sim-Task Gebäude oder Freischaltung ändert. Der Plan nennt sie nicht, die Reviews bestätigen jedes Mal. Kein Handlungsbedarf ausser einem Plan-Check (V4 deckt es mit ab).

## Vorschläge

Höchstens 5, nach Hebel sortiert. Jeder mit Hypothese, Messgrösse, Rückfall, Aufwand. Entscheidung bei L0; Umsetzung `studio-coach`.

### V1 · Doku als Plan-Task mit Eigentümer (B4, Steuerungsanteil rot)

- Hypothese: Wenn jeder Plan je Feature eine Task „D1 Doku" mit Eigentümer (Implementierer der Hauptaufgabe, Datei-Ownership für README und arc42-Abschnitte) enthält und der Review sie prüft, dann entfällt die Lead-Doku-Runde nach dem Final-Review.
- Messgrösse: Final-Review-Befunde „Doku fehlt" je Meilenstein ≤ 0 über die nächsten 2 Meilensteine (Ausgangswert M8: 1 zweite Doku-Runde, M10: D1 ZURÜCK).
- Aufwand: klein; Plan-Vorlage und Briefing-Vorlage um eine Zeile ergänzen. Rückfall: Vorlage auf bisherigen Stand.
- Einsparung: je Meilenstein 1 Fix-Runde (rund 10 min, 1 Nachprüfung) und Lead-Kontext.
- Empfehlung: annehmen.

### V2 · Fix-Runde nur mit Nachprüfung koppeln, DOM-Nachweis statt Funktionstest (B3)

- Hypothese: Wenn E-015 gestartet wird (Nachweiszeilen im Lead-Bericht) und zusätzlich jede Fix-Runde nach Review-BEDENKEN den Reviewer erneut zur Nachprüfung beauftragt (als SendMessage, kein neuer Start), dann gibt es 0 Final-Review-ZURÜCK wegen Regressionen aus Fixes.
- Messgrösse: Pakete mit Fix-Runde ohne Nachprüfung = 0 über 8 Pakete (E-015-Schwelle, Ausgangswert M10: 1 Paket, Ausgangswert 08e7b5f1: 2 von 4).
- Aufwand: sehr klein, E-015 ist beschrieben, nur der Start fehlt (Start `–`, R180 begrenzt auf 3 laufende Experimente). Rückfall: E-015 zurücknehmen.
- Empfehlung: annehmen, E-015 starten statt neue Regel; der Plan-Hinweis „Test prüft DOM statt nur Funktion" gehört in das Reviewer-Briefing.

### V3 · Parallelität aus der Dateimatrix, nicht als Zusage (B1, B6)

- Hypothese: Wenn der Plan-Gate (lead-qa/L0) vor jeder „Parallelität N"-Zusage eine Dateimatrix je Task prüft (gleiche Datei in zwei Tasks = seriell, im Plan so benannt) und Bestandstests der geänderten Module im Task-Text nennt, dann stimmt die ausgewiesene Parallelität mit der gemessenen überein.
- Messgrösse: Differenz geplante minus gemessene Parallelität je Welle = 0 in den nächsten 2 Wellen (Ausgangswert M10-UI: 2 geplant, 1 gemessen; Stufe 1: Forest-Branch ebenso).
- Aufwand: klein, eine Prüfzeile im Gate-Plan-Briefing. Rückfall: Zeile streichen.
- Einsparung: keine Laufzeit, aber verlässliche Planung und kein nachträgliches Ruling (R184).
- Empfehlung: annehmen.
- Zur Cache-Write-Ampel (rot, 25,8 %): kein eigener Vorschlag. Ursache sind Pausen über 5 min in langen Controller-Sitzungen. Der 1-h-Cache wäre der Hebel, ist aber Konfiguration ausserhalb des Prozesses und bereits in R167–R169 behandelt; eine neue Regel würde ohne Messung nur raten.

### V4 · QA-U1/U2 vor dem letzten UI-Task nur für Sichtprüfungen verschieben (B2)

- Hypothese: Wenn QA nicht nach jedem Task, sondern einmal nach der Hälfte der UI-Strecke (nach T07, bevor T08/T09 Fixmuster wiederholen) eine kurze Stichprobe der neuen Bedienung macht, dann werden Muster-Fehler wie `role=img` vor ihrer Wiederholung entdeckt.
- Messgrösse: Final-Review-Befunde mit Ursprung in Tasks, die vor der Stichprobe lagen = 0 pro Meilenstein; Gegenprobe: lead-qa-Starts je UI-Meilenstein ≤ 8 (heute 7).
- Aufwand: mittel (1 Start, 10 min). Rückfall: QA wie bisher am Ende.
- Empfehlung: ablehnen/zurückstellen. Der Nutzen ist ungewiss, weil das konkrete Muster hier der Fix nach T09 war (nach der Stichprobe). V2 deckt die Ursache billiger ab.

### V5 · Parallelbetrieb M11-Design messen statt regeln (B5)

- Hypothese: Wenn der Mehraufwand für das Nachführen der parallelen Doku-Spec als Zeile im Lead-Bericht (Minuten und Befunde mit Ursprung im Parallelstrang) erfasst wird, kann nach 2 Meilensteinen entschieden werden, ob der Parallelbetrieb netto spart.
- Messgrösse: Nachführaufwand ≤ 20 % der Design-Dauer (Ausgangswert M10: nicht erfasst; 1 von 4 blockierenden Spec-Befunden mit Ursprung in M10).
- Aufwand: sehr klein, eine Berichtszeile. Rückfall: Zeile streichen.
- Empfehlung: annehmen, keine Regel vorab. Der Parallelbetrieb selbst bleibt erlaubt (nur Doku, reversibel).

## Bewertung laufender Experimente

- E-015: nicht gestartet (Start `–`), daher keine Wirkung messbar; der Ausgangswert verschlechtert sich nicht, M10 liefert einen weiteren Fall (R184) → bleibt „vorgeschlagen", Start empfohlen (V2).
- Weitere laufende Experimente (E-011 bis E-013): nicht Gegenstand dieser Retro.

## Änderungen an lernen.md

Keine (Kurationsrecht beim `studio-coach`).

## Risiken und Grenzen

- Nicht belegt: Wartezeiten in Minuten je Task, Nachführaufwand M11, Ursprung jedes Final-Review-Befunds ausser über das Ledger.
- Parallel schreibt `studio-coach` die Meilenstein-Retro M10 (andere Datei); Überschneidungen bei Vorschlägen sind möglich.
