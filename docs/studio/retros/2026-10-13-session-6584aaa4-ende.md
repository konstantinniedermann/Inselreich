# Retro Session 6584aaa4 — 2026-10-13

- Datum: 2026-10-13
- Art: session
- Auslöser: Session-Ende; Vorfälle `failed:6584aaa4-…:aede0c99dcdad09a5`, `…:ada8032a9c82efc85`, `…:a78bc69bac12da6b7` (drei Integrator-Läufe Push-Gate REL-20, schon in den Retros Testlock und Prozess-REL20 behandelt), `failed:14be4fda-…:a51d4fd41220fa644` (alt, qa-playtester)
- Datenbasis: `docs/studio/metriken/S-2026-10-13-6584aaa4.md`, `python3 tools/studio/metrics.py --efficiency` (und mit `--since 2026-10-13T00:00:00`), `docs/studio/rulings.md` R578–R614, Retros `2026-10-13-adhoc-testlock.md` und `2026-10-13-prozess-rel20.md` (nicht wiederholt), `.studio/events.jsonl` (nur `grep commit_rejected`)

## Befunde

### B1 · Ablauf: gute Abnahmequalität, vier Auflagen vom Lead erst im Gate sichtbar

- Beobachtung: 596 Agenten, 97 Delegationen, 590 min, 18 Ergebnisse, Erstabnahme 92 %, Nacharbeit 0, Schätzung gegen Ist −19,3 % (433 min gegen 349,5 min). Vier Fälle, in denen L0 eine Abweichung erst beim Gate fand: R602 (Controller erledigte T02/T04 selbst, ersetzte Task-Reviews durch ein gemeinsames Review), R611 (Rechenzeit-Auflage R607 (1) im ersten Anlauf verfehlt: 15–18 ms statt ≤ 1 ms), R613 (Ownership um `seaMapView.test.ts`, `islandTraits.test.ts` ohne Meldung erweitert; Zeit-Abnahme Basis gegen Branch fehlte), R607→R611 (dieselbe Auflage).
- Beleg: `docs/studio/rulings.md` R602, R611, R613 (je „Bericht lead-tech“).
- Deutung (Vermutung): Alle drei betreffen `lead-tech`-Berichte und Punkte, die im Briefing stehen, im Bericht aber nicht abgefragt werden. Muster über drei Pakete (TOOL-BUENDEL-11, UI-HAEPPCHEN-C, I092), kein Einzelfall. Wirkung belegt: R611 kostete 2 Nacharbeits-Starts.

### B2 · Cache-Write 5 min: nur ein kleiner Teil ist hebelbar

- Beobachtung: Cache-Write 5 min 27,5 % (rot); `lead-tech` trägt 5,07 M von 8,44 M Cache-Write-Tokens (60 %). Neuschreibungen ≥ 20k nach Pause > 5 min machen nur 6,6 % des Gesamt-Kostengewichts aus (31 Fälle), davon 82 % nach Turn-Ende; `lead-tech` 9 Fälle, 562k, Median-Pause 6,8 min, 77,8 % nach Turn-Ende; `production-integrator` 9 Fälle, 100 % nach Bash/Agent (Push-Gate-Läufe).
- Beleg: `metrics.py --efficiency --since 2026-10-13T00:00:00`, Abschnitt „Neuschreibungen nach Pause > 5 min“; Metrik-Datei Abschnitt Effizienz.
- Deutung: Rechnerisch (6,6 % gegen 27,5 %, gleiche Gewichtsbasis) liegen mindestens rund 21 Punkte des roten Werts ausserhalb grosser Pausen-Neuschreibungen (Kontextwachstum, kleinere Neuschreibungen). Dass das Wachstum den Rest erklärt, ist **Vermutung**; die Aufteilung fehlt im Werkzeug. Grösste Einzelinstanz: `plan-I-047` (lead-tech) mit 70 Turns und 1480k Kostengewicht, über der Turnkappe 60 von E-062 (ob Turns gleich gezählt werden, ist ungeprüft).

### B3 · Prettier-Abweisungen und Trailer: bekannt, klein

- Beobachtung: 8 `commit_rejected` (Prettier) in dieser Session, Dateien: Pläne, `docs/arc42.md` (zweimal), Tests; je ein erneuter Commit. Der Hook fängt sie alle, keiner erreichte main. Integrator-Trailer «Sonnet» (R587/R595) ist als Abweichung festgehalten, kein neuer Fall.
- Beleg: `.studio/events.jsonl` (`grep commit_rejected`, 2026-10-13); `docs/studio/lernen.md` (Prettier-Zeile) existiert bereits.
- Deutung: Das Verfahren wirkt (Hook), die Kosten liegen bei einem Tool-Aufruf je Fall; kein Vorschlag.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/S-2026-10-13-6584aaa4.md`, Abschnitt Effizienz.

| Kennzahl                           | Wert                   | Ampel | Befund / Ursache                                                                                                         | Hebel oder Messauftrag mit Frist                                                                                                                     |
| ---------------------------------- | ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil (bereinigt)       | 42,3 %                 | gelb  | Leads 37,4 %, L0 22,2 % (eine L0-Instanz für 590 min, 510 Delegationsereignisse); 17,4 % bereits herausgerechnet (E-049) | Messauftrag studio-coach, nächste Session-Retro: L0-Anteil je Stunde gegen Delegationen; V1 (Folgeinstanz) senkt Lead-Anteil                         |
| Umsetzeranteil                     | 13,4 %                 | gelb  | Session mit Design-/Doku-/Release-Paketen; Review/QA/Merge 17,2 % über Umsetzer; Produktivanteil 27,5 % grün (R488 V4)   | kein Befund laut R488 V4; –                                                                                                                          |
| Cache-Write 5 min                  | 27,5 %                 | rot   | B2; nach der fünften Retro in Folge (Retro 1a73e6c1) erneut rot, `lead-tech` 60 % der Menge                              | **V1** (Pflicht-Hebel lead-tech) und **V2** (Aufteilung im Werkzeug)                                                                                 |
| L0-Kontext Max                     | 418k                   | gelb  | Eine L0-Instanz über die ganze Session, Start 62k, Mittel 243k; besser als der Höchstwert 774k der Historie              | Messauftrag L0/studio-coach bis nächste Session-Retro: Übergabe über `state.md` bei 400k prüfen, Wert gegen 250k lesen                               |
| Tests rot, später grün (Flake)     | 8                      | rot   | gleiche Liste wie in Prozess-REL20 B5; Terrain-/Save-/UI-Tests unter Grundlast (Testlock-Retro), Studio-Test `<tmp>/x`   | Hebel R595 (Isolation T02, TOOL-BUENDEL-11) und R593 (`zeitreserve-gate`); Messauftrag studio-coach: Liste ab Merge-Datum neu, nächste Session-Retro |
| opus-Anteil, Lead-Kontext, Dateien | 58,7 % / 65k / 28,7 KB | grün  | –                                                                                                                        | –                                                                                                                                                    |

## Befragung der Leads

- Nicht befragt (Kurz-Retro, Budget keins); Rulings R602, R611, R613 als Ersatz gelesen.

## Vorschläge

Alle drei Plätze (E-062, E-063, E-064) sind belegt; die Vorschläge warten auf einen freien Platz (wie E-065).

- **V1 · Folgeinstanz statt Fortsetzung bei lead-tech** (Experiment, Pflicht-Hebel). Hypothese: Ein `lead-tech`, der nach Turn-Ende länger als 5 min wartet (Gate, Ruling) und über 100k Kontext liegt, wird nicht per SendMessage fortgesetzt, sondern als Folgeinstanz mit Übergabe gestartet (Start-Kontext 32k statt Neuschreibung des vollen Kontexts). Messgrösse: Neuschreibungen ≥ 20k von lead-tech ≤ 5 je Session (Ausgang 9) und deren Kostengewicht ≤ 400k (Ausgang 562k), 3 Sessions; Gegenprobe Rückfragen wegen fehlender Übergabe ≤ 1 je Session. Rückfall: Regel streichen, Fortsetzung wie bisher. Dateien: `.claude/agents/lead-tech.md` (Minor), Handbuch. Kosten: eine Persona-Zeile; Nutzen: höchstens etwa 2–3 Punkte Cache-Write (Deutung); Risiko: Übergabeverlust, Mehrstart. Verschlechtert die Messbarkeit nicht (`metrics.py` weist die Tabelle aus).
- **V2 · Messauftrag, kein Experiment: Cache-Write aufteilen** in „Neuschreibung nach Pause“ und „übriges Wachstum“ als eigene Ampel-Info-Zeile in `metrics.py` (Paket TOOL-BUENDEL, Rückfall: Zeile entfernen). Frist: bis zur nächsten Session-Retro; ohne sie bleibt B2 Vermutung. Kosten: ein Tool-Task; Nutzen: macht den roten Wert hebelbar oder als strukturell belegbar; Risiko: keines (rein lesend). Die Schwellen bleiben unverändert.
- **V3 · Berichtsvorlage lead-tech um drei Pflichtfragen ergänzen** (Experiment). Hypothese: Abfrage „Controller-Selbstarbeit ja/nein“, „Ownership erweitert ja/nein, wann gemeldet“, „Auflage aus Gate Plan/Spec: Messwert Soll gegen Ist“ im Bericht senkt die erst im Gate gefundenen Abweichungen. Messgrösse: Gates Merge mit Abweichung, die L0 erst im Gate findet, ≤ 1 in 4 Gates (Ausgang 3 in 4 Gates dieser Session, R602/R611/R613); Zeitraum 2 Sessions. Rückfall: Zeilen streichen. Dateien: `docs/studio/templates/bericht.md` oder `briefing.md` (nur nach Ruling). Kosten: drei Berichtszeilen; Risiko: Formularmüdigkeit.

Kein Vorschlag zu Prettier (B3) und Trailer.

## Bewertung laufender Experimente

- E-062 (Turnkappe 60): Datenpunkt `plan-I-047` 70 Turns, 1480k, über der Kappe; Zählweise prüfen, bevor bewertet wird → weiter beobachten.
- E-063 (Integrator nur im Worktree `integrate`): keine Gegenanzeige in den Metriken dieser Session; eigene Auswertung nicht erhoben → weiter beobachten.
- E-064: läuft seit R614; keine Stash-Vorfälle in diesem Retro-Material → weiter beobachten.

## Änderungen an lernen.md

keine
